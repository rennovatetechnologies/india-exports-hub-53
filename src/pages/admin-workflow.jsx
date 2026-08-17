import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Download,
  Eye,
  Loader2,
  Upload,
  MessageSquare,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  findCaseByRef,
  approveKyc,
  requestKycMore,
  reviewKycDocument,
  downloadCaseFile,
  fetchCaseFileBlob,
  setCaseStage,
  addOpsDocument,
  requestDocument,
  reassignOps,
  loadOpsRoster,
  getCaseWorkflowStages,
  currentStageLabel,
  journeyStatus,
  CASE_STATUS,
  KYC_STATUS,
  fetchCaseById,
} from "@/lib/customerCase";
import { getPlanById } from "@/lib/planCatalog";
import { fetchMessagesForCase, getMessagesForCase, sendMessage } from "@/lib/caseMessages";
import { PATHS } from "@/lib/routes";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";

function reviewBadge(status) {
  if (status === "approved") return "bg-emerald-400/15 text-emerald-300";
  if (status === "rejected") return "bg-rose-400/15 text-rose-300";
  if (status === "pending") return "bg-amber-400/15 text-amber-200";
  return "bg-white/10 text-white/45";
}

export default function AdminWorkflowPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const [tick, setTick] = useState(0);
  const [queueReady, setQueueReady] = useState(false);
  const [tab, setTab] = useState("overview");
  const [note, setNote] = useState("");
  const [reqLabel, setReqLabel] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [chatBody, setChatBody] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [docLabel, setDocLabel] = useState("");
  const [docNote, setDocNote] = useState("");
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [reqError, setReqError] = useState("");
  const docFileInputRef = useRef(null);
  const [chatSending, setChatSending] = useState(false);
  const [kycBusy, setKycBusy] = useState(null);
  const [showRequestMore, setShowRequestMore] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [selectedMissing, setSelectedMissing] = useState({});
  const [docNotes, setDocNotes] = useState({});
  const [rejectDrafts, setRejectDrafts] = useState({});
  const [fileBusy, setFileBusy] = useState(null);
  const [kycError, setKycError] = useState("");
  const [filePreview, setFilePreview] = useState(null); // { url, name, type }
  const [stageBusy, setStageBusy] = useState(false);
  const [stageError, setStageError] = useState("");

  useEffect(() => {
    setQueueReady(true);
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

  // tick forces re-read after cache updates
  void tick;
  const c = caseId ? findCaseByRef(caseId) : null;
  const customerEmail = c?.customerEmail || "";

  useEffect(() => {
    if (!caseId || !queueReady) return;
    if (!findCaseByRef(caseId)) {
      fetchCaseById(caseId).catch(() => {});
    }
  }, [caseId, queueReady]);

  useEffect(() => {
    if (!c?.id || !queueReady) return;
    fetchMessagesForCase(c).catch(() => {});
  }, [c?.id, queueReady, tab]);

  useEffect(() => {
    return () => {
      if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    };
  }, [filePreview?.url]);

  const closeFilePreview = () => {
    setFilePreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  if (!queueReady && !c) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/55">
        <Loader2 size={16} className="animate-spin" /> Loading case…
      </div>
    );
  }

  if (!c) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/55">Case not found.</p>
        <Link to={PATHS.admin} className="text-[var(--gold)]">
          ← Back to queue
        </Link>
      </div>
    );
  }

  const plan = getPlanById(c.paidPlanId || c.planId);
  const stages = getCaseWorkflowStages(c);
  const status = journeyStatus(c);
  const kycDocs =
    Array.isArray(c.kycDocs) && c.kycDocs.length ? c.kycDocs : plan?.kycDocs || [];
  const msgs = getMessagesForCase(c || customerEmail);
  const roster = loadOpsRoster();
  const canReviewKyc = c.kycStatus === KYC_STATUS.SUBMITTED;

  let kycApproved = 0;
  let kycRejected = 0;
  let kycPending = 0;
  let kycMissing = 0;
  for (const d of kycDocs) {
    const up = c.kycUploads?.[d.id];
    if (!up) {
      kycMissing += 1;
      continue;
    }
    const st = up.reviewStatus || "pending";
    if (st === "approved") kycApproved += 1;
    else if (st === "rejected") kycRejected += 1;
    else kycPending += 1;
  }
  const kycReviewStats = { approved: kycApproved, rejected: kycRejected, pending: kycPending, missing: kycMissing };

  const openRequestMorePanel = () => {
    const next = {};
    const notes = {};
    for (const d of kycDocs) {
      const up = c.kycUploads?.[d.id];
      const rejected = up?.reviewStatus === "rejected" || !up;
      next[d.id] = rejected;
      if (up?.reviewNote) notes[d.id] = up.reviewNote;
    }
    setSelectedMissing(next);
    setDocNotes(notes);
    setRequestReason(c.kycRejectReason || "Please re-upload clearer scans of the documents listed below.");
    setShowRequestMore(true);
    setKycError("");
  };

  const runApproveKyc = async () => {
    setKycBusy("approve");
    setKycError("");
    try {
      const ok = await approveKyc(customerEmail);
      if (!ok) setKycError("Could not approve KYC. Try again.");
      setShowRequestMore(false);
    } finally {
      setKycBusy(null);
    }
  };

  const runRequestMore = async () => {
    const missingDocIds = Object.entries(selectedMissing)
      .filter(([, on]) => on)
      .map(([id]) => id);
    if (!missingDocIds.length) {
      setKycError("Select at least one document the customer must update.");
      return;
    }
    setKycBusy("request");
    setKycError("");
    try {
      const notesPayload = {};
      for (const id of missingDocIds) {
        if (docNotes[id]?.trim()) notesPayload[id] = docNotes[id].trim();
      }
      const ok = await requestKycMore(customerEmail, requestReason.trim() || "Additional documents required", {
        missingDocIds,
        docNotes: notesPayload,
      });
      if (!ok) setKycError("Could not notify the customer. Try again.");
      else setShowRequestMore(false);
    } finally {
      setKycBusy(null);
    }
  };

  const runDocReview = async (docId, reviewStatus) => {
    const note = (rejectDrafts[docId] || "").trim();
    if (reviewStatus === "rejected" && note.length < 3) {
      setKycError("Add a short note so the customer knows what to fix.");
      return;
    }
    setKycBusy(`review:${docId}:${reviewStatus}`);
    setKycError("");
    try {
      await reviewKycDocument(customerEmail, docId, reviewStatus, note);
      if (reviewStatus === "rejected") {
        setSelectedMissing((s) => ({ ...s, [docId]: true }));
        setDocNotes((n) => ({ ...n, [docId]: note }));
      }
    } catch (e) {
      setKycError(toUserMessage(e, "We couldn't update this review. Please try again."));
    } finally {
      setKycBusy(null);
    }
  };

  const viewFile = async (up, { errorKey = "kyc" } = {}) => {
    const fileId = up?.fileId || up?.driveFileId;
    if (!fileId) {
      const msg = "No file id on this upload — ask the customer to re-upload.";
      if (errorKey === "doc") setDocError(msg);
      else setKycError(msg);
      return;
    }
    setFileBusy(fileId);
    if (errorKey === "doc") setDocError("");
    else setKycError("");
    try {
      const blob = await fetchCaseFileBlob(fileId);
      const mime =
        blob.type ||
        up?.mimeType ||
        (/\.pdf$/i.test(up?.name || "") ? "application/pdf" : "") ||
        "application/octet-stream";
      const typed = blob.type ? blob : new Blob([blob], { type: mime });
      const url = URL.createObjectURL(typed);
      setFilePreview((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return {
          url,
          name: up?.name || "Document",
          type: typed.type || mime,
        };
      });
    } catch (e) {
      const msg = toUserMessage(e, "We couldn't open that file. Try downloading it instead.");
      if (errorKey === "doc") setDocError(msg);
      else setKycError(msg);
    } finally {
      setFileBusy(null);
    }
  };

  const downloadFile = async (up, { errorKey = "kyc" } = {}) => {
    const fileId = up?.fileId || up?.driveFileId;
    if (!fileId) return;
    setFileBusy(`dl:${fileId}`);
    try {
      await downloadCaseFile(fileId, up.name || "kyc-document");
    } catch {
      const msg = "Could not download file.";
      if (errorKey === "doc") setDocError(msg);
      else setKycError(msg);
    } finally {
      setFileBusy(null);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "kyc", label: "KYC" },
    { id: "workflow", label: "Workflow" },
    { id: "documents", label: "Documents" },
    { id: "chat", label: "Chat" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(PATHS.admin)}
            className="mb-2 inline-flex items-center gap-1 text-xs text-white/45 hover:text-white"
          >
            <ArrowLeft size={14} /> Queue
          </button>
          <h1 className="text-2xl font-semibold">{customerEmail}</h1>
          <p className="mt-1 text-sm text-white/55">
            {plan?.name || "No plan"} · {status.replace(/_/g, " ")} · Case {c.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-white/50">
            <UserPlus size={14} />
            <select
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
              value={c.opsEmail || ""}
              onChange={(e) => {
                const o = roster.find((r) => r.email === e.target.value);
                if (o) reassignOps(customerEmail, o.email, o.name);
              }}
            >
              <option value="">Unassigned</option>
              {roster.map((o) => (
                <option key={o.email} value={o.email}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm ${tab === t.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card p-5 space-y-2 text-sm">
            <div>
              <span className="text-white/40">KYC</span> · {c.kycStatus}
            </div>
            <div>
              <span className="text-white/40">Ops</span> · {c.opsName || "—"}
            </div>
            <div>
              <span className="text-white/40">Stage</span> · {currentStageLabel(c)}
            </div>
            <div>
              <span className="text-white/40">Docs ready</span> · {(c.documents || []).filter((d) => d.from === "ops").length}
            </div>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-white/45 mb-2">Quick actions</p>
            <div className="flex flex-wrap gap-2">
              {canReviewKyc && (
                <>
                  <button
                    type="button"
                    onClick={() => setTab("kyc")}
                    className="btn-gold rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    Review KYC files
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("kyc");
                      openRequestMorePanel();
                    }}
                    className="btn-ghost rounded-xl px-3 py-2 text-xs"
                  >
                    Request more KYC
                  </button>
                </>
              )}
              <button type="button" onClick={() => setTab("chat")} className="btn-ghost inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs">
                <MessageSquare size={14} /> Open chat
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "kyc" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Legal name", c.kycProfile?.legalName],
              ["Entity type", c.kycProfile?.entityType],
              ["Incorporation", c.kycProfile?.incorporationDate],
              ["Turnover", c.kycProfile?.turnover],
              ["City", c.kycProfile?.operatingCity],
              ["Address", c.kycProfile?.registeredAddress],
              ["Signatory", c.kycProfile?.signatoryName],
              ["Designation", c.kycProfile?.designation],
              ["PAN", c.kycProfile?.panNumber],
              [
                "Aadhaar",
                c.kycProfile?.aadhaarNumber
                  ? String(c.kycProfile.aadhaarNumber).replace(/(\d{4})(?=\d)/g, "$1 ").trim()
                  : c.kycProfile?.aadhaarLast4
                    ? `···· ${c.kycProfile.aadhaarLast4}`
                    : null,
              ],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/[0.03] p-3 text-sm">
                <div className="text-[11px] uppercase tracking-wider text-white/40">{k}</div>
                <div className="mt-1 text-white/85">{v || "—"}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium">Submitted files</h3>
              <p className="text-xs text-white/45">
                {kycReviewStats.approved} approved · {kycReviewStats.pending} pending ·{" "}
                {kycReviewStats.rejected} rejected · {kycReviewStats.missing} missing
              </p>
            </div>
            {canReviewKyc && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(kycBusy)}
                  onClick={runApproveKyc}
                  className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {kycBusy === "approve" ? "Approving…" : "Approve all KYC"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(kycBusy)}
                  onClick={openRequestMorePanel}
                  className="btn-ghost rounded-xl px-4 py-2 text-sm"
                >
                  Request more…
                </button>
              </div>
            )}
          </div>

          {kycError && <p className="text-sm text-rose-300">{kycError}</p>}

          <ul className="space-y-3">
            {kycDocs.map((d) => {
              const up = c.kycUploads?.[d.id];
              const reviewStatus = up?.reviewStatus || (up ? "pending" : "missing");
              const fileId = up?.fileId || up?.driveFileId;
              const reviewing = kycBusy === `review:${d.id}:approved` || kycBusy === `review:${d.id}:rejected`;
              return (
                <li key={d.id} className="glass-card space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {d.label} {d.required !== false && <span className="text-white/40">*</span>}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider ${reviewBadge(reviewStatus)}`}>
                          {reviewStatus}
                        </span>
                      </div>
                      <p className={`mt-1 truncate text-xs ${up ? "text-white/55" : "text-white/35"}`}>
                        {up ? up.name : "Not uploaded"}
                        {up?.size ? ` · ${Math.round(up.size / 1024)} KB` : ""}
                      </p>
                      {up?.reviewNote && (
                        <p className="mt-1 text-xs text-rose-200/90">Note: {up.reviewNote}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {fileId && (
                        <>
                          <button
                            type="button"
                            className="btn-ghost inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs"
                            disabled={fileBusy === fileId}
                            onClick={() => viewFile(up)}
                          >
                            <Eye size={13} /> {fileBusy === fileId ? "Opening…" : "View"}
                          </button>
                          <button
                            type="button"
                            className="btn-ghost inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs"
                            disabled={fileBusy === `dl:${fileId}`}
                            onClick={() => downloadFile(up)}
                          >
                            <Download size={13} /> Download
                          </button>
                        </>
                      )}
                      {canReviewKyc && up && (
                        <>
                          <button
                            type="button"
                            disabled={Boolean(kycBusy) || reviewStatus === "approved"}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/15 px-2.5 py-1.5 text-xs text-emerald-300 disabled:opacity-40"
                            onClick={() => runDocReview(d.id, "approved")}
                          >
                            <CheckCircle2 size={13} />
                            {kycBusy === `review:${d.id}:approved` ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(kycBusy)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-400/15 px-2.5 py-1.5 text-xs text-rose-300 disabled:opacity-40"
                            onClick={() => runDocReview(d.id, "rejected")}
                          >
                            <XCircle size={13} />
                            {kycBusy === `review:${d.id}:rejected` ? "…" : "Reject"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {canReviewKyc && up && reviewStatus !== "approved" && (
                    <input
                      value={rejectDrafts[d.id] || ""}
                      onChange={(e) => setRejectDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                      placeholder="Reject note (required) — e.g. Blurry scan, please upload a clearer PDF"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                      disabled={reviewing}
                    />
                  )}
                </li>
              );
            })}
            {!kycDocs.length && (
              <li className="text-sm text-white/45">No KYC documents configured for this plan.</li>
            )}
          </ul>

          {showRequestMore && canReviewKyc && (
            <div className="glass-card space-y-4 border border-amber-400/20 p-5">
              <div>
                <h3 className="text-sm font-semibold text-amber-100">Request more from customer</h3>
                <p className="mt-1 text-xs text-white/50">
                  Select the documents they must fix. They get an email listing these files and your notes.
                </p>
              </div>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="Overall message to the customer"
              />
              <ul className="space-y-2">
                {kycDocs.map((d) => (
                  <li key={d.id} className="rounded-xl bg-white/[0.03] p-3">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={Boolean(selectedMissing[d.id])}
                        onChange={(e) =>
                          setSelectedMissing((s) => ({ ...s, [d.id]: e.target.checked }))
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{d.label}</span>
                        {selectedMissing[d.id] && (
                          <input
                            value={docNotes[d.id] || ""}
                            onChange={(e) => setDocNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                            placeholder="What should they fix for this file?"
                            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs"
                          />
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(kycBusy)}
                  onClick={runRequestMore}
                  className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {kycBusy === "request" ? "Sending…" : "Notify customer"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(kycBusy)}
                  onClick={() => setShowRequestMore(false)}
                  className="btn-ghost rounded-xl px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {(status === CASE_STATUS.ACTIVE || status === CASE_STATUS.COMPLETED) && (
            <p className="text-sm text-emerald-300">
              {status === CASE_STATUS.COMPLETED ? "KYC approved · workflow completed" : "KYC approved"}
            </p>
          )}
          {c.kycStatus === KYC_STATUS.NEEDS_MORE && (
            <p className="text-sm text-amber-200">
              Waiting on customer — requested: {(c.kycMissingDocIds || []).join(", ") || "documents"}
            </p>
          )}
        </div>
      )}

      {tab === "workflow" && (
        <div className="space-y-4">
          {stageError && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {stageError}
            </p>
          )}
          {status === CASE_STATUS.COMPLETED && (
            <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
              All workflow stages are complete.
            </p>
          )}
          <ol className="space-y-3">
            {stages.map((s, i) => {
              const idx = Number(c.stageIndex) || 0;
              const done = i < idx;
              const active = i === idx;
              return (
                <li key={s.id} className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="text-emerald-400" size={18} />
                    ) : active ? (
                      <Loader2 className="animate-spin text-[var(--gold)]" size={18} />
                    ) : (
                      <Circle className="text-white/25" size={18} />
                    )}
                    <div>
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-xs text-white/40">{s.description}</div>
                    </div>
                  </div>
                  {active && status === CASE_STATUS.ACTIVE && (
                    <button
                      type="button"
                      disabled={stageBusy}
                      className="btn-gold rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                      onClick={async () => {
                        setStageError("");
                        setStageBusy(true);
                        try {
                          await setCaseStage(customerEmail, i + 1, note || undefined);
                          setNote("");
                        } catch (e) {
                          setStageError(toUserMessage(e, "We couldn't move this stage forward. Please try again."));
                        } finally {
                          setStageBusy(false);
                        }
                      }}
                    >
                      {stageBusy ? "Saving…" : "Mark complete"}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          {status !== CASE_STATUS.COMPLETED && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note when advancing stage"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium">Upload for customer</h3>
            <p className="mb-3 text-xs text-white/45">
              Name the document clearly so the customer knows what it is. PDF or image (JPG, PNG, WebP). Max 5 MB.
            </p>
            <div className="space-y-2">
              <input
                value={docLabel}
                onChange={(e) => {
                  setDocError("");
                  setDocLabel(e.target.value);
                }}
                placeholder="What is this file? e.g. IEC certificate, Shipping bill draft"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <input
                value={docNote}
                onChange={(e) => setDocNote(e.target.value)}
                placeholder="Optional note for the customer (e.g. Please review and confirm)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={docFileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                  className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white"
                  onChange={(e) => {
                    setDocError("");
                    const f = e.target.files?.[0] || null;
                    setDocFile(f);
                    if (f && !docLabel.trim()) {
                      const base = String(f.name || "")
                        .replace(/\.[^.]+$/, "")
                        .replace(/[_-]+/g, " ")
                        .trim();
                      if (base) setDocLabel(base);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!docFile || !docLabel.trim() || docUploading}
                  className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  onClick={async () => {
                    if (!docFile || !docLabel.trim() || docUploading) return;
                    setDocUploading(true);
                    setDocError("");
                    try {
                      await addOpsDocument(customerEmail, {
                        file: docFile,
                        label: docLabel.trim(),
                        note: docNote.trim() || undefined,
                        stageId: stages[c.stageIndex]?.id,
                      });
                      setDocFile(null);
                      setDocLabel("");
                      setDocNote("");
                      if (docFileInputRef.current) docFileInputRef.current.value = "";
                    } catch (e) {
                      setDocError(toUserMessage(e, USER_MESSAGES.upload));
                    } finally {
                      setDocUploading(false);
                    }
                  }}
                >
                  {docUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {docUploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
            {docFile && !docError && (
              <p className="mt-2 text-xs text-white/50">Selected file: {docFile.name}</p>
            )}
            {docError && <p className="mt-2 text-sm text-rose-300">{docError}</p>}
          </div>
          <ul className="space-y-2">
            {(c.documents || []).map((d) => {
              const fileId = d.fileId || d.driveFileId;
              const title = d.label || d.name;
              return (
                <li key={d.id} className="glass-card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <div className="min-w-0">
                    <span className="block truncate font-medium">{title}</span>
                    <span className="text-xs text-white/40">
                      {d.from}
                      {d.label && d.name && d.label !== d.name ? ` · ${d.name}` : ""}
                      {d.note ? ` · ${d.note}` : ""}
                    </span>
                  </div>
                  {fileId && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-ghost inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
                        disabled={fileBusy === fileId}
                        onClick={() => viewFile(d, { errorKey: "doc" })}
                      >
                        <Eye size={13} /> {fileBusy === fileId ? "Opening…" : "View"}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
                        disabled={fileBusy === `dl:${fileId}`}
                        onClick={() => downloadFile({ ...d, name: d.name || "document" }, { errorKey: "doc" })}
                      >
                        <Download size={13} /> Download
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
            {!(c.documents || []).length && (
              <li className="text-sm text-white/45">No documents uploaded yet.</li>
            )}
          </ul>
          <div className="border-t border-white/10 pt-4">
            <h3 className="mb-2 text-sm font-medium">Request missing document (rare)</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={reqLabel}
                onChange={(e) => setReqLabel(e.target.value)}
                placeholder="Document name"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <input
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                placeholder="Reason"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={!reqLabel.trim() || reqBusy}
                className="btn-ghost rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                onClick={async () => {
                  if (!reqLabel.trim() || reqBusy) return;
                  setReqBusy(true);
                  setReqError("");
                  try {
                    await requestDocument(customerEmail, { label: reqLabel, reason: reqReason });
                    setReqLabel("");
                    setReqReason("");
                  } catch (e) {
                    setReqError(toUserMessage(e, "We couldn't send that request. Please try again."));
                  } finally {
                    setReqBusy(false);
                  }
                }}
              >
                {reqBusy ? "Sending…" : "Request"}
              </button>
            </div>
            {reqError && <p className="mt-2 text-sm text-rose-300">{reqError}</p>}
            {(c.docRequests || []).filter((r) => r.status === "open").length > 0 && (
              <ul className="mt-3 space-y-1">
                {(c.docRequests || [])
                  .filter((r) => r.status === "open")
                  .map((r) => (
                    <li key={r.id} className="text-xs text-amber-200/80">
                      Open request: {r.label}
                      {r.reason ? ` — ${r.reason}` : ""}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div className="glass-card flex h-[420px] flex-col overflow-hidden">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {msgs.map((m) => (
              <div key={m.id} className={`text-sm ${m.fromRole === "customer" ? "text-white/70" : "text-[var(--gold)]/90"}`}>
                <span className="text-[10px] text-white/35">{m.fromName}: </span>
                {m.body}
              </div>
            ))}
            {!msgs.length && <p className="text-sm text-white/40">No messages yet.</p>}
          </div>
          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!chatBody.trim() || chatSending) return;
              setChatSending(true);
              try {
                await sendMessage({
                  customerEmail,
                  caseId: c.id,
                  fromRole: session?.role === ROLES.ADMIN ? "admin" : "operations",
                  fromName: session?.name,
                  fromEmail: session?.email,
                  body: chatBody,
                });
                setChatBody("");
              } catch {
                /* keep body for retry */
              } finally {
                setChatSending(false);
              }
            }}
          >
            <input
              value={chatBody}
              onChange={(e) => setChatBody(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              placeholder="Reply to customer…"
              disabled={chatSending}
            />
            <button type="submit" disabled={chatSending} className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      )}

      {filePreview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={filePreview.name}
          onClick={closeFilePreview}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d14] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-medium text-white/90">{filePreview.name}</p>
              <button
                type="button"
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={closeFilePreview}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-[50vh] flex-1 bg-black/40">
              {String(filePreview.type).startsWith("image/") ? (
                <img
                  src={filePreview.url}
                  alt={filePreview.name}
                  className="mx-auto max-h-[80vh] w-auto object-contain p-4"
                />
              ) : (
                <iframe
                  title={filePreview.name}
                  src={filePreview.url}
                  className="h-[80vh] w-full border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
