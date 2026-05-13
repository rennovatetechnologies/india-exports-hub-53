import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Ship, Plane, Box, PackageSearch, Weight } from "lucide-react";
import { getSession, isAuthenticated } from "@/lib/authSession";

export default function BookingModal({ open, setOpen }) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shipment: "",
    category: "",
    subProducts: [],
    quantity: "",
    address: "",
    country: "",
  });

  const update = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSubProduct = useCallback((item) => {
    setForm((prev) => ({
      ...prev,
      subProducts: prev.subProducts.includes(item)
        ? prev.subProducts.filter((i) => i !== item)
        : [...prev.subProducts, item],
    }));
  }, []);

  const Categories = [
    { name: "Spices", icon: PackageSearch },
    { name: "Cereals & Pulses", icon: Box },
    { name: "Organic Food", icon: Box },
    { name: "Fruits & Vegetables", icon: Box },
    { name: "Others", icon: Box },
  ];

  const SubProductsMap = {
    Spices: ["Turmeric", "Red Chilli Powder", "Cumin", "Coriander", "Cardamom", "Black Pepper", "Clove","Cinnamon"],
    "Cereals & Pulses": ["Basmati Rice", "Wheat", "Non Basmati rice", "Sorghum(Jowar)","Maize","Soyabean", "Pear Millet", "red gram","black gram", "green gram"],
    "Organic Food": ["Organic cereals", "Organic Wheat", "Organic Spices"],
    "Fruits & Vegetables": ["Lemon", "Onion", "Chilli", "Mango", "Orange", "Brinjal"],
    Others: ["Custom Items"],
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const send = async () => {
    if (!isAuthenticated()) {
      const next = `${location.pathname}${location.search || ""}`;
      navigate(`/login?next=${encodeURIComponent(next || "/")}`);
      return;
    }
    const session = getSession();
    if (!session?.email) {
      alert("Please sign in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 0. Ensure Razorpay script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Failed to load Razorpay SDK");

      // 1. Create Razorpay Order via Next.js API route
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 100, // 1 INR in paise
          customerDetails: {
            name: session.name,
            email: session.email,
            phone: session.phone || undefined,
            address: form.address,
            country: form.country,
          },
          bookingDetails: {
            shipment: form.shipment,
            category: form.category,
            subProducts: form.subProducts.join(", "),
            quantity: form.quantity,
          }
        }),
      });

      const order = await orderRes.json();
      if (!order.id) throw new Error(order.detail || order.error || "Order creation failed");

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_Sk6wplrNSRrt1d",
        amount: order.amount,
        currency: order.currency,
        name: "New India Export",
        description: `Booking for ${form.category}`,
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify Payment via Next.js API route
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
            // 4. Submit to Web3Forms after payment success
            const payload = {
              access_key: "5dfb3e12-4f27-417a-81d2-c2021ffd842b",
              shipment: form.shipment,
              category: form.category,
              subProducts: form.subProducts.join(", "),
              quantity: form.quantity,
              name: session.name,
              phone: session.phone || "",
              email: session.email,
              country: form.country,
              address: form.address,
              subject: `PAID Booking Request - ${form.category}`,
              razorpay_payment_id: response.razorpay_payment_id
            };

            const web3Res = await fetch("https://api.web3forms.com/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            const web3Data = await web3Res.json();
            if (web3Data.success) {
              alert("Payment Successful & Request Sent!");
              setOpen(false);
              setStep(0);
              setForm({
                shipment: "",
                category: "",
                subProducts: [],
                quantity: "",
                address: "",
                country: "",
              });
            } else {
              alert("Payment Success but Email Notification failed. Please contact support.");
            }
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
          color: "#000000",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment failed: " + response.error.description);
        setIsSubmitting(false);
      });
      rzp.open();

    } catch (e) {
      console.error("Payment error:", e);
      alert("Payment error: " + (e.message || "Something went wrong."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>

          <form className="p-6 space-y-6">
            {/* STEP 0 - SHIPMENT */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Choose Shipment</h2>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      update("shipment", "Air");
                      setStep(1);
                    }}
                    className="p-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-gray-50"
                  >
                    <Plane size={28} />
                    Air
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      update("shipment", "Sea");
                      setStep(1);
                    }}
                    className="p-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-gray-50"
                  >
                    <Ship size={28} />
                    Sea
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1 - CATEGORY */}
            {step === 1 && (
              <>
                <h2 className="text-xl font-semibold">Select Category</h2>

                <div className="grid grid-cols-2 gap-4">
                  {Categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        update("category", cat.name);
                        update("subProducts", []);
                        setStep(2);
                      }}
                      className="p-4 border rounded-xl flex items-center gap-2 hover:bg-gray-50"
                    >
                      <cat.icon size={22} />
                      {cat.name}
                    </button>
                  ))}
                </div>

                <button onClick={() => setStep(0)} className="mt-4 text-sm text-gray-600">
                  ← Back
                </button>
              </>
            )}

            {/* STEP 2 - SUB PRODUCTS */}
            {step === 2 && (
              <>
                <h2 className="text-xl font-semibold">Select Products</h2>

                <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto">
                  {SubProductsMap[form.category]?.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSubProduct(item)}
                      className={`p-3 border rounded-xl text-left ${
                        form.subProducts.includes(item) ? "bg-gray-200" : "hover:bg-gray-50"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-4">
                  <button onClick={() => setStep(1)} className="text-sm text-gray-600">
                    ← Back
                  </button>

                  <button
                    disabled={form.subProducts.length === 0}
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 text-sm bg-black text-white px-4 py-2 rounded-md disabled:bg-gray-300"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 3 - QUANTITY */}
            {step === 3 && (
              <>
                <h2 className="text-xl font-semibold">Quantity / Weight</h2>

                <div className="flex items-center gap-2 border rounded-xl p-3">
                  <Weight size={20} className="text-gray-600" />
                  <input
                    placeholder="e.g. 500kg or 20 boxes"
                    value={form.quantity}
                    onChange={(e) => update("quantity", e.target.value)}
                    className="w-full outline-none"
                  />
                </div>

                <div className="flex justify-between mt-4">
                  <button onClick={() => setStep(2)} className="text-sm text-gray-600">
                    ← Back
                  </button>

                  <button
                    disabled={!form.quantity}
                    onClick={() => {
                      if (!isAuthenticated()) {
                        const next = `${location.pathname}${location.search || ""}`;
                        navigate(`/login?next=${encodeURIComponent(next || "/")}`);
                        setOpen(false);
                        return;
                      }
                      setStep(4);
                    }}
                    className="flex items-center gap-2 text-sm bg-black text-white px-4 py-2 rounded-md disabled:bg-gray-300"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 4 - SHIPMENT ADDRESS (account contact comes from your sign-in) */}
            {step === 4 && (
              <>
                <h2 className="text-xl font-semibold">Shipment details</h2>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm mb-3">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Account</span>
                  <div className="font-medium text-gray-900">{getSession()?.name}</div>
                  <div className="text-gray-600">{getSession()?.email}</div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "country", placeholder: "Country" },
                    { key: "address", placeholder: "Full pickup / delivery address" },
                  ].map(({ key, placeholder }) => (
                    <div key={key} className="flex items-center gap-2 border rounded-xl p-3">
                      <input
                        placeholder={placeholder}
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                        className="w-full outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-4">
                  <button type="button" onClick={() => setStep(3)} className="text-sm text-gray-600">
                    ← Back
                  </button>

                  <button
                    type="button"
                    disabled={!form.address || !form.country}
                    onClick={() => setStep(5)}
                    className="bg-black text-white px-4 py-2 rounded-md disabled:bg-gray-300 text-sm"
                  >
                    Review
                  </button>
                </div>
              </>
            )}

            {/* STEP 5 - SUMMARY */}
            {step === 5 && (
              <>
                <h2 className="text-xl font-semibold">Review Your Request</h2>

                <div className="border rounded-xl p-4 space-y-1 text-sm">
                  <p><strong>Shipment:</strong> {form.shipment}</p>
                  <p><strong>Category:</strong> {form.category}</p>
                  <p><strong>Products:</strong> {form.subProducts.join(", ")}</p>
                  <p><strong>Quantity:</strong> {form.quantity}</p>
                  <p><strong>Account:</strong> {getSession()?.name} · {getSession()?.email}</p>
                  {getSession()?.phone ? <p><strong>Phone:</strong> {getSession().phone}</p> : null}
                  {form.country && <p><strong>Country:</strong> {form.country}</p>}
                  {form.address && <p><strong>Address:</strong> {form.address}</p>}
                </div>

                <div className="flex justify-between mt-4">
                  <button type="button" onClick={() => setStep(4)} className="text-sm text-gray-600">
                    ← Back
                  </button>

                  <button
                    onClick={send}
                    disabled={isSubmitting}
                    className="bg-black text-white px-4 py-2 rounded-md text-sm disabled:bg-gray-300"
                  >
                    {isSubmitting ? "Sending..." : "Submit"}
                  </button>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
