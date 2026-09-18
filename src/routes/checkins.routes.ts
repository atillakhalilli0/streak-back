import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { postCheckIn, getCheckIns } from "../controllers/checkins.controller.js";

// mergeParams so req.params.id (the streak id) from the parent
// /api/streaks/:id router is visible here.
const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/streaks/{id}/checkins:
 *   post:
 *     summary: Check in on a streak for today
 *     tags: [Check-ins]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Check-in recorded
 *       409:
 *         description: Already checked in today
 */
router.post("/", requireAuth, asyncHandler(postCheckIn));

/**
 * @openapi
 * /api/streaks/{id}/checkins:
 *   get:
 *     summary: List all check-in dates for a streak
 *     tags: [Check-ins]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of check-in dates
 */
router.get("/", requireAuth, asyncHandler(getCheckIns));

export default router;
