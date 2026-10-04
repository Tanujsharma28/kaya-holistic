import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Stripe initialize kiya (Apni test key .env mein zaroor daalna)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { bookingId } = req.body;

    // $25 deposit (Stripe amounts ko cents mein leta hai, isliye 25 * 100 = 2500)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500,
      currency: 'usd',
      metadata: { bookingId: bookingId || 'N/A' }, // Isse backend mein pata chalega kisne pay kiya
    });

    // Frontend ko clientSecret bhej rahe hain
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;