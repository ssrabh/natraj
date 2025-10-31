import nodemailer from "nodemailer";
import { ContactInput } from "../models/contact.schema";

export const sendEmail = async (subject: string, data: ContactInput) => {
  try {
    // ✅ Create transporter with flexible TLS/SSL support
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true for SSL (465), false for STARTTLS (587)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // ✅ for cPanel/self-signed certs
        minVersion: "TLSv1.2",     // ✅ enforce modern security
      },
    });

    // ✅ Plain text version (for clients that don’t render HTML)
    const plainText = `
New Contact Query Received
----------------------------
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phoneCountry} ${data.phoneNumber}
Designation: ${data.designation}
Company: ${data.companyName}
Query Type: ${data.queryType}
Message:
${data.message}
----------------------------
    `;

    // ✅ HTML version (nice formatting)
    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f7f8fa; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #6b46c1; text-align: center;">📩 New Contact Form Submission</h2>
        <p style="font-size: 16px; color: #333;">You’ve received a new inquiry from the D2CX Foundations contact form.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 8px; font-weight: bold;">Full Name:</td><td>${data.firstName} ${data.lastName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td>${data.email}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td>${data.phoneCountry} ${data.phoneNumber}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Designation:</td><td>${data.designation}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Company:</td><td>${data.companyName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Query Type:</td><td>${data.queryType}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Message:</td><td>${data.message}</td></tr>
        </table>
        <hr style="margin-top: 20px; border: none; border-top: 1px solid #eee;">
        <p style="text-align: center; font-size: 13px; color: #888;">
          © ${new Date().getFullYear()} D2CX Foundations. All rights reserved.
        </p>
      </div>
    </div>
    `;

    // ✅ Send the email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // admin email
      subject,
      text: plainText,
      html,
    });

    console.log(`📧 Email sent successfully: ${info.messageId}`);
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error("Email sending failed");
  }
};
