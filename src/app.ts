import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import contactRoutes from "./routes/contact.routes";
import paymentRoutes, { paymentWebhookHandler } from "./routes/payment.routes"; // 👈 IMPORT paymentRoutes and paymentWebhookHandler
import bodyParser from "body-parser";

const app = express();

// ✅ Parse JSON for other routes
// NOTE: This must be BELOW the raw body parser for the webhook, or the webhook will fail.
app.use(helmet({ crossOriginResourcePolicy: false }));

// ✅ Restrict CORS dynamically
app.use(
    cors({
        origin: (origin, callback) => {
            const allowed = process.env.CORS_ORIGINS?.split(",") || [];
            if (!origin || allowed.includes(origin)) return callback(null, true);
            callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);

// ✅ Rate limiting
app.use(
    rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 60000,
        max: Number(process.env.RATE_LIMIT_MAX) || 20,
        message: "Too many requests, please try again later.",
    })
);

// ✅ Razorpay webhook (raw body) - MUST be first to get raw JSON body
app.post(
    "/api/payments/webhook",
    bodyParser.raw({ type: "application/json" }),
    paymentWebhookHandler
);

// ✅ Global JSON body parser (for all other routes like /create-order)
app.use(express.json());

// ✅ Mount other routes
app.use("/api/contact", contactRoutes);
app.use("/api/payments", paymentRoutes); // 👈 MOUNT THE NEW PAYMENT ROUTES

export default app;