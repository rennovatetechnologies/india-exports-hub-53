/** Community access — nominal admin-priced pass for chat, free events, updates. */

import { api } from "@/lib/api";
import { getCachedPublicConfig } from "@/lib/appConfig";

const FALLBACK_SETTINGS = {
  enabled: true,
  title: "Community access",
  tagline: "Chat, free events, updates, and upcoming features — no documentation plan required.",
  priceInr: 129,
  validityDays: 365,
  benefits: [
    "Chat with the VIRASTRA desk",
    "Register for free events",
    "Product and policy updates",
    "Upcoming features as they launch",
  ],
  amounts: null,
  totalInr: null,
  required: true,
};

let cachedAccess = null;
let inflight = null;

function settingsFromPublicConfig() {
  const cfg = getCachedPublicConfig();
  return cfg?.communityAccess && typeof cfg.communityAccess === "object"
    ? { ...FALLBACK_SETTINGS, ...cfg.communityAccess }
    : FALLBACK_SETTINGS;
}

export function getCachedCommunityAccess() {
  return cachedAccess;
}

export function getCachedCommunitySettings() {
  return cachedAccess?.settings || settingsFromPublicConfig();
}

export function isCommunityAccessActive(customerCase, access = cachedAccess) {
  if (customerCase?.communityAccessActive) return true;
  if (access?.active) return true;
  const settings = access?.settings || settingsFromPublicConfig();
  if (!settings.required) return true;
  return false;
}

export function formatCommunityExpiry(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export async function fetchCommunityAccess({ force = false } = {}) {
  if (!force && cachedAccess) return cachedAccess;
  if (!force && inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await api("/api/community/access");
      const doc = data?.data && typeof data.data === "object" ? data.data : data;
      cachedAccess = {
        active: Boolean(doc?.active),
        required: Boolean(doc?.required),
        source: doc?.source || "none",
        paidAt: doc?.paidAt || null,
        expiresAt: doc?.expiresAt || null,
        paymentId: doc?.paymentId || null,
        settings: { ...FALLBACK_SETTINGS, ...(doc?.settings || settingsFromPublicConfig()) },
      };
    } catch {
      cachedAccess = {
        active: false,
        required: settingsFromPublicConfig().required,
        source: "none",
        paidAt: null,
        expiresAt: null,
        paymentId: null,
        settings: settingsFromPublicConfig(),
      };
    } finally {
      inflight = null;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("iehub-community-updated"));
    }
    return cachedAccess;
  })();
  return inflight;
}

export async function saveCommunitySettings(patch) {
  const data = await api("/api/community/settings", { method: "PUT", body: patch });
  const settings = data?.settings || data?.data || data;
  cachedAccess = {
    ...(cachedAccess || {}),
    settings: { ...FALLBACK_SETTINGS, ...settings },
  };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iehub-community-updated"));
  }
  return cachedAccess.settings;
}

export async function fetchCommunityPosts({ kind, force = false } = {}) {
  void force;
  const q = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  const data = await api(`/api/community/posts${q}`);
  return Array.isArray(data) ? data : data?.items || data?.data || [];
}

export async function saveCommunityPost(payload, id) {
  if (id) {
    const data = await api(`/api/community/posts/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  }
  const data = await api("/api/community/posts", { method: "POST", body: payload });
  return data?.data || data;
}

export async function deleteCommunityPost(id) {
  await api(`/api/community/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function communityPayHref() {
  return "/dashboard/billing#community";
}
