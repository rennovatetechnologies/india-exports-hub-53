/**
 * Map any thrown/API error to a short, customer-facing sentence.
 * Technical details stay in the console only.
 */

export const USER_MESSAGES = {
  generic: "Something went wrong. Please try again.",
  network: "We're having trouble connecting. Please try again in a moment.",
  timeout: "That took too long. Please try again.",
  unauthorized: "Please sign in again to continue.",
  forbidden: "You don't have access to that.",
  notFound: "We couldn't find that. It may have been moved or removed.",
  conflict: "That action isn't available right now. Refresh and try again.",
  tooLarge: "That file is too large. Try a smaller one.",
  tooMany: "Too many attempts. Please wait a moment and try again.",
  unavailable: "This is temporarily unavailable. Please try again shortly.",
  payment: "We couldn't complete the payment. No charge was made — you can try again.",
  paymentCancelled: "Payment was cancelled. You can try again when you're ready.",
  paymentVerify: "We received your payment but couldn't confirm it. Contact support if you were charged.",
  save: "We couldn't save that. Please try again.",
  load: "We couldn't load this right now. Please try again.",
  send: "We couldn't send that. Please try again.",
  upload: "We couldn't upload that file. Please try again.",
  download: "We couldn't download that file. Please try again.",
  otp: "We couldn't send a code right now. Please try again.",
  verify: "We couldn't verify that code. Request a new one and try again.",
};

const TECHNICAL_RE =
  /econnrefused|enotfound|econnreset|etimedout|eaddrinuse|epipe|mongo|mongoose|gridfs|objectid|casterror|validationerror|jsonwebtoken|unauthorizederror|syntaxerror|typeerror|referenceerror|rangeerror|internal server error|failed to fetch|networkerror|load failed|cors|proxy|vite_|razorpay key|razorpay sdk|checkout\.js|multer|zod|fielderrors|stack trace|at\s+\S+\s+\(|cannot read prop|undefined is not|is not a function|is not defined|unexpected token|jwt|bearer |localhost:\d+|127\.0\.0\.1|:\d{4,5}\b|backend|mongodb|npm |node:|err_|enoent|eacces|module not found|webpack|chunkload|hydrat/i;

const HTML_RE = /^\s*<(!doctype|html|pre|body)/i;
const FIELD_DUMP_RE = /^[\w.]+:\s+.+(;\s*[\w.]+:\s+.+)+/;
const CODE_RE = /^[A-Z][A-Z0-9_]{2,}$/;

function firstLine(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/[\n\r]/)[0]
    .trim();
}

export function extractErrorText(err) {
  if (err == null) return "";
  if (typeof err === "string") return firstLine(err);
  if (typeof err?.message === "string" && err.message) return firstLine(err.message);
  if (typeof err?.reason === "string" && err.reason) return firstLine(err.reason);
  return "";
}

const KNOWN_RAW = {
  "not found": USER_MESSAGES.notFound,
  "forbidden": USER_MESSAGES.forbidden,
  "file required": "Please choose a file to upload.",
  "file type not allowed": "That file type isn't supported. Please use a PDF or image.",
  "invalid signature": USER_MESSAGES.paymentVerify,
  "unauthorized": USER_MESSAGES.unauthorized,
  "internal server error": USER_MESSAGES.unavailable,
  "request failed": USER_MESSAGES.generic,
  "order creation failed": USER_MESSAGES.payment,
  "register failed": USER_MESSAGES.generic,
  "upload failed": USER_MESSAGES.upload,
  "otp send failed": USER_MESSAGES.otp,
};

export function isTechnicalMessage(text) {
  const msg = firstLine(text);
  if (!msg) return true;
  if (msg.length > 160) return true;
  if (HTML_RE.test(msg)) return true;
  if (CODE_RE.test(msg)) return true;
  if (FIELD_DUMP_RE.test(msg)) return true;
  if (TECHNICAL_RE.test(msg)) return true;
  if (/[{}\[\]]/.test(msg) && /error|exception|trace|stack/i.test(msg)) return true;
  if (/\b(status|code)\s*[:=]\s*\d{3}\b/i.test(msg)) return true;
  if (/^(request|order creation|register|upload|otp send) failed$/i.test(msg)) return true;
  return false;
}

function fallbackForStatus(status) {
  const code = Number(status) || 0;
  if (code === 0) return USER_MESSAGES.network;
  if (code === 401) return USER_MESSAGES.unauthorized;
  if (code === 403) return USER_MESSAGES.forbidden;
  if (code === 404) return USER_MESSAGES.notFound;
  if (code === 408 || code === 504) return USER_MESSAGES.timeout;
  if (code === 409) return USER_MESSAGES.conflict;
  if (code === 413) return USER_MESSAGES.tooLarge;
  if (code === 429) return USER_MESSAGES.tooMany;
  if (code === 402 || code === 422) return USER_MESSAGES.generic;
  if (code >= 500) return USER_MESSAGES.unavailable;
  if (code >= 400) return USER_MESSAGES.generic;
  return USER_MESSAGES.generic;
}

function looksLikePayment(text, fallback) {
  const blob = `${text || ""} ${fallback || ""}`.toLowerCase();
  return /\b(pay|payment|razorpay|order|checkout|charge)\b/.test(blob);
}

/**
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function toUserMessage(err, fallback = USER_MESSAGES.generic) {
  const status = Number(err?.status || err?.statusCode || err?.response?.status) || 0;
  const raw = extractErrorText(err);
  const known = KNOWN_RAW[raw.toLowerCase()];
  if (known) return known;

  if (/cancel/i.test(raw) && looksLikePayment(raw, fallback)) {
    return USER_MESSAGES.paymentCancelled;
  }

  if (raw && !isTechnicalMessage(raw)) {
    return raw;
  }

  if (status) return fallbackForStatus(status);

  if (!raw) return fallback || USER_MESSAGES.generic;

  if (/failed to fetch|networkerror|load failed|econnrefused|enotfound/i.test(raw)) {
    return USER_MESSAGES.network;
  }
  if (looksLikePayment(raw, fallback)) return USER_MESSAGES.payment;

  return fallback || USER_MESSAGES.generic;
}

/** True when the user closed Razorpay without paying. */
export function isPaymentCancelled(err) {
  return /cancel/i.test(extractErrorText(err));
}
