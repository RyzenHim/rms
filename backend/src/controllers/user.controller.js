const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Customer = require("../models/customer.model");
const Employee = require("../models/employee.model");

const allowedRoles = ["admin", "manager", "kitchen", "cashier", "waiter", "customer"];

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    theme: user.theme,
    isActive: user.isActive,
});

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const isExisting = await User.findOne({ email: normalizedEmail });

        if (isExisting) {
            return res.status(400).json({ message: "User already exists" });
        }

        let rolesArray = ["customer"];
        if (role) {
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({ message: "Invalid role selected" });
            }
            rolesArray = [role];
        }

        const createdUser = await User.create({
            name,
            email: normalizedEmail,
            password,
            roles: rolesArray,
        });

        if (role && role !== "customer") {
            await Employee.create({ user: createdUser._id, roles: role });
        } else {
            await Customer.create({ user: createdUser._id });
        }

        return res.status(201).json({
            message: "User created successfully",
            user: sanitizeUser(createdUser),
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
            user: sanitizeUser(user),
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.me = async (req, res) => {
    try {
        return res.status(200).json({
            user: sanitizeUser(req.user),
        });
    } catch (err) {
        console.error("ME ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
