import { toUserMessage } from "@/lib/friendlyError";

const STORAGE_KEY = "vistara_session";
const TOKEN_KEY = "vistara_token";
const ADMIN_REQUESTS_KEY = "vistara_admin_requests";
/** Lowercased emails that finished customer KYC (persists across sessions). */
const KYC_COMPLETE_KEY = "vistara_kyc_complete_emails";
/** Fired on the window when session is created or cleared — keep nav/chrome in sync. */
export const AUTH_CHANGED_EVENT = "iehub-auth-changed";

/** Client session TTL when JWT has no `exp` (demo / legacy). Matches backend JWT_EXPIRE_HOURS=2. */
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

let expiryTimerId = null;

function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {}
}

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/** Decode JWT payload without verifying signature (expiry UX only; API still verifies). */
export function readJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/** Absolute expiry timestamp (ms) from JWT `exp`, or null if missing/invalid. */
export function tokenExpiresAtMs(token) {
  const payload = readJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  return exp * 1000;
}

function clearExpiryTimer() {
  if (expiryTimerId != null) {
    clearTimeout(expiryTimerId);
    expiryTimerId = null;
  }
}

/**
 * Schedule automatic logout at expiresAt. Call on login and app boot.
 * No-ops when already expired (caller should clearSession).
 */
export function scheduleSessionExpiry(expiresAtMs) {
  clearExpiryTimer();
  if (typeof window === "undefined") return;
  const at = Number(expiresAtMs);
  if (!Number.isFinite(at)) return;
  const delay = at - Date.now();
  if (delay <= 0) return;
  // setTimeout delay is 32-bit; clamp to ~24d (session is 2h so fine)
  expiryTimerId = window.setTimeout(() => {
    expiryTimerId = null;
    clearSession();
  }, Math.min(delay, 2_147_483_647));
}

/** Resolve session end time: prefer JWT exp, else stored expiresAt, else null. */
function resolveExpiresAtMs(storedExpiresAt) {
  const fromJwt = tokenExpiresAtMs(getStoredToken());
  if (fromJwt != null) return fromJwt;
  const stored = Number(storedExpiresAt);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return null;
}

/** Persist a 2h window for legacy sessions that have no JWT and no expiresAt. */
function ensureExpiresAtOnSessionData(data) {
  const existing = resolveExpiresAtMs(data?.expiresAt);
  if (existing != null) return existing;
  const expiresAt = Date.now() + SESSION_TTL_MS;
  try {
    const next = { ...data, expiresAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return expiresAt;
}

/** If session/token is past expiry, clear and return true. */
function expireSessionIfNeeded(data) {
  const expiresAt = ensureExpiresAtOnSessionData(data);
  if (Date.now() < expiresAt) {
    scheduleSessionExpiry(expiresAt);
    return false;
  }
  clearExpiryTimer();
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
  notifyAuthChanged();
  return true;
}

/** Boot hook: enforce expiry for an existing local session (call once from app root). */
export function initSessionExpiryWatch() {
  if (typeof window === "undefined") return;
  const session = getSession();
  if (!session) return;
  const expiresAt = resolveExpiresAtMs(session.expiresAt);
  if (expiresAt != null) scheduleSessionExpiry(expiresAt);
}

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

/** Clear local KYC-complete flag (used by incomplete-KYC demo personas). */
export function clearKycComplete(email) {
  const key = normalizeEmail(email);
  if (!key) return;
  const next = parseKycEmailSet();
  if (!next.delete(key)) return;
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
    if (expireSessionIfNeeded(data)) return null;
    const email = data.email.trim();
    const rawRole = typeof data.role === "string" ? data.role.trim() : ROLES.CUSTOMER;
    const role = rawRole === "super" ? ROLES.ADMIN : rawRole;
    const kycComplete =
      role === ROLES.CUSTOMER
        ? typeof data.kycComplete === "boolean"
          ? data.kycComplete
          : hasCompletedKyc(email)
        : true;
    const expiresAt = resolveExpiresAtMs(data.expiresAt) ?? ensureExpiresAtOnSessionData(data);
    return {
      email,
      name: (typeof data.name === "string" && data.name.trim()) || displayNameFromEmail(data.email),
      phone: typeof data.phone === "string" ? data.phone.trim() : "",
      role,
      status: typeof data.status === "string" ? data.status : ADMIN_STATUS.ACTIVE,
      company: typeof data.company === "string" ? data.company : "",
      kycComplete,
      expiresAt,
    };
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

/** True when session role is operations or admin. */
export function isStaffSession(session = getSession()) {
  const role = session?.role;
  return role === ROLES.ADMIN || role === ROLES.OPERATIONS || role === "super";
}

/** Subscribe to login/logout (and cross-tab storage). Returns unsubscribe. */
export function subscribeAuth(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange(getSession());
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY || e.key === TOKEN_KEY) handler();
  };
  window.addEventListener(AUTH_CHANGED_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}

export function setSession({ email, name, phone, role, status, token, kycComplete, company, expiresAt }) {
  const payload = {
    email: String(email || "").trim(),
    name: String(name || "").trim() || displayNameFromEmail(email),
    phone: phone != null ? String(phone).trim() : "",
    company: company != null ? String(company).trim() : "",
    role: (() => {
      const r = role || ROLES.CUSTOMER;
      return r === "super" ? ROLES.ADMIN : r;
    })(),
    status: status || ADMIN_STATUS.ACTIVE,
  };
  if (typeof kycComplete === "boolean") payload.kycComplete = kycComplete;
  if (!payload.email) return;

  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  }

  const jwtExp = tokenExpiresAtMs(token || getStoredToken());
  const explicit = Number(expiresAt);
  payload.expiresAt =
    jwtExp ??
    (Number.isFinite(explicit) && explicit > 0 ? explicit : Date.now() + SESSION_TTL_MS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (payload.role === ROLES.CUSTOMER && typeof kycComplete === "boolean") {
    if (kycComplete) markKycComplete(payload.email);
    else clearKycComplete(payload.email);
  }
  scheduleSessionExpiry(payload.expiresAt);
  notifyAuthChanged();
}

export function clearSession() {
  clearExpiryTimer();
  localStorage.removeItem(STORAGE_KEY);
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
  notifyAuthChanged();
}

/** Avoid open redirects: only same-origin relative paths. */
export function safeNextPath(raw) {
  if (!raw || typeof raw !== "string") return "/dashboard";
  const decoded = decodeURIComponent(raw.trim());
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return "/dashboard";
}

/**
 * Where a customer should land after sign-in.
 * Journey gates (billing / KYC) win; otherwise only honor workspace deep links —
 * never bounce back to the marketing home page (confusing after OTP).
 */
export function customerPostLoginPath(nextRaw, gatedPath = "/dashboard") {
  const gated = gatedPath || "/dashboard";
  if (gated !== "/dashboard") return gated;
  const next = safeNextPath(nextRaw);
  if (next.startsWith("/dashboard") || next.startsWith("/admin")) return next;
  return "/dashboard";
}

/** Workspace path for a given role. */
export function workspaceFor(role) {
  if (role === ROLES.ADMIN || role === "super") return "/admin/platform";
  if (role === ROLES.OPERATIONS) return "/admin";
  return "/dashboard";
}

/* ---------- Admin registration requests (local cache; live data from API) ---------- */

const LEGACY_SEED_REQUEST_IDS = new Set(["REQ-1042", "REQ-1039", "REQ-RAMA-OPS"]);

function seedIfEmpty() {
  try {
    const raw = localStorage.getItem(ADMIN_REQUESTS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify([]));
      return;
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) {
      localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify([]));
      return;
    }
    const cleaned = list.filter((r) => !LEGACY_SEED_REQUEST_IDS.has(r?.id));
    if (cleaned.length !== list.length) {
      localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify(cleaned));
    }
  } catch {}
}

export function getAdminRequests() {
  if (typeof window === "undefined") return [];
  seedIfEmpty();
  try {
    return JSON.parse(localStorage.getItem(ADMIN_REQUESTS_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Prefer live staff queue from API when authenticated as admin. */
export async function fetchAdminRequests() {
  try {
    const token = localStorage.getItem("vistara_token");
    if (!token) return getAdminRequests();
    const res = await fetch("/api/staff/access-requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("fail");
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify(data));
      return data;
    }
  } catch {
    /* fallback */
  }
  return getAdminRequests();
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

export function allowAuthMock() {
  return String(import.meta.env?.VITE_ALLOW_AUTH_MOCK || "").toLowerCase() === "true";
}

/** Prefabricated sessions for UI demos when the API is offline. */
export const DEMO_USERS = [
  {
    id: "customer-plan",
    label: "Customer · choose plan",
    description: "New account — pick a plan & pay first",
    email: "demo.plan@example.com",
    name: "Neha Kapoor",
    company: "Kapoor Exports",
    phone: "+91 98765 01000",
    role: ROLES.CUSTOMER,
    kycComplete: false,
  },
  {
    id: "customer-kyc",
    label: "Customer · KYC pending",
    description: "Plan paid — complete KYC next",
    email: "demo.kyc@example.com",
    name: "Arjun Desai",
    company: "Desai Organics",
    phone: "+91 98765 01002",
    role: ROLES.CUSTOMER,
    kycComplete: false,
  },
  {
    id: "customer",
    label: "Customer · active",
    description: "Plan paid · KYC done · full workspace",
    email: "demo.customer@example.com",
    name: "Priya Mehta",
    company: "Mehta Spices Pvt Ltd",
    phone: "+91 98765 01001",
    role: ROLES.CUSTOMER,
    kycComplete: true,
  },
  {
    id: "operations",
    label: "Operations",
    description: "Case & compliance desk",
    email: "ramakrishnamnit@gmail.com",
    name: "Ramakrishna",
    phone: "",
    role: ROLES.OPERATIONS,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Platform & RBAC console",
    email: "sanjay.r@newindiaexport.com",
    name: "Sanjay Rao",
    phone: "+91 98100 10001",
    role: ROLES.ADMIN,
  },
];

/** Instant local session for a demo persona (no OTP / no API). */
export function loginAsDemoUser(demoId) {
  if (!allowAuthMock()) return { ok: false, message: "Demo login requires VITE_ALLOW_AUTH_MOCK=true" };
  const user = DEMO_USERS.find((u) => u.id === demoId);
  if (!user) return { ok: false, message: "Unknown demo user" };
  const kycComplete = user.role === ROLES.CUSTOMER ? Boolean(user.kycComplete) : true;
  setSession({
    email: user.email,
    name: user.name,
    phone: user.phone || "",
    company: user.company || "",
    role: user.role,
    status: ADMIN_STATUS.ACTIVE,
    kycComplete,
  });
  // Always land on role workspace. Customer Chrome gate sends: plan → pay → KYC → home.
  return { ok: true, path: workspaceFor(user.role), user };
}

/**
 * Start or refresh a pending email OTP via backend (mock only if VITE_ALLOW_AUTH_MOCK=true).
 * For customer_signup, pass profile: { name, company, phone? } — backend validates existence + stores draft + sends OTP.
 */
export async function startEmailOtp(email, purpose, profile = {}) {
  if (typeof window === "undefined") return { ok: false };
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false };
  try {
    const body = { email: normalized, purpose };
    if (purpose === OTP_PURPOSE.CUSTOMER_SIGNUP) {
      if (profile.name != null) body.name = String(profile.name).trim();
      if (profile.company != null) body.company = String(profile.company).trim();
      if (profile.phone != null) body.phone = String(profile.phone).trim();
    }
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok !== false) {
      const expiresInMs = (Number(data.expiresInSec) || 600) * 1000;
      sessionStorage.setItem(
        OTP_PENDING_KEY,
        JSON.stringify({
          email: normalized,
          purpose,
          expiresAt: Date.now() + expiresInMs,
          viaApi: true,
        })
      );
      return { ok: true };
    }
    if (!allowAuthMock()) {
      return {
        ok: false,
        message: toUserMessage(
          { message: data.message || data.detail || data.error, status: res.status },
          "We couldn't send a code right now. Please try again."
        ),
        code: data.code,
      };
    }
  } catch (err) {
    if (!allowAuthMock()) {
      return {
        ok: false,
        message: toUserMessage(err, "We couldn't send a code right now. Please try again."),
      };
    }
  }
  if (!allowAuthMock()) return { ok: false, message: "We couldn't send a code right now. Please try again." };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem(
    OTP_PENDING_KEY,
    JSON.stringify({
      email: normalized,
      code,
      purpose,
      expiresAt: Date.now() + 10 * 60 * 1000,
      viaApi: false,
    })
  );
  if (import.meta.env?.DEV) {
    console.info(`[VIRASTRA INTERNATIONAL EXPORT demo OTP] ${normalized}: ${code}`);
  }
  return { ok: true, mock: true };
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

export async function resendPendingEmailOtp() {
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
 * Verify the 6-digit code for the current pending OTP session (API when viaApi).
 * @returns {Promise<{ ok: true, email: string, purpose: string, session?: object, token?: string, kind?: string } | { ok: false, reason: string }>}
 */
export async function verifyPendingEmailOtp(code) {
  if (typeof window === "undefined") return { ok: false, reason: "no_window" };
  try {
    const raw = sessionStorage.getItem(OTP_PENDING_KEY);
    if (!raw) return { ok: false, reason: "no_pending" };
    const p = JSON.parse(raw);
    if (!p?.email || !p?.purpose) return { ok: false, reason: "no_pending" };
    if (Date.now() > (p.expiresAt || 0)) return { ok: false, reason: "expired" };
    const entered = String(code || "").replace(/\D/g, "");
    if (entered.length !== 6) return { ok: false, reason: "invalid" };

    if (p.viaApi) {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: p.email, code: entered, purpose: p.purpose }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        return { ok: false, reason: data.reason || "invalid" };
      }
      sessionStorage.removeItem(OTP_PENDING_KEY);
      return {
        ok: true,
        email: p.email,
        purpose: p.purpose,
        session: data.session,
        token: data.token || data.session?.token,
        kind: data.kind,
        api: data,
      };
    }

    // Local mock fallback: accept any 6-digit when pending exists
    if (p.code && entered !== String(p.code) && import.meta.env?.PROD) {
      return { ok: false, reason: "invalid" };
    }
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
