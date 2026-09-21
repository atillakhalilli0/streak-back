/**
 * Deliberately plain template strings — no Handlebars/EJS/MJML. These are
 * four short emails; a templating engine would be more build surface than
 * content.
 *
 * Voice note: Streak is not a habit tracker with a scoreboard. Breaking a
 * streak is not a failure state, it's the end of one run. Nothing in here
 * should scold, guilt, or imply the user lost something — best_count
 * persists, and the copy should too.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const BRAND = "Streak";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Shared shell so every email looks like it came from the same product. */
function layout(bodyHtml: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<p style="margin:28px 0 0;">
           <a href="${escapeHtml(ctaUrl)}"
              style="display:inline-block;padding:12px 22px;border-radius:999px;
                     background:#111;color:#fff;text-decoration:none;
                     font-weight:600;font-size:15px;">${escapeHtml(ctaLabel)}</a>
         </p>`
      : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f4;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                color:#1c1917;line-height:1.55;">
      <div style="background:#fff;border-radius:16px;padding:32px;">
        ${bodyHtml}
        ${cta}
      </div>
      <p style="margin:20px 0 0;font-size:12px;color:#78716c;text-align:center;">
        ${BRAND} &middot; You can turn these emails off in your profile settings.
      </p>
    </div>
  </body>
</html>`;
}

const APP_URL = process.env.APP_URL ?? "";

function streakUrl(streakId: string): string | undefined {
  return APP_URL ? `${APP_URL.replace(/\/$/, "")}/streaks/${streakId}` : undefined;
}

function withCta(bodyHtml: string, label: string, streakId: string): string {
  const url = streakUrl(streakId);
  return url ? layout(bodyHtml, label, url) : layout(bodyHtml);
}

/** Sent to a streak's owner when another user 🔥s it. */
export function supportReceivedEmail(params: {
  recipientName: string;
  supporterName: string;
  streakTitle: string;
  streakId: string;
  currentCount: number;
}): EmailTemplate {
  const { recipientName, supporterName, streakTitle, streakId, currentCount } = params;
  const days = currentCount === 1 ? "1 day" : `${currentCount} days`;

  return {
    subject: `${supporterName} is backing your streak 🔥`,
    html: withCta(
      `<p style="margin:0 0 16px;font-size:17px;">Hey ${escapeHtml(recipientName)},</p>
       <p style="margin:0 0 16px;"><strong>${escapeHtml(supporterName)}</strong> just sent a 🔥 to
       <strong>${escapeHtml(streakTitle)}</strong>.</p>
       <p style="margin:0;">You're ${escapeHtml(days)} in, and someone out there is watching you hold it.</p>`,
      "See your streak",
      streakId
    ),
    text: `Hey ${recipientName},

${supporterName} just sent a fire to "${streakTitle}".

You're ${days} in, and someone out there is watching you hold it.

${streakUrl(streakId) ?? ""}`.trim(),
  };
}

/**
 * Sent when the break-streak job ends a run. Only ever sent to people who
 * actually checked in at least once — see the job for why.
 */
export function streakBrokenEmail(params: {
  recipientName: string;
  streakTitle: string;
  streakId: string;
  runLength: number;
  bestCount: number;
}): EmailTemplate {
  const { recipientName, streakTitle, streakId, runLength, bestCount } = params;
  const run = runLength === 1 ? "1 day" : `${runLength} days`;
  const best = bestCount === 1 ? "1 day" : `${bestCount} days`;

  return {
    subject: `That run ended at ${run} — your best is still ${best}`,
    html: withCta(
      `<p style="margin:0 0 16px;font-size:17px;">Hey ${escapeHtml(recipientName)},</p>
       <p style="margin:0 0 16px;">No check-in came in yesterday for
       <strong>${escapeHtml(streakTitle)}</strong>, so that run has closed at
       <strong>${escapeHtml(run)}</strong>.</p>
       <p style="margin:0 0 16px;">That's not gone. It's on your record: your best on this streak is
       <strong>${escapeHtml(best)}</strong>, and it stays ${escapeHtml(best)}.</p>
       <p style="margin:0;">The counter is the only thing that went back to zero. Start the next run whenever you're ready.</p>`,
      "Start again",
      streakId
    ),
    text: `Hey ${recipientName},

No check-in came in yesterday for "${streakTitle}", so that run has closed at ${run}.

That's not gone. It's on your record: your best on this streak is ${best}, and it stays ${best}.

The counter is the only thing that went back to zero. Start the next run whenever you're ready.

${streakUrl(streakId) ?? ""}`.trim(),
  };
}

/** Sent once per milestone per streak (7 / 30 / 60 / 100 days). */
export function milestoneEmail(params: {
  recipientName: string;
  streakTitle: string;
  streakId: string;
  milestone: number;
}): EmailTemplate {
  const { recipientName, streakTitle, streakId, milestone } = params;

  return {
    subject: `${milestone} days on ${streakTitle} 🔥`,
    html: withCta(
      `<p style="margin:0 0 16px;font-size:17px;">Hey ${escapeHtml(recipientName)},</p>
       <p style="margin:0 0 16px;">You just crossed <strong>${milestone} days</strong> on
       <strong>${escapeHtml(streakTitle)}</strong>.</p>
       <p style="margin:0;">Every one of those was a day you showed up. Keep going.</p>`,
      "See your streak",
      streakId
    ),
    text: `Hey ${recipientName},

You just crossed ${milestone} days on "${streakTitle}".

Every one of those was a day you showed up. Keep going.

${streakUrl(streakId) ?? ""}`.trim(),
  };
}
