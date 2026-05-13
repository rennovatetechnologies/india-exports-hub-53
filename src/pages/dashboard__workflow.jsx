import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
  Search,
} from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  WORKFLOW_STAGE_LABELS,
  WORKFLOW_STAGE_TOTAL,
  appendWorkflowCaseActivity,
  loadWorkflowCaseActivity,
  loadWorkflowCasesWithOverrides,
  sortWorkflowCases,
  workflowCaseMatchesPreset,
  workflowCaseMatchesSmartQuery,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const session = getSession();
  const staffRole = session?.role === ROLES.OPERATIONS || session?.role === ROLES.ADMIN;

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener("iehub-workflow-updated", h);
    return () => window.removeEventListener("iehub-workflow-updated", h);
  }, [refresh]);

  const cases = useMemo(() => loadWorkflowCasesWithOverrides(), [tick]);
  const [activeId, setActiveId] = useState(() => loadWorkflowCasesWithOverrides()[0]?.id ?? "");
  const [caseQuery, setCaseQuery] = useState("");
  const [casePreset, setCasePreset] = useState(/** @type {"all" | "attention" | "active" | "complete"} */ ("all"));
  const [caseSort, setCaseSort] = useState(/** @type {"smart" | "caseId" | "stage"} */ ("smart"));

  const caseFromUrl = searchParams.get("case");

  useEffect(() => {
    if (!cases.length) return;
    if (caseFromUrl && cases.some((c) => c.id === caseFromUrl)) {
      setActiveId(caseFromUrl);
      return;
    }
    if (caseFromUrl) {
      setSearchParams({}, { replace: true });
    }
  }, [cases, caseFromUrl, setSearchParams]);

  useEffect(() => {
    if (!cases.length) return;
    if (!activeId || !cases.some((c) => c.id === activeId)) setActiveId(cases[0].id);
  }, [cases, activeId]);

  const filteredCases = useMemo(() => {
    const narrowed = cases.filter((c) => workflowCaseMatchesPreset(c, casePreset)).filter((c) => workflowCaseMatchesSmartQuery(c, caseQuery));
    return sortWorkflowCases(narrowed, caseSort);
  }, [cases, casePreset, caseQuery, caseSort]);

  useEffect(() => {
    if (!filteredCases.length) return;
    if (!filteredCases.some((c) => c.id === activeId)) {
      const next = filteredCases[0].id;
      setActiveId(next);
      setSearchParams({ case: next }, { replace: true });
    }
  }, [filteredCases, activeId, setSearchParams]);

  const selectCase = (id) => {
    setActiveId(id);
    setSearchParams({ case: id }, { replace: true });
  };

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
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">
          {staffRole ? "Operations team" : "Operations"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workflow tracker</h1>
        <p className="mt-1 text-sm text-white/55">Live status across every shipment case in your workspace.</p>
        {staffRole && (
          <div className="mt-4 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50/95">
            <span className="text-white/80">
              This board is read-only for timelines and notes. Approve or reject stages on the operations desk.
            </span>{" "}
            <Link
              to={`/admin/workflow/${encodeURIComponent(active.id)}`}
              className="font-semibold text-[var(--gold)] underline decoration-[var(--gold)]/50 underline-offset-2 hover:decoration-[var(--gold)]"
            >
              Open case desk →
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/60">
            <Search size={14} className="shrink-0 text-white/40" />
            <input
              value={caseQuery}
              onChange={(e) => setCaseQuery(e.target.value)}
              placeholder="Smart search: words, sla:breached, stage:kyc…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
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
          <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-white/35">
            <span>Sort</span>
            <select
              value={caseSort}
              onChange={(e) => setCaseSort(/** @type {"smart" | "caseId" | "stage"} */ (e.target.value))}
              className="max-w-[10rem] rounded-lg border border-white/10 bg-zinc-950/80 px-2 py-1 text-[10px] font-medium normal-case tracking-normal text-white/80 outline-none focus:border-[var(--gold)]/40"
            >
              <option value="smart">Smart (SLA &amp; progress)</option>
              <option value="caseId">Case ID</option>
              <option value="stage">Stage (highest first)</option>
            </select>
          </div>
          {filteredCases.map((c) => {
            const on = active.id === c.id;
            const pct = Math.round((Math.min(Math.max(c.stage, 0), WORKFLOW_STAGE_TOTAL) / WORKFLOW_STAGE_TOTAL) * 100);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCase(c.id)}
                className={`glass-card w-full p-4 text-left transition ${on ? "ring-1 ring-[var(--gold)]/45" : "opacity-80 hover:opacity-100"}`}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/40">
                  <span>Case {c.id}</span>
                  <span className={on ? "text-[var(--gold)]" : "text-teal-200/85"}>{pct}%</span>
                </div>
                <div className="mt-2 text-sm font-medium">{c.title}</div>
                <div className="text-xs text-white/50">
                  {c.buyer} · {c.value}
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full max-w-full rounded-full transition-[width] duration-300 ease-out"
                    style={{
                      width: `${pct}%`,
                      background: on ? "var(--grad-gold)" : "var(--grad-progress-muted)",
                    }}
                  />
                </div>
              </button>
            );
          })}
          {filteredCases.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-white/45">
              No cases match your filter.
            </p>
          )}
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
                {staffRole ? (
                  <Link
                    to={`/admin/workflow/${encodeURIComponent(active.id)}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--gold)]/45 bg-[var(--gold)]/10 px-3 py-2 text-xs font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/18"
                  >
                    <MessageSquare size={13} /> Ops desk & comments
                  </Link>
                ) : (
                  <a
                    href="#workflow-activity"
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-400/35 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/16"
                  >
                    <MessageSquare size={13} /> Comment on case
                  </a>
                )}
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
                      ? "bg-gradient-to-b from-emerald-400/45 via-sky-400/35 to-white/12"
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
                              ? "border-sky-400/45 bg-sky-500/15 text-sky-100 ring-1 ring-[var(--gold)]/35"
                              : "border-white/10 bg-white/[0.06] text-white/40"
                        }`}
                      >
                        {done ? <CheckCircle2 size={18} /> : cur ? <Loader2 size={18} className="animate-spin text-sky-100" /> : <s.icon size={18} />}
                      </span>
                      {!isLast && (
                        <div className={`mt-2 w-px flex-1 min-h-[20px] rounded-full ${lineClass}`} aria-hidden />
                      )}
                    </div>
                    <div
                      className={`min-w-0 flex-1 rounded-xl border p-4 ${
                        cur
                          ? "border-sky-400/25 bg-sky-500/[0.06]"
                          : done
                            ? "border-emerald-400/20 bg-emerald-400/[0.04]"
                            : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-sm font-medium">{s.label}</div>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                            done ? "text-emerald-300/90" : cur ? "text-sky-200/95" : "text-white/35"
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
                      n.kind === "approve" ? "bg-emerald-400" : n.kind === "reject" ? "bg-rose-400" : "bg-sky-400/90"
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
            {staffRole ? (
              <p className="mt-5 text-xs text-white/45">
                Customer thread — post comments and approvals from{" "}
                <Link to={`/admin/workflow/${encodeURIComponent(active.id)}`} className="text-[var(--gold)] hover:underline">
                  operations desk
                </Link>
                .
              </p>
            ) : (
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
                  className="rounded-lg border border-[var(--gold)]/50 bg-[var(--gold)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/25"
                >
                  Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
