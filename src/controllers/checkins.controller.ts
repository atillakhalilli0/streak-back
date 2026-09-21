import type { Request, Response } from "express";
import { getUserScopedClient } from "../config/supabase.js";
import { requireParam } from "../utils/params.js";
import * as CheckInsService from "../services/checkins.service.js";

export async function postCheckIn(req: Request, res: Response) {
  const streakId = requireParam(req, "id");
  const db = getUserScopedClient(req.accessToken!);
  const checkIn = await CheckInsService.checkIn(db, streakId);

  // Additive side effect: record + celebrate a milestone if this check-in
  // landed on one. Awaited (it's two fast queries) so the notification row
  // exists by the time the client refetches, but it can never throw, so a
  // failure here cannot turn a recorded check-in into an error response.
  await CheckInsService.handleCheckInMilestones(db, streakId, {
    userId: req.user!.id,
    email: req.user!.email ?? null,
  });

  res.status(201).json(checkIn);
}

export async function getCheckIns(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const checkIns = await CheckInsService.listCheckIns(db, requireParam(req, "id"));
  res.json(checkIns);
}
