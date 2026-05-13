import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import {
  verifyPendingEmailOtp,
  resendPendingEmailOtp,
  getPendingOtpInfo,
  OTP_PURPOSE,
  setSession,
  safeNextPath,
  hasCompletedKyc,
  clearSignupDraft,
  getSignupDraft,
  workspaceFor,
  resolveAdminLoginForEmail,
  ADMIN_STATUS,
} from "@/lib/authSession";

export default function VerifyPage() {
  const router = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const refs = useRef([]);

  const pending = typeof window !== "undefined" ? getPendingOtpInfo() : null;
  const nextParam = searchParams.get("next");

  useEffect(() => {
    if (!pending) {
      let fallback = "/login";
      if (mode === "signup") fallback = "/signup";
      if (mode === "staff") fallback = "/admin/login";
      router(fallback, { replace: true });
    }
  }, [pending, mode, router]);

  const setDigit = (i, v) => {
    const val = String(v).replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    const joined = code.join("");
    const result = verifyPendingEmailOtp(joined);
    if (!result.ok) {
      const msg =
        result.reason === "expired"
          ? "That code expired. Request a new one."
          : result.reason === "invalid"
          ? "Invalid code. Try again."
          : "Could not verify. Go back and request a new code.";
      setError(msg);
      return;
    }

    const { email, purpose } = result;

    if (purpose === OTP_PURPOSE.CUSTOMER_LOGIN) {
      const next = safeNextPath(nextParam);
      setSession({ email, name: "", phone: "" });
      const dest = hasCompletedKyc(email) ? next : "/dashboard/kyc";
      setLoading(true);
      setTimeout(() => router(dest), 500);
      return;
    }

    if (purpose === OTP_PURPOSE.CUSTOMER_SIGNUP) {
      const draft = getSignupDraft();
      if (!draft || String(draft.email || "").trim().toLowerCase() !== email) {
        setError("Signup session expired. Start again from sign up.");
        return;
      }
      setSession({
        email,
        name: draft.name || "",
        phone: "",
      });
      clearSignupDraft();
      setLoading(true);
      setTimeout(() => router(hasCompletedKyc(email) ? "/dashboard" : "/dashboard/kyc"), 500);
      return;
    }

    if (purpose === OTP_PURPOSE.STAFF_LOGIN) {
      const resolved = resolveAdminLoginForEmail(email);
      if (resolved.kind !== "ok") {
        const msg =
          resolved.kind === "no_request"
            ? "No approved workspace for this email yet. Submit an access request first."
            : resolved.kind === "pending"
            ? "Your access request is still pending approval. You’ll get email once it’s activated."
            : resolved.kind === "rejected"
            ? "This access request was not approved. Contact your administrator if you believe this is a mistake."
            : resolved.kind === "suspended"
            ? "This account is suspended. Contact platform governance."
            : "Unable to sign in with this email.";
        setError(msg);
        return;
      }
      const { request: req } = resolved;
      setSession({
        email: req.email,
        name: req.name || "",
        phone: req.phone || "",
        role: req.role,
        status: ADMIN_STATUS.ACTIVE,
      });
      setLoading(true);
      setTimeout(() => router(workspaceFor(req.role)), 500);
      return;
    }

    setError("Unknown verification flow. Start again.");
  };

  const onResend = () => {
    setError("");
    const r = resendPendingEmailOtp();
    if (r.ok) {
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } else {
      setError("Could not resend. Return to the previous step.");
    }
  };

  if (!pending) {
    return null;
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        <>
          Enter the 6-digit code we sent to <span className="text-white">{pending.email}</span>
        </>
      }
      footer={
        <>
          Didn&apos;t receive it?{" "}
          <button type="button" onClick={onResend} className="text-[var(--gold)] hover:underline">
            Resend code
          </button>
          {resent && <span className="ml-2 text-emerald-300 text-xs">Sent.</span>}
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {error && <p className="text-center text-xs text-rose-300">{error}</p>}
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
          <Link
            to={mode === "signup" ? "/signup" : mode === "staff" ? "/admin/login" : "/login"}
            className="hover:text-white"
          >
            ← Back
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
