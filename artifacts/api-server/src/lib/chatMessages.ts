import type { UIMessage } from "ai";

/** Extra info the server attaches to every assistant message. */
export type ChatMetadata = {
  model?: string;
  modelLabel?: string;
  /** Whole seconds the model spent reasoning before answering. */
  thinkingSeconds?: number;
};

export type ChatUIMessage = UIMessage<ChatMetadata>;
export type ChatPart = ChatUIMessage["parts"][number];

/** Tool step shown in the trace when the assistant looks up a campus place. */
export const CAMPUS_LOOKUP_TOOL = "findCampusLocation";

/** Older assistant rows carry a navigation card as an HTML comment in their text. */
const NAV_TAG_RE = /<!--NAV:[\s\S]*?-->/g;

/** Plain text of a message: every text part, in order. */
export function textOfParts(parts: ReadonlyArray<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

/** Text of a stored row as the model should see it (no UI-only markers). */
export function modelTextOfRow(content: string): string {
  return content.replace(NAV_TAG_RE, "").trim();
}

/**
 * What we keep of a message in the database. Images are not stored (they are
 * large and only the model needs them), and transient `step-start` markers
 * carry no information.
 */
export function partsToStore(parts: ReadonlyArray<ChatPart>): ChatPart[] {
  return parts.filter((p) => p.type !== "file" && p.type !== "step-start");
}

/** Reasoning time rounded to whole seconds, never less than 1 once it happened. */
export function toThinkingSeconds(ms: number): number {
  return Math.max(1, Math.round(ms / 1000));
}
