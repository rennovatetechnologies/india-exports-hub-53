/** Backend origin for production (Railway). Empty in local Vite so `/api` uses the proxy. */

export function apiBase() {
  return String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
}

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase()}${p}`;
}

/** Prefix relative `/api` fetch() calls with VITE_API_BASE_URL (covers raw fetch sites). */
export function installApiBase() {
  const base = apiBase();
  if (!base || typeof window === "undefined" || window.__virastraApiBase) return;
  window.__virastraApiBase = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("/api")) {
      return orig(`${base}${input}`, init);
    }
    return orig(input, init);
  };
}
