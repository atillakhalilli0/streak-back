import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

/**
 * Guards the internal cron routes with a shared secret instead of a user
 * JWT. These endpoints have no calling user - they're triggered by a
 * scheduler (pg_cron, a GitHub Action, cron-job.org, ...) and they run
 * with the service-role key, so they must never be reachable with an
 * ordinary access token.
 *
 * Send it as:  x-cron-secret: <CRON_SECRET>
 */
export function requireCronSecret(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.CRON_SECRET;

  // Fail closed. An unset secret must not mean "open to everyone".
  if (!expected) {
    console.error("[cron] CRON_SECRET is not set - refusing to run internal job");
    return res.status(503).json({ error: "Cron endpoint is not configured" });
  }

  const header = req.headers["x-cron-secret"];
  const provided = Array.isArray(header) ? header[0] : header;

  if (!provided || !safeEqual(provided, expected)) {
    return res.status(401).json({ error: "Invalid cron secret" });
  }

  next();
}

/** Constant-time compare, length-safe. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
