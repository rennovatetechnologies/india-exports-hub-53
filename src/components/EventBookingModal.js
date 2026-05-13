import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { FaChevronRight } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";
import { getSession, isAuthenticated } from "@/lib/authSession";

const WORKSHOP_REGISTER_PATH = "/events#register";

export default function EventBookingModal({ open, setOpen }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginHref = `/login?next=${encodeURIComponent(WORKSHOP_REGISTER_PATH)}`;

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) return;

    const session = getSession();
    if (!session?.email) {
      alert("Please sign in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Failed to load Razorpay SDK");

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 639900,
          customerDetails: {
            name: session.name,
            email: session.email,
            phone: session.phone || undefined,
          },
          bookingDetails: {
            category: "Workshop",
            subProducts: "Virtual Shipment Workshop (5 Days) - From Homepage",
          },
        }),
      });

      const order = await orderRes.json();
      if (!order.id) throw new Error(order.detail || order.error || "Order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_Sk6wplrNSRrt1d",
        amount: order.amount,
        currency: order.currency,
        name: "New India Export",
        description: "Virtual Shipment Workshop (5 Days)",
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("Payment Successful! Your seat has been reserved.");
            setOpen(false);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: session.name,
          email: session.email,
          ...(session.phone ? { contact: session.phone } : {}),
        },
        theme: {
          color: "#10b981",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("Payment failed: " + response.error.description);
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment error: " + (error.message || "Something went wrong."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute right-6 top-6 p-2 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="p-8">
            <h2 className="text-2xl font-serif text-white mb-2">Reserve Your Seat</h2>
            <p className="text-neutral-400 text-sm mb-8">Virtual Shipment Workshop (5 Days)</p>

            {!isAuthenticated() ? (
              <div className="space-y-5">
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Sign in to your VISTARA account to reserve a seat. Your work email and profile will be used for
                  confirmation and payment.
                </p>
                <Link
                  to={loginHref}
                  onClick={() => setOpen(false)}
                  className="block w-full text-center px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-black font-bold text-lg"
                >
                  Sign in to continue
                </Link>
                <p className="text-[10px] text-neutral-500 text-center">
                  No account yet?{" "}
                  <Link to="/signup" className="text-emerald-400 hover:underline" onClick={() => setOpen(false)}>
                    Create one
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handlePayment} className="space-y-5">
                <div className="rounded-xl border border-neutral-800 bg-black/40 px-4 py-3 text-sm text-neutral-300">
                  <span className="text-neutral-500 text-xs uppercase tracking-wider">Signed in as</span>
                  <div className="mt-1 font-medium text-white">{getSession().name}</div>
                  <div className="text-neutral-400">{getSession().email}</div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group relative px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-black font-bold text-lg flex items-center justify-center gap-3 overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Pay ₹6399"}
                    <FaChevronRight className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="text-[10px] text-neutral-500 mt-4 flex items-center justify-center gap-2">
                    <FiCheckCircle className="text-emerald-400" />
                    Secure SSL Encrypted Payment via Razorpay
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
