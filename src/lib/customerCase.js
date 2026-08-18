/**
 * Customer case — Mongo via /api/me/case and /api/cases.
 * Tab memory holds the last API response for sync React reads only.
 * Never invent or mutate case data locally — always write through the API.
 * Workflow stages live on the case document (server snapshot), not plan localStorage.
 */
import { normalizeEmail, markKycComplete, clearKycComplete, getSession, ROLES } from "@/lib/authSession";
import {
  getPlanById,
  mergeWorkflowStages,
  remainingKycDocs,
} from "@/lib/planCatalog";
import { api, apiUpload } from "@/lib/api";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";

export const CASE_STATUS = {
  NO_PLAN: "no_plan",
  UNPAID: "unpaid",
  KYC_INCOMPLETE: "kyc_incomplete",
  KYC_PENDING: "kyc_pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  EXPIRED: "expired",
};

/** Paid plans are valid for one calendar year from purchase or upgrade. */
export const PLAN_VALIDITY_YEARS = 1;

export function addPlanValidity(fromDate = new Date()) {
  const d = new Date(fromDate);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() + PLAN_VALIDITY_YEARS);
    return fallback.toISOString();
  }
  d.setFullYear(d.getFullYear() + PLAN_VALIDITY_YEARS);
  return d.toISOString();
}

/** True when payment is paid and planExpiresAt is still in the future (legacy: no expiry → active). */
export function isPlanEntitlementActive(customerCase, at = Date.now()) {
  if (!customerCase || customerCase.paymentStatus !== "paid" || !customerCase.paidPlanId) return false;
  if (!customerCase.planExpiresAt) return true;
  const expires = new Date(customerCase.planExpiresAt).getTime();
  if (!Number.isFinite(expires)) return true;
  return expires > Number(at);
}

export function isPlanExpired(customerCase, at = Date.now()) {
  if (!customerCase || customerCase.paymentStatus !== "paid" || !customerCase.paidPlanId) return false;
  if (!customerCase.planExpiresAt) return false;
  const expires = new Date(customerCase.planExpiresAt).getTime();
  if (!Number.isFinite(expires)) return false;
  return expires <= Number(at);
}

export function formatPlanExpiry(customerCase) {
  if (!customerCase?.planExpiresAt) return null;
  const d = new Date(customerCase.planExpiresAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const KYC_STATUS = {
  NONE: "none",
  INCOMPLETE: "incomplete",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  NEEDS_MORE: "needs_more",
};

export const DEFAULT_OPS_ROSTER = [
  { email: "ramakrishnamnit@gmail.com", name: "Ramakrishna" },
];

/** @type {Record<string, object>} last API snapshot by customer email */
const caseByEmail = {};
/** @type {object[] | null} last GET /api/cases snapshot */
let opsCaseList = null;
/** @type {object[] | null} last ops roster snapshot */
let opsRoster = null;
/** @type {Promise<object|null> | null} */
let myCaseInflight = null;
/** @type {Promise<object[]> | null} */
let casesQueueInflight = null;

function emit() {
  if (typeof window === "undefined") return;
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent("iehub-case-updated"));
  });
}

function caseSnapshotKey(doc) {
  if (!doc) return "";
  try {
    return JSON.stringify(doc);
  } catch {
    return String(doc?.updatedAt || doc?.id || "");
  }
}

/** Replace mirror from an API case document only. */
function mirrorCase(doc) {
  if (!doc?.customerEmail) return doc;
  const key = normalizeEmail(doc.customerEmail);
  const next = { ...doc, kycUploads: { ...(doc.kycUploads || {}) } };
  const unchanged = caseByEmail[key] && caseSnapshotKey(caseByEmail[key]) === caseSnapshotKey(next);
  caseByEmail[key] = next;
  if (opsCaseList) {
    const i = opsCaseList.findIndex(
      (c) =>
        (c.id && next.id && c.id === next.id) ||
        normalizeEmail(c.customerEmail) === key
    );
    if (i >= 0) opsCaseList[i] = { ...next };
    else opsCaseList = [{ ...next }, ...opsCaseList];
  }
  if (doc.kycStatus === KYC_STATUS.APPROVED) markKycComplete(key);
  else clearKycComplete(key);
  if (!unchanged) emit();
  return { ...caseByEmail[key], kycUploads: { ...(caseByEmail[key].kycUploads || {}) } };
}

function unwrapCase(data) {
  return data?.data || data;
}

/** Sync: last API snapshot only. Does not invent cases. */
export function getCustomerCase(email) {
  const key = normalizeEmail(email);
  if (!key || !caseByEmail[key]) return null;
  return { ...caseByEmail[key], kycUploads: { ...(caseByEmail[key].kycUploads || {}) } };
}

/**
 * Resolve a case from a URL param that may be case id OR customer email
 * (admin links historically used email; email CTAs use case id).
 */
export function findCaseByRef(ref) {
  const raw = decodeURIComponent(String(ref || "").trim());
  if (!raw) return null;
  const byEmail = getCustomerCase(raw);
  if (byEmail) return byEmail;
  const hit = listAllCases().find((c) => String(c.id) === raw);
  if (!hit) return null;
  return getCustomerCase(hit.customerEmail) || { ...hit, kycUploads: { ...(hit.kycUploads || {}) } };
}

/**
 * Load the signed-in customer's case from Mongo.
 * Cached in-tab; concurrent callers share one in-flight request.
 * Pass `{ force: true }` after mutations or auth changes.
 */
export async function fetchMyCase({ force = false } = {}) {
  const session = getSession();
  if (!session?.email || session.role !== ROLES.CUSTOMER) return null;
  const key = normalizeEmail(session.email);
  if (!force && caseByEmail[key]) {
    return { ...caseByEmail[key], kycUploads: { ...(caseByEmail[key].kycUploads || {}) } };
  }
  // Coalesce concurrent callers (including multiple force:true at boot).
  if (myCaseInflight) return myCaseInflight;
  myCaseInflight = (async () => {
    try {
      const data = await api("/api/me/case");
      const doc = unwrapCase(data);
      if (doc?.customerEmail || doc?.id) return mirrorCase(doc);
      return null;
    } catch (e) {
      console.warn("[case] fetchMyCase failed", e.message);
      throw e;
    } finally {
      myCaseInflight = null;
    }
  })();
  return myCaseInflight;
}

/**
 * Load the ops/admin case queue from Mongo.
 * Cached in-tab; pass `{ force: true }` to refresh.
 */
export async function fetchCasesQueue({ force = false } = {}) {
  if (!force && opsCaseList) {
    return opsCaseList.map((c) => ({ ...c }));
  }
  if (casesQueueInflight) return casesQueueInflight;
  casesQueueInflight = (async () => {
    try {
      const data = await api("/api/cases");
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      opsCaseList = list.map((c) => ({ ...c, kycUploads: { ...(c.kycUploads || {}) } }));
      for (const c of opsCaseList) {
        if (c?.customerEmail) {
          caseByEmail[normalizeEmail(c.customerEmail)] = {
            ...c,
            kycUploads: { ...(c.kycUploads || {}) },
          };
        }
      }
      emit();
      return opsCaseList.map((c) => ({ ...c }));
    } catch (e) {
      console.warn("[case] fetchCasesQueue failed", e.message);
      throw e;
    } finally {
      casesQueueInflight = null;
    }
  })();
  return casesQueueInflight;
}

/** Load one case by id from Mongo (admin deep links). */
export async function fetchCaseById(caseId) {
  const id = String(caseId || "").trim();
  if (!id) return null;
  const data = await api(`/api/cases/${encodeURIComponent(id)}`);
  const doc = unwrapCase(data);
  if (doc?.customerEmail || doc?.id) return mirrorCase(doc);
  return null;
}

export async function fetchOpsRoster() {
  try {
    const data = await api("/api/ops/roster");
    const list = Array.isArray(data) ? data : data?.items || data?.value || data?.data || [];
    if (Array.isArray(list) && list.length) {
      opsRoster = list.map((o) => ({
        email: normalizeEmail(o.email),
        name: String(o.name || "").trim() || normalizeEmail(o.email),
      }));
      return opsRoster.map((x) => ({ ...x }));
    }
  } catch (e) {
    console.warn("[case] fetchOpsRoster failed", e.message);
  }
  return loadOpsRoster();
}

export function loadOpsRoster() {
  if (opsRoster?.length) return opsRoster.map((x) => ({ ...x }));
  return DEFAULT_OPS_ROSTER.map((x) => ({ ...x }));
}

export async function saveOpsRoster(list) {
  const roster = (list || [])
    .map((o) => ({
      email: normalizeEmail(o.email),
      name: String(o.name || "").trim() || normalizeEmail(o.email),
    }))
    .filter((o) => o.email);
  await api("/api/ops/roster", { method: "PUT", body: { roster } });
  opsRoster = roster;
  emit();
  return roster.map((x) => ({ ...x }));
}

export async function selectPlan(email, planId) {
  const plan = getPlanById(planId);
  if (!plan) return null;
  const data = await api("/api/me/case/plan", {
    method: "PATCH",
    body: { planId: plan.id },
  });
  const doc = unwrapCase(data);
  if (doc?.id) return mirrorCase(doc);
  return fetchMyCase({ force: true });
}

/** After payment verify — reload case from Mongo (BE marks paid). */
export async function refreshCaseAfterPayment() {
  const session = getSession();
  if (session?.email) delete caseByEmail[normalizeEmail(session.email)];
  if (myCaseInflight) await myCaseInflight.catch(() => {});
  return fetchMyCase({ force: true });
}

/** @deprecated Payment verify on the server is the source of truth. */
export async function markPlanPaid(email) {
  void email;
  return fetchMyCase({ force: true });
}

export async function setKycProfile(_email, profile) {
  await api("/api/kyc/me/profile", { method: "POST", body: profile || {} });
  return fetchMyCase({ force: true });
}

/** Upload a KYC file straight to Mongo/Drive. `onProgress({ percent, phase })` is optional. */
export async function setKycUpload(_email, docId, fileOrMeta, { onProgress } = {}) {
  if (!docId) throw new Error("Document id required");
  const file = fileOrMeta instanceof File || fileOrMeta instanceof Blob ? fileOrMeta : fileOrMeta?.file;
  if (!file) throw new Error("File required — upload to the server, not local cache");
  const fd = new FormData();
  const name =
    (fileOrMeta && !(fileOrMeta instanceof File) && !(fileOrMeta instanceof Blob) && fileOrMeta.name) ||
    file.name ||
    `${docId}.pdf`;
  fd.append("file", file, name);
  await apiUpload(`/api/kyc/me/documents/${encodeURIComponent(docId)}`, {
    formData: fd,
    onProgress: (info) => onProgress?.({ ...info, percent: Math.min(96, Number(info?.percent) || 0) }),
  });
  onProgress?.({ percent: 97, phase: "saving" });
  const updated = await fetchMyCase({ force: true });
  onProgress?.({ percent: 100, phase: "done" });
  return updated;
}

export async function clearKycUpload(_email, docId) {
  if (!docId) return null;
  await api(`/api/kyc/me/documents/${encodeURIComponent(docId)}`, { method: "DELETE" });
  return fetchMyCase({ force: true });
}

export async function submitKyc() {
  await api("/api/kyc/me/submit", { method: "POST", body: {} });
  return fetchMyCase({ force: true });
}

export async function approveKyc(email) {
  const c = getCustomerCase(email);
  if (!c?.id) throw new Error("Case not loaded");
  await api(`/api/kyc/${encodeURIComponent(c.id)}/approve`, { method: "POST", body: {} });
  await fetchCasesQueue({ force: true });
  return getCustomerCase(email);
}

/**
 * @param {string} email
 * @param {string} reason
 * @param {{ missingDocIds?: string[], docNotes?: Record<string, string> }} [opts]
 */
export async function requestKycMore(email, reason, opts = {}) {
  const c = getCustomerCase(email);
  if (!c?.id) throw new Error("Case not loaded");
  await api(`/api/kyc/${encodeURIComponent(c.id)}/needs-more`, {
    method: "POST",
    body: {
      reason: reason || "Additional documents required",
      missingDocIds: opts.missingDocIds || [],
      docNotes: opts.docNotes || {},
    },
  });
  await fetchCasesQueue({ force: true });
  return getCustomerCase(email);
}

/** Per-file KYC review: status = approved | rejected | pending */
export async function reviewKycDocument(email, docId, status, note = "") {
  const c = getCustomerCase(email);
  if (!c?.id || !docId) throw new Error("Case not loaded");
  await api(`/api/kyc/${encodeURIComponent(c.id)}/documents/${encodeURIComponent(docId)}/review`, {
    method: "POST",
    body: { status, note: note || undefined },
  });
  await fetchCasesQueue({ force: true });
  return getCustomerCase(email);
}

/** Authenticated download/view of a Drive-backed file. */
export async function fetchCaseFileBlob(fileId) {
  const { getToken } = await import("@/lib/api");
  const token = getToken();
  const { apiUrl } = await import("@/lib/apiBase");
  const res = await fetch(apiUrl(`/api/files/${encodeURIComponent(fileId)}/download`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = USER_MESSAGES.download;
    try {
      const data = await res.clone().json();
      if (typeof data?.message === "string") msg = toUserMessage({ message: data.message, status: res.status }, USER_MESSAGES.download);
    } catch {
      /* ignore */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.blob();
}

/**
 * Open a file blob in a new tab. Opens about:blank synchronously first so the
 * browser does not treat the post-fetch navigation as a blocked popup.
 */
export function openBlobInNewTab(blob) {
  if (!blob) throw new Error("No file to open");
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    const err = new Error("Popup blocked. Allow popups for this site, or use Download.");
    err.code = "POPUP_BLOCKED";
    throw err;
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return w;
}

export async function openCaseFile(fileId) {
  const w = window.open("about:blank", "_blank");
  try {
    const blob = await fetchCaseFileBlob(fileId);
    const url = URL.createObjectURL(blob);
    if (w && !w.closed) {
      try {
        w.location.href = url;
      } catch {
        w.location.replace(url);
      }
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return w;
    }
    const again = window.open(url, "_blank");
    if (again) {
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return again;
    }
    URL.revokeObjectURL(url);
    const err = new Error("Popup blocked. Allow popups for this site, or use Download.");
    err.code = "POPUP_BLOCKED";
    throw err;
  } catch (e) {
    try {
      if (w && !w.closed) w.close();
    } catch {
      /* ignore */
    }
    throw e;
  }
}

export function downloadCaseFile(fileId, filename = "download") {
  return fetchCaseFileBlob(fileId).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  });
}

/** Docs the customer still needs to fix (rejected or explicitly requested). */
export function getKycActionDocs(customerCase, planDocs = []) {
  if (!customerCase) return [];
  const byId = Object.fromEntries((planDocs || []).map((d) => [d.id, d]));
  const missing = new Set(customerCase.kycMissingDocIds || []);
  const uploads = customerCase.kycUploads || {};
  for (const [id, meta] of Object.entries(uploads)) {
    if (meta?.reviewStatus === "rejected") missing.add(id);
  }
  return [...missing].map((id) => ({
    id,
    label: byId[id]?.label || id,
    note: uploads[id]?.reviewNote || customerCase.kycRejectReason || "",
    reviewStatus: uploads[id]?.reviewStatus || "missing",
    uploaded: Boolean(uploads[id]),
  }));
}

/** Advance workflow stage in Mongo, then mirror the response. */
export async function setCaseStage(email, _stageIndex, note) {
  const cur = getCustomerCase(email);
  if (!cur?.id) throw new Error("Case not loaded yet — refresh and try again");
  const data = await api(`/api/cases/${encodeURIComponent(cur.id)}/stage/approve`, {
    method: "POST",
    body: { note: note || "" },
  });
  const doc = unwrapCase(data);
  if (doc?.id) return mirrorCase(doc);
  await fetchCasesQueue({ force: true });
  return getCustomerCase(email);
}

export async function reassignOps(email, opsEmail, opsName) {
  const c = getCustomerCase(email);
  if (!c?.id) throw new Error("Case not loaded");
  const data = await api(`/api/cases/${encodeURIComponent(c.id)}/assign`, {
    method: "PATCH",
    body: { opsEmail: normalizeEmail(opsEmail), opsName: opsName || opsEmail },
  });
  const doc = unwrapCase(data);
  if (doc?.id) return mirrorCase(doc);
  await fetchCasesQueue({ force: true });
  return getCustomerCase(email);
}

/** Ops/admin upload a deliverable for the customer (multipart → Drive/Mongo). */
export async function addOpsDocument(email, { file, stageId, label, note }) {
  const c = getCustomerCase(email);
  if (!c?.id) throw new Error("Case not found");
  if (!file) throw new Error("File required");
  const title = String(label || "").trim();
  if (!title) throw new Error("Please enter what this document is");
  const fd = new FormData();
  fd.append("file", file, file.name || "document.pdf");
  fd.append("label", title);
  if (note && String(note).trim()) fd.append("note", String(note).trim());
  if (stageId) fd.append("stageId", String(stageId));
  await api(`/api/cases/${encodeURIComponent(c.id)}/documents`, { method: "POST", formData: fd });
  await fetchCasesQueue({ force: true });
  return getCustomerCase(email);
}

/** Customer upload (optionally fulfilling an ops doc request). */
export async function addCustomerDocument(email, { file, requestId, label }) {
  const c = getCustomerCase(email);
  if (!c?.id) throw new Error("Case not found");
  if (!file) throw new Error("File required");
  const fd = new FormData();
  fd.append("file", file, file.name || "document.pdf");
  if (label) fd.append("label", String(label).trim());
  if (requestId) {
    await api(`/api/cases/${encodeURIComponent(c.id)}/doc-requests/${encodeURIComponent(requestId)}/fulfill`, {
      method: "POST",
      formData: fd,
    });
  } else {
    await api(`/api/cases/${encodeURIComponent(c.id)}/documents`, { method: "POST", formData: fd });
  }
  return fetchMyCase({ force: true });
}

/** Ops/admin request a missing document from the customer. */
export async function requestDocument(email, { label, reason }) {
  const c = getCustomerCase(email);
  if (!c?.id) throw new Error("Case not found");
  await api(`/api/cases/${encodeURIComponent(c.id)}/doc-requests`, {
    method: "POST",
    body: {
      label: (label || "Additional document").trim(),
      reason: (reason || "").trim(),
    },
  });
  await fetchCasesQueue({ force: true });
  return getCustomerCase(email);
}

export function getCaseWorkflowStages(customerCase) {
  const current = getPlanById(customerCase?.paidPlanId || customerCase?.planId);
  const prevIds = customerCase?.previousPlanIds || [];
  if (!customerCase?.paidPlanId && !customerCase?.planId) return [];
  if (!prevIds.length) return (current?.workflowStages || []).map((s) => ({ ...s }));
  let stages = [];
  for (const id of prevIds) {
    const p = getPlanById(id);
    stages = mergeWorkflowStages({ workflowStages: stages }, p);
  }
  return mergeWorkflowStages({ workflowStages: stages }, current);
}

/** True when ops has marked every plan stage complete. */
export function isWorkflowComplete(customerCase) {
  if (!customerCase) return false;
  if (customerCase.status === CASE_STATUS.COMPLETED) return true;
  const stages = getCaseWorkflowStages(customerCase);
  if (!stages.length) return false;
  return Math.max(0, Number(customerCase.stageIndex || 0)) >= stages.length;
}

export function currentStageLabel(customerCase) {
  const stages = getCaseWorkflowStages(customerCase);
  const idx = Math.max(0, Number(customerCase?.stageIndex || 0));
  if (stages.length && idx >= stages.length) return "Completed";
  return stages[idx]?.label || "—";
}

/** Paid + KYC approved: customer keeps full dashboard access (in progress or finished). */
export function isWorkspaceUnlocked(status) {
  return status === CASE_STATUS.ACTIVE || status === CASE_STATUS.COMPLETED;
}

export function getRequiredKycDocs(customerCase) {
  const plan = getPlanById(customerCase?.paidPlanId || customerCase?.planId);
  const docs = Array.isArray(plan?.kycDocs) ? plan.kycDocs : [];
  if (!docs.length) return [];
  if (customerCase?.paymentStatus !== "paid" || !isPlanEntitlementActive(customerCase)) {
    return docs.map((d) => ({ ...d }));
  }
  const uploaded = Object.keys(customerCase.kycUploads || {});
  if (customerCase.kycStatus === KYC_STATUS.APPROVED) return [];
  if ((customerCase.previousPlanIds || []).length) {
    return remainingKycDocs(plan, uploaded);
  }
  return docs.map((d) => ({ ...d }));
}

export function journeyStatus(customerCase) {
  if (!customerCase) return CASE_STATUS.NO_PLAN;
  if (customerCase.paymentStatus !== "paid" || !customerCase.paidPlanId) {
    return customerCase.planId ? CASE_STATUS.UNPAID : CASE_STATUS.NO_PLAN;
  }
  if (isPlanExpired(customerCase)) return CASE_STATUS.EXPIRED;
  if (
    customerCase.kycStatus === KYC_STATUS.NONE ||
    customerCase.kycStatus === KYC_STATUS.INCOMPLETE ||
    customerCase.kycStatus === KYC_STATUS.NEEDS_MORE
  ) {
    return CASE_STATUS.KYC_INCOMPLETE;
  }
  if (customerCase.kycStatus === KYC_STATUS.SUBMITTED) return CASE_STATUS.KYC_PENDING;
  if (customerCase.kycStatus === KYC_STATUS.APPROVED) {
    if (customerCase.status === CASE_STATUS.COMPLETED || isWorkflowComplete(customerCase)) {
      return CASE_STATUS.COMPLETED;
    }
    return CASE_STATUS.ACTIVE;
  }
  return CASE_STATUS.KYC_INCOMPLETE;
}

export function gatePathForCase(customerCase) {
  if (!customerCase) return "/dashboard/billing";
  const s = journeyStatus(customerCase);
  if (s === CASE_STATUS.NO_PLAN) return "/dashboard/billing";
  if (s === CASE_STATUS.UNPAID || s === CASE_STATUS.EXPIRED) return "/dashboard/billing";
  if (s === CASE_STATUS.KYC_INCOMPLETE || s === CASE_STATUS.KYC_PENDING) return "/dashboard/kyc";
  return "/dashboard";
}

export function isPathAllowedDuringGate(pathname, customerCase) {
  const s = journeyStatus(customerCase);
  if (isWorkspaceUnlocked(s)) return true;
  const path = pathname || "";
  const always = [
    "/dashboard/messages",
    "/dashboard/events",
    "/dashboard/support",
    "/dashboard/brochures",
    "/dashboard/gallery",
    "/dashboard/about",
    "/dashboard/contact",
    "/dashboard/products",
    "/dashboard/booking",
    "/dashboard/settings",
  ];
  if (always.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  if (s === CASE_STATUS.NO_PLAN || s === CASE_STATUS.UNPAID || s === CASE_STATUS.EXPIRED) {
    return path === "/dashboard/billing" || path.startsWith("/dashboard/billing/");
  }
  if (s === CASE_STATUS.KYC_INCOMPLETE || s === CASE_STATUS.KYC_PENDING) {
    return (
      path === "/dashboard/kyc" ||
      path.startsWith("/dashboard/kyc/") ||
      path === "/dashboard/billing" ||
      path.startsWith("/dashboard/billing/")
    );
  }
  return true;
}

export function listAllCases() {
  if (opsCaseList) return opsCaseList.map((c) => ({ ...c }));
  return Object.values(caseByEmail).sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );
}

export function listCasesForOps(opsEmail) {
  const key = normalizeEmail(opsEmail);
  return listAllCases().filter((c) => !c.opsEmail || normalizeEmail(c.opsEmail) === key);
}

export function ensureCaseForSession() {
  const session = getSession();
  if (!session || session.role !== ROLES.CUSTOMER) return null;
  return getCustomerCase(session.email);
}

/** Cases live in Mongo — no browser demo seed. */
export function seedDemoCasesIfNeeded() {}
