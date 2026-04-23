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

// Verify Payment API
app.post('/api/verify-payment', async (req, res) => {
  try {
    console.log('📡 [POST /api/verify-payment] Received request');
    console.log('📡 Request body:', req.body);
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      uid,
      orderData 
    } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing required fields in request body');
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Use the correct Razorpay key secret
    const secret = process.env.RAZORPAY_KEY_SECRET || 'xYrO6HaI0KRpKGcSXYTXOiFH';
    console.log('🔑 Using secret key (first 8 chars):', secret.substring(0, 8) + '...');
    
    // Generate HMAC SHA256 signature
    const crypto = require('crypto');
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    console.log('🔐 EXPECTED:', generated_signature);
    console.log('🔐 RECEIVED:', razorpay_signature);
    console.log('🔐 Signatures match:', generated_signature === razorpay_signature);
    
    if (generated_signature === razorpay_signature) {
      console.log('✅ Payment verified successfully');
      
      // Save order to Firestore if Firebase Admin is initialized and uid/orderData provided
      // NOTE: Firebase Admin SDK needs to be imported and initialized for this to work
      if (uid && orderData) {
        console.log('💾 Attempting to save order to Firestore...');
        console.log('💾 UID:', uid);
        console.log('💾 Order data:', orderData);
        
        // TODO: Initialize Firebase Admin SDK and uncomment this code
        /*
        try {
          const { items, totalAmount, customerName, customerPhone, orderId } = orderData;
          
          const orderRef = db.collection('users').doc(uid).collection('orders').doc();
          
          await orderRef.set({
            items,
            totalAmount: Number(totalAmount),
            customerName,
            customerPhone,
            status: 'paid',
            razorpay_order_id,
            razorpay_payment_id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('✅ Order saved to Firestore:', orderRef.id);
        } catch (firestoreError) {
          console.error('❌ Error saving order to Firestore:', firestoreError);
          // Continue to return success even if Firestore save fails
          // Payment is still verified, just order save failed
        }
        */
        console.log('⚠️ Firestore save skipped (Firebase Admin not initialized)');
      } else {
        console.log('⚠️ Skipping Firestore save (missing uid or orderData)');
        console.log('⚠️ UID provided:', !!uid);
        console.log('⚠️ OrderData provided:', !!orderData);
      }
      
      // Return success regardless of Firestore save status
      res.json({ success: true });
    } else {
      console.log('❌ Payment verification failed - signatures do not match');
      res.json({ success: false, error: 'Signature verification failed' });
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
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
