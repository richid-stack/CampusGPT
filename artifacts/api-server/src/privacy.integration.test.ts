/**
 * End-to-end check of the privacy boundary: two real students, the real app,
 * a real database. Skipped when DATABASE_URL is not set (CI provides one).
 */
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const run = Boolean(process.env.DATABASE_URL);

// Must be set before the app (and auth config) is imported.
process.env.ALLOWED_EMAIL_DOMAINS = "st.ug.edu.gh";
process.env.BETTER_AUTH_URL = "http://localhost:8080";
process.env.NODE_ENV = "test";

const ORIGIN = "http://localhost:8080"; // must match BETTER_AUTH_URL (trusted origin)
const PASSWORD = "correct-horse-battery";
const suffix = Math.random().toString(36).slice(2, 8);

describe.skipIf(!run)("per-user privacy", () => {
  let server: Server;
  let base: string;
  let outbox: { to: string; text: string }[];

  async function signUpAndVerify(email: string): Promise<string> {
    const res = await fetch(`${base}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ email, password: PASSWORD, name: email.split("@")[0] }),
    });
    expect(res.status).toBe(200);

    const mail = outbox.find((m) => m.to === email);
    expect(mail, "verification email was sent").toBeTruthy();
    const link = mail!.text.match(/https?:\/\/\S+verify-email\?\S+/)![0];
    const url = new URL(link);

    const verified = await fetch(`${base}${url.pathname}${url.search}`, { redirect: "manual" });
    expect(verified.status).toBe(302);
    const cookie = verified.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    expect(cookie).toContain("session_token");
    return cookie;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (r: Response) => r.json() as Promise<any>;

  const call = (cookie: string | null, method: string, path: string, body?: unknown) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
        origin: ORIGIN,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  let alice = "";
  let bob = "";
  let aliceThreadId = 0;

  beforeAll(async () => {
    const { default: app } = await import("./app");
    const mailer = await import("./lib/mailer");
    outbox = mailer.testOutbox;
    server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    alice = await signUpAndVerify(`alice-${suffix}@st.ug.edu.gh`);
    bob = await signUpAndVerify(`bob-${suffix}@st.ug.edu.gh`);

    const t = await body(await call(alice, "POST", "/threads", { title: `Alice secret ${suffix}` }));
    aliceThreadId = t.id;
    await call(alice, "POST", `/threads/${aliceThreadId}/messages`, { role: "user", content: `alice private ${suffix}` });
    await call(alice, "POST", "/documents", { name: `alice-doc-${suffix}.pdf`, type: "pdf", pageCount: 3 });
    await call(alice, "POST", "/planner", {
      title: `alice task ${suffix}`,
      dueAt: new Date(Date.now() + 86_400_000).toISOString(),
      moduleCode: "SECRET101",
      type: "assignment",
    });
  }, 30_000);

  afterAll(async () => {
    await new Promise((r) => server?.close(r));
    const { pool } = await import("@workspace/db");
    await pool.end();
  });

  it("rejects non-student emails", async () => {
    const res = await fetch(`${base}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ email: `x-${suffix}@gmail.com`, password: PASSWORD, name: "X" }),
    });
    expect(res.status).toBe(400);
  });

  it("requires a session for data routes but not for health", async () => {
    expect((await call(null, "GET", "/threads")).status).toBe(401);
    expect((await call(null, "GET", "/documents")).status).toBe(401);
    expect((await call(null, "GET", "/healthz")).status).toBe(200);
  });

  it("does not let an unverified account sign in", async () => {
    const email = `unverified-${suffix}@st.ug.edu.gh`;
    await fetch(`${base}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ email, password: PASSWORD, name: "U" }),
    });
    const res = await fetch(`${base}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ email, password: PASSWORD }),
    });
    expect(res.status).toBe(403);
  });

  it("lets the owner see their own data", async () => {
    const threads = await body(await call(alice, "GET", "/threads"));
    expect(threads.map((t: { id: number }) => t.id)).toContain(aliceThreadId);
    const msgs = await body(await call(alice, "GET", `/threads/${aliceThreadId}/messages`));
    expect(msgs).toHaveLength(1);
  });

  it("hides Alice's thread from Bob on every route", async () => {
    expect((await call(bob, "GET", `/threads/${aliceThreadId}`)).status).toBe(404);
    expect((await call(bob, "GET", `/threads/${aliceThreadId}/messages`)).status).toBe(404);
    expect((await call(bob, "POST", `/threads/${aliceThreadId}/messages`, { role: "user", content: "hi" })).status).toBe(404);
    expect((await call(bob, "PATCH", `/threads/${aliceThreadId}`, { pinned: true })).status).toBe(404);
    expect((await call(bob, "POST", `/threads/${aliceThreadId}/chat`, { content: "hello" })).status).toBeGreaterThanOrEqual(404);

    expect(await body(await call(bob, "GET", "/threads"))).toEqual([]);
    expect(await body(await call(bob, "GET", "/threads/recent"))).toEqual([]);
    expect(await body(await call(bob, "GET", "/threads/pinned"))).toEqual([]);
    expect(await body(await call(bob, "GET", `/threads/search?q=${suffix}`))).toEqual([]);
  });

  it("does not let Bob delete or modify Alice's thread", async () => {
    await call(bob, "DELETE", `/threads/${aliceThreadId}`);
    const t = await body(await call(alice, "GET", `/threads/${aliceThreadId}`));
    expect(t.title).toBe(`Alice secret ${suffix}`);
    expect(t.pinned).toBe(false);
    const msgs = await body(await call(alice, "GET", `/threads/${aliceThreadId}/messages`));
    expect(msgs).toHaveLength(1);
  });

  it("keeps documents, planner and search private per user", async () => {
    expect(await body(await call(bob, "GET", "/documents"))).toEqual([]);
    expect(await body(await call(bob, "GET", "/planner"))).toEqual([]);
    expect(await body(await call(bob, "GET", "/planner/upcoming"))).toEqual([]);

    const aliceDocs = await body(await call(alice, "GET", "/documents"));
    expect(aliceDocs.map((d: { name: string }) => d.name)).toContain(`alice-doc-${suffix}.pdf`);

    const found = await body(await call(alice, "GET", `/threads/search?q=${suffix}`));
    expect(found.map((t: { id: number }) => t.id)).toContain(aliceThreadId);
  });

  it("gives each user their own profile", async () => {
    const a = await body(await call(alice, "GET", "/user/profile"));
    const b = await body(await call(bob, "GET", "/user/profile"));
    expect(a.email).toBe(`alice-${suffix}@st.ug.edu.gh`);
    expect(b.email).toBe(`bob-${suffix}@st.ug.edu.gh`);
  });
});
