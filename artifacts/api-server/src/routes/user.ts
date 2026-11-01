import { Router } from "express";
import { db } from "@workspace/db";
import { userProfileTable, userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserProfileBody } from "@workspace/api-zod";

const router = Router();

const fmt = (u: typeof userProfileTable.$inferSelect) => ({
  ...u,
  interests: (u.interests as string[]) ?? [],
  createdAt: u.createdAt.toISOString(),
});

/** Each signed-in user has one profile, created on first use from their account. */
async function getOrCreateProfile(userId: string) {
  const [existing] = await db.select().from(userProfileTable).where(eq(userProfileTable.userId, userId));
  if (existing) return existing;

  const [account] = await db.select().from(userTable).where(eq(userTable.id, userId));
  if (!account) return null;

  const [created] = await db
    .insert(userProfileTable)
    .values({ userId, name: account.name, email: account.email })
    .onConflictDoNothing({ target: userProfileTable.userId })
    .returning();
  if (created) return created;
  // Lost a race with a concurrent request; read the winner.
  const [winner] = await db.select().from(userProfileTable).where(eq(userProfileTable.userId, userId));
  return winner ?? null;
}

router.get("/user/profile", async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);
  if (!profile) { res.status(404).json({ error: "No profile" }); return; }
  res.json(fmt(profile));
});

router.patch("/user/profile", async (req, res) => {
  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const existing = await getOrCreateProfile(req.userId!);
  if (!existing) { res.status(404).json({ error: "No profile" }); return; }
  // email comes from the verified account and is not editable here.
  const { email: _ignored, ...changes } = parsed.data as Record<string, unknown>;
  const [updated] = await db
    .update(userProfileTable)
    .set(changes)
    .where(eq(userProfileTable.id, existing.id))
    .returning();
  res.json(fmt(updated));
});

export default router;
