/**
 * POST /api/stt
 * Speech-to-text using Groq Whisper Large v3 Turbo.
 * Accepts: multipart/form-data with field `audio` (any audio file — webm, mp4, wav, etc.)
 * Returns: { transcript: string }
 */
import { Router } from "express";
import Groq from "groq-sdk";
import multer from "multer";
import { Readable } from "stream";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post("/stt", upload.single("audio"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No audio file provided" }); return; }

  try {
    const buffer = req.file.buffer;
    const mime   = req.file.mimetype || "audio/webm";
    const ext    = mime.split("/")[1]?.split(";")[0] ?? "webm";

    // Groq SDK needs a File-like object — wrap the buffer
    const blob = new Blob([buffer], { type: mime });
    const file = new File([blob], `audio.${ext}`, { type: mime });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "json",
    });

    res.json({ transcript: transcription.text ?? "" });
  } catch (err: any) {
    req.log?.error({ err }, "STT error");
    res.status(500).json({ error: "Transcription failed" });
  }
});

export default router;
