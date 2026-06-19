import { Router } from "express";
import Groq from "groq-sdk";
import { db } from "@workspace/db";
import { messagesTable, threadsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { SYSTEM_PROMPT } from "../lib/knowledgeBase.js";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";

router.post("/threads/:threadId/chat", async (req, res) => {
  const threadId = parseInt(req.params.threadId);
  if (isNaN(threadId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { content } = req.body as { content?: string };
  if (!content?.trim()) { res.status(400).json({ error: "Missing content" }); return; }

  try {
    // 1. Save user message to DB
    await db.insert(messagesTable).values({
      threadId,
      role: "user",
      content: content.trim(),
    });

    await db
      .update(threadsTable)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(threadsTable.id, threadId));

    // 2. Load conversation history (last 20 messages)
    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.threadId, threadId))
      .orderBy(asc(messagesTable.createdAt))
      .limit(20);

    // Keep only last 6 messages (3 turns) to stay within token budget
    const recentHistory = history.slice(-6);

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // 3. Stream SSE response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.4,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // 4. Save assistant message to DB
    await db.insert(messagesTable).values({
      threadId,
      role: "assistant",
      content: fullContent,
    });

    await db
      .update(threadsTable)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(threadsTable.id, threadId));

    res.write(`data: ${JSON.stringify({ done: true, model: MODEL })}\n\n`);
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
