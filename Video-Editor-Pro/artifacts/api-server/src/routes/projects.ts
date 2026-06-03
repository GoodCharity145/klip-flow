import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, clipsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { CreateProjectBody, UpdateProjectBody } from "@workspace/api-zod";

const router = Router();

router.get("/projects", async (req, res) => {
  try {
    const { status, limit = "20", offset = "0" } = req.query as Record<string, string>;
    const allProjects = await db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt));

    const filtered = status
      ? allProjects.filter((p) => p.status === status)
      : allProjects;

    const sliced = filtered.slice(Number(offset), Number(offset) + Number(limit));

    const withClipCounts = await Promise.all(
      sliced.map(async (project) => {
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
    res.status(500).json({ error: "Failed to list projects" });
  }
});

router.post("/projects", async (req, res) => {
  try {
    const body = CreateProjectBody.parse(req.body);
    const [project] = await db.insert(projectsTable).values({
      name: body.name,
      description: body.description,
      aspectRatio: (body.aspectRatio ?? "16:9") as "16:9" | "9:16" | "1:1" | "4:3",
      resolution: (body.resolution ?? "1080p") as "720p" | "1080p" | "4K",
    }).returning();
    res.status(201).json({ ...project, clipCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Failed to create project" });
  }
});

router.get("/projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!project) return void res.status(404).json({ error: "Project not found" });

    const [{ value: clipCount }] = await db
      .select({ value: count() })
      .from(clipsTable)
      .where(eq(clipsTable.projectId, id));

    res.json({ ...project, clipCount: Number(clipCount) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get project" });
  }
});

router.put("/projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = UpdateProjectBody.parse(req.body);
    const [project] = await db
      .update(projectsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(projectsTable.id, id))
      .returning();
    if (!project) return void res.status(404).json({ error: "Project not found" });

    const [{ value: clipCount }] = await db
      .select({ value: count() })
      .from(clipsTable)
      .where(eq(clipsTable.projectId, id));

    res.json({ ...project, clipCount: Number(clipCount) });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Failed to update project" });
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
