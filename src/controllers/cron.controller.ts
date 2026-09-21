import type { Request, Response } from "express";
import { AppError } from "../middlewares/error.middleware.js";
import * as CronService from "../services/cron.service.js";

/**
 * Machine-to-machine only. Auth is the shared secret checked by
 * requireCronSecret upstream - there is no req.user here by design.
 */
export async function postBreakStreaks(req: Request, res: Response) {
  // Optional override, mainly for replaying a missed night. Guarded so a
  // typo can't quietly evaluate the wrong day.
  const asOf = req.body?.as_of;
  if (asOf !== undefined && (typeof asOf !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(asOf))) {
    throw new AppError("as_of must be a YYYY-MM-DD date string");
  }

  const result = await CronService.runBreakStreaksJob(asOf);
  res.json(result);
}
