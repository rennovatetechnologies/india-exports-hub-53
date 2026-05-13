import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, User, Building2, IdCard, ArrowRight, CheckCircle2 } from "lucide-react";
import AdminAuthShell from "@/components/auth/AdminAuthShell";
import {
  addAdminRequest,
  ROLES,
  startEmailOtp,
  OTP_PURPOSE,
  setStaffRegisterDraft,
  getStaffRegisterDraft,
  clearStaffRegisterDraft,
  verifyPendingEmailOtp,
  clearPendingEmailOtp,
} from "@/lib/authSession";

const ROLE_OPTIONS = [
  { value: ROLES.OPERATIONS, label: "Operations Admin", desc: "Run customer cases and workflow ops." },
  { value: ROLES.ADMIN, label: "Admin", desc: "Restricted — pricing, RBAC and revenue controls.", restricted: true },
];

export default function AdminRegisterPage() {
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: ROLES.OPERATIONS,
    department: "",
    employeeId: "",
    reason: "",
  });
  const [submitted, setSubmitted] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef([]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const goToOtp = (e) => {
    e.preventDefault();
    setOtpError("");
    const em = form.email.trim();
    if (!em) return;
    const { ok } = startEmailOtp(em, OTP_PURPOSE.STAFF_REGISTER);
    if (!ok) {
      setOtpError("Could not send verification email. Try again.");
      return;
    }
    setStaffRegisterDraft({ ...form, email: em });
    setCode(["", "", "", "", "", ""]);
    setStep("otp");
  };

  const setDigit = (i, v) => {
    const val = String(v).replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const submitVerifiedRequest = () => {
    setOtpError("");
    const joined = code.join("");
    const result = verifyPendingEmailOtp(joined);
    if (!result.ok) {
      const msg =
        result.reason === "expired"
          ? "Code expired. Go back and request a new one."
          : result.reason === "invalid"
          ? "Invalid code."
          : "Verification failed. Try again.";
      setOtpError(msg);
      return;
    }
    const draft = getStaffRegisterDraft();
    const key = String(result.email || "").trim().toLowerCase();
    if (!draft || String(draft.email || "").trim().toLowerCase() !== key) {
      setOtpError("Session expired. Start again from the form.");
      return;
    }
    const created = addAdminRequest({
      ...draft,
      emailVerified: true,
    });
    clearStaffRegisterDraft();
    setSubmitted(created);
    setStep("done");
  };

  const cancelOtp = () => {
    clearPendingEmailOtp();
    clearStaffRegisterDraft();
    setStep("details");
    setOtpError("");
  };

  if (submitted) {
    return (
      <AdminAuthShell
        title="Request submitted"
        subtitle={
          submitted.role === ROLES.ADMIN
            ? "An existing admin will review your request before you can sign in."
            : "Your access is awaiting admin review"
        }
      >
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto text-emerald-300" size={36} />
          <p className="text-sm text-white/65">
            We&apos;ve queued <span className="text-white">{submitted.name}</span> for approval.
            Work email is verified; an admin will activate <span className="text-white">{submitted.email}</span> when approved.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs text-white/55">
            <div className="flex justify-between"><span>Request ID</span><span className="text-white">{submitted.id}</span></div>
            <div className="mt-1.5 flex justify-between"><span>Requested role</span><span className="text-white capitalize">{submitted.role}</span></div>
            <div className="mt-1.5 flex justify-between"><span>Status</span><span className="text-amber-300">Pending Approval</span></div>
          </div>
          <Link to="/admin/login" className="inline-flex items-center gap-2 text-emerald-300 hover:underline text-sm">
            Back to sign in <ArrowRight size={14} />
          </Link>
        </div>
      </AdminAuthShell>
    );
  }

  if (step === "otp") {
    return (
      <AdminAuthShell
        title="Verify work email"
        subtitle={
          <>
            Enter the 6-digit code we sent to <span className="text-white">{form.email.trim()}</span>. Your request is only filed after this step.
          </>
        }
        footer={
          <>
            Wrong email?{" "}
            <button type="button" onClick={cancelOtp} className="text-emerald-300 hover:underline">
              Edit details
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {otpError && <p className="text-xs text-rose-300">{otpError}</p>}
          <div className="flex justify-between gap-2">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
                }}
                inputMode="numeric"
                maxLength={1}
                className="h-12 w-10 rounded-xl border border-white/10 bg-white/[0.03] text-center text-lg font-semibold text-white outline-none focus:border-emerald-300/40 sm:h-14 sm:w-12 sm:text-xl"
              />
            ))}
          </div>
          <button
            type="button"
            disabled={code.some((c) => !c)}
            onClick={submitVerifiedRequest}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            Verify &amp; submit request <ArrowRight size={15} />
          </button>
        </div>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      title="Request internal access"
      subtitle="Verify your work email, then an admin approves your workspace"
      footer={
        <>
          Already have access?{" "}
          <Link to="/admin/login" className="text-emerald-300 hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={goToOtp} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field icon={User} label="Full name" placeholder="Riya Mehta" value={form.name} onChange={update("name")} />
          <Field icon={IdCard} label="Employee ID" placeholder="VST-220" value={form.employeeId} onChange={update("employeeId")} required={false} />
        </div>
        <Field icon={Mail} label="Official email" type="email" placeholder="you@vistara.in" value={form.email} onChange={update("email")} />
        <div className="grid grid-cols-2 gap-3">
          <Field icon={Phone} label="Mobile" placeholder="+91 9XXXX XXXXX" value={form.phone} onChange={update("phone")} />
          <Field icon={Building2} label="Department" placeholder="Compliance ops" value={form.department} onChange={update("department")} />
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-white/55">Requested role</span>
          <div className="mt-2 grid gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const active = form.role === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`text-left rounded-xl border px-4 py-3 transition ${
                    active ? "border-emerald-300/40 bg-emerald-300/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{opt.label}</span>
                    {opt.restricted && (
                      <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">Restricted</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-white/50">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-white/55">Reason for access</span>
          <textarea
            value={form.reason}
            onChange={update("reason")}
            required
            rows={3}
            placeholder="Why do you need this workspace?"
            className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-300/40"
          />
        </label>

        {otpError && <p className="text-xs text-rose-300">{otpError}</p>}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-black hover:opacity-90">
          Send email code &amp; continue <ArrowRight size={15} />
        </button>
        <p className="text-center text-[11px] text-white/40">
          You&apos;ll confirm a one-time code sent to your official email before the request enters the approval queue.
        </p>
      </form>
    </AdminAuthShell>
  );
}

function Field({ icon: Icon, label, required = true, ...rest }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-white/55">{label}</span>
      <div className="mt-1.5 relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-emerald-300/40 transition">
        <Icon size={15} className="absolute left-3 text-white/45" />
        <input {...rest} required={required} className="w-full bg-transparent pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
      </div>
    </label>
  );
}
