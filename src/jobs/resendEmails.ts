import "dotenv/config";
import { db } from "../config/db";
import { contactTable } from "../models/contact.schema";
import { sendEmail } from "../utils/email";
import { eq, inArray, sql } from "drizzle-orm";

const retryFailedEmails = async () => {
    console.log("🔍 Checking for failed or pending emails...");

    // ✅ Use inArray() instead of .in()
    const failedContacts = await db
        .select()
        .from(contactTable)
        .where(
            inArray(contactTable.emailStatus, ["failed", "pending"])
        )
        .limit(20);

    if (failedContacts.length === 0) {
        console.log("✅ No failed or pending emails found.");
        return;
    }

    console.log(`📬 Found ${failedContacts.length} contact(s) to retry.`);

    for (const contact of failedContacts) {
        try {
            await sendEmail(`New Contact Query from ${contact.firstName}`, contact);

            // ✅ Mark success
            await db
                .update(contactTable)
                .set({
                    emailStatus: "sent",
                    lastAttemptAt: sql`now()`,
                })
                .where(eq(contactTable.id, contact.id));

            console.log(`✅ Email resent successfully for ID: ${contact.id}`);
        } catch (err: any) {
            console.error(`❌ Failed again for contact ID: ${contact.id}`, err.message);

            // ✅ Update failure status and retry count
            await db
                .update(contactTable)
                .set({
                    emailStatus: "failed",
                    retryCount: String(Number(contact.retryCount || 0) + 1),
                    lastAttemptAt: sql`now()`,
                })
                .where(eq(contactTable.id, contact.id));
        }
    }

    console.log("🚀 Retry process completed.");
};

// Run manually
retryFailedEmails()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("⚠️ Retry job failed:", err);
        process.exit(1);
    });


/*
email retry job that automatically checks  database for failed email sends and tries again.
simply run: npm run retry-emails
*/