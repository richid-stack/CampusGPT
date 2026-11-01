import Groq from "groq-sdk";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("GROQ_API_KEY is not set. Add it to your .env to enable AI features.");
    this.name = "AiNotConfiguredError";
  }
}

let client: Groq | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

/** Lazily create the Groq client so the server can boot (and the rest of the
 *  app can run) without an API key. */
export function getGroq(): Groq {
  if (!process.env.GROQ_API_KEY) throw new AiNotConfiguredError();
  return (client ??= new Groq({ apiKey: process.env.GROQ_API_KEY }));
}
