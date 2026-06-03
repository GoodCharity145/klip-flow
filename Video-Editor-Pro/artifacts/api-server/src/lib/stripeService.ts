import { stripeStorage } from "./stripeStorage";
import { getStripeClient } from "./stripeClient";

export class StripeService {
  async createCustomer(email: string, clerkId: string) {
    const stripe = getStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { clerkId },
    });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>,
  ) {
    const stripe = getStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(metadata ? { metadata } : {}),
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = getStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getSubscription(subscriptionId: string) {
    return await stripeStorage.getSubscription(subscriptionId);
  }
}

export const stripeService = new StripeService();
