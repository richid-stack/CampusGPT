import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

/** A model object (not a gateway id string). */
export type ProviderModel = Exclude<LanguageModel, string>;
import { AiNotConfiguredError, isAiConfigured } from "./groq.js";

/** The raw model from the provider. Kept separate so tests can swap it out. */
export function createProviderModel(modelId: string): ProviderModel {
  if (!isAiConfigured()) throw new AiNotConfiguredError();
  return createGroq({ apiKey: process.env.GROQ_API_KEY })(modelId);
}
