export type StreakPrivacy = "public" | "private";
export type StreakStatus = "active" | "broken";

export interface Streak {
  id: string;
  user_id: string;
  title: string;
  tag: string | null;
  privacy: StreakPrivacy;
  started_at: string;
  status: StreakStatus;
  current_count: number;
  best_count: number;
  story: string | null;
  origin_streak_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Shape returned by queries that join in the owner's profile and
 * related counts (used by the explore feed and streak detail views).
 */
export interface StreakWithRelations extends Streak {
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  check_ins?: { date: string }[];
  streak_runs?: {
    id: string;
    length: number;
    started_at: string;
    ended_at: string;
  }[];
}
