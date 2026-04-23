const Razorpay = require('razorpay');

// Initialize Razorpay with environment variables
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log("🔑 Environment check:");
console.log("- RAZORPAY_KEY_ID exists:", !!key_id);
console.log("- RAZORPAY_KEY_SECRET exists:", !!key_secret);

if (!key_id || !key_secret) {
  console.error("❌ Razorpay credentials not found in environment variables");
}

const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret,
});

export default async function handler(req, res) {
  console.log("📡 /api/create-order called");
  console.log("- Method:", req.method);

  if (req.method !== 'POST') {
    console.error('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;

    console.log("📊 Request body:", { amount });

    // Validate amount
    if (!amount || amount <= 0) {
      console.error('❌ Invalid amount provided:', amount);
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Additional validation: ensure amount is a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('❌ Amount is not a valid number:', amount);
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    // Prevent unreasonably large amounts
    if (amount > 1000000) {
      console.error('❌ Amount too large:', amount);
      return res.status(400).json({ error: 'Amount exceeds maximum limit' });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    console.log("📝 Creating Razorpay order with options:", options);

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created successfully:', order.id);

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error.message);
    console.error('❌ Error details:', error);
    return res.status(500).json({ error: 'Failed to create order', message: error.message });
  }
}
