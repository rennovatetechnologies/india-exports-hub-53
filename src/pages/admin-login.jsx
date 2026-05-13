import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import AdminAuthShell from "@/components/auth/AdminAuthShell";
import { startEmailOtp, OTP_PURPOSE } from "@/lib/authSession";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) return;
    const { ok } = startEmailOtp(trimmed, OTP_PURPOSE.STAFF_LOGIN);
    if (!ok) {
      setError("Could not send code. Try again.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/verify?mode=staff");
    }, 400);
  };

  return (
    <AdminAuthShell
      title="Sign in to operations"
      subtitle="Official email + one-time code — no password"
      footer={
        <>
          New team member?{" "}
          <Link to="/admin/register" className="text-emerald-300 hover:underline">Request access</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={Mail} label="Official email" type="email" placeholder="you@vistara.in" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Sending code…" : (<>Email me a sign-in code <ArrowRight size={15} /></>)}
        </button>
        <p className="text-center text-[11px] text-white/40">
          Your role (operations or admin) comes from your <span className="text-white/70">approved</span> access request — same as production once the API is wired.
        </p>
      </form>
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
