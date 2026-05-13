import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function VerifyPage() {
  const router = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  const setDigit = (i, v) => {
    const val = v(/\D/g, "", { replace: true }).slice(-1);
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router("/dashboard"), 700);
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code we just sent you"
      footer={
        <>
          Didn't receive it?{" "}
          <button className="text-[var(--gold)] hover:underline">Resend code</button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
              }}
              inputMode="numeric"
              maxLength={1}
              className="h-14 w-12 rounded-xl border border-white/10 bg-white/[0.03] text-center text-xl font-semibold text-white outline-none focus:border-[var(--gold)]/50 focus:bg-white/[0.05] transition"
            />
          ))}
        </div>
        <button
          disabled={loading || code.some((d) => !d)}
          className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify & continue"}
          <ArrowRight size={15} />
        </button>
        <div className="text-center text-xs text-white/50">
          <Link to="/login" className="hover:text-white">← Back to sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}