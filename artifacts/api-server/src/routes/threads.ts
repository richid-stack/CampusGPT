import { Router } from "express";
import { db } from "@workspace/db";
import { threadsTable, messagesTable } from "@workspace/db";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { CreateThreadBody, UpdateThreadBody } from "@workspace/api-zod";

const router = Router();

router.get("/threads", async (req, res) => {
  const pinned = req.query.pinned === "true" ? true : req.query.pinned === "false" ? false : undefined;
  const space = req.query.space as string | undefined;

  const conditions = [];
  if (pinned !== undefined) conditions.push(eq(threadsTable.pinned, pinned));
  if (space) conditions.push(eq(threadsTable.space, space));

  const threads = await db
    .select()
    .from(threadsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(threadsTable.updatedAt));

  res.json(threads.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
  })));
});

router.post("/threads", async (req, res) => {
  const parsed = CreateThreadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [thread] = await db.insert(threadsTable).values({
    title: parsed.data.title,
    space: parsed.data.space ?? "my_campus",
  }).returning();
  res.status(201).json({
    ...thread,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    lastMessageAt: thread.lastMessageAt?.toISOString() ?? null,
  });
});

router.get("/threads/recent", async (req, res) => {
  const threads = await db
    .select()
    .from(threadsTable)
    .orderBy(desc(threadsTable.lastMessageAt))
    .limit(5);
  res.json(threads.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
  })));
});

// Full-text conversation search used by the command palette and sidebar.
// Search both thread titles and message content so older conversations remain discoverable.
router.get("/threads/search", async (req, res) => {
  const query = String(req.query.q ?? "").trim();
  if (!query) { res.json([]); return; }

  const matchingMessages = await db
    .select({ threadId: messagesTable.threadId })
    .from(messagesTable)
    .where(ilike(messagesTable.content, `%${query}%`));

  const ids = [...new Set(matchingMessages.map(m => m.threadId))];
  const titleMatches = await db
    .select()
    .from(threadsTable)
    .where(ilike(threadsTable.title, `%${query}%`))
    .orderBy(desc(threadsTable.updatedAt));

  const titleIds = new Set(titleMatches.map(t => t.id));
  const messageMatches = ids.length
    ? await db.select().from(threadsTable).where(or(...ids.map(id => eq(threadsTable.id, id))))
    : [];

  const merged = [...titleMatches, ...messageMatches.filter(t => !titleIds.has(t.id))]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  res.json(merged.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
  })));
});

router.get("/threads/pinned", async (req, res) => {
  const threads = await db
    .select()
    .from(threadsTable)
    .where(eq(threadsTable.pinned, true))
    .orderBy(desc(threadsTable.updatedAt));
  res.json(threads.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
  })));
});

router.get("/threads/:threadId", async (req, res) => {
  const id = parseInt(req.params.threadId);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [thread] = await db.select().from(threadsTable).where(eq(threadsTable.id, id));
  if (!thread) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    ...thread,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    lastMessageAt: thread.lastMessageAt?.toISOString() ?? null,
  });
});

router.patch("/threads/:threadId", async (req, res) => {
  const id = parseInt(req.params.threadId);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateThreadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [updated] = await db
    .update(threadsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(threadsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    lastMessageAt: updated.lastMessageAt?.toISOString() ?? null,
  });
});

router.delete("/threads/:threadId", async (req, res) => {
  const id = parseInt(req.params.threadId);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(threadsTable).where(eq(threadsTable.id, id));
  res.status(204).end();
});

export default router;
