import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getNotifications,
  patchNotificationRead,
  patchAllNotificationsRead,
} from "../controllers/notifications.controller.js";

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: List the caller's notifications, newest first
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema: { type: string, enum: ["true", "false"] }
 *         description: Pass "true" to return only unread notifications
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *     responses:
 *       200:
 *         description: Notifications plus the caller's unread count
 *       401:
 *         description: Not authenticated
 */
router.get("/", requireAuth, asyncHandler(getNotifications));

/**
 * @openapi
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all of the caller's notifications as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Number of notifications updated
 *       401:
 *         description: Not authenticated
 */
router.patch("/read-all", requireAuth, asyncHandler(patchAllNotificationsRead));

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The updated notification
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Not found (or not yours — RLS makes these the same thing)
 */
router.patch("/:id/read", requireAuth, asyncHandler(patchNotificationRead));

export default router;
