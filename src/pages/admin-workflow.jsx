import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  FileCheck2,
  Building2,
  Banknote,
  Globe2,
  Truck,
  PackageCheck,
  ClipboardList,
  MessageSquare,
  Paperclip,
  XCircle,
} from "lucide-react";
import { getSession } from "@/lib/authSession";
import {
  WORKFLOW_STAGE_LABELS,
  WORKFLOW_STAGE_TOTAL,
  appendWorkflowCaseActivity,
  getCaseById,
  loadWorkflowCaseActivity,
  loadWorkflowCasesWithOverrides,
  loadVaultDocsFromStorage,
  persistWorkflowStage,
  saveVaultDocsToStorage,
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

const DOC_STATUS_BADGE = {
  verified: "bg-emerald-400/10 text-emerald-300",
  review: "bg-amber-400/10 text-amber-300",
  missing: "bg-rose-400/10 text-rose-300",
  rejected: "bg-rose-500/15 text-rose-200",
};

function activityTone(kind) {
  if (kind === "approve") return "text-emerald-300/90";
  if (kind === "reject") return "text-rose-300/90";
  return "text-white/85";
}

export default function AdminWorkflowPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const who = session?.name ? `${session.name} · Operations` : "Operations";

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener("iehub-workflow-updated", h);
    return () => window.removeEventListener("iehub-workflow-updated", h);
  }, [refresh]);

  const active = useMemo(() => (caseId ? getCaseById(caseId) : null), [caseId, tick]);

  const [rejectReason, setRejectReason] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [docRejectDraft, setDocRejectDraft] = useState({});
  const [docCommentDraft, setDocCommentDraft] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [vaultDocsByCase, setVaultDocsByCase] = useState(loadVaultDocsFromStorage);

  useEffect(() => {
    const syncVault = () => setVaultDocsByCase(loadVaultDocsFromStorage());
    window.addEventListener("iehub-vault-docs-updated", syncVault);
    return () => window.removeEventListener("iehub-vault-docs-updated", syncVault);
  }, []);

  useEffect(() => {
    setDocRejectDraft({});
    setDocCommentDraft({});
  }, [caseId]);

  const activity = useMemo(
    () => (active ? loadWorkflowCaseActivity(active.id) : []),
    [active, tick]
  );

  const caseVaultDocs = active ? vaultDocsByCase[active.id] ?? [] : [];

  const showFeedback = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3400);
  };

  if (!caseId || !active) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/55">Case not found or invalid link.</p>
        <Link to="/admin" className="text-[var(--gold)] hover:underline text-sm">
          ← Back to Operations
        </Link>
      </div>
    );
  }

  const stageIdx = active.stage;
  const allDone = stageIdx >= WORKFLOW_STAGE_TOTAL;
  const currentStageLabel = allDone ? "Completed" : WORKFLOW_STAGE_LABELS[stageIdx];

  const approveStage = () => {
    if (allDone) return;
    const next = stageIdx + 1;
    persistWorkflowStage(active.id, next);
    appendWorkflowCaseActivity(active.id, {
      who,
      kind: "approve",
      text: `Approved “${WORKFLOW_STAGE_LABELS[stageIdx]}”.${next >= WORKFLOW_STAGE_TOTAL ? " All shipment stages complete." : ""}`,
    });
    showFeedback(next >= WORKFLOW_STAGE_TOTAL ? "Workflow complete for this case." : "Stage approved. Customer workspace updated.");
    refresh();
  };

  const rejectStage = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      showFeedback("Add a short reason before rejecting this stage.");
      return;
    }
    if (stageIdx <= 0) {
      showFeedback("Already at the first stage.");
      return;
    }
    const next = stageIdx - 1;
    persistWorkflowStage(active.id, next);
    appendWorkflowCaseActivity(active.id, {
      who,
      kind: "reject",
      text: `Rejected “${WORKFLOW_STAGE_LABELS[stageIdx]}”. Rolled back to “${WORKFLOW_STAGE_LABELS[next]}”. Reason: ${reason}`,
    });
    setRejectReason("");
    showFeedback("Stage rejected and rolled back. Customer notified.");
    refresh();
  };

  const postComment = () => {
    const text = commentDraft.trim();
    if (!text) {
      showFeedback("Write a comment before posting.");
      return;
    }
    appendWorkflowCaseActivity(active.id, { who, kind: "comment", text });
    setCommentDraft("");
    showFeedback("Comment posted on this case.");
    refresh();
  };

  const approveVaultDoc = (id, index) => {
    setVaultDocsByCase((prev) => {
      const doc = prev[id]?.[index];
      if (!doc || (doc.status !== "review" && doc.status !== "rejected")) {
        requestAnimationFrame(() =>
          showFeedback(
            !doc
              ? "Document not found."
              : doc.status === "verified"
                ? "Already verified."
                : "Approve when a file is in review or rejected for rework."
          )
        );
        return prev;
      }
      const list = [...prev[id]];
      list[index] = { ...doc, status: "verified", updated: "Just now" };
      const next = { ...prev, [id]: list };
      saveVaultDocsToStorage(next);
      requestAnimationFrame(() => showFeedback(`Verified “${doc.name}”.`));
      return next;
    });
  };

  const rejectVaultDoc = (id, index) => {
    const reason = (docRejectDraft[index] ?? "").trim();
    if (!reason) {
      showFeedback("Add a rejection reason for the customer.");
      return;
    }
    setVaultDocsByCase((prev) => {
      const doc = prev[id]?.[index];
      if (!doc || doc.status === "verified") return prev;
      const list = [...prev[id]];
      list[index] = { ...doc, status: "rejected", updated: "Just now", opsComment: reason };
      const next = { ...prev, [id]: list };
      saveVaultDocsToStorage(next);
      requestAnimationFrame(() => showFeedback(`Rejected “${doc.name}”.`));
      return next;
    });
    setDocRejectDraft((d) => {
      const copy = { ...d };
      delete copy[index];
      return copy;
    });
  };

  const commentVaultDoc = (id, index) => {
    const text = (docCommentDraft[index] ?? "").trim();
    if (!text) {
      showFeedback("Write a comment before posting.");
      return;
    }
    setVaultDocsByCase((prev) => {
      const doc = prev[id]?.[index];
      if (!doc) return prev;
      const list = [...prev[id]];
      list[index] = { ...doc, updated: "Just now", opsComment: text };
      const next = { ...prev, [id]: list };
      saveVaultDocsToStorage(next);
      requestAnimationFrame(() => showFeedback(`Comment saved on “${doc.name}”.`));
      return next;
    });
    setDocCommentDraft((d) => {
      const copy = { ...d };
      delete copy[index];
      return copy;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white"
        >
          <ArrowLeft size={14} /> Operations home
        </button>
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-white/40">Workflow</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{active.id}</h1>
        <p className="mt-1 text-sm text-white/55">{active.title}</p>
        <p className="mt-0.5 text-xs text-white/45">
          {active.accountName} · {active.accountCompany} · Owner {active.opsOwner}
        </p>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" role="status">
          {feedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-white/45">Current gate</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--gold)]">{currentStageLabel}</h2>
                <p className="mt-1 text-xs text-white/50">
                  Buyer {active.buyer} · Value {active.value} · SLA{" "}
                  <span className="text-white/70">{active.sla}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/dashboard/vault/${active.id}`}
                  className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-xs text-white/90 hover:bg-white/10"
                >
                  <Paperclip size={13} /> Vault
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={approveStage}
                disabled={allDone}
                className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2.5 text-xs font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 size={15} /> Approve stage
              </button>
              <button
                type="button"
                onClick={rejectStage}
                disabled={stageIdx <= 0 || allDone}
                className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <XCircle size={15} /> Reject stage
              </button>
            </div>
            <div className="mt-3">
              <label className="text-[10px] uppercase tracking-wider text-white/35">Rejection reason (required to reject)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="Explain what failed so the customer can fix it…"
                className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-rose-400/35"
              />
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Shipment stages</h3>
            <ol className="relative mt-6 max-w-xl">
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
                    transition={{ delay: i * 0.03 }}
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
            <h3 className="text-sm font-semibold">Activity & comments</h3>
            <p className="mt-1 text-xs text-white/45">Visible to the customer on their workflow thread.</p>
            <ul className="mt-4 space-y-4">
              {activity.length === 0 && <li className="text-xs text-white/40">No activity yet — approve, reject, or comment below.</li>}
              {activity.map((n, i) => (
                <li key={`${n.when}-${i}`} className="flex gap-3">
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
            <div className="mt-5 space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/35">Comment (ops ↔ customer)</label>
              <div className="flex items-end gap-2 rounded-xl bg-white/5 p-2">
                <MessageSquare size={14} className="ml-2 shrink-0 text-white/30" />
                <textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  rows={2}
                  placeholder="Add a note or clarification…"
                  className="min-h-[44px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={postComment}
                  className="btn-gold shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-black"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/55">Other workflows</h3>
            <ul className="mt-3 max-h-[min(60vh,24rem)] space-y-2 overflow-y-auto">
              {loadWorkflowCasesWithOverrides()
                .filter((c) => c.id !== active.id)
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/admin/workflow/${c.id}`}
                      className="block rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs hover:border-[var(--gold)]/30 hover:bg-white/[0.04]"
                    >
                      <span className="font-medium text-white">{c.id}</span>
                      <span className="mt-0.5 block text-[11px] text-white/45 line-clamp-2">{c.title}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {caseVaultDocs.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/55">Vault documents</h3>
              <p className="mt-1 text-[11px] text-white/45">Approve, reject, or comment on uploads.</p>
              <ul className="mt-3 max-h-[min(52vh,28rem)] space-y-3 overflow-y-auto pr-1">
                {caseVaultDocs.map((doc, index) => {
                  const canApprove = doc.status === "review" || doc.status === "rejected";
                  const statusCls = DOC_STATUS_BADGE[doc.status] ?? "bg-white/10 text-white/50";
                  return (
                    <li key={`${active.id}-${index}-${doc.name}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-white" title={doc.name}>
                            {doc.name}
                          </p>
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] capitalize ${statusCls}`}>{doc.status}</span>
                          {doc.opsComment ? (
                            <p className="mt-2 text-[11px] leading-snug text-white/50">
                              <span className="text-white/35">Last note · </span>
                              {doc.opsComment}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => approveVaultDoc(active.id, index)}
                            disabled={!canApprove}
                            className="rounded-lg bg-emerald-500/85 px-2 py-1 text-[10px] font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectVaultDoc(active.id, index)}
                            disabled={doc.status === "verified"}
                            className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-100 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <label className="mt-2 block text-[10px] uppercase tracking-wider text-white/35">Rejection reason</label>
                      <textarea
                        value={docRejectDraft[index] ?? ""}
                        onChange={(e) => setDocRejectDraft((d) => ({ ...d, [index]: e.target.value }))}
                        rows={2}
                        placeholder="Required to reject…"
                        className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-rose-400/35"
                      />
                      <label className="mt-2 block text-[10px] uppercase tracking-wider text-white/35">Comment to customer</label>
                      <textarea
                        value={docCommentDraft[index] ?? ""}
                        onChange={(e) => setDocCommentDraft((d) => ({ ...d, [index]: e.target.value }))}
                        rows={2}
                        placeholder="Optional…"
                        className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-cyan-400/35"
                      />
                      <button
                        type="button"
                        onClick={() => commentVaultDoc(active.id, index)}
                        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 py-1.5 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-400/15"
                      >
                        <MessageSquare size={12} /> Post comment
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
