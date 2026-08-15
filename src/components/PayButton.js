import { useState } from "react";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";

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
 *   payInInstallments?: boolean,
 *   installmentPlanId?: string,
 *   installmentNumber?: number,
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
    payInInstallments = false,
    installmentPlanId,
    installmentNumber,
    onSuccess,
    onFailure,
  } = opts || {};

  try {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) throw new Error(USER_MESSAGES.payment);

    const amountPaise = Math.round(Number(amountInr) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      throw new Error("Enter a valid amount to pay.");
    }

    const cfg = await fetch("/api/config/public").then((r) => r.json()).catch(() => ({}));
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID || cfg.razorpayKeyId;
    if (!key) throw new Error(USER_MESSAGES.payment);

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
    if (payInInstallments) orderBody.payInInstallments = true;
    if (installmentPlanId) orderBody.installmentPlanId = installmentPlanId;
    if (installmentNumber) orderBody.installmentNumber = installmentNumber;
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
      throw new Error(toUserMessage({ message: order.message || order.detail || order.error, status: res.status }, USER_MESSAGES.payment));
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
              throw new Error(toUserMessage({ message: result.message, status: verifyRes.status }, USER_MESSAGES.paymentVerify));
            }
            onSuccess?.({ ...result, ...response, planId, amountInr });
            resolve(result);
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error(USER_MESSAGES.paymentCancelled)),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        reject(
          new Error(
            toUserMessage(
              { message: response?.error?.description },
              USER_MESSAGES.payment
            )
          )
        );
      });
      rzp.open();
    });
  } catch (err) {
    const friendly = new Error(toUserMessage(err, USER_MESSAGES.payment));
    friendly.status = err?.status;
    onFailure?.(friendly);
    throw friendly;
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
  const [localError, setLocalError] = useState("");

  const handlePayment = async () => {
    setLocalError("");
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
      const msg = toUserMessage(err, USER_MESSAGES.payment);
      if (!onFailure) setLocalError(msg);
    }
  };

  return (
    <div className="inline-flex flex-col items-stretch gap-2">
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
      {localError ? (
        <p className="max-w-xs text-xs text-rose-300">{localError}</p>
      ) : null}
    </div>
  );
}
