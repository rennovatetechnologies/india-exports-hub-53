import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, FileText } from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  ensureCaseForSession,
  getCaseWorkflowStages,
  currentStageLabel,
  listAllCases,
} from "@/lib/customerCase";
import { getPlanById } from "@/lib/planCatalog";
import { adminWorkflowPath } from "@/lib/routes";

function CustomerWorkflow() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("iehub-case-updated", h);
    window.addEventListener("iehub-plans-updated", h);
    return () => {
      window.removeEventListener("iehub-case-updated", h);
      window.removeEventListener("iehub-plans-updated", h);
    };
  }, []);

  void tick;
  const c = ensureCaseForSession();
  const stages = c ? getCaseWorkflowStages(c) : [];
  const idx = Number(c?.stageIndex) || 0;
  const plan = getPlanById(c?.paidPlanId || c?.planId);

  if (!c) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/55">
        <Loader2 size={16} className="animate-spin" /> Loading workflow…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          {plan?.name || "Plan"} workflow · Case {c?.id}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {idx >= stages.length && stages.length ? "Documentation complete" : "Documentation progress"}
        </h1>
        <p className="mt-1 text-sm text-white/55">
          {idx >= stages.length && stages.length
            ? "All stages on this case are done. You can still download documents and message operations."
            : "Stages come from your plan. Ops advances each step as government filings complete."}
        </p>
      </header>

      <ol className="space-y-0">
        {stages.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          const note = c?.stageNotes?.[i];
          const related = (c?.documents || []).filter((d) => d.stageId === s.id);
          return (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                {done ? (
                  <CheckCircle2 size={22} className="text-emerald-400" />
                ) : active ? (
                  <Loader2 size={22} className="animate-spin text-[var(--gold)]" />
                ) : (
                  <Circle size={22} className="text-white/20" />
                )}
                {i < stages.length - 1 && <span className="my-1 w-px flex-1 min-h-[2rem] bg-white/10" />}
              </div>
              <div className={`mb-6 flex-1 rounded-2xl border p-4 ${active ? "border-[var(--gold)]/30 bg-[var(--gold)]/5" : "border-white/10 bg-white/[0.02]"}`}>
                <div className="text-sm font-semibold">{s.label}</div>
                <p className="mt-1 text-xs text-white/45">{s.description}</p>
                {note?.text && <p className="mt-2 text-xs text-white/60">Ops note: {note.text}</p>}
                {related.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {related.map((d) => (
                      <Link
                        key={d.id}
                        to="/dashboard/documents"
                        className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-cyan-200 hover:bg-white/10"
                      >
                        <FileText size={12} /> {d.name}
                      </Link>
                    ))}
                  </div>
                )}
                {active && (
                  <p className="mt-2 text-[11px] text-[var(--gold)]">In progress with your operations team</p>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function StaffWorkflowBoard() {
  const cases = listAllCases();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Workflow board</h1>
        <p className="text-sm text-white/55">Open a case from Operations to advance stages.</p>
      </header>
      <div className="space-y-2">
        {cases.map((c) => {
          const plan = getPlanById(c.paidPlanId || c.planId);
          const label = currentStageLabel(c);
          return (
            <Link
              key={c.customerEmail}
              to={adminWorkflowPath(c.id || c.customerEmail)}
              className="glass-card flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[0.04]"
            >
              <div>
                <div className="font-medium">{c.customerEmail}</div>
                <div className="text-xs text-white/45">
                  {plan?.name || "No plan"} · {c.kycStatus} · Ops {c.opsName || "unassigned"}
                </div>
              </div>
              <div className="text-sm text-[var(--gold)]">{label}</div>
            </Link>
          );
        })}
        {!cases.length && <p className="text-sm text-white/45">No cases yet.</p>}
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  const session = getSession();
  if (session?.role === ROLES.CUSTOMER) return <CustomerWorkflow />;
  return <StaffWorkflowBoard />;
}
