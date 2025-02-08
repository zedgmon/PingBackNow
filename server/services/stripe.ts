import { users, subscriptionPlans, payments } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { env } from '../env';
import Stripe from 'stripe';

// Initialize Stripe with secret key from validated env
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia'
}) : undefined;

const isDevelopment = process.env.NODE_ENV === 'development';

export class StripeService {
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

      // In production, validate Stripe configuration
      this.checkStripe();

      if (!stripe) {
        throw new Error('Stripe is not initialized');
      }

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

      // Get user and ensure they have a customer ID
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      // If no customer ID exists, create one with the provided email
      if (!user.stripeCustomerId) {
        console.log('No customer ID found, creating one with email:', email);
        await this.createCustomer(userId, email, user.businessName);
        // Refresh user data
        const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!updatedUser?.stripeCustomerId) {
          throw new Error('Failed to create customer');
        }
        user.stripeCustomerId = updatedUser.stripeCustomerId;
      }

      // In development mode, handle mock plans
      if (isDevelopment) {
        console.log('Development mode: Setting up mock subscription');

        // First, try to find existing mock plan
        console.log('Searching for mock plan with ID:', planId);
        let plan = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.stripePriceId, planId))
          .then(rows => rows[0]);

        if (!plan) {
          // Create mock plan if it doesn't exist
          const mockPlanName = planId.replace('price_mock_', '').toUpperCase();
          console.log('Creating new mock plan:', mockPlanName);

          try {
            [plan] = await db.insert(subscriptionPlans)
              .values({
                name: mockPlanName,
                stripePriceId: planId,
                features: JSON.stringify(['Mock feature 1', 'Mock feature 2']),
                pricePerMonth: mockPlanName === 'STARTER' ? '49.99' : 
                              mockPlanName === 'GROWTH' ? '99.99' : '199.99',
                messageCredits: mockPlanName === 'STARTER' ? 500 : 
                              mockPlanName === 'GROWTH' ? 1500 : 5000,
                active: true,
              })
              .returning();

            console.log('Successfully created mock plan:', plan);
          } catch (error) {
            console.error('Error creating mock plan:', error);
            throw new Error(`Failed to create mock plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          console.log('Found existing mock plan:', plan);
        }

        if (!plan) {
          throw new Error('Failed to create or retrieve mock plan');
        }

        const mockSubscriptionId = `sub_mock_${userId}`;

        // Update user subscription details
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
              client_secret: 'mock_pi_secret'
            }
          }
        };
      }

      // Production mode: Get the subscription plan details
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.stripePriceId, planId));

      if (!plan) {
        throw new Error(`Invalid subscription plan: ${planId}`);
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