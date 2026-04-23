import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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

    if (generatedSignature === razorpay_signature) {
      console.log('Payment verified successfully:', razorpay_payment_id);
      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      console.error('Invalid signature for payment:', razorpay_payment_id);
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error.message);
    console.error('Error details:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
}
