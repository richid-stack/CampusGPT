import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";

// Reachable without a session (health probes and the public sign-in config).
const PUBLIC_PATHS = new Set(["/healthz", "/readyz", "/config"]);

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (PUBLIC_PATHS.has(req.path)) return next();
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) {
      res.status(401).json({ error: "Not signed in" });
      return;
    }
    req.userId = session.user.id;
    next();
  } catch (err) {
    req.log?.error({ err }, "session lookup failed");
    res.status(401).json({ error: "Not signed in" });
  }
}
