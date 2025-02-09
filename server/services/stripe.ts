import { users, subscriptionPlans, payments } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { env } from '../env';
import Stripe from 'stripe';

// Initialize Stripe with secret key from validated env
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia'
}) : undefined;

// Force development mode for testing
const isDevelopment = true;

export class StripeService {
  static async ensureMockPlansExist() {
    try {
      console.log('Development mode status:', isDevelopment);
      console.log('Ensuring mock plans exist...');

      // Clear existing plans for fresh start
      await db.delete(subscriptionPlans);
      console.log('Cleared existing plans');

      const mockPlans = [
        {
          name: "STARTER",
          stripe_price_id: "price_1QqVclCDMMERRP2ncvcdIx9k",
          features: ['500 SMS messages', 'Basic support', 'Essential features'],
          price_per_month: '49.99',
          message_credits: 500,
          active: true,
        },
        {
          name: "GROWTH",
          stripe_price_id: "price_1QqVd9CDMMERRP2nDrjsiOrj",
          features: ['1,500 SMS messages', 'Priority support', 'Advanced features'],
          price_per_month: '99.99',
          message_credits: 1500,
          active: true,
        },
        {
          name: "PRO",
          stripe_price_id: "price_1QqVdNCDMMERRP2nmIrc2RxU",
          features: ['5,000 SMS messages', 'Premium support', 'All features'],
          price_per_month: '199.99',
          message_credits: 5000,
          active: true,
        },
      ];

      // Insert all mock plans
      for (const plan of mockPlans) {
        console.log('Creating plan:', plan.name);
        const [createdPlan] = await db.insert(subscriptionPlans)
          .values({
            name: plan.name,
            stripe_price_id: plan.stripe_price_id,
            features: JSON.stringify(plan.features),
            price_per_month: plan.price_per_month,
            message_credits: plan.message_credits,
            active: plan.active,
          })
          .returning();

        console.log('Created plan:', createdPlan);
      }

      // Verify plans were created
      const finalPlans = await db.select().from(subscriptionPlans);
      console.log('Final subscription plans:', finalPlans);

      if (finalPlans.length === 0) {
        throw new Error('Failed to create mock plans');
      }

      return finalPlans;
    } catch (error) {
      console.error('Error in ensureMockPlansExist:', error);
      throw error;
    }
  }

  private static checkStripe() {
    if (!stripe && !isDevelopment) {
      throw new Error('Stripe is not configured. Please check your environment variables.');
    }
  }

  static async createCustomer(userId: number, email: string, businessName: string) {
    try {
      // In development mode, just create a mock customer ID
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
      if (!stripe) throw new Error('Stripe is not initialized');

      const customer = await stripe.customers.create({
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
    paymentMethodId: string,
    email: string
  ) {
    try {
      console.log('Creating subscription:', { userId, planId, isDevelopment });

      // Ensure mock plans exist in development mode
      if (isDevelopment) {
        console.log('Creating mock plans for development mode...');
        await this.ensureMockPlansExist();
      }

      // Get user and ensure they have a customer ID
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      // If no customer ID exists, create one
      if (!user.stripeCustomerId) {
        console.log('Creating customer for user:', userId);
        const customer = await this.createCustomer(userId, email, user.businessName);
        user.stripeCustomerId = customer.id;
      }

      // Get the subscription plan details
      console.log('Looking for plan with ID:', planId);
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.stripe_price_id, planId));

      console.log('Found plan:', plan);

      if (!plan) {
        throw new Error(`Invalid subscription plan: ${planId}`);
      }

      // In development mode, create a mock subscription
      if (isDevelopment) {
        console.log('Development mode: Creating mock subscription');
        const mockSubscriptionId = `sub_mock_${userId}`;

        // Update user subscription status
        await db
          .update(users)
          .set({
            stripeSubscriptionId: mockSubscriptionId,
            subscriptionPlan: plan.name.toLowerCase(),
            subscriptionStatus: 'active',
          })
          .where(eq(users.id, userId));

        return {
          id: mockSubscriptionId,
          status: 'active',
          latest_invoice: {
            payment_intent: {
              client_secret: 'mock_pi_secret',
            },
          },
        };
      }

      // Production mode
      this.checkStripe();
      if (!stripe) throw new Error('Stripe is not initialized');

      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{ price: planId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      await db
        .update(users)
        .set({
          stripeSubscriptionId: subscription.id,
          subscriptionPlan: plan.name.toLowerCase(),
          subscriptionStatus: subscription.status,
        })
        .where(eq(users.id, userId));

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

      const [user] = await db.select().from(users).where(eq(users.id, userId));

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
            const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, invoice.customer as string));

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
            const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, invoice.customer as string));

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