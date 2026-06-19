import { Router } from "express";
import { db } from "@workspace/db";
import { timetableTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";

const router = Router();

const fmt = (e: typeof timetableTable.$inferSelect) => ({
  ...e,
});

router.get("/timetable", async (_req, res) => {
  const entries = await db.select().from(timetableTable).orderBy(asc(timetableTable.dayOfWeek), asc(timetableTable.startTime));
  res.json(entries.map(fmt));
});

router.get("/timetable/today", async (_req, res) => {
  // 0=Monday in our schema, JS getDay() is 0=Sunday
  const jsDay = new Date().getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const entries = await db
    .select()
    .from(timetableTable)
    .where(eq(timetableTable.dayOfWeek, dayOfWeek))
    .orderBy(asc(timetableTable.startTime));
  res.json(entries.map(fmt));
});

export default router;
