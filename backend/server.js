require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const port = process.env.PORT
const app = express()
const dbLink = process.env.MONGO_URI
const connectDB = require('./src/config/db')


// console.log("DB LINK:", dbLink);
// mongoose.connect(dbLink)
//     .then(() => console.log("DB Connected"))
//     .catch((error) => { console.log(error); })


connectDB()


app.listen(port, () => console.log("server started on port " + port))