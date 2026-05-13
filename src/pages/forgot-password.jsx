import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { startEmailOtp, OTP_PURPOSE, safeNextPath } from "@/lib/authSession";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) return;
    const { ok } = startEmailOtp(trimmed, OTP_PURPOSE.CUSTOMER_LOGIN);
    if (!ok) {
      setError("Could not send a code. Try again.");
      return;
    }
    setLoading(true);
    const next = safeNextPath(searchParams.get("next"));
    setTimeout(() => {
      setLoading(false);
      navigate(`/verify?mode=login&next=${encodeURIComponent(next)}`);
    }, 400);
  };

  return (
    <AuthShell
      title="Sign in with email"
      subtitle="We use one-time codes only — no passwords. Enter your work email and we’ll send a sign-in code."
      footer={
        <>
          <Link to="/login" className="text-[var(--gold)] hover:underline">Back to sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-white/55">Work email</span>
          <div className="mt-1.5 relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-[var(--gold)]/50 transition">
            <Mail size={15} className="absolute left-3 text-white/45" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-transparent pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            />
          </div>
        </label>
        <button
          disabled={loading}
          className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Sending…" : "Email me a sign-in code"} <ArrowRight size={15} />
        </button>
      </form>
    </AuthShell>
  );
}
