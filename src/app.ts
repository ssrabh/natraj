import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import contactRoutes from "./routes/contact.routes";
import bodyParser from "body-parser";
import { paymentWebhookHandler } from "./routes/payment.routes";

const app = express();

// ✅ Parse JSON for other routes
app.use(express.json());
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

// ✅ Mount other routes
app.use("/api/contact", contactRoutes);

// ✅ Razorpay webhook (raw body)
app.post(
    "/api/payments/webhook",
    bodyParser.raw({ type: "application/json" }),
    paymentWebhookHandler
);

export default app;
