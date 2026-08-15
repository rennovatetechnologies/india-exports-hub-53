/** Events catalog — Mongo via GET /api/events. */

import { api } from "@/lib/api";
import { allowAuthMock } from "@/lib/authSession";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";

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

export const DEFAULT_EVENTS = [];

const STORAGE_KEY = "vistara_events_catalog";

/** @type {object[] | null} */
let memoryEvents = null;
/** True only after a successful GET /api/events. */
let eventsFromApi = false;
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

/** Calendar date in India (YYYY-MM-DD). Events are date-only, not timed. */
export function todayIso() {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** True when the event's last day is before today. Undated events stay visible. */
export function isEventExpired(event, today = todayIso()) {
  if (event?.expired === true) return true;
  const end = toDateInputValue(event?.endDate || event?.startDate || event?.date);
  if (!end) return false;
  return end < today;
}

export function filterActiveEvents(events) {
  return (Array.isArray(events) ? events : []).filter((e) => e && !isEventExpired(e));
}

export function formatEventDate(raw) {
  const iso = toDateInputValue(raw);
  if (!iso) return String(raw || "").trim() || "Date TBA";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatEventDateRange(startRaw, endRaw) {
  const startIso = toDateInputValue(startRaw);
  const endIso = toDateInputValue(endRaw);
  if (!startIso && !endIso) return "Date TBA";
  if (!endIso || endIso === startIso) return formatEventDate(startRaw || endRaw);
  return `${formatEventDate(startIso)} – ${formatEventDate(endIso)}`;
}

function normalizeDiscountPercent(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return Math.round(n * 100) / 100;
}

export function eventEffectivePrice(event) {
  if (event?.effectivePrice != null && Number.isFinite(Number(event.effectivePrice))) {
    return Math.max(0, Math.round(Number(event.effectivePrice)));
  }
  const list = Math.max(0, Math.round(Number(event?.priceInr) || 0));
  const pct = normalizeDiscountPercent(event?.discountPercent);
  if (pct <= 0) return list;
  return Math.max(0, Math.round(list * (1 - pct / 100)));
}

export function eventHasDiscount(event) {
  const list = Math.max(0, Math.round(Number(event?.priceInr) || 0));
  return normalizeDiscountPercent(event?.discountPercent) > 0 && eventEffectivePrice(event) < list;
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
  const startDate = toDateInputValue(e.startDate || e.date) || String(e.startDate || e.date || "").trim();
  const endDate =
    toDateInputValue(e.endDate) ||
    String(e.endDate || "").trim() ||
    startDate;
  const date = startDate;
  const img = resolveEventImage(e.img);
  const priceInr = Math.max(0, Math.round(Number(e.priceInr) || 0));
  const discountPercent = normalizeDiscountPercent(e.discountPercent);
  return {
    id,
    title,
    date,
    startDate,
    endDate,
    city: String(e.city || "").trim(),
    img,
    capacity,
    seats: `${capacity} seats`,
    desc: String(e.desc || "").trim(),
    priceInr,
    discountPercent,
    effectivePrice: eventEffectivePrice({ priceInr, discountPercent, effectivePrice: e.effectivePrice }),
    payableTotalInr: Math.max(0, Math.round(Number(e.payableTotalInr) || 0)) || null,
    installmentEligible: Boolean(e.installmentEligible),
    installmentOptions: e.installmentOptions || null,
    createdAt: e.createdAt || null,
    expired: Boolean(e.expired) || isEventExpired({
      endDate,
      startDate,
      date,
      expired: e.expired,
    }),
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
    installmentPlanId: r.installmentPlanId || null,
    paidInstallments: r.paidInstallments != null ? Number(r.paidInstallments) : null,
    installmentCount: r.installmentCount != null ? Number(r.installmentCount) : null,
    at: r.at || r.createdAt || r.updatedAt || null,
  };
}

function setMemory(events) {
  memoryEvents = Array.isArray(events) ? events : [];
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
  if (memoryEvents) return memoryEvents.map((x) => ({ ...x }));
  return [];
}

/** Next upcoming event by start date. Never returns an expired event. */
export function pickFeaturedEvent(events) {
  const list = filterActiveEvents(events);
  if (!list.length) return null;
  const upcoming = [...list].sort((a, b) =>
    String(a.startDate || a.date || "").localeCompare(String(b.startDate || b.date || ""))
  );
  return upcoming[0] || null;
}

export async function fetchEventsCatalog({ force = false } = {}) {
  if (!force && eventsFromApi && memoryEvents) {
    return memoryEvents.map((x) => ({ ...x }));
  }
  try {
    const data = await api("/api/events");
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    const cleaned = list.map(normalizeEvent).filter(Boolean);
    eventsFromApi = true;
    setMemory(cleaned);
    return cleaned.map((x) => ({ ...x }));
  } catch (e) {
    console.warn("[events] fetch failed", e.message);
    // Never substitute a client catalog — prices must come from the API.
    if (eventsFromApi && memoryEvents) return memoryEvents.map((x) => ({ ...x }));
    return [];
  }
}

function eventPayload(e) {
  const startDate = toDateInputValue(e.startDate || e.date);
  const endDate = toDateInputValue(e.endDate) || startDate;
  const capacity = Math.max(1, Number(e.capacity) || 1);
  return {
    title: e.title,
    date: startDate,
    startDate,
    endDate,
    city: e.city || "",
    img: resolveEventImage(e.img),
    capacity: String(capacity),
    seats: `${capacity} seats`,
    desc: e.desc || "",
    priceInr: Math.max(0, Math.round(Number(e.priceInr) || 0)),
    discountPercent: normalizeDiscountPercent(e.discountPercent),
  };
}

export async function saveEventsCatalog(events, { onlyIds, create } = {}) {
  if (create) {
    const source = Array.isArray(events) ? events[0] : events;
    const created = await api("/api/events", { method: "POST", body: eventPayload(source) });
    const normalized = normalizeEvent(created);
    const current = loadEventsCatalog().filter((e) => e.id !== normalized?.id);
    const next = normalized ? [...current, normalized] : current;
    setMemory(next);
    return next;
  }

  const next = (Array.isArray(events) ? events : []).map(normalizeEvent).filter(Boolean);
  const toSave = onlyIds?.length
    ? next.filter((e) => onlyIds.includes(e.id))
    : next;
  for (const e of toSave) {
    await api(`/api/events/${encodeURIComponent(e.id)}`, { method: "PUT", body: eventPayload(e) });
  }
  setMemory(next);
  return next;
}

export async function deleteEventFromCatalog(eventId) {
  const id = String(eventId || "").trim();
  if (!id) return loadEventsCatalog();
  await api(`/api/events/${encodeURIComponent(id)}`, { method: "DELETE" });
  const next = loadEventsCatalog().filter((e) => e.id !== id);
  setMemory(next);
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

export function getMyRegistration(eventId, email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return null;
  return getEventRegistrations(eventId).find((r) => String(r.email || "").toLowerCase() === key) || null;
}

export function isPartialRegistration(reg) {
  return String(reg?.status || "") === "partial";
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

async function payAndRegisterForEvent(eventId, {
  email, name, company, priceInr, title, payInInstallments, installmentPlanId,
} = {}) {
  const { startRazorpayCheckout } = await import("@/components/PayButton");
  const amount = Math.max(0, Math.round(Number(priceInr) || 0));
  if (amount <= 0) throw new Error("Event price is not available");
  await startRazorpayCheckout({
    amountInr: amount,
    planId: eventId,
    eventId,
    purpose: "event",
    description: title || "Event registration",
    customer: { name, email },
    payInInstallments: Boolean(payInInstallments),
    installmentPlanId: installmentPlanId || undefined,
  });
  const registration = {
    email,
    name: name || String(email).split("@")[0],
    company: company || "",
    status: payInInstallments || installmentPlanId ? "partial" : "registered",
    at: new Date().toISOString(),
  };
  rememberRegistration(eventId, registration);
  return { ok: true, registration, paid: true, installment: Boolean(payInInstallments || installmentPlanId) };
}

export async function registerForEvent(eventId, {
  email, name, company, priceInr, title, payInInstallments, installmentPlanId,
} = {}) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return { ok: false, reason: "Sign in required" };

  const catalogEvent = loadEventsCatalog().find((e) => e.id === eventId);
  if (catalogEvent && isEventExpired(catalogEvent)) {
    return { ok: false, reason: "This event has ended." };
  }

  const knownPrice = Math.max(0, Math.round(Number(priceInr) || 0));
  // Paid events must go through Razorpay; verify-payment creates the registration.
  if (knownPrice > 0 || installmentPlanId) {
    try {
      return await payAndRegisterForEvent(eventId, {
        email: key,
        name,
        company,
        priceInr: knownPrice,
        title,
        payInInstallments,
        installmentPlanId,
      });
    } catch (e) {
      const msg = String(e.message || "");
      if (/cancel/i.test(msg)) return { ok: false, reason: "cancelled" };
      return { ok: false, reason: toUserMessage(e, USER_MESSAGES.payment) };
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
      const serverPrice = Math.max(
        0,
        Math.round(Number(e.data?.effectivePrice ?? e.data?.priceInr) || 0)
      );
      if (serverPrice <= 0) {
        return { ok: false, reason: "Event price is not available" };
      }
      try {
        return await payAndRegisterForEvent(eventId, {
          email: key,
          name,
          company,
          priceInr: serverPrice,
          title,
          payInInstallments,
          installmentPlanId,
        });
      } catch (payErr) {
        const msg = String(payErr.message || "");
        if (/cancel/i.test(msg)) return { ok: false, reason: "cancelled" };
        return { ok: false, reason: toUserMessage(payErr, USER_MESSAGES.payment) };
      }
    }
    const msg = String(e.message || "").toLowerCase();
    if (msg.includes("already")) return { ok: false, reason: "already" };
    if (msg.includes("full")) return { ok: false, reason: "full" };
    if (e.status === 410 || e.data?.code === "EVENT_EXPIRED" || msg.includes("ended")) {
      return { ok: false, reason: "This event has ended." };
    }
    return { ok: false, reason: toUserMessage(e, "We couldn't complete that reservation. Please try again.") };
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
  } catch (e) {
    throw e;
  }
  const list = Array.isArray(memoryRegs[eventId]) ? memoryRegs[eventId] : [];
  memoryRegs[eventId] = list.filter((r) => String(r.email || "").toLowerCase() !== key);
  memoryCounts[eventId] = memoryRegs[eventId].length;
  emitRegs();
  return true;
}

export async function fetchMyInstallmentPlans() {
  try {
    const data = await api("/api/me/installment-plans");
    return data?.items || data?.data || [];
  } catch (e) {
    console.warn("[events] installment plans failed", e.message);
    return [];
  }
}

export function occupancyLabel(event) {
  const cap = Math.max(0, Number(event?.capacity) || 0);
  const used = countEventRegistrations(event?.id);
  return `${used} / ${cap} seats`;
}
