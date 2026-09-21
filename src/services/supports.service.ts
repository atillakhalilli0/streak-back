import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/error.middleware.js";
import type { Support, Streak, Profile } from "../models/index.js";
import { sendToUserInBackground } from "./mail.service.js";
import { supportReceivedEmail } from "../utils/emailTemplates.js";

export async function supportStreak(db: SupabaseClient, userId: string, streakId: string): Promise<Support> {
  const { data, error } = await db
    .from("supports")
    .insert({ streak_id: streakId, user_id: userId })
    .select()
    .returns<Support[]>()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError("Already supporting this streak", 409);
    }
    throw new AppError(error.message, 400);
  }

  return data;
}

export async function unsupportStreak(db: SupabaseClient, userId: string, streakId: string): Promise<void> {
  const { error } = await db
    .from("supports")
    .delete()
    .eq("streak_id", streakId)
    .eq("user_id", userId);

  if (error) throw new AppError(error.message, 400);
}

export async function countSupports(db: SupabaseClient, streakId: string): Promise<number> {
  const { count, error } = await db
    .from("supports")
    .select("*", { count: "exact", head: true })
    .eq("streak_id", streakId);

  if (error) throw new AppError(error.message, 500);
  return count ?? 0;
}

/**
 * Fires after a support is recorded: emails the streak's owner.
 *
 * The in-app notification row is NOT created here - a trigger on
 * `supports` does that (see the SQL block), which keeps this endpoint
 * unchanged and also covers writes made straight through the Supabase
 * client SDK. Only the email needs application code, because only the
 * application can talk to SMTP.
 *
 * Never throws. Supporting a streak must succeed even if mail doesn't.
 */
export async function handleSupportSideEffects(
  db: SupabaseClient,
  params: { supporterId: string; streakId: string }
): Promise<void> {
  try {
    const { data: streak, error } = await db
      .from("streaks")
      .select("id, user_id, title, current_count")
      .eq("id", params.streakId)
      .returns<Pick<Streak, "id" | "user_id" | "title" | "current_count">[]>()
      .single();

    if (error || !streak) return;

    // No self-notifications.
    if (streak.user_id === params.supporterId) return;

    const { data: supporter } = await db
      .from("profiles")
      .select("username, display_name")
      .eq("id", params.supporterId)
      .returns<Pick<Profile, "username" | "display_name">[]>()
      .single();

    const supporterName = supporter?.display_name || supporter?.username || "Someone";

    // The recipient's address and email_notifications flag are resolved
    // inside sendToUser - a user-scoped client cannot read another
    // user's email address.
    sendToUserInBackground({
      userId: streak.user_id,
      build: (recipient) =>
        supportReceivedEmail({
          recipientName: recipient.displayName,
          supporterName,
          streakTitle: streak.title,
          streakId: streak.id,
          currentCount: streak.current_count,
        }),
    });
  } catch (err) {
    console.error("[supports] Side effect failed:", err);
  }
}
