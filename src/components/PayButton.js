/**
 * Razorpay checkout — amount in INR (rupees). Backend: /api/create-order, /api/verify-payment.
 */
export async function loadRazorpayScript() {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * @param {{
 *   amountInr: number,
 *   planId?: string,
 *   purpose?: string,
 *   eventId?: string,
 *   description?: string,
 *   customer?: { name?: string, email?: string, contact?: string, phone?: string },
 *   onSuccess?: (result: object) => void,
 *   onFailure?: (err: Error) => void,
 * }} opts
 */
export async function startRazorpayCheckout(opts) {
  const {
    amountInr,
    planId = "custom",
    purpose,
    eventId,
    description = "Plan payment",
    customer = {},
    onSuccess,
    onFailure,
  } = opts || {};

  try {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) throw new Error("Failed to load Razorpay SDK");

    const amountPaise = Math.round(Number(amountInr) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      throw new Error("Invalid payment amount");
    }

    const cfg = await fetch("/api/config/public").then((r) => r.json()).catch(() => ({}));
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID || cfg.razorpayKeyId;
    if (!key) throw new Error("Razorpay key not configured (VITE_RAZORPAY_KEY_ID or /api/config/public)");

    const resolvedPurpose = purpose || (eventId ? "event" : "plan");
    const token = localStorage.getItem("vistara_token") || "";
    const orderBody = {
      amount: amountPaise,
      currency: "INR",
      sku: eventId || planId,
      purpose: resolvedPurpose,
      description,
    };
    if (resolvedPurpose === "event" || eventId) {
      orderBody.eventId = eventId || planId;
    } else {
      orderBody.planId = planId;
    }
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(orderBody),
    });

    const order = await res.json().catch(() => ({}));
    if (!res.ok || !order.id) {
      throw new Error(order.message || order.detail || order.error || "Order creation failed");
    }

    await new Promise((resolve, reject) => {
      const options = {
        key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "VIRASTRA INTERNATIONAL EXPORT",
        description,
        order_id: order.id,
        prefill: {
          name: customer.name || "",
          email: customer.email || "",
          contact: customer.contact || customer.phone || "",
        },
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ ...response, planId }),
            });
            const result = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || result.success === false) {
              throw new Error(result.message || "Payment verification failed");
            }
            onSuccess?.({ ...result, ...response, planId, amountInr });
            resolve(result);
          } catch (err) {
            onFailure?.(err);
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled")),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        const err = new Error(response?.error?.description || "Payment failed");
        onFailure?.(err);
        reject(err);
      });
      rzp.open();
    });
  } catch (err) {
    onFailure?.(err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}

export default function PayButton({
  amountInr = 500,
  planId,
  description,
  customer,
  label,
  className,
  onSuccess,
  onFailure,
}) {
  const handlePayment = async () => {
    try {
      await startRazorpayCheckout({
        amountInr,
        planId,
        description,
        customer,
        onSuccess,
        onFailure,
      });
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert("Payment error: " + (err?.message || "Something went wrong."));
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      className={
        className ||
        "px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
      }
    >
      {label || `Pay ₹${Number(amountInr).toLocaleString("en-IN")}`}
    </button>
  );
}
