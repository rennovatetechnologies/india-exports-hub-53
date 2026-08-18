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

function authHeader(auth = true) {
  if (!auth) return {};
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function messageFromPayload(data) {
  if (data && typeof data === "object") {
    if (typeof data.message === "string") return data.message;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
  }
  if (typeof data === "string" && data && !/^\s*</.test(data)) return data;
  return "";
}

function throwApiError(status, data, { auth = true } = {}) {
  if (auth && status === 401) clearSession();
  const err = new Error(toUserMessage({ message: messageFromPayload(data), status }, USER_MESSAGES.generic));
  err.status = status;
  err.data = data;
  throw err;
}

export async function api(path, { method = "GET", body, headers = {}, auth = true, formData } = {}) {
  const opts = {
    method,
    headers: { ...authHeader(auth), ...headers },
  };
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
  if (!res.ok) throwApiError(res.status, data, { auth });
  return data;
}

/**
 * Multipart upload with byte-level progress.
 * `onProgress({ percent, phase })` — phase is "upload" while sending, "saving" while waiting on the server.
 */
export function apiUpload(path, { formData, method = "POST", auth = true, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, apiUrl(path));
    const headers = authHeader(auth);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    let saveTick = null;
    const stopSaveTick = () => {
      if (saveTick) {
        clearInterval(saveTick);
        saveTick = null;
      }
    };
    const startSaving = () => {
      let p = 85;
      onProgress?.({ percent: p, phase: "saving" });
      stopSaveTick();
      saveTick = setInterval(() => {
        p = Math.min(96, p + 1);
        onProgress?.({ percent: p, phase: "saving" });
        if (p >= 96) stopSaveTick();
      }, 220);
    };

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.max(4, Math.round((e.loaded / e.total) * 80));
      onProgress?.({ percent: pct, phase: "upload" });
    };
    xhr.upload.onload = startSaving;

    xhr.onerror = () => {
      stopSaveTick();
      const err = new Error(USER_MESSAGES.network);
      err.status = 0;
      reject(err);
    };
    xhr.onabort = () => {
      stopSaveTick();
      const err = new Error(USER_MESSAGES.network);
      err.status = 0;
      reject(err);
    };
    xhr.onload = () => {
      stopSaveTick();
      const ct = xhr.getResponseHeader("content-type") || "";
      let data = {};
      if (ct.includes("application/json")) {
        try {
          data = JSON.parse(xhr.responseText || "{}");
        } catch {
          data = {};
        }
      } else {
        data = xhr.responseText;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          throwApiError(xhr.status, data, { auth });
        } catch (e) {
          reject(e);
        }
        return;
      }
      onProgress?.({ percent: 100, phase: "done" });
      resolve(data);
    };

    onProgress?.({ percent: 4, phase: "upload" });
    xhr.send(formData);
  });
}

function fileNameFromDisposition(header) {
  const cd = String(header || "");
  const star = cd.match(/filename\*=(?:UTF-8'')([^;]+)/i);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/["']/g, "").trim());
    } catch {
      return star[1].replace(/["']/g, "").trim();
    }
  }
  const plain = cd.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || null;
}

/** Authenticated binary download (PDF, files). Uses the API origin + Bearer token. */
export async function apiGetBlob(path, { auth = true } = {}) {
  let res;
  try {
    res = await fetch(apiUrl(path), { headers: authHeader(auth) });
  } catch (e) {
    const err = new Error(toUserMessage(e, USER_MESSAGES.network));
    err.status = 0;
    throw err;
  }
  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
    throwApiError(res.status, data, { auth });
  }
  const blob = await res.blob();
  return {
    blob,
    fileName: fileNameFromDisposition(res.headers.get("content-disposition")),
    contentType: res.headers.get("content-type") || blob.type || "",
  };
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function getPublicConfig() {
  try {
    return await api("/api/config/public", { auth: false });
  } catch {
    return { razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || "" };
  }
}
