import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";

const router = Router();

router.get("/notifications", async (req, res) => {
  const notifs = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, req.userId!)).orderBy(desc(notificationsTable.createdAt));
  res.json(notifs.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.patch("/notifications/:notificationId/read", async (req, res) => {
  const id = parseInt(req.params.notificationId);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId!)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;
