import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Briefcase, IndianRupee, AlertTriangle, ArrowUpRight, ChevronRight } from "lucide-react";
import {
  loadWorkflowCasesWithOverrides,
  sortWorkflowCases,
  workflowCaseMatchesPreset,
  workflowCaseMatchesSmartQuery,
  workflowCaseStageLabel,
} from "@/lib/workflowVault";

const STATS = [
  { label: "Active customers", value: "284", delta: "+12 this week", icon: Users },
  { label: "Open cases", value: "47", delta: "9 due today", icon: Briefcase },
  { label: "MTD revenue", value: "₹38.4L", delta: "+18% MoM", icon: IndianRupee },
  { label: "SLA breaches", value: "3", delta: "−2 vs last week", icon: AlertTriangle },
];

const slaColor = (s) =>
  s === "—" || s === "–"
    ? "bg-white/10 text-white/50"
    : s === "Breached"
      ? "bg-rose-400/10 text-rose-300"
      : s === "Due today"
        ? "bg-amber-400/10 text-amber-300"
        : "bg-emerald-400/10 text-emerald-300";

export default function AdminPage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener("iehub-workflow-updated", h);
    return () => window.removeEventListener("iehub-workflow-updated", h);
  }, [refresh]);

  const cases = useMemo(() => loadWorkflowCasesWithOverrides(), [tick]);
  const [caseQuery, setCaseQuery] = useState("");
  const [casePreset, setCasePreset] = useState(/** @type {"all" | "attention" | "active" | "complete"} */ ("all"));
  const [caseSort, setCaseSort] = useState(/** @type {"smart" | "caseId" | "stage"} */ ("smart"));

  const filteredCases = useMemo(() => {
    const narrowed = cases
      .filter((c) => workflowCaseMatchesPreset(c, casePreset))
      .filter((c) => workflowCaseMatchesSmartQuery(c, caseQuery));
    return sortWorkflowCases(narrowed, caseSort);
  }, [cases, casePreset, caseQuery, caseSort]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> Operations console
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Workspace overview</h1>
          <p className="mt-1 text-sm text-white/55">Internal command center for the VISTARA ops team.</p>
        </div>
        <button type="button" className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
          New case <ArrowUpRight size={13} />
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, delta, icon: Icon }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/45">{label}</span>
              <Icon size={16} className="text-[var(--gold)]" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-[11px] text-white/50">{delta}</div>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6">
        <div className="glass-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Active workflows</h3>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center sm:justify-end">
              <input
                value={caseQuery}
                onChange={(e) => setCaseQuery(e.target.value)}
                placeholder="Smart search · sla:breached owner:riya …"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[var(--gold)]/50"
              />
              <select
                value={caseSort}
                onChange={(e) => setCaseSort(/** @type {"smart" | "caseId" | "stage"} */ (e.target.value))}
                className="shrink-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 py-1.5 text-[11px] text-white/80 outline-none focus:border-[var(--gold)]/40"
              >
                <option value="smart">Sort: Smart</option>
                <option value="caseId">Sort: Case ID</option>
                <option value="stage">Sort: Stage</option>
              </select>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All" },
              { id: "attention", label: "SLA risk" },
              { id: "active", label: "Active" },
              { id: "complete", label: "Done" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCasePreset(id)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                  casePreset === id
                    ? "border-[var(--gold)]/50 bg-[var(--gold)]/15 text-[var(--gold)]"
                    : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            Open a case to approve or reject the current stage. Use multiple words (all must match) or field filters like{" "}
            <code className="text-white/55">sla:due</code>, <code className="text-white/55">stage:iec</code>.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="py-2 pr-4">Case</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Stage</th>
                  <th className="py-2 pr-4">SLA</th>
                  <th className="py-2 pr-4">Owner</th>
                  <th className="py-2 w-10" aria-hidden />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/workflow/${c.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/admin/workflow/${c.id}`);
                      }
                    }}
                    className="cursor-pointer text-white/75 transition-colors hover:bg-white/[0.04]"
                  >
                    <td className="py-3 pr-4 font-medium text-white">{c.id}</td>
                    <td className="py-3 pr-4">
                      <div className="text-white">{c.accountName ?? "—"}</div>
                      <div className="text-[11px] text-white/45">{c.accountCompany ?? c.title}</div>
                    </td>
                    <td className="py-3 pr-4">{workflowCaseStageLabel(c.stage)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${slaColor(c.sla)}`}>{c.sla}</span>
                    </td>
                    <td className="py-3 pr-4">{c.opsOwner ?? "—"}</td>
                    <td className="py-3 text-[var(--gold)]">
                      <ChevronRight size={18} className="opacity-70" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCases.length === 0 && <p className="mt-4 text-center text-xs text-white/45">No cases match your search.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
