import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, IndianRupee, Workflow, Activity, CheckCircle2, XCircle, Clock,
  Search, Crown, Mail,
} from "lucide-react";
import {
  fetchAdminRequests,
  updateAdminRequest,
  getSession,
  ADMIN_STATUS,
  ROLES,
} from "@/lib/authSession";
import { api } from "@/lib/api";
import { USER_MESSAGES } from "@/lib/friendlyError";

function formatInrCompact(n) {
  const v = Number(n) || 0;
  if (v >= 1e7) return `₹${(v / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

function formatCount(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

function formatMomDelta(pct) {
  const v = Number(pct) || 0;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v}% MoM`;
}

function formatSignedCount(n, suffix) {
  const v = Number(n) || 0;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toLocaleString("en-IN")} ${suffix}`;
}

const statusChip = (s) => {
  if (s === ADMIN_STATUS.PENDING) return "bg-amber-400/10 text-amber-300";
  if (s === ADMIN_STATUS.APPROVED || s === ADMIN_STATUS.ACTIVE) return "bg-emerald-400/10 text-emerald-300";
  if (s === ADMIN_STATUS.REJECTED) return "bg-rose-400/10 text-rose-300";
  if (s === ADMIN_STATUS.SUSPENDED) return "bg-white/10 text-white/60";
  return "bg-white/10 text-white/60";
};

export default function SuperAdminPage() {
  const session = getSession();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState(ADMIN_STATUS.PENDING);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchAdminRequests();
      if (!cancelled) setRequests(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/admin/analytics/overview");
        const data = res?.data || res || {};
        if (!cancelled) {
          setStats({
            revenue: Number(data.revenue ?? data.mrr ?? 0),
            activeCustomers: Number(data.activeCustomers ?? 0),
            workflowsLive: Number(data.workflowsLive ?? 0),
            deltas: data.deltas || {},
          });
          setStatsError("");
        }
      } catch (err) {
        if (!cancelled) {
          setStats(null);
          setStatsError(USER_MESSAGES.load);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const qLower = query.trim().toLowerCase();
    const hay = (r) =>
      [r.name, r.email, r.department, r.phone, r.employeeId, r.reason, r.id, r.role, r.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return requests.filter((r) => {
      if (filter !== "all") {
        if (filter === ADMIN_STATUS.APPROVED) {
          if (r.status !== ADMIN_STATUS.APPROVED && r.status !== ADMIN_STATUS.ACTIVE) return false;
        } else if (r.status !== filter) return false;
      }
      if (qLower && !hay(r).includes(qLower)) return false;
      return true;
    });
  }, [requests, filter, query]);

  const kpiCards = useMemo(() => {
    if (!stats) {
      return [
        { label: "Revenue", value: "—", delta: statsError ? "Unavailable" : "Loading…", icon: IndianRupee, tone: "text-[var(--gold)]" },
        { label: "Active customers", value: "—", delta: statsError ? "Unavailable" : "Loading…", icon: Users, tone: "text-cyan-300" },
        { label: "Workflows live", value: "—", delta: statsError ? "Unavailable" : "Loading…", icon: Workflow, tone: "text-emerald-300" },
      ];
    }
    return [
      {
        label: "Revenue",
        value: formatInrCompact(stats.revenue),
        delta: formatMomDelta(stats.deltas?.mrr),
        icon: IndianRupee,
        tone: "text-[var(--gold)]",
      },
      {
        label: "Active customers",
        value: formatCount(stats.activeCustomers),
        delta: formatSignedCount(stats.deltas?.activeCustomers, "this month"),
        icon: Users,
        tone: "text-cyan-300",
      },
      {
        label: "Workflows live",
        value: formatCount(stats.workflowsLive),
        delta: formatSignedCount(stats.deltas?.workflowsLive, "this week"),
        icon: Workflow,
        tone: "text-emerald-300",
      },
    ];
  }, [stats, statsError]);

  // Only platform admins review staff access requests.
  if (session?.role !== ROLES.ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  const closeDrawer = () => setActive(null);

  const setStatus = async (id, status) => {
    setBusyId(id);
    setActionMsg("");
    // Always persist locally so approve/reject works without the backend.
    const list = updateAdminRequest(id, { status });
    setRequests(list);
    setActive((a) => (a && a.id === id ? { ...a, status } : a));
    try {
      await api(`/api/staff/access-requests/${id}`, { method: "PATCH", body: { status } });
      const remote = await fetchAdminRequests();
      setRequests(remote);
      setActive((a) => {
        if (!a || a.id !== id) return a;
        return remote.find((r) => r.id === id) || { ...a, status };
      });
    } catch {
      /* local store already updated */
    }
    setBusyId(null);
    setActionMsg(status === ADMIN_STATUS.APPROVED ? "Request approved." : status === ADMIN_STATUS.REJECTED ? "Request rejected." : `Marked as ${status}.`);
    if (status === ADMIN_STATUS.APPROVED || status === ADMIN_STATUS.REJECTED) {
      window.setTimeout(() => setActive(null), 600);
    }
  };

  const pendingCount = requests.filter((r) => r.status === ADMIN_STATUS.PENDING).length;
  const canApprove = (r) => r.status === ADMIN_STATUS.PENDING && r.emailVerified !== false;
  const canReject = (r) =>
    r.status === ADMIN_STATUS.PENDING ||
    r.status === ADMIN_STATUS.APPROVED ||
    r.status === ADMIN_STATUS.ACTIVE;

  return (
    <div className="space-y-8">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
          <Crown size={11} className="text-[var(--gold)]" /> Admin
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Staff access requests</h1>
        <p className="mt-1 text-sm text-white/55">
          Review operations and admin access requests — approve or reject each one.
        </p>
        {statsError ? (
          <p className="mt-3 text-xs text-white/45">Overview figures are unavailable right now. You can still review requests below.</p>
        ) : null}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map(({ label, value, delta, icon: Icon, tone }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/45">{label}</span>
              <Icon size={16} className={tone} />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-[11px] text-white/50">{delta}</div>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Approval queue</h3>
              <p className="mt-1 text-xs text-white/45">
                <span className="text-amber-300">{pendingCount}</span> awaiting review
                {actionMsg && <span className="ml-2 text-emerald-300">· {actionMsg}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
                <Search size={13} className="text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-32 bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-white outline-none"
              >
                <option value="all">All</option>
                <option value={ADMIN_STATUS.PENDING}>Pending</option>
                <option value={ADMIN_STATUS.APPROVED}>Approved</option>
                <option value={ADMIN_STATUS.REJECTED}>Rejected</option>
                <option value={ADMIN_STATUS.SUSPENDED}>Suspended</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <AnimatePresence initial={false}>
              {filtered.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 hover:bg-white/[0.04] transition"
                >
                  <button
                    type="button"
                    onClick={() => setActive(r)}
                    className="w-full text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--grad-gold)] text-black text-xs font-bold">
                          {r.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-white">{r.name}</div>
                          <div className="text-[11px] text-white/50">{r.email} · {r.department}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/65 capitalize">
                          {r.role === ROLES.ADMIN ? "Admin" : "Operations"}
                        </span>
                        {r.status === ADMIN_STATUS.PENDING && r.emailVerified === false && (
                          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-300">Email unverified</span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 ${statusChip(r.status)}`}>{r.status}</span>
                        <span className="text-white/40">{r.id}</span>
                      </div>
                    </div>
                  </button>

                  {r.status === ADMIN_STATUS.PENDING && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                      <button
                        type="button"
                        disabled={busyId === r.id || !canApprove(r)}
                        title={!canApprove(r) ? "Applicant must verify their work email first" : "Approve access"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatus(r.id, ADMIN_STATUS.APPROVED);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-300 to-cyan-300 px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatus(r.id, ADMIN_STATUS.REJECTED);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/30 bg-rose-300/5 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-300/10 disabled:opacity-40"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setActive(r)}
                        className="ml-auto text-[11px] text-white/45 hover:text-white"
                      >
                        View details
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
                No requests match your filters.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">How it works</h3>
            <Activity size={14} className="text-white/40" />
          </div>
          <ul className="mt-4 space-y-4 text-sm text-white/70">
            <li>Open a pending request to review department, role, and reason.</li>
            <li>Approve grants workspace access for that role on next staff sign-in.</li>
            <li>Reject blocks sign-in until they submit a new request.</li>
          </ul>
          <p className="mt-5 text-[11px] text-white/40">
            Changes save locally when the API is offline, so demo approve/reject still works.
          </p>
        </div>
      </section>

      <AnimatePresence>
        {active && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeDrawer}
            />
            <motion.aside
              initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#0a0d14] border-l border-white/10 p-6 overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
                    {active.id} · {active.role === ROLES.ADMIN ? "Admin" : "Operations"}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-white">{active.name}</h3>
                  <p className="text-xs text-white/55">{active.email} · {active.phone}</p>
                </div>
                <button type="button" onClick={closeDrawer} className="rounded-md p-1 text-white/45 hover:text-white">✕</button>
              </div>

              <span className={`mt-4 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${statusChip(active.status)}`}>
                <Clock size={11} /> {active.status}
              </span>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <Info label="Department" value={active.department} />
                <Info label="Employee ID" value={active.employeeId || "—"} />
                <Info label="Submitted" value={new Date(active.createdAt).toLocaleString()} />
                <Info label="Requested role" value={active.role === ROLES.ADMIN ? "Admin" : "Operations"} />
                <Info
                  label="Work email verified"
                  value={active.emailVerified === false ? "No" : "Yes"}
                />
              </dl>

              {active.status === ADMIN_STATUS.PENDING && active.emailVerified === false && (
                <div className="mt-4 flex gap-2 rounded-xl border border-amber-400/25 bg-amber-400/5 p-3 text-xs text-amber-200">
                  <Mail size={14} className="mt-0.5 shrink-0 opacity-80" />
                  <span>Approve is blocked until they verify work email. You can still reject.</span>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[11px] uppercase tracking-wider text-white/45">Reason for access</div>
                <p className="mt-1 text-sm text-white/80">{active.reason || "—"}</p>
              </div>

              <div className="mt-auto pt-6 space-y-2">
                {active.status === ADMIN_STATUS.PENDING && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busyId === active.id}
                      onClick={() => setStatus(active.id, ADMIN_STATUS.REJECTED)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-300/5 px-4 py-2.5 text-sm text-rose-200 hover:bg-rose-300/10 disabled:opacity-40"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      type="button"
                      disabled={busyId === active.id || !canApprove(active)}
                      onClick={() => setStatus(active.id, ADMIN_STATUS.APPROVED)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  </div>
                )}
                {(active.status === ADMIN_STATUS.APPROVED || active.status === ADMIN_STATUS.ACTIVE) && (
                  <button
                    type="button"
                    disabled={busyId === active.id}
                    onClick={() => setStatus(active.id, ADMIN_STATUS.SUSPENDED)}
                    className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                  >
                    Suspend access
                  </button>
                )}
                {(active.status === ADMIN_STATUS.REJECTED || active.status === ADMIN_STATUS.SUSPENDED) && (
                  <button
                    type="button"
                    disabled={busyId === active.id}
                    onClick={() => setStatus(active.id, ADMIN_STATUS.APPROVED)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} /> Approve now
                  </button>
                )}
                {canReject(active) && active.status !== ADMIN_STATUS.PENDING && active.status !== ADMIN_STATUS.REJECTED && (
                  <button
                    type="button"
                    disabled={busyId === active.id}
                    onClick={() => setStatus(active.id, ADMIN_STATUS.REJECTED)}
                    className="w-full text-xs text-rose-300/80 hover:text-rose-200 disabled:opacity-40"
                  >
                    Reject / revoke
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="w-full rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/[0.04] hover:text-white"
                >
                  Close
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-1 text-white">{value}</div>
    </div>
  );
}
