import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSession, markKycComplete } from "@/lib/authSession";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Building2, IdCard, Upload,
  ArrowLeft, ArrowRight, ShieldCheck, X, FileText
} from "lucide-react";

const STEPS = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "identity", label: "Identity", icon: IdCard },
  { id: "review", label: "Review", icon: ShieldCheck },
];

/** Shown in the KYC header — all of these must be uploaded before verification. */
const MANDATORY_KYC_UPLOADS = [
  "PAN",
  "Aadhaar",
  "Bank statement",
  "Photo",
  "Electricity bill",
];

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-white/35">{hint}</span>}
    </label>
  );
}
const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 focus:border-[var(--gold)]/60 focus:bg-white/[0.07] outline-none px-3.5 py-2.5 text-sm placeholder:text-white/30 transition";

function DocDrop({ title, desc, file, onFile }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-[11px] text-white/45">{desc}</div>
        </div>
        {file ? (
          <span className="flex items-center gap-2 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
            <FileText size={14} /> {file}
            <button onClick={() => onFile(null)} className="text-emerald-300/70 hover:text-white"><X size={12} /></button>
          </span>
        ) : (
          <button onClick={() => onFile("uploaded.pdf")} className="inline-flex items-center gap-2 rounded-lg glass px-3 py-1.5 text-xs hover:bg-white/10">
            <Upload size={13} /> Upload
          </button>
        )}
      </div>
    </div>
  );
}

const MANDATORY_DOC_KEYS = ["pan", "aadhaar", "bankStatement", "photo", "electricity"];

export default function KycWizardPage() {
  const navigate = useNavigate();
  const session = getSession();
  const alreadyDone = Boolean(session?.kycComplete);

  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState({
    pan: null,
    aadhaar: null,
    bankStatement: null,
    photo: null,
    electricity: null,
  });
  const set = (k) => (v) => setDocs((d) => ({ ...d, [k]: v }));

  const mandatoryUploaded = MANDATORY_DOC_KEYS.filter((k) => docs[k]).length;
  const allMandatoryDocs = mandatoryUploaded === MANDATORY_DOC_KEYS.length;

  const goto = (i) => setStep(Math.max(0, Math.min(STEPS.length - 1, i)));

  const onSubmitKyc = () => {
    if (!session?.email || !allMandatoryDocs) return;
    markKycComplete(session.email);
    navigate("/dashboard", { replace: true });
  };

  if (alreadyDone) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">Compliance</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">KYC complete</h1>
            <p className="mt-1 text-sm text-white/55">Your workspace is verified. You can continue with exports onboarding.</p>
          </div>
          <Link to="/dashboard" className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black">
            Go to overview
          </Link>
        </div>
        <div className="glass-card flex items-start gap-4 p-6">
          <ShieldCheck className="shrink-0 text-emerald-300" size={28} />
          <div>
            <p className="font-medium text-white">No further action needed</p>
            <p className="mt-1 text-sm text-white/55">We keep your submitted documents on file. Open the vault or workflow anytime from the sidebar.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Compliance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">KYC & Onboarding</h1>
          <p className="mt-1 text-sm text-white/55">Complete three steps to unlock DGFT &amp; ICEGATE workflows.</p>
        </div>
        <span className="text-xs text-white/45">Overview unlocks after you submit KYC.</span>
      </div>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">KYC upload</p>
        <p className="mt-2 text-sm text-white/80">The documents below are mandatory for verification.</p>
        <ul className="mt-3 grid list-inside list-disc gap-1.5 text-sm text-white/70 sm:grid-cols-2 sm:gap-x-8">
          {MANDATORY_KYC_UPLOADS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>

      {/* Stepper */}
      <div className="glass-card p-5">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.id}>
                <button
                  onClick={() => goto(i)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active ? "bg-white/10" : done ? "bg-emerald-400/5" : "bg-white/[0.03]"
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${active ? "bg-[var(--grad-gold)] text-black" : done ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-white/40"}`}>
                    {done ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
                  </span>
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Step {i + 1}</div>
                    <div className={`text-sm ${active ? "text-white" : done ? "text-emerald-200" : "text-white/60"}`}>{s.label}</div>
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

      {/* Step body */}
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
                  <Field label="Legal entity name"><input className={inputCls} placeholder="Aurora Exports Pvt Ltd" /></Field>
                  <Field label="Entity type">
                    <select className={inputCls}><option>Private Limited</option><option>LLP</option><option>Proprietorship</option><option>Partnership</option></select>
                  </Field>
                  <Field label="Date of incorporation"><input type="date" className={inputCls} /></Field>
                  <Field label="Annual turnover">
                    <select className={inputCls}><option>₹0 - 1 Cr</option><option>₹1 - 10 Cr</option><option>₹10 - 50 Cr</option><option>₹50 Cr+</option></select>
                  </Field>
                  <Field label="Registered address" hint="As per ROC records"><textarea rows={2} className={inputCls} /></Field>
                  <Field label="Operating city"><input className={inputCls} placeholder="Nagpur" /></Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold">Authorized signatory & identity</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name"><input className={inputCls} placeholder="Rohit Agarwal" /></Field>
                  <Field label="Designation"><input className={inputCls} placeholder="Director" /></Field>
                  <Field label="PAN"><input className={inputCls} placeholder="AAACR1234F" /></Field>
                  <Field label="Aadhaar (last 4)"><input className={inputCls} placeholder="•••• 1234" /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DocDrop title="PAN card" desc="Required · PDF or image · max 5MB" file={docs.pan} onFile={set("pan")} />
                  <DocDrop title="Aadhaar" desc="Required · front &amp; back combined" file={docs.aadhaar} onFile={set("aadhaar")} />
                  <DocDrop title="Bank statement" desc="Required · last 3 months · PDF" file={docs.bankStatement} onFile={set("bankStatement")} />
                  <DocDrop title="Photo" desc="Required · recent passport-size, plain background" file={docs.photo} onFile={set("photo")} />
                  <DocDrop title="Electricity bill" desc="Required · address proof · last 3 months" file={docs.electricity} onFile={set("electricity")} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold">Review & submit</h2>
                <p className="text-sm text-white/55">Our compliance desk verifies submissions within 1 business day.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Entity", "Aurora Exports Pvt Ltd"],
                    ["Signatory", "Rohit Agarwal · Director"],
                    [
                      "Mandatory KYC",
                      `${mandatoryUploaded} of ${MANDATORY_DOC_KEYS.length} documents uploaded`,
                    ],
                    ["SLA", "Verification within 24 hours"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-white/[0.03] p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{k}</div>
                      <div className="mt-1 text-sm">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-emerald-400/5 p-4 text-sm text-emerald-200">
                  <ShieldCheck size={18} /> All data is encrypted in transit and at rest. Audit-logged for compliance.
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
          <button
            onClick={() => goto(step - 1)}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2 text-sm disabled:opacity-30"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => goto(step + 1)} className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black">
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!allMandatoryDocs}
              onClick={onSubmitKyc}
              className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45"
            >
              Submit for verification <CheckCircle2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}