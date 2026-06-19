import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfileTable = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  year: integer("year").notNull().default(1),
  degree: text("degree").notNull(),
  faculty: text("faculty").notNull(),
  hall: text("hall"),
  advisor: text("advisor"),
  interests: jsonb("interests").default([]),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfileTable).omit({ id: true, createdAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfileTable.$inferSelect;
