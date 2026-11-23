import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// Paystack Route
app.post('/api/paystack/initialize', async (req, res) => {
  try {
    const { email, amount, plan } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required" });
    }

    const amountInKobo = amount * 100;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({ error: "Paystack Secret Key is missing on Vercel." });
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        metadata: { plan: plan }
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

// Upload Route (keeping your photo logic)
app.post('/api/upload', async (req, res) => {
  try {
    const { image, userId } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });
    res.json({ success: true, imageUrl: image });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default app;
