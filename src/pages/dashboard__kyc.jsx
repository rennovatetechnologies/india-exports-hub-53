import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Building2,
  IdCard,
  Upload,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  X,
  FileText,
  Clock,
} from "lucide-react";
import { getSession } from "@/lib/authSession";
import {
  getCustomerCase,
  getRequiredKycDocs,
  setKycUpload,
  clearKycUpload,
  setKycProfile,
  submitKyc,
  journeyStatus,
  CASE_STATUS,
  isWorkspaceUnlocked,
  KYC_STATUS,
  getKycActionDocs,
} from "@/lib/customerCase";
import { getPlanById } from "@/lib/planCatalog";
import { KYC_FILE_ACCEPT, validateKycFile, formatFileSize } from "@/lib/kycUploads";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";

const STEPS = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "identity", label: "Identity & docs", icon: IdCard },
  { id: "review", label: "Review", icon: ShieldCheck },
];

const EMPTY_PROFILE = {
  legalName: "",
  entityType: "Private Limited",
  incorporationDate: "",
  turnover: "₹0 - 1 Cr",
  registeredAddress: "",
  operatingCity: "",
  signatoryName: "",
  designation: "",
  panNumber: "",
  aadhaarNumber: "",
};

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_RE = /^\d{12}$/;

function normalizePan(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

function normalizeAadhaar(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 12);
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-white/35">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl bg-white/5 border border-white/10 focus:border-[var(--gold)]/60 focus:bg-white/[0.07] outline-none px-3.5 py-2.5 text-sm placeholder:text-white/30 transition";

function DocDrop({ title, desc, fileMeta, onPick, onClear, error, needsAction, reviewNote }) {
  const inputRef = useRef(null);
  const label = fileMeta?.name;
  const sizeLabel = fileMeta?.size ? formatFileSize(fileMeta.size) : "";
  const rejected = fileMeta?.reviewStatus === "rejected" || needsAction;
  const approved = fileMeta?.reviewStatus === "approved" && !needsAction;

  return (
    <div
      className={`rounded-2xl border border-dashed p-4 ${
        rejected
          ? "border-rose-400/40 bg-rose-400/[0.06]"
          : approved
            ? "border-emerald-400/25 bg-emerald-400/[0.04]"
            : "border-white/15 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium">{title}</div>
            {rejected && (
              <span className="rounded-md bg-rose-400/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-rose-200">
                Needs update
              </span>
            )}
            {approved && (
              <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                Approved
              </span>
            )}
          </div>
          <div className="text-[11px] text-white/45">{desc}</div>
          {reviewNote && <div className="mt-1 text-[11px] text-rose-200">Ops note: {reviewNote}</div>}
          {error && <div className="mt-1 text-[11px] text-rose-300">{error}</div>}
        </div>
        {label && !rejected ? (
          <span
            className={`flex max-w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
              approved ? "bg-emerald-400/10 text-emerald-300" : "bg-emerald-400/10 text-emerald-300"
            }`}
          >
            <FileText size={14} className="shrink-0" />
            <span className="truncate">
              {label}
              {sizeLabel ? ` · ${sizeLabel}` : ""}
            </span>
            {!approved && (
              <button type="button" onClick={onClear} className="shrink-0 text-emerald-300/70 hover:text-white" aria-label="Remove file">
                <X size={12} />
              </button>
            )}
          </span>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={KYC_FILE_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onPick(file);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg glass px-3 py-1.5 text-xs hover:bg-white/10"
            >
              <Upload size={13} /> {rejected && label ? "Replace file" : "Choose file"}
            </button>
          </>
        )}
      </div>
      {rejected && label && (
        <p className="mt-2 truncate text-[11px] text-white/40">Current file: {label} — replace it to continue</p>
      )}
    </div>
  );
}

export default function KycWizardPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [tick, setTick] = useState(0);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [fileErrors, setFileErrors] = useState({});
  const [uploadBusy, setUploadBusy] = useState(null);

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("iehub-case-updated", h);
    return () => window.removeEventListener("iehub-case-updated", h);
  }, []);

  const c = session?.email ? getCustomerCase(session.email) : null;
  const status = c ? journeyStatus(c) : CASE_STATUS.NO_PLAN;
  const plan = getPlanById(c?.paidPlanId || c?.planId);
  const required = c ? getRequiredKycDocs(c) : [];

  useEffect(() => {
    if (!session?.email || !c) return;
    const saved = c.kycProfile || {};
    setProfile({
      ...EMPTY_PROFILE,
      ...saved,
      legalName: saved.legalName || session?.company || "",
      signatoryName: saved.signatoryName || session?.name || "",
      panNumber: normalizePan(saved.panNumber || ""),
      aadhaarNumber: normalizeAadhaar(saved.aadhaarNumber || saved.aadhaar || ""),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email]);

  useEffect(() => {
    if (!session?.email) return;
    if (status === CASE_STATUS.NO_PLAN || status === CASE_STATUS.UNPAID || status === CASE_STATUS.EXPIRED) {
      navigate("/dashboard/billing", { replace: true });
    }
  }, [session?.email, status, navigate]);

  const requiredOnly = useMemo(() => required.filter((d) => d.required !== false), [required]);
  const actionDocs = useMemo(() => getKycActionDocs(c, required), [c, required]);
  const actionDocIds = useMemo(() => new Set(actionDocs.map((d) => d.id)), [actionDocs]);
  const allRequiredUploaded = requiredOnly.every((d) => {
    const up = c?.kycUploads?.[d.id];
    if (!up) return false;
    // Rejected files must be replaced (local status becomes pending after re-pick)
    if (up.reviewStatus === "rejected") return false;
    return true;
  });
  const actionDocsReady = actionDocs.every((d) => {
    const up = c?.kycUploads?.[d.id];
    return up && up.reviewStatus !== "rejected";
  });
  const canSubmitDocs = allRequiredUploaded && actionDocsReady;

  const businessOk =
    profile.legalName.trim() &&
    profile.registeredAddress.trim() &&
    profile.operatingCity.trim();
  const panNormalized = normalizePan(profile.panNumber);
  const aadhaarNormalized = normalizeAadhaar(profile.aadhaarNumber);
  const panValid = PAN_RE.test(panNormalized);
  const aadhaarValid = AADHAAR_RE.test(aadhaarNormalized);
  const identityOk =
    profile.signatoryName.trim() &&
    profile.designation.trim() &&
    panValid &&
    aadhaarValid;

  const goto = (i) => setStep(Math.max(0, Math.min(STEPS.length - 1, i)));

  /** Draft-safe payload: invalid PAN/Aadhaar become '' so tab clicks don't 400. */
  const buildProfilePayload = ({ requireIdentity = false } = {}) => {
    const panNumber = panValid ? panNormalized : "";
    const aadhaarNumber = aadhaarValid ? aadhaarNormalized : "";
    if (requireIdentity && (!panNumber || !aadhaarNumber)) {
      throw new Error(
        !panValid
          ? "Enter a valid PAN (e.g. AAACR1234F)"
          : "Enter a valid 12-digit Aadhaar number"
      );
    }
    return {
      legalName: String(profile.legalName || ""),
      entityType: String(profile.entityType || "Private Limited"),
      incorporationDate: String(profile.incorporationDate || ""),
      turnover: String(profile.turnover || ""),
      registeredAddress: String(profile.registeredAddress || ""),
      operatingCity: String(profile.operatingCity || ""),
      signatoryName: String(profile.signatoryName || ""),
      designation: String(profile.designation || ""),
      panNumber,
      aadhaarNumber,
      aadhaarLast4: aadhaarNumber ? aadhaarNumber.slice(-4) : "",
    };
  };

  const persistProfile = async ({ requireIdentity = false } = {}) => {
    if (!session?.email) return false;
    try {
      const payload = buildProfilePayload({ requireIdentity });
      await setKycProfile(session.email, payload);
      setSubmitError("");
      return true;
    } catch (e) {
      setSubmitError(toUserMessage(e, USER_MESSAGES.save));
      return false;
    }
  };

  const onPickFile = async (docId, file) => {
    if (!session?.email) return;
    const check = validateKycFile(file);
    if (!check.ok) {
      setFileErrors((e) => ({ ...e, [docId]: check.message }));
      return;
    }
    setFileErrors((e) => {
      const next = { ...e };
      delete next[docId];
      return next;
    });
    setUploadBusy(docId);
    try {
      await setKycUpload(session.email, docId, file);
    } catch (err) {
      setFileErrors((e) => ({ ...e, [docId]: toUserMessage(err, USER_MESSAGES.upload) }));
    } finally {
      setUploadBusy(null);
    }
  };

  const onClearFile = async (docId) => {
    if (!session?.email) return;
    setUploadBusy(docId);
    try {
      await clearKycUpload(session.email, docId);
    } catch (err) {
      setFileErrors((e) => ({ ...e, [docId]: toUserMessage(err, "We couldn't remove that file. Please try again.") }));
    } finally {
      setUploadBusy(null);
    }
    setFileErrors((e) => {
      const next = { ...e };
      delete next[docId];
      return next;
    });
  };

  const onNext = async () => {
    if (step === 0 && !businessOk) return;
    if (step === 1 && (!identityOk || !canSubmitDocs)) return;
    const saved = await persistProfile({ requireIdentity: step >= 1 });
    if (!saved) return;
    goto(step + 1);
  };

  const onSubmit = async () => {
    if (!session?.email || !businessOk || !identityOk || !canSubmitDocs) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const saved = await persistProfile({ requireIdentity: true });
      if (!saved) return;
      await submitKyc();
    } catch (e) {
      setSubmitError(toUserMessage(e, "We couldn't submit your details. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (isWorkspaceUnlocked(status)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">Compliance</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">KYC approved</h1>
            <p className="mt-1 text-sm text-white/55">
              Your details and documents are on file.
              {status === CASE_STATUS.COMPLETED
                ? " Your documentation workflow is complete."
                : " Ops is preparing your documentation pack."}
            </p>
          </div>
          <Link to="/dashboard" className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (status === CASE_STATUS.KYC_PENDING) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <Clock className="mx-auto text-[var(--gold)]" size={40} />
        <h1 className="text-2xl font-semibold">KYC under review</h1>
        <p className="text-sm text-white/55">
          {c?.opsName ? `${c.opsName} is reviewing your submission.` : "Operations is reviewing your submission."} You can
          message your desk or browse Events while you wait.
        </p>
        <p className="text-xs text-white/40">
          Submitted {c?.kycSubmittedAt ? new Date(c.kycSubmittedAt).toLocaleString("en-IN") : ""}
        </p>
        <Link
          to="/dashboard/messages"
          className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
        >
          Open chat
        </Link>
      </div>
    );
  }

  const setField = (key) => (e) => {
    let value = e.target.value;
    if (key === "panNumber") value = normalizePan(value);
    if (key === "aadhaarNumber") value = normalizeAadhaar(value);
    setProfile((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">
            {plan?.name || "Plan"} · Compliance
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {c?.kycStatus === KYC_STATUS.NEEDS_MORE ? "Update your KYC" : "KYC & onboarding"}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {c?.kycStatus === KYC_STATUS.NEEDS_MORE
              ? "Ops asked for updates on specific documents. Replace those files and resubmit."
              : "Fill business details, upload your plan’s documents, then submit for ops review."}
          </p>
        </div>
        <span className="text-xs text-white/45">Workspace unlocks after approval.</span>
      </div>

      {c?.kycStatus === KYC_STATUS.NEEDS_MORE && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200/90">Action needed</p>
          {c.kycRejectReason && <p className="mt-2 text-sm text-white/80">{c.kycRejectReason}</p>}
          {actionDocs.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {actionDocs.map((d) => (
                <li key={d.id} className="rounded-xl bg-black/20 px-3 py-2 text-sm">
                  <div className="font-medium text-rose-100">{d.label}</div>
                  {d.note && <div className="mt-0.5 text-xs text-white/55">{d.note}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-white/60">Please review your document checklist and re-upload unclear files.</p>
          )}
        </div>
      )}

      {required.length > 0 && c?.kycStatus !== KYC_STATUS.NEEDS_MORE && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
            {(c?.previousPlanIds || []).length ? "Remaining documents for upgrade" : "Documents for this plan"}
          </p>
          <ul className="mt-3 grid list-inside list-disc gap-1.5 text-sm text-white/70 sm:grid-cols-2 sm:gap-x-8">
            {required.map((d) => (
              <li key={d.id}>
                {d.label}
                {d.required === false ? " (optional)" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass-card p-5">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    void persistProfile({ requireIdentity: false });
                    goto(i);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active ? "bg-white/10" : done ? "bg-emerald-400/5" : "bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      active
                        ? "bg-[var(--grad-gold)] text-black"
                        : done
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-white/5 text-white/40"
                    }`}
                  >
                    {done ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
                  </span>
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Step {i + 1}</div>
                    <div className={`text-sm ${active ? "text-white" : done ? "text-emerald-200" : "text-white/60"}`}>
                      {s.label}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-[var(--grad-gold)]"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className="glass-card relative overflow-hidden p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {step === 0 && (
              <>
                <h2 className="text-lg font-semibold">Business details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Legal entity name">
                    <input
                      className={inputCls}
                      placeholder="Mehta Spices Pvt Ltd"
                      value={profile.legalName}
                      onChange={setField("legalName")}
                    />
                  </Field>
                  <Field label="Entity type">
                    <select className={inputCls} value={profile.entityType} onChange={setField("entityType")}>
                      <option>Private Limited</option>
                      <option>LLP</option>
                      <option>Proprietorship</option>
                      <option>Partnership</option>
                    </select>
                  </Field>
                  <Field label="Date of incorporation">
                    <input
                      type="date"
                      className={inputCls}
                      value={profile.incorporationDate}
                      onChange={setField("incorporationDate")}
                    />
                  </Field>
                  <Field label="Annual turnover">
                    <select className={inputCls} value={profile.turnover} onChange={setField("turnover")}>
                      <option>₹0 - 1 Cr</option>
                      <option>₹1 - 10 Cr</option>
                      <option>₹10 - 50 Cr</option>
                      <option>₹50 Cr+</option>
                    </select>
                  </Field>
                  <Field label="Registered address" hint="As per ROC records">
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={profile.registeredAddress}
                      onChange={setField("registeredAddress")}
                    />
                  </Field>
                  <Field label="Operating city">
                    <input
                      className={inputCls}
                      placeholder="Nagpur"
                      value={profile.operatingCity}
                      onChange={setField("operatingCity")}
                    />
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold">Authorized signatory &amp; documents</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name">
                    <input
                      className={inputCls}
                      placeholder="Priya Mehta"
                      value={profile.signatoryName}
                      onChange={setField("signatoryName")}
                    />
                  </Field>
                  <Field label="Designation">
                    <input
                      className={inputCls}
                      placeholder="Director"
                      value={profile.designation}
                      onChange={setField("designation")}
                    />
                  </Field>
                  <Field
                    label="PAN"
                    hint={
                      profile.panNumber && !panValid
                        ? "Must be 5 letters + 4 digits + 1 letter (e.g. AAACR1234F)"
                        : "Format: 5 letters + 4 digits + 1 letter (e.g. AAACR1234F)"
                    }
                  >
                    <input
                      className={`${inputCls}${profile.panNumber && !panValid ? " border-rose-400/50" : ""}`}
                      placeholder="AAACR1234F"
                      maxLength={10}
                      autoComplete="off"
                      spellCheck={false}
                      value={profile.panNumber}
                      onChange={setField("panNumber")}
                    />
                  </Field>
                  <Field
                    label="Aadhaar number"
                    hint={
                      profile.aadhaarNumber && !aadhaarValid
                        ? "Must be exactly 12 digits"
                        : "12-digit Aadhaar as on your card"
                    }
                  >
                    <input
                      className={`${inputCls}${profile.aadhaarNumber && !aadhaarValid ? " border-rose-400/50" : ""}`}
                      placeholder="1234 5678 9012"
                      inputMode="numeric"
                      maxLength={12}
                      autoComplete="off"
                      value={profile.aadhaarNumber}
                      onChange={setField("aadhaarNumber")}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {required.map((doc) => {
                    const up = c?.kycUploads?.[doc.id] || null;
                    const needsAction =
                      actionDocIds.has(doc.id) || up?.reviewStatus === "rejected";
                    return (
                      <DocDrop
                        key={doc.id}
                        title={`${doc.label}${doc.required === false ? " (optional)" : ""}`}
                        desc={
                          needsAction
                            ? "Please upload a clearer / corrected file · PDF or image · max 5MB"
                            : doc.required === false
                              ? "Optional · PDF or image (JPG, PNG, WebP) · max 5MB"
                              : "Required · PDF or image (JPG, PNG, WebP) · max 5MB"
                        }
                        fileMeta={up}
                        needsAction={needsAction}
                        reviewNote={up?.reviewNote || (needsAction ? actionDocs.find((a) => a.id === doc.id)?.note : "")}
                        error={uploadBusy === doc.id ? "Uploading to server…" : fileErrors[doc.id]}
                        onPick={(file) => onPickFile(doc.id, file)}
                        onClear={() => onClearFile(doc.id)}
                      />
                    );
                  })}
                  {!required.length && (
                    <p className="text-sm text-white/45 sm:col-span-2">No additional documents for this plan.</p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold">Review &amp; submit</h2>
                <p className="text-sm text-white/55">
                  Our compliance desk verifies submissions within 1 business day. Workspace stays locked until approved.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Entity", profile.legalName || "—"],
                    ["Type / city", `${profile.entityType} · ${profile.operatingCity || "—"}`],
                    ["Signatory", `${profile.signatoryName || "—"} · ${profile.designation || "—"}`],
                    ["PAN", profile.panNumber || "—"],
                    [
                      "Aadhaar",
                      profile.aadhaarNumber
                        ? profile.aadhaarNumber.replace(/(\d{4})(?=\d)/g, "$1 ")
                        : "—",
                    ],
                    [
                      "Documents",
                      `${requiredOnly.filter((d) => c?.kycUploads?.[d.id]).length} of ${requiredOnly.length} required uploaded`,
                    ],
                    ["Plan", plan?.name || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-white/[0.03] p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{k}</div>
                      <div className="mt-1 text-sm">{v}</div>
                    </div>
                  ))}
                </div>
                {(!businessOk || !identityOk || !canSubmitDocs) && (
                  <p className="text-xs text-amber-200/90">
                    Complete business details, signatory fields, and all required documents before submitting.
                  </p>
                )}
                {submitError ? <p className="text-xs text-rose-300">{submitError}</p> : null}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => {
              persistProfile();
              goto(step - 1);
            }}
            className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm disabled:opacity-30"
          >
            <ArrowLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={onNext}
              disabled={(step === 0 && !businessOk) || (step === 1 && (!identityOk || !canSubmitDocs))}
              className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || !businessOk || !identityOk || !canSubmitDocs}
              className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          )}
        </div>
        {submitError && step !== 2 ? (
          <p className="mt-3 text-xs text-rose-300">{submitError}</p>
        ) : null}
      </div>
    </div>
  );
}
