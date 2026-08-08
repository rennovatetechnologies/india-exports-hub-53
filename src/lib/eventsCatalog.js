/** Events catalog — Mongo via GET /api/events. */

import { api } from "@/lib/api";
import { allowAuthMock } from "@/lib/authSession";

export const EVENT_IMAGE_OPTIONS = [
  { value: "/event.png", label: "Conference hall" },
  { value: "/event2.webp", label: "Summit / expo" },
  { value: "/Hero.jpg", label: "Trade floor" },
  { value: "/gallery/GulfFood.jpg", label: "Gulf Food" },
  { value: "/gallery/WTC2023.jpg", label: "WTC 2023" },
  { value: "/gallery/MumbaiWTC.jpg", label: "Mumbai WTC" },
  { value: "/gallery/DelhiIITF.jpg", label: "Delhi IITF" },
  { value: "/gallery/FarmVisit.jpg", label: "Farm visit" },
  { value: "/gallery/SaudiArabia.jpg", label: "Saudi Arabia" },
  { value: "/gallery/Spain.jpg", label: "Spain" },
  { value: "/gallery/PuneAwards.jpg", label: "Pune awards" },
  { value: "/gallery/ODOP.jpg", label: "ODOP" },
];

const ALLOWED_EVENT_IMAGES = new Set(EVENT_IMAGE_OPTIONS.map((o) => o.value));

export function resolveEventImage(raw) {
  const img = String(raw || "").trim();
  if (ALLOWED_EVENT_IMAGES.has(img)) return img;
  if (img.startsWith("/") || img.startsWith("http")) return img;
  return "/event.png";
}

export const DEFAULT_EVENTS = [
  {
    id: "e1",
    title: "Global Buyer-Seller Meet 2026",
    date: "2026-06-22",
    city: "Mumbai, India",
    img: "/event.png",
    capacity: 120,
    priceInr: 4999,
    desc: "Curated meet between Indian exporters and 40+ international buyers across spices, organic food and fresh produce.",
  },
  {
    id: "e2",
    title: "VIRASTRA INTERNATIONAL EXPORT Summit",
    date: "2026-08-14",
    city: "Dubai, UAE",
    img: "/event2.webp",
    capacity: 200,
    priceInr: 0,
    desc: "Two-day summit on MENA market access, halal certification and trade finance for Indian exporters.",
  },
];

const STORAGE_KEY = "vistara_events_catalog";

/** @type {object[] | null} */
let memoryEvents = null;
/** @type {Record<string, object[]>} */
let memoryRegs = {};
/** @type {Record<string, number>} */
let memoryCounts = {};

export function toDateInputValue(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

export function formatEventDate(raw) {
  const iso = toDateInputValue(raw);
  if (!iso) return String(raw || "").trim() || "Date TBA";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function parseCapacity(raw, seatsLabel) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  const fromNum = Number(raw);
  if (Number.isFinite(fromNum) && fromNum > 0) return Math.floor(fromNum);
  const fromLabel = String(seatsLabel || "").match(/\d+/);
  if (fromLabel) return Math.max(1, parseInt(fromLabel[0], 10));
  return 50;
}

function normalizeEvent(e) {
  if (!e || typeof e !== "object") return null;
  const id = String(e.id || "").trim() || `e${Date.now()}`;
  const title = String(e.title || "").trim();
  if (!title) return null;
  const capacity = parseCapacity(e.capacity, e.seats);
  const date = toDateInputValue(e.date) || String(e.date || "").trim();
  const img = resolveEventImage(e.img);
  const priceInr = Math.max(0, Math.round(Number(e.priceInr) || 0));
  return {
    id,
    title,
    date,
    city: String(e.city || "").trim(),
    img,
    capacity,
    seats: `${capacity} seats`,
    desc: String(e.desc || "").trim(),
    priceInr,
  };
}

function normalizeRegistration(r, eventId) {
  if (!r || typeof r !== "object") return null;
  const email = String(r.email || "").trim().toLowerCase();
  if (!email) return null;
  return {
    id: r.id || `${eventId || r.eventId}:${email}`,
    eventId: r.eventId || eventId || "",
    email,
    name: String(r.name || "").trim() || email.split("@")[0],
    company: String(r.company || "").trim(),
    status: r.status || "registered",
    paymentId: r.paymentId || null,
    at: r.at || r.createdAt || r.updatedAt || null,
  };
}

function setMemory(events) {
  memoryEvents = events;
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iehub-events-updated"));
  }
}

function emitRegs() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iehub-event-regs-updated"));
  }
}

export function loadEventsCatalog() {
  if (memoryEvents?.length) return memoryEvents.map((x) => ({ ...x }));
  return DEFAULT_EVENTS.map((x) => ({ ...x }));
}

export async function fetchEventsCatalog({ force = false } = {}) {
  if (memoryEvents?.length && !force) return memoryEvents.map((x) => ({ ...x }));
  try {
    const data = await api("/api/events", { auth: false });
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    const cleaned = list.map(normalizeEvent).filter(Boolean);
    if (cleaned.length) {
      setMemory(cleaned);
      return cleaned.map((x) => ({ ...x }));
    }
  } catch (e) {
    console.warn("[events] fetch failed", e.message);
  }
  return loadEventsCatalog();
}

export async function saveEventsCatalog(events, { onlyIds } = {}) {
  const next = (Array.isArray(events) ? events : []).map(normalizeEvent).filter(Boolean);
  setMemory(next);
  const toSave = onlyIds?.length
    ? next.filter((e) => onlyIds.includes(e.id))
    : next;
  for (const e of toSave) {
    try {
      await api(`/api/events/${encodeURIComponent(e.id)}`, { method: "PUT", body: e });
    } catch {
      try {
        await api("/api/events", { method: "POST", body: e });
      } catch (err) {
        console.warn("[events] save failed", e.id, err.message);
      }
    }
  }
  return next;
}

export function seedEventRegistrationsIfNeeded() {
  if (!allowAuthMock()) return;
}

export function getEventRegistrations(eventId) {
  const list = memoryRegs[eventId];
  return Array.isArray(list) ? list.map((x) => ({ ...x })) : [];
}

export function getAllEventRegistrations() {
  return { ...memoryRegs };
}

export function countEventRegistrations(eventId) {
  if (memoryCounts[eventId] != null) return Number(memoryCounts[eventId]) || 0;
  return getEventRegistrations(eventId).length;
}

export function seatsRemaining(event) {
  const cap = Math.max(0, Number(event?.capacity) || 0);
  const used = countEventRegistrations(event?.id);
  return Math.max(0, cap - used);
}

export function isEventFull(event) {
  return seatsRemaining(event) <= 0;
}

export function isEmailRegistered(eventId, email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return false;
  return getEventRegistrations(eventId).some((r) => String(r.email || "").toLowerCase() === key);
}

function rememberRegistration(eventId, registration) {
  const key = String(registration?.email || "").trim().toLowerCase();
  if (!key) return;
  const list = Array.isArray(memoryRegs[eventId]) ? [...memoryRegs[eventId]] : [];
  if (!list.some((r) => String(r.email).toLowerCase() === key)) list.push(registration);
  memoryRegs[eventId] = list;
  memoryCounts[eventId] = list.length;
  emitRegs();
}

function setEventRegistrations(eventId, list) {
  const cleaned = (Array.isArray(list) ? list : [])
    .map((r) => normalizeRegistration(r, eventId))
    .filter(Boolean);
  memoryRegs[eventId] = cleaned;
  memoryCounts[eventId] = cleaned.length;
  emitRegs();
  return cleaned;
}

/** Staff: load fill counts for all events */
export async function fetchEventRegistrationCounts() {
  try {
    const data = await api("/api/events/registration-counts");
    const counts = data?.counts || data?.data || {};
    memoryCounts = { ...memoryCounts, ...counts };
    emitRegs();
    return { ...memoryCounts };
  } catch (e) {
    console.warn("[events] registration counts failed", e.message);
    return { ...memoryCounts };
  }
}

/** Staff: load registrants for one event from Mongo */
export async function fetchEventRegistrations(eventId) {
  if (!eventId) return [];
  try {
    const data = await api(`/api/events/${encodeURIComponent(eventId)}/registrations`);
    const list = data?.items || data?.data || [];
    return setEventRegistrations(eventId, list);
  } catch (e) {
    console.warn("[events] registrations fetch failed", e.message);
    return getEventRegistrations(eventId);
  }
}

/** Customer: hydrate my seats into memoryRegs */
export async function fetchMyEventRegistrations() {
  try {
    const data = await api("/api/me/event-registrations");
    const list = data?.items || data?.data || (Array.isArray(data) ? data : []);
    const byEvent = {};
    for (const raw of list) {
      const r = normalizeRegistration(raw, raw.eventId);
      if (!r?.eventId) continue;
      if (!byEvent[r.eventId]) byEvent[r.eventId] = [];
      byEvent[r.eventId].push(r);
    }
    for (const [eventId, regs] of Object.entries(byEvent)) {
      memoryRegs[eventId] = regs;
      memoryCounts[eventId] = regs.length;
    }
    emitRegs();
    return byEvent;
  } catch (e) {
    console.warn("[events] my registrations failed", e.message);
    return {};
  }
}

/** Staff: email registrants (reschedule / follow-up / update) */
export async function notifyEventRegistrants(eventId, payload) {
  const data = await api(`/api/events/${encodeURIComponent(eventId)}/notify`, {
    method: "POST",
    body: payload,
  });
  return data?.data || data;
}

export async function fetchEventCommunications(eventId) {
  try {
    const data = await api(`/api/events/${encodeURIComponent(eventId)}/communications`);
    return data?.items || data?.data || [];
  } catch {
    return [];
  }
}

async function payAndRegisterForEvent(eventId, { email, name, company, priceInr, title } = {}) {
  const { startRazorpayCheckout } = await import("@/components/PayButton");
  const amount = Math.max(0, Math.round(Number(priceInr) || 0));
  if (amount <= 0) throw new Error("Invalid event price");
  await startRazorpayCheckout({
    amountInr: amount,
    planId: eventId,
    eventId,
    purpose: "event",
    description: title || "Event registration",
    customer: { name, email },
  });
  const registration = {
    email,
    name: name || String(email).split("@")[0],
    company: company || "",
    at: new Date().toISOString(),
  };
  rememberRegistration(eventId, registration);
  return { ok: true, registration, paid: true };
}

export async function registerForEvent(eventId, { email, name, company, priceInr, title } = {}) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return { ok: false, reason: "Sign in required" };

  const knownPrice = Math.max(0, Math.round(Number(priceInr) || 0));
  // Paid events must go through Razorpay; verify-payment creates the registration.
  if (knownPrice > 0) {
    try {
      return await payAndRegisterForEvent(eventId, {
        email: key,
        name,
        company,
        priceInr: knownPrice,
        title,
      });
    } catch (e) {
      const msg = String(e.message || "");
      if (/cancel/i.test(msg)) return { ok: false, reason: "cancelled" };
      return { ok: false, reason: msg || "Payment failed" };
    }
  }

  try {
    const data = await api(`/api/events/${encodeURIComponent(eventId)}/register`, {
      method: "POST",
      body: { email: key, name, company },
    });
    const registration = data?.registration || data?.data || {
      email: key,
      name: name || key.split("@")[0],
      company: company || "",
      at: new Date().toISOString(),
    };
    rememberRegistration(eventId, registration);
    return { ok: true, registration };
  } catch (e) {
    // Backend may still require payment if catalog price was stale/0 on the client.
    if (e.status === 402 || e.data?.code === "PAYMENT_REQUIRED") {
      try {
        return await payAndRegisterForEvent(eventId, {
          email: key,
          name,
          company,
          priceInr: e.data?.priceInr ?? priceInr,
          title,
        });
      } catch (payErr) {
        const msg = String(payErr.message || "");
        if (/cancel/i.test(msg)) return { ok: false, reason: "cancelled" };
        return { ok: false, reason: msg || "Payment failed" };
      }
    }
    const msg = String(e.message || "").toLowerCase();
    if (msg.includes("already")) return { ok: false, reason: "already" };
    if (msg.includes("full")) return { ok: false, reason: "full" };
    return { ok: false, reason: e.message || "failed" };
  }
}

export async function unregisterFromEvent(eventId, email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return false;
  try {
    await api(`/api/events/${encodeURIComponent(eventId)}/register`, {
      method: "DELETE",
      body: { email: key },
    });
  } catch {
    /* still update local */
  }
  const list = Array.isArray(memoryRegs[eventId]) ? memoryRegs[eventId] : [];
  memoryRegs[eventId] = list.filter((r) => String(r.email || "").toLowerCase() !== key);
  memoryCounts[eventId] = memoryRegs[eventId].length;
  emitRegs();
  return true;
}

export function occupancyLabel(event) {
  const cap = Math.max(0, Number(event?.capacity) || 0);
  const used = countEventRegistrations(event?.id);
  return `${used} / ${cap} seats`;
}
