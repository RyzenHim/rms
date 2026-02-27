// models/employee.model.js

const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // one-to-one relationship
        },

        employeeId: {
            type: String,
            required: true,
            unique: true,
        },

        designation: {
            type: String,
            enum: ["admin", "manager", "kitchen", "cashier", "waiter"],
            required: true,
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
            ref: "Branch", // optional if multi-branch system
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Employee", employeeSchema);