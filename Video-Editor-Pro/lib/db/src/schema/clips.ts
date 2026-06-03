import { pgTable, serial, text, real, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const clipTypeEnum = pgEnum("clip_type", ["video", "audio", "image", "text"]);

export const clipsTable = pgTable("clips", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: clipTypeEnum("type").notNull(),
  startTime: real("start_time").notNull().default(0),
  duration: real("duration").notNull().default(5),
  trackIndex: integer("track_index").notNull().default(0),
  sourceUrl: text("source_url"),
  volume: real("volume").notNull().default(1),
  opacity: real("opacity").notNull().default(1),
  effects: text("effects").array().notNull().default([]),
  transition: text("transition"),
  textContent: text("text_content"),
  textStyle: jsonb("text_style"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClipSchema = createInsertSchema(clipsTable).omit({ id: true, createdAt: true });
export type InsertClip = z.infer<typeof insertClipSchema>;
export type Clip = typeof clipsTable.$inferSelect;
