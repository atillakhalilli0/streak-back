import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";

import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";
import streaksRouter from "./routes/streaks.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Streak API is running" });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/streaks", streaksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
