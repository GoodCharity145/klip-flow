import { Router, type Request, type Response, type IRouter } from "express";
import { db, usersTable, referralsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { getStripeClient } from "../lib/stripeClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export const MILESTONES = [
  { count: 3,  level: "1", label: "Rising Star",  reward: "3 bonus months free",  stripe: { duration: "repeating" as const, duration_in_months: 3,  percent_off: 100 } },
  { count: 5,  level: "2", label: "Influencer",   reward: "6 bonus months free",  stripe: { duration: "repeating" as const, duration_in_months: 6,  percent_off: 100 } },
  { count: 10, level: "3", label: "Legend",        reward: "Pro for life 🎉",      stripe: { duration: "forever"   as const,                          percent_off: 100 } },
];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "KF-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function getOrCreateCode(clerkId: string): Promise<string> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) throw new Error("User not found");
  if (user.referralCode) return user.referralCode;

  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.referralCode, code));
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ referralCode: code })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();
  return updated.referralCode!;
}

router.get("/referral/code", async (req: Request, res: Response) => {
  const clerkId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
  if (!clerkId) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const code = await getOrCreateCode(clerkId);
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    const [completed] = await db
      .select({ count: count() })
      .from(referralsTable)
      .where(and(eq(referralsTable.referrerClerkId, clerkId), eq(referralsTable.status, "subscribed")));

    const completedCount = Number(completed?.count ?? 0);
    const milestoneLevel = Number(user?.referralMilestoneLevel ?? 0);

    res.json({
      code,
      link: `${baseUrl}/sign-up?ref=${code}`,
      completedCount,
      milestoneLevel,
      milestones: MILESTONES.map((m) => ({ count: m.count, label: m.label, reward: m.reward, level: m.level })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get referral code");
    res.status(500).json({ error: "Failed to get referral code" });
  }
});

router.get("/referral/public/:code", async (req: Request, res: Response) => {
  const code = String(req.params.code ?? "").toUpperCase().trim();
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  try {
    const [referrer] = await db.select().from(usersTable).where(eq(usersTable.referralCode, code));
    if (!referrer) { res.status(404).json({ error: "Invalid referral code" }); return; }

    const [completed] = await db
      .select({ count: count() })
      .from(referralsTable)
      .where(and(eq(referralsTable.referrerClerkId, referrer.clerkId), eq(referralsTable.status, "subscribed")));

    const completedCount = Number(completed?.count ?? 0);
    const milestoneLevel = Number(referrer.referralMilestoneLevel ?? 0);
    const namePart = referrer.email?.split("@")[0] ?? "A friend";

    res.json({
      referrerName: namePart,
      completedCount,
      milestoneLevel,
      milestones: MILESTONES.map(m => ({ count: m.count, label: m.label, reward: m.reward, level: m.level })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get public referral info");
    res.status(500).json({ error: "Failed to load referral info" });
  }
});

router.post("/referral/apply", async (req: Request, res: Response) => {
  const clerkId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
  if (!clerkId) { res.status(401).json({ error: "Authentication required" }); return; }
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  try {
    const [referrer] = await db.select().from(usersTable).where(eq(usersTable.referralCode, code.toUpperCase().trim()));
    if (!referrer) { res.status(404).json({ error: "Invalid referral code" }); return; }
    if (referrer.clerkId === clerkId) { res.status(400).json({ error: "Cannot refer yourself" }); return; }

    const [existing] = await db.select().from(referralsTable).where(eq(referralsTable.referredClerkId, clerkId));
    if (existing) { res.json({ success: true, alreadyApplied: true }); return; }

    await db.insert(referralsTable).values({ referrerClerkId: referrer.clerkId, referredClerkId: clerkId, status: "pending" });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to apply referral code");
    res.status(500).json({ error: "Failed to apply referral code" });
  }
});

export async function rewardReferralForUser(referredClerkId: string): Promise<void> {
  const [referral] = await db
    .select()
    .from(referralsTable)
    .where(and(eq(referralsTable.referredClerkId, referredClerkId), eq(referralsTable.status, "pending")));
  if (!referral) return;

  await db.update(referralsTable).set({ status: "subscribed" }).where(eq(referralsTable.id, referral.id));

  const [referrer] = await db.select().from(usersTable).where(eq(usersTable.clerkId, referral.referrerClerkId));
  if (!referrer?.stripeCustomerId) return;

  const stripe = getStripeClient();

  // Per-referral reward: 1 month free
  try {
    const coupon = await stripe.coupons.create({ percent_off: 100, duration: "once", name: "Referral reward — 1 month free", max_redemptions: 1 });
    await stripe.customers.update(referrer.stripeCustomerId, { coupon: coupon.id });
    logger.info({ referrerClerkId: referrer.clerkId }, "Per-referral coupon applied");
  } catch (err) {
    logger.error({ err }, "Failed to apply per-referral coupon");
  }

  // Check milestones
  const [completedRow] = await db
    .select({ count: count() })
    .from(referralsTable)
    .where(and(eq(referralsTable.referrerClerkId, referrer.clerkId), eq(referralsTable.status, "subscribed")));
  const totalCompleted = Number(completedRow?.count ?? 0);
  const currentMilestoneLevel = Number(referrer.referralMilestoneLevel ?? 0);

  const newMilestone = MILESTONES.slice()
    .reverse()
    .find((m) => totalCompleted >= m.count && Number(m.level) > currentMilestoneLevel);

  if (newMilestone) {
    try {
      const milestoneParams =
        newMilestone.stripe.duration === "forever"
          ? { percent_off: 100, duration: "forever" as const, name: `KlipFlow ${newMilestone.label} — ${newMilestone.reward}` }
          : {
              percent_off: 100,
              duration: "repeating" as const,
              duration_in_months: (newMilestone.stripe as { duration_in_months: number }).duration_in_months,
              name: `KlipFlow ${newMilestone.label} — ${newMilestone.reward}`,
            };
      const coupon = await stripe.coupons.create(milestoneParams);
      await stripe.customers.update(referrer.stripeCustomerId, { coupon: coupon.id });
      await db.update(usersTable).set({ referralMilestoneLevel: newMilestone.level }).where(eq(usersTable.clerkId, referrer.clerkId));
      logger.info({ referrerClerkId: referrer.clerkId, milestone: newMilestone.label }, "Milestone reward applied");
    } catch (err) {
      logger.error({ err }, "Failed to apply milestone coupon");
    }
  }
}

export default router;
