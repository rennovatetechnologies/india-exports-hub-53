import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 700);
  };

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={sent ? "We sent you a secure reset link." : "Enter your work email and we'll send a reset link."}
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="text-[var(--gold)] hover:underline">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-emerald-300" size={28} />
          <p className="text-sm text-white/70">Open the email and follow the secure link to set a new password.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-white/55">Work email</span>
            <div className="mt-1.5 relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-[var(--gold)]/50 transition">
              <Mail size={15} className="absolute left-3 text-white/45" />
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="w-full bg-transparent pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>
          </label>
          <button
            disabled={loading}
            className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"} <ArrowRight size={15} />
          </button>
        </form>
      )}
    </AuthShell>
  );
}