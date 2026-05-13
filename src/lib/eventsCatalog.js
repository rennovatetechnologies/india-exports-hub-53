export const DEFAULT_EVENTS = [
  {
    id: "e1",
    title: "Global Buyer-Seller Meet 2026",
    date: "22 Jun 2026",
    city: "Mumbai, India",
    img: "/event.png",
    seats: "120 delegates",
    desc: "Curated meet between Indian exporters and 40+ international buyers across spices, organic food and fresh produce.",
  },
  {
    id: "e2",
    title: "Vistara Export Summit",
    date: "14 Aug 2026",
    city: "Dubai, UAE",
    img: "/event2.webp",
    seats: "200 delegates",
    desc: "Two-day summit on MENA market access, halal certification and trade finance for Indian exporters.",
  },
];

const STORAGE_KEY = "vistara_events_catalog";

function normalizeEvent(e) {
  if (!e || typeof e !== "object") return null;
  const id = String(e.id || "").trim() || `e${Date.now()}`;
  const title = String(e.title || "").trim();
  if (!title) return null;
  return {
    id,
    title,
    date: String(e.date || "").trim(),
    city: String(e.city || "").trim(),
    img: String(e.img || "/event.png").trim(),
    seats: String(e.seats || "").trim(),
    desc: String(e.desc || "").trim(),
  };
}

export function loadEventsCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EVENTS.map((x) => ({ ...x }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_EVENTS.map((x) => ({ ...x }));
    const cleaned = parsed.map(normalizeEvent).filter(Boolean);
    if (cleaned.length === 0) return DEFAULT_EVENTS.map((x) => ({ ...x }));
    return cleaned;
  } catch {
    return DEFAULT_EVENTS.map((x) => ({ ...x }));
  }
}

export function saveEventsCatalog(events) {
  const next = (Array.isArray(events) ? events : []).map(normalizeEvent).filter(Boolean);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("iehub-events-updated"));
}
