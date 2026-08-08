/** Persist KYC file bytes in IndexedDB (localStorage only keeps metadata). */

const IDB_NAME = "iehub_kyc_upload_blobs_v1";
const IDB_STORE = "blobs";
const IDB_VERSION = 1;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null;

const ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,image/jpg,.pdf,.jpg,.jpeg,.png,.webp";

export const KYC_FILE_ACCEPT = ACCEPT;

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

function blobKey(email, docId) {
  return `${String(email || "").toLowerCase()}:${docId}`;
}

export function validateKycFile(file) {
  if (!file) return { ok: false, message: "No file selected" };
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const okType =
    type === "application/pdf" ||
    type.startsWith("image/") ||
    /\.(pdf|jpe?g|png|webp)$/i.test(name);
  if (!okType) return { ok: false, message: "Use a PDF or image (JPG, PNG, WebP)" };
  if (file.size > MAX_BYTES) return { ok: false, message: "File must be 5MB or smaller" };
  return { ok: true };
}

export async function putKycBlob(email, docId, blob) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).put(blob, blobKey(email, docId));
  });
}

export async function getKycBlob(email, docId) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(blobKey(email, docId));
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteKycBlob(email, docId) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).delete(blobKey(email, docId));
  });
}

export function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
