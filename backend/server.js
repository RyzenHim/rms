const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const { startOrderReadyNotifierJob } = require("./src/jobs/orderReadyNotifier.job");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json({ limit: "20mb" }));
app.use("/assets", express.static(path.join(__dirname, "src/assets")));
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

const authRouter = require("./src/routes/user.route");
const themeRouter = require("./src/routes/theme.route");
const menuRouter = require("./src/routes/menu.route");
const employeeRouter = require("./src/routes/employee.route");
const orderRouter = require("./src/routes/order.route");

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/theme", themeRouter);
app.use("/api/menu", menuRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/orders", orderRouter);

const startServer = async () => {
    await connectDB();
    startOrderReadyNotifierJob();
    app.listen(port, () => console.log("server started on port " + port));
};

startServer().catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
});
