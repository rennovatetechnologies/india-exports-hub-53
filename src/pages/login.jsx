import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { startEmailOtp, OTP_PURPOSE, safeNextPath } from "@/lib/authSession";

export default function LoginPage() {
  const router = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) return;
    const next = safeNextPath(searchParams.get("next"));
    const { ok } = startEmailOtp(trimmed, OTP_PURPOSE.CUSTOMER_LOGIN);
    if (!ok) {
      setError("Could not start sign-in. Try again.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router(`/verify?mode=login&next=${encodeURIComponent(next)}`);
    }, 400);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="We’ll email you a one-time code — no password"
      footer={
        <>
          New to VISTARA?{" "}
          <Link to="/signup" className="text-[var(--gold)] hover:underline">Create an account</Link>
          <div className="mt-3 text-[11px] text-white/45">
            Internal team?{" "}
            <Link to="/admin/login" className="text-emerald-300 hover:underline">Operations sign in</Link>
          </div>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          icon={Mail}
          type="email"
          placeholder="you@company.com"
          label="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Sign-in is always email + OTP.</span>
          <Link to="/forgot-password" className="text-white/60 hover:text-white">Didn’t get a code?</Link>
        </div>

        {error && <p className="text-xs text-rose-300">{error}</p>}

        <button
          disabled={loading}
          className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Sending code…" : "Email me a sign-in code"}
          <ArrowRight size={15} />
        </button>
      </form>
    </AuthShell>
  );
}

function Field({ icon: Icon, label, ...rest }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-white/55">{label}</span>
      <div className="mt-1.5 relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-[var(--gold)]/50 focus-within:bg-white/[0.05] transition">
        <Icon size={15} className="absolute left-3 text-white/45" />
        <input
          {...rest}
          required
          className="w-full bg-transparent pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/30 outline-none"
        />
      </div>
    </label>
  );
}
