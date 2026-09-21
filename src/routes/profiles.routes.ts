import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getMyProfile, patchMyProfile } from "../controllers/profiles.controller.js";

const router = Router();

/**
 * @openapi
 * /api/profiles/me:
 *   get:
 *     summary: Get the authenticated user's own profile
 *     tags: [Profiles]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: The caller's profile row
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Profile not found
 */
router.get("/me", requireAuth, asyncHandler(getMyProfile));

/**
 * @openapi
 * /api/profiles/me:
 *   patch:
 *     summary: Update the authenticated user's own profile
 *     description: >
 *       Partial update — only the fields you send are changed. Send null to
 *       clear display_name, avatar_url or bio. email_notifications is the
 *       single opt-out for all transactional email.
 *     tags: [Profiles]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name: { type: string, nullable: true, maxLength: 50 }
 *               avatar_url: { type: string, nullable: true, format: uri }
 *               bio: { type: string, nullable: true, maxLength: 300 }
 *               email_notifications: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated profile
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.patch("/me", requireAuth, asyncHandler(patchMyProfile));

export default router;
