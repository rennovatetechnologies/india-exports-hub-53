import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  MessageSquare,
  Workflow,
  CalendarDays,
} from "lucide-react";
import { getSession } from "@/lib/authSession";
import {
  ensureCaseForSession,
  getCaseWorkflowStages,
  journeyStatus,
  CASE_STATUS,
} from "@/lib/customerCase";
import { getPlanById } from "@/lib/planCatalog";
import { getMessagesForCase } from "@/lib/caseMessages";

export default function DashboardOverview() {
  const session = getSession();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("iehub-case-updated", h);
    window.addEventListener("iehub-messages-updated", h);
    window.addEventListener("iehub-plans-updated", h);
    return () => {
      window.removeEventListener("iehub-case-updated", h);
      window.removeEventListener("iehub-messages-updated", h);
      window.removeEventListener("iehub-plans-updated", h);
    };
  }, []);

  const c = ensureCaseForSession();
  const status = c ? journeyStatus(c) : CASE_STATUS.NO_PLAN;
  const plan = getPlanById(c?.paidPlanId || c?.planId);
  const stages = c ? getCaseWorkflowStages(c) : [];
  const stageIdx = c?.stageIndex || 0;
  const currentStage = stages[Math.min(stageIdx, Math.max(stages.length - 1, 0))];
  const readyDocs = (c?.documents || []).filter((d) => d.from === "ops").slice(0, 3);
  const openReqs = (c?.docRequests || []).filter((r) => r.status === "open");
  const msgs = session?.email ? getMessagesForCase(session.email) : [];
  const lastMsg = msgs[msgs.length - 1];

  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  let primary = { to: "/dashboard/workflow", label: "View workflow", hint: "See where your documentation stands" };
  if (status === CASE_STATUS.COMPLETED) {
    primary = { to: "/dashboard/documents", label: "View documents", hint: "All documentation stages are complete" };
  }
  if (openReqs.length) {
    primary = { to: "/dashboard/documents", label: "Upload requested document", hint: openReqs[0].label };
  } else if (readyDocs.length) {
    primary = { to: "/dashboard/documents", label: "Download ready documents", hint: `${readyDocs.length} from your ops team` };
  } else if (lastMsg && lastMsg.fromRole !== "customer") {
    primary = { to: "/dashboard/messages", label: "Reply to operations", hint: lastMsg.body.slice(0, 80) };
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">
            {session?.company || "Your workspace"}
            {plan ? ` · ${plan.name}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {hello}, {(session?.name || "there").split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {status === CASE_STATUS.COMPLETED
              ? "All documentation stages are complete."
              : status === CASE_STATUS.ACTIVE
              ? currentStage
                ? `Current stage: ${currentStage.label}`
                : "Your documentation workspace is ready."
              : "Complete onboarding to unlock your workspace."}
          </p>
        </div>
        {c?.opsName && (
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70">
            Ops · {c.opsName}
          </span>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--gold)]/15 via-white/[0.04] to-transparent p-6 sm:p-8"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]/90">Next step</p>
        <h2 className="mt-2 text-xl font-semibold sm:text-2xl">{primary.label}</h2>
        <p className="mt-1 max-w-xl text-sm text-white/55">{primary.hint}</p>
        <Link
          to={primary.to}
          className="btn-gold mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
        >
          Continue <ArrowUpRight size={16} />
        </Link>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Documentation workflow</h2>
              <p className="text-xs text-white/45">Company formation &amp; registrations</p>
            </div>
            <Link to="/dashboard/workflow" className="text-xs text-[var(--gold)] hover:underline">
              Full timeline →
            </Link>
          </div>
          <ol className="mt-6 space-y-4">
            {stages.slice(0, 5).map((s, i) => {
              const done = i < stageIdx;
              const active = i === stageIdx;
              return (
                <li key={s.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : active ? (
                      <Loader2 size={20} className="animate-spin text-[var(--gold)]" />
                    ) : (
                      <Circle size={20} className="text-white/20" />
                    )}
                    {i < Math.min(stages.length, 5) - 1 && <span className="mt-1 h-8 w-px bg-white/10" />}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${active ? "text-white" : "text-white/70"}`}>{s.label}</div>
                    <div className="text-xs text-white/40">{s.description}</div>
                  </div>
                </li>
              );
            })}
            {!stages.length && (
              <p className="text-sm text-white/45">Workflow appears after your plan is active.</p>
            )}
          </ol>
        </div>

        <div className="space-y-4">
          <Link to="/dashboard/documents" className="glass-card block p-5 transition hover:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText size={16} className="text-cyan-300" /> Documents
            </div>
            <p className="mt-2 text-xs text-white/45">
              {readyDocs.length
                ? `${readyDocs.length} ready to download`
                : openReqs.length
                  ? `${openReqs.length} requested from you`
                  : "Uploads and deliveries live here"}
            </p>
          </Link>
          <Link to="/dashboard/messages" className="glass-card block p-5 transition hover:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare size={16} className="text-[var(--gold)]" /> Messages
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-white/45">
              {lastMsg ? lastMsg.body : "Chat with your operations owner"}
            </p>
          </Link>
          <Link to="/dashboard/events" className="glass-card block p-5 transition hover:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays size={16} className="text-emerald-300" /> Events
            </div>
            <p className="mt-2 text-xs text-white/45">Browse upcoming meets &amp; summits (fees apply to all plans)</p>
          </Link>
          <Link to="/dashboard/workflow" className="glass-card block p-5 transition hover:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Workflow size={16} className="text-fuchsia-300" /> Workflow
            </div>
            <p className="mt-2 text-xs text-white/45">Stage-by-stage progress for your case</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
