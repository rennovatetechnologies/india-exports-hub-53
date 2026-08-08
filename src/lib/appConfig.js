/** Public app config from GET /api/config/public (GST, seller, Razorpay, brand). */

import { api } from "@/lib/api";

let cached = null;
let inflight = null;

const FALLBACK = {
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
  appName: "VIRASTRA",
  supportEmail: "support@newindiaexport.com",
  gstRate: 0.18,
  seller: {
    legalName: "New India Export",
    gstin: "27AXGPY3435Q1ZK",
    address:
      "1ST FLOOR SHOP NO M-02, PREMIUM PLAZA COMMERCIAL COMPLEX, MATA MANDIR ROAD NEAR CHHOTI LAHORI, DHARAMPETH NAGPUR-440010",
  },
};

function normalize(raw) {
  const d = raw?.data && typeof raw.data === "object" ? { ...raw, ...raw.data } : raw || {};
  const gstRate = Number(d.gstRate);
  return {
    razorpayKeyId: String(d.razorpayKeyId || FALLBACK.razorpayKeyId || ""),
    appName: String(d.appName || FALLBACK.appName),
    supportEmail: String(d.supportEmail || FALLBACK.supportEmail),
    gstRate: Number.isFinite(gstRate) && gstRate >= 0 ? gstRate : FALLBACK.gstRate,
    seller: {
      legalName: d.seller?.legalName || FALLBACK.seller.legalName,
      gstin: d.seller?.gstin || FALLBACK.seller.gstin,
      address: d.seller?.address || FALLBACK.seller.address,
    },
  };
}

export function getCachedPublicConfig() {
  return cached || FALLBACK;
}

export function getGstRate() {
  return getCachedPublicConfig().gstRate;
}

export async function fetchPublicConfig({ force = false } = {}) {
  if (cached && !force) return cached;
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const data = await api("/api/config/public", { auth: false });
      cached = normalize(data);
    } catch {
      cached = cached || FALLBACK;
    } finally {
      inflight = null;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("iehub-config-updated"));
    }
    return cached;
  })();
  return inflight;
}
