const STORAGE_KEY = "vistara_session";

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
    return {
      email: data.email.trim(),
      name: (typeof data.name === "string" && data.name.trim()) || displayNameFromEmail(data.email),
      phone: typeof data.phone === "string" ? data.phone.trim() : "",
    };
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function setSession({ email, name, phone }) {
  const payload = {
    email: String(email || "").trim(),
    name: String(name || "").trim() || displayNameFromEmail(email),
    phone: phone != null ? String(phone).trim() : "",
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
