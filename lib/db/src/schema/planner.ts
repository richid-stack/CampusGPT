import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plannerTable = pgTable("planner", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  dueAt: timestamp("due_at").notNull(),
  moduleCode: text("module_code").notNull(),
  type: text("type").notNull().default("assignment"),
  done: boolean("done").notNull().default(false),
  urgency: text("urgency").notNull().default("medium"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlannerSchema = createInsertSchema(plannerTable).omit({ id: true, createdAt: true });
export type InsertPlannerItem = z.infer<typeof insertPlannerSchema>;
export type PlannerItem = typeof plannerTable.$inferSelect;
