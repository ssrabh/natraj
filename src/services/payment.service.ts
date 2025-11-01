import Razorpay from "razorpay";
import * as crypto from "crypto";
import { eq } from "drizzle-orm";

// ⚠️ IMPORTANT: Update the import path for your model and Drizzle instance
import { PaymentInput, paymentTable } from "../models/payment.schema";
// import { db } from "../db/db-instance"; // <--- Replace with your actual Drizzle DB instance import

// --- Razorpay Initialization ---
// The API keys are loaded from environment variables (process.env)
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Mock Drizzle DB instance for demonstration.
// In a real app, replace this with your actual Drizzle setup.
const db = {
    insert: (table: any) => ({
        values: (data: any) => ({
            returning: () => [data],
        }),
    }),
    update: (table: any) => ({
        set: (data: any) => ({
            where: (condition: any) => ({
                returning: () => [data],
            }),
        }),
    }),
};

/**
 * Creates a new Razorpay order and saves the initial pending payment record to the database.
 */
export const createRazorpayOrder = async (
    paymentData: Pick<PaymentInput, "email" | "amount" | "phoneNumber" | "notes">
) => {
    // Razorpay amount is in the smallest unit (paise for INR). Convert amount (in Rupees) to Paise.
    const amountInPaise = Math.round(paymentData.amount * 100);

    const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}`, // Unique receipt ID
        notes: {
            email: paymentData.email,
            ...(paymentData.notes && { notes: paymentData.notes }),
            ...(paymentData.phoneNumber && { phoneNumber: paymentData.phoneNumber }),
        },
    };

    try {
        // 1. Create order via Razorpay API
        const order = await razorpayInstance.orders.create(options);

        // 2. Save initial payment record to Drizzle DB with 'created' status
        // Note: Drizzle numeric type handles string input for amount column
        const [newPayment] = await (db as any)
            .insert(paymentTable)
            .values({
                email: paymentData.email,
                phoneNumber: paymentData.phoneNumber,
                amount: String(paymentData.amount),
                orderId: order.id,
                status: "created", // Status in DB is 'created' upon successful order creation
                notes: paymentData.notes,
            })
            .returning();

        return order;
    } catch (error) {
        console.error("Error creating Razorpay order or saving to DB:", error);
        throw new Error("Failed to create payment order.");
    }
};

/**
 * Validates the Razorpay webhook signature and updates the payment status to 'success'.
 * @param signature - The 'x-razorpay-signature' header.
 * @param rawBody - The raw request body (Buffer).
 */
export const handleRazorpayWebhook = async (
    signature: string,
    rawBody: Buffer
) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not set.");
        return null;
    }

    try {
        // 1. Verify the webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody.toString('utf-8'))
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error("Webhook signature mismatch. Invalid request.");
            return null; // Return null on failure
        }

        // 2. Parse the body after successful validation
        const event = JSON.parse(rawBody.toString('utf-8'));

        // 3. Process the event (only interested in 'payment.captured' for success)
        if (event.event === "payment.captured" && event.payload.payment.entity) {
            const paymentEntity = event.payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            // 4. Update payment status in Drizzle DB
            const [updatedPayment] = await (db as any)
                .update(paymentTable)
                .set({
                    status: "success",
                    paymentId: paymentId,
                    updatedAt: new Date(),
                })
                // Assuming `eq` is imported from 'drizzle-orm'
                .where(eq(paymentTable.orderId, orderId))
                .returning();

            return updatedPayment;
        }

        // Handle other relevant events here (e.g., 'payment.failed')

        return null;
    } catch (error) {
        console.error("Error handling Razorpay webhook:", error);
        return null;
    }
};