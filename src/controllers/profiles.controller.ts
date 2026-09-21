import type { Request, Response } from "express";
import { getUserScopedClient } from "../config/supabase.js";
import { AppError } from "../middlewares/error.middleware.js";
import * as ProfilesService from "../services/profiles.service.js";
import type { UpdateProfileInput } from "../models/index.js";

const MAX_DISPLAY_NAME = 50;
const MAX_BIO = 300;
const MAX_AVATAR_URL = 2048;

/**
 * Server-side validation. The frontend's zod schema is a UX affordance,
 * not a guarantee - anything can POST here with a valid JWT.
 *
 * Note this validates *shape*, not *permission*: who may edit this row
 * is still decided by RLS, as everywhere else in this codebase.
 */
function parseProfileUpdate(body: unknown): UpdateProfileInput {
  const raw = (body ?? {}) as Record<string, unknown>;
  const update: UpdateProfileInput = {};

  if ("display_name" in raw) {
    const value = raw.display_name;
    if (value === null) {
      update.display_name = null;
    } else if (typeof value !== "string") {
      throw new AppError("display_name must be a string or null");
    } else {
      const trimmed = value.trim();
      if (trimmed.length === 0) throw new AppError("display_name cannot be empty");
      if (trimmed.length > MAX_DISPLAY_NAME) {
        throw new AppError(`display_name must be ${MAX_DISPLAY_NAME} characters or fewer`);
      }
      update.display_name = trimmed;
    }
  }

  if ("bio" in raw) {
    const value = raw.bio;
    if (value === null) {
      update.bio = null;
    } else if (typeof value !== "string") {
      throw new AppError("bio must be a string or null");
    } else {
      const trimmed = value.trim();
      if (trimmed.length > MAX_BIO) {
        throw new AppError(`bio must be ${MAX_BIO} characters or fewer`);
      }
      update.bio = trimmed.length === 0 ? null : trimmed;
    }
  }

  if ("avatar_url" in raw) {
    const value = raw.avatar_url;
    if (value === null) {
      update.avatar_url = null;
    } else if (typeof value !== "string") {
      throw new AppError("avatar_url must be a string or null");
    } else {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        update.avatar_url = null;
      } else {
        if (trimmed.length > MAX_AVATAR_URL) throw new AppError("avatar_url is too long");
        if (!/^https?:\/\//i.test(trimmed)) {
          throw new AppError("avatar_url must be an http(s) URL");
        }
        update.avatar_url = trimmed;
      }
    }
  }

  if ("email_notifications" in raw) {
    if (typeof raw.email_notifications !== "boolean") {
      throw new AppError("email_notifications must be a boolean");
    }
    update.email_notifications = raw.email_notifications;
  }

  if (Object.keys(update).length === 0) {
    throw new AppError("No updatable fields provided");
  }

  return update;
}

export async function getMyProfile(req: Request, res: Response) {
  const db = getUserScopedClient(req.accessToken!);
  const profile = await ProfilesService.getMyProfile(db, req.user!.id);
  res.json(profile);
}

export async function patchMyProfile(req: Request, res: Response) {
  const update = parseProfileUpdate(req.body);
  const db = getUserScopedClient(req.accessToken!);
  const profile = await ProfilesService.updateMyProfile(db, req.user!.id, update);
  res.json(profile);
}
