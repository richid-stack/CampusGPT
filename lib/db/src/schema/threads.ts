import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const threadsTable = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  space: text("space").notNull().default("my_campus"),
  pinned: boolean("pinned").notNull().default(false),
  saved: boolean("saved").notNull().default(false),
  messageCount: integer("message_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertThreadSchema = createInsertSchema(threadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertThread = z.infer<typeof insertThreadSchema>;
export type Thread = typeof threadsTable.$inferSelect;
