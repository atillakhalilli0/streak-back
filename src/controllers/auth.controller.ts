import type { Request, Response } from "express";
import { AppError } from "../middlewares/error.middleware.js";
import * as AuthService from "../services/auth.service.js";

function assertEmailPassword(body: unknown): { email: string; password: string } {
  const { email, password } = (body ?? {}) as Record<string, unknown>;

  if (!email || typeof email !== "string") throw new AppError("email is required");
  if (!password || typeof password !== "string") throw new AppError("password is required");

  return { email, password };
}

export async function postSignUp(req: Request, res: Response) {
  const { email, password } = assertEmailPassword(req.body);
  const username = typeof req.body?.username === "string" ? req.body.username : undefined;

  const result = await AuthService.signUp({ email, password, username });
  res.status(201).json(result);
}

export async function postSignIn(req: Request, res: Response) {
  const { email, password } = assertEmailPassword(req.body);

  const result = await AuthService.signIn({ email, password });
  res.status(200).json(result);
}
