require('dotenv').config()
const express = require('express')
const port = process.env.PORT
const app = express()
const connectDB = require('./src/config/db')

app.use(express.json());


connectDB()


const userRouter = require('./src/routes/user.route');
app.use('/user', userRouter);



app.listen(port, () => console.log("server started on port " + port))