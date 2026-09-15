import { Router, raw } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '../config.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sensitiveLimiter } from '../middleware/rateLimit.js';
import { adminSupabase } from '../lib/supabase.js';

export const payments = Router();
const checkoutSchema = z.object({ quantity: z.number().int().min(1).max(20).default(1) });
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

payments.post('/checkout', sensitiveLimiter, requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!stripe || !env.STRIPE_COIN_PRICE_ID || !req.user) return res.status(503).json({ error: 'Payments are not configured' });
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid quantity' });
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: env.STRIPE_COIN_PRICE_ID, quantity: parsed.data.quantity }],
    success_url: `${env.CLIENT_URL}/profile?payment=success`,
    cancel_url: `${env.CLIENT_URL}/profile?payment=cancelled`,
    client_reference_id: req.user.id,
    metadata: { user_id: req.user.id, coin_quantity: String(parsed.data.quantity) },
  });
  res.json({ url: session.url });
});

export async function stripeWebhook(req: import('express').Request, res: import('express').Response) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Payments are not configured' });
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing Stripe signature' });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET); }
  catch { return res.status(400).json({ error: 'Invalid Stripe signature' }); }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const quantity = Number(session.metadata?.coin_quantity ?? 0);
    if (userId && quantity > 0) await adminSupabase.rpc('credit_coin_purchase', { p_user_id: userId, p_provider_event_id: event.id, p_coins: quantity * 100 });
  }
  res.json({ received: true });
}

export const stripeRawBody = raw({ type: 'application/json' });
