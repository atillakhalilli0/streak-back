import type { Request, Response, NextFunction } from "express";
import { supabaseAnon } from "../config/supabase.js";

/**
 * Verifies the Supabase-issued JWT sent by the frontend as
 * "Authorization: Bearer <token>". On success, attaches req.user
 * and req.accessToken so downstream services can build a
 * user-scoped Supabase client (see getUserScopedClient).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice("Bearer ".length);

  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = data.user;
  req.accessToken = token;
  next();
}

/**
 * Like requireAuth, but does not fail the request if no token is
 * present — useful for endpoints that behave differently for logged
 * in vs anonymous users (e.g. public streak feed).
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice("Bearer ".length);
  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (!error && data.user) {
    req.user = data.user;
    req.accessToken = token;
  }

  next();
}
