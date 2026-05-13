import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Search, Upload, Download, MoreHorizontal,
  ShieldCheck, Clock3, CheckCircle2, AlertCircle, Image as ImageIcon,
  Workflow, ChevronRight, Flag,
} from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  WORKFLOW_CASES,
  WORKFLOW_VAULT_DOCS,
  getCaseById,
  loadVaultDocsFromStorage,
  saveVaultDocsToStorage,
} from "@/lib/workflowVault";

const STATUS = {
  verified: { label: "Verified", icon: CheckCircle2, cls: "bg-emerald-400/10 text-emerald-300" },
  review:   { label: "In review", icon: Clock3,      cls: "bg-amber-400/10 text-amber-300" },
  missing:  { label: "Missing",   icon: AlertCircle, cls: "bg-rose-400/10 text-rose-300" },
  rejected: { label: "Rejected",  icon: AlertCircle, cls: "bg-rose-500/15 text-rose-200" },
};

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date());
}

export default function VaultPage() {
  const { caseId } = useParams();
  const workflowId = caseId ?? null;
  const caseMeta = workflowId ? getCaseById(workflowId) : null;
  const invalidCase = Boolean(workflowId && !caseMeta);

  const [q, setQ] = useState("");
  const [rowsByCase, setRowsByCase] = useState(() => loadVaultDocsFromStorage());

  const setRowsByCasePersist = (updater) => {
    setRowsByCase((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveVaultDocsToStorage(next);
      return next;
    });
  };

  useEffect(() => {
    const sync = () => setRowsByCase(loadVaultDocsFromStorage());
    window.addEventListener("iehub-vault-docs-updated", sync);
    return () => window.removeEventListener("iehub-vault-docs-updated", sync);
  }, []);

  const rows = workflowId && caseMeta ? rowsByCase[workflowId] ?? [] : [];

  useEffect(() => {
    setQ("");
  }, [workflowId]);

  const docs = useMemo(
    () => rows.filter((d) => d.name.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const pendingCount = useMemo(
    () => rows.filter((d) => d.status !== "verified").length,
    [rows]
  );

  const fileInputRef = useRef(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState(null);
  const session = getSession();
  const isOps =
    session?.role === ROLES.OPERATIONS || session?.role === ROLES.SUPER;
  const [rejectingIndex, setRejectingIndex] = useState(null);
  const [rejectReasonDraft, setRejectReasonDraft] = useState("");

  useEffect(() => {
    setRejectingIndex(null);
    setRejectReasonDraft("");
  }, [workflowId]);

  const openUploadForRow = (index) => {
    setUploadTargetIndex(index);
    requestAnimationFrame(() => fileInputRef.current?.click());
  };

  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    const idx = uploadTargetIndex;
    e.target.value = "";
    setUploadTargetIndex(null);
    if (!file || idx == null || !workflowId) return;

    setRowsByCasePersist((prev) => {
      const list = [...(prev[workflowId] ?? [])];
      const cur = list[idx];
      if (!cur || cur.status === "verified") return prev;
      list[idx] = {
        ...cur,
        name: file.name,
        size: formatSize(file.size),
        updated: todayLabel(),
        status: "review",
        opsComment: undefined,
        flagged: false,
        opsAction: undefined,
      };
      return { ...prev, [workflowId]: list };
    });
  };

  const approveDocRow = (idx) => {
    if (!workflowId) return;
    setRowsByCasePersist((prev) => {
      const doc = prev[workflowId]?.[idx];
      if (!doc || (doc.status !== "review" && doc.status !== "rejected")) return prev;
      const list = [...prev[workflowId]];
      list[idx] = {
        ...doc,
        status: "verified",
        updated: todayLabel(),
        flagged: false,
        opsAction: undefined,
      };
      return { ...prev, [workflowId]: list };
    });
  };

  const confirmRejectDocRow = (idx) => {
    const reason = rejectReasonDraft.trim();
    if (!reason || !workflowId) return;
    setRowsByCasePersist((prev) => {
      const doc = prev[workflowId]?.[idx];
      if (!doc || doc.status === "verified") return prev;
      const list = [...prev[workflowId]];
      list[idx] = {
        ...doc,
        status: "rejected",
        updated: todayLabel(),
        opsComment: reason,
      };
      return { ...prev, [workflowId]: list };
    });
    setRejectingIndex(null);
    setRejectReasonDraft("");
  };

  if (!workflowId) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Storage · encrypted</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Document Vault</h1>
          <p className="mt-1 text-sm text-white/55">
            Documents are organized per workflow. Open a case to upload or manage only the files required for that shipment.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_CASES.map((c) => {
            const n = (WORKFLOW_VAULT_DOCS[c.id] ?? []).filter((d) => d.status !== "verified").length;
            return (
              <li key={c.id}>
                <Link
                  to={`/dashboard/vault/${c.id}`}
                  className="glass-card flex h-full flex-col p-5 transition hover:ring-1 hover:ring-[var(--gold)]/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[var(--gold)]">
                      <Workflow size={18} />
                    </span>
                    {n > 0 && (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">
                        {n} pending
                      </span>
                    )}
                  </div>
                  <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/40">Case {c.id}</div>
                  <div className="mt-1 text-sm font-semibold leading-snug">{c.title}</div>
                  <div className="mt-1 text-xs text-white/50">{c.buyer}</div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--gold)]">
                    Workflow documents <ChevronRight size={14} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/55">
          <p className="font-medium text-white/80">Tip</p>
          <p className="mt-1">From the workflow board, use <strong className="text-white/90">Attach</strong> on a case to jump straight to that case&apos;s vault.</p>
        </div>
      </div>
    );
  }

  if (invalidCase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Workflow not found</h1>
        <p className="text-sm text-white/55">No case matches <span className="text-white">{workflowId}</span>.</p>
        <Link to="/dashboard/vault" className="inline-flex text-sm text-[var(--gold)] hover:underline">← All workflow vaults</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Workflow vault · encrypted</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Documents · {caseMeta.id}</h1>
          <p className="mt-1 text-sm text-white/55">{caseMeta.title}</p>
          <p className="mt-1 text-xs text-white/45">
            {pendingCount === 0 ? "All listed documents are verified." : `${pendingCount} document${pendingCount === 1 ? "" : "s"} still need upload or review.`}
          </p>
          {isOps ? (
            <p className="mt-2 text-xs text-amber-200/85">
              Signed in as operations — use <strong className="text-white/90">Approve</strong> or <strong className="text-white/90">Reject</strong> in the Actions column (same as the case panel in the ops console).
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/vault"
            className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm text-white/80 hover:bg-white/10"
          >
            All workflows
          </Link>
          <Link
            to="/dashboard/workflow"
            className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm text-white/80 hover:bg-white/10"
          >
            Workflow board
          </Link>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
        onChange={onFileChosen}
      />

      <div className="glass-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 p-4">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/60">
            <Search size={14} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search this workflow’s documents…"
              className="flex-1 bg-transparent outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left font-normal">Name</th>
                <th className="px-4 py-3 text-left font-normal">Status</th>
                <th className="px-4 py-3 text-left font-normal">Size</th>
                <th className="px-4 py-3 text-left font-normal">Updated</th>
                <th className="px-4 py-3 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => {
                const globalIndex = rows.findIndex((r) => r === d);
                const S = STATUS[d.status] ?? STATUS.missing;
                const isImg = d.name.endsWith(".jpg") || d.name.endsWith(".png") || d.name.endsWith(".webp");
                const canUpload = d.status !== "verified";
                const canOpsApprove = d.status === "review" || d.status === "rejected";
                const canOpsReject = d.status !== "verified";
                return (
                  <motion.tr
                    key={`${d.name}-${globalIndex}`}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/70">
                          {isImg ? <ImageIcon size={15} /> : <FileText size={15} />}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium">{d.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {d.flagged ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-200">
                                <Flag size={10} className="shrink-0" /> Flagged by operations
                              </span>
                            ) : null}
                            {d.opsAction ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                                Action · {d.opsAction}
                              </span>
                            ) : null}
                          </div>
                          {d.opsComment ? (
                            <p className="mt-1 max-w-md text-[11px] leading-snug text-amber-200/80">
                              <span className="text-white/40">Operations note · </span>
                              {d.opsComment}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ${S.cls}`}>
                        <S.icon size={12} /> {S.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/55">{d.size}</td>
                    <td className="px-4 py-3 text-white/55">{d.updated}</td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex flex-col items-end gap-2">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1">
                          {canUpload && (
                            <button
                              type="button"
                              onClick={() => openUploadForRow(globalIndex)}
                              className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1.5 text-[11px] text-white/80 hover:bg-white/10"
                            >
                              <Upload size={12} /> Upload
                            </button>
                          )}
                          {d.status === "verified" && (
                            <button type="button" className="rounded-md p-1.5 text-white/50 hover:bg-white/5 hover:text-white" title="Download">
                              <Download size={14} />
                            </button>
                          )}
                          {isOps && (
                            <>
                              <button
                                type="button"
                                onClick={() => approveDocRow(globalIndex)}
                                disabled={!canOpsApprove}
                                title={!canOpsApprove ? "Only when the file is in review or rejected" : "Mark verified"}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-500/85 px-2 py-1.5 text-[11px] font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              {rejectingIndex !== globalIndex ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingIndex(globalIndex);
                                    setRejectReasonDraft("");
                                  }}
                                  disabled={!canOpsReject}
                                  title={!canOpsReject ? "Cannot reject a verified document" : "Reject with a reason"}
                                  className="inline-flex items-center gap-1 rounded-md border border-rose-400/40 bg-rose-500/15 px-2 py-1.5 text-[11px] font-medium text-rose-100 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <AlertCircle size={12} /> Reject
                                </button>
                              ) : null}
                            </>
                          )}
                          {!isOps && (
                            <button type="button" className="rounded-md p-1.5 text-white/50 hover:bg-white/5 hover:text-white" aria-label="More">
                              <MoreHorizontal size={14} />
                            </button>
                          )}
                        </div>
                        {isOps && rejectingIndex === globalIndex ? (
                          <div className="w-full max-w-[14rem] rounded-lg border border-rose-400/25 bg-rose-500/5 p-2 text-left sm:max-w-xs">
                            <label className="text-[10px] uppercase tracking-wider text-white/40">Reason (customer sees this)</label>
                            <textarea
                              value={rejectReasonDraft}
                              onChange={(e) => setRejectReasonDraft(e.target.value)}
                              rows={2}
                              placeholder="e.g. Illegible scan — re-upload all pages."
                              className="mt-1 w-full resize-none rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-rose-400/40"
                            />
                            <div className="mt-1.5 flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingIndex(null);
                                  setRejectReasonDraft("");
                                }}
                                className="rounded-md px-2 py-1 text-[10px] text-white/55 hover:bg-white/10"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmRejectDocRow(globalIndex)}
                                disabled={!rejectReasonDraft.trim()}
                                className="rounded-md bg-rose-500/90 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Confirm reject
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {docs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-white/45">No documents match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/5 p-4">
          <div className="flex flex-wrap items-start gap-3 rounded-xl bg-white/[0.03] p-4 text-xs text-white/55">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-300" />
            <div>
              <p className="font-medium text-white">Upload policy</p>
              <p className="mt-1 leading-relaxed">
                You can upload or replace files while a document is <strong className="text-amber-200/90">in review</strong>,{" "}
                <strong className="text-rose-200/90">missing</strong>, or <strong className="text-rose-200/90">rejected</strong> by operations.
                Verified documents stay locked until operations marks the row <strong className="text-amber-200/90">in review</strong> again for rework.
                If operations <strong className="text-white/90">flags</strong> a file or sets an <strong className="text-violet-200/90">action</strong>, you will see it under the file name.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
