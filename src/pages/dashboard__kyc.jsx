import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Building2, IdCard, Banknote, FileBadge, Upload,
  ArrowLeft, ArrowRight, ShieldCheck, X, FileText
} from "lucide-react";

const STEPS = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "identity", label: "Identity", icon: IdCard },
  { id: "banking",  label: "Banking",  icon: Banknote },
  { id: "compliance", label: "Compliance", icon: FileBadge },
  { id: "review",   label: "Review",   icon: ShieldCheck },
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

export default function KycWizardPage() {
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState({ pan: null, aadhaar: null, gst: null, iec: null, bank: null, msme: null });
  const set = (k) => (v) => setDocs((d) => ({ ...d, [k]: v }));

  const goto = (i) => setStep(Math.max(0, Math.min(STEPS.length - 1, i)));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Compliance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">KYC & Onboarding</h1>
          <p className="mt-1 text-sm text-white/55">Complete five steps to unlock DGFT &amp; ICEGATE workflows.</p>
        </div>
        <Link to="/dashboard" className="text-xs text-white/55 hover:text-white">← Back to overview</Link>
      </div>

      {/* Stepper */}
      <div className="glass-card p-5">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
                  <DocDrop title="PAN card" desc="PDF or image · max 5MB" file={docs.pan} onFile={set("pan")} />
                  <DocDrop title="Aadhaar / Passport" desc="Front & back combined" file={docs.aadhaar} onFile={set("aadhaar")} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold">Banking & AD code</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Bank name"><input className={inputCls} placeholder="ICICI Bank" /></Field>
                  <Field label="Branch (AD enabled)"><input className={inputCls} placeholder="Nagpur · Sitabuldi" /></Field>
                  <Field label="Account number"><input className={inputCls} placeholder="•••• •••• 4421" /></Field>
                  <Field label="IFSC"><input className={inputCls} placeholder="ICIC0000123" /></Field>
                  <Field label="AD code"><input className={inputCls} placeholder="6390123-4500003" /></Field>
                  <Field label="SWIFT / BIC"><input className={inputCls} placeholder="ICICINBBCTS" /></Field>
                </div>
                <DocDrop title="Cancelled cheque / Bank letter" desc="Required for AD code mapping" file={docs.bank} onFile={set("bank")} />
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-semibold">Compliance documents</h2>
                <p className="text-sm text-white/55">Upload mandatory licenses. Optional documents help us pre-fill DGFT &amp; ICEGATE applications.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DocDrop title="GST Certificate" desc="Required" file={docs.gst} onFile={set("gst")} />
                  <DocDrop title="IEC Certificate" desc="Optional · we can apply for you" file={docs.iec} onFile={set("iec")} />
                  <DocDrop title="MSME / Udyam" desc="Optional" file={docs.msme} onFile={set("msme")} />
                  <DocDrop title="RCMC (if any)" desc="Optional" file={null} onFile={() => {}} />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-lg font-semibold">Review & submit</h2>
                <p className="text-sm text-white/55">Our compliance desk verifies submissions within 1 business day.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Entity", "Aurora Exports Pvt Ltd"],
                    ["Signatory", "Rohit Agarwal · Director"],
                    ["Bank", "ICICI · Nagpur · ••4421"],
                    ["AD Code", "6390123-4500003"],
                    ["Documents", `${Object.values(docs).filter(Boolean).length} of ${Object.keys(docs).length} uploaded`],
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
            <button className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black">
              Submit for verification <CheckCircle2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}