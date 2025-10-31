import express from "express";
import { verifyRazorpaySignature, savePaymentRecord } from "../services/payment.service";

const router = express.Router();

// ✅ Use express.raw to capture raw buffer for webhook verification
router.post("/webhook", express.raw({ type: "*/*" }), async (req, res) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = req.body.toString("utf8");

    console.log("🔹 Incoming Signature:", signature);
    console.log("🔹 Raw Body:", rawBody.slice(0, 100) + "..."); // debug preview

    if (!signature) {
        return res.status(400).json({ success: false, message: "Missing signature" });
    }

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
            amount: payload.amount,
            currency: payload.currency,
            notes: JSON.stringify(payload.notes),
        });
    }

    res.json({ success: true, message: "Webhook received successfully" });
});

export default router;

