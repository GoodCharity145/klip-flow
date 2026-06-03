import { pgTable, serial, text, real, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectStatusEnum = pgEnum("project_status", ["draft", "completed", "archived"]);
export const aspectRatioEnum = pgEnum("aspect_ratio", ["16:9", "9:16", "1:1", "4:3"]);
export const resolutionEnum = pgEnum("resolution", ["720p", "1080p", "4K"]);

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("draft"),
  thumbnailUrl: text("thumbnail_url"),
  duration: real("duration").notNull().default(0),
  aspectRatio: aspectRatioEnum("aspect_ratio").notNull().default("16:9"),
  resolution: resolutionEnum("resolution").notNull().default("1080p"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
