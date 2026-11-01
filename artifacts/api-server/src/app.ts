import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth } from "./middlewares/requireAuth";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { isAiConfigured } from "./lib/groq";
import { logger } from "./lib/logger";

const app: Express = express();

// Behind a single reverse proxy (Replit / load balancer): trust X-Forwarded-For
// so rate limiting keys on the real client IP.
app.set("trust proxy", 1);

// Comma-separated list of allowed browser origins. If unset, cross-origin
// requests are allowed only outside production (same-origin always works).
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const isProd = process.env.NODE_ENV === "production";

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
// Groq-backed endpoints cost money per call, so they get a much tighter budget.
// Keyed per signed-in user (students share campus Wi-Fi/NAT, so per-IP would
// throttle whole halls); falls back to IP for anything unauthenticated.
const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  keyGenerator: (req) => req.userId ?? ipKeyGenerator(req.ip ?? ""),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : !isProd,
    credentials: true,
  }),
);

app.use("/api", apiLimiter);

// Better Auth (sign-up, sign-in, sessions, OAuth). Must come before express.json().
app.all("/api/auth/{*splat}", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Everything below needs a signed-in user (except health and /api/config).
app.use("/api", requireAuth);
app.use(["/api/threads/:threadId/chat", "/api/stt", "/api/tts"], aiLimiter);
// AI endpoints need a Groq key; everything else works without one.
app.use(["/api/threads/:threadId/chat", "/api/stt", "/api/tts"], (_req, res, next) => {
  if (isAiConfigured()) return next();
  res.status(503).json({ error: "AI is not configured. Set GROQ_API_KEY in your .env." });
});
app.use("/api", router);

// Single-container / local production: serve the built frontend from this server.
const staticDir = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : null;
if (staticDir && fs.existsSync(staticDir)) {
  app.use(express.static(staticDir, { index: false, maxAge: "1h" }));
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
