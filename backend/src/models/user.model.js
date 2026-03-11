const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            // minlength: 6,
            select: false,
        },

        roles: {
            type: [String],
            enum: [
                // "super_admin",
                "admin",
                "manager",
                "kitchen",
                "cashier",
                "waiter",
                "customer",
            ],
            default: ["customer"],
        },
        theme: {
            type: String,
            enum: ["light", "dark"],
            default: "light",
        },
        profileImage: {
            type: String,
            default: "",
            trim: true,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
        passwordResetToken: {
            type: String,
            default: null,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            default: null,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);


userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema)
