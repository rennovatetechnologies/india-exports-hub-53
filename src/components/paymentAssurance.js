function inr(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Customer-facing confirmation after checkout closes.
 * outcome: "received" | "failed"
 */
export function showPaymentAssurance({ outcome = "failed", amountInr, description } = {}) {
  if (typeof document === "undefined") return;
  document.getElementById("payment-assurance")?.remove();

  const received = outcome === "received";
  const money = inr(amountInr);
  const title = received ? "Payment received" : "Payment did not go through";
  const detail = received
    ? `${money ? `${money} is confirmed` : "Your payment is confirmed"}${description ? ` for ${description}` : ""}. Your access is active, and the receipt is on this page.`
    : "Access was not activated. If your bank or UPI app already deducted the money, it is credited back to the same account within 5–7 business days. You will not be charged twice, and you can try again now.";

  const root = document.createElement("div");
  root.id = "payment-assurance";
  root.style.cssText = "position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.62);";

  const card = document.createElement("div");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-labelledby", "payment-assurance-title");
  card.style.cssText = "width:min(440px,100%);border-radius:18px;border:1px solid rgba(255,255,255,.12);background:#0c1220;color:#fff;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.45);";

  const heading = document.createElement("h2");
  heading.id = "payment-assurance-title";
  heading.textContent = title;
  heading.style.cssText = "margin:0;font-size:18px;font-weight:600;";

  const body = document.createElement("p");
  body.textContent = detail;
  body.style.cssText = "margin:12px 0 0;font-size:14px;line-height:1.5;color:rgba(255,255,255,.78);";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = received ? "Continue" : "Okay";
  button.style.cssText = "margin-top:18px;border:0;border-radius:12px;background:#e6c36a;color:#111;font-weight:650;padding:10px 16px;cursor:pointer;";
  button.addEventListener("click", () => root.remove());

  card.append(heading, body, button);
  root.append(card);
  root.addEventListener("click", (event) => {
    if (event.target === root) root.remove();
  });
  document.body.append(root);
  button.focus();
}
