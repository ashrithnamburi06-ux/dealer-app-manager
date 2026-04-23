import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPaymentOrder, verifyPayment } from './services/paymentService';
import { getOrder, updateOrderStatus } from './services/orderService';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';

export default function PaymentPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('loading'); // loading, not_found, already_paid, processing, success, failed

  useEffect(() => {
    fetchOrderAndInitiatePayment();
  }, [id]);

  const fetchOrderAndInitiatePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setPaymentStatus('loading');

      // Fetch order from Firestore
      const orderData = await getOrder(id);

      if (!orderData) {
        setPaymentStatus('not_found');
        setError('Order not found');
        return;
      }

      setOrder(orderData);

      // Check if order is already paid
      if (orderData.status === 'paid') {
        setPaymentStatus('already_paid');
        return;
      }

      // Create Razorpay order with actual amount from Firestore
      setPaymentStatus('processing');
      const razorpayOrder = await createPaymentOrder(orderData.amount);

      // Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_here',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Dealrix',
        description: `Payment for Order ${id}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          // Payment successful
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

          try {
            // Verify payment
            const verification = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

            if (verification.success) {
              // Update Firestore order
              try {
                await updateOrderStatus(id, razorpay_payment_id, razorpay_order_id);
                setPaymentStatus('success');
              } catch (updateErr) {
                // Handle race condition: if order was already paid by another request
                if (updateErr.message === 'Order already paid') {
                  setPaymentStatus('already_paid');
                } else {
                  console.error('Error updating order:', updateErr);
                  setPaymentStatus('failed');
                  setError('Failed to update order. Please contact support.');
                }
              }
            } else {
              setPaymentStatus('failed');
              setError('Payment verification failed');
            }
          } catch (err) {
            console.error('Error after payment:', err);
            setPaymentStatus('failed');
            setError('Failed to process payment. Please contact support.');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#1b7835',
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus('failed');
            setError('Payment cancelled by user');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on('payment.failed', function (response) {
        setPaymentStatus('failed');
        setError('Payment failed. Please try again.');
        console.error('Payment failed:', response.error);
      });
    } catch (err) {
      setPaymentStatus('failed');
      setError('Failed to initiate payment. Please try again.');
      console.error('Payment initiation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading Screen
  if (paymentStatus === 'loading' || paymentStatus === 'processing') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #1b7835', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ fontSize: '18px', color: '#333', margin: 0 }}>
            {paymentStatus === 'loading' ? 'Loading order details...' : 'Processing payment...'}
          </p>
        </div>
      </div>
    );
  }

  // Order Not Found Screen
  if (paymentStatus === 'not_found') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#333', margin: '0 0 10px' }}>Order Not Found</h2>
          <p style={{ color: '#666', margin: '0 0 20px' }}>The order you're trying to pay for doesn't exist or has been removed.</p>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#1b7835', color: 'white', fontSize: '16px' }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Already Paid Screen
  if (paymentStatus === 'already_paid') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#333', margin: '0 0 10px' }}>Already Paid</h2>
          <p style={{ color: '#666', margin: '0 0 10px' }}>This order has already been paid for.</p>
          {order && (
            <p style={{ color: '#333', fontWeight: 'bold', margin: '0 0 20px' }}>
              Amount: ₹{order.amount}
            </p>
          )}
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#1b7835', color: 'white', fontSize: '16px' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Payment Success Screen
  if (paymentStatus === 'success') {
    const handleDownloadInvoice = () => {
      if (order) {
        generateInvoicePDF(order);
      }
    };

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#1b7835', margin: '0 0 10px' }}>Payment Successful!</h2>
          <p style={{ color: '#666', margin: '0 0 10px' }}>Your payment has been processed successfully.</p>
          {order && (
            <p style={{ color: '#333', fontWeight: 'bold', margin: '0 0 20px' }}>
              Amount: ₹{order.amount}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
            <button 
              onClick={handleDownloadInvoice}
              style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#1b7835', color: 'white', fontSize: '16px' }}
            >
              Download Invoice
            </button>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#666', color: 'white', fontSize: '16px' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Payment Failed Screen
  if (paymentStatus === 'failed') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#dc2626', margin: '0 0 10px' }}>Payment Failed</h2>
          <p style={{ color: '#666', margin: '0 0 20px' }}>{error || 'An error occurred during payment.'}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#1b7835', color: 'white', fontSize: '16px' }}
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#666', color: 'white', fontSize: '16px' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
