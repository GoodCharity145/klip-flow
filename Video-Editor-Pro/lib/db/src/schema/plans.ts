import { pgTable, serial, text, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  yearlyPrice: real("yearly_price").notNull(),
  features: text("features").array().notNull().default([]),
  maxProjects: integer("max_projects"),
  maxExportResolution: text("max_export_resolution").notNull(),
  hasWatermark: boolean("has_watermark").notNull().default(false),
  hasAIFeatures: boolean("has_ai_features").notNull().default(false),
  storageGb: real("storage_gb").notNull(),
  popular: boolean("popular").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
