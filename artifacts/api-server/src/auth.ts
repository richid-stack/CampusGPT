import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import {
  db,
  userTable,
  sessionTable,
  accountTable,
  verificationTable,
} from "@workspace/db";
import { isAllowedEmail, parseAllowedDomains } from "./lib/emailPolicy";
import { sendMail } from "./lib/mailer";

const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT ?? "8080";

export const allowedEmailDomains = parseAllowedDomains(process.env.ALLOWED_EMAIL_DOMAINS);

const secret = process.env.BETTER_AUTH_SECRET;
if (isProd && (!secret || secret.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET must be set (32+ chars) in production. Generate one with: openssl rand -base64 32");
}

if (isProd && !process.env.SMTP_URL) {
  throw new Error("SMTP_URL must be set in production: students cannot verify their email without it (e.g. smtp://user:pass@smtp.provider.com:587).");
}

const baseURL = process.env.BETTER_AUTH_URL ?? `http://localhost:${port}`;

const corsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const microsoft =
  process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
    ? {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        // Set to your university's tenant ID to accept only its accounts.
        tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
      }
    : null;

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }
    : null;

export const enabledSocialProviders = [microsoft && "microsoft", google && "google"].filter(
  Boolean,
) as string[];

export const auth = betterAuth({
  baseURL,
  secret: secret ?? "dev-only-insecure-secret-do-not-use-in-production",
  trustedOrigins: [
    baseURL,
    ...corsOrigins,
    ...(isProd ? [] : ["http://localhost:5173", "http://127.0.0.1:5173"]),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Reset your CampusGPT password",
        text: `Reset your password: ${url}\n\nIf you didn't ask for this, ignore this email.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Verify your CampusGPT account",
        text: `Welcome to CampusGPT!\n\nConfirm your student email by opening this link:\n${url}\n\nIf you didn't sign up, ignore this email.`,
      });
    },
  },
  socialProviders: {
    ...(microsoft ? { microsoft } : {}),
    ...(google ? { google } : {}),
  },
  databaseHooks: {
    user: {
      create: {
        // Enforced for every sign-up path (email, Microsoft, Google).
        before: async (user) => {
          if (!isAllowedEmail(user.email, allowedEmailDomains)) {
            throw new APIError("BAD_REQUEST", {
              message: `Please use your student email (@${allowedEmailDomains.join(", @")}).`,
            });
          }
        },
      },
    },
  },
});
