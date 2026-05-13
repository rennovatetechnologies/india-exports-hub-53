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

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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

/** Roles supported across the platform. */
export const ROLES = {
  CUSTOMER: "customer",
  OPERATIONS: "operations",
  SUPER: "super",
};

export const ADMIN_STATUS = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  ACTIVE: "Active",
};

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
    const role = typeof data.role === "string" ? data.role : ROLES.CUSTOMER;
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
    role: role || ROLES.CUSTOMER,
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
  if (role === ROLES.SUPER) return "/admin/super";
  if (role === ROLES.OPERATIONS) return "/admin";
  return "/dashboard";
}

/* ---------- Admin registration requests (mock store) ---------- */

const SEED_REQUESTS = [
  { id: "REQ-1041", name: "Aditi Khanna", email: "aditi.k@vistara.in", phone: "+91 98765 11220", role: ROLES.OPERATIONS, department: "Compliance ops", employeeId: "VST-227", reason: "Joining ICEGATE desk", status: ADMIN_STATUS.PENDING, createdAt: "2025-05-10T09:14:00Z" },
  { id: "REQ-1040", name: "Karan Shetty", email: "karan.s@vistara.in", phone: "+91 99820 10044", role: ROLES.OPERATIONS, department: "Customer success", employeeId: "VST-218", reason: "Backfill for outgoing CSM", status: ADMIN_STATUS.PENDING, createdAt: "2025-05-09T17:32:00Z" },
  { id: "REQ-1039", name: "Meera Iyer", email: "meera@vistara.in", phone: "+91 90000 23456", role: ROLES.SUPER, department: "Finance leadership", employeeId: "VST-104", reason: "Quarter close + pricing controls", status: ADMIN_STATUS.PENDING, createdAt: "2025-05-08T11:02:00Z" },
  { id: "REQ-1038", name: "Rahul Bose", email: "rahul.b@vistara.in", phone: "+91 98111 33221", role: ROLES.OPERATIONS, department: "Documentation", employeeId: "VST-201", reason: "Volume spike in May", status: ADMIN_STATUS.APPROVED, createdAt: "2025-05-04T08:00:00Z" },
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
