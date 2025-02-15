import express from 'express';
import { StripeService } from '../services/stripe';
import { db } from '../db';
import { users, subscriptionPlans } from '@shared/schema';
import { env } from '../env';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Development mode helper to initialize mock plans
router.post('/debug/init-plans', async (req, res) => {
  try {
    console.log('Manually triggering mock plan creation...');
    await StripeService.ensureMockPlansExist();
    const plans = await db.select().from(subscriptionPlans);
    res.json({ success: true, plans });
  } catch (error) {
    console.error('Error initializing mock plans:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to initialize mock plans'
    });
  }
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    console.log('Fetching subscription plans...');
    const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true));
    console.log('Found plans:', plans);
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Create new subscription
router.post('/create', async (req, res) => {
  try {
    const { planId, paymentMethodId, email } = req.body;
    const userId = req.session?.userId;

    console.log('Create subscription request:', {
      userId,
      planId,
      email,
      hasSession: !!req.session,
      sessionId: req.session?.id
    });

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - No user ID in session' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required for subscription' });
    }

    console.log('Creating subscription:', {
      userId,
      planId,
      email,
      isDevelopment: process.env.NODE_ENV === 'development'
    });

    // Get user details
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store email in user record if not set
    if (!user.email) {
      await db
        .update(users)
        .set({ email: email })
        .where(eq(users.id, userId));
    }

    const subscription = await StripeService.createSubscription(
      userId,
      planId,
      paymentMethodId,
      email
    );

    console.log('Subscription created:', {
      id: subscription.id,
      status: subscription.status
    });

    res.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const userId = req.session?.userId;

    console.log('Cancel subscription request:', {
      userId,
      hasSession: !!req.session,
      sessionId: req.session?.id
    });

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required. Please log in to cancel your subscription.' 
      });
    }

    // Get user details to verify stripe customer exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ 
        error: 'User account not found. Please try logging in again.' 
      });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({ 
        error: 'No active subscription found for this account. If you believe this is an error, please contact support.' 
      });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ 
        error: 'Unable to find your subscription details. Please contact support for assistance.' 
      });
    }

    if (user.subscriptionStatus === 'canceled') {
      return res.status(400).json({ 
        error: 'Your subscription is already canceled.' 
      });
    }

    const subscription = await StripeService.cancelSubscription(userId);

    // Update user's subscription status in database
    await db
      .update(users)
      .set({
        subscriptionStatus: 'canceled',
      })
      .where(eq(users.id, userId));

    res.json({
      status: subscription.status,
      canceledAt: subscription.canceled_at,
      message: 'Your subscription will remain active until the end of the current billing period.'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    });
  }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!sig || Array.isArray(sig)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const result = await StripeService.handleWebhook(req.body, sig);
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Webhook Error'
    });
  }
});

export const subscriptionRouter = router;