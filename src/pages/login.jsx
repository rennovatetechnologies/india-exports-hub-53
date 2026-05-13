import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { setSession, safeNextPath, hasCompletedKyc } from "@/lib/authSession";

export default function LoginPage() {
  const router = useNavigate();
  const [searchParams] = useSearchParams();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const next = safeNextPath(searchParams.get("next"));
    setSession({ email, name: "", phone: "" });
    const dest = hasCompletedKyc(email) ? next : "/dashboard/kyc";
    setTimeout(() => router(dest), 700);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your VISTARA workspace"
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
        <Field
          icon={Lock}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          label="Password"
          right={
            <button type="button" onClick={() => setShow(!show)} className="text-white/50 hover:text-white">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 text-white/60">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-white/20 bg-white/5" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-white/60 hover:text-white">Forgot password?</Link>
        </div>

        <button
          disabled={loading}
          className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
          <ArrowRight size={15} />
        </button>
      </form>
    </AuthShell>
  );
}

function Field({ icon: Icon, label, right, ...rest }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-white/55">{label}</span>
      <div className="mt-1.5 relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-[var(--gold)]/50 focus-within:bg-white/[0.05] transition">
        <Icon size={15} className="absolute left-3 text-white/45" />
        <input
          {...rest}
          required
          className="w-full bg-transparent pl-9 pr-10 py-3 text-sm text-white placeholder:text-white/30 outline-none"
        />
        {right && <div className="absolute right-3">{right}</div>}
      </div>
    </label>
  );
}