import { Request, Response } from "express";
import { verifyRazorpaySignature, savePaymentRecord } from "../services/payment.service";

export const paymentWebhookHandler = async (req: Request, res: Response) => {
    try {
        const signature = req.headers["x-razorpay-signature"] as string;
        if (!signature) {
            return res.status(400).json({ success: false, message: "Missing signature" });
        }

        const rawBody = req.body.toString("utf8");
        const isValid = verifyRazorpaySignature(rawBody, signature);

        console.log("✅ Signature Valid:", isValid);

        if (!isValid) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        const payload = JSON.parse(rawBody).payload?.payment?.entity;
        if (payload) {
            await savePaymentRecord({
                email: payload.email,
                phoneNumber: payload.contact,
                orderId: payload.order_id,
                paymentId: payload.id,
                status: payload.status,
                amount: payload.amount / 100, // Razorpay sends paise
                currency: payload.currency,
                notes: JSON.stringify(payload.notes),
            });
        }

        res.json({ success: true, message: "Webhook received successfully" });
    } catch (error) {
        console.error("❌ Webhook error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
