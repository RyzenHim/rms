const nodemailer = require("nodemailer");

let cachedTransporter = null;

const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM;

    if (!host || !user || !pass || !from) return null;

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
};

const getTransporter = () => {
    if (cachedTransporter) return cachedTransporter;
    cachedTransporter = createTransporter();
    return cachedTransporter;
};

exports.sendMailSafely = async ({ to, subject, html, text }) => {
    try {
        const transporter = getTransporter();
        const from = process.env.MAIL_FROM;

        if (!transporter || !from) {
            console.warn("MAILER SKIPPED: SMTP not configured");
            return { skipped: true };
        }

        await transporter.sendMail({ from, to, subject, html, text });
        return { sent: true };
    } catch (error) {
        console.error("MAILER ERROR:", error.message);
        return { sent: false, error: error.message };
    }
};
