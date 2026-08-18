/**
 * Tax invoices for payments.
 * Source of truth: GET /api/invoices after payment verify on backend.
 */
import { GST_RATE, formatInr, priceWithGst } from "@/lib/planCatalog";
import { normalizeEmail } from "@/lib/authSession";
import { api, apiGetBlob, triggerBlobDownload } from "@/lib/api";
import { getCachedPublicConfig } from "@/lib/appConfig";

const INVOICES_KEY = "vistara_invoices_v1";
const OUTBOX_KEY = "vistara_email_outbox_v1";

/** Seller details for GST tax invoices (New India Export). */
export const INVOICE_SELLER = {
  legalName: "New India Export",
  brandName: "VIRASTRA INTERNATIONAL EXPORT",
  gstin: "27AXGPY3435Q1ZK",
  addressLines: [
    "1ST FLOOR SHOP NO M-02",
    "PREMIUM PLAZA COMMERCIAL COMPLEX",
    "MATA MANDIR ROAD NEAR CHHOTI LAHORI",
    "DHARAMPETH NAGPUR-440010",
  ],
  state: "Maharashtra",
  stateCode: "27",
  placeOfSupply: "Maharashtra",
};

export function getSellerAddressBlock() {
  const cfg = getCachedPublicConfig();
  if (cfg?.seller?.address) return cfg.seller.address;
  return INVOICE_SELLER.addressLines.join(", ");
}

/** Split total GST into CGST + SGST (equal halves; remainder on SGST). */
export function splitCgstSgst(gstAmount) {
  const gst = Math.max(0, Math.round(Number(gstAmount) || 0));
  const cgst = Math.floor(gst / 2);
  const sgst = gst - cgst;
  const halfRate = Math.round((GST_RATE / 2) * 10000) / 100; // 9
  return { cgst, sgst, cgstRate: halfRate, sgstRate: halfRate };
}

/**
 * Build GST lines from taxable (exclusive) base.
 * @returns {{ taxable: number, gst: number, cgst: number, sgst: number, igst: number, total: number, gstRate: number, cgstRate: number, sgstRate: number, taxMode: 'cgst_sgst' }}
 */
export function gstBreakdownFromTaxable(taxableInr) {
  const { base, gst, total, gstRate } = priceWithGst(taxableInr);
  const { cgst, sgst, cgstRate, sgstRate } = splitCgstSgst(gst);
  return {
    taxable: base,
    gst,
    cgst,
    sgst,
    igst: 0,
    total,
    gstRate,
    cgstRate,
    sgstRate,
    taxMode: "cgst_sgst",
  };
}

/**
 * Reverse GST from a GST-inclusive total (workshop / booking token fees).
 */
export function gstBreakdownFromInclusive(totalInr) {
  const total = Math.max(0, Math.round(Number(totalInr) || 0));
  const taxable = Math.round(total / (1 + GST_RATE));
  const gst = total - taxable;
  const { cgst, sgst, cgstRate, sgstRate } = splitCgstSgst(gst);
  return {
    taxable,
    gst,
    cgst,
    sgst,
    igst: 0,
    total,
    gstRate: GST_RATE,
    cgstRate,
    sgstRate,
    taxMode: "cgst_sgst",
  };
}

function loadMap() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveMap(map) {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(map));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iehub-invoices-updated"));
  }
}

function nextInvoiceNumber() {
  const y = new Date().getFullYear();
  const seq = String(Date.now()).slice(-6);
  return `NIE/${y}/${seq}`;
}

/**
 * @param {{
 *   paymentId?: string,
 *   orderId?: string,
 *   sku?: string,
 *   description?: string,
 *   customer: { name?: string, email: string, phone?: string, company?: string, address?: string, gstin?: string, state?: string },
 *   lineItems?: { description: string, quantity?: number, unitAmount?: number }[],
 *   taxableAmount?: number,
 *   totalInclusive?: number,
 *   gstBreakdown?: object,
 * }} opts
 */
export function createInvoice(opts = {}) {
  const customerEmail = normalizeEmail(opts.customer?.email);
  if (!customerEmail) throw new Error("Customer email required for invoice");

  const breakdown =
    opts.gstBreakdown ||
    (opts.taxableAmount != null
      ? gstBreakdownFromTaxable(opts.taxableAmount)
      : gstBreakdownFromInclusive(opts.totalInclusive ?? 0));

  const lineItems =
    Array.isArray(opts.lineItems) && opts.lineItems.length
      ? opts.lineItems.map((li) => ({
          description: String(li.description || "Service"),
          quantity: Math.max(1, Number(li.quantity) || 1),
          unitAmount: Math.max(0, Math.round(Number(li.unitAmount) || breakdown.taxable)),
        }))
      : [
          {
            description: opts.description || "Payment",
            quantity: 1,
            unitAmount: breakdown.taxable,
          },
        ];

  const now = new Date().toISOString();
  const invoice = {
    id: `INV-${Date.now().toString(36).toUpperCase()}`,
    invoiceNumber: nextInvoiceNumber(),
    status: "issued",
    currency: "INR",
    issuedAt: now,
    paymentId: opts.paymentId || null,
    orderId: opts.orderId || null,
    sku: opts.sku || null,
    seller: { ...INVOICE_SELLER, addressLines: [...INVOICE_SELLER.addressLines] },
    customer: {
      name: String(opts.customer?.name || "").trim() || "Customer",
      email: customerEmail,
      phone: String(opts.customer?.phone || "").trim() || "",
      company: String(opts.customer?.company || "").trim() || "",
      address: String(opts.customer?.address || "").trim() || "",
      gstin: String(opts.customer?.gstin || "").trim() || "",
      state: String(opts.customer?.state || "").trim() || "",
    },
    lineItems,
    amounts: {
      taxable: breakdown.taxable,
      cgst: breakdown.cgst,
      sgst: breakdown.sgst,
      igst: breakdown.igst || 0,
      gst: breakdown.gst,
      total: breakdown.total,
      gstRate: breakdown.gstRate,
      cgstRate: breakdown.cgstRate,
      sgstRate: breakdown.sgstRate,
      taxMode: breakdown.taxMode || "cgst_sgst",
    },
    email: {
      status: "pending",
      template: "payment.invoice",
      sentAt: null,
      mock: true,
    },
    source: "ui_mock",
  };

  const map = loadMap();
  const list = Array.isArray(map[customerEmail]) ? map[customerEmail] : [];
  map[customerEmail] = [invoice, ...list];
  saveMap(map);

  const mail = mockSendInvoiceEmail(invoice);
  invoice.email = {
    status: mail.status,
    template: mail.template,
    sentAt: mail.sentAt,
    mock: true,
    outboxId: mail.id,
  };
  map[customerEmail][0] = invoice;
  saveMap(map);

  return invoice;
}

export function listInvoicesForEmail(email) {
  const key = normalizeEmail(email);
  if (!key) return [];
  const map = loadMap();
  return Array.isArray(map[key]) ? map[key].map((x) => ({ ...x })) : [];
}

/** Load invoices from Mongo for the signed-in user. */
export async function fetchInvoicesForEmail(email) {
  const key = normalizeEmail(email);
  if (!key) return [];
  try {
    const data = await api("/api/invoices");
    const list = Array.isArray(data) ? data : data?.items || data?.data || [];
    const mine = list.filter((inv) => normalizeEmail(inv.customer?.email || inv.customerEmail) === key || !inv.customer?.email);
    const map = loadMap();
    map[key] = mine.length ? mine : list;
    saveMap(map);
    return listInvoicesForEmail(key);
  } catch (e) {
    console.warn("[invoices] fetch failed", e.message);
    return listInvoicesForEmail(key);
  }
}

async function resolveInvoiceId({ invoiceId, paymentId } = {}) {
  const direct = String(invoiceId || "").trim();
  if (direct) return direct;
  if (!paymentId) return "";
  const data = await api(`/api/invoices?paymentId=${encodeURIComponent(paymentId)}&limit=1`);
  const items = data?.items || data?.data?.items || [];
  return Array.isArray(items) && items[0]?.id ? String(items[0].id) : "";
}

/**
 * Download a tax-invoice PDF with the session token (plain <a href> cannot send Bearer auth).
 */
export async function downloadPaymentInvoicePdf({ invoiceId, paymentId } = {}) {
  const id = await resolveInvoiceId({ invoiceId, paymentId });
  if (!id) {
    const err = new Error("No invoice for this payment yet");
    err.status = 404;
    throw err;
  }
  try {
    const { blob, fileName } = await apiGetBlob(`/api/invoices/${encodeURIComponent(id)}/pdf`);
    triggerBlobDownload(blob, fileName || `${id}.pdf`);
    return;
  } catch (e) {
    const data = await api(`/api/invoices/${encodeURIComponent(id)}`).catch(() => {
      throw e;
    });
    const invoice = data?.data || data;
    if (!invoice?.id && !invoice?.invoiceNumber) throw e;
    const { downloadInvoicePdf } = await import("@/lib/downloadInvoicePdf");
    await downloadInvoicePdf(invoice);
  }
}

export function getInvoiceById(invoiceId) {
  const id = String(invoiceId || "").trim();
  if (!id) return null;
  const map = loadMap();
  for (const list of Object.values(map)) {
    if (!Array.isArray(list)) continue;
    const hit = list.find((inv) => inv.id === id || inv.invoiceNumber === id);
    if (hit) return { ...hit };
  }
  return null;
}

/**
 * Mock SMTP: enqueue payment.invoice email (backend will attach PDF).
 * Tries POST /api/invoices/:id/email when available; always records local outbox.
 */
export function mockSendInvoiceEmail(invoice) {
  const to = invoice?.customer?.email;
  const entry = {
    id: `MAIL-${Date.now().toString(36).toUpperCase()}`,
    template: "payment.invoice",
    to,
    subject: `Tax Invoice ${invoice.invoiceNumber} — ${invoice.seller?.legalName || "New India Export"}`,
    vars: {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer?.name,
      amountInr: invoice.amounts?.total,
      paymentId: invoice.paymentId,
      taxable: invoice.amounts?.taxable,
      cgst: invoice.amounts?.cgst,
      sgst: invoice.amounts?.sgst,
      gst: invoice.amounts?.gst,
    },
    status: "queued",
    attempts: 0,
    createdAt: new Date().toISOString(),
    sentAt: null,
    mock: true,
  };

  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    const box = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(box) ? box : [];
    list.unshift(entry);
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    /* ignore */
  }

  // Fire-and-forget: real backend will own this
  if (typeof fetch !== "undefined") {
    fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("vistara_token") || ""}`,
      },
      body: JSON.stringify({ invoiceId: invoice.id, to }),
    }).catch(() => {
      /* mock until backend ships */
    });
  }

  entry.status = "sent";
  entry.sentAt = new Date().toISOString();
  entry.attempts = 1;
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    const box = raw ? JSON.parse(raw) : [];
    if (Array.isArray(box) && box[0]?.id === entry.id) {
      box[0] = entry;
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(box));
    }
  } catch {
    /* ignore */
  }

  if (typeof console !== "undefined") {
    console.info(
      `[invoice mock] Email queued → ${to}: ${entry.subject} (${formatInr(invoice.amounts?.total)})`,
    );
  }

  return entry;
}

/**
 * Create invoice after a successful payment (shared by plan / workshop / booking).
 */
export function issueInvoiceForPayment({
  paymentId,
  orderId,
  sku,
  description,
  customer,
  taxableAmount,
  totalInclusive,
  lineItems,
}) {
  return createInvoice({
    paymentId,
    orderId,
    sku,
    description,
    customer,
    taxableAmount,
    totalInclusive,
    lineItems,
  });
}
