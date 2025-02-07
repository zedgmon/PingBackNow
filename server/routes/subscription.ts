import express from 'express';
import { StripeService } from '../services/stripe';
import { db } from '../db';
import { subscriptionPlans } from '@shared/schema';
import { env } from '../env';

const router = express.Router();

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await db.query.subscriptionPlans.findMany({
      where: (plans) => plans.active.equals(true),
    });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Create new subscription
router.post('/create', async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await StripeService.createSubscription(
      userId,
      planId,
      paymentMethodId
    );

    // Return a proper JSON response
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await StripeService.cancelSubscription(userId);
    res.json({
      status: subscription.status,
      canceledAt: subscription.canceled_at
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
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Webhook Error'
    });
  }
});

export const subscriptionRouter = router;