import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SgsEo6nXAe4zoF',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'xYrO6HaI0KRpKGcSXYTXOiFH',
});

// Create Order API
app.post('/api/create-order', async (req, res) => {
  try {
    console.log('📡 [POST /api/create-order] Received request');
    console.log('📡 Request body:', req.body);
    
    const { amount } = req.body;
    
    if (!amount) {
      console.error('❌ Missing amount in request body');
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    console.log('📡 Creating Razorpay order with amount:', amount);
    
    const options = {
      amount: Number(amount),
      currency: 'INR',
      receipt: `order_${Date.now()}`,
    };

    console.log('📡 Razorpay options:', options);

    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created successfully');
    console.log('✅ Order ID:', order.id);
    console.log('✅ Order amount:', order.amount);
    
    res.json(order);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// Verify Payment API - ONLY verifies signature, does NOT save order
app.post('/api/verify-payment', async (req, res) => {
  try {
    console.log('📡 [POST /api/verify-payment] Received request');
    
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature
    } = body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Use the correct Razorpay key secret
    const secret = process.env.RAZORPAY_KEY_SECRET || 'xYrO6HaI0KRpKGcSXYTXOiFH';
    
    // Generate HMAC SHA256 signature
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    
    console.log('🔐 EXPECTED:', expected);
    console.log('🔐 RECEIVED:', razorpay_signature);
    console.log('🔐 Match:', expected === razorpay_signature);
    
    if (expected !== razorpay_signature) {
      console.log('❌ Signature verification failed');
      return res.status(400).json({ success: false });
    }
    
    console.log('✅ Payment verified successfully');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ VERIFY ERROR:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
