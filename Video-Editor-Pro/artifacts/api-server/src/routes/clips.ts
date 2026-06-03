import { Router } from "express";
import { db } from "@workspace/db";
import { clipsTable, projectsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateClipBody, UpdateClipBody } from "@workspace/api-zod";

const router = Router();

router.get("/projects/:id/clips", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const clips = await db
      .select()
      .from(clipsTable)
      .where(eq(clipsTable.projectId, projectId))
      .orderBy(asc(clipsTable.trackIndex), asc(clipsTable.startTime));
    res.json(clips);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list clips" });
  }
});

router.post("/projects/:id/clips", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const body = CreateClipBody.parse(req.body);
    const [clip] = await db.insert(clipsTable).values({
      projectId,
      name: body.name,
      type: body.type as "video" | "audio" | "image" | "text",
      startTime: body.startTime,
      duration: body.duration,
      trackIndex: body.trackIndex,
      sourceUrl: body.sourceUrl,
      volume: body.volume ?? 1,
      opacity: body.opacity ?? 1,
      effects: body.effects ?? [],
      transition: body.transition,
      textContent: body.textContent,
      textStyle: body.textStyle ?? null,
    }).returning();

    await db
      .update(projectsTable)
      .set({ updatedAt: new Date() })
      .where(eq(projectsTable.id, projectId));

    res.status(201).json(clip);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Failed to create clip" });
  }
});

router.put("/projects/:id/clips/:clipId", async (req, res) => {
  try {
    const clipId = Number(req.params.clipId);
    const projectId = Number(req.params.id);
    const body = UpdateClipBody.parse(req.body);
    const [clip] = await db
      .update(clipsTable)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.trackIndex !== undefined && { trackIndex: body.trackIndex }),
        ...(body.sourceUrl !== undefined && { sourceUrl: body.sourceUrl }),
        ...(body.volume !== undefined && { volume: body.volume }),
        ...(body.opacity !== undefined && { opacity: body.opacity }),
        ...(body.effects !== undefined && { effects: body.effects }),
        ...(body.transition !== undefined && { transition: body.transition }),
        ...(body.textContent !== undefined && { textContent: body.textContent }),
        ...(body.textStyle !== undefined && { textStyle: body.textStyle ?? null }),
      })
      .where(eq(clipsTable.id, clipId))
      .returning();
    if (!clip) return void res.status(404).json({ error: "Clip not found" });

    await db
      .update(projectsTable)
      .set({ updatedAt: new Date() })
      .where(eq(projectsTable.id, projectId));

    res.json(clip);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Failed to update clip" });
  }
});

router.delete("/projects/:id/clips/:clipId", async (req, res) => {
  try {
    const clipId = Number(req.params.clipId);
    await db.delete(clipsTable).where(eq(clipsTable.id, clipId));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete clip" });
  }
});

export default router;
