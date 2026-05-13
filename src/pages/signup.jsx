import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Building2, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { startEmailOtp, OTP_PURPOSE, setSignupDraft } from "@/lib/authSession";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 focus:border-[var(--gold)]/60 focus:bg-white/[0.07] outline-none pl-10 pr-3 py-2.5 text-sm placeholder:text-white/30 transition";

export default function SignupPage() {
  const router = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    const em = email.trim();
    if (!em) return;
    const { ok } = startEmailOtp(em, OTP_PURPOSE.CUSTOMER_SIGNUP);
    if (!ok) {
      setError("Could not send verification code. Try again.");
      return;
    }
    setSignupDraft({
      company: company.trim(),
      name: name.trim(),
      email: em,
    });
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router("/verify?mode=signup");
    }, 400);
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Verify your email with a one-time code — no password"
      footer={<>Already with us? <Link to="/login" className="text-[var(--gold)] hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input className={inputCls} placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="relative col-span-2">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="relative col-span-2">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="email" className={inputCls} placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <p className="text-[11px] text-white/45">By continuing you agree to VISTARA&apos;s Terms and Privacy.</p>
        <button disabled={loading} className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-black disabled:opacity-60">
          {loading ? "Sending code…" : (<>Continue with email code <ArrowRight size={15} /></>)}
        </button>
      </form>
    </AuthShell>
  );
}
