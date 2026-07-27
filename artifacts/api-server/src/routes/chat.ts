import { Router } from "express";
import Groq from "groq-sdk";
import { db } from "@workspace/db";
import { messagesTable, threadsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { SYSTEM_PROMPT, WALK_WITH_ME_PROMPT } from "../lib/knowledgeBase.js";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Models confirmed available on Groq as of July 2026
const MODELS = {
  default: "llama-3.3-70b-versatile",   // best general quality
  smart:   "qwen/qwen3.6-27b",           // reasoning / complex queries
  fast:    "llama-3.1-8b-instant",       // quick simple queries
};

const MODEL_LABELS: Record<string, string> = {
  "llama-3.3-70b-versatile": "Llama 3.3 · 70B",
  "qwen/qwen3.6-27b":        "Qwen 3.6 · 27B",
  "llama-3.1-8b-instant":    "Llama 3.1 · 8B",
};

const SMART_KEYWORDS = [
  "explain why", "explain how", "compare", "analyze", "analyse",
  "calculate", "difference between", "critically", "evaluate",
  "prove", "what would happen", "academic advice",
  "gpa", "cgpa", "thesis", "dissertation", "research methodology",
];

function selectModel(content: string, requestedMode?: string): keyof typeof MODELS {
  if (requestedMode === "smart") return "smart";
  if (requestedMode === "fast" || requestedMode === "walk") return "fast";
  const lower = content.toLowerCase();
  if (SMART_KEYWORDS.some(k => lower.includes(k)) || content.length > 250) return "smart";
  return "default";
}

/**
 * Strip <think>…</think> chain-of-thought blocks (Qwen 3 emits these).
 * Operates on a rolling buffer so partial tags spanning chunk boundaries work.
 */
function makeThinkFilter() {
  let buf = "";
  let inThink = false;

  return function filter(delta: string): string {
    buf += delta;
    let out = "";

    while (true) {
      if (!inThink) {
        const start = buf.indexOf("<think>");
        if (start === -1) {
          const guard = Math.max(0, buf.length - 7);
          out += buf.slice(0, guard);
          buf = buf.slice(guard);
          break;
        }
        out += buf.slice(0, start);
        buf = buf.slice(start + 7);
        inThink = true;
      } else {
        const end = buf.indexOf("</think>");
        if (end === -1) { buf = ""; break; }
        buf = buf.slice(end + 8);
        inThink = false;
      }
    }

    return out;
  };
}

router.post("/threads/:threadId/chat", async (req, res) => {
  const threadId = parseInt(req.params.threadId);
  if (isNaN(threadId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { content, mode } = req.body as { content?: string; mode?: string };
  if (!content?.trim()) { res.status(400).json({ error: "Missing content" }); return; }

  try {
    await db.insert(messagesTable).values({ threadId, role: "user", content: content.trim() });
    await db.update(threadsTable)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(threadsTable.id, threadId));

    const history = await db
      .select().from(messagesTable)
      .where(eq(messagesTable.threadId, threadId))
      .orderBy(asc(messagesTable.createdAt))
      .limit(20);

    const modelKey  = selectModel(content.trim(), mode);
    const modelId   = MODELS[modelKey];
    const systemPrompt = mode === "walk" ? WALK_WITH_ME_PROMPT : SYSTEM_PROMPT;

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const stream = await groq.chat.completions.create({
      model: modelId,
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: modelKey === "smart" ? 0.4 : 0.55,
    });

    const thinkFilter = makeThinkFilter();
    let fullContent = "";

    for await (const chunk of stream) {
      const raw = chunk.choices[0]?.delta?.content ?? "";
      if (!raw) continue;

      const safe = thinkFilter(raw);
      if (safe) {
        fullContent += safe;
        res.write(`data: ${JSON.stringify({ delta: safe })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({ threadId, role: "assistant", content: fullContent });
    await db.update(threadsTable)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(threadsTable.id, threadId));

    const label = MODEL_LABELS[modelId] ?? modelId;
    res.write(`data: ${JSON.stringify({ done: true, model: modelId, modelLabel: label, mode: modelKey })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log?.error({ err }, "Chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

export default router;
