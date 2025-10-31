import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const contactTable = pgTable("contacts", {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }).notNull(),
    phoneCountry: varchar("phone_country", { length: 100 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    designation: varchar("designation", { length: 100 }).notNull(),
    companyName: varchar("company_name", { length: 150 }).notNull(),
    queryType: varchar("query_type", { length: 100 }).notNull(),
    message: text("message").notNull(),

    // ✅ New operational fields
    emailStatus: varchar("email_status", { length: 20 })
        .default("pending")
        .notNull(), // sent | failed | pending
    retryCount: varchar("retry_count", { length: 5 }).default("0"), // for email retries
    lastAttemptAt: timestamp("last_attempt_at").defaultNow(), // track last try timestamp
    createdAt: timestamp("created_at").defaultNow(),
});

// ✅ Validation Schema
export const contactSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phoneCountry: z.string().min(1),
    phoneNumber: z.string().min(5),
    designation: z.string().min(1),
    companyName: z.string().min(1),
    queryType: z.string().min(1),
    message: z.string().min(1),
});

export type ContactInput = z.infer<typeof contactSchema>;
