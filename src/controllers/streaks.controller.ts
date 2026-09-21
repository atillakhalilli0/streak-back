import type { Request, Response } from "express";
import { getUserScopedClient, supabaseAnon } from "../config/supabase.js";
import { requireParam } from "../utils/params.js";
import { AppError } from "../middlewares/error.middleware.js";
import * as StreaksService from "../services/streaks.service.js";

export async function getMyStreaks(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const streaks = await StreaksService.listMyStreaks(db, req.user!.id);
  res.json(streaks);
}

export async function getExploreStreaks(req: Request, res: Response) {
  // Public feed: works for logged-out visitors too, so fall back to
  // the anon client when there's no authenticated user.
  const db = req.accessToken ? getUserScopedClient(req.accessToken) : supabaseAnon;
  const streaks = await StreaksService.listExploreStreaks(db);
  res.json(streaks);
}

export async function getStreak(req: Request, res: Response) {
  const db = req.accessToken ? getUserScopedClient(req.accessToken) : supabaseAnon;
  const streak = await StreaksService.getStreakById(db, requireParam(req, "id"));
  res.json(streak);
}

export async function postStreak(req: Request, res: Response) {
  const { title, tag, privacy, story } = req.body ?? {};

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new AppError("title is required");
  }
  if (privacy && !["public", "private"].includes(privacy)) {
    throw new AppError("privacy must be 'public' or 'private'");
  }

  const db = getUserScopedClient(req.accessToken!);
  const streak = await StreaksService.createStreak(db, req.user!.id, { title, tag, privacy, story });
  res.status(201).json(streak);
}

export async function removeStreak(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  await StreaksService.deleteStreak(db, requireParam(req, "id"));
  res.status(204).send();
}

export async function postJoinStreak(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const streak = await StreaksService.joinStreak(db, req.user!.id, requireParam(req, "id"));
  res.status(201).json(streak);
}
