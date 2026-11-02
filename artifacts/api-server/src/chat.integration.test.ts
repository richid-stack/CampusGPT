/**
 * The chat stream end to end: real app, real database, a fake model.
 * Checks what the student's browser receives (thinking, tool step, answer),
 * what gets saved, and that Stop / Regenerate behave. Skipped when
 * DATABASE_URL is not set (CI provides one).
 */
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

const run = Boolean(process.env.DATABASE_URL);

// Must be set before the app (and auth config) is imported.
process.env.ALLOWED_EMAIL_DOMAINS = "st.ug.edu.gh";
process.env.BETTER_AUTH_URL = "http://localhost:8080";
process.env.NODE_ENV = "test";
process.env.GROQ_API_KEY = "test-key-not-used";

const ORIGIN = "http://localhost:8080";
const PASSWORD = "correct-horse-battery";
const suffix = Math.random().toString(36).slice(2, 8);

// ── Fake model ───────────────────────────────────────────────────────────────
type Chunk = Record<string, unknown>;
const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 10, text: 10, reasoning: undefined },
};
const finish: Chunk = { type: "finish", finishReason: { unified: "stop", raw: undefined }, logprobs: undefined, usage };

/** Replaced per test. Each call to the model pops the next script. */
let scripts: Array<{ chunks: Chunk[]; chunkDelayInMs?: number }> = [];
const modelCalls: Array<{ prompt: unknown }> = [];

const fakeModel = new MockLanguageModelV4({
  doStream: async (options) => {
    modelCalls.push({ prompt: options.prompt });
    const script = scripts.shift() ?? { chunks: [{ type: "text-start", id: "t" }, { type: "text-delta", id: "t", delta: "ok" }, { type: "text-end", id: "t" }, finish] };
    return {
      stream: simulateReadableStream({ chunks: script.chunks as never[], chunkDelayInMs: script.chunkDelayInMs ?? 0 }),
    };
  },
});

vi.mock("./lib/providerModel.js", () => ({
  createProviderModel: () => fakeModel,
}));

const text = (id: string, ...deltas: string[]): Chunk[] => [
  { type: "text-start", id },
  ...deltas.map((delta) => ({ type: "text-delta", id, delta })),
  { type: "text-end", id },
];
const reasoning = (id: string, ...deltas: string[]): Chunk[] => [
  { type: "reasoning-start", id },
  ...deltas.map((delta) => ({ type: "reasoning-delta", id, delta })),
  { type: "reasoning-end", id },
];

/** Reads the SSE body into the list of JSON events the browser would see. */
async function readEvents(res: Response): Promise<Array<Record<string, any>>> {
  const raw = await res.text();
  return raw
    .split("\n\n")
    .map((b) => b.trim())
    .filter((b) => b.startsWith("data: ") && b !== "data: [DONE]")
    .map((b) => JSON.parse(b.slice(6)));
}

const textOf = (events: Array<Record<string, any>>) =>
  events.filter((e) => e.type === "text-delta").map((e) => e.delta).join("");

describe.skipIf(!run)("chat streaming", () => {
  let server: Server;
  let base: string;
  let outbox: { to: string; text: string }[];
  let alice = "";
  let bob = "";
  let threadId = 0;

  async function signUpAndVerify(email: string): Promise<string> {
    const res = await fetch(`${base}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ email, password: PASSWORD, name: email.split("@")[0] }),
    });
    expect(res.status).toBe(200);
    const mail = outbox.find((m) => m.to === email);
    const link = mail!.text.match(/https?:\/\/\S+verify-email\?\S+/)![0];
    const url = new URL(link);
    const verified = await fetch(`${base}${url.pathname}${url.search}`, { redirect: "manual" });
    return verified.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  }

  const api = (cookie: string, method: string, path: string, body?: unknown, signal?: AbortSignal) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: { cookie, origin: ORIGIN, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

  const send = (cookie: string, tid: number, content: string, extra: Record<string, unknown> = {}, signal?: AbortSignal) =>
    api(cookie, "POST", `/threads/${tid}/chat`, { message: { parts: [{ type: "text", text: content }] }, ...extra }, signal);

  const newThread = async (title: string): Promise<number> =>
    ((await (await api(alice, "POST", "/threads", { title })).json()) as { id: number }).id;

  const messages = async (cookie: string, tid: number) => (await (await api(cookie, "GET", `/threads/${tid}/messages`)).json()) as any[];

  /** Saving happens as the stream ends; give it a moment. */
  async function waitFor<T>(fn: () => Promise<T>, ok: (v: T) => boolean): Promise<T> {
    let v = await fn();
    for (let i = 0; i < 40 && !ok(v); i++) {
      await new Promise((r) => setTimeout(r, 50));
      v = await fn();
    }
    return v;
  }

  beforeAll(async () => {
    const { default: app } = await import("./app");
    const mailer = await import("./lib/mailer");
    outbox = mailer.testOutbox;
    server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    alice = await signUpAndVerify(`chat-alice-${suffix}@st.ug.edu.gh`);
    bob = await signUpAndVerify(`chat-bob-${suffix}@st.ug.edu.gh`);
    threadId = await newThread(`chat ${suffix}`);
  }, 30_000);

  afterAll(async () => {
    await new Promise((r) => server?.close(r));
    const { pool } = await import("@workspace/db");
    await pool.end();
  });

  it("streams thinking then the answer, and saves both", async () => {
    scripts = [{ chunks: [...reasoning("r", "Checking ", "the add/drop rules."), ...text("t", "You can ", "add courses in week 1."), finish] }];
    const res = await send(alice, threadId, "What are the add/drop rules?");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const events = await readEvents(res);
    const types = events.map((e) => e.type);
    expect(types.indexOf("reasoning-delta")).toBeGreaterThan(-1);
    expect(types.indexOf("reasoning-delta")).toBeLessThan(types.indexOf("text-delta"));
    expect(textOf(events)).toBe("You can add courses in week 1.");
    // Official links that match the question are sent as sources.
    expect(events.some((e) => e.type === "source-url")).toBe(true);

    const rows = await waitFor(() => messages(alice, threadId), (m) => m.length >= 2);
    expect(rows.map((m) => m.role)).toEqual(["user", "assistant"]);
    const saved = rows[1];
    expect(saved.content).toBe("You can add courses in week 1.");
    expect(saved.parts.some((p: any) => p.type === "reasoning" && p.text.includes("add/drop"))).toBe(true);
    expect(saved.parts.some((p: any) => p.type === "text")).toBe(true);
    expect(saved.model).toBe("openai/gpt-oss-120b");
  });

  it("keeps <think> tags out of the answer, even when split across chunks", async () => {
    const tid = await newThread(`think ${suffix}`);
    scripts = [{ chunks: [...text("t", "<thi", "nk>secret plan</th", "ink>Hello ", "there"), finish] }];
    const events = await readEvents(await send(alice, tid, "hello"));
    expect(textOf(events)).toBe("Hello there");
    expect(textOf(events)).not.toContain("secret");
    expect(events.filter((e) => e.type === "reasoning-delta").map((e) => e.delta).join("")).toContain("secret plan");
  });

  it("looks up a campus place as a visible step and gives the model its details", async () => {
    const tid = await newThread(`nav ${suffix}`);
    scripts = [{ chunks: [...text("t", "Head to the Balme Library."), finish] }];
    modelCalls.length = 0;
    const events = await readEvents(await send(alice, tid, "Where is Balme Library?"));

    const input = events.find((e) => e.type === "tool-input-available");
    const output = events.find((e) => e.type === "tool-output-available");
    expect(input?.toolName).toBe("findCampusLocation");
    expect(output?.output?.name).toBe("Balme Library");
    expect(JSON.stringify(modelCalls[0].prompt)).toContain("Verified campus place");

    const rows = await waitFor(() => messages(alice, tid), (m) => m.length >= 2);
    expect(rows[1].parts.some((p: any) => p.type === "tool-findCampusLocation" && p.output?.name === "Balme Library")).toBe(true);
  });

  it("regenerate replaces the last answer instead of adding a second question", async () => {
    const tid = await newThread(`regen ${suffix}`);
    scripts = [{ chunks: [...text("t", "first answer"), finish] }];
    await readEvents(await send(alice, tid, "hello there"));
    await waitFor(() => messages(alice, tid), (m) => m.length >= 2);

    scripts = [{ chunks: [...text("t", "second answer"), finish] }];
    const res = await api(alice, "POST", `/threads/${tid}/chat`, { trigger: "regenerate-message" });
    await readEvents(res);
    const rows = await waitFor(() => messages(alice, tid), (m) => m.length === 2 && m[1].content === "second answer");
    expect(rows.map((m) => `${m.role}:${m.content}`)).toEqual(["user:hello there", "assistant:second answer"]);
  });

  it("keeps what was written when the student presses Stop", async () => {
    const tid = await newThread(`stop ${suffix}`);
    scripts = [{
      chunks: [...text("t", "Part one. ", "Part two. ", "Part three. ", "Part four. ", "Part five."), finish],
      chunkDelayInMs: 150,
    }];
    const ac = new AbortController();
    const res = await send(alice, tid, "tell me a long story", {}, ac.signal);
    const reader = res.body!.getReader();
    let seen = "";
    while (!seen.includes("Part two")) {
      const { value, done } = await reader.read();
      if (done) break;
      seen += new TextDecoder().decode(value);
    }
    ac.abort();
    await reader.cancel().catch(() => {});

    const rows = await waitFor(() => messages(alice, tid), (m) => m.some((x) => x.role === "assistant"));
    const saved = rows.find((m) => m.role === "assistant");
    expect(saved, "partial answer was saved").toBeTruthy();
    expect(saved.content).toContain("Part one.");
    expect(saved.content).not.toContain("Part five.");
  });

  it("refuses bad requests and other people's threads", async () => {
    expect((await api(alice, "POST", `/threads/${threadId}/chat`, { message: { parts: [] } })).status).toBe(400);
    expect((await api(alice, "POST", `/threads/${threadId}/chat`, { message: { parts: [{ type: "text", text: "  " }] } })).status).toBe(400);
    const bad = { message: { parts: [{ type: "file", mediaType: "image/png", url: "https://evil.example/x.png" }] } };
    expect((await api(alice, "POST", `/threads/${threadId}/chat`, bad)).status).toBe(400);
    expect((await send(bob, threadId, "let me in")).status).toBe(404);
  });

  it("accepts a photo and sends it to the model", async () => {
    const tid = await newThread(`img ${suffix}`);
    scripts = [{ chunks: [...text("t", "It is a pixel."), finish] }];
    modelCalls.length = 0;
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";
    const res = await api(alice, "POST", `/threads/${tid}/chat`, {
      message: { parts: [{ type: "text", text: "what is this?" }, { type: "file", mediaType: "image/png", url: png }] },
    });
    expect(textOf(await readEvents(res))).toBe("It is a pixel.");
    expect(JSON.stringify(modelCalls[0].prompt)).toContain("what is this?");
    expect(JSON.stringify(modelCalls[0].prompt)).toContain("image/png");
    // The photo itself is not kept in the database.
    const rows = await waitFor(() => messages(alice, tid), (m) => m.length >= 2);
    expect(JSON.stringify(rows)).not.toContain("iVBORw0KGgo");
  });
});
