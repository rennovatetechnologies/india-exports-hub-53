import { jsPDF } from "jspdf";
import { formatInr } from "@/lib/planCatalog";
import { getSellerAddressBlock, INVOICE_SELLER } from "@/lib/invoice";

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

function safeFileName(invoice) {
  const num = String(invoice?.invoiceNumber || invoice?.id || "invoice")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-");
  return `${num}.pdf`;
}

/**
 * Build a tax-invoice PDF in the browser and trigger a download.
 * Nothing is uploaded or stored remotely.
 * @param {object} invoice
 */
export function downloadInvoicePdf(invoice) {
  if (!invoice) return;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const right = pageW - margin;
  let y = margin;

  const seller = invoice.seller || INVOICE_SELLER;
  const customer = invoice.customer || {};
  const amounts = invoice.amounts || {};
  const address = getSellerAddressBlock();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(seller.legalName || "New India Export", margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  if (seller.brandName) {
    doc.text(seller.brandName, margin, y);
    y += 14;
  }
  const addrLines = doc.splitTextToSize(address, 280);
  doc.text(addrLines, margin, y);
  y += addrLines.length * 12 + 4;
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN: ${seller.gstin || INVOICE_SELLER.gstin}`, margin, y);

  let ry = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TAX INVOICE", right, ry, { align: "right" });
  ry += 18;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${invoice.invoiceNumber || "—"}`, right, ry, { align: "right" });
  ry += 14;
  doc.text(`Date: ${formatDate(invoice.issuedAt)}`, right, ry, { align: "right" });
  ry += 14;
  if (invoice.paymentId) {
    const payLines = doc.splitTextToSize(`Payment ID: ${invoice.paymentId}`, 220);
    doc.text(payLines, right, ry, { align: "right" });
    ry += payLines.length * 12;
  }
  doc.text(`Place of supply: ${seller.placeOfSupply || "Maharashtra"}`, right, ry, {
    align: "right",
  });

  y = Math.max(y, ry) + 28;
  doc.setDrawColor(200);
  doc.line(margin, y, right, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("BILL TO", margin, y);
  y += 14;
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(customer.name || "—", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (customer.company) {
    doc.text(customer.company, margin, y);
    y += 12;
  }
  if (customer.email) {
    doc.text(customer.email, margin, y);
    y += 12;
  }
  if (customer.phone) {
    doc.text(customer.phone, margin, y);
    y += 12;
  }
  if (customer.address) {
    const cAddr = doc.splitTextToSize(customer.address, 280);
    doc.text(cAddr, margin, y);
    y += cAddr.length * 12;
  }
  if (customer.gstin) {
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${customer.gstin}`, margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
  }

  y += 16;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 12, right - margin, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Description", margin + 6, y);
  doc.text("Qty", right - 110, y, { align: "right" });
  doc.text("Amount", right - 6, y, { align: "right" });
  y += 18;

  doc.setFont("helvetica", "normal");
  const items = invoice.lineItems?.length
    ? invoice.lineItems
    : [{ description: invoice.description || "Service", quantity: 1, unitAmount: amounts.taxable || 0 }];

  items.forEach((li) => {
    const desc = doc.splitTextToSize(li.description || "—", 300);
    const qty = li.quantity || 1;
    const lineTotal = Number(li.unitAmount || 0) * qty;
    doc.text(desc, margin + 6, y);
    doc.text(String(qty), right - 110, y, { align: "right" });
    doc.text(formatInr(lineTotal), right - 6, y, { align: "right" });
    y += Math.max(desc.length * 12, 16) + 4;
  });

  y += 10;
  doc.line(margin, y, right, y);
  y += 18;

  const row = (label, value, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.text(label, right - 160, y);
    doc.text(value, right - 6, y, { align: "right" });
    y += bold ? 18 : 14;
  };

  row("Taxable value", formatInr(amounts.taxable));
  row(`CGST @ ${amounts.cgstRate ?? 9}%`, formatInr(amounts.cgst));
  row(`SGST @ ${amounts.sgstRate ?? 9}%`, formatInr(amounts.sgst));
  row("Grand total", formatInr(amounts.total), true);

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("This is a computer-generated tax invoice.", margin, y);

  doc.save(safeFileName(invoice));
}
