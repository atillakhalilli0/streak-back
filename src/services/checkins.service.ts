import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/error.middleware.js";
import type { CheckIn, Streak } from "../models/index.js";
import { MILESTONES } from "../models/index.js";
import { createNotification } from "./notifications.service.js";
import { getMyEmailPreference } from "./profiles.service.js";
import { sendToUserInBackground } from "./mail.service.js";
import { milestoneEmail } from "../utils/emailTemplates.js";

/**
 * Records today's check-in for a streak. The DB trigger
 * handle_check_in() bumps streaks.current_count / best_count.
 * The unique (streak_id, date) constraint makes double check-ins
 * on the same day fail at the DB level.
 */
export async function checkIn(db: SupabaseClient, streakId: string): Promise<CheckIn> {
  const { data, error } = await db
    .from("check_ins")
    .insert({ streak_id: streakId })
    .select()
    .returns<CheckIn[]>()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError("Already checked in today", 409);
    }
    throw new AppError(error.message, 400);
  }

  return data;
}

export async function listCheckIns(db: SupabaseClient, streakId: string): Promise<Pick<CheckIn, "date">[]> {
  const { data, error } = await db
    .from("check_ins")
    .select("date")
    .eq("streak_id", streakId)
    .order("date", { ascending: true })
    .returns<Pick<CheckIn, "date">[]>();

  if (error) throw new AppError(error.message, 500);
  return data;
}

/**
 * Fires after a successful check-in: if the new current_count landed
 * exactly on a milestone, record it and congratulate the owner.
 *
 * IDEMPOTENCY TRADEOFF
 * Two options were on the table:
 *
 *   (a) compute purely from current_count - zero schema change, but not
 *       actually idempotent. current_count is a cached column; any
 *       backfill, manual correction, or retry that re-runs this path
 *       re-sends the email, and a streak that breaks and climbs back to
 *       7 has no way to know it already celebrated 7.
 *
 *   (b) a `streak_milestones` table with unique (streak_id, milestone).
 *
 * (b) won. The insert *is* the idempotency check - a duplicate raises
 * 23505 and we bail before sending, which is race-free without any
 * read-then-write window. Cost is one extra table and one extra insert
 * per check-in that lands on a milestone (so: four times per run, ever).
 *
 * Consequence worth knowing: milestones are once per streak *lifetime*,
 * not once per run. Re-reaching 7 days after a break sends nothing. That
 * reads as the right call - the second week isn't the same news as the
 * first - but if you want per-run celebration, add a run number to the
 * unique key.
 *
 * Never throws: a check-in must succeed even if congratulating it fails.
 */
export async function handleCheckInMilestones(
  db: SupabaseClient,
  streakId: string,
  owner: { userId: string; email?: string | null }
): Promise<void> {
  try {
    const { data: streak, error } = await db
      .from("streaks")
      .select("id, user_id, title, current_count")
      .eq("id", streakId)
      .returns<Pick<Streak, "id" | "user_id" | "title" | "current_count">[]>()
      .single();

    if (error || !streak) return;

    // Only the streak's own owner gets milestone mail, and only on an
    // exact landing - we don't backfill skipped milestones.
    if (streak.user_id !== owner.userId) return;
    if (!MILESTONES.includes(streak.current_count as (typeof MILESTONES)[number])) return;

    const { error: claimError } = await db
      .from("streak_milestones")
      .insert({ streak_id: streakId, milestone: streak.current_count });

    // 23505 = this milestone was already celebrated. Nothing to do.
    if (claimError) {
      if (claimError.code !== "23505") {
        console.error("[milestones] Could not record milestone:", claimError.message);
      }
      return;
    }

    const { emailNotifications, displayName } = await getMyEmailPreference(db, owner.userId);

    await createNotification(db, {
      user_id: owner.userId,
      type: "milestone_reached",
      title: `${streak.current_count} days on ${streak.title}`,
      body: `You've held this one for ${streak.current_count} days straight.`,
      streak_id: streakId,
    });

    sendToUserInBackground({
      userId: owner.userId,
      email: owner.email ?? null,
      emailNotifications,
      displayName,
      build: (recipient) =>
        milestoneEmail({
          recipientName: recipient.displayName,
          streakTitle: streak.title,
          streakId: streak.id,
          milestone: streak.current_count,
        }),
    });
  } catch (err) {
    console.error("[milestones] Side effect failed:", err);
  }
}
