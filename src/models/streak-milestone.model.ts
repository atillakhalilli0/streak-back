/** Milestones (in days) that trigger a congratulations email. */
export const MILESTONES = [7, 30, 60, 100] as const;

export type Milestone = (typeof MILESTONES)[number];

/**
 * One row per (streak, milestone) already celebrated. The unique
 * constraint on that pair is what makes milestone emails idempotent —
 * see services/checkins.service.ts.
 */
export interface StreakMilestone {
  id: string;
  streak_id: string;
  milestone: number;
  created_at: string;
}
