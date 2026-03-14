
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        roles: {
            type: String,
            enum: ["admin", "manager", "kitchen", "cashier", "waiter"],
            required: true,
        },
        employeeCode: {
            type: String,
            default: "",
            trim: true,
        },
        department: {
            type: String,
            default: "",
            trim: true,
        },
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        emergencyContactName: {
            type: String,
            default: "",
            trim: true,
        },
        emergencyContactPhone: {
            type: String,
            default: "",
            trim: true,
        },
        address: {
            type: String,
            default: "",
            trim: true,
        },
        experienceYears: {
            type: Number,
            min: 0,
            default: 0,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other", ""],
            default: "",
        },
        bloodGroup: {
            type: String,
            default: "",
            trim: true,
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
        idProofType: {
            type: String,
            default: "",
            trim: true,
        },
        idProofNumber: {
            type: String,
            default: "",
            trim: true,
        },

        salary: {
            type: Number,
            min: 0,
        },

        joiningDate: {
            type: Date,
            default: Date.now,
        },

        shift: {
            type: String,
            enum: ["morning", "evening", "night"],
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch", 
        },

        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Employee", employeeSchema);
