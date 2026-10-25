import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
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
const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
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
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiLimiter);
app.use(["/api/threads/:threadId/chat", "/api/stt", "/api/tts"], aiLimiter);
app.use("/api", router);

export default app;
