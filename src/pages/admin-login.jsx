import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import AdminAuthShell from "@/components/auth/AdminAuthShell";
import DemoLoginPanel, { staffDemoFilter } from "@/components/auth/DemoLoginPanel";
import { InlineNotice } from "@/components/FallbackScreen";
import {
  getSession,
  isStaffSession,
  startEmailOtp,
  OTP_PURPOSE,
  safeNextPath,
  workspaceFor,
} from "@/lib/authSession";
import { toUserMessage } from "@/lib/friendlyError";
import { otpSendHint, otpButtonLabel } from "@/lib/appConfig";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    // Only bounce already-signed-in staff. A leftover customer demo session
    // must not hijack /admin/login → /dashboard (or /dashboard/kyc).
    if (!session || !isStaffSession(session)) return;
    const next = safeNextPath(searchParams.get("next"));
    navigate(next.startsWith("/admin") ? next : workspaceFor(session.role), { replace: true });
  }, [navigate, searchParams]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    const { ok, message } = await startEmailOtp(trimmed, OTP_PURPOSE.STAFF_LOGIN);
    if (!ok) {
      setError(toUserMessage(message, "We couldn't send a code. Please try again."));
      setLoading(false);
      return;
    }
    const next = safeNextPath(searchParams.get("next"));
    navigate(`/verify?mode=staff&next=${encodeURIComponent(next.startsWith("/admin") ? next : "/admin")}`);
  };

  return (
    <AdminAuthShell
      title="Sign in to operations"
      subtitle={otpSendHint()}
      footer={
        <>
          New team member?{" "}
          <Link to="/admin/register" className="text-emerald-300 hover:underline">Request access</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={Mail} label="Official email" type="email" placeholder="you@newindiaexport.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <InlineNotice>{error}</InlineNotice>}
        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Sending code…" : (<>{otpButtonLabel(false)} <ArrowRight size={15} /></>)}
        </button>
        <p className="text-center text-[11px] text-white/40">
          Your role (operations or admin) comes from your <span className="text-white/70">approved</span> access request.
        </p>
      </form>
      <DemoLoginPanel filter={staffDemoFilter} />
    </AdminAuthShell>
  );
}

function Field({ icon: Icon, label, ...rest }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-white/55">{label}</span>
      <div className="mt-1.5 relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-emerald-300/40 transition">
        <Icon size={15} className="absolute left-3 text-white/45" />
        <input {...rest} required className="w-full bg-transparent pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/30 outline-none" />
      </div>
    </label>
  );
}
