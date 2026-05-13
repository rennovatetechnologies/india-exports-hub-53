import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Circle,
  Truck,
  FileCheck2,
  Building2,
  Banknote,
  Globe2,
  PackageCheck,
  ClipboardList,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { getSession } from "@/lib/authSession";
import {
  WORKFLOW_STAGE_LABELS,
  WORKFLOW_STAGE_TOTAL,
  appendWorkflowCaseActivity,
  loadWorkflowCaseActivity,
  loadWorkflowCasesWithOverrides,
} from "@/lib/workflowVault";

const STAGE_ICONS = [
  Building2,
  FileCheck2,
  ClipboardList,
  Banknote,
  Globe2,
  Truck,
  PackageCheck,
  CheckCircle2,
];

const STAGES = WORKFLOW_STAGE_LABELS.map((label, i) => ({ label, icon: STAGE_ICONS[i] }));

function activityTone(kind) {
  if (kind === "approve") return "text-emerald-300/90";
  if (kind === "reject") return "text-rose-300/90";
  return "text-white/85";
}

export default function WorkflowPage() {
  const location = useLocation();
  const session = getSession();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener("iehub-workflow-updated", h);
    return () => window.removeEventListener("iehub-workflow-updated", h);
  }, [refresh]);

  const cases = useMemo(() => loadWorkflowCasesWithOverrides(), [tick]);
  const [activeId, setActiveId] = useState(() => loadWorkflowCasesWithOverrides()[0]?.id ?? "");

  useEffect(() => {
    if (!cases.length) return;
    if (!activeId || !cases.some((c) => c.id === activeId)) setActiveId(cases[0].id);
  }, [cases, activeId]);

  const active = useMemo(() => cases.find((c) => c.id === activeId) ?? cases[0], [cases, activeId]);

  const activity = useMemo(
    () => (active ? loadWorkflowCaseActivity(active.id) : []),
    [active, tick]
  );

  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (location.hash !== "#workflow-activity") return;
    const el = document.getElementById("workflow-activity");
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.hash]);

  const postCustomerNote = () => {
    if (!active) return;
    const text = noteDraft.trim();
    if (!text) return;
    const who = session?.name ? `${session.name} · You` : "Customer";
    appendWorkflowCaseActivity(active.id, { who, kind: "comment", text });
    setNoteDraft("");
    refresh();
  };

  if (!active) {
    return (
      <div className="text-sm text-white/55">No workflow cases available.</div>
    );
  }

  const stageIdx = active.stage;
  const allDone = stageIdx >= WORKFLOW_STAGE_TOTAL;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workflow tracker</h1>
        <p className="mt-1 text-sm text-white/55">Live status across every shipment case in your workspace.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          {cases.map((c) => {
            const on = active.id === c.id;
            const pct = Math.round((Math.min(c.stage, STAGES.length) / STAGES.length) * 100);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`glass-card w-full p-4 text-left transition ${on ? "ring-1 ring-[var(--gold)]/50" : "opacity-80 hover:opacity-100"}`}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/40">
                  <span>Case {c.id}</span>
                  <span className="text-[var(--gold)]">{pct}%</span>
                </div>
                <div className="mt-2 text-sm font-medium">{c.title}</div>
                <div className="text-xs text-white/50">
                  {c.buyer} · {c.value}
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[var(--grad-gold)]" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </aside>

        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-white/45">Case {active.id}</div>
                <h2 className="text-xl font-semibold">{active.title}</h2>
                <div className="mt-1 text-sm text-white/55">
                  Buyer · {active.buyer} · Value {active.value}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/dashboard/vault/${active.id}`}
                  className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-xs text-white/90 hover:bg-white/10"
                >
                  <Paperclip size={13} /> Documents
                </Link>
                <a
                  href="#workflow-activity"
                  className="btn-gold inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-black"
                >
                  <MessageSquare size={13} /> Comment on case
                </a>
              </div>
            </div>

            <ol className="relative mt-8 max-w-xl">
              {STAGES.map((s, i) => {
                const done = i < stageIdx;
                const cur = i === stageIdx && !allDone;
                const isLast = i === STAGES.length - 1;
                const nextIdx = i + 1;
                const lineClass =
                  nextIdx < stageIdx
                    ? "bg-emerald-400/45"
                    : nextIdx === stageIdx && !allDone
                      ? "bg-gradient-to-b from-emerald-400/45 via-[var(--gold)]/50 to-white/12"
                      : "bg-white/[0.08]";
                return (
                  <motion.li
                    key={s.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative flex gap-4"
                  >
                    <div className="flex w-11 shrink-0 flex-col items-center self-stretch">
                      <span
                        className={`relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-lg ${
                          done
                            ? "border-emerald-400/35 bg-emerald-400/15 text-emerald-300"
                            : cur
                              ? "border-[var(--gold)]/50 bg-[var(--grad-gold)] text-black"
                              : "border-white/10 bg-white/[0.06] text-white/40"
                        }`}
                      >
                        {done ? <CheckCircle2 size={18} /> : cur ? <Loader2 size={18} className="animate-spin" /> : <s.icon size={18} />}
                      </span>
                      {!isLast && (
                        <div className={`mt-2 w-px flex-1 min-h-[20px] rounded-full ${lineClass}`} aria-hidden />
                      )}
                    </div>
                    <div
                      className={`min-w-0 flex-1 rounded-xl border p-4 ${
                        cur
                          ? "border-[var(--gold)]/40 bg-white/[0.04]"
                          : done
                            ? "border-emerald-400/20 bg-emerald-400/[0.04]"
                            : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-sm font-medium">{s.label}</div>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                            done ? "text-emerald-300/90" : cur ? "text-[var(--gold)]" : "text-white/35"
                          }`}
                        >
                          {done ? "Completed" : cur ? "In progress" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>

          <div id="workflow-activity" className="glass-card scroll-mt-24 p-6">
            <h3 className="text-sm font-semibold">Activity & notes</h3>
            <p className="mt-1 text-xs text-white/45">Thread shared with operations — approvals, rejections, and comments appear here.</p>
            <ul className="mt-4 space-y-4">
              {activity.length === 0 && (
                <li className="text-xs text-white/40">No messages yet. Operations updates will show here.</li>
              )}
              {activity.map((n, i) => (
                <li key={`${n.when}-${i}-${n.text.slice(0, 24)}`} className="flex gap-3">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      n.kind === "approve" ? "bg-emerald-400" : n.kind === "reject" ? "bg-rose-400" : "bg-[var(--gold)]"
                    }`}
                  />
                  <div>
                    <div className="text-xs text-white/45">
                      {n.who} · {n.when}
                    </div>
                    <div className={`mt-0.5 text-sm ${activityTone(n.kind)}`}>{n.text}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/5 p-2">
              <Circle size={14} className="ml-2 text-white/30" />
              <input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    postCustomerNote();
                  }
                }}
                className="flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-white/30"
                placeholder="Add a note for the ops team…"
              />
              <button
                type="button"
                onClick={postCustomerNote}
                className="btn-gold rounded-lg px-3 py-1.5 text-xs font-semibold text-black"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
