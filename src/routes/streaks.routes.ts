import { Router } from "express";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getMyStreaks,
  getExploreStreaks,
  getStreak,
  postStreak,
  removeStreak,
  postJoinStreak,
} from "../controllers/streaks.controller.js";
import checkinsRouter from "./checkins.routes.js";
import supportsRouter from "./supports.routes.js";

const router = Router();

/**
 * @openapi
 * /api/streaks/mine:
 *   get:
 *     summary: List the authenticated user's own streaks
 *     tags: [Streaks]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of streaks
 *       401:
 *         description: Not authenticated
 */
router.get("/mine", requireAuth, asyncHandler(getMyStreaks));

/**
 * @openapi
 * /api/streaks/explore:
 *   get:
 *     summary: List public streaks, ranked by current streak length
 *     tags: [Streaks]
 *     responses:
 *       200:
 *         description: List of public streaks
 */
router.get("/explore", optionalAuth, asyncHandler(getExploreStreaks));

/**
 * @openapi
 * /api/streaks/{id}:
 *   get:
 *     summary: Get a single streak by id
 *     tags: [Streaks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Streak detail
 *       404:
 *         description: Not found
 */
router.get("/:id", optionalAuth, asyncHandler(getStreak));

/**
 * @openapi
 * /api/streaks:
 *   post:
 *     summary: Create a new streak
 *     tags: [Streaks]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               tag: { type: string }
 *               privacy: { type: string, enum: [public, private] }
 *               story: { type: string }
 *     responses:
 *       201:
 *         description: Streak created
 */
router.post("/", requireAuth, asyncHandler(postStreak));

/**
 * @openapi
 * /api/streaks/{id}:
 *   delete:
 *     summary: Delete a streak the caller owns
 *     tags: [Streaks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete("/:id", requireAuth, asyncHandler(removeStreak));

/**
 * @openapi
 * /api/streaks/{id}/join:
 *   post:
 *     summary: Join a public streak (creates a new streak for the caller)
 *     tags: [Streaks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: New streak created from the original
 */
router.post("/:id/join", requireAuth, asyncHandler(postJoinStreak));

// nested resources
router.use("/:id/checkins", checkinsRouter);
router.use("/:id/support", supportsRouter);

export default router;
