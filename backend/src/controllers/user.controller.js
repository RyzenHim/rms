const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Customer = require("../models/customer.model");
const Employee = require("../models/employee.model");
const { sendMailSafely } = require("../utils/mailer");

const staffRoles = ["super_admin", "admin", "manager", "kitchen", "cashier", "waiter"];
const addressLabels = ["home", "office", "other"];

const toAddressView = (address) => ({
    id: address._id,
    label: address.label,
    customLabel: address.customLabel || "",
    fullName: address.fullName,
    phone: address.phone,
    street: address.street,
    area: address.area || "",
    landmark: address.landmark || "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country || "India",
    location: address.location || null,
    isDefault: Boolean(address.isDefault),
});

const resolvePhone = async (user) => {
    if (user.roles?.some((role) => staffRoles.includes(role))) {
        const employee = await Employee.findOne({ user: user._id }).select("phone");
        return employee?.phone || "";
    }

    const customer = await Customer.findOne({ user: user._id }).select("phone");
    return customer?.phone || "";
};

const sanitizeUser = async (user) => {
    const base = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: await resolvePhone(user),
        roles: user.roles,
        theme: user.theme,
        profileImage: user.profileImage || "",
        isActive: user.isActive,
    };

    if (user.roles?.includes("customer")) {
        const customer = await Customer.findOne({ user: user._id }).select("addresses");
        return {
            ...base,
            addresses: (customer?.addresses || []).map(toAddressView),
        };
    }

    return base;
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role, phone, department } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        const requestedRole = String(role || "customer").trim().toLowerCase();
        const isAdminSignup = requestedRole === "admin";
        const adminSignupSecret =
            req.headers["x-admin-signup-secret"] || req.body.adminSignupSecret;

        if (!["customer", "admin"].includes(requestedRole)) {
            return res.status(403).json({
                message: "Only customer or admin signup is allowed on this endpoint.",
            });
        }

        if (isAdminSignup) {
            if (!process.env.SUPER_ADMIN_SIGNUP_SECRET) {
                return res.status(500).json({
                    message: "Admin signup is not configured on server.",
                });
            }

            if (adminSignupSecret !== process.env.SUPER_ADMIN_SIGNUP_SECRET) {
                return res.status(403).json({
                    message: "Invalid admin signup secret.",
                });
            }
        }

        const normalizedEmail = email.toLowerCase().trim();
        const isExisting = await User.findOne({ email: normalizedEmail });

        if (isExisting) {
            return res.status(400).json({ message: "User already exists" });
        }

        const createdUser = await User.create({
            name,
            email: normalizedEmail,
            password,
            roles: [requestedRole],
        });

        if (isAdminSignup) {
            await Employee.create({
                user: createdUser._id,
                roles: "admin",
                department: String(department || "").trim(),
                phone: String(phone || "").trim(),
                isActive: true,
            });
        } else {
            await Customer.create({ user: createdUser._id });
        }

        await sendMailSafely({
            to: createdUser.email,
            subject: "Welcome to Feane",
            text: `Hi ${createdUser.name}, your ${requestedRole} account has been created successfully.`,
            html: `<p>Hi <b>${createdUser.name}</b>,</p><p>Your ${requestedRole} account has been created successfully.</p>`,
        });

        return res.status(201).json({
            message: "User created successfully",
            user: await sanitizeUser(createdUser),
        });
    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({
            email: normalizedEmail,
            isDeleted: false,
        }).select("+password");

        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "User account is inactive" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        user.lastLogin = new Date();
        await user.save();

        await sendMailSafely({
            to: user.email,
            subject: "Login Alert - Feane",
            text: `Hi ${user.name}, your account was logged in at ${new Date().toLocaleString()}.`,
            html: `<p>Hi <b>${user.name}</b>,</p><p>Your account was logged in at ${new Date().toLocaleString()}.</p>`,
        });

        const token = jwt.sign(
            {
                id: user._id,
                roles: user.roles,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: await sanitizeUser(user),
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.me = async (req, res) => {
    try {
        return res.status(200).json({
            user: await sanitizeUser(req.user),
        });
    } catch (err) {
        console.error("ME ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, profileImage, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const hasNameUpdate = name !== undefined;
        const hasImageUpdate = profileImage !== undefined;
        const hasPasswordUpdate = Boolean(newPassword);

        if (!hasNameUpdate && !hasImageUpdate && !hasPasswordUpdate) {
            return res.status(400).json({ message: "No profile changes provided" });
        }

        if (hasNameUpdate) {
            const nextName = String(name || "").trim();
            if (nextName.length < 2) {
                return res.status(400).json({ message: "Name must be at least 2 characters" });
            }
            user.name = nextName;
        }

        if (hasImageUpdate) {
            const nextImage = String(profileImage || "").trim();
            if (nextImage && !/^https?:\/\/\S+$/i.test(nextImage)) {
                return res.status(400).json({ message: "Profile image must be a valid URL" });
            }
            user.profileImage = nextImage;
        }

        if (hasPasswordUpdate) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to set new password" });
            }
            if (String(newPassword).length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters" });
            }

            const matches = await bcrypt.compare(currentPassword, user.password);
            if (!matches) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            user.password = newPassword;
        }

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: await sanitizeUser(user),
        });
    } catch (err) {
        console.error("UPDATE PROFILE ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const normalizeAddressInput = (payload = {}, { partial = false } = {}) => {
    const normalized = {};
    const requiredFields = ["fullName", "phone", "street", "city", "state", "pincode"];
    const allFields = [
        "label",
        "customLabel",
        "fullName",
        "phone",
        "street",
        "area",
        "landmark",
        "city",
        "state",
        "pincode",
        "country",
        "location",
        "isDefault",
    ];

    for (const key of allFields) {
        if (payload[key] !== undefined) normalized[key] = payload[key];
    }

    if (!partial) {
        for (const field of requiredFields) {
            if (!String(normalized[field] || "").trim()) {
                return { error: `${field} is required` };
            }
        }
    }

    if (normalized.label !== undefined) {
        const label = String(normalized.label || "").toLowerCase().trim();
        if (!addressLabels.includes(label)) {
            return { error: "label must be one of home, office, other" };
        }
        normalized.label = label;
    }

    for (const field of ["customLabel", "fullName", "phone", "street", "area", "landmark", "city", "state", "pincode", "country"]) {
        if (normalized[field] !== undefined) normalized[field] = String(normalized[field] || "").trim();
    }

    if (normalized.isDefault !== undefined) {
        normalized.isDefault = Boolean(normalized.isDefault);
    }

    return { normalized };
};

const getOrCreateCustomerProfile = async (userId) => {
    let customer = await Customer.findOne({ user: userId });
    if (!customer) customer = await Customer.create({ user: userId, addresses: [] });
    return customer;
};

exports.getAddresses = async (req, res) => {
    try {
        if (!req.user.roles?.includes("customer")) {
            return res.status(403).json({ message: "Only customers have address book" });
        }

        const customer = await getOrCreateCustomerProfile(req.user._id);
        const addresses = (customer.addresses || [])
            .map(toAddressView)
            .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

        return res.status(200).json({ addresses });
    } catch (err) {
        console.error("GET ADDRESSES ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.addAddress = async (req, res) => {
    try {
        if (!req.user.roles?.includes("customer")) {
            return res.status(403).json({ message: "Only customers can add addresses" });
        }

        const { normalized, error } = normalizeAddressInput(req.body, { partial: false });
        if (error) return res.status(400).json({ message: error });

        const customer = await getOrCreateCustomerProfile(req.user._id);
        const addresses = customer.addresses || [];

        const shouldBeDefault = normalized.isDefault || addresses.length === 0;
        if (shouldBeDefault) {
            addresses.forEach((address) => {
                address.isDefault = false;
            });
        }

        addresses.push({
            label: normalized.label || "home",
            customLabel: normalized.customLabel || "",
            fullName: normalized.fullName,
            phone: normalized.phone,
            street: normalized.street,
            area: normalized.area || "",
            landmark: normalized.landmark || "",
            city: normalized.city,
            state: normalized.state,
            pincode: normalized.pincode,
            country: normalized.country || "India",
            location: normalized.location,
            isDefault: shouldBeDefault,
        });

        if (!customer.phone) customer.phone = normalized.phone;
        await customer.save();

        return res.status(201).json({
            message: "Address added",
            addresses: customer.addresses.map(toAddressView).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
        });
    } catch (err) {
        console.error("ADD ADDRESS ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        if (!req.user.roles?.includes("customer")) {
            return res.status(403).json({ message: "Only customers can update addresses" });
        }

        const { id } = req.params;
        const { normalized, error } = normalizeAddressInput(req.body, { partial: true });
        if (error) return res.status(400).json({ message: error });

        const customer = await getOrCreateCustomerProfile(req.user._id);
        const address = customer.addresses.id(id);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        if (normalized.isDefault) {
            customer.addresses.forEach((entry) => {
                entry.isDefault = false;
            });
        }

        Object.assign(address, normalized);

        const hasDefault = customer.addresses.some((entry) => entry.isDefault);
        if (!hasDefault && customer.addresses.length > 0) {
            customer.addresses[0].isDefault = true;
        }

        await customer.save();

        return res.status(200).json({
            message: "Address updated",
            addresses: customer.addresses.map(toAddressView).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
        });
    } catch (err) {
        console.error("UPDATE ADDRESS ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        if (!req.user.roles?.includes("customer")) {
            return res.status(403).json({ message: "Only customers can delete addresses" });
        }

        const { id } = req.params;
        const customer = await getOrCreateCustomerProfile(req.user._id);
        const address = customer.addresses.id(id);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        const wasDefault = Boolean(address.isDefault);
        customer.addresses.pull({ _id: id });
        if (wasDefault && customer.addresses.length > 0) {
            customer.addresses[0].isDefault = true;
        }

        await customer.save();
        return res.status(200).json({
            message: "Address deleted",
            addresses: customer.addresses.map(toAddressView).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
        });
    } catch (err) {
        console.error("DELETE ADDRESS ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.setDefaultAddress = async (req, res) => {
    try {
        if (!req.user.roles?.includes("customer")) {
            return res.status(403).json({ message: "Only customers can set default address" });
        }

        const { id } = req.params;
        const customer = await getOrCreateCustomerProfile(req.user._id);
        const address = customer.addresses.id(id);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        customer.addresses.forEach((entry) => {
            entry.isDefault = String(entry._id) === String(id);
        });
        await customer.save();

        return res.status(200).json({
            message: "Default address updated",
            addresses: customer.addresses.map(toAddressView).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
        });
    } catch (err) {
        console.error("SET DEFAULT ADDRESS ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail, isDeleted: false });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = require("crypto").randomBytes(32).toString("hex");
        const hashedToken = require("crypto").createHash("sha256").update(resetToken).digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/reset-password?token=${resetToken}`;

        await sendMailSafely({
            to: user.email,
            subject: "Password Reset Request - Feane Restaurant",
            text: `You requested a password reset. Click the link below to reset your password. This link expires in 30 minutes.\n\n${resetUrl}`,
            html: `
                <p>You requested a password reset.</p>
                <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
                <a href="${resetUrl}" style="display: inline-block; background-color: #ff8c3a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
            `,
        });

        return res.status(200).json({
            message: "Password reset link sent to your email. Please check your inbox.",
        });
    } catch (err) {
        console.error("FORGOT PASSWORD ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ message: "Token, password and confirm password are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const hashedToken = require("crypto").createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
            isDeleted: false,
        }).select("+password +passwordResetToken +passwordResetExpires");

        if (!user) {
            return res.status(400).json({ message: "Password reset token is invalid or expired" });
        }

        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        await sendMailSafely({
            to: user.email,
            subject: "Password Changed - Feane Restaurant",
            text: "Your password has been changed successfully. If you didn't request this change, please contact support immediately.",
            html: `
                <p>Your password has been changed successfully.</p>
                <p>If you didn't request this change, please contact support immediately.</p>
            `,
        });

        return res.status(200).json({
            message: "Password reset successfully. You can now login with your new password.",
        });
    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
