import type { GroqLanguageModelChatOptions } from "@ai-sdk/groq";
import { extractReasoningMiddleware, wrapLanguageModel, type LanguageModel } from "ai";
import { createProviderModel } from "./providerModel.js";

// ── Models confirmed available on Groq ─────────────────────────────────────
export const MODELS = {
  default: "openai/gpt-oss-120b", // flagship — complex reasoning, tools, multilingual
  fast: "openai/gpt-oss-20b",     // everyday quick replies
  vision: "qwen/qwen3.6-27b",     // image understanding
} as const;

export type ModelKey = keyof typeof MODELS;

export const MODEL_LABELS: Record<string, string> = {
  "openai/gpt-oss-120b": "GPT OSS · 120B",
  "openai/gpt-oss-20b": "GPT OSS · 20B",
  "qwen/qwen3.6-27b": "Qwen 3.6 · 27B",
};

const FAST_KEYWORDS = [
  "hi", "hello", "thanks", "okay", "ok", "bye", "yes", "no",
  "sure", "got it", "what is", "who is", "when is", "where is",
];

export function selectModel(content: string, requestedMode?: string, hasImage?: boolean): ModelKey {
  if (hasImage) return "vision";
  if (requestedMode === "fast" || requestedMode === "walk") return "fast";
  if (requestedMode === "default" || requestedMode === "smart") return "default";
  // Short simple queries → fast
  const lower = content.toLowerCase().trim();
  if (content.length < 60 && FAST_KEYWORDS.some((k) => lower.startsWith(k))) return "fast";
  return "default";
}

/**
 * How hard each model should think. GPT OSS always reasons, so we only choose
 * the effort. Qwen needs `parsed` so its reasoning arrives as its own field
 * instead of `<think>` tags inside the answer; for photo questions we switch
 * its reasoning off to keep them quick.
 */
export function providerOptionsFor(key: ModelKey): { groq: GroqLanguageModelChatOptions } {
  switch (key) {
    case "default":
      return { groq: { reasoningEffort: "medium" } };
    case "fast":
      return { groq: { reasoningEffort: "low" } };
    case "vision":
      return { groq: { reasoningFormat: "parsed", reasoningEffort: "none" } };
  }
}

/**
 * The model used to answer. Reasoning that a model writes inline as
 * `<think>…</think>` is lifted into proper reasoning parts (this also copes
 * with a tag split across chunks), so it never leaks into the answer.
 */
export function resolveChatModel(modelId: string): LanguageModel {
  return wrapLanguageModel({
    model: createProviderModel(modelId),
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  });
}

/** Cheap model for short side jobs (e.g. extracting a place name). */
export function resolveFastModel(): LanguageModel {
  return resolveChatModel(MODELS.fast);
}
