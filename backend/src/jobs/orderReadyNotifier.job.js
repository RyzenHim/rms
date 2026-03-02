const cron = require("node-cron");
const Order = require("../models/order.model");
const { sendMailSafely } = require("../utils/mailer");

let started = false;

const notifyReadyOrders = async () => {
    try {
        const orders = await Order.find({
            status: "done_preparing",
            customerEmail: { $ne: "" },
            "readyNotification.sent": false,
        })
            .sort({ updatedAt: 1 })
            .limit(50);

        for (const order of orders) {
            const result = await sendMailSafely({
                to: order.customerEmail,
                subject: `Order Ready: ${order.orderNumber}`,
                text: `Hi ${order.customerName || "Customer"}, your order ${order.orderNumber} is ready to serve.`,
                html: `<p>Hi <b>${order.customerName || "Customer"}</b>,</p><p>Your order <b>${order.orderNumber}</b> is ready to serve.</p>`,
            });

            if (result.sent || result.skipped) {
                order.readyNotification = { sent: true, sentAt: new Date() };
                await order.save();
            }
        }
    } catch (error) {
        console.error("ORDER READY NOTIFIER JOB ERROR:", error);
    }
};

exports.startOrderReadyNotifierJob = () => {
    if (started) return;
    started = true;

    cron.schedule("*/1 * * * *", () => {
        notifyReadyOrders();
    });
};
