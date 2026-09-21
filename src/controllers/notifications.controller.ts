import type { Request, Response } from "express";
import { getUserScopedClient } from "../config/supabase.js";
import { requireParam } from "../utils/params.js";
import * as NotificationsService from "../services/notifications.service.js";

export async function getNotifications(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);

  const unreadOnly = req.query.unread === "true";
  const limitParam = Number(req.query.limit);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 50;

  const [notifications, unreadCount] = await Promise.all([
    NotificationsService.listNotifications(db, { unreadOnly, limit }),
    NotificationsService.countUnread(db),
  ]);

  res.json({ unread_count: unreadCount, notifications });
}

export async function patchNotificationRead(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const notification = await NotificationsService.markAsRead(db, requireParam(req, "id"));
  res.json(notification);
}

export async function patchAllNotificationsRead(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const updated = await NotificationsService.markAllAsRead(db);
  res.json({ updated });
}
