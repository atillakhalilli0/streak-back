import { Router } from "express";

const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is up
 */
router.get("/", (_req, res) => {
  res.json({ status: "ok", service: "streak-api" });
});

export default router;
