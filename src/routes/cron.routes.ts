import { Router } from "express";
import { requireCronSecret } from "../middlewares/cron.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { postBreakStreaks } from "../controllers/cron.controller.js";

const router = Router();

/**
 * @openapi
 * /api/internal/cron/break-streaks:
 *   post:
 *     summary: "[Internal] End every streak that lapsed"
 *     description: >
 *       Machine-to-machine endpoint, authenticated with the shared secret in
 *       the `x-cron-secret` header — not a user JWT. Finds every active streak
 *       whose most recent check-in is older than yesterday (UTC), calls the
 *       break_streak() Postgres function on each, writes a notification and
 *       sends the "run ended" email to owners who had actually checked in.
 *       Idempotent: a streak that is already broken is not returned again.
 *       Trigger it from an external scheduler — see the README.
 *     tags: [Internal]
 *     parameters:
 *       - in: header
 *         name: x-cron-secret
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               as_of:
 *                 type: string
 *                 format: date
 *                 description: Override "today" (YYYY-MM-DD), for replaying a missed run
 *     responses:
 *       200:
 *         description: Job report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 as_of: { type: string }
 *                 lapsed: { type: integer }
 *                 broken: { type: integer }
 *                 emails_sent: { type: integer }
 *                 notifications_created: { type: integer }
 *                 failures: { type: array, items: { type: object } }
 *       401:
 *         description: Missing or invalid cron secret
 *       503:
 *         description: CRON_SECRET is not configured on the server
 */
router.post("/break-streaks", requireCronSecret, asyncHandler(postBreakStreaks));

export default router;
