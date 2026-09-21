/**
 * Notification types. Kept as a string union rather than a Postgres enum
 * so adding a type later is an additive code change, not a migration.
 */
export type NotificationType = "support_received" | "streak_joined" | "streak_broken" | "milestone_reached";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  streak_id: string | null;
  actor_id: string | null;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}
