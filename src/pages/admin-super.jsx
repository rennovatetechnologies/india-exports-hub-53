import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Users, IndianRupee, Workflow, Activity, CheckCircle2, XCircle, Clock,
  Search, Filter, ArrowUpRight, Crown, Settings2, BarChart3, AlertTriangle, Mail, Pencil,
} from "lucide-react";
import { getAdminRequests, updateAdminRequest, ADMIN_STATUS, ROLES } from "@/lib/authSession";

const STATS = [
  { label: "MRR", value: "₹1.42 Cr", delta: "+9.4% MoM", icon: IndianRupee, tone: "text-[var(--gold)]" },
  { label: "Active customers", value: "1,284", delta: "+184 this month", icon: Users, tone: "text-cyan-300" },
  { label: "Workflows live", value: "327", delta: "94% on SLA", icon: Workflow, tone: "text-emerald-300" },
  { label: "Risk events", value: "6", delta: "−3 vs last week", icon: AlertTriangle, tone: "text-amber-300" },
];

const AUDIT = [
  { who: "Riya M.", what: "Approved KYC for Verma Agro Exports", when: "12 min ago", tone: "emerald" },
  { who: "Karan S.", what: "Rejected GST certificate · Coastal Organics", when: "44 min ago", tone: "rose" },
  { who: "System", what: "Pricing template v3.2 published", when: "2 h ago", tone: "cyan" },
  { who: "Aman P.", what: "Closed case VST-2031 (Iyer Foods)", when: "5 h ago", tone: "emerald" },
];

const PERMISSION_PRESET = ["Cases · read/write", "KYC · approve", "Pricing · view", "Audit log · read"];

const statusChip = (s) => {
  if (s === ADMIN_STATUS.PENDING) return "bg-amber-400/10 text-amber-300";
  if (s === ADMIN_STATUS.APPROVED || s === ADMIN_STATUS.ACTIVE) return "bg-emerald-400/10 text-emerald-300";
  if (s === ADMIN_STATUS.REJECTED) return "bg-rose-400/10 text-rose-300";
  if (s === ADMIN_STATUS.SUSPENDED) return "bg-white/10 text-white/60";
  return "bg-white/10 text-white/60";
};

export default function SuperAdminPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  /** `view` = read-only summary; `edit` = adjust preset & approve / reject / suspend. */
  const [drawerMode, setDrawerMode] = useState("view");

  useEffect(() => {
    setRequests(getAdminRequests());
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

  const closeDrawer = () => {
    setActive(null);
    setDrawerMode("view");
  };

  const setStatus = (id, status) => {
    const list = updateAdminRequest(id, { status });
    setRequests(list);
    setActive((a) => (a && a.id === id ? { ...a, status } : a));
    setDrawerMode("view");
  };

  const pendingCount = requests.filter((r) => r.status === ADMIN_STATUS.PENDING).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
            <Crown size={11} className="text-[var(--gold)]" /> Admin
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Executive control center</h1>
          <p className="mt-1 text-sm text-white/55">Revenue, RBAC and platform health at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/75 hover:bg-white/[0.06]">
            <Settings2 size={13} /> Pricing templates
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-[var(--grad-gold)] px-4 py-2 text-xs font-semibold text-black hover:opacity-90">
            <BarChart3 size={13} /> Open analytics
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, delta, icon: Icon, tone }) => (
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

      {/* Approval Center */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Admin approval queue</h3>
              <p className="mt-1 text-xs text-white/45">
                <span className="text-amber-300">{pendingCount}</span> requests awaiting review
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
                <motion.button
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setActive(r);
                    setDrawerMode("view");
                  }}
                  className="text-left rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 hover:bg-white/[0.04] transition"
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
                </motion.button>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/45">
                No requests match your filters.
              </p>
            )}
          </div>
        </div>

        {/* Audit / activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Audit log</h3>
            <Activity size={14} className="text-white/40" />
          </div>
          <ul className="mt-4 space-y-4">
            {AUDIT.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full bg-${a.tone}-300`} />
                <div>
                  <div className="text-sm text-white">{a.what}</div>
                  <div className="text-[11px] text-white/45">{a.who} · {a.when}</div>
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-5 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white">
            Open full audit trail <ArrowUpRight size={12} />
          </button>
        </div>
      </section>

      {/* RBAC + content quick links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Pricing", desc: "Plans, addons, seasonal offers", icon: IndianRupee },
          { title: "Workflow templates", desc: "DGFT · ICEGATE · AD code", icon: Workflow },
          { title: "Events & summits", desc: "Webinars, AI export forums", icon: ShieldCheck },
          { title: "Permissions", desc: "RBAC matrix &amp; SSO", icon: Filter },
        ].map(({ title, desc, icon: Icon }) => (
          <div key={title} className="glass-card p-5">
            <Icon size={18} className="text-[var(--gold)]" />
            <div className="mt-3 text-sm font-semibold">{title}</div>
            <div className="mt-1 text-[11px] text-white/50">{desc}</div>
            <button className="mt-3 inline-flex items-center gap-1 text-[11px] text-white/65 hover:text-white">
              Manage <ArrowUpRight size={11} />
            </button>
          </div>
        ))}
      </section>

      {/* Approval drawer */}
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

              {drawerMode === "edit" && (
                <p className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-[11px] text-cyan-100/90">
                  Edit mode: adjust the permission preset mock below, then approve, reject, or suspend. This demo does not persist checkbox changes.
                </p>
              )}

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
                  <span>This request cannot be approved until the applicant verifies their work email (one-time code at registration).</span>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[11px] uppercase tracking-wider text-white/45">Reason for access</div>
                <p className="mt-1 text-sm text-white/80">{active.reason || "—"}</p>
              </div>

              <div className="mt-5">
                <div className="text-[11px] uppercase tracking-wider text-white/45">Permission preset</div>
                {drawerMode === "view" ? (
                  <ul className="mt-2 space-y-2">
                    {PERMISSION_PRESET.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/75"
                      >
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-300/90" /> {p}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 grid gap-2">
                    {PERMISSION_PRESET.map((p) => (
                      <label key={p} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/75">
                        <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded border-white/20 bg-white/5" />
                        {p}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {drawerMode === "view" ? (
                <div className="mt-auto pt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 hover:bg-white/[0.07]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerMode("edit")}
                    className="btn-gold inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-auto pt-6 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus(active.id, ADMIN_STATUS.REJECTED)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-300/5 px-4 py-2.5 text-sm text-rose-200 hover:bg-rose-300/10"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(active.id, ADMIN_STATUS.APPROVED)}
                      disabled={active.status === ADMIN_STATUS.PENDING && active.emailVerified === false}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatus(active.id, ADMIN_STATUS.SUSPENDED)}
                    className="mt-2 text-xs text-white/45 hover:text-white"
                  >
                    Suspend access
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerMode("view")}
                    className="mt-3 w-full rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/[0.04] hover:text-white"
                  >
                    Back to summary
                  </button>
                </>
              )}
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