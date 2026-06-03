import { getStripeClient, getWebhookSecret } from "./stripeClient";
import { stripeStorage } from "./stripeStorage";
import { logger } from "./logger";
import { sendPaymentFailedEmail, sendSubscriptionCancelledEmail } from "./emailService";
import { rewardReferralForUser } from "../routes/referral";
import type Stripe from "stripe";

async function getCustomerEmail(
  stripe: ReturnType<typeof getStripeClient>,
  customerId: string,
): Promise<{ email: string | null; name: string | null }> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return { email: null, name: null };
    return {
      email: customer.email ?? null,
      name: typeof customer.name === "string" ? customer.name.split(" ")[0] : null,
    };
  } catch {
    return { email: null, name: null };
  }
}

export class WebhookHandlers {
  static async processWebhook(body: Buffer, signature: string): Promise<void> {
    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();

    let event: Stripe.Event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      logger.warn(
        "STRIPE_WEBHOOK_SECRET not set — skipping webhook signature verification",
      );
      event = JSON.parse(body.toString()) as Stripe.Event;
    }

    logger.info({ type: event.type }, "Stripe webhook received");

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await stripeStorage.updateSubscriptionByCustomerId(customerId, {
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await stripeStorage.updateSubscriptionByCustomerId(customerId, {
          stripeSubscriptionId: null,
          status: "canceled",
        });
        const { email, name } = await getCustomerEmail(stripe, customerId);
        if (email) {
          await sendSubscriptionCancelledEmail({ to: email, name: name ?? undefined }).catch(
            (err) => logger.error({ err }, "Failed to send cancellation email"),
          );
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        if (clerkId) {
          await rewardReferralForUser(clerkId).catch((err) =>
            logger.error({ err }, "Failed to process referral reward"),
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer as Stripe.Customer)?.id ?? null;
        if (customerId) {
          const { email, name } = await getCustomerEmail(stripe, customerId);
          if (email) {
            await sendPaymentFailedEmail({ to: email, name: name ?? undefined }).catch(
              (err) => logger.error({ err }, "Failed to send payment failed email"),
            );
          }
        }
        break;
      }

      default:
        logger.info({ type: event.type }, "Unhandled Stripe webhook event");
    }
  }
}
