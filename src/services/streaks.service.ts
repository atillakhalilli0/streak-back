import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/error.middleware.js";
import type { Streak, StreakWithRelations, StreakPrivacy } from "../models/index.js";

export interface CreateStreakInput {
  title: string;
  tag?: string | null;
  privacy?: StreakPrivacy;
  story?: string | null;
  origin_streak_id?: string | null;
}

export async function listMyStreaks(db: SupabaseClient, userId: string): Promise<Streak[]> {
  const { data, error } = await db
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<Streak[]>();

  if (error) throw new AppError(error.message, 500);
  return data;
}

export async function listExploreStreaks(db: SupabaseClient): Promise<StreakWithRelations[]> {
  const { data, error } = await db
    .from("streaks")
    .select("*, profiles(username, avatar_url), supports(count)")
    .eq("privacy", "public")
    .order("current_count", { ascending: false })
    .limit(50)
    .returns<StreakWithRelations[]>();

  if (error) throw new AppError(error.message, 500);
  return data;
}

export async function getStreakById(db: SupabaseClient, streakId: string): Promise<StreakWithRelations> {
  const { data, error } = await db
    .from("streaks")
    .select("*, profiles(username, avatar_url), check_ins(date), streak_runs(*)")
    .eq("id", streakId)
    .single()
    .returns<StreakWithRelations>();

  if (error) throw new AppError("Streak not found", 404);
  return data;
}

export async function createStreak(
  db: SupabaseClient,
  userId: string,
  input: CreateStreakInput
): Promise<Streak> {
  const { data, error } = await db
    .from("streaks")
    .insert({
      user_id: userId,
      title: input.title,
      tag: input.tag ?? null,
      privacy: input.privacy ?? "public",
      story: input.story ?? null,
      origin_streak_id: input.origin_streak_id ?? null,
    })
    .select()
    .single()
    .returns<Streak>();

  if (error) throw new AppError(error.message, 400);
  return data;
}

export async function deleteStreak(db: SupabaseClient, streakId: string): Promise<void> {
  const { error } = await db.from("streaks").delete().eq("id", streakId);
  if (error) throw new AppError(error.message, 400);
}

/**
 * "Join" a public streak: creates a brand new streak for the joining
 * user, linked back to the original via origin_streak_id.
 */
export async function joinStreak(
  db: SupabaseClient,
  userId: string,
  originStreakId: string
): Promise<Streak> {
  const { data: original, error: fetchError } = await db
    .from("streaks")
    .select("title, tag, privacy")
    .eq("id", originStreakId)
    .single()
    .returns<Pick<Streak, "title" | "tag" | "privacy">>();

  if (fetchError || !original) throw new AppError("Original streak not found", 404);
  if (original.privacy !== "public") throw new AppError("Cannot join a private streak", 403);

  return createStreak(db, userId, {
    title: original.title,
    tag: original.tag,
    privacy: "public",
    origin_streak_id: originStreakId,
  });
}
