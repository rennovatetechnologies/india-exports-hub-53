import { api } from "@/lib/api";
import { allowAuthMock, normalizeEmail } from "@/lib/authSession";
import { getCustomerCase } from "@/lib/customerCase";

const LEGACY_KEY = "vistara_case_messages_v1";

/** @type {Record<string, object[]>} keyed by caseId */
const cacheByCaseId = {};

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("iehub-messages-updated"));
}

function loadLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

function saveLegacy(map) {
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  emit();
}

function normalizeMsg(m) {
  if (!m) return null;
  return {
    id: m.id || `msg-${m.createdAt || Date.now()}`,
    caseId: m.caseId || null,
    body: String(m.body || "").trim(),
    fromRole: m.fromRole || "customer",
    fromName: m.fromName || m.fromEmail || "User",
    fromEmail: normalizeEmail(m.fromEmail),
    createdAt: m.createdAt || new Date().toISOString(),
    readAt: m.readAt ?? null,
  };
}

export function resolveCaseId(customerEmailOrCase) {
  if (customerEmailOrCase && typeof customerEmailOrCase === "object") {
    return customerEmailOrCase.id || null;
  }
  const email = normalizeEmail(customerEmailOrCase);
  if (!email) return null;
  return getCustomerCase(email)?.id || null;
}

/** Sync read from in-memory cache (and legacy localStorage for mock). */
export function getMessagesForCase(customerEmailOrCase) {
  const caseId = resolveCaseId(customerEmailOrCase);
  if (caseId && Array.isArray(cacheByCaseId[caseId])) {
    return cacheByCaseId[caseId].map((m) => ({ ...m }));
  }
  const email =
    customerEmailOrCase && typeof customerEmailOrCase === "object"
      ? normalizeEmail(customerEmailOrCase.customerEmail)
      : normalizeEmail(customerEmailOrCase);
  if (!email) return [];
  const legacy = loadLegacy()[email];
  return Array.isArray(legacy) ? legacy.map((m) => ({ ...m })) : [];
}

export async function fetchMessagesForCase(customerEmailOrCase, { force = false } = {}) {
  const caseId = resolveCaseId(customerEmailOrCase);
  if (!caseId) return getMessagesForCase(customerEmailOrCase);

  if (!force && Array.isArray(cacheByCaseId[caseId]) && cacheByCaseId[caseId].length) {
    return cacheByCaseId[caseId].map((m) => ({ ...m }));
  }

  try {
    const data = await api(`/api/cases/${encodeURIComponent(caseId)}/messages`);
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    let msgs = list.map(normalizeMsg).filter(Boolean);

    // One-time migrate browser-local demo messages into the shared case thread.
    if (!msgs.length) {
      const email =
        customerEmailOrCase && typeof customerEmailOrCase === "object"
          ? normalizeEmail(customerEmailOrCase.customerEmail)
          : normalizeEmail(customerEmailOrCase);
      const legacy = email ? loadLegacy()[email] : null;
      if (Array.isArray(legacy) && legacy.length) {
        for (const m of legacy) {
          const text = String(m?.body || "").trim();
          if (!text) continue;
          try {
            const posted = await api(`/api/cases/${encodeURIComponent(caseId)}/messages`, {
              method: "POST",
              body: { body: text },
            });
            const nm = normalizeMsg(posted?.data || posted);
            if (nm) msgs.push(nm);
          } catch {
            break;
          }
        }
        if (msgs.length) {
          const all = loadLegacy();
          delete all[email];
          saveLegacy(all);
        }
      }
    }

    cacheByCaseId[caseId] = msgs;
    emit();
    return msgs.map((m) => ({ ...m }));
  } catch (e) {
    console.warn("[messages] fetch failed", e.message);
    return getMessagesForCase(customerEmailOrCase);
  }
}

export async function sendMessage({ customerEmail, caseId: caseIdArg, fromRole, fromName, fromEmail, body }) {
  const text = String(body || "").trim();
  const email = normalizeEmail(customerEmail);
  const caseId = caseIdArg || resolveCaseId(email) || resolveCaseId(customerEmail);
  if (!text) return null;

  if (caseId) {
    try {
      const data = await api(`/api/cases/${encodeURIComponent(caseId)}/messages`, {
        method: "POST",
        body: { body: text },
      });
      const msg = normalizeMsg(data?.data || data);
      if (msg) {
        const prev = Array.isArray(cacheByCaseId[caseId]) ? cacheByCaseId[caseId] : [];
        cacheByCaseId[caseId] = [...prev, msg];
        emit();
        return msg;
      }
    } catch (e) {
      console.warn("[messages] send failed", e.message);
      if (!allowAuthMock()) throw e;
    }
  }

  // Demo / offline fallback — browser-local only (not shared across users).
  if (!email) return null;
  const all = loadLegacy();
  const list = Array.isArray(all[email]) ? all[email] : [];
  const msg = {
    id: `msg-${Date.now()}`,
    caseId: caseId || null,
    fromRole: fromRole || "customer",
    fromName: fromName || fromEmail || "User",
    fromEmail: normalizeEmail(fromEmail),
    body: text,
    createdAt: new Date().toISOString(),
  };
  all[email] = [...list, msg];
  if (caseId) {
    const prev = Array.isArray(cacheByCaseId[caseId]) ? cacheByCaseId[caseId] : [];
    cacheByCaseId[caseId] = [...prev, msg];
  }
  saveLegacy(all);
  return msg;
}

export function unreadCount(customerEmail, readerRole) {
  const msgs = getMessagesForCase(customerEmail);
  if (!msgs.length) return 0;
  if (readerRole === "customer") {
    return msgs.filter((m) => m.fromRole !== "customer").length > 0 ? 0 : 0;
  }
  return 0;
}
