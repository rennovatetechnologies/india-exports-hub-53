const STORAGE_KEY = "vistara_session";
const ADMIN_REQUESTS_KEY = "vistara_admin_requests";
/** Lowercased emails that finished customer KYC (persists across sessions). */
const KYC_COMPLETE_KEY = "vistara_kyc_complete_emails";

function parseKycEmailSet() {
  try {
    const raw = localStorage.getItem(KYC_COMPLETE_KEY);
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((e) => String(e).trim().toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

/** Roles supported across the platform. */
export const ROLES = {
  CUSTOMER: "customer",
  OPERATIONS: "operations",
  ADMIN: "admin",
};

export const ADMIN_STATUS = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  ACTIVE: "Active",
};

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/** Normalize staff role from stored requests or API (legacy `super` → admin workspace). */
export function normalizeStaffRole(role) {
  if (role === ROLES.ADMIN || role === ROLES.OPERATIONS) return role;
  const r = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (r === "admin" || r === "super_admin" || r === "super" || r === "superadmin") return ROLES.ADMIN;
  if (r === "operations" || r === "ops") return ROLES.OPERATIONS;
  return ROLES.OPERATIONS;
}

/** Whether this email has completed customer KYC (local mock store). */
export function hasCompletedKyc(email) {
  const key = normalizeEmail(email);
  if (!key) return false;
  return parseKycEmailSet().has(key);
}

/** Call when the customer submits KYC so they are not forced through the wizard again. */
export function markKycComplete(email) {
  const key = normalizeEmail(email);
  if (!key) return;
  const next = parseKycEmailSet();
  next.add(key);
  localStorage.setItem(KYC_COMPLETE_KEY, JSON.stringify([...next]));
}

function displayNameFromEmail(email) {
  if (!email || typeof email !== "string") return "Customer";
  const local = email.split("@")[0] || "";
  const words = local.replace(/[._-]+/g, " ").trim();
  if (!words) return "Customer";
  return words.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.email !== "string" || !data.email.trim()) return null;
    const email = data.email.trim();
    const rawRole = typeof data.role === "string" ? data.role.trim() : ROLES.CUSTOMER;
    const role = rawRole === "super" ? ROLES.ADMIN : rawRole;
    const kycComplete = role === ROLES.CUSTOMER ? hasCompletedKyc(email) : true;
    return {
      email,
      name: (typeof data.name === "string" && data.name.trim()) || displayNameFromEmail(data.email),
      phone: typeof data.phone === "string" ? data.phone.trim() : "",
      role,
      status: typeof data.status === "string" ? data.status : ADMIN_STATUS.ACTIVE,
      kycComplete,
    };
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function setSession({ email, name, phone, role, status }) {
  const payload = {
    email: String(email || "").trim(),
    name: String(name || "").trim() || displayNameFromEmail(email),
    phone: phone != null ? String(phone).trim() : "",
    role: (() => {
      const r = role || ROLES.CUSTOMER;
      return r === "super" ? ROLES.ADMIN : r;
    })(),
    status: status || ADMIN_STATUS.ACTIVE,
  };
  if (!payload.email) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Avoid open redirects: only same-origin relative paths. */
export function safeNextPath(raw) {
  if (!raw || typeof raw !== "string") return "/dashboard";
  const decoded = decodeURIComponent(raw.trim());
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return "/dashboard";
}

/** Workspace path for a given role. */
export function workspaceFor(role) {
  if (role === ROLES.ADMIN || role === "super") return "/admin/platform";
  if (role === ROLES.OPERATIONS) return "/admin";
  return "/dashboard";
}

/* ---------- Admin registration requests (mock store) ---------- */

const SEED_REQUESTS = [
  { id: "REQ-1042", name: "Sanjay Rao", email: "sanjay.r@vistara.in", phone: "+91 98100 10001", role: ROLES.ADMIN, department: "Platform governance", employeeId: "VST-001", reason: "Bootstrap platform admin", status: ADMIN_STATUS.APPROVED, emailVerified: true, createdAt: "2025-04-01T08:00:00Z" },
  { id: "REQ-1041", name: "Aditi Khanna", email: "aditi.k@vistara.in", phone: "+91 98765 11220", role: ROLES.OPERATIONS, department: "Compliance ops", employeeId: "VST-227", reason: "Joining ICEGATE desk", status: ADMIN_STATUS.PENDING, emailVerified: true, createdAt: "2025-05-10T09:14:00Z" },
  { id: "REQ-1040", name: "Karan Shetty", email: "karan.s@vistara.in", phone: "+91 99820 10044", role: ROLES.OPERATIONS, department: "Customer success", employeeId: "VST-218", reason: "Backfill for outgoing CSM", status: ADMIN_STATUS.PENDING, emailVerified: false, createdAt: "2025-05-09T17:32:00Z" },
  { id: "REQ-1039", name: "Meera Iyer", email: "meera@vistara.in", phone: "+91 90000 23456", role: ROLES.ADMIN, department: "Finance leadership", employeeId: "VST-104", reason: "Quarter close + pricing controls", status: ADMIN_STATUS.PENDING, emailVerified: true, createdAt: "2025-05-08T11:02:00Z" },
  { id: "REQ-1038", name: "Rahul Bose", email: "rahul.b@vistara.in", phone: "+91 98111 33221", role: ROLES.OPERATIONS, department: "Documentation", employeeId: "VST-201", reason: "Volume spike in May", status: ADMIN_STATUS.APPROVED, emailVerified: true, createdAt: "2025-05-04T08:00:00Z" },
];

function seedIfEmpty() {
  try {
    const raw = localStorage.getItem(ADMIN_REQUESTS_KEY);
    if (!raw) localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify(SEED_REQUESTS));
  } catch {}
}

export function getAdminRequests() {
  if (typeof window === "undefined") return SEED_REQUESTS;
  seedIfEmpty();
  try {
    return JSON.parse(localStorage.getItem(ADMIN_REQUESTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addAdminRequest(req) {
  seedIfEmpty();
  const list = getAdminRequests();
  const next = [{
    id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    status: ADMIN_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    ...req,
  }, ...list];
  localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify(next));
  return next[0];
}

export function updateAdminRequest(id, patch) {
  const list = getAdminRequests().map((r) => (r.id === id ? { ...r, ...patch } : r));
  localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify(list));
  return list;
}

/**
 * Resolve staff sign-in from the local request queue (replace with backend `/auth/staff` when wired).
 * Role always comes from the approved request — never from email shape.
 */
export function resolveAdminLoginForEmail(email) {
  const key = normalizeEmail(email);
  if (!key) return { kind: "invalid" };

  const matches = getAdminRequests().filter((r) => normalizeEmail(r.email) === key);
  if (!matches.length) return { kind: "no_request" };

  const byNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

  const approved = matches.filter((r) => r.status === ADMIN_STATUS.APPROVED).sort(byNewest);
  if (approved.length) {
    const request = approved[0];
    const role = normalizeStaffRole(request.role);
    return { kind: "ok", request: { ...request, role } };
  }

  const pending = matches.filter((r) => r.status === ADMIN_STATUS.PENDING).sort(byNewest);
  if (pending.length) return { kind: "pending", request: pending[0] };

  const rejected = matches.filter((r) => r.status === ADMIN_STATUS.REJECTED).sort(byNewest);
  if (rejected.length) return { kind: "rejected", request: rejected[0] };

  const suspended = matches.filter((r) => r.status === ADMIN_STATUS.SUSPENDED).sort(byNewest);
  if (suspended.length) return { kind: "suspended", request: suspended[0] };

  return { kind: "blocked", request: matches.sort(byNewest)[0] };
}

/* ---------- Email OTP (client mock; replace with API send/verify) ---------- */

const OTP_PENDING_KEY = "vistara_email_otp_pending";
const SIGNUP_DRAFT_KEY = "vistara_signup_draft";
const STAFF_REGISTER_DRAFT_KEY = "vistara_staff_register_draft";

export const OTP_PURPOSE = {
  CUSTOMER_LOGIN: "customer_login",
  CUSTOMER_SIGNUP: "customer_signup",
  STAFF_LOGIN: "staff_login",
  STAFF_REGISTER: "staff_register",
};

/** Start or refresh a pending email OTP in sessionStorage. */
export function startEmailOtp(email, purpose) {
  if (typeof window === "undefined") return { ok: false };
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const payload = {
    email: normalized,
    code,
    purpose,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  sessionStorage.setItem(OTP_PENDING_KEY, JSON.stringify(payload));
  if (import.meta.env?.DEV) {
    console.info(`[VISTARA demo OTP] ${normalized}: ${code}`);
  }
  return { ok: true };
}

export function getPendingOtpInfo() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(OTP_PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.email || !p?.purpose) return null;
    if (Date.now() > (p.expiresAt || 0)) return null;
    return { email: p.email, purpose: p.purpose };
  } catch {
    return null;
  }
}

export function resendPendingEmailOtp() {
  if (typeof window === "undefined") return { ok: false };
  try {
    const raw = sessionStorage.getItem(OTP_PENDING_KEY);
    if (!raw) return { ok: false };
    const p = JSON.parse(raw);
    if (!p?.email || !p?.purpose) return { ok: false };
    return startEmailOtp(p.email, p.purpose);
  } catch {
    return { ok: false };
  }
}

/**
 * Verify the 6-digit code for the current pending OTP session.
 * Until email delivery is integrated, any 6-digit code is accepted (pending session must exist and not be expired).
 * @returns {{ ok: true, email: string, purpose: string } | { ok: false, reason: string }}
 */
export function verifyPendingEmailOtp(code) {
  if (typeof window === "undefined") return { ok: false, reason: "no_window" };
  try {
    const raw = sessionStorage.getItem(OTP_PENDING_KEY);
    if (!raw) return { ok: false, reason: "no_pending" };
    const p = JSON.parse(raw);
    if (!p?.email || !p?.purpose) return { ok: false, reason: "no_pending" };
    if (Date.now() > (p.expiresAt || 0)) return { ok: false, reason: "expired" };
    const entered = String(code || "").replace(/\D/g, "");
    if (entered.length !== 6) return { ok: false, reason: "invalid" };
    sessionStorage.removeItem(OTP_PENDING_KEY);
    return { ok: true, email: p.email, purpose: p.purpose };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export function clearPendingEmailOtp() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(OTP_PENDING_KEY);
}

export function setSignupDraft(draft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
}

export function getSignupDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SIGNUP_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSignupDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
}

export function setStaffRegisterDraft(draft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STAFF_REGISTER_DRAFT_KEY, JSON.stringify(draft));
}

export function getStaffRegisterDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STAFF_REGISTER_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStaffRegisterDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STAFF_REGISTER_DRAFT_KEY);
}
