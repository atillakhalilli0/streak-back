import { supabaseAdmin } from "../config/supabase.js";
import { AppError } from "../middlewares/error.middleware.js";
import { createNotification } from "./notifications.service.js";
import { sendToUser } from "./mail.service.js";
import { streakBrokenEmail } from "../utils/emailTemplates.js";
import type { Streak } from "../models/index.js";

/**
 * ─────────────────────────────────────────────────────────────────────
 * TIMEZONE POLICY
 * ─────────────────────────────────────────────────────────────────────
 * Days are UTC days. `check_ins.date` is a UTC date, and a streak lapses
 * when its most recent check-in is older than *yesterday* in UTC.
 *
 * Why UTC: it's the only boundary that doesn't require storing, trusting
 * and migrating a per-user timezone, and it's what the existing schema
 * already assumes (check_ins.date defaults to the server's current_date).
 *
 * KNOWN LIMITATION: a user in UTC+13 loses their day ~11 hours before
 * local midnight; a user in UTC-8 gets ~8 hours of grace. Fixing this
 * properly means a `timezone` column on `profiles` and evaluating the
 * boundary per user — deliberately not done here, but it is the obvious
 * next iteration if users outside Europe/Africa complain. Running the
 * scheduler a few hours *after* 00:00 UTC softens the worst case.
 */

export interface LapsedStreak {
  streak_id: string;
  user_id: string;
  title: string;
  current_count: number;
  best_count: number;
  has_check_ins: boolean;
  email_notifications: boolean;
}

export interface BreakStreaksResult {
  as_of: string;
  lapsed: number;
  broken: number;
  emails_sent: number;
  notifications_created: number;
  failures: { streak_id: string; reason: string }[];
}

/**
 * Ends every run that lapsed, using supabaseAdmin.
 *
 * This is the one place in the codebase where the service-role key is
 * correct to use: there is no calling user, the job acts across every
 * user's data, and it is reached only via the shared-secret cron route,
 * never by a JWT-bearing request.
 */
export async function runBreakStreaksJob(asOf?: string): Promise<BreakStreaksResult> {
  const asOfDate = asOf ?? new Date().toISOString().slice(0, 10);

  // The RPC isn't in a generated Database type, so its return is untyped
  // at the client boundary — assert it against the model instead.
  const { data, error } = await supabaseAdmin.rpc("find_lapsed_streaks", { p_today: asOfDate });

  if (error) throw new AppError(`Could not load lapsed streaks: ${error.message}`, 500);

  const lapsed = (data ?? []) as LapsedStreak[];
  const result: BreakStreaksResult = {
    as_of: asOfDate,
    lapsed: lapsed.length,
    broken: 0,
    emails_sent: 0,
    notifications_created: 0,
    failures: [],
  };

  for (const streak of lapsed) {
    try {
      // Moves the current run into streak_runs and resets the streak to
      // broken/0. best_count is preserved by the function itself.
      const { error: breakError } = await supabaseAdmin.rpc("break_streak", {
        p_streak_id: streak.streak_id,
      });

      if (breakError) {
        result.failures.push({ streak_id: streak.streak_id, reason: breakError.message });
        continue;
      }

      result.broken += 1;

      // A streak that never saw a single check-in isn't a broken run,
      // it's an abandoned signup. Reset it, but don't tell anyone about
      // it - that's noise, and it would read as a telling-off for
      // something the user never started.
      if (!streak.has_check_ins) continue;

      // Re-read rather than trusting the pre-break snapshot, so the
      // email quotes whatever best_count the DB actually settled on.
      const { data: after } = await supabaseAdmin
        .from("streaks")
        .select("best_count")
        .eq("id", streak.streak_id)
        .returns<Pick<Streak, "best_count">[]>()
        .single();

      const bestCount = Math.max(after?.best_count ?? 0, streak.best_count, streak.current_count);

      const notification = await createNotification(supabaseAdmin, {
        user_id: streak.user_id,
        type: "streak_broken",
        title: `Your run on ${streak.title} ended at ${streak.current_count} days`,
        body: `Your best on this one is still ${bestCount} days. Start again whenever you're ready.`,
        streak_id: streak.streak_id,
      });

      if (notification) result.notifications_created += 1;

      if (!streak.email_notifications) continue;

      // Awaited here, unlike on the request path: nobody is waiting on a
      // response, and the job's report is more useful if it's accurate.
      const sent = await sendToUser({
        userId: streak.user_id,
        build: (recipient) =>
          streakBrokenEmail({
            recipientName: recipient.displayName,
            streakTitle: streak.title,
            streakId: streak.streak_id,
            runLength: streak.current_count,
            bestCount,
          }),
      });

      if (sent) result.emails_sent += 1;
    } catch (err) {
      result.failures.push({
        streak_id: streak.streak_id,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return result;
}
