import Stripe from 'stripe';
import { env } from '../env';
import { db } from '../db';
import { users, subscriptionPlans, payments } from '@shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  static async createCustomer(userId: number, email: string, businessName: string) {
    const customer = await stripe.customers.create({
      email,
      name: businessName,
      metadata: {
        userId: userId.toString(),
      },
    });

    // Update user with Stripe customer ID
    await db
      .update(users)
      .set({ stripeCustomerId: customer.id })
      .where(eq(users.id, userId));

    return customer;
  }

  static async createSubscription(
    userId: number,
    planId: number,
    paymentMethodId: string
  ) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.stripeCustomerId) {
      throw new Error('User does not have a Stripe customer ID');
    }

    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan?.stripePriceId) {
      throw new Error('Invalid subscription plan');
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user subscription details
    await db
      .update(users)
      .set({
        stripeSubscriptionId: subscription.id,
        subscriptionPlan: plan.name,
        subscriptionStatus: subscription.status,
      })
      .where(eq(users.id, userId));

    return subscription;
  }

  static async cancelSubscription(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const subscription = await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    await db
      .update(users)
      .set({
        subscriptionStatus: subscription.status,
      })
      .where(eq(users.id, userId));

    return subscription;
  }

  static async handleWebhook(
    body: any,
    signature: string,
  ) {
    try {
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
      }

      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      const { object } = event.data;

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = object as Stripe.Subscription;
          await db
            .update(users)
            .set({
              subscriptionStatus: subscription.status,
            })
            .where(eq(users.stripeCustomerId, subscription.customer as string));
          break;
        }

        case 'invoice.paid': {
          const invoice = object as Stripe.Invoice;
          if (invoice.customer) {
            const user = await db.query.users.findFirst({
              where: eq(users.stripeCustomerId, invoice.customer as string),
            });

            if (user) {
              await db.insert(payments).values({
                userId: user.id,
                stripePaymentIntentId: invoice.payment_intent as string,
                amount: invoice.amount_paid / 100, // Convert from cents to dollars
                status: 'succeeded',
                createdAt: new Date(),
              });
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = object as Stripe.Invoice;
          if (invoice.customer) {
            const user = await db.query.users.findFirst({
              where: eq(users.stripeCustomerId, invoice.customer as string),
            });

            if (user) {
              await db.insert(payments).values({
                userId: user.id,
                stripePaymentIntentId: invoice.payment_intent as string,
                amount: invoice.amount_due / 100,
                status: 'failed',
                createdAt: new Date(),
              });
            }
          }
          break;
        }
      }

      return { received: true };
    } catch (err) {
      console.error('Error processing Stripe webhook:', err);
      throw new Error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}