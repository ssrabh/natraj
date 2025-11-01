import { db } from "../config/db";
import { contactTable, ContactInput } from "../models/contact.schema";
import { sendEmail } from "../utils/email";

export const createContact = async (data: ContactInput) => {
  const insertData = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phoneCountry: data.phoneCountry,
    phoneNumber: data.phoneNumber,
    designation: data.designation,
    companyName: data.companyName,
    queryType: data.queryType,
    message: data.message,
  };

  try {
    // ✅ Step 1: Always insert into DB first
    await db.insert(contactTable).values(insertData);
    console.log("✅ Contact saved in DB");

    // ✅ Step 2: Try to send email (but don’t break on failure)
    // Note: Email sending is currently disabled
    // try {
    //   await sendEmail(`New Contact Query from ${data.firstName}`, data);
    //   console.log("📧 Email sent successfully");
    // } catch (emailErr: any) {
    //   console.error("⚠️ Email sending failed (but continuing):", emailErr.message);
    // }

    // ✅ Step 3: Always return success to the frontend
    return {
      message: "Your request has been submitted successfully. We’ll notify you soon via email or WhatsApp.",
    };

  } catch (err: any) {
    console.error("❌ DB Insert Error:", err);
    throw new Error("Failed to submit your request. Please try again later.");
  }
};
