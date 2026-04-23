import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/firebase";

const CustomerOrder = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    amount: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = async (orderData) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        alert("Please login to place an order");
        return;
      }

      const options = {
        key: "rzp_test_xxxxx", // 🔥 replace with your Razorpay key
        amount: orderData.amount * 100,
        currency: "INR",
        name: "Dealrix",
        description: "Order Payment",

        handler: async function (response) {
          console.log("Payment Success:", response);

          await addDoc(collection(db, "users", uid, "orders"), {
            customerName: orderData.name,
            customerPhone: orderData.phone,
            totalAmount: Number(orderData.amount),
            paymentId: response.razorpay_payment_id,
            status: "paid",
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
          });

          alert("Order placed successfully!");
        },

        prefill: {
          name: orderData.name,
          contact: orderData.phone,
        },

        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed ❌");
    }
  };

  return (
    <div className="screen">
      <h2>Place Order</h2>

      <input
        type="text"
        name="name"
        placeholder="Enter Name"
        onChange={handleChange}
      />

      <input
        type="text"
        name="phone"
        placeholder="Enter Phone"
        onChange={handleChange}
      />

      <input
        type="number"
        name="amount"
        placeholder="Enter Amount"
        onChange={handleChange}
      />

      <button onClick={() => handlePayment(formData)}>
        Pay & Place Order
      </button>
    </div>
  );
};

export default CustomerOrder;