import { jsPDF } from "jspdf";
import { formatInr } from "@/lib/planCatalog";
import {
  getSellerAddressBlock,
  INVOICE_LINE_OF_BUSINESS,
  INVOICE_PAYMENT_SUCCESS_MESSAGE,
  INVOICE_SELLER,
  INVOICE_SERVICE_REFERENCE,
  INVOICE_TERMS,
} from "@/lib/invoice";
import { getCachedPublicConfig, getSupportEmail, getSupportPhoneDisplay } from "@/lib/appConfig";
import { SITE_URL } from "@/lib/seo";

export const BRAND_LOGO_SRC = "/logo.png";
const LOGO_ASPECT = 810 / 1219;

const NAVY = [11, 42, 74];
const GOLD = [201, 162, 39];
const ROW_ALT = [234, 242, 248];
const TAN = [232, 213, 181];
const MUTED = [74, 85, 104];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

function safeFileName(invoice) {
  const num = String(invoice?.invoiceNumber || invoice?.id || "invoice")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-");
  return `${num}.pdf`;
}

function loadBrandLogo() {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = BRAND_LOGO_SRC;
  });
}

function sellerTrade(seller) {
  return seller?.tradeName || seller?.brandName || INVOICE_SELLER.tradeName;
}

/**
 * Build a single-page tax-invoice PDF and trigger a download.
 * @param {object} invoice
 */
export async function downloadInvoicePdf(invoice) {
  if (!invoice) return;

  const logo = await loadBrandLogo();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 28;
  const right = pageW - margin;
  const footerH = 40;
  let y = 24;

  const seller = invoice.seller || INVOICE_SELLER;
  const customer = invoice.customer || {};
  const amounts = invoice.amounts || {};
  const address = getSellerAddressBlock();
  const cfg = getCachedPublicConfig();

  if (logo?.dataUrl) {
    const logoW = 72;
    const logoH = logoW * (logo.height && logo.width ? logo.height / logo.width : LOGO_ASPECT);
    doc.addImage(logo.dataUrl, "PNG", margin, y, logoW, logoH);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(seller.brandName || INVOICE_SELLER.brandName, margin, y + 10);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(sellerTrade(seller), right, y + 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("Export | Import | Trade Solutions", right, y + 22, { align: "right" });

  y += 56;
  const barW = 140;
  const barH = 22;
  const barX = (pageW - barW) / 2;
  doc.setFillColor(...NAVY);
  doc.rect(barX, y, barW, barH, "F");
  doc.setFillColor(...GOLD);
  doc.triangle(barX - 14, y + barH / 2, barX, y, barX, y + barH, "F");
  doc.triangle(barX + barW + 14, y + barH / 2, barX + barW, y, barX + barW, y + barH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", pageW / 2, y + 15, { align: "center" });
  y += barH + 14;

  const issuedAt = invoice.issuedAt;
  const meta = [
    ["Invoice No.", invoice.invoiceNumber || "—"],
    ["Invoice Date", formatDate(issuedAt)],
    ["Due Date", formatDate(issuedAt)],
  ];
  meta.forEach(([label, value], i) => {
    const yy = y + i * 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${label}:`, margin, yy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    doc.text(value, margin + 70, yy);
  });

  const billTo = [customer.name, customer.phone ? `(${customer.phone})` : ""]
    .filter(Boolean)
    .join(" ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Bill To:", right - 160, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  doc.text(billTo || "Customer", right, y, { align: "right" });

  y += 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(
    `${seller.legalName || INVOICE_SELLER.legalName} · GSTIN ${seller.gstin || INVOICE_SELLER.gstin}`,
    margin,
    y,
  );
  y += 10;
  const addrLines = doc.splitTextToSize(address, right - margin);
  doc.text(addrLines, margin, y);
  y += addrLines.length * 9 + 8;

  const hsn = invoice.lineItems?.[0]?.hsnSac || "998599";
  const receiptNo = invoice.meta?.razorpayPaymentId || invoice.paymentId || invoice.id || "—";

  const rows = [
    ["Receipt No.", receiptNo],
    ["Customer Name", customer.name || "—"],
    ["Customer Number", customer.phone || customer.email || "—"],
    ["Customer Email", customer.email || "—"],
    ["Order Number", invoice.orderId || invoice.paymentId || "—"],
    ["Line of Business", INVOICE_LINE_OF_BUSINESS],
    ["Payment Type", "Bill Payment | Subscription"],
    ["Payment Date & Time", formatDateTime(issuedAt)],
    ["Payment Mode", invoice.meta?.paymentMode || "Online"],
    ["HSN / SAC", hsn],
    ["Place of Supply", seller.placeOfSupply || INVOICE_SELLER.placeOfSupply],
    ["Taxable Value", formatInr(amounts.taxable)],
    [`CGST @ ${amounts.cgstRate ?? 9}%`, formatInr(amounts.cgst)],
    [`SGST @ ${amounts.sgstRate ?? 9}%`, formatInr(amounts.sgst)],
    ["Paid Amount", formatInr(amounts.total)],
    ["Total Paid Amount", formatInr(amounts.total), true],
  ];

  const labelW = 168;
  const valueX = margin + labelW + 8;
  const tableW = right - margin;
  const tableTop = y;
  doc.setFillColor(...NAVY);
  doc.rect(margin, y, tableW, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Particulars", margin + 8, y + 12);
  doc.text("Details", valueX, y + 12);
  y += 18;

  rows.forEach((row, idx) => {
    const highlight = Boolean(row[2]);
    const h = highlight ? 17 : 15;
    if (highlight) doc.setFillColor(...TAN);
    else if (idx % 2 === 0) doc.setFillColor(...ROW_ALT);
    else doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, tableW, h, "F");
    doc.setFont("helvetica", highlight ? "bold" : "normal");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(String(row[0]), margin + 8, y + h / 2 + 2);
    doc.setTextColor(17, 17, 17);
    const valueLines = doc.splitTextToSize(String(row[1] ?? "—"), right - valueX - 6);
    doc.text(valueLines[0] || "—", valueX, y + h / 2 + 2);
    y += h;
  });

  doc.setDrawColor(208, 215, 222);
  doc.setLineWidth(0.5);
  doc.rect(margin, tableTop, tableW, y - tableTop, "S");

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(27, 122, 61);
  doc.text("Payment Successful", margin, y);
  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(INVOICE_PAYMENT_SUCCESS_MESSAGE, margin, y, { maxWidth: tableW });
  y += 14;

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, tableW, 34, 3, 3, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text("Virastra Subscription / Service", margin + 8, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(`Reference: ${INVOICE_SERVICE_REFERENCE}`, margin + 8, y + 24, {
    maxWidth: tableW - 16,
  });
  y += 42;

  doc.setFillColor(...NAVY);
  doc.rect(margin, y, tableW, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Terms and Conditions", margin + 8, y + 11);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  INVOICE_TERMS.forEach((t, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${t}`, tableW);
    doc.text(lines, margin, y);
    y += lines.length * 8 + 2;
  });

  const footerY = pageH - footerH;
  doc.setFillColor(...NAVY);
  doc.rect(0, footerY, pageW, footerH, "F");
  const site = String(SITE_URL || cfg?.frontendUrl || "https://www.virastrainternationalexport.com")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Website: ${site}    Email: ${getSupportEmail()}    Phone: ${getSupportPhoneDisplay()}`,
    pageW / 2,
    footerY + 14,
    { align: "center" },
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text(
    `${seller.brandName || INVOICE_SELLER.brandName} — Digitizing Global Trade for Indian Businesses`,
    pageW / 2,
    footerY + 28,
    { align: "center" },
  );

  doc.save(safeFileName(invoice));
}
