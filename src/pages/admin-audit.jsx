import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard, Search, Filter, CalendarRange,
} from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import { api } from "@/lib/api";
import { PATHS, adminWorkflowPath } from "@/lib/routes";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";
import FallbackScreen from "@/components/FallbackScreen";

const PERIODS = [
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "created", label: "Created" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

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

function statusChip(status) {
  if (status === "paid") return "bg-emerald-400/10 text-emerald-200";
  if (status === "failed") return "bg-rose-400/10 text-rose-200";
  if (status === "refunded") return "bg-amber-400/10 text-amber-200";
  return "bg-white/10 text-white/65";
}

export default function AdminAuditPage() {
  const session = getSession();
  const [period, setPeriod] = useState("month");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ count: 0, paidCount: 0, paidTotal: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [active, setActive] = useState(null);

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
          setItems(res?.items || res?.data || []);
          setSummary(res?.summary || { count: 0, paidCount: 0, paidTotal: 0 });
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setSummary({ count: 0, paidCount: 0, paidTotal: 0 });
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
    return `${summary.count} payment${summary.count === 1 ? "" : "s"} · ${formatInr(summary.paidTotal)} paid`;
  }, [busy, summary]);

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
        {items.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            whileHover={{ y: -1 }}
            onClick={() => setActive(item)}
            className="glass-card w-full p-4 text-left transition hover:border-white/20"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusChip(item.status)}`}>
                    {item.status || "unknown"}
                  </span>
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
              <time className="shrink-0 text-[11px] text-white/40">{formatWhen(item.at)}</time>
            </div>
          </motion.button>
        ))}
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
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusChip(active.status)}`}>
                  {active.status}
                </span>
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
              {active.invoiceId && (
                <a
                  href={`/api/invoices/${encodeURIComponent(active.invoiceId)}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost inline-flex rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  Invoice PDF
                </a>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
