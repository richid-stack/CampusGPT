import { createAuthClient } from "better-auth/react";

// Same-origin: in dev Vite proxies /api, in production the API serves the app.
export const authClient = createAuthClient({ baseURL: window.location.origin });

/** Absolute URL for a path inside the app (used for email/OAuth redirects). */
export function appUrl(path = "/"): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}${path}`;
}
