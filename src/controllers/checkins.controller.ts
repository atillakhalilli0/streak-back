import type { Request, Response } from "express";
import { getUserScopedClient } from "../config/supabase.js";
import * as CheckInsService from "../services/checkins.service.js";

export async function postCheckIn(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const checkIn = await CheckInsService.checkIn(db, req.params.id!);
  res.status(201).json(checkIn);
}

export async function getCheckIns(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const checkIns = await CheckInsService.listCheckIns(db, req.params.id!);
  res.json(checkIns);
}
