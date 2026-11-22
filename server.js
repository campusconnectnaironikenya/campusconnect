const express = require('express');
const crypto = require('crypto');
const app = express();

// IMPORTANT: The Secret Key is loaded from environment variables.
// NEVER hardcode it in your source code or commit it to GitHub.
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://campusconnect-one-plum.vercel.app/';

app.use(express.json());

// 1. Initialize Transaction (called by your frontend)
app.post('/api/paystack/initialize', async (req, res) => {
  const { email, plan } = req.body;

  // Server-side price validation — never trust the frontend amount.
  const PLANS = { monthly: 300, annual: 1500, weekly: 100, daily: 25 };
  const amount = PLANS[plan] * 100; // Paystack uses the smallest unit (kobo/cents)

  if (!amount) return res.status(400).json({ message: 'Invalid plan.' });

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, // The key goes here
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        currency: 'KES',
        callback_url: `${FRONTEND_URL}/checkout/callback`,
        metadata: { plan },
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message);

    // Return the authorization_url to the frontend
    res.json(data.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Verify Transaction (called by your frontend after Paystack redirects back)
app.get('/api/subscription/status', async (req, res) => {
  const { reference } = req.query;

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const data = await response.json();
    const tx = data.data;

    if (tx.status !== 'success') {
      return res.json({ status: 'failed', message: 'Payment was not successful.' });
    }

    // TODO: Save the reference to your database here to prevent double activation.
    // TODO: Activate the user's subscription in your database.

    res.json({
      status: 'success',
      reference: tx.reference,
      amount: tx.amount,
      subscription: {
        plan_name: 'Premium Membership',
        activated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), // Example: 30 days
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Verification failed.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
