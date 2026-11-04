import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard, Search, Filter, CalendarRange, Download, Loader2,
} from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import { api } from "@/lib/api";
import { PATHS, adminWorkflowPath } from "@/lib/routes";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";
import { downloadPaymentInvoicePdf } from "@/lib/invoice";
import FallbackScreen from "@/components/FallbackScreen";

const PERIODS = [
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Success" },
  { value: "created", label: "Created" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_META = {
  paid: {
    label: "Success",
    chip: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40",
    bar: "bg-emerald-400",
  },
  created: {
    label: "Created",
    chip: "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/40",
    bar: "bg-sky-400",
  },
  failed: {
    label: "Failed",
    chip: "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40",
    bar: "bg-rose-400",
  },
  refunded: {
    label: "Refunded",
    chip: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40",
    bar: "bg-amber-400",
  },
};

function formatWhen(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInr(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

function statusMeta(status) {
  return STATUS_META[status] || {
    label: status ? String(status) : "Unknown",
    chip: "bg-white/10 text-white/70 ring-1 ring-white/15",
    bar: "bg-white/30",
  };
}

function StatusBadge({ status, size = "sm" }) {
  const meta = statusMeta(status);
  const pad = size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wider ${pad} ${meta.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.bar}`} aria-hidden />
      {meta.label}
    </span>
  );
}

export default function AdminAuditPage() {
  const session = getSession();
  const [period, setPeriod] = useState("month");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    paidCount: 0,
    paidTotal: 0,
    byStatus: { paid: 0, created: 0, failed: 0, refunded: 0 },
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [active, setActive] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (session?.role !== ROLES.ADMIN) return undefined;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError("");
      try {
        const params = new URLSearchParams({
          period,
          status,
          limit: "100",
        });
        if (debouncedQ) params.set("q", debouncedQ);
        const res = await api(`/api/admin/payments?${params.toString()}`);
        if (!cancelled) {
          const nextItems = res?.items || res?.data || [];
          setItems(nextItems);
          const byStatus = res?.summary?.byStatus || {
            paid: nextItems.filter((i) => i.status === "paid").length,
            created: nextItems.filter((i) => i.status === "created").length,
            failed: nextItems.filter((i) => i.status === "failed").length,
            refunded: nextItems.filter((i) => i.status === "refunded").length,
          };
          setSummary({
            count: res?.summary?.count ?? nextItems.length,
            paidCount: res?.summary?.paidCount ?? byStatus.paid,
            paidTotal: res?.summary?.paidTotal ?? 0,
            byStatus,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setSummary({
            count: 0,
            paidCount: 0,
            paidTotal: 0,
            byStatus: { paid: 0, created: 0, failed: 0, refunded: 0 },
          });
          setError(toUserMessage(e, USER_MESSAGES.load));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.role, period, status, debouncedQ, reload]);

  const headline = useMemo(() => {
    if (busy) return "Loading…";
    return `${summary.count} payment${summary.count === 1 ? "" : "s"} · ${formatInr(summary.paidTotal)} success`;
  }, [busy, summary]);

  const statusBreakdown = useMemo(() => {
    const by = summary.byStatus || {};
    return [
      { key: "paid", count: by.paid || 0 },
      { key: "created", count: by.created || 0 },
      { key: "failed", count: by.failed || 0 },
      { key: "refunded", count: by.refunded || 0 },
    ];
  }, [summary.byStatus]);

  if (session?.role !== ROLES.ADMIN) {
    return <Navigate to={PATHS.admin} replace />;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
            <CreditCard size={11} className="text-[var(--gold)]" /> Payments
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Payment ledger</h1>
          <p className="mt-1 text-sm text-white/55">
            Track orders and captures. Filter by last week, last month, or all time.
          </p>
        </div>
        <Link
          to={PATHS.dashboardBilling}
          className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <CreditCard size={15} /> Plans
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map(({ value, label }) => {
          const on = period === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                on
                  ? "bg-[var(--gold)]/15 text-[var(--gold)] ring-1 ring-[var(--gold)]/40"
                  : "border border-white/10 text-white/55 hover:text-white"
              }`}
            >
              <CalendarRange size={13} /> {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <Search size={14} className="text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, payment id, purpose…"
            className="w-56 bg-transparent text-sm text-white placeholder:text-white/30 outline-none sm:w-72"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/70 outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
          <Filter size={12} />
          {headline}
        </div>
      </div>

      {!busy && !error && (
        <div className="flex flex-wrap gap-2">
          {statusBreakdown.map(({ key, count }) => {
            const meta = statusMeta(key);
            const on = status === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(on ? "all" : key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  on
                    ? `${meta.chip}`
                    : "border border-white/10 text-white/60 hover:text-white"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${meta.bar}`} aria-hidden />
                {meta.label}
                <span className="tabular-nums text-white/45">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <FallbackScreen
          kind="unavailable"
          compact
          message={error}
          onRetry={() => setReload((n) => n + 1)}
        />
      )}

      <div className="grid gap-3">
        {!busy && !error && items.length === 0 && (
          <div className="glass-card p-8 text-center text-sm text-white/45">
            No payments for this filter.
          </div>
        )}
        {items.map((item) => {
          const meta = statusMeta(item.status);
          return (
            <motion.button
              key={item.id}
              type="button"
              whileHover={{ y: -1 }}
              onClick={() => {
                setInvoiceError("");
                setActive(item);
              }}
              className="glass-card relative w-full overflow-hidden p-4 text-left transition hover:border-white/20"
            >
              <span
                className={`absolute inset-y-0 left-0 w-1 ${meta.bar}`}
                aria-hidden
              />
              <div className="flex flex-wrap items-start justify-between gap-2 pl-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-sm font-semibold text-white">
                      {formatInr(item.amounts?.total)}
                    </span>
                    {item.purpose && (
                      <span className="text-[11px] uppercase tracking-wider text-white/40">
                        {item.purpose}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {[item.customerEmail, item.description || item.sku, item.id]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] font-medium text-white/55">
                    {statusMeta(item.status).label}
                  </div>
                  <time className="mt-0.5 block text-[11px] text-white/40">
                    {formatWhen(item.at)}
                  </time>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {active && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setActive(null)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0a0d14] p-6 overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusBadge status={active.status} size="md" />
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {formatInr(active.amounts?.total)}
                </h3>
                <p className="mt-1 text-xs text-white/50">{active.customerEmail}</p>
              </div>
              <button type="button" onClick={() => setActive(null)} className="rounded-md p-1 text-white/45 hover:text-white">✕</button>
            </div>
            <p className="mt-3 text-[11px] text-white/40">{formatWhen(active.at)}</p>

            <dl className="mt-5 space-y-3 text-sm">
              {[
                ["Status", statusMeta(active.status).label],
                ["Payment ID", active.id],
                ["Purpose", active.purpose],
                ["SKU", active.sku],
                ["Description", active.description],
                ["Invoice", active.invoiceId],
                ["Case", active.caseId],
                ["Razorpay order", active.razorpayOrderId],
                ["Razorpay payment", active.razorpayPaymentId],
                ["Taxable", active.amounts?.taxable != null ? formatInr(active.amounts.taxable) : null],
                ["GST", active.amounts?.gst != null ? formatInr(active.amounts.gst) : null],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 border-b border-white/5 pb-2">
                    <dt className="text-white/45">{label}</dt>
                    <dd className="text-right text-white/80 break-all">{value}</dd>
                  </div>
                ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              {active.caseId && (
                <Link
                  to={adminWorkflowPath(active.caseId)}
                  className="btn-gold inline-flex rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  Open case
                </Link>
              )}
              {(active.invoiceId || active.status === "paid") && (
                <button
                  type="button"
                  disabled={downloadingInvoice}
                  onClick={async () => {
                    setInvoiceError("");
                    setDownloadingInvoice(true);
                    try {
                      await downloadPaymentInvoicePdf({
                        invoiceId: active.invoiceId,
                        paymentId: active.id,
                      });
                    } catch (e) {
                      setInvoiceError(toUserMessage(e, USER_MESSAGES.download));
                    } finally {
                      setDownloadingInvoice(false);
                    }
                  }}
                  className="btn-ghost inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {downloadingInvoice ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  {downloadingInvoice ? "Preparing PDF…" : "Invoice PDF"}
                </button>
              )}
            </div>
            {invoiceError ? <p className="mt-3 text-xs text-rose-300">{invoiceError}</p> : null}
          </aside>
        </>
      )}
    </div>
  );
}
