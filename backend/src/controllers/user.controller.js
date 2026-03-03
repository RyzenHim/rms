const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Customer = require("../models/customer.model");
const Employee = require("../models/employee.model");
const { sendMailSafely } = require("../utils/mailer");

const staffRoles = ["admin", "manager", "kitchen", "cashier", "waiter"];

const resolvePhone = async (user) => {
    if (user.roles?.some((role) => staffRoles.includes(role))) {
        const employee = await Employee.findOne({
            user: user._id,
            restaurant: user.restaurant,
        }).select("phone");
        return employee?.phone || "";
    }

    const customer = await Customer.findOne({
        user: user._id,
        restaurant: user.restaurant,
    }).select("phone");
    return customer?.phone || "";
};

const sanitizeUser = async (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: await resolvePhone(user),
    roles: user.roles,
    restaurantId: user.restaurant || null,
    theme: user.theme,
    profileImage: user.profileImage || "",
    isActive: user.isActive,
});

exports.signup = async (req, res) => {
    try {
        if (!req.restaurant?._id) {
            return res.status(400).json({ message: "Restaurant context is required" });
        }

        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        if (role && role !== "customer") {
            return res.status(403).json({
                message: "Only customer signup is allowed. Staff accounts are created by admin.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const isExisting = await User.findOne({
            email: normalizedEmail,
            restaurant: req.restaurant._id,
        });

        if (isExisting) {
            return res.status(400).json({ message: "User already exists" });
        }

        const createdUser = await User.create({
            name,
            email: normalizedEmail,
            password,
            roles: ["customer"],
            restaurant: req.restaurant._id,
        });

        await Customer.create({
            user: createdUser._id,
            restaurant: req.restaurant._id,
        });

        await sendMailSafely({
            to: createdUser.email,
            subject: "Welcome to Feane",
            text: `Hi ${createdUser.name}, your customer account has been created successfully.`,
            html: `<p>Hi <b>${createdUser.name}</b>,</p><p>Your customer account has been created successfully.</p>`,
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
        if (!req.restaurant?._id) {
            return res.status(400).json({ message: "Restaurant context is required" });
        }

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
            restaurant: req.restaurant._id,
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
                restaurant: user.restaurant,
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
