const mongoose = require('mongoose')
const dbLink = process.env.MONGO_URI


const connectDB = async () => {

    try {
        await mongoose.connect(dbLink)
        console.log("MongoDB Connected ✅");

    } catch (error) {

        console.error("DB Connection Error", error.message)
        process.exit(1)

    }
}

module.exports = connectDB