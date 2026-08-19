/** Public app config from GET /api/config/public (GST, seller, Razorpay, brand). */

import { api } from "@/lib/api";

let cached = null;
let inflight = null;

const FALLBACK_WHATSAPP = "9967084149";

const FALLBACK = {
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
  appName: "VIRASTRA by New India Export",
  supportEmail: "support@virastrainternationalexport.com",
  supportWhatsApp: FALLBACK_WHATSAPP,
  gstRate: 0.18,
  seller: {
    legalName: "New India Export",
    gstin: "27AXGPY3435Q1ZK",
    address:
      "1ST FLOOR SHOP NO M-02, PREMIUM PLAZA COMMERCIAL COMPLEX, MATA MANDIR ROAD NEAR CHHOTI LAHORI, DHARAMPETH NAGPUR-440010",
  },
  channels: {
    emailNotifications: true,
    emailOtp: true,
    whatsappNotifications: false,
    whatsappOtp: false,
    whatsappReady: false,
  },
};

function normalize(raw) {
  const d = raw?.data && typeof raw.data === "object" ? { ...raw, ...raw.data } : raw || {};
  const gstRate = Number(d.gstRate);
  return {
    razorpayKeyId: String(d.razorpayKeyId || FALLBACK.razorpayKeyId || ""),
    appName: String(d.appName || FALLBACK.appName),
    supportEmail: String(d.supportEmail || FALLBACK.supportEmail),
    supportWhatsApp: normalizeWhatsAppDigits(d.supportWhatsApp || FALLBACK.supportWhatsApp),
    gstRate: Number.isFinite(gstRate) && gstRate >= 0 ? gstRate : FALLBACK.gstRate,
    seller: {
      legalName: d.seller?.legalName || FALLBACK.seller.legalName,
      gstin: d.seller?.gstin || FALLBACK.seller.gstin,
      address: d.seller?.address || FALLBACK.seller.address,
    },
    channels: {
      emailNotifications: d.channels?.emailNotifications !== false,
      emailOtp: d.channels?.emailOtp !== false,
      whatsappNotifications: Boolean(d.channels?.whatsappNotifications),
      whatsappOtp: Boolean(d.channels?.whatsappOtp),
      whatsappReady: Boolean(d.channels?.whatsappReady),
    },
  };
}

export function getCachedPublicConfig() {
  return cached || FALLBACK;
}

export function getSupportEmail() {
  return getCachedPublicConfig().supportEmail || FALLBACK.supportEmail;
}

function normalizeWhatsAppDigits(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length >= 10) return d.slice(-10);
  return FALLBACK_WHATSAPP;
}

/** 10-digit India mobile used for public WhatsApp / phone. */
export function getSupportWhatsAppDigits() {
  return normalizeWhatsAppDigits(getCachedPublicConfig().supportWhatsApp);
}

/** wa.me / E.164 without plus: 91XXXXXXXXXX */
export function getSupportWhatsAppE164() {
  return `91${getSupportWhatsAppDigits()}`;
}

/** Display: +91 99670 84149 */
export function getSupportWhatsAppDisplay() {
  const d = getSupportWhatsAppDigits();
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

export function getSupportWhatsAppUrl(text) {
  const base = `https://wa.me/${getSupportWhatsAppE164()}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function getGstRate() {
  return getCachedPublicConfig().gstRate;
}

export function getOtpChannels() {
  return getCachedPublicConfig().channels || FALLBACK.channels;
}

/** Short line for auth forms: where the code will go. */
export function otpSendHint(channels = getOtpChannels()) {
  if (channels.emailOtp && channels.whatsappOtp) {
    return "We’ll send a one-time code to your email and WhatsApp — no password";
  }
  if (channels.whatsappOtp) return "We’ll send a one-time code on WhatsApp — no password";
  return "We’ll email you a one-time code — no password";
}

export function otpButtonLabel(loading, channels = getOtpChannels()) {
  if (loading) return "Sending code…";
  if (channels.emailOtp && channels.whatsappOtp) return "Send me a sign-in code";
  if (channels.whatsappOtp) return "WhatsApp me a sign-in code";
  return "Email me a sign-in code";
}

export function otpVerifySubtitle({ email, sentVia, masked } = {}) {
  const via = Array.isArray(sentVia) ? sentVia : [];
  const emailOn = via.includes("email") || (!via.length && email);
  const waOn = via.includes("whatsapp");
  const mail = masked?.email || email || "your email";
  const phone = masked?.phone;
  if (emailOn && waOn) {
    return phone
      ? `Enter the 6-digit code we sent to ${mail} and WhatsApp ${phone}`
      : `Enter the 6-digit code we sent to ${mail} and WhatsApp`;
  }
  if (waOn) {
    return phone
      ? `Enter the 6-digit code we sent on WhatsApp to ${phone}`
      : "Enter the 6-digit code we sent on WhatsApp";
  }
  return `Enter the 6-digit code we sent to ${mail}`;
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
