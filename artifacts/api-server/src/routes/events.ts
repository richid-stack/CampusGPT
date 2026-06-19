import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router = Router();

router.get("/events", async (_req, res) => {
  const events = await db.select().from(eventsTable).orderBy(asc(eventsTable.startAt));
  res.json(events.map(e => ({
    ...e,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;
