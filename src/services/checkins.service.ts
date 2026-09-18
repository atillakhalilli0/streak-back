import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/error.middleware.js";
import type { CheckIn } from "../models/index.js";

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
    .single()
    .returns<CheckIn>();

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
