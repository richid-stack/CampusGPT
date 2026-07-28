/**
 * POST /api/tts
 * Text-to-speech using Groq Orpheus v1 English.
 * Body: { text: string }
 * Returns: audio/mpeg stream
 */
import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Max chars to send to TTS — truncate long AI responses for voice
const MAX_TTS_CHARS = 800;

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")       // bold
    .replace(/\*(.*?)\*/g, "$1")            // italic
    .replace(/#+\s/g, "")                   // headings
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")     // links → just text
    .replace(/`{1,3}[^`]*`{1,3}/g, "")     // code blocks
    .replace(/[⛔📍🎓📚🏛📋📅💳🔎]/gu, "")  // strip decorative emoji
    .replace(/\n{2,}/g, ". ")              // paragraph breaks → pause
    .replace(/\n/g, " ")
    .trim()
    .slice(0, MAX_TTS_CHARS);
}

router.post("/tts", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) { res.status(400).json({ error: "Missing text" }); return; }

  try {
    const cleaned = cleanForSpeech(text);

    const response = await groq.audio.speech.create({
      model: "canopylabs/orpheus-v1-english",
      input: cleaned,
      voice: "tara",               // natural English voice
      response_format: "mp3",
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.byteLength);
    res.setHeader("Cache-Control", "no-store");
    res.end(buffer);
  } catch (err: any) {
    req.log?.error({ err }, "TTS error");
    res.status(500).json({ error: "Speech synthesis failed" });
  }
});

export default router;
