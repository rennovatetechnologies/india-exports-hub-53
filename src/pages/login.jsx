import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import DemoLoginPanel from "@/components/auth/DemoLoginPanel";
import { InlineNotice } from "@/components/FallbackScreen";
import {
  getSession,
  isStaffSession,
  startEmailOtp,
  OTP_PURPOSE,
  safeNextPath,
  customerPostLoginPath,
  workspaceFor,
} from "@/lib/authSession";
import { toUserMessage } from "@/lib/friendlyError";

export default function LoginPage() {
  const router = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    // Staff already signed in → their workspace. Customers → dashboard (never marketing home).
    if (isStaffSession(session)) {
      router(workspaceFor(session.role), { replace: true });
      return;
    }
    router(customerPostLoginPath(searchParams.get("next")), { replace: true });
  }, [router, searchParams]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) return;
    const rawNext = safeNextPath(searchParams.get("next"));
    const next =
      rawNext.startsWith("/dashboard") || rawNext.startsWith("/admin")
        ? rawNext
        : "/dashboard";
    setLoading(true);
    const { ok, message } = await startEmailOtp(trimmed, OTP_PURPOSE.CUSTOMER_LOGIN);
    if (!ok) {
      setError(toUserMessage(message, "We couldn't start sign-in. Please try again."));
      setLoading(false);
      return;
    }
    router(`/verify?mode=login&next=${encodeURIComponent(next)}`);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="We’ll email you a one-time code — no password"
      footer={
        <>
          New to VIRASTRA INTERNATIONAL EXPORT?{" "}
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

        {error && <InlineNotice>{error}</InlineNotice>}

        <button
          disabled={loading}
          className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Sending code…" : "Email me a sign-in code"}
          <ArrowRight size={15} />
        </button>
      </form>
      <DemoLoginPanel />
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
