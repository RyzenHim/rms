const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const dbLink = process.env.MONGO_URI;
        if (!dbLink) {
            throw new Error("MONGO_URI is missing in environment variables");
        }

        await mongoose.connect(dbLink);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("DB Connection Error", error.message);
        throw error;
    }
};

module.exports = connectDB;
