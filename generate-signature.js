// generate-signature.js
import crypto from "crypto";
import fs from "fs";

const body = fs.readFileSync("mock-webhook.json", "utf8");
const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

console.log("✅ Generated Signature:", signature);

