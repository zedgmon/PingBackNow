import { users, subscriptionPlans, payments } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { env } from '../env';
import Stripe from 'stripe';

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
    try {
      if (isDevelopment) {
        console.log('Development mode: Creating mock customer');
        const mockCustomerId = `cus_mock_${userId}`;
        await db
          .update(users)
          .set({ stripeCustomerId: mockCustomerId })
          .where(eq(users.id, userId));
        return { id: mockCustomerId };
      }

      this.checkStripe();
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
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  static async createSubscription(
    userId: number,
    planId: string,
    paymentMethodId: string
  ) {
    try {
      console.log('Creating subscription:', { userId, planId, isDevelopment });

      // Get user and ensure they have a customer ID
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new Error('User not found');
      }

      // If no customer ID exists, create one
      if (!user.stripeCustomerId) {
        console.log('No customer ID found, creating one...');
        await this.createCustomer(userId, user.username, user.businessName);
        // Refresh user data
        const updatedUser = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });
        if (!updatedUser?.stripeCustomerId) {
          throw new Error('Failed to create customer');
        }
        user.stripeCustomerId = updatedUser.stripeCustomerId;
      }

      // Get the subscription plan details
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.stripePriceId, planId),
      });

      if (!plan) {
        console.log('Available plans:', await db.query.subscriptionPlans.findMany());
        throw new Error(`Invalid subscription plan: ${planId}`);
      }

      console.log('Found subscription plan:', plan);

      // In development, return mock subscription
      if (isDevelopment) {
        console.log('Development mode: Creating mock subscription');
        const mockSubscriptionId = `sub_mock_${userId}`;

        await db
          .update(users)
          .set({
            stripeSubscriptionId: mockSubscriptionId,
            subscriptionPlan: plan.name,
            subscriptionStatus: 'active',
          })
          .where(eq(users.id, userId));

        return {
          id: mockSubscriptionId,
          status: 'active',
          latest_invoice: {
            payment_intent: {
              client_secret: 'mock_pi_secret'
            }
          }
        };
      }

      this.checkStripe();

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

      console.log('Subscription created successfully:', {
        id: subscription.id,
        status: subscription.status
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(userId: number) {
    try {
      if (isDevelopment) {
        await db
          .update(users)
          .set({
            subscriptionStatus: 'canceled',
            subscriptionPlan: null,
          })
          .where(eq(users.id, userId));
        return { status: 'canceled', canceled_at: Date.now() };
      }

      this.checkStripe();
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
          subscriptionPlan: null,
        })
        .where(eq(users.id, userId));

      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  static async handleWebhook(
    body: any,
    signature: string,
  ) {
    try {
      if (isDevelopment) {
        console.log('Development mode: Skipping webhook processing');
        return { received: true };
      }

      this.checkStripe();
      if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
      }

      const event = stripe!.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      console.log('Processing Stripe webhook:', event.type);
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
                amount: (invoice.amount_paid / 100).toString(),
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
                amount: (invoice.amount_due / 100).toString(),
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
      console.error('Error processing webhook:', err);
      throw new Error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}