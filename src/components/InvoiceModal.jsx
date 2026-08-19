import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Mail, CheckCircle2, Download } from "lucide-react";
import { formatInr } from "@/lib/planCatalog";
import { getSellerAddressBlock } from "@/lib/invoice";
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

/**
 * Tax invoice viewer with client-side PDF download (no remote storage).
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

  const seller = invoice?.seller;
  const customer = invoice?.customer;
  const amounts = invoice?.amounts;

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
                <p className="truncate text-sm font-semibold text-[#1a1a1a]">Tax Invoice</p>
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-white hover:bg-black disabled:opacity-60"
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

              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/45">Tax Invoice</p>
                  <img
                    src={BRAND_LOGO_SRC}
                    alt="VIRASTRA by New India Export"
                    className="mt-2 h-14 w-auto max-w-[220px] object-contain object-left sm:h-16"
                  />
                  <h2 id="invoice-title" className="mt-3 text-base font-semibold tracking-tight sm:text-lg">
                    {seller?.legalName || "New India Export"}
                  </h2>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-black/65">
                    {getSellerAddressBlock()}
                  </p>
                  <p className="mt-2 text-xs font-medium">
                    GSTIN: <span className="tracking-wide">{seller?.gstin}</span>
                  </p>
                </div>
                <div className="text-right text-xs text-black/65">
                  <p>
                    Invoice No.{" "}
                    <span className="font-semibold text-black">{invoice.invoiceNumber}</span>
                  </p>
                  <p className="mt-1">Date: {formatDate(invoice.issuedAt)}</p>
                  {invoice.paymentId ? (
                    <p className="mt-1 break-all">Payment ID: {invoice.paymentId}</p>
                  ) : null}
                  <p className="mt-1">Place of supply: {seller?.placeOfSupply || "Maharashtra"}</p>
                </div>
              </header>

              <section className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">Bill to</p>
                  <p className="mt-1 text-sm font-semibold">{customer?.name}</p>
                  {customer?.company ? <p className="text-xs text-black/60">{customer.company}</p> : null}
                  <p className="mt-1 text-xs text-black/60">{customer?.email}</p>
                  {customer?.phone ? <p className="text-xs text-black/60">{customer.phone}</p> : null}
                  {customer?.address ? (
                    <p className="mt-1 text-xs leading-relaxed text-black/60">{customer.address}</p>
                  ) : null}
                  {customer?.gstin ? (
                    <p className="mt-1 text-xs font-medium">GSTIN: {customer.gstin}</p>
                  ) : null}
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">Status</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-emerald-800">{invoice.status}</p>
                  {invoice.sku ? <p className="mt-1 text-xs text-black/50">SKU: {invoice.sku}</p> : null}
                </div>
              </section>

              <table className="mt-6 w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-y border-black/15 bg-black/[0.03]">
                    <th className="px-2 py-2.5 font-medium">Description</th>
                    <th className="px-2 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-2 py-2.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.lineItems || []).map((li, i) => (
                    <tr key={i} className="border-b border-black/8">
                      <td className="px-2 py-2.5">{li.description}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{li.quantity}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {formatInr(li.unitAmount * (li.quantity || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-5 ml-auto w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-black/70">
                  <span>Taxable value</span>
                  <span className="tabular-nums font-medium text-black">{formatInr(amounts?.taxable)}</span>
                </div>
                <div className="flex justify-between text-black/70">
                  <span>CGST @ {amounts?.cgstRate ?? 9}%</span>
                  <span className="tabular-nums">{formatInr(amounts?.cgst)}</span>
                </div>
                <div className="flex justify-between text-black/70">
                  <span>SGST @ {amounts?.sgstRate ?? 9}%</span>
                  <span className="tabular-nums">{formatInr(amounts?.sgst)}</span>
                </div>
                <div className="flex justify-between border-t border-black/15 pt-2 text-base font-semibold">
                  <span>Grand total</span>
                  <span className="tabular-nums">{formatInr(amounts?.total)}</span>
                </div>
                <p className="text-[10px] text-black/40">
                  GST {(Number(amounts?.gstRate || 0) * 100).toFixed(0)}% included · CGST + SGST ={" "}
                  {formatInr(amounts?.gst)}
                </p>
              </div>

              <p className="mt-8 text-[10px] leading-relaxed text-black/40">
                This is a computer-generated tax invoice. Use Download PDF to save a copy on your device.
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
