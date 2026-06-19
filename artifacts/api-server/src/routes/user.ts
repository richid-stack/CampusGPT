import { Router } from "express";
import { db } from "@workspace/db";
import { userProfileTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserProfileBody } from "@workspace/api-zod";

const router = Router();

const fmt = (u: typeof userProfileTable.$inferSelect) => ({
  ...u,
  interests: (u.interests as string[]) ?? [],
  createdAt: u.createdAt.toISOString(),
});

router.get("/user/profile", async (_req, res) => {
  const [user] = await db.select().from(userProfileTable).limit(1);
  if (!user) { res.status(404).json({ error: "No profile" }); return; }
  res.json(fmt(user));
});

router.patch("/user/profile", async (req, res) => {
  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [existing] = await db.select().from(userProfileTable).limit(1);
  if (!existing) { res.status(404).json({ error: "No profile" }); return; }
  const [updated] = await db
    .update(userProfileTable)
    .set(parsed.data)
    .where(eq(userProfileTable.id, existing.id))
    .returning();
  res.json(fmt(updated));
});

export default router;
