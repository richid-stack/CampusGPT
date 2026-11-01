import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

let transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!process.env.SMTP_URL) return null;
  return (transport ??= nodemailer.createTransport(process.env.SMTP_URL));
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email via SMTP_URL (e.g. smtp://localhost:1025 for Mailpit, or any
 * provider's SMTP). With no SMTP_URL, development logs the message (including
 * verification links) to the console; production refuses to pretend.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const t = getTransport();
  if (!t) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_URL is not set; cannot send email in production.");
    }
    logger.warn({ to: mail.to, subject: mail.subject }, `[dev mail] ${mail.text}`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM ?? "CampusGPT <no-reply@localhost>",
    ...mail,
  });
}
