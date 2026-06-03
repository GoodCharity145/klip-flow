import express, { Router, type Request, type Response, type IRouter } from "express";
import { stripeStorage } from "../lib/stripeStorage";
import { stripeService } from "../lib/stripeService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/stripe/products-with-prices", async (_req: Request, res: Response) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices();
    const productsMap = new Map<string, {
      id: string;
      name: string;
      description: string | null;
      active: boolean;
      prices: { id: string; unit_amount: number; currency: string; recurring: unknown; active: boolean }[];
    }>();

    for (const row of rows as Record<string, unknown>[]) {
      const productId = row.product_id as string;
      if (!productsMap.has(productId)) {
        productsMap.set(productId, {
          id: productId,
          name: row.product_name as string,
          description: row.product_description as string | null,
          active: row.product_active as boolean,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(productId)!.prices.push({
          id: row.price_id as string,
          unit_amount: row.unit_amount as number,
          currency: row.currency as string,
          recurring: row.recurring,
          active: row.price_active as boolean,
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: unknown) {
    logger.warn({ err }, "Stripe products not available");
    res.json({ data: [] });
  }
});

router.post("/stripe/checkout", async (req: Request, res: Response) => {
  try {
    const clerkId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
    if (!clerkId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { planName, priceId: directPriceId } = req.body as {
      planName?: string;
      priceId?: string;
    };

    let resolvedPriceId = directPriceId;

    if (!resolvedPriceId && planName) {
      const rows = await stripeStorage.listProductsWithPrices();
      const match = (rows as Record<string, unknown>[]).find(
        (r) => (r.product_name as string) === planName,
      );
      if (!match || !match.price_id) {
        res.status(404).json({ error: `No Stripe price found for plan: ${planName}` });
        return;
      }
      resolvedPriceId = match.price_id as string;
    }

    if (!resolvedPriceId) {
      res.status(400).json({ error: "priceId or planName required" });
      return;
    }

    let user = await stripeStorage.getUserByClerkId(clerkId);
    if (!user) {
      user = await stripeStorage.createUser({ clerkId, email: "" });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user.email || "", clerkId);
      await stripeStorage.updateUserStripeInfo(clerkId, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const host = req.get("host") ?? "";
    const proto = host.includes("localhost") ? "http" : "https";
    const origin = `${proto}://${host}`;

    const session = await stripeService.createCheckoutSession(
      customerId,
      resolvedPriceId,
      `${origin}/checkout/success`,
      `${origin}/pricing`,
      { clerkId },
    );

    res.json({ url: session.url });
  } catch (err: unknown) {
    logger.error({ err }, "Stripe checkout error");
    res.status(503).json({
      error: "Payment processing unavailable. Connect Stripe via the Integrations tab.",
    });
  }
});

router.get("/stripe/subscription", async (req: Request, res: Response) => {
  try {
    const clerkId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
    if (!clerkId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const user = await stripeStorage.getUserByClerkId(clerkId);
    if (!user?.stripeSubscriptionId) {
      res.json({ subscription: null });
      return;
    }
    const subscription = await stripeStorage.getSubscription(user.stripeSubscriptionId);
    res.json({ subscription });
  } catch (err: unknown) {
    logger.warn({ err }, "Stripe subscription not available");
    res.json({ subscription: null });
  }
});

router.get("/stripe/webhook-status", (_req: Request, res: Response) => {
  const configured = !!process.env.STRIPE_WEBHOOK_SECRET;
  res.json({ configured });
});

router.post("/stripe/portal", async (req: Request, res: Response) => {
  try {
    const clerkId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
    if (!clerkId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const user = await stripeStorage.getUserByClerkId(clerkId);
    if (!user?.stripeCustomerId) {
      res.status(404).json({ error: "No billing account found" });
      return;
    }
    const host = req.get("host") ?? "";
    const proto = host.includes("localhost") ? "http" : "https";
    const session = await stripeService.createCustomerPortalSession(
      user.stripeCustomerId,
      `${proto}://${host}/pricing`,
    );
    res.json({ url: session.url });
  } catch (err: unknown) {
    logger.error({ err }, "Stripe portal error");
    res.status(503).json({ error: "Billing portal unavailable" });
  }
});

export default router;
