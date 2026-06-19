import { Router } from "express";
import { db } from "@workspace/db";
import { timetableTable, plannerTable, userProfileTable } from "@workspace/db";
import { eq, gte, lte, and, asc } from "drizzle-orm";

const router = Router();

router.get("/digest/today", async (_req, res) => {
  const [user] = await db.select().from(userProfileTable).limit(1);
  const now = new Date();
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

  const todayEntries = await db
    .select()
    .from(timetableTable)
    .where(eq(timetableTable.dayOfWeek, dayOfWeek))
    .orderBy(asc(timetableTable.startTime));

  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = await db
    .select()
    .from(plannerTable)
    .where(and(
      gte(plannerTable.dueAt, now),
      lte(plannerTable.dueAt, sevenDays),
      eq(plannerTable.done, false)
    ))
    .orderBy(asc(plannerTable.dueAt))
    .limit(5);

  const hours = now.getHours();
  const greeting = hours < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening";
  const name = user?.name ?? "there";
  const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayOfWeek];

  const headsUp: string[] = [];
  if (upcomingDeadlines.length > 0) {
    headsUp.push(`${upcomingDeadlines.length} deadline${upcomingDeadlines.length > 1 ? "s" : ""} coming up this week`);
  }
  headsUp.push("Module bidding opens next week — your strategy is ready");
  headsUp.push("3 events match your interests this week");

  res.json({
    greeting: `${greeting}, ${name} · ${dayName}`,
    date: now.toISOString(),
    todayEntries: todayEntries,
    upcomingDeadlines: upcomingDeadlines.map(p => ({
      ...p,
      dueAt: p.dueAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
    headsUp,
    weather: "Partly cloudy, 28°C",
  });
});

export default router;
