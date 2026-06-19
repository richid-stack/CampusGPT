import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateDocumentBody } from "@workspace/api-zod";

const router = Router();

const fmt = (d: typeof documentsTable.$inferSelect) => ({
  ...d,
  tags: (d.tags as string[]) ?? [],
  createdAt: d.createdAt.toISOString(),
});

router.get("/documents", async (_req, res) => {
  const docs = await db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt));
  res.json(docs.map(fmt));
});

router.post("/documents", async (req, res) => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [doc] = await db.insert(documentsTable).values({
    name: parsed.data.name,
    type: parsed.data.type,
    pageCount: parsed.data.pageCount,
    status: "ready",
  }).returning();
  res.status(201).json(fmt(doc));
});

router.delete("/documents/:documentId", async (req, res) => {
  const id = parseInt(req.params.documentId);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.status(204).end();
});

export default router;
