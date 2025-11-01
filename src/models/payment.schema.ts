import { pgTable, serial, varchar, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { z } from "zod";

export const paymentTable = pgTable("payments", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 150 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }),
    gateway: varchar("gateway", { length: 50 }).notNull().default("Razorpay"),
    orderId: varchar("order_id", { length: 100 }).notNull(),
    paymentId: varchar("payment_id", { length: 100 }),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    amount: numeric("amount").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("INR"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentSchema = z.object({
    email: z.string().email(),
    phoneNumber: z.string().optional(),
    gateway: z.string().default("Razorpay"),
    orderId: z.string(),
    paymentId: z.string().optional(),
    status: z.string().default("pending"),
    amount: z.number(),
    currency: z.string().default("INR"),
    notes: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;



