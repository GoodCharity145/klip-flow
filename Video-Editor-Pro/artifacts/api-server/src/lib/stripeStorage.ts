import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { getStripeClient } from "./stripeClient";

export class StripeStorage {
  async listProductsWithPrices() {
    const stripe = getStripeClient();
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 20 }),
      stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] }),
    ]);

    type PriceRow = {
      product_id: string;
      product_name: string;
      product_description: string | null;
      product_active: boolean;
      price_id: string;
      unit_amount: number;
      currency: string;
      recurring: unknown;
      price_active: boolean;
    };

    const rows: PriceRow[] = [];
    for (const product of products.data) {
      const productPrices = prices.data.filter(
        (p) =>
          (typeof p.product === "string" ? p.product : p.product?.id) ===
          product.id,
      );
      if (productPrices.length === 0) {
        rows.push({
          product_id: product.id,
          product_name: product.name,
          product_description: product.description ?? null,
          product_active: product.active,
          price_id: "",
          unit_amount: 0,
          currency: "usd",
          recurring: null,
          price_active: false,
        });
      } else {
        for (const price of productPrices) {
          rows.push({
            product_id: product.id,
            product_name: product.name,
            product_description: product.description ?? null,
            product_active: product.active,
            price_id: price.id,
            unit_amount: price.unit_amount ?? 0,
            currency: price.currency,
            recurring: price.recurring,
            price_active: price.active,
          });
        }
      }
    }
    return rows;
  }

  async getSubscription(subscriptionId: string) {
    const stripe = getStripeClient();
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch {
      return null;
    }
  }

  async getUserByClerkId(clerkId: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId));
    return user || null;
  }

  async createUser(data: { clerkId: string; email: string }) {
    const [user] = await db
      .insert(usersTable)
      .values(data)
      .onConflictDoUpdate({
        target: usersTable.clerkId,
        set: { email: data.email },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(
    clerkId: string,
    stripeInfo: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string | null;
    },
  ) {
    const [user] = await db
      .update(usersTable)
      .set({ ...stripeInfo, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    return user;
  }

  async updateSubscriptionByCustomerId(
    customerId: string,
    data: { stripeSubscriptionId: string | null; status: string },
  ) {
    await db
      .update(usersTable)
      .set({
        stripeSubscriptionId: data.stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.stripeCustomerId, customerId));
  }
}

export const stripeStorage = new StripeStorage();
