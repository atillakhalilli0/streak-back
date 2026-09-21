import type { Request } from "express";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Reads a required route param as a string.
 *
 * Express 5's ParamsDictionary types every param as `string | string[]`
 * (a path can legitimately repeat a name), so `req.params.id` is not a
 * string as far as the compiler is concerned. This collapses that to the
 * one case these routes actually have, and turns a missing param into a
 * clean 400 instead of a downstream Supabase error.
 */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) return value[0];

  throw new AppError(`Missing route parameter: ${name}`);
}
