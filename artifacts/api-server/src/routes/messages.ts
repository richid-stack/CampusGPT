import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, threadsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateMessageBody } from "@workspace/api-zod";

const router = Router();

const formatMsg = (m: typeof messagesTable.$inferSelect) => ({
  ...m,
  citations: (m.citations as object[]) ?? [],
  followUps: (m.followUps as string[]) ?? [],
  createdAt: m.createdAt.toISOString(),
});

router.get("/threads/:threadId/messages", async (req, res) => {
  const threadId = parseInt(req.params.threadId);
  if (isNaN(threadId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.threadId, threadId))
    .orderBy(asc(messagesTable.createdAt));
  res.json(messages.map(formatMsg));
});

router.post("/threads/:threadId/messages", async (req, res) => {
  const threadId = parseInt(req.params.threadId);
  if (isNaN(threadId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [msg] = await db.insert(messagesTable).values({
    threadId,
    role: parsed.data.role,
    content: parsed.data.content,
  }).returning();

  // Update thread message count and lastMessageAt
  await db
    .update(threadsTable)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(threadsTable.id, threadId));

  res.status(201).json(formatMsg(msg));
});

export default router;
