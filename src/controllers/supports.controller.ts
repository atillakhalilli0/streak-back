import type { Request, Response } from "express";
import { getUserScopedClient } from "../config/supabase.js";
import { requireParam } from "../utils/params.js";
import * as SupportsService from "../services/supports.service.js";

export async function postSupport(req: Request, res: Response) {
  const streakId = requireParam(req, "id");
  const db = getUserScopedClient(req.accessToken!);
  const support = await SupportsService.supportStreak(db, req.user!.id, streakId);

  // Additive side effect. The in-app notification row is created by a DB
  // trigger on `supports`; this only fires the email, and it never throws.
  await SupportsService.handleSupportSideEffects(db, {
    supporterId: req.user!.id,
    streakId,
  });

  res.status(201).json(support);
}

export async function removeSupport(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  await SupportsService.unsupportStreak(db, req.user!.id, requireParam(req, "id"));
  res.status(204).send();
}

export async function getSupportCount(req: Request, res: Response) {
  const streakId = requireParam(req, "id");
  const db = getUserScopedClient(req.accessToken!);
  const count = await SupportsService.countSupports(db, streakId);
  res.json({ streak_id: streakId, count });
}
