import { Router } from "express";
import Groq from "groq-sdk";
import { db } from "@workspace/db";
import { messagesTable, threadsTable, documentsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { SYSTEM_PROMPT, WALK_WITH_ME_PROMPT } from "../lib/knowledgeBase.js";
import { isNavigationIntent, findLocationByName, CAMPUS_LOCATIONS } from "../lib/campusLocations.js";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Models confirmed available on Groq ─────────────────────────────────────
const MODELS = {
  default: "openai/gpt-oss-120b",   // flagship — complex reasoning, tools, multilingual
  fast:    "openai/gpt-oss-20b",    // everyday quick replies
  vision:  "qwen/qwen3.6-27b",      // image understanding
};

const MODEL_LABELS: Record<string, string> = {
  "openai/gpt-oss-120b": "GPT OSS · 120B",
  "openai/gpt-oss-20b":  "GPT OSS · 20B",
  "qwen/qwen3.6-27b":    "Qwen 3.6 · 27B",
};

const FAST_KEYWORDS = [
  "hi", "hello", "thanks", "okay", "ok", "bye", "yes", "no",
  "sure", "got it", "what is", "who is", "when is", "where is",
];

function selectModel(content: string, requestedMode?: string, hasImage?: boolean): keyof typeof MODELS {
  if (hasImage) return "vision";
  if (requestedMode === "fast" || requestedMode === "walk") return "fast";
  if (requestedMode === "default" || requestedMode === "smart") return "default";
  // Short simple queries → fast
  const lower = content.toLowerCase().trim();
  if (content.length < 60 && FAST_KEYWORDS.some(k => lower.startsWith(k))) return "fast";
  return "default";
}

/** Strip Qwen <think>…</think> chain-of-thought from stream output.
 * The final few characters are held back to detect a split `<think>` tag,
 * so callers must flush the filter after the provider closes the stream.
 */
function makeThinkFilter() {
  let buf = "";
  let inThink = false;
  function filter(delta: string): string {
    buf += delta;
    let out = "";
    while (true) {
      if (!inThink) {
        const start = buf.indexOf("<think>");
        if (start === -1) {
          const guard = Math.max(0, buf.length - 7);
          out += buf.slice(0, guard);
          buf = buf.slice(guard);
          break;
        }
        out += buf.slice(0, start);
        buf = buf.slice(start + 7);
        inThink = true;
      } else {
        const end = buf.indexOf("</think>");
        if (end === -1) { buf = ""; break; }
        buf = buf.slice(end + 8);
        inThink = false;
      }
    }
    return out;
  }
  function flush(): string {
    if (inThink) {
      buf = "";
      return "";
    }
    const out = buf;
    buf = "";
    return out;
  }
  return { filter, flush };
}

function getCitations(text: string) {
  const query = text.toLowerCase();
  const citations: Array<{ title: string; url: string; snippet?: string }> = [];
  const add = (title: string, url: string, snippet: string) => {
    if (!citations.some(c => c.title === title)) citations.push({ title, url, snippet });
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

router.post("/threads/:threadId/chat", async (req, res) => {
  const threadId = parseInt(req.params.threadId);
  if (isNaN(threadId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { content, mode, imageBase64, imageMime } = req.body as {
    content?: string;
    mode?: string;
    imageBase64?: string;   // base64-encoded image from frontend
    imageMime?: string;     // e.g. "image/jpeg"
  };
  if (!content?.trim() && !imageBase64) { res.status(400).json({ error: "Missing content" }); return; }

  const text = content?.trim() ?? "";
  const hasImage = !!imageBase64;

  // ── Detect navigation intent early (runs in parallel with AI stream) ──────
  const navIntent = !hasImage && isNavigationIntent(text);
  let navLocationPromise: Promise<ReturnType<typeof findLocationByName>> | null = null;

  if (navIntent) {
    navLocationPromise = (async () => {
      // 1. Try direct alias matching first (fast, no API call)
      const direct = findLocationByName(text);
      if (direct) return direct;

      // 2. Ask the fast model to extract just the destination name
      try {
        const extraction = await groq.chat.completions.create({
          model: MODELS.fast,
          messages: [
            {
              role: "system",
              content: `You extract campus location names from user queries about University of Ghana, Legon.
Known locations: ${CAMPUS_LOCATIONS.map(l => l.name).join(", ")}.
Reply with ONLY the location name — nothing else. If unsure, reply with the most likely match.`,
            },
            { role: "user", content: text },
          ],
          stream: false,
          max_tokens: 20,
          temperature: 0,
        });
        const extracted = extraction.choices[0]?.message?.content?.trim() ?? "";
        return extracted ? findLocationByName(extracted) : null;
      } catch {
        return null;
      }
    })();
  }

  try {
    await db.insert(messagesTable).values({ threadId, role: "user", content: text || "[image]" });
    await db.update(threadsTable)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(threadsTable.id, threadId));

    const history = await db
      .select().from(messagesTable)
      .where(eq(messagesTable.threadId, threadId))
      .orderBy(asc(messagesTable.createdAt))
      .limit(20);

    const modelKey = selectModel(text, mode, hasImage);
    const modelId  = MODELS[modelKey];
    const uploadedDocs = await db
      .select({ name: documentsTable.name, type: documentsTable.type, pageCount: documentsTable.pageCount })
      .from(documentsTable)
      .orderBy(asc(documentsTable.createdAt));
    const documentContext = uploadedDocs.length
      ? `\n\n## Student Documents Available in This Workspace\n${uploadedDocs.map(d => `- ${d.name} (${d.type}${d.pageCount ? `, ${d.pageCount} pages` : ""})`).join("\n")}\nThese documents persist across conversations. If a student asks about one, say whether you have enough extracted content to answer; do not invent document text.`
      : "";
    const systemPrompt = (mode === "walk" ? WALK_WITH_ME_PROMPT : SYSTEM_PROMPT) + documentContext;

    // Build message history — earlier turns are plain text
    const historyMessages: Groq.Chat.ChatCompletionMessageParam[] = history
      .slice(-8)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Replace the last user message with vision content if an image was sent
    let userMessage: Groq.Chat.ChatCompletionMessageParam;
    if (hasImage) {
      userMessage = {
        role: "user",
        content: [
          ...(text ? [{ type: "text" as const, text }] : []),
          {
            type: "image_url" as const,
            image_url: { url: `data:${imageMime ?? "image/jpeg"};base64,${imageBase64}` },
          },
        ],
      };
      // Remove last history entry (the one we just inserted as plain text) and replace with vision
      historyMessages.pop();
      historyMessages.push(userMessage);
    }

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const stream = await groq.chat.completions.create({
      model: modelId,
      messages,
      stream: true,
      max_tokens: 4096,
      temperature: 0.5,
    });

    const thinkFilter = makeThinkFilter();
    let fullContent = "";

    for await (const chunk of stream) {
      const raw = chunk.choices[0]?.delta?.content ?? "";
      if (!raw) continue;
      const safe = thinkFilter.filter(raw);
      if (safe) {
        fullContent += safe;
        res.write(`data: ${JSON.stringify({ delta: safe })}\n\n`);
      }
    }
    const tail = thinkFilter.flush();
    if (tail) {
      fullContent += tail;
      res.write(`data: ${JSON.stringify({ delta: tail })}\n\n`);
    }

    // ── Resolve navigation card (parallel promise was already running) ──────
    const navLocation = navLocationPromise ? await navLocationPromise : null;
    const navData = navLocation
      ? {
          id: navLocation.id,
          name: navLocation.name,
          lat: navLocation.lat,
          lng: navLocation.lng,
          description: navLocation.description,
          address: navLocation.address,
          category: navLocation.category,
          nearbyLandmarks: navLocation.nearbyLandmarks,
          contact: navLocation.contact,
          hours: navLocation.hours,
          services: navLocation.services,
        }
      : null;

    // Persist navigationCard data embedded in the assistant message content
    const navTag = navData ? `\n\n<!--NAV:${JSON.stringify(navData)}-->` : "";
    const savedContent = fullContent + navTag;

    await db.insert(messagesTable).values({
      threadId,
      role: "assistant",
      content: savedContent,
      citations: getCitations(text),
    });
    await db.update(threadsTable)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(threadsTable.id, threadId));

    const label = MODEL_LABELS[modelId] ?? modelId;

    // Emit navigationCard event BEFORE done so frontend can render card
    if (navData) {
      res.write(`data: ${JSON.stringify({ navigationCard: navData })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true, model: modelId, modelLabel: label, mode: modelKey })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log?.error({ err }, "Chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

export default router;
