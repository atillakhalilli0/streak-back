import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { postSignUp, postSignIn } from "../controllers/auth.controller.js";

const router = Router();

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Create a Supabase Auth user (thin proxy, for testing in Swagger)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               username: { type: string }
 *     responses:
 *       201:
 *         description: User created. session.access_token is null if your Supabase project requires email confirmation.
 */
router.post("/signup", asyncHandler(postSignUp));

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Sign in and receive an access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: session.access_token is the value to paste into the Authorize button
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", asyncHandler(postSignIn));

export default router;
