/**
 * Brochures catalog — metadata from Mongo GET /api/brochures.
 * Gallery photos keep static /brochure/*.jpg paths; uploaded bytes in IndexedDB/Drive.
 */

import { api } from "@/lib/api";
import { PATHS } from "@/lib/routes";

const STORAGE_KEY = "vistara_brochures_catalog";
const UPDATED_EVENT = "iehub-brochures-updated";

const IDB_NAME = "iehub_brochure_blobs_v1";
const IDB_STORE = "blobs";
const IDB_VERSION = 1;

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const BROCHURE_FILE_ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,image/jpg,.pdf,.jpg,.jpeg,.png,.webp";

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null;
/** @type {object[] | null} */
let memoryCatalog = null;

const DEFAULT_GALLERY_PATHS = Array.from({ length: 17 }, (_, i) => `/brochure/B${i + 1}.jpg`);

export const DEFAULT_BROCHURES = [
  {
    id: "pdf-workshop-flyer",
    name: "Workshop Flyer",
    kind: "pdf",
    path: "/new india (4).pdf",
    showInNav: true,
    sortOrder: 10,
  },
  {
    id: "pdf-workshop-brochure",
    name: "Workshop Brochure",
    kind: "pdf",
    path: "/BrochureFinal.pdf",
    showInNav: true,
    sortOrder: 20,
  },
  {
    id: "pdf-nie-virtual",
    name: "NIE X Virtual Workshop Brochure",
    kind: "pdf",
    path: "/brochure/NIE X VIRTUAL SHIPMENT WORKSHOP (5 DAYS) BROCHURE.pdf",
    showInNav: true,
    sortOrder: 30,
  },
  ...DEFAULT_GALLERY_PATHS.map((path, i) => ({
    id: `gallery-b${i + 1}`,
    name: `Brochure ${i + 1}`,
    kind: "gallery",
    path,
    showInNav: false,
    sortOrder: 100 + i,
  })),
];

function openDb() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = /** @type {IDBDatabase} */ (e.target.result);
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
    });
  }
  return dbPromise;
}

function normalizeBrochure(row) {
  if (!row || typeof row !== "object") return null;
  const id = String(row.id || "").trim();
  const name = String(row.name || row.title || "").trim();
  const kind = row.kind === "gallery" ? "gallery" : "pdf";
  if (!id || !name) return null;
  let path = String(row.path || "").trim();
  if (!path && row.fileUrl) path = String(row.fileUrl);
  if (!path && (row.fileId || row.driveFileId)) {
    path = `/api/brochures/${encodeURIComponent(id)}/file`;
  }
  const hasBlob = Boolean(row.hasBlob);
  if (!path && !hasBlob) return null;
  return {
    id,
    name,
    kind,
    path: path || undefined,
    hasBlob,
    fileName: row.fileName ? String(row.fileName) : undefined,
    fileType: row.fileType ? String(row.fileType) : undefined,
    fileSize: Number(row.fileSize) > 0 ? Number(row.fileSize) : undefined,
    showInNav: kind === "pdf" ? row.showInNav !== false : false,
    sortOrder: Number.isFinite(Number(row.sortOrder)) ? Number(row.sortOrder) : 0,
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
  };
}

function sortCatalog(list) {
  return [...list].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

function setMemory(items) {
  memoryCatalog = sortCatalog(items);
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
  }
  return memoryCatalog;
}

export function loadBrochuresCatalog() {
  if (memoryCatalog?.length) return memoryCatalog.map((x) => ({ ...x }));
  return DEFAULT_BROCHURES.map((x) => ({ ...x }));
}

export async function fetchBrochuresCatalog({ force = false } = {}) {
  if (memoryCatalog?.length && !force) return memoryCatalog.map((x) => ({ ...x }));
  try {
    const data = await api("/api/brochures", { auth: false });
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    const cleaned = sortCatalog(list.map(normalizeBrochure).filter(Boolean));
    if (cleaned.length) {
      setMemory(cleaned);
      return cleaned.map((x) => ({ ...x }));
    }
  } catch (e) {
    console.warn("[brochures] fetch failed", e.message);
  }
  return loadBrochuresCatalog();
}

export function saveBrochuresCatalog(items) {
  return setMemory((Array.isArray(items) ? items : []).map(normalizeBrochure).filter(Boolean));
}

export function subscribeBrochures(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange(loadBrochuresCatalog());
  window.addEventListener(UPDATED_EVENT, handler);
  return () => window.removeEventListener(UPDATED_EVENT, handler);
}

export function getPdfBrochures(catalog = loadBrochuresCatalog()) {
  return catalog.filter((b) => b.kind === "pdf");
}

export function getGalleryBrochures(catalog = loadBrochuresCatalog()) {
  return catalog.filter((b) => b.kind === "gallery");
}

/** Navbar / mobile menu entries (gallery hub link + PDF downloads). */
export function getBrochureMenu(catalog = loadBrochuresCatalog()) {
  return [
    { name: "View all brochures", path: PATHS.brochures, type: "link" },
    ...getPdfBrochures(catalog)
      .filter((b) => b.showInNav)
      .map((b) => ({
        id: b.id,
        name: b.name,
        path: b.path,
        type: "download",
        hasBlob: b.hasBlob,
      })),
  ];
}

export function validateBrochureFile(file, kind = "pdf") {
  if (!file) return { ok: false, message: "No file selected" };
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const isPdf = type === "application/pdf" || /\.pdf$/i.test(name);
  const isImage =
    type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(name);

  if (kind === "gallery") {
    if (!isImage) return { ok: false, message: "Use an image (JPG, PNG, or WebP)" };
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, message: "Image must be 8MB or smaller" };
    }
  } else {
    if (!isPdf && !isImage) {
      return { ok: false, message: "Use a PDF or image (JPG, PNG, WebP)" };
    }
    const limit = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      return {
        ok: false,
        message: isPdf ? "PDF must be 20MB or smaller" : "Image must be 8MB or smaller",
      };
    }
  }
  return { ok: true };
}

export function formatBrochureSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export async function putBrochureBlob(id, blob) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).put(blob, String(id));
  });
}

export async function getBrochureBlob(id) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(String(id));
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBrochureBlob(id) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).delete(String(id));
  });
}

/** Resolve a display/download URL (static path or temporary object URL). Caller must revoke object URLs. */
export async function resolveBrochureUrl(item) {
  if (!item) return null;
  if (item.hasBlob) {
    const blob = await getBrochureBlob(item.id);
    if (!blob) return item.path ? encodeURI(item.path) : null;
    return URL.createObjectURL(blob);
  }
  if (item.path) return encodeURI(item.path);
  return null;
}

/** Open PDF/image in a new tab (static path or uploaded blob). */
export async function openBrochureItem(item) {
  if (!item) return;
  if (item.hasBlob) {
    const blob = await getBrochureBlob(item.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // Revoke after the tab has a chance to load
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }
  }
  if (item.path) {
    window.open(encodeURI(item.path), "_blank", "noopener,noreferrer");
  }
}

export function newBrochureId(kind) {
  return `${kind === "gallery" ? "gallery" : "pdf"}-${Date.now().toString(36)}`;
}
