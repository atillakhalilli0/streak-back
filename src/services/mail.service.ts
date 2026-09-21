import { supabaseAdmin } from "../config/supabase.js";
import { sendMail } from "../config/mailer.js";
import type { EmailTemplate } from "../utils/emailTemplates.js";

/**
 * ─────────────────────────────────────────────────────────────────────
 * WHY supabaseAdmin APPEARS IN A REQUEST PATH HERE
 * ─────────────────────────────────────────────────────────────────────
 * Everywhere else in this codebase, a request is served by a user-scoped
 * client and RLS decides what the caller may touch. That still holds.
 *
 * This file is the one exception, and only for one thing: resolving a
 * *recipient's email address*. Email addresses live in `auth.users`,
 * which no user-scoped client can read — by design. So when user A
 * supports user B's streak, nothing in A's session can look up where to
 * mail B.
 *
 * The exception is kept as narrow as possible:
 *   - admin is used ONLY to read an email address + notification flag
 *   - the result never reaches the HTTP response, only the SMTP envelope
 *   - it makes no authorization decision and performs no writes
 *   - callers pass `email` / `emailNotifications` when they already know
 *     them (e.g. mailing the caller themselves), skipping admin entirely
 *
 * The alternative — mirroring emails into `profiles` — would put every
 * user's email address behind a table that is world-readable by RLS.
 * That's strictly worse. If you'd rather not have the service-role key
 * reachable from a request at all, the clean fix is a queue: write a
 * row here and drain it from the same trusted context as the cron job.
 */

export interface MailRecipient {
  email: string | null;
  displayName: string;
  emailNotifications: boolean;
}

/** Looks up where to mail a user, and whether they still want mail. */
export async function resolveRecipient(userId: string): Promise<MailRecipient> {
  const [{ data: profile }, { data: authUser }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("username, display_name, email_notifications")
      .eq("id", userId)
      .single(),
    supabaseAdmin.auth.admin.getUserById(userId),
  ]);

  return {
    email: authUser?.user?.email ?? null,
    displayName: profile?.display_name || profile?.username || "there",
    // Default to true so a missing profile row never silently swallows mail.
    emailNotifications: profile?.email_notifications ?? true,
  };
}

export interface SendToUserOptions {
  userId: string;
  /** Build the template once the recipient's display name is known. */
  build: (recipient: MailRecipient) => EmailTemplate;
  /** Pass these to skip the admin lookup when the caller already has them. */
  email?: string | null;
  emailNotifications?: boolean | null;
  displayName?: string | null;
}

/**
 * Sends one transactional email, honouring profiles.email_notifications.
 *
 * Resolves rather than rejects on every failure path. Call sites are
 * fire-and-forget: a dead SMTP host must never change a 201 into a 500.
 */
export async function sendToUser(opts: SendToUserOptions): Promise<boolean> {
  try {
    const needsLookup =
      opts.email === undefined ||
      opts.email === null ||
      opts.emailNotifications === undefined ||
      opts.emailNotifications === null ||
      !opts.displayName;

    const recipient: MailRecipient = needsLookup
      ? await resolveRecipient(opts.userId)
      : {
          email: opts.email!,
          displayName: opts.displayName!,
          emailNotifications: opts.emailNotifications!,
        };

    if (!recipient.emailNotifications) return false;
    if (!recipient.email) {
      console.warn(`[mail] No email address on file for user ${opts.userId} — skipped`);
      return false;
    }

    const template = opts.build(recipient);

    return await sendMail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (err) {
    console.error(`[mail] Unexpected failure sending to user ${opts.userId}:`, err);
    return false;
  }
}

/**
 * Explicit fire-and-forget wrapper. Use this at request-handling call
 * sites so it reads as intentional rather than a forgotten await.
 */
export function sendToUserInBackground(opts: SendToUserOptions): void {
  void sendToUser(opts).catch((err) => {
    console.error("[mail] Background send failed:", err);
  });
}
