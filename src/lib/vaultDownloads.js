/**
 * Vault file bytes: customer uploads are stored in IndexedDB (not serializable in localStorage).
 * Demo / seed rows use a small placeholder blob so operations can still download and open files.
 */

const IDB_NAME = "iehub_vault_upload_blobs_v1";
const IDB_STORE = "blobs";
const IDB_VERSION = 1;

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null;

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

/** @param {string} caseId @param {number} index */
function blobKey(caseId, index) {
  return `${caseId}:${index}`;
}

/**
 * @param {string} caseId
 * @param {number} index
 * @param {Blob} blob
 */
export async function putVaultUploadBlob(caseId, index, blob) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).put(blob, blobKey(caseId, index));
  });
}

/**
 * @param {string} caseId
 * @param {number} index
 * @returns {Promise<Blob | null>}
 */
export async function getVaultUploadBlob(caseId, index) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(blobKey(caseId, index));
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
    req.onerror = () => reject(req.error);
  });
}

/** Minimal valid one-page PDF (blank) for demo downloads. */
function minimalPdfBlob() {
  const b64 =
    "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYgM10vUGFyZW50IDIgMCBSPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTIgMDAwMDAgbiAKMDAwMDAwMDEwMSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjE3OAolJUVPRgo=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "application/pdf" });
}

const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function tinyPngBlob() {
  const bin = atob(TINY_PNG_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

/**
 * @param {string} filename
 * @param {string} caseId
 * @returns {Blob}
 */
export function placeholderBlobForVaultDoc(filename, caseId) {
  const lower = String(filename || "").toLowerCase();
  if (lower.endsWith(".pdf")) return minimalPdfBlob();
  if (/\.(png|jpe?g|webp)$/.test(lower)) return tinyPngBlob();
  const text = `India Exports Hub — demo vault file\n\nDocument: ${filename}\nCase: ${caseId}\n\nCustomer uploads are stored in this browser. Seed rows use this placeholder until the API is connected.`;
  return new Blob([text], { type: "text/plain;charset=utf-8" });
}

/**
 * @param {{ status: string }} doc
 */
export function vaultDocIsDownloadable(doc) {
  if (!doc || doc.status === "missing") return false;
  return true;
}

/**
 * @param {string} caseId
 * @param {number} index
 * @param {{ name: string }} doc
 */
export async function resolveVaultDocumentBlob(caseId, index, doc) {
  const stored = await getVaultUploadBlob(caseId, index);
  if (stored) return stored;
  return placeholderBlobForVaultDoc(doc.name, caseId);
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlobAsFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "document";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * @param {Blob} blob
 */
export function openBlobInNewTab(blob) {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (w) setTimeout(() => URL.revokeObjectURL(url), 120_000);
  else URL.revokeObjectURL(url);
}
