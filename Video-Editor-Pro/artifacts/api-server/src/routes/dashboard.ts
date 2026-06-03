import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, clipsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(projectsTable);
    const [{ drafts }] = await db
      .select({ drafts: count() })
      .from(projectsTable)
      .where(eq(projectsTable.status, "draft"));
    const [{ completed }] = await db
      .select({ completed: count() })
      .from(projectsTable)
      .where(eq(projectsTable.status, "completed"));
    const [{ totalClips }] = await db.select({ totalClips: count() }).from(clipsTable);

    const durationResult = await db.select({ dur: sql<number>`coalesce(sum(duration), 0)` }).from(projectsTable);
    const totalDuration = Number(durationResult[0]?.dur ?? 0);

    res.json({
      totalProjects: Number(total),
      draftProjects: Number(drafts),
      completedProjects: Number(completed),
      totalClips: Number(totalClips),
      totalEditingHours: Math.round((totalDuration / 3600) * 10) / 10,
      storageUsedGb: Math.round(Number(totalClips) * 0.15 * 10) / 10,
      storageCapacityGb: 50,
      currentPlan: "Creator",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

router.get("/dashboard/recent-projects", async (req, res) => {
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.updatedAt))
      .limit(6);

    const withClipCounts = await Promise.all(
      projects.map(async (project) => {
        const [{ value: clipCount }] = await db
          .select({ value: count() })
          .from(clipsTable)
          .where(eq(clipsTable.projectId, project.id));
        return { ...project, clipCount: Number(clipCount) };
      })
    );

    res.json(withClipCounts);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get recent projects" });
  }
});

export default router;
