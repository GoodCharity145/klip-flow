import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { clipsTable, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateCaptionsBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getUserPlanTier, requirePlan } from "../../lib/planCheck";

const router = Router();

router.post("/openai/captions", async (req, res) => {
  try {
    const clerkId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
    const tier = await getUserPlanTier(clerkId);
    if (!requirePlan(tier, "creator")) {
      res.status(402).json({
        error: "AI auto-captions require a Creator or Pro plan.",
        upgradeUrl: "/pricing",
      });
      return;
    }

    const body = GenerateCaptionsBody.parse(req.body);
    const { projectId, projectName, projectDescription, totalDuration, clipSummary } = body;

    const segmentDuration = 4;
    const numSegments = Math.max(3, Math.min(15, Math.round(totalDuration / segmentDuration)));

    const prompt = `You are generating auto-captions for a video editing project.

Project: "${projectName}"
${projectDescription ? `Description: ${projectDescription}` : ""}
${clipSummary ? `Content: ${clipSummary}` : ""}
Total duration: ${totalDuration} seconds

Generate exactly ${numSegments} caption segments evenly spaced across the video duration.
Each caption should be short (5-12 words max), natural-sounding, and relevant to the project context.
Return ONLY a JSON array with this exact structure, no other text:
[
  { "startTime": 0, "duration": 4, "text": "Caption text here" },
  ...
]

The startTime values should be evenly distributed from 0 to ${totalDuration - segmentDuration}.
Each duration should be between 3 and 5 seconds.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    let captions: { startTime: number; duration: number; text: string }[] = [];

    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      captions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      captions = [];
    }

    if (captions.length === 0) {
      const step = totalDuration / numSegments;
      captions = Array.from({ length: numSegments }, (_, i) => ({
        startTime: Math.round(i * step * 10) / 10,
        duration: 4,
        text: `${projectName} — part ${i + 1}`,
      }));
    }

    const existingClips = await db
      .select()
      .from(clipsTable)
      .where(eq(clipsTable.projectId, projectId));

    const existingCaptionTrack = existingClips.reduce(
      (max, c) => Math.max(max, c.trackIndex),
      -1
    ) + 1;

    const createdClips = [];
    for (const caption of captions) {
      const [clip] = await db.insert(clipsTable).values({
        projectId,
        name: `Caption: ${caption.text.slice(0, 30)}`,
        type: "text" as const,
        startTime: caption.startTime,
        duration: caption.duration,
        trackIndex: existingCaptionTrack,
        volume: 1,
        opacity: 1,
        effects: [],
        textContent: caption.text,
        textStyle: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.6)",
          position: "bottom",
        },
      }).returning();
      createdClips.push(clip);
    }

    await db
      .update(projectsTable)
      .set({ updatedAt: new Date() })
      .where(eq(projectsTable.id, projectId));

    res.json({ captions, createdClips });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate captions" });
  }
});

export default router;
