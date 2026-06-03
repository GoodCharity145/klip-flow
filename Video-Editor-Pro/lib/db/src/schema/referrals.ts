import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerClerkId: text("referrer_clerk_id").notNull(),
  referredClerkId: text("referred_clerk_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
export type InsertReferral = typeof referralsTable.$inferInsert;
