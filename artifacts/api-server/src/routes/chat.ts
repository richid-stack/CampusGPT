import { Router } from "express";
import { z } from "zod";
import {
  APICallError,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  streamText,
  toUIMessageStream,
  type ModelMessage,
} from "ai";
import { db } from "@workspace/db";
import { messagesTable, threadsTable, documentsTable } from "@workspace/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { SYSTEM_PROMPT, WALK_WITH_ME_PROMPT } from "../lib/knowledgeBase.js";
import { findOwnedThread } from "../lib/ownership.js";
import { isNavigationIntent } from "../lib/campusLocations.js";
import { resolveCampusLocation, toNavDestination } from "../lib/campusLookup.js";
import { MODELS, MODEL_LABELS, providerOptionsFor, resolveChatModel, selectModel } from "../lib/chatModel.js";
import {
  CAMPUS_LOOKUP_TOOL,
  modelTextOfRow,
  partsToStore,
  textOfParts,
  toThinkingSeconds,
  type ChatMetadata,
  type ChatUIMessage,
} from "../lib/chatMessages.js";

const router = Router();

const HISTORY_MESSAGES = 16;
const MAX_IMAGES = 4;

/** What the browser may send: text and photos (as data URLs). */
const TextPart = z.object({ type: z.literal("text"), text: z.string().max(20_000) });
const ImagePart = z.object({
  type: z.literal("file"),
  mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  url: z.string().max(7_000_000).regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/),
  filename: z.string().max(200).optional(),
});
const ChatBody = z.object({
  trigger: z.enum(["submit-message", "regenerate-message"]).default("submit-message"),
  mode: z.string().max(20).optional(),
  message: z
    .object({ parts: z.array(z.union([TextPart, ImagePart])).min(1).max(MAX_IMAGES + 1) })
    .optional(),
});

function getCitations(text: string) {
  const query = text.toLowerCase();
  const citations: Array<{ title: string; url: string; snippet?: string }> = [];
  const add = (title: string, url: string, snippet: string) => {
    if (!citations.some((c) => c.title === title)) citations.push({ title, url, snippet });
  };

  if (/mis|registration|add.?drop|fees|course|ienabler/.test(query)) {
    add("UG MIS Web (iEnabler)", "https://ienabler.ug.edu.gh", "Course registration, add/drop, fees status, and residence registration.");
  }
  if (/sakai|turnitin|plagiarism|assignment|gradebook/.test(query)) {
    add("UG Sakai", "https://sakai.ug.edu.gh", "Lectures, assignments, quizzes, gradebook, and Turnitin submissions.");
  }
  if (/sltf|loan|financial aid/.test(query)) {
    add("Students Loan Trust Fund", "https://sltf.gov.gh", "Official SLTF applications, eligibility, and current loan guidance.");
  }
  if (/defer|herc|ugrc|sts portal/.test(query)) {
    add("UG STS Portal", "https://sts.ug.edu.gh", "Deferment forms and HERC/UGRC course registration.");
  }
  if (/fee|pay|account|bursary/.test(query)) {
    add("UG Academic Affairs — Schedule of Fees", "https://ug.edu.gh/aad/schedule-fees", "Use the official page for current fee schedules; amounts change.");
  }
  return citations;
}

/** A short, safe message for the student — details stay in the server log. */
function friendlyError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) return "The assistant is busy right now. Please try again in a moment.";
    if (error.statusCode === 401 || error.statusCode === 403) return "The assistant isn't set up correctly. Please tell the app owner.";
  }
  return "The assistant couldn't finish that answer. Please try again.";
}

router.post("/threads/:threadId/chat", async (req, res) => {
  const threadId = parseInt(req.params.threadId);
  if (isNaN(threadId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = ChatBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid message" }); return; }
  const { trigger, mode, message } = parsed.data;

  const incomingText = message ? textOfParts(message.parts).trim() : "";
  const images = (message?.parts ?? []).filter((p): p is z.infer<typeof ImagePart> => p.type === "file");
  if (trigger === "submit-message" && !incomingText && images.length === 0) {
    res.status(400).json({ error: "Missing content" });
    return;
  }
  if (!(await findOwnedThread(threadId, req.userId!))) { res.status(404).json({ error: "Not found" }); return; }

  // Stop generating when the student presses Stop or closes the tab.
  const abort = new AbortController();
  res.on("close", () => { if (!res.writableFinished) abort.abort(); });

  try {
    if (trigger === "regenerate-message") {
      // Drop the previous answer so the new one replaces it (no duplicate user turn).
      const [last] = await db
        .select({ id: messagesTable.id, role: messagesTable.role })
        .from(messagesTable)
        .where(eq(messagesTable.threadId, threadId))
        .orderBy(desc(messagesTable.createdAt), desc(messagesTable.id))
        .limit(1);
      if (last?.role === "assistant") {
        await db.delete(messagesTable).where(and(eq(messagesTable.id, last.id), eq(messagesTable.threadId, threadId)));
      }
    } else {
      const userParts = message!.parts.filter((p) => p.type === "text");
      await db.insert(messagesTable).values({
        threadId,
        role: "user",
        content: incomingText || "[image]",
        parts: userParts,
      });
    }
    await db.update(threadsTable)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(threadsTable.id, threadId));

    // Newest messages, restored to chronological order. (Ordering ascending
    // with a limit returns the *first* rows, so long chats never saw the latest turns.)
    const recentRows = await db
      .select().from(messagesTable)
      .where(eq(messagesTable.threadId, threadId))
      .orderBy(desc(messagesTable.createdAt), desc(messagesTable.id))
      .limit(HISTORY_MESSAGES);
    const history = recentRows.reverse();

    // The question being answered is the newest user turn.
    const lastUserRow = [...history].reverse().find((m) => m.role === "user");
    const questionText = incomingText || (lastUserRow ? modelTextOfRow(lastUserRow.content) : "");
    const hasImage = images.length > 0;

    const modelKey = selectModel(questionText, mode, hasImage);
    const modelId = MODELS[modelKey];
    const modelLabel = MODEL_LABELS[modelId] ?? modelId;

    const uploadedDocs = await db
      .select({ name: documentsTable.name, type: documentsTable.type, pageCount: documentsTable.pageCount })
      .from(documentsTable)
      .where(eq(documentsTable.userId, req.userId!))
      .orderBy(asc(documentsTable.createdAt));
    const documentContext = uploadedDocs.length
      ? `\n\n## Student Documents Available in This Workspace\n${uploadedDocs.map((d) => `- ${d.name} (${d.type}${d.pageCount ? `, ${d.pageCount} pages` : ""})`).join("\n")}\nThese documents persist across conversations. If a student asks about one, say whether you have enough extracted content to answer; do not invent document text.`
      : "";
    const basePrompt = (mode === "walk" ? WALK_WITH_ME_PROMPT : SYSTEM_PROMPT) + documentContext;

    // Earlier turns are plain text.
    const messages: ModelMessage[] = history
      .map((m): ModelMessage => ({ role: m.role as "user" | "assistant", content: modelTextOfRow(m.content) }))
      .filter((m) => m.content !== "");

    // The newest user turn also carries any photos.
    if (hasImage && messages.length > 0 && messages[messages.length - 1].role === "user") {
      messages[messages.length - 1] = {
        role: "user",
        content: [
          ...(incomingText ? [{ type: "text" as const, text: incomingText }] : []),
          ...images.map((img) => ({
            type: "file" as const,
            mediaType: img.mediaType,
            data: img.url.slice(img.url.indexOf(",") + 1),
          })),
        ],
      };
    }

    const navIntent = !hasImage && isNavigationIntent(questionText);
    const metadata: ChatMetadata = { model: modelId, modelLabel };
    let thinkingMs = 0;

    const stream = createUIMessageStream<ChatUIMessage>({
      onError: (error) => {
        req.log?.error({ err: error }, "Chat stream error");
        return friendlyError(error);
      },
      execute: async ({ writer }) => {
        writer.write({ type: "start", messageMetadata: metadata });

        // Step 1 (only for "where is…" questions): look the place up for real,
        // so the trace shows it and the answer uses verified details.
        let placeContext = "";
        if (navIntent) {
          const toolCallId = `lookup-${Date.now()}`;
          writer.write({ type: "tool-input-available", toolCallId, toolName: CAMPUS_LOOKUP_TOOL, input: { query: questionText } });
          const place = await resolveCampusLocation(questionText, abort.signal);
          writer.write({ type: "tool-output-available", toolCallId, output: place ? toNavDestination(place) : null });
          if (place) {
            placeContext = `\n\n## Verified campus place\nThe student is asking about a place we have verified data for. Use these details and do not contradict them. A map card with directions is shown under your answer, so do not print coordinates.\n${JSON.stringify(toNavDestination(place), null, 2)}`;
          }
        }

        const result = streamText({
          model: resolveChatModel(modelId),
          instructions: basePrompt + placeContext,
          messages,
          temperature: 0.5,
          // Groq counts thinking tokens against this limit, so leave room for the answer.
          maxOutputTokens: 8192,
          providerOptions: providerOptionsFor(modelKey),
          abortSignal: abort.signal,
        });

        // Time how long the model spends reasoning (shown as "Thought for N seconds").
        let reasoningSince: number | null = null;
        const timed = result.stream.pipeThrough(
          new TransformStream({
            transform(part, controller) {
              if (part.type === "reasoning-start" && reasoningSince === null) reasoningSince = Date.now();
              if (part.type !== "reasoning-start" && part.type !== "reasoning-delta" && reasoningSince !== null) {
                thinkingMs += Date.now() - reasoningSince;
                reasoningSince = null;
              }
              controller.enqueue(part);
            },
          }),
        );

        const ui = toUIMessageStream<never, ChatUIMessage>({
          stream: timed,
          sendStart: false,
          sendFinish: false,
          sendReasoning: true,
          onError: (error) => {
            req.log?.error({ err: error }, "Model error");
            return friendlyError(error);
          },
        });
        const reader = ui.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          writer.write(value);
        }

        // Official links that match the question, shown as sources.
        getCitations(questionText).forEach((c, i) => {
          writer.write({
            type: "source-url",
            sourceId: `campus-${i}`,
            url: c.url,
            title: c.title,
            providerMetadata: { campusgpt: { snippet: c.snippet ?? "" } },
          });
        });

        writer.write({
          type: "finish",
          messageMetadata: { ...metadata, ...(thinkingMs > 0 ? { thinkingSeconds: toThinkingSeconds(thinkingMs) } : {}) },
        });
      },
      onEnd: async ({ responseMessage }) => {
        try {
          const parts = partsToStore(responseMessage.parts);
          const text = textOfParts(parts);
          // Nothing to keep if the student stopped before any answer appeared.
          if (!text.trim()) return;
          await db.insert(messagesTable).values({
            threadId,
            role: "assistant",
            content: text,
            model: modelId,
            thinkingSeconds: thinkingMs > 0 ? toThinkingSeconds(thinkingMs) : null,
            parts,
            citations: getCitations(questionText),
          });
          await db.update(threadsTable)
            .set({ lastMessageAt: new Date(), updatedAt: new Date() })
            .where(eq(threadsTable.id, threadId));
        } catch (err) {
          req.log?.error({ err }, "Failed to save assistant message");
        }
      },
    });

    await pipeUIMessageStreamToResponse({
      response: res,
      stream,
      headers: { "X-Accel-Buffering": "no", "Cache-Control": "no-cache, no-transform" },
    });
  } catch (err) {
    req.log?.error({ err }, "Chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service error" });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});

export default router;
