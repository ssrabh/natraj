import nodemailer from "nodemailer";

const testSMTP = async () => {
    try {
        const transporter = nodemailer.createTransport({
            host: "mail.carscareindia.com",
            port: 465, // try 587 if this fails
            secure: true, // true for 465, false for 587
            auth: {
                user: "hello@carscareindia.com",
                pass: "Intech!23",
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const info = await transporter.sendMail({
            from: '"SMTP Test" <hello@carscareindia.com>',
            to: "hello@carscareindia.com",
            subject: "Test Email from Nodemailer",
            text: "If you received this, SMTP credentials are working ✅",
        });

        console.log("✅ Email sent successfully:", info.messageId);
    } catch (error) {
        console.error("❌ SMTP connection failed:", error.message);
    }
};

testSMTP();
