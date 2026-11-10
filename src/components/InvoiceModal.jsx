import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Mail, CheckCircle2, Download } from "lucide-react";
import { formatInr } from "@/lib/planCatalog";
import {
  getSellerAddressBlock,
  INVOICE_LINE_OF_BUSINESS,
  INVOICE_PAYMENT_SUCCESS_MESSAGE,
  INVOICE_SELLER,
  INVOICE_SERVICE_REFERENCE,
  INVOICE_TERMS,
} from "@/lib/invoice";
import { BRAND_LOGO_SRC, downloadInvoicePdf } from "@/lib/downloadInvoicePdf";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateOnly(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Tax invoice viewer aligned to the Virastra invoice format + GST REG-06 seller details.
 * @param {{ invoice: object | null, open: boolean, onClose: () => void, emailNotice?: boolean }} props
 */
export default function InvoiceModal({ invoice, open, onClose, emailNotice = false }) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const seller = invoice?.seller || INVOICE_SELLER;
  const customer = invoice?.customer;
  const amounts = invoice?.amounts;
  const particulars = invoice
    ? [
        ["Receipt No.", invoice.meta?.razorpayPaymentId || invoice.paymentId || invoice.id || "—"],
        ["Customer Name", customer?.name || "—"],
        ["Customer Number", customer?.phone || customer?.email || "—"],
        ["Customer Email", customer?.email || "—"],
        ["Order Number", invoice.orderId || invoice.paymentId || "—"],
        ["Line of Business", INVOICE_LINE_OF_BUSINESS],
        ["Payment Type", "Bill Payment | Subscription"],
        ["Payment Date & Time", formatDate(invoice.issuedAt)],
        ["HSN / SAC", invoice.lineItems?.[0]?.hsnSac || "998599"],
        ["Place of Supply", seller?.placeOfSupply || INVOICE_SELLER.placeOfSupply],
        ["Taxable Value", formatInr(amounts?.taxable)],
        [`CGST @ ${amounts?.cgstRate ?? 9}%`, formatInr(amounts?.cgst)],
        [`SGST @ ${amounts?.sgstRate ?? 9}%`, formatInr(amounts?.sgst)],
        ["Paid Amount", formatInr(amounts?.total)],
      ]
    : [];

  const onDownloadPdf = async () => {
    if (!invoice || downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && invoice ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-title"
            className="invoice-print-root flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-[#f7f4ef] text-[#1a1a1a] shadow-2xl sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="no-print flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a1a1a]">Invoice</p>
                {emailNotice && invoice.email?.status === "sent" ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700">
                    <Mail size={12} /> Sent to {customer?.email}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2A4A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#081e36] disabled:opacity-60"
                >
                  <Download size={14} /> {downloading ? "Preparing…" : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/[0.03]"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-black/50 hover:bg-black/5 hover:text-black"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
              {emailNotice ? (
                <div className="no-print mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Payment received — invoice issued</p>
                    <p className="mt-0.5 text-xs text-emerald-800/80">
                      A copy of this tax invoice has been emailed to <strong>{customer?.email}</strong>.
                      You can download the PDF anytime from Billing.
                    </p>
                  </div>
                </div>
              ) : null}

              <header className="border-b border-black/10 pb-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <img
                    src={BRAND_LOGO_SRC}
                    alt="VIRASTRA by New India Export"
                    className="h-16 w-auto max-w-[120px] object-contain object-left sm:h-20"
                  />
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0B2A4A]">
                      {seller?.tradeName || INVOICE_SELLER.tradeName}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-black/45">
                      Export | Import | Trade Solutions
                    </p>
                  </div>
                </div>

                <div className="relative mx-auto mt-5 flex h-9 w-44 items-center justify-center bg-[#0B2A4A]">
                  <span className="absolute -left-3 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[18px] border-r-[12px] border-y-transparent border-r-[#C9A227]" />
                  <span className="absolute -right-3 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[18px] border-l-[12px] border-y-transparent border-l-[#C9A227]" />
                  <h2 id="invoice-title" className="text-sm font-bold tracking-[0.2em] text-white">
                    INVOICE
                  </h2>
                </div>

                <div className="mt-5 flex flex-wrap items-start justify-between gap-4 text-xs text-black/65">
                  <div className="space-y-1">
                    <p>
                      Invoice No.{" "}
                      <span className="font-semibold text-black">{invoice.invoiceNumber}</span>
                    </p>
                    <p>Invoice Date: {formatDateOnly(invoice.issuedAt)}</p>
                    <p>Due Date: {formatDateOnly(invoice.issuedAt)}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">Bill To</p>
                    <p className="mt-1 text-sm font-semibold text-black">
                      {customer?.name}
                      {customer?.phone ? ` (${customer.phone})` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-xs leading-relaxed text-black/60">
                  <p className="font-medium text-black">
                    {seller?.legalName || INVOICE_SELLER.legalName} · GSTIN{" "}
                    <span className="tracking-wide">{seller?.gstin || INVOICE_SELLER.gstin}</span>
                  </p>
                  <p className="mt-1 max-w-xl">{getSellerAddressBlock()}</p>
                </div>
              </header>

              <table className="mt-5 w-full border-collapse overflow-hidden rounded-md border border-[#d0d7de] text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white">
                    <th className="px-3 py-2.5 font-medium">Particulars</th>
                    <th className="px-3 py-2.5 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {particulars.map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? "bg-[#EAF2F8]" : "bg-white"}>
                      <td className="px-3 py-2.5 font-medium text-[#0B2A4A]">{label}</td>
                      <td className="px-3 py-2.5 tabular-nums text-black/80">{value}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#E8D5B5]">
                    <td className="px-3 py-3 font-semibold text-[#0B2A4A]">Total Paid Amount</td>
                    <td className="px-3 py-3 text-sm font-semibold tabular-nums text-black">
                      {formatInr(amounts?.total)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-5 flex items-start gap-2 text-sm text-emerald-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Payment Successful</p>
                  <p className="text-xs text-emerald-800/80">{INVOICE_PAYMENT_SUCCESS_MESSAGE}</p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-[#0B2A4A]/60 px-3 py-3">
                <p className="text-sm font-semibold text-[#0B2A4A]">Virastra Subscription / Service</p>
                <p className="mt-1 text-xs text-black/60">Reference: {INVOICE_SERVICE_REFERENCE}</p>
              </div>

              <div className="mt-5 overflow-hidden rounded-md border border-[#0B2A4A]/20">
                <div className="bg-[#0B2A4A] px-3 py-2 text-xs font-semibold text-white">
                  Terms and Conditions
                </div>
                <ol className="list-decimal space-y-1.5 px-5 py-3 text-[11px] leading-relaxed text-black/55">
                  {INVOICE_TERMS.map((term) => (
                    <li key={term}>{term}</li>
                  ))}
                </ol>
              </div>

              <p className="mt-6 text-[10px] leading-relaxed text-black/40">
                This is a computer-generated tax invoice. Use Download PDF to save a copy on your
                device.
              </p>
            </div>
          </motion.div>

          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .invoice-print-root, .invoice-print-root * { visibility: visible !important; }
              .invoice-print-root {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: none !important;
                max-height: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                background: white !important;
              }
              .no-print { display: none !important; }
            }
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
