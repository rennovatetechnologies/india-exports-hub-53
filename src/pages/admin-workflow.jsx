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
  Search,
  XCircle,
  Download,
  Eye,
} from "lucide-react";
import { getSession } from "@/lib/authSession";
import {
  WORKFLOW_STAGE_LABELS,
  WORKFLOW_STAGE_TOTAL,
  appendWorkflowCaseActivity,
  getCaseById,
  loadWorkflowCaseActivity,
  loadVaultDocsFromStorage,
  persistWorkflowStage,
  saveVaultDocsToStorage,
} from "@/lib/workflowVault";
import {
  downloadBlobAsFile,
  openBlobInNewTab,
  resolveVaultDocumentBlob,
  vaultDocIsDownloadable,
} from "@/lib/vaultDownloads";

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

const DOC_STATUS_LABEL = {
  verified: "Verified",
  review: "In review",
  missing: "Missing",
  rejected: "Rejected",
};

/** Lower = earlier in list: actionable / pending docs before verified. */
const VAULT_DOC_SORT_RANK = {
  review: 0,
  rejected: 1,
  missing: 2,
  verified: 3,
};

function docSmartHaystack(doc) {
  const statusLabel = DOC_STATUS_LABEL[doc.status] ?? doc.status ?? "";
  const bits = [doc.name, statusLabel, doc.status, doc.updated, doc.size, doc.opsComment]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const aliases = [];
  if (doc.status === "verified") aliases.push("done", "ok", "cleared");
  if (doc.status === "review") aliases.push("pending", "queue", "ops");
  if (doc.status === "missing") aliases.push("gap", "need", "todo");
  if (doc.status === "rejected") aliases.push("rework", "failed");
  return `${bits} ${aliases.join(" ")}`;
}

function parseDocSmartTokens(raw) {
  const parts = String(raw || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const free = [];
  let statusFilter = null;
  for (const p of parts) {
    if (p.startsWith("status:") && p.length > 7) {
      statusFilter = p.slice(7);
      continue;
    }
    free.push(p);
  }
  return { free, statusFilter };
}

function docMatchesSmartFilter(doc, raw) {
  const { free, statusFilter } = parseDocSmartTokens(raw);
  if (statusFilter && !String(doc.status).toLowerCase().includes(statusFilter)) return false;
  if (!free.length) return true;
  const hay = docSmartHaystack(doc);
  return free.every((t) => hay.includes(t));
}

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
  const [vaultDocQuery, setVaultDocQuery] = useState("");

  useEffect(() => {
    const syncVault = () => setVaultDocsByCase(loadVaultDocsFromStorage());
    window.addEventListener("iehub-vault-docs-updated", syncVault);
    return () => window.removeEventListener("iehub-vault-docs-updated", syncVault);
  }, []);

  useEffect(() => {
    setDocRejectDraft({});
    setDocCommentDraft({});
    setVaultDocQuery("");
  }, [caseId]);

  const activity = useMemo(
    () => (active ? loadWorkflowCaseActivity(active.id) : []),
    [active, tick]
  );

  const caseVaultDocs = active ? vaultDocsByCase[active.id] ?? [] : [];

  const filteredVaultDocEntries = useMemo(() => {
    return caseVaultDocs
      .map((doc, index) => ({ doc, index }))
      .filter(({ doc }) => docMatchesSmartFilter(doc, vaultDocQuery))
      .sort((a, b) => {
        const ra = VAULT_DOC_SORT_RANK[a.doc.status] ?? 99;
        const rb = VAULT_DOC_SORT_RANK[b.doc.status] ?? 99;
        if (ra !== rb) return ra - rb;
        return a.index - b.index;
      });
  }, [caseVaultDocs, vaultDocQuery]);

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
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          title="Back to workflows"
          aria-label="Back to workflows"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Workflow</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{active.id}</h1>
          <p className="mt-1 text-sm text-white/55">{active.title}</p>
          <p className="mt-0.5 text-xs text-white/45">
            {active.accountName} · {active.accountCompany} · Owner {active.opsOwner}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" role="status">
          {feedback}
        </div>
      )}

      <div className={caseVaultDocs.length > 0 ? "grid gap-6 lg:grid-cols-[1fr_320px]" : "grid gap-6"}>
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-white/45">Current gate</div>
                <h2 className="mt-1 text-lg font-semibold text-sky-100">{currentStageLabel}</h2>
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
                      ? "bg-gradient-to-b from-emerald-400/45 via-sky-400/35 to-white/12"
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
            <h3 className="text-sm font-semibold">Activity & comments</h3>
            <p className="mt-1 text-xs text-white/45">Visible to the customer on their workflow thread.</p>
            <ul className="mt-4 space-y-4">
              {activity.length === 0 && <li className="text-xs text-white/40">No activity yet — approve, reject, or comment below.</li>}
              {activity.map((n, i) => (
                <li key={`${n.when}-${i}`} className="flex gap-3">
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

        {caseVaultDocs.length > 0 ? (
          <aside className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/55">Vault documents</h3>
              <p className="mt-1 text-[11px] text-white/45">Approve, reject, or comment on uploads.</p>
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-[11px] text-white/55">
                <Search size={12} className="shrink-0 text-white/35" />
                <input
                  value={vaultDocQuery}
                  onChange={(e) => setVaultDocQuery(e.target.value)}
                  placeholder="Smart search: name, status:review, missing…"
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/25"
                />
              </div>
              <ul className="mt-3 max-h-[min(52vh,28rem)] space-y-3 overflow-y-auto pr-1">
                {filteredVaultDocEntries.map(({ doc, index }) => {
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
                          {vaultDocIsDownloadable(doc) ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void resolveVaultDocumentBlob(active.id, index, doc).then((blob) =>
                                    downloadBlobAsFile(blob, doc.name)
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/85 hover:bg-white/10"
                              >
                                <Download size={11} /> Download
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void resolveVaultDocumentBlob(active.id, index, doc).then((blob) =>
                                    openBlobInNewTab(blob)
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/85 hover:bg-white/10"
                              >
                                <Eye size={11} /> View
                              </button>
                            </>
                          ) : null}
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
              {vaultDocQuery.trim() && filteredVaultDocEntries.length === 0 && (
                <p className="mt-2 text-center text-[11px] text-white/40">No documents match.</p>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
