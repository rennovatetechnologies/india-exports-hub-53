/**
 * Shipment cases and per-workflow document requirements.
 * Vault UI is scoped by case id so each workflow can list different documents.
 */

export const WORKFLOW_CASES = [
  { id: "VST-2041", title: "Spices · Nagpur → Rotterdam", buyer: "EuroSpice BV", value: "$48,200", stage: 4, accountName: "Anil Sharma", accountCompany: "Sharma Spices Pvt Ltd", sla: "On track", opsOwner: "Riya M." },
  { id: "VST-2038", title: "Pulses · Mumbai → Dubai", buyer: "Al-Madar Trading", value: "$22,900", stage: 6, accountName: "Meera Kulkarni", accountCompany: "Konkan Pulse Exports", sla: "On track", opsOwner: "Neha T." },
  { id: "VST-2034", title: "Organic · Cochin → Hamburg", buyer: "BioNord GmbH", value: "$31,400", stage: 2, accountName: "Thomas George", accountCompany: "Kerala Organic Coop", sla: "On track", opsOwner: "Aman P." },
  { id: "VST-2039", title: "Coastal Organics · ICEGATE filing", buyer: "Gulf Retail LLC", value: "$18,200", stage: 3, accountName: "Priya Nair", accountCompany: "Coastal Organics", sla: "Due today", opsOwner: "Karan S." },
  { id: "VST-2036", title: "Verma Agro · IEC issuance", buyer: "FreshMart EU", value: "$9,400", stage: 2, accountName: "Mohit Verma", accountCompany: "Verma Agro Exports", sla: "Breached", opsOwner: "Riya M." },
  { id: "VST-2033", title: "Iyer Foods · RCMC / APEDA", buyer: "Nordic Foods AB", value: "$12,100", stage: 2, accountName: "Lakshmi Iyer", accountCompany: "Iyer Foods", sla: "On track", opsOwner: "Aman P." },
  { id: "VST-2030", title: "Saffron Trade · KYC review", buyer: "—", value: "—", stage: 1, accountName: "Rohan Gupta", accountCompany: "Saffron Trade Co.", sla: "On track", opsOwner: "Karan S." },
];

/** Shipment pipeline stages (index = active step in UI; `stage === length` = all completed). */
export const WORKFLOW_STAGE_LABELS = [
  "Lead onboarded",
  "KYC verified",
  "IEC issued",
  "AD code mapped",
  "Buyer confirmed",
  "Shipment booked",
  "Customs cleared",
  "Payment received",
];

export const WORKFLOW_STAGE_TOTAL = WORKFLOW_STAGE_LABELS.length;

/**
 * @typedef {{
 *   name: string;
 *   size: string;
 *   updated: string;
 *   status: "verified" | "review" | "missing" | "rejected";
 *   opsComment?: string;
 *   flagged?: boolean;
 *   opsAction?: string;
 * }} VaultDoc
 */

/** @type {Record<string, VaultDoc[]>} */
export const WORKFLOW_VAULT_DOCS = {
  "VST-2041": [
    { name: "Commercial Invoice VST-2041.pdf", size: "92 KB", updated: "08 Apr", status: "verified" },
    { name: "Packing List VST-2041.pdf", size: "144 KB", updated: "08 Apr", status: "verified" },
    { name: "BL Draft Rotterdam.pdf", size: "267 KB", updated: "07 Apr", status: "missing" },
    { name: "Phytosanitary Cert.jpg", size: "1.2 MB", updated: "06 Apr", status: "review" },
    { name: "Certificate of Origin.pdf", size: "201 KB", updated: "06 Apr", status: "verified" },
    { name: "Letter of Credit.pdf", size: "—", updated: "—", status: "missing" },
  ],
  "VST-2038": [
    { name: "Commercial Invoice VST-2038.pdf", size: "88 KB", updated: "02 May", status: "verified" },
    { name: "Packing List VST-2038.pdf", size: "120 KB", updated: "02 May", status: "verified" },
    { name: "Health Certificate (UAE).pdf", size: "—", updated: "—", status: "missing" },
    { name: "Insurance Cover Note.pdf", size: "340 KB", updated: "01 May", status: "review" },
    { name: "Container Load Plan.pdf", size: "56 KB", updated: "30 Apr", status: "verified" },
  ],
  "VST-2034": [
    { name: "EU Organic Transaction Certificate.pdf", size: "—", updated: "—", status: "missing" },
    { name: "NOP Organic Certificate.pdf", size: "412 KB", updated: "28 Apr", status: "review" },
    { name: "Commercial Invoice (proforma).pdf", size: "64 KB", updated: "25 Apr", status: "verified" },
    { name: "Booking Confirmation.pdf", size: "—", updated: "—", status: "missing" },
  ],
  "VST-2039": [
    { name: "ICEGATE filing acknowledgement.pdf", size: "156 KB", updated: "12 May", status: "review" },
    { name: "Shipping bill draft.pdf", size: "—", updated: "—", status: "missing" },
    { name: "LUT certificate.pdf", size: "88 KB", updated: "11 May", status: "verified" },
  ],
  "VST-2036": [
    { name: "IEC application printout.pdf", size: "64 KB", updated: "10 May", status: "review" },
    { name: "Board resolution IEC.pdf", size: "—", updated: "—", status: "missing" },
  ],
  "VST-2033": [
    { name: "RCMC application.pdf", size: "120 KB", updated: "09 May", status: "verified" },
    { name: "APEDA registration proof.pdf", size: "—", updated: "—", status: "missing" },
  ],
  "VST-2030": [
    { name: "PAN card.pdf", size: "240 KB", updated: "08 May", status: "review" },
    { name: "GST certificate.pdf", size: "310 KB", updated: "08 May", status: "review" },
    { name: "Bank statement (3 mo).pdf", size: "—", updated: "—", status: "missing" },
  ],
};

const VAULT_DOCS_STORAGE_KEY = "iehub_vault_docs_v1";

function cloneDefaultVaultDocs() {
  const o = {};
  for (const k of Object.keys(WORKFLOW_VAULT_DOCS)) {
    o[k] = WORKFLOW_VAULT_DOCS[k].map((d) => ({ ...d }));
  }
  return o;
}

/** @returns {Record<string, VaultDoc[]>} */
export function loadVaultDocsFromStorage() {
  const defaults = cloneDefaultVaultDocs();
  if (typeof localStorage === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(VAULT_DOCS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const incoming = parsed[key];
      if (!Array.isArray(incoming) || incoming.length !== defaults[key].length) continue;
      out[key] = incoming.map((row, i) => ({ ...defaults[key][i], ...row }));
    }
    return out;
  } catch {
    return defaults;
  }
}

/** @param {Record<string, VaultDoc[]>} data */
export function saveVaultDocsToStorage(data) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(VAULT_DOCS_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("iehub-vault-docs-updated"));
  } catch {
    /* ignore quota */
  }
}

const WORKFLOW_STATE_KEY = "iehub_workflow_state_v1";

function loadWorkflowState() {
  if (typeof localStorage === "undefined") return { stages: {}, activity: {} };
  try {
    const raw = localStorage.getItem(WORKFLOW_STATE_KEY);
    if (!raw) return { stages: {}, activity: {} };
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return { stages: {}, activity: {} };
    return {
      stages: typeof p.stages === "object" && p.stages ? p.stages : {},
      activity: typeof p.activity === "object" && p.activity ? p.activity : {},
    };
  } catch {
    return { stages: {}, activity: {} };
  }
}

function saveWorkflowState(state) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(WORKFLOW_STATE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("iehub-workflow-updated"));
  } catch {
    /* ignore quota */
  }
}

/** @returns {typeof WORKFLOW_CASES} */
export function loadWorkflowCasesWithOverrides() {
  const { stages } = loadWorkflowState();
  return WORKFLOW_CASES.map((c) => {
    const s = stages[c.id];
    const ok = typeof s === "number" && s >= 0 && s <= WORKFLOW_STAGE_TOTAL;
    return { ...c, stage: ok ? s : c.stage };
  });
}

/** @param {number} stageIndex 0 … WORKFLOW_STAGE_TOTAL (inclusive; total = all steps done). */
export function persistWorkflowStage(caseId, stageIndex) {
  const s = loadWorkflowState();
  const clamped = Math.max(0, Math.min(WORKFLOW_STAGE_TOTAL, Math.floor(stageIndex)));
  s.stages[caseId] = clamped;
  saveWorkflowState(s);
}

/** @param {{ who: string; text: string; kind?: "comment" | "approve" | "reject" }} item */
export function appendWorkflowCaseActivity(caseId, item) {
  const s = loadWorkflowState();
  const prev = Array.isArray(s.activity[caseId]) ? s.activity[caseId] : [];
  const entry = {
    who: item.who,
    text: item.text,
    kind: item.kind || "comment",
    when: item.when || "Just now",
  };
  s.activity[caseId] = [entry, ...prev];
  saveWorkflowState(s);
}

export function loadWorkflowCaseActivity(caseId) {
  const s = loadWorkflowState();
  return Array.isArray(s.activity[caseId]) ? s.activity[caseId] : [];
}

export function getCaseById(caseId) {
  return loadWorkflowCasesWithOverrides().find((c) => c.id === caseId) ?? null;
}
