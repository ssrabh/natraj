import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../config/db";
import { paymentTable } from "../models/payment.schema";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ✅ Create Razorpay Order
export const createRazorpayOrder = async (amount: number, currency = "INR") => {
    const options = {
        amount: Math.round(amount * 100),
        currency,
        receipt: `rcpt_${Date.now()}`,
    };
    return await razorpay.orders.create(options);
};

// ✅ Verify Razorpay Signature (use raw body)
export const verifyRazorpaySignature = (rawBody: string, signature: string): boolean => {
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(rawBody)
        .digest("hex");
    return expectedSignature === signature;
};

// ✅ Save Payment Record
export const savePaymentRecord = async (data: {
    email: string;
    phoneNumber?: string;
    orderId: string;
    paymentId?: string;
    status?: string;
    amount: number;
    currency?: string;
    notes?: string;
}) => {
    try {
        await db.insert(paymentTable).values({
            email: data.email,
            phoneNumber: data.phoneNumber ?? "",
            gateway: "Razorpay",
            orderId: data.orderId,
            paymentId: data.paymentId ?? null,
            status: data.status ?? "pending",
            amount: (data.amount / 100).toString(),
            currency: data.currency ?? "INR",
            notes: data.notes ?? "",
        });
        console.log("✅ Payment record stored in DB");
    } catch (err) {
        console.error("❌ Error saving payment record:", err);
    }
};

