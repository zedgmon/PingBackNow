import Stripe from 'stripe';
import { env } from '../env';
import { db } from '../db';
import { users, subscriptionPlans, payments } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe with secret key from validated env
const isDevelopment = process.env.NODE_ENV === 'development';
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : undefined;

export class StripeService {
  private static checkStripe() {
    if (!stripe && !isDevelopment) {
      throw new Error('Stripe is not configured. Please set up your Stripe environment variables.');
    }
  }

  static async createCustomer(userId: number, email: string, businessName: string) {
    this.checkStripe();
    if (isDevelopment) {
      return { id: `cus_mock_${userId}` };
    }

    const customer = await stripe!.customers.create({
      email,
      name: businessName,
      metadata: {
        userId: userId.toString(),
      },
    });

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
    this.checkStripe();

    // In development, return mock subscription
    if (isDevelopment) {
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId),
      });

      await db
        .update(users)
        .set({
          stripeSubscriptionId: `sub_mock_${userId}`,
          subscriptionPlan: plan?.name || 'test_plan',
          subscriptionStatus: 'active',
        })
        .where(eq(users.id, userId));

      return {
        id: `sub_mock_${userId}`,
        status: 'active',
        latest_invoice: {
          payment_intent: {
            client_secret: 'mock_client_secret'
          }
        }
      };
    }

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

    // Create subscription with Stripe
    const subscription = await stripe!.subscriptions.create({
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
    this.checkStripe();
    if (isDevelopment) return { status: 'cancelled', canceled_at: Date.now() };

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const subscription = await stripe!.subscriptions.cancel(user.stripeSubscriptionId);

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
    this.checkStripe();
    try {
      if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
      }

      const event = stripe!.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
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
                id: undefined,
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
                id: undefined,
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