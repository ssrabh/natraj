import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import contactRoutes from "./routes/contact.routes";
import paymentRoutes from "./routes/payment.routes";

const app = express();

// ⚠️ 1️⃣ Mount Razorpay webhook route BEFORE json parser
// (so it can access raw body)
app.use("/api/payments/webhook", paymentRoutes);

// ✅ 2️⃣ Now you can safely parse JSON for other routes
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: false }));

// ✅ Restrict CORS dynamically
app.use(cors({
    origin: (origin, callback) => {
        const allowed = process.env.CORS_ORIGINS?.split(",") || [];
        if (!origin || allowed.includes(origin)) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));

// ✅ Rate limiting from env
app.use(rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 60000,
    max: Number(process.env.RATE_LIMIT_MAX) || 20,
    message: "Too many requests, please try again later.",
}));

// ✅ Other routes after JSON middleware
app.use("/api/contact", contactRoutes);
app.use("/api/payments", paymentRoutes); // all non-webhook routes

export default app;
