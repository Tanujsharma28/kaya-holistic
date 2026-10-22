import Stripe from 'stripe';

// Key na ho (payment pause mode) to bhi server start hona chahiye. Placeholder se koi asli payment nahi hota.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_payments_paused');