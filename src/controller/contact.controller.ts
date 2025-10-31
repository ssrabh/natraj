import { Request, Response } from "express";
import { contactSchema } from "../models/contact.schema";
import { createContact } from "../services/contact.service";

export const handleContactForm = async (req: Request, res: Response) => {
    try {
        const validated = contactSchema.parse(req.body);
        const result = await createContact(validated);
        res.status(201).json(result);
    } catch (err: any) {
        console.error("Contact Form Error:", err);
        res.status(400).json({ error: err.message });
    }
};

