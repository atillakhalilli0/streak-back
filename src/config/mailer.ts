import "dotenv/config";
import nodemailer, { type Transporter } from "nodemailer";

// ---- Email (Nodemailer) ----
// Paste your SMTP provider's credentials into .env below. MAIL_FROM is the
// display name + address emails will be sent from, e.g.
// MAIL_FROM="Streak <no-reply@yourdomain.com>"
//
//   SMTP_HOST=     SMTP_PORT=     SMTP_SECURE=
//   SMTP_USER=     SMTP_PASS=     MAIL_FROM=
//
// Nothing here is provider-specific on purpose — point it at Resend,
// Postmark, SES, Mailgun, Gmail, Mailtrap, whatever you end up using.
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_SECURE = process.env.SMTP_SECURE;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export const MAIL_FROM = process.env.MAIL_FROM ?? "Streak <no-reply@localhost>";

/**
 * True only when enough SMTP config is present to bother trying.
 * When false the app still boots and every route still works — mail
 * just no-ops with a console warning. Email is a side effect of a
 * request, never a precondition for one.
 */
export const isMailConfigured = Boolean(SMTP_HOST && SMTP_PORT);

const transporter: Transporter | null = isMailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      // SMTP_SECURE=true means implicit TLS (usually port 465). Leave it
      // false for 587/2525, where STARTTLS is negotiated instead.
      secure: String(SMTP_SECURE).toLowerCase() === "true",
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends one email. Resolves either way — it never throws, so a broken
 * SMTP config degrades into a log line instead of turning a 201 into
 * a 500. Callers should still not await this on the request path.
 */
export async function sendMail(payload: MailPayload): Promise<boolean> {
  if (!transporter) {
    console.warn(`[mailer] SMTP not configured — skipped "${payload.subject}" to ${payload.to}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return true;
  } catch (err) {
    console.error(`[mailer] Failed to send "${payload.subject}" to ${payload.to}:`, err);
    return false;
  }
}
