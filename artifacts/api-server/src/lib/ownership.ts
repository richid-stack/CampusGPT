import { and, eq } from "drizzle-orm";
import { db, threadsTable } from "@workspace/db";

/** Returns the thread only if it belongs to this user. */
export async function findOwnedThread(threadId: number, userId: string) {
  const [thread] = await db
    .select()
    .from(threadsTable)
    .where(and(eq(threadsTable.id, threadId), eq(threadsTable.userId, userId)));
  return thread ?? null;
}
