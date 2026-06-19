import { Router } from "express";
import { db } from "@workspace/db";
import { plannerTable } from "@workspace/db";
import { eq, asc, and, gte, lte } from "drizzle-orm";
import { CreatePlannerItemBody, UpdatePlannerItemBody } from "@workspace/api-zod";

const router = Router();

const fmt = (p: typeof plannerTable.$inferSelect) => ({
  ...p,
  dueAt: p.dueAt.toISOString(),
  createdAt: p.createdAt.toISOString(),
});

router.get("/planner", async (_req, res) => {
  const items = await db.select().from(plannerTable).orderBy(asc(plannerTable.dueAt));
  res.json(items.map(fmt));
});

router.post("/planner", async (req, res) => {
  const parsed = CreatePlannerItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [item] = await db.insert(plannerTable).values({
    title: parsed.data.title,
    dueAt: new Date(parsed.data.dueAt),
    moduleCode: parsed.data.moduleCode,
    type: parsed.data.type,
    urgency: parsed.data.urgency ?? "medium",
    notes: parsed.data.notes,
  }).returning();
  res.status(201).json(fmt(item));
});

router.get("/planner/upcoming", async (_req, res) => {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const items = await db
    .select()
    .from(plannerTable)
    .where(and(
      gte(plannerTable.dueAt, now),
      lte(plannerTable.dueAt, sevenDays),
      eq(plannerTable.done, false)
    ))
    .orderBy(asc(plannerTable.dueAt));
  res.json(items.map(fmt));
});

router.patch("/planner/:itemId", async (req, res) => {
  const id = parseInt(req.params.itemId);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdatePlannerItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.dueAt) updateData.dueAt = new Date(parsed.data.dueAt);
  const [updated] = await db
    .update(plannerTable)
    .set(updateData)
    .where(eq(plannerTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(updated));
});

export default router;
