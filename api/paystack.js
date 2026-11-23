import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit in case you send base64 images in the future

// Vercel routes requests here via /api/paystack
app.post('/api/paystack/initialize', async (req, res) => {
  try {
    const { email, amount, plan } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required" });
    }

    // Paystack expects amount in kobo (KES * 100)
    const amountInKobo = amount * 100;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        metadata: {
          plan: plan
        }
      })
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ error: data.message });
    }

    res.json({ authorization_url: data.data.authorization_url });
  } catch (error) {
    console.error("Paystack Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
