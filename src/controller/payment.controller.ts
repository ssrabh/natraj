import { Request, Response } from "express";
import { z } from "zod";
import { createRazorpayOrder, handleRazorpayWebhook } from "../services/payment.service";

// Schema for the client request to create an order
const createOrderInputSchema = z.object({
    email: z.string().email(),
    amount: z.number().positive(),
    phoneNumber: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order and returns the Order ID and Key ID to the client.
 */
export const createOrderController = async (req: Request, res: Response) => {
    try {
        const validatedBody = createOrderInputSchema.parse(req.body);

        const order = await createRazorpayOrder(validatedBody);

        res.status(201).json({
            message: "Razorpay order created successfully.",
            orderId: order.id,
            currency: order.currency,
            amount: order.amount, // Amount in paise
            keyId: process.env.RAZORPAY_KEY_ID, // Send keyId to client for payment popup
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid input data.", errors: error.issues });
        }
        console.error("Error in createOrderController:", error);
        res.status(500).json({ message: "Failed to create payment order." });
    }
};

/**
 * POST /api/payments/webhook
 * Handles the raw Razorpay webhook request.
 * NOTE: The raw body parsing is handled in app.ts middleware.
 */
export const paymentWebhookHandler = async (req: Request, res: Response) => {
    // Razorpay signature is in the 'x-razorpay-signature' header
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = req.body; // This is the raw Buffer body due to bodyParser.raw()

    if (!signature) {
        return res.status(400).send("No Razorpay signature header provided.");
    }

    // IMPORTANT: Razorpay requires a 200 OK response quickly, even if processing fails.
    // However, if the signature is invalid, we return 400 for security.
    try {
        const updatedPayment = await handleRazorpayWebhook(signature, rawBody);

        if (updatedPayment) {
            // Log success and respond 200 OK to Razorpay
            console.log(`Payment success for Order ID: ${updatedPayment.orderId}`);
            return res.status(200).json({ status: "ok" });
        } else {
            // If signature was valid but event wasn't processed (e.g., payment.failed), return 200 but log it
            return res.status(200).json({ status: "ignored" });
        }
    } catch (error) {
        console.error("Critical error in paymentWebhookHandler:", error);
        // Return 200 to prevent repeated retries from Razorpay, but log the error
        return res.status(200).json({ status: "error" });
    }
};