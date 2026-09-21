import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/error.middleware.js";
import type { Profile, UpdateProfileInput } from "../models/index.js";

/**
 * Reads the caller's own profile. No `.eq("id", userId)` guard is needed
 * for safety — RLS already limits what this client can see — but it's
 * passed anyway so the query returns a single row deterministically.
 */
export async function getMyProfile(db: SupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .returns<Profile[]>()
    .single();

  if (error) throw new AppError("Profile not found", 404);
  return data;
}

export async function updateMyProfile(
  db: SupabaseClient,
  userId: string,
  input: UpdateProfileInput
): Promise<Profile> {
  const { data, error } = await db
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select()
    .returns<Profile[]>()
    .single();

  if (error) throw new AppError(error.message, 400);
  return data;
}

/** The caller's own notification preference, read with their own client. */
export async function getMyEmailPreference(
  db: SupabaseClient,
  userId: string
): Promise<{ emailNotifications: boolean; displayName: string }> {
  const { data, error } = await db
    .from("profiles")
    .select("username, display_name, email_notifications")
    .eq("id", userId)
    .returns<Pick<Profile, "username" | "display_name" | "email_notifications">[]>()
    .single();

  if (error || !data) return { emailNotifications: true, displayName: "there" };

  return {
    emailNotifications: data.email_notifications ?? true,
    displayName: data.display_name || data.username || "there",
  };
}
