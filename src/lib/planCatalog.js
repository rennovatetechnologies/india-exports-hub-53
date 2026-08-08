/** Plan catalog — Mongo via GET/PUT /api/plans. Request-scoped memory only (no localStorage). */

import { api } from "@/lib/api";
import { getGstRate } from "@/lib/appConfig";

export function getGstRateLive() {
  return getGstRate();
}

/** @deprecated Prefer getGstRate() from appConfig; kept for existing imports. */
export const GST_RATE = 0.18;

const BASIC_KYC = [
  { id: "pan", label: "PAN card", required: true },
  { id: "aadhaar", label: "Aadhaar", required: true },
  { id: "bankStatement", label: "Bank statement (3 months)", required: true },
  { id: "photo", label: "Passport-size photo", required: true },
  { id: "electricity", label: "Electricity / address proof", required: true },
];

const BASIC_STAGES = [
  { id: "kyc", label: "KYC verified", description: "Identity and business documents approved" },
  { id: "entity", label: "Company / entity setup", description: "Registrations prepared with government portals" },
  { id: "iec", label: "IEC issued", description: "Import Export Code from DGFT" },
  { id: "adcode", label: "AD code mapped", description: "Bank AD code registration" },
  { id: "docs_complete", label: "Documentation complete", description: "Core formation pack delivered" },
];

export const DEFAULT_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 33999,
    discountPercent: 0,
    tagline: "For first-time exporters",
    featured: false,
    features: ["IEC + AD code", "Core KYC pack", "Email support", "Formation workflow"],
    kycDocs: BASIC_KYC,
    workflowStages: BASIC_STAGES,
  },
  {
    id: "standard",
    name: "Standard",
    price: 43999,
    discountPercent: 0,
    tagline: "Most exporters pick this",
    featured: true,
    features: [
      "Everything in Basic",
      "RCMC + DGFT advisory",
      "GST & board resolution in KYC",
      "Priority ops support",
    ],
    kycDocs: [
      ...BASIC_KYC,
      { id: "gst", label: "GST certificate", required: true },
      { id: "boardResolution", label: "Board resolution", required: true },
    ],
    workflowStages: [
      ...BASIC_STAGES.slice(0, 4),
      { id: "rcmc", label: "RCMC / APEDA", description: "Commodity board registration" },
      BASIC_STAGES[4],
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 83999,
    discountPercent: 0,
    tagline: "Full white-glove desk",
    featured: false,
    features: [
      "Everything in Standard",
      "Dedicated operations owner",
      "Priority event seating support",
      "Extended documentation pack",
    ],
    kycDocs: [
      ...BASIC_KYC,
      { id: "gst", label: "GST certificate", required: true },
      { id: "boardResolution", label: "Board resolution", required: true },
      { id: "msme", label: "MSME / Udyam certificate", required: false },
      { id: "cancelledCheque", label: "Cancelled cheque", required: true },
    ],
    workflowStages: [
      ...BASIC_STAGES.slice(0, 4),
      { id: "rcmc", label: "RCMC / APEDA", description: "Commodity board registration" },
      { id: "dedicated", label: "Dedicated desk onboarding", description: "Success manager + ops handoff" },
      BASIC_STAGES[4],
    ],
  },
];

const STORAGE_KEY = "vistara_billing_plans"; // legacy — cleared on fetch; not used as source of truth

/** @type {object[] | null} */
let memoryPlans = null;

function normalizeKycDoc(d) {
  if (!d || typeof d !== "object") return null;
  const id = String(d.id || "").trim();
  const label = String(d.label || "").trim();
  if (!id || !label) return null;
  return { id, label, required: d.required !== false };
}

function normalizeStage(s) {
  if (!s || typeof s !== "object") return null;
  const id = String(s.id || "").trim();
  const label = String(s.label || "").trim();
  if (!id || !label) return null;
  return {
    id,
    label,
    description: String(s.description || "").trim(),
  };
}

export function normalizeDiscountPercent(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return Math.round(n * 100) / 100;
}

export function planEffectivePrice(plan) {
  if (plan?.effectivePrice != null && Number.isFinite(Number(plan.effectivePrice))) {
    return Math.max(0, Math.round(Number(plan.effectivePrice)));
  }
  const list = Math.max(0, Number(plan?.price) || 0);
  const pct = normalizeDiscountPercent(plan?.discountPercent);
  if (pct <= 0) return Math.round(list);
  return Math.max(0, Math.round(list * (1 - pct / 100)));
}

export function planHasDiscount(plan) {
  return (
    normalizeDiscountPercent(plan?.discountPercent) > 0 &&
    planEffectivePrice(plan) < Math.max(0, Number(plan?.price) || 0)
  );
}

function normalizePlan(p) {
  if (!p || typeof p !== "object") return null;
  const id = String(p.id || "").trim();
  const name = String(p.name || "").trim();
  const price = Number(p.price);
  const discountPercent = normalizeDiscountPercent(p.discountPercent);
  const tagline = String(p.tagline || "").trim();
  const featured = Boolean(p.featured);
  const features = Array.isArray(p.features) ? p.features.map((f) => String(f).trim()).filter(Boolean) : [];
  const fallback = DEFAULT_PLANS.find((x) => x.id === id);
  const kycDocs = (Array.isArray(p.kycDocs) ? p.kycDocs : fallback?.kycDocs || [])
    .map(normalizeKycDoc)
    .filter(Boolean);
  const workflowStages = (Array.isArray(p.workflowStages) ? p.workflowStages : fallback?.workflowStages || [])
    .map(normalizeStage)
    .filter(Boolean);
  if (!id || !name || !Number.isFinite(price) || price < 0) return null;
  return {
    id,
    name,
    price,
    discountPercent,
    tagline,
    featured,
    features,
    kycDocs: kycDocs.length ? kycDocs : (fallback?.kycDocs || []).map((x) => ({ ...x })),
    workflowStages: workflowStages.length
      ? workflowStages
      : (fallback?.workflowStages || []).map((x) => ({ ...x })),
    effectivePrice: planEffectivePrice({ price, discountPercent, effectivePrice: p.effectivePrice }),
  };
}

function cloneDefaults() {
  return DEFAULT_PLANS.map((x) => normalizePlan(x)).filter(Boolean);
}

function clearLegacyLocalCache() {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function setMemory(plans) {
  memoryPlans = plans;
  clearLegacyLocalCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iehub-plans-updated"));
  }
}

/** Sync read — API memory for this tab only; defaults until first fetch. Never localStorage. */
export function loadPlanCatalog() {
  if (memoryPlans?.length) return memoryPlans.map((p) => ({ ...p }));
  return cloneDefaults();
}

export async function fetchPlanCatalog({ force = false } = {}) {
  if (memoryPlans?.length && !force) return memoryPlans.map((p) => ({ ...p }));
  try {
    const data = await api("/api/plans", { auth: false });
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    const cleaned = list.map(normalizePlan).filter(Boolean);
    if (cleaned.length) {
      setMemory(cleaned);
      return cleaned.map((p) => ({ ...p }));
    }
  } catch (e) {
    console.warn("[plans] API fetch failed", e.message);
  }
  return loadPlanCatalog();
}

/** Persist catalog (admin). Writes each plan to API. */
export async function savePlanCatalog(plans) {
  const next = (Array.isArray(plans) ? plans : []).map(normalizePlan).filter(Boolean);
  setMemory(next);
  for (const p of next) {
    try {
      await api(`/api/plans/${encodeURIComponent(p.id)}`, {
        method: "PUT",
        body: p,
      });
    } catch {
      try {
        await api("/api/plans", { method: "POST", body: p });
      } catch (e) {
        console.warn("[plans] save failed", p.id, e.message);
      }
    }
  }
  return next;
}

export function getPlanById(planId) {
  const id = String(planId || "").trim();
  return loadPlanCatalog().find((p) => p.id === id) || null;
}

export function mergeWorkflowStages(fromPlan, toPlan) {
  const a = fromPlan?.workflowStages || [];
  const b = toPlan?.workflowStages || [];
  const seen = new Set();
  const out = [];
  for (const s of [...a, ...b]) {
    if (!s?.id || seen.has(s.id)) continue;
    seen.add(s.id);
    out.push({ ...s });
  }
  return out;
}

export function remainingKycDocs(toPlan, uploadedIds = []) {
  const have = new Set((uploadedIds || []).map(String));
  return (toPlan?.kycDocs || []).filter((d) => !have.has(d.id));
}

export function priceWithGst(amountInr) {
  const rate = getGstRate();
  const base = Math.max(0, Number(amountInr) || 0);
  const gst = Math.round(base * rate);
  return { base, gst, total: base + gst, gstRate: rate };
}

export function planPriceWithGst(plan) {
  const list = Math.max(0, Number(plan?.price) || 0);
  const discountPercent = normalizeDiscountPercent(plan?.discountPercent);
  const effective = planEffectivePrice(plan);
  const breakdown = priceWithGst(effective);
  return {
    ...breakdown,
    listPrice: list,
    discountPercent,
    discountAmount: Math.max(0, list - effective),
    effectivePrice: effective,
  };
}

export function upgradeDelta(fromPlan, toPlan) {
  const from = planEffectivePrice(fromPlan);
  const to = planEffectivePrice(toPlan);
  const delta = Math.max(0, to - from);
  return priceWithGst(delta);
}

export function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}
