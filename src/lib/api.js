/** API client for VIRASTRA INTERNATIONAL EXPORT backend (proxied via Vite /api). */

import { clearSession } from "@/lib/authSession";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";
import { apiUrl } from "@/lib/apiBase";

const TOKEN_KEY = "vistara_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearToken() {
  setToken("");
}

export async function api(path, { method = "GET", body, headers = {}, auth = true, formData } = {}) {
  const opts = {
    method,
    headers: { ...headers },
  };
  if (auth) {
    const token = getToken();
    if (token) opts.headers.Authorization = `Bearer ${token}`;
  }
  if (formData) {
    opts.body = formData;
  } else if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(apiUrl(path), opts);
  } catch (e) {
    const err = new Error(toUserMessage(e, USER_MESSAGES.network));
    err.status = 0;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    // Expired / invalid JWT — force client logout so AuthGuard redirects to login.
    if (auth && res.status === 401) {
      clearSession();
    }
    let msg = "";
    if (data && typeof data === "object") {
      if (typeof data.message === "string") msg = data.message;
      else if (typeof data.detail === "string") msg = data.detail;
      else if (typeof data.error === "string") msg = data.error;
    } else if (typeof data === "string" && data && !/^\s*</.test(data)) {
      msg = data;
    }
    const err = new Error(toUserMessage({ message: msg, status: res.status }, USER_MESSAGES.generic));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getPublicConfig() {
  try {
    return await api("/api/config/public", { auth: false });
  } catch {
    return { razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || "" };
  }
}
