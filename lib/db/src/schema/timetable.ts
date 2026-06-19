import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timetableTable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  moduleCode: text("module_code").notNull(),
  moduleName: text("module_name").notNull(),
  type: text("type").notNull().default("lecture"),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Mon, 6=Sun
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  venue: text("venue").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTimetableSchema = createInsertSchema(timetableTable).omit({ id: true, createdAt: true });
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;
export type TimetableEntry = typeof timetableTable.$inferSelect;
