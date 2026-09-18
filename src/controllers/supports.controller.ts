import type { Request, Response } from "express";
import { getUserScopedClient } from "../config/supabase.js";
import * as SupportsService from "../services/supports.service.js";

export async function postSupport(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const support = await SupportsService.supportStreak(db, req.user!.id, req.params.id!);
  res.status(201).json(support);
}

export async function removeSupport(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  await SupportsService.unsupportStreak(db, req.user!.id, req.params.id!);
  res.status(204).send();
}

export async function getSupportCount(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const count = await SupportsService.countSupports(db, req.params.id!);
  res.json({ streak_id: req.params.id, count });
}
