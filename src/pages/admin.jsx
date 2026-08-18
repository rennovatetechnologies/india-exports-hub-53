import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Briefcase, FileCheck2, CheckCircle2, ChevronRight } from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  listAllCases,
  journeyStatus,
  CASE_STATUS,
  currentStageLabel,
  fetchCasesQueue,
  fetchOpsRoster,
  assignCaseToMe,
  isAssignedTo,
} from "@/lib/customerCase";
import { getPlanById, fetchPlanCatalog } from "@/lib/planCatalog";
import { adminWorkflowPath } from "@/lib/routes";

const FILTER_IDS = new Set(["all", "mine", "unassigned", "pending_kyc", "kyc", "active", "completed", "closed"]);

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = getSession();
  const [tick, setTick] = useState(0);
  const filterFromUrl = searchParams.get("filter") || "all";
  const filter = FILTER_IDS.has(filterFromUrl) ? filterFromUrl : "all";
  const [q, setQ] = useState("");

  const [assigningId, setAssigningId] = useState(null);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    fetchPlanCatalog().catch(() => {});
    fetchCasesQueue({ force: true }).catch(() => {});
    fetchOpsRoster().catch(() => {});
    const h = () => setTick((t) => t + 1);
    window.addEventListener("iehub-case-updated", h);
    window.addEventListener("iehub-plans-updated", h);
    return () => {
      window.removeEventListener("iehub-case-updated", h);
      window.removeEventListener("iehub-plans-updated", h);
    };
  }, []);

  const setFilter = (id) => {
    if (id === "all") {
      searchParams.delete("filter");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ filter: id }, { replace: true });
    }
  };

  const isAdmin = session?.role === ROLES.ADMIN;
  const myEmail = session?.email;
  const cases = useMemo(() => {
    return listAllCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const claimCase = async (c, e) => {
    e.stopPropagation();
    if (!c?.customerEmail || assigningId) return;
    setAssignError("");
    setAssigningId(c.id || c.customerEmail);
    try {
      await assignCaseToMe(c.customerEmail);
    } catch (err) {
      setAssignError(err?.message || "Could not assign this case.");
    } finally {
      setAssigningId(null);
    }
  };

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const st = journeyStatus(c);
      if (filter === "mine" && !isAssignedTo(c, myEmail)) return false;
      if (filter === "unassigned" && c.opsEmail) return false;
      if (filter === "kyc" && st !== CASE_STATUS.KYC_PENDING && st !== CASE_STATUS.KYC_INCOMPLETE) return false;
      if (filter === "active" && st !== CASE_STATUS.ACTIVE) return false;
      if (filter === "completed" && st !== CASE_STATUS.COMPLETED) return false;
      if (filter === "closed" && st !== CASE_STATUS.CLOSED) return false;
      if (filter === "pending_kyc" && st !== CASE_STATUS.KYC_PENDING) return false;
      if (q.trim()) {
        const hay = `${c.customerEmail} ${c.id} ${c.opsName || ""} ${c.planId || ""}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [cases, filter, q, myEmail]);

  const mineCount = cases.filter((c) => isAssignedTo(c, myEmail)).length;
  const unassignedCount = cases.filter((c) => !c.opsEmail).length;

  const stats = [
    { id: "all", label: "All cases", value: String(cases.length), icon: Briefcase },
    {
      id: "pending_kyc",
      label: "KYC to review",
      value: String(cases.filter((c) => journeyStatus(c) === CASE_STATUS.KYC_PENDING).length),
      icon: FileCheck2,
    },
    {
      id: "active",
      label: "Active",
      value: String(cases.filter((c) => journeyStatus(c) === CASE_STATUS.ACTIVE).length),
      icon: Users,
    },
    {
      id: "completed",
      label: "Completed",
      value: String(cases.filter((c) => journeyStatus(c) === CASE_STATUS.COMPLETED).length),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
          {isAdmin ? "Admin · all cases" : "Operations · full queue"}
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Case queue</h1>
        <p className="mt-1 text-sm text-white/55">
          {isAdmin
            ? "Review KYC, advance documentation stages, upload deliverables, and assign operators."
            : "See every pending and closed case. Assign one to yourself to take ownership."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ id, label, value, icon: Icon }) => (
          <motion.button
            key={label}
            type="button"
            whileHover={{ y: -2 }}
            onClick={() => setFilter(id)}
            className={`glass-card p-5 text-left ${filter === id ? "ring-1 ring-[var(--gold)]/40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/45">{label}</span>
              <Icon size={16} className="text-[var(--gold)]" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </motion.button>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All" },
          { id: "mine", label: `Mine (${mineCount})` },
          { id: "unassigned", label: `Unassigned (${unassignedCount})` },
          { id: "pending_kyc", label: "KYC review" },
          { id: "kyc", label: "Needs KYC" },
          { id: "active", label: "Active" },
          { id: "completed", label: "Completed" },
          { id: "closed", label: "Closed" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-xl px-3 py-1.5 text-xs ${filter === f.id ? "bg-white/10 text-white" : "text-white/45 hover:bg-white/5"}`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email, case id…"
          className="ml-auto min-w-[180px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none sm:max-w-xs"
        />
      </div>

      {assignError ? <p className="text-sm text-rose-300">{assignError}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/45">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Ops</th>
              <th className="px-4 py-3" />
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const plan = getPlanById(c.paidPlanId || c.planId);
              const st = journeyStatus(c);
              const stageLabel = currentStageLabel(c);
              const mine = isAssignedTo(c, myEmail);
              const busy = assigningId === (c.id || c.customerEmail);
              return (
                <tr
                  key={c.customerEmail}
                  className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                  onClick={() => navigate(adminWorkflowPath(c.id || c.customerEmail))}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.customerEmail}</div>
                    <div className="text-[11px] text-white/40">{c.id}</div>
                  </td>
                  <td className="px-4 py-3 text-white/70">{plan?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px]">{st.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{stageLabel}</td>
                  <td className="px-4 py-3 text-white/60">{c.opsName || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    {mine ? (
                      <span className="text-[11px] text-emerald-300">Yours</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(e) => claimCase(c, e)}
                        className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 disabled:opacity-50"
                      >
                        {busy ? "Assigning…" : "Assign to me"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={16} className="inline text-white/30" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <p className="p-6 text-sm text-white/45">No cases match.</p>}
      </div>
    </div>
  );
}
