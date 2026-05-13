/** Demo catalog: customer billing reads this; admins persist overrides to localStorage. */
export const DEFAULT_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 33999,
    tagline: "For first-time exporters",
    featured: false,
    features: ["IEC + AD code", "1 product category", "Email support", "Basic KYC review"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 43999,
    tagline: "Most exporters pick this",
    featured: true,
    features: [
      "Everything in Basic",
      "RCMC + DGFT advisory",
      "5 product categories",
      "Priority ops support",
      "Quarterly compliance review",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 83999,
    tagline: "Full white-glove desk",
    featured: false,
    features: [
      "Everything in Standard",
      "Dedicated success manager",
      "Unlimited categories",
      "Buyer matchmaking",
      "Trade finance intro",
    ],
  },
];

const STORAGE_KEY = "vistara_billing_plans";

function normalizePlan(p) {
  if (!p || typeof p !== "object") return null;
  const id = String(p.id || "").trim();
  const name = String(p.name || "").trim();
  const price = Number(p.price);
  const tagline = String(p.tagline || "").trim();
  const featured = Boolean(p.featured);
  const features = Array.isArray(p.features) ? p.features.map((f) => String(f).trim()).filter(Boolean) : [];
  if (!id || !name || !Number.isFinite(price) || price < 0) return null;
  return { id, name, price, tagline, featured, features };
}

export function loadPlanCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLANS.map((x) => ({ ...x, features: [...x.features] }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PLANS.map((x) => ({ ...x, features: [...x.features] }));
    const cleaned = parsed.map(normalizePlan).filter(Boolean);
    if (cleaned.length === 0) return DEFAULT_PLANS.map((x) => ({ ...x, features: [...x.features] }));
    return cleaned;
  } catch {
    return DEFAULT_PLANS.map((x) => ({ ...x, features: [...x.features] }));
  }
}

export function savePlanCatalog(plans) {
  const next = (Array.isArray(plans) ? plans : []).map(normalizePlan).filter(Boolean);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("iehub-plans-updated"));
}
