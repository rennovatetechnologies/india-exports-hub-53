import { api } from "@/lib/api";
import { normalizeEmail } from "@/lib/authSession";
import { getCustomerCase } from "@/lib/customerCase";

/** @type {Record<string, object[]>} last API snapshot by caseId */
const cacheByCaseId = {};

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("iehub-messages-updated"));
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

/** Sync read from last API snapshot only. */
export function getMessagesForCase(customerEmailOrCase) {
  const caseId = resolveCaseId(customerEmailOrCase);
  if (caseId && Array.isArray(cacheByCaseId[caseId])) {
    return cacheByCaseId[caseId].map((m) => ({ ...m }));
  }
  return [];
}

/** Always load messages from Mongo. */
export async function fetchMessagesForCase(customerEmailOrCase) {
  const caseId = resolveCaseId(customerEmailOrCase);
  if (!caseId) return [];

  const data = await api(`/api/cases/${encodeURIComponent(caseId)}/messages`);
  const list = Array.isArray(data) ? data : data?.items || data?.data || [];
  const msgs = list.map(normalizeMsg).filter(Boolean);
  cacheByCaseId[caseId] = msgs;
  emit();
  return msgs.map((m) => ({ ...m }));
}

export async function sendMessage({ customerEmail, caseId: caseIdArg, body }) {
  const text = String(body || "").trim();
  const email = normalizeEmail(customerEmail);
  const caseId = caseIdArg || resolveCaseId(email) || resolveCaseId(customerEmail);
  if (!text) return null;
  if (!caseId) throw new Error("Case not loaded — cannot send message");

  const data = await api(`/api/cases/${encodeURIComponent(caseId)}/messages`, {
    method: "POST",
    body: { body: text },
  });
  const msg = normalizeMsg(data?.data || data);
  if (msg) {
    await fetchMessagesForCase({ id: caseId, customerEmail: email });
    return msg;
  }
  return null;
}

export function unreadCountForCase(customerEmailOrCase, viewerRole) {
  const msgs = getMessagesForCase(customerEmailOrCase);
  if (viewerRole === "customer") {
    return msgs.filter((m) => m.fromRole !== "customer" && !m.readAt).length;
  }
  return msgs.filter((m) => m.fromRole === "customer" && !m.readAt).length;
}
