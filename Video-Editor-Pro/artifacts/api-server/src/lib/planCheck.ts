import { stripeStorage } from "./stripeStorage";
import { getStripeClient } from "./stripeClient";

export type PlanTier = "free" | "creator" | "pro";

export async function getUserPlanTier(clerkId: string | undefined): Promise<PlanTier> {
  if (!clerkId) return "free";

  try {
    const user = await stripeStorage.getUserByClerkId(clerkId);
    if (!user?.stripeSubscriptionId) return "free";

    const stripe = getStripeClient();
    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
      expand: ["items.data.price.product"],
    });

    if (sub.status !== "active" && sub.status !== "trialing") return "free";

    const product = sub.items.data[0]?.price?.product as { name?: string } | undefined;
    const name = (product?.name ?? "").toLowerCase();

    if (name.includes("pro")) return "pro";
    if (name.includes("creator")) return "creator";

    return "creator";
  } catch {
    return "free";
  }
}

export function requirePlan(
  userTier: PlanTier,
  required: PlanTier,
): boolean {
  const rank: Record<PlanTier, number> = { free: 0, creator: 1, pro: 2 };
  return rank[userTier] >= rank[required];
}
