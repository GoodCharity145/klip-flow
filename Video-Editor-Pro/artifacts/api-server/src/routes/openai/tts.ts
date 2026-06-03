import { Router, type Request } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ObjectStorageService } from "../../lib/objectStorage";
import { getUserPlanTier, requirePlan } from "../../lib/planCheck";
import { randomUUID } from "crypto";
import { join } from "path";
import { tmpdir } from "os";
import { writeFile, unlink } from "fs/promises";

const router = Router();
const objectStorage = new ObjectStorageService();

const VALID_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
type Voice = (typeof VALID_VOICES)[number];

router.post("/openai/tts", async (req, res) => {
  try {
    const clerkId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
    const tier = await getUserPlanTier(clerkId);
    if (!requirePlan(tier, "creator")) {
      res.status(402).json({ error: "AI Voiceover requires a Creator or Pro plan.", upgradeUrl: "/pricing" });
      return;
    }

    const { text, voice = "nova" } = req.body as { text?: string; voice?: string };
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "text is required" });
      return;
    }
    if (text.length > 4096) {
      res.status(400).json({ error: "Text exceeds 4096 characters" });
      return;
    }

    const safeVoice: Voice = VALID_VOICES.includes(voice as Voice) ? (voice as Voice) : "nova";

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: safeVoice,
      input: text.trim(),
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    // Estimate duration: ~150 words/min, ~3 chars/word
    const wordCount = text.trim().split(/\s+/).length;
    const estimatedDuration = Math.max(1, Math.round((wordCount / 150) * 60 * 10) / 10);

    const tmpPath = join(tmpdir(), `klipflow-tts-${randomUUID()}.mp3`);
    await writeFile(tmpPath, buffer);

    let objectPath: string;
    try {
      const result = await objectStorage.uploadFileToStorage(tmpPath, "audio/mpeg", "tts");
      objectPath = result.objectPath;
    } finally {
      await unlink(tmpPath).catch(() => {});
    }

    res.json({ objectPath, duration: estimatedDuration, voice: safeVoice });
  } catch (err) {
    req.log.error({ err }, "TTS generation failed");
    res.status(500).json({ error: "Failed to generate voiceover" });
  }
});

export default router;
