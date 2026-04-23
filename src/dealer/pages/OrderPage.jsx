import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { createPaymentOrder, verifyPayment } from './services/paymentService';
import { updateOrderStatus } from './services/orderService';

export default function OrderPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [order, setOrder] = useState(null);
  const [cart, setCart] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, failed
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchOrderAndInventory();
  }, [id]);

  const fetchOrderAndInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Fetch order from user-scoped collection
      const orderDoc = await getDoc(doc(db, "users", user.uid, "orders", id));
      if (!orderDoc.exists()) {
        setError('Order not found');
        return;
      }
      setOrder({ id: orderDoc.id, ...orderDoc.data() });

      // Fetch inventory
      const inventorySnapshot = await getDocs(collection(db, "users", user.uid, "inventory"));
      const inventoryData = inventorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(inventoryData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load order data');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      const newCart = { ...prev };
      const currentQty = newCart[itemId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        delete newCart[itemId];
      } else {
        newCart[itemId] = newQty;
      }
      return newCart;
    });
  };

  const addCustomItem = () => {
    if (!customItemName || !customItemPrice || customItemQty < 1) {
      alert('Please fill all fields');
      return;
    }
    setCustomItems(prev => [...prev, {
      id: `custom-${Date.now()}`,
      name: customItemName,
      price: Number(customItemPrice),
      quantity: customItemQty
    }]);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty(1);
    setShowCustomItem(false);
  };

  const removeCustomItem = (itemId) => {
    setCustomItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handlePreviewOrder = () => {
    console.log("👀 Preview button clicked");
    console.log("Customer name:", customerName);
    console.log("Customer phone:", customerPhone);
    console.log("Cart items:", cart);
    console.log("Custom items:", customItems);
    
    // Validate customer details
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    
    if (!customerPhone.trim()) {
      alert('Please enter phone number');
      return;
    }
    
    if (customerPhone.length !== 10) {
      alert('Phone number must be 10 digits');
      return;
    }
    
    // Validate cart has items
    const totalItems = Object.keys(cart).length + customItems.length;
    if (totalItems === 0) {
      alert('Please add items to your cart');
      return;
    }
    
    console.log("✅ Validation passed, setting showPreview to true");
    setShowPreview(true);
  };

  const handleEditOrder = () => {
    setShowPreview(false);
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Calculate inventory items
    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = inventory.find(i => i.id === itemId);
      if (item) {
        const price = Number(item.dealerBoxPrice || item.price || 0);
        total += price * qty;
      }
    });

    // Calculate custom items
    customItems.forEach(item => {
      total += item.price * item.quantity;
    });

    return total;
  };

  const handlePlaceOrder = async () => {
    console.log("💳 Continue to Pay button clicked");
    
    const totalAmount = calculateTotal();
    
    console.log("💳 Starting payment process");
    console.log("Total amount:", totalAmount);
    console.log("Customer name:", customerName);
    console.log("Customer phone:", customerPhone);
    
    if (totalAmount <= 0) {
      alert('Please add items to your cart');
      return;
    }

    // Check if order is already paid
    if (order && order.status === 'paid') {
      alert('This order is already paid');
      return;
    }

    try {
      setPaymentStatus('processing');
      setError(null);

      // Use environment-based API URL
      const API_BASE = import.meta.env.MODE === "development" 
        ? "http://localhost:5000" 
        : "";
      const apiUrl = `${API_BASE}/api/create-order`;
      
      console.log("📡 Environment:", import.meta.env.MODE);
      console.log("📡 API Base:", API_BASE);
      console.log("📡 Calling API:", apiUrl);
      console.log("📡 Amount in paise:", totalAmount * 100);

      // Call API to create Razorpay order
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount * 100 })
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error:", response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ API response:", data);

      if (!data.id) {
        throw new Error("Failed to create Razorpay order - no order ID returned");
      }

      if (!data.amount) {
        throw new Error("Failed to create Razorpay order - no amount returned");
      }

      // Prepare order items
      const orderItems = [];
      
      Object.entries(cart).forEach(([itemId, qty]) => {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
          orderItems.push({
            id: item.id,
            name: item.name,
            price: Number(item.dealerBoxPrice || item.price || 0),
            quantity: qty
          });
        }
      });

      customItems.forEach(item => {
        orderItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isCustom: true
        });
      });

      // Initialize Razorpay
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SgsEo6nXAe4zoF';
      console.log("🔑 Razorpay key:", razorpayKey);
      
      const options = {
        key: razorpayKey,
        amount: data.amount,
        currency: "INR",
        name: "Dealrix",
        description: "Order Payment",
        order_id: data.id,
        handler: async function (response) {
          console.log("💰 Payment success:", response);
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

          try {
            setPaymentStatus('processing');
            
            // Use environment-based API URL
            const API_BASE = import.meta.env.MODE === "development" 
              ? "http://localhost:5000" 
              : "";
            const verifyUrl = `${API_BASE}/api/verify-payment`;
            
            console.log("🔍 Verifying payment at:", verifyUrl);
            console.log("📦 Order data:", { items: orderItems, totalAmount, customerName, customerPhone });
            
            const verification = await fetch(verifyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                razorpay_order_id, 
                razorpay_payment_id, 
                razorpay_signature,
                orderData: {
                  uid: user.uid,
                  items: orderItems,
                  totalAmount,
                  customerName,
                  customerPhone,
                  orderId: id
                }
              })
            }).then(res => res.json());

            console.log("✅ Verification response:", verification);

            if (verification.success) {
              // Set success state
              setPaymentSuccess(true);
              setPaymentData({
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: totalAmount
              });
              setPaymentStatus('success');
              
              console.log("✅ Order marked as paid successfully");
            } else {
              setPaymentStatus('failed');
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('Error after payment:', err);
            setPaymentStatus('failed');
            setError('Failed to verify payment. Please contact support.');
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#2563eb"
        }
      };

      console.log("🚀 Opening Razorpay checkout with options:", options);
      
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error("Razorpay script not loaded. Please check index.html");
      }

      // Create Razorpay instance and open
      const rzp = new window.Razorpay(options);
      rzp.open();

      // Handle payment failure
      rzp.on('payment.failed', function (response) {
        console.error("❌ Payment failed:", response);
        setPaymentStatus('failed');
        setError('Payment failed. Please try again.');
      });

    } catch (err) {
      console.error('Error during payment:', err);
      setPaymentStatus('failed');
      setError(`Failed to initiate payment: ${err.message}`);
    }
  };

  // Show success screen after successful payment
  if (paymentSuccess) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F5F6FA', padding: '20px' }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 40px', 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)', 
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>✅</div>
          <h2 style={{ color: '#6C7AE0', margin: '0 0 12px', fontSize: '24px', fontWeight: '700' }}>Order Placed Successfully</h2>
          <p style={{ color: '#6B7280', margin: '0 0 32px', fontSize: '16px' }}>Payment completed successfully</p>
          
          {paymentData && (
            <div style={{ backgroundColor: '#EEF2FF', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>Amount Paid:</span>
                <div style={{ color: '#6C7AE0', fontSize: '28px', fontWeight: '700', marginTop: '6px' }}>
                  ₹{Number(paymentData.amount).toLocaleString()}
                </div>
              </div>
              {paymentData.paymentId && (
                <div>
                  <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>Payment ID:</span>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '6px', wordBreak: 'break-all' }}>
                    {paymentData.paymentId}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ 
              padding: '16px 32px', 
              cursor: 'pointer', 
              borderRadius: '12px', 
              border: 'none',
              background: 'linear-gradient(135deg, #6C7AE0 0%, #4F46E5 100%)',
              color: 'white', 
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              boxShadow: '0 4px 12px rgba(108, 122, 224, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F5F6FA' }}>
        <div style={{ textAlign: 'center', padding: '48px 40px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #EEF2FF', 
            borderTop: '4px solid #6C7AE0', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ fontSize: '18px', color: '#1F2937', margin: 0, fontWeight: '500' }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F5F6FA' }}>
        <div style={{ textAlign: 'center', padding: '48px 40px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', maxWidth: '400px' }}>
          <div style={{ fontSize: '60px', marginBottom: '24px' }}>❌</div>
          <h2 style={{ color: '#1F2937', margin: '0 0 12px', fontSize: '22px', fontWeight: '700' }}>Error</h2>
          <p style={{ color: '#6B7280', margin: '0 0 32px', fontSize: '16px' }}>{error}</p>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ 
              padding: '16px 32px', 
              cursor: 'pointer', 
              borderRadius: '12px', 
              border: 'none',
              background: 'linear-gradient(135deg, #6C7AE0 0%, #4F46E5 100%)',
              color: 'white', 
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              boxShadow: '0 4px 12px rgba(108, 122, 224, 0.3)'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Preview Order Screen
  if (showPreview) {
    console.log("🖼️ Rendering preview screen");
    const totalAmount = calculateTotal();
    const orderItems = [];
    
    console.log("📦 Building order items from cart:", cart);
    console.log("📦 Building order items from customItems:", customItems);
    
    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = inventory.find(i => i.id === itemId);
      if (item) {
        orderItems.push({
          name: item.name,
          price: Number(item.dealerBoxPrice || item.price || 0),
          quantity: qty,
          total: Number(item.dealerBoxPrice || item.price || 0) * qty
        });
      }
    });

    customItems.forEach(item => {
      orderItems.push({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        isCustom: true
      });
    });

    console.log("📋 Final order items:", orderItems);
    console.log("💰 Total amount:", totalAmount);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F6FA', paddingBottom: '100px' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          color: '#1F2937', 
          padding: '24px 20px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Order Preview</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '14px' }}>Review your order before payment</p>
        </div>

        {/* Preview Content */}
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
          {/* Customer Details */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '24px', 
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#6C7AE0' }}>Customer Details</h3>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>Name:</span>
              <div style={{ fontWeight: '600', fontSize: '16px', color: '#1F2937', marginTop: '4px' }}>{customerName}</div>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>Phone:</span>
              <div style={{ fontWeight: '600', fontSize: '16px', color: '#1F2937', marginTop: '4px' }}>{customerPhone}</div>
            </div>
          </div>

          {/* Order Items */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '24px', 
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#6C7AE0' }}>Order Items</h3>
            {orderItems.map((item, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: index < orderItems.length - 1 ? '1px solid #F3F4F6' : 'none'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '16px' }}>{item.name}</div>
                  <div style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
                    ₹{item.price.toLocaleString()} × {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: '#6C7AE0', fontSize: '18px' }}>
                  ₹{item.total.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '24px', 
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)', 
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>Total Amount</span>
              <span style={{ fontSize: '32px', fontWeight: '700', color: '#6C7AE0' }}>
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Buttons */}
        <div style={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          padding: '20px 24px',
          boxShadow: '0 -6px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: '16px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <button 
            onClick={handleEditOrder}
            style={{ 
              flex: 1,
              padding: '16px 24px',
              borderRadius: '12px',
              border: '2px solid #6C7AE0',
              backgroundColor: 'white',
              color: '#6C7AE0',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Edit Order
          </button>
          <button 
            onClick={handlePlaceOrder}
            disabled={paymentStatus === 'processing'}
            style={{ 
              flex: 1,
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              background: paymentStatus === 'processing' 
                ? '#9CA3AF' 
                : 'linear-gradient(135deg, #6C7AE0 0%, #4F46E5 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: paymentStatus === 'processing' ? 'not-allowed' : 'pointer',
              boxShadow: paymentStatus === 'processing' 
                ? 'none' 
                : '0 4px 12px rgba(108, 122, 224, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {paymentStatus === 'processing' ? 'Processing...' : 'Continue to Pay'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F6FA', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#FFFFFF', 
        color: '#1F2937', 
        padding: '24px 20px',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Order Checkout</h2>
        <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '14px' }}>Review and place your order</p>
      </div>

      {/* Customer Details Form */}
      <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          padding: '24px', 
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)' 
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>Customer Details</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1F2937', fontSize: '14px' }}>
              Customer Name *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: '#F9FAFB',
                  transition: 'border-color 0.2s'
                }}
              />
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>👤</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '0' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1F2937', fontSize: '14px' }}>
              Phone Number *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: '#F9FAFB',
                  transition: 'border-color 0.2s'
                }}
              />
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>📱</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>Available Items</h3>
        
        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}>
            <p style={{ color: '#6B7280' }}>No items available</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {inventory.map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div key={item.id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '16px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>{item.name}</h4>
                    <p style={{ margin: 0, color: '#6C7AE0', fontWeight: '600', fontSize: '18px' }}>
                      ₹{Number(item.dealerBoxPrice || item.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        border: '2px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: '600', fontSize: '18px', color: '#1F2937' }}>{qty}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        border: 'none',
                        backgroundColor: '#6C7AE0',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '20px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(108, 122, 224, 0.3)'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Items */}
        <div style={{ marginTop: '28px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>Custom Items</h3>
          
          {customItems.map(item => (
            <div key={item.id} style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '16px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>{item.name}</h4>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
                  ₹{item.price.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <button 
                onClick={() => removeCustomItem(item.id)}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                Remove
              </button>
            </div>
          ))}

          {!showCustomItem ? (
            <button 
              onClick={() => setShowCustomItem(true)}
              style={{ 
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                border: '2px dashed #6C7AE0',
                backgroundColor: 'transparent',
                color: '#6C7AE0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              + Add Custom Item
            </button>
          ) : (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '20px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
            }}>
              <input
                type="text"
                placeholder="Item name"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  marginBottom: '12px', 
                  borderRadius: '12px', 
                  border: '1px solid #E5E7EB',
                  boxSizing: 'border-box',
                  backgroundColor: '#F9FAFB',
                  fontSize: '16px'
                }}
              />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="number"
                  placeholder="Price"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #E5E7EB',
                    boxSizing: 'border-box',
                    backgroundColor: '#F9FAFB',
                    fontSize: '16px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={customItemQty}
                  onChange={(e) => setCustomItemQty(e.target.value)}
                  min="1"
                  style={{ 
                    width: '80px', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #E5E7EB',
                    boxSizing: 'border-box',
                    backgroundColor: '#F9FAFB',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={addCustomItem}
                  style={{ 
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#6C7AE0',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(108, 122, 224, 0.3)'
                  }}
                >
                  Add Item
                </button>
                <button 
                  onClick={() => { setShowCustomItem(false); setCustomItemName(''); setCustomItemPrice(''); setCustomItemQty(1); }}
                  style={{ 
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#9CA3AF',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Total & Button */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: '20px 24px',
        boxShadow: '0 -6px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>Total</p>
          <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '700', color: '#6C7AE0' }}>
            ₹{calculateTotal().toLocaleString()}
          </p>
        </div>
        <button 
          onClick={handlePreviewOrder}
          disabled={paymentStatus === 'processing' || calculateTotal() === 0}
          style={{ 
            padding: '16px 32px',
            borderRadius: '12px',
            border: 'none',
            background: paymentStatus === 'processing' || calculateTotal() === 0 
              ? '#9CA3AF' 
              : 'linear-gradient(135deg, #6C7AE0 0%, #4F46E5 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: paymentStatus === 'processing' || calculateTotal() === 0 ? 'not-allowed' : 'pointer',
            boxShadow: paymentStatus === 'processing' || calculateTotal() === 0 
              ? 'none' 
              : '0 4px 12px rgba(108, 122, 224, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          {paymentStatus === 'processing' ? 'Processing...' : 'Preview Order'}
        </button>
      </div>
    </div>
  );

  }
