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
  { id: "kyc", label: "KYC Verification", description: "Identity and business documents approved" },
  { id: "shop_act", label: "Shop & Establishment Act Registration", description: "Local shop act / establishment filing" },
  { id: "msme", label: "MSME Registration", description: "Udyam / MSME certificate" },
  { id: "iec", label: "IEC Registration", description: "Import Export Code from DGFT" },
  { id: "gst", label: "GST Registration", description: "GSTIN issued for the export entity" },
  { id: "bank", label: "Current Bank Account Assistance", description: "Current account opened for export receipts" },
  { id: "adcode", label: "AD Code Registration", description: "Bank AD code registered" },
  { id: "rcmc", label: "RCMC Certificate", description: "Registration-cum-Membership Certificate" },
  { id: "phytosanitary", label: "Phytosanitary Certificate Assistance", description: "Plant health certificate support" },
  { id: "dsc", label: "DSC Class 3", description: "Digital Signature Certificate (Class 3)" },
];

const STANDARD_STAGES = [
  ...BASIC_STAGES,
  { id: "dgft", label: "DGFT Registration & Integration", description: "DGFT portal registration and integration" },
  { id: "icegate", label: "ICEGATE Registration & Integration", description: "Customs ICEGATE registration and integration" },
  { id: "adcode_approval", label: "AD Code Registration & Approval", description: "AD code mapped and approved with the bank" },
  { id: "pfms", label: "IFSC / PFMS Registration & Approval", description: "IFSC and PFMS registration approved" },
];

const PREMIUM_STAGES = [
  ...STANDARD_STAGES,
  { id: "company", label: "Company Formation Assistance", description: "Private Limited, LLP, or OPC formation" },
  { id: "trademark", label: "Trademark Application Assistance", description: "Trademark filing support" },
  { id: "virastra", label: "VIRASTRA Digital Platform Assistance", description: "Onboarding to VIRASTRA by New India Export" },
  { id: "shipment", label: "Pre & Post-Shipment Guidance", description: "Shipment workflow, documentation flow, and cost analysis" },
];

const STANDARD_KYC = [
  ...BASIC_KYC,
  { id: "gst", label: "GST certificate", required: true },
  { id: "boardResolution", label: "Board resolution", required: true },
];

const PREMIUM_KYC = [
  ...STANDARD_KYC,
  { id: "msme", label: "MSME / Udyam certificate", required: false },
  { id: "cancelledCheque", label: "Cancelled cheque", required: true },
];

export const DEFAULT_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 33999,
    discountPercent: 0,
    tagline: "Documentation & Registration Services",
    description:
      "Essential registrations and documentation support required to start and operate an export business.",
    timeline: "Liaisoning · 22 days",
    featured: false,
    features: [
      "KYC verification",
      "IEC, GST, MSME & Shop Act",
      "Current account + AD code",
      "RCMC, phytosanitary & DSC Class 3",
    ],
    marketingFeatures: [
      { label: "KYC Verification", included: true },
      { label: "Shop & Establishment Act Registration", included: true },
      { label: "MSME Registration", included: true },
      { label: "IEC (Import Export Code) Registration", included: true },
      { label: "GST Registration", included: true },
      { label: "Current Bank Account Assistance", included: true },
      { label: "AD Code Registration", included: true },
      { label: "RCMC Certificate", included: true },
      { label: "Phytosanitary Certificate Assistance", included: true },
      { label: "DSC – Digital Signature Certificate (Class 3)", included: true },
    ],
    kycDocs: BASIC_KYC,
    workflowStages: BASIC_STAGES,
  },
  {
    id: "standard",
    name: "Standard",
    price: 43999,
    discountPercent: 0,
    tagline: "Documentation, Registration & Export Compliance",
    description:
      "Comprehensive support for business registrations, export documentation, government portal registrations, integrations, and required approvals.",
    timeline: "Liaisoning · 22 days",
    featured: true,
    features: [
      "Core export registrations",
      "DGFT & ICEGATE integration",
      "AD code approval",
      "IFSC / PFMS registration & approval",
    ],
    marketingFeatures: [
      { label: "Shop & Establishment Act Registration", included: true },
      { label: "MSME Registration", included: true },
      { label: "IEC – Import Export Code Registration", included: true },
      { label: "Bank Account Assistance", included: true },
      { label: "GST Registration", included: true },
      { label: "AD Code Registration", included: true },
      { label: "RCMC Registration", included: true },
      { label: "Phytosanitary Certificate Assistance", included: true },
      { label: "DSC – Digital Signature Certificate (Class 3)", included: true },
      { label: "DGFT Registration & Integration", included: true },
      { label: "ICEGATE Registration & Integration", included: true },
      { label: "AD Code Registration & Approval", included: true },
      { label: "IFSC/PFMS Registration & Approval", included: true },
    ],
    kycDocs: STANDARD_KYC,
    workflowStages: STANDARD_STAGES,
  },
  {
    id: "premium",
    name: "Premium",
    price: 83999,
    discountPercent: 0,
    tagline: "Complete Business Formation, Export Documentation & Trade Support",
    description:
      "End-to-end export setup, including company formation, registrations, digital platform assistance, shipment support, expert guidance, and international trade networking.",
    timeline: "Liaisoning · 45 days",
    featured: false,
    features: [
      "Company formation (Pvt Ltd / LLP / OPC)",
      "VIRASTRA digital platform assistance",
      "Shipment support & cost analysis (up to 3)",
      "Expert guidance & exhibition networking",
    ],
    marketingFeatures: [
      { group: "Business Formation & Registrations", label: "Shop & Establishment Act Registration", included: true },
      { group: "Business Formation & Registrations", label: "MSME Registration", included: true },
      { group: "Business Formation & Registrations", label: "IEC – Import Export Code Registration", included: true },
      { group: "Business Formation & Registrations", label: "Bank Account Assistance", included: true },
      { group: "Business Formation & Registrations", label: "GST Registration", included: true },
      { group: "Business Formation & Registrations", label: "AD Code Registration", included: true },
      { group: "Business Formation & Registrations", label: "RCMC Certificate", included: true },
      { group: "Business Formation & Registrations", label: "Phytosanitary Certificate Assistance", included: true },
      { group: "Business Formation & Registrations", label: "DSC – Digital Signature Certificate (Class 3)", included: true },
      { group: "Government Portal & Compliance Support", label: "DGFT Registration & Integration", included: true },
      { group: "Government Portal & Compliance Support", label: "ICEGATE Registration & Integration", included: true },
      { group: "Government Portal & Compliance Support", label: "AD Code Registration & Approval", included: true },
      { group: "Government Portal & Compliance Support", label: "IFSC / PFMS Registration & Approval", included: true },
      { group: "Company Formation & Intellectual Property", label: "Company Formation Assistance (Private Limited, LLP, OPC)", included: true },
      { group: "Company Formation & Intellectual Property", label: "Trademark Application Assistance", included: true },
      { group: "Digital Export Platform", label: "VIRASTRA by New India Export – Digital Platform Assistance", included: true },
      { group: "Pre & Post-Shipment Support", label: "Pre-Shipment & Post-Shipment Guidance", included: true },
      { group: "Pre & Post-Shipment Support", label: "Shipment Process Charts & Workflow", included: true },
      { group: "Pre & Post-Shipment Support", label: "Export Documentation Flow & Process Guidance", included: true },
      { group: "Pre & Post-Shipment Support", label: "Shipment Cost Analysis – Up to 3 Shipments", included: true },
      { group: "Expert Business Support", label: "Expert Reviews & Guidance", included: true },
      { group: "Expert Business Support", label: "Export Business Process Review", included: true },
      { group: "Expert Business Support", label: "Practical Guidance for Export Operations", included: true },
      { group: "Exhibitions & Business Networking", label: "Exhibition Exposure & Updates", included: true },
      { group: "Exhibitions & Business Networking", label: "International Trade Fair & Exhibition Networking Updates", included: true },
      { group: "Exhibitions & Business Networking", label: "Business Networking Opportunities & Relevant Trade Updates", included: true },
    ],
    kycDocs: PREMIUM_KYC,
    workflowStages: PREMIUM_STAGES,
  },
];

const STORAGE_KEY = "vistara_billing_plans"; // legacy — cleared on fetch; not used as source of truth

/** @type {object[] | null} */
let memoryPlans = null;
/** True only after a successful GET /api/plans. */
let plansFromApi = false;

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

function normalizeMarketingFeature(row) {
  if (typeof row === "string") {
    const label = row.trim();
    return label ? { label, included: true, group: "" } : null;
  }
  if (!row || typeof row !== "object") return null;
  const label = String(row.label || row.text || "").trim();
  if (!label) return null;
  return {
    label,
    included: row.included !== false,
    group: String(row.group || "").trim(),
  };
}

/** Homepage comparison rows: [label, included]. Falls back to short billing bullets. */
export function planMarketingRows(plan) {
  const rows = Array.isArray(plan?.marketingFeatures) ? plan.marketingFeatures : [];
  const included = rows.filter((f) => f.included !== false);
  if (included.length) return included.map((f) => [f.label, true]);
  return (plan?.features || []).map((f) => [f, true]);
}

/** Homepage checklists grouped by optional `group` (Premium A–G). */
export function planMarketingGroups(plan) {
  const rows = Array.isArray(plan?.marketingFeatures) ? plan.marketingFeatures : [];
  const included = rows.filter((f) => f && f.included !== false && f.label);
  if (!included.length) {
    const fallbackItems = (plan?.features || []).map((label) => ({ label, included: true, group: "" }));
    return fallbackItems.length ? [{ group: "", items: fallbackItems }] : [];
  }
  const groups = [];
  const indexByGroup = new Map();
  for (const f of included) {
    const group = String(f.group || "").trim();
    if (!indexByGroup.has(group)) {
      indexByGroup.set(group, groups.length);
      groups.push({ group, items: [] });
    }
    groups[indexByGroup.get(group)].items.push(f);
  }
  return groups;
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
  const description = String(p.description || fallback?.description || "").trim();
  const timeline = String(p.timeline || fallback?.timeline || "").trim();
  const marketingFeatures = (Array.isArray(p.marketingFeatures) ? p.marketingFeatures : fallback?.marketingFeatures || [])
    .map(normalizeMarketingFeature)
    .filter(Boolean);
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
    description,
    timeline,
    featured,
    features,
    marketingFeatures: marketingFeatures.length
      ? marketingFeatures
      : (fallback?.marketingFeatures || []).map((x) => ({ ...x })),
    kycDocs: kycDocs.length ? kycDocs : (fallback?.kycDocs || []).map((x) => ({ ...x })),
    workflowStages: workflowStages.length
      ? workflowStages
      : (fallback?.workflowStages || []).map((x) => ({ ...x })),
    effectivePrice: planEffectivePrice({ price, discountPercent, effectivePrice: p.effectivePrice }),
  };
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

/** Sync read — API memory for this tab only. Empty until the first successful fetch. */
export function loadPlanCatalog() {
  if (memoryPlans) return memoryPlans.map((p) => ({ ...p }));
  return [];
}

export async function fetchPlanCatalog({ force = false } = {}) {
  if (!force && plansFromApi && memoryPlans) {
    return memoryPlans.map((p) => ({ ...p }));
  }
  try {
    const data = await api("/api/plans", { auth: false });
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    const cleaned = list.map(normalizePlan).filter(Boolean);
    plansFromApi = true;
    setMemory(cleaned);
    return cleaned.map((p) => ({ ...p }));
  } catch (e) {
    console.warn("[plans] API fetch failed", e.message);
    if (plansFromApi && memoryPlans) return memoryPlans.map((p) => ({ ...p }));
    return [];
  }
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
