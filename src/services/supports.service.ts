import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/error.middleware.js";
import type { Support } from "../models/index.js";

export async function supportStreak(db: SupabaseClient, userId: string, streakId: string): Promise<Support> {
  const { data, error } = await db
    .from("supports")
    .insert({ streak_id: streakId, user_id: userId })
    .select()
    .single()
    .returns<Support>();

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
