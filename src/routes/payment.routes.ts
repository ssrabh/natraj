import { Router } from "express";
import { createOrderController, paymentWebhookHandler } from "../controller/payment.controller";

const paymentRoutes = Router();

// Route to initiate a payment (Client-side POST)
paymentRoutes.post("/create-order", createOrderController);

// Export the webhook handler for use in app.ts with raw body parser
export { paymentWebhookHandler };
export default paymentRoutes;