import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { postSupport, removeSupport, getSupportCount } from "../controllers/supports.controller.js";

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/streaks/{id}/support:
 *   post:
 *     summary: Support (fire react) a streak
 *     tags: [Supports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Support recorded
 *       409:
 *         description: Already supporting
 */
router.post("/", requireAuth, asyncHandler(postSupport));

/**
 * @openapi
 * /api/streaks/{id}/support:
 *   delete:
 *     summary: Remove support from a streak
 *     tags: [Supports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Removed
 */
router.delete("/", requireAuth, asyncHandler(removeSupport));

/**
 * @openapi
 * /api/streaks/{id}/support:
 *   get:
 *     summary: Get the support count for a streak
 *     tags: [Supports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Support count
 */
router.get("/", asyncHandler(getSupportCount));

export default router;
