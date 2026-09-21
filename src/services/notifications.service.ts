import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/error.middleware.js";
import type { Notification, NotificationType } from "../models/index.js";

export interface ListNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
}

/**
 * The caller's own notifications, newest first. RLS restricts this to
 * rows where user_id = auth.uid(), so there's no ownership filter here.
 */
export async function listNotifications(
  db: SupabaseClient,
  options: ListNotificationsOptions = {}
): Promise<Notification[]> {
  let query = db
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.unreadOnly) query = query.eq("read", false);

  const { data, error } = await query.returns<Notification[]>();

  if (error) throw new AppError(error.message, 500);
  return data;
}

export async function countUnread(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);

  if (error) throw new AppError(error.message, 500);
  return count ?? 0;
}

export async function markAsRead(db: SupabaseClient, notificationId: string): Promise<Notification> {
  const { data, error } = await db
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .select()
    .returns<Notification[]>()
    .single();

  // RLS makes someone else's notification invisible rather than
  // forbidden, so "no row came back" is a 404, not a 403.
  if (error || !data) throw new AppError("Notification not found", 404);
  return data;
}

export async function markAllAsRead(db: SupabaseClient): Promise<number> {
  const { data, error } = await db
    .from("notifications")
    .update({ read: true })
    .eq("read", false)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) throw new AppError(error.message, 400);
  return data?.length ?? 0;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  streak_id?: string | null;
  actor_id?: string | null;
}

/**
 * Inserts a notification row.
 *
 * Note that support/join notifications do NOT come through here — those
 * are created by database triggers (see the SQL block), the same way
 * streaks.current_count is already maintained by a trigger on check_ins.
 * That keeps the support and join endpoints untouched and means a write
 * made directly through the Supabase client SDK still notifies correctly.
 *
 * This function covers the remaining cases, where the writer is the
 * recipient themselves (milestones) or a trusted job (streak broken).
 */
export async function createNotification(
  db: SupabaseClient,
  input: CreateNotificationInput
): Promise<Notification | null> {
  const { data, error } = await db
    .from("notifications")
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      streak_id: input.streak_id ?? null,
      actor_id: input.actor_id ?? null,
    })
    .select()
    .returns<Notification[]>()
    .single();

  if (error) {
    // Notifications are a side effect — never fail the caller's main
    // write because the bell icon didn't update.
    console.error("[notifications] Failed to create notification:", error.message);
    return null;
  }

  return data;
}
