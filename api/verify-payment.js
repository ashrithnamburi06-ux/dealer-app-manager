const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("🔍 Verifying payment...");
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderData 
    } = req.body;

    console.log("📦 Order data received:", orderData);

    // Validate required parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing required parameters:', {
        razorpay_order_id: !!razorpay_order_id,
        razorpay_payment_id: !!razorpay_payment_id,
        razorpay_signature: !!razorpay_signature
      });
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    // Validate parameter types
    if (typeof razorpay_order_id !== 'string' || 
        typeof razorpay_payment_id !== 'string' || 
        typeof razorpay_signature !== 'string') {
      console.error('Invalid parameter types');
      return res.status(400).json({ success: false, error: 'Invalid parameter types' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    console.log("🔐 Expected signature:", generatedSignature);
    console.log("🔐 Received signature:", razorpay_signature);

    if (generatedSignature === razorpay_signature) {
      console.log('✅ Payment verified successfully:', razorpay_payment_id);
      
      // TODO: Save order to Firestore here using Firebase Admin SDK
      // For now, return success with orderData so frontend can handle Firestore update
      console.log("📝 Order data for Firestore:", orderData);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Payment verified successfully',
        orderData 
      });
    } else {
      console.error('❌ Invalid signature for payment:', razorpay_payment_id);
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error.message);
    console.error('Error details:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
};
