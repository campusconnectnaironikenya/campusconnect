import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
// INCREASE LIMIT: Allow up to 10MB payloads for base64 images
app.use(express.json({ limit: '10mb' })); 

// ==========================================
// PHOTO UPLOAD ROUTE
// ==========================================
app.post('/api/upload', async (req, res) => {
  try {
    const { image, userId } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // In a real app, you would save this to a database or cloud storage (S3, Cloudinary).
    // For now, we simulate a successful save and return the image URL.
    console.log(`Received image for user: ${userId}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return the base64 string back as the "stored URL"
    res.json({ 
      success: true, 
      imageUrl: image 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// ==========================================
// PAYSTACK ROUTE
// ==========================================
app.post('/api/paystack/initialize', async (req, res) => {
  try {
    const { email, amount, plan } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required" });
    }

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

export default app;
