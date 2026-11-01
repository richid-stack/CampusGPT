import { pgTable, serial, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { userTable } from "./auth";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => userTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("system"),
  read: boolean("read").notNull().default(false),
  urgency: text("urgency").notNull().default("low"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("notifications_user_id_idx").on(t.userId)]);

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
