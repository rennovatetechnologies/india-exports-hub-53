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
  markKycComplete,
} from "@/lib/authSession";
import { api } from "@/lib/api";

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

  const applySession = (session, fallback = {}) => {
    const s = { ...fallback, ...(session || {}) };
    setSession({
      email: s.email,
      name: s.name || "",
      phone: s.phone || "",
      company: s.company || "",
      role: s.role,
      status: s.status || ADMIN_STATUS.ACTIVE,
      token: s.token,
      kycComplete: s.kycComplete,
    });
    if (s.kycComplete && s.email) markKycComplete(s.email);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const joined = code.join("");
    try {
      const result = await verifyPendingEmailOtp(joined);
      if (!result.ok) {
        const msg =
          result.reason === "expired"
            ? "That code expired. Request a new one."
            : result.reason === "invalid"
            ? "Invalid code. Try again."
            : "Could not verify. Go back and request a new code.";
        setError(msg);
        setLoading(false);
        return;
      }

      const { email, purpose } = result;

      if (purpose === OTP_PURPOSE.CUSTOMER_LOGIN) {
        if (result.session) {
          applySession(result.session, { token: result.token });
        } else if (result.api?.needsSignup) {
          setError("No account for this email. Please sign up first.");
          setLoading(false);
          return;
        } else {
          setError("Sign-in failed. Ensure the backend issued a session for this email.");
          setLoading(false);
          return;
        }
        const next = safeNextPath(nextParam);
        const kycOk = result.session?.kycComplete ?? hasCompletedKyc(email);
        router(kycOk ? next : "/dashboard/kyc");
        return;
      }

      if (purpose === OTP_PURPOSE.CUSTOMER_SIGNUP) {
        const draft = getSignupDraft();
        if (!draft || String(draft.email || "").trim().toLowerCase() !== email) {
          setError("Signup session expired. Start again from sign up.");
          setLoading(false);
          return;
        }
        try {
          const data = await api("/api/auth/customer/signup", {
            method: "POST",
            auth: false,
            body: {
              email,
              name: draft.name || "",
              company: draft.company || "",
              phone: draft.phone || "",
            },
          });
          applySession(data.session || { ...data.user, token: data.token }, { token: data.token });
          clearSignupDraft();
          const kycOk = data.session?.kycComplete ?? data.kycComplete ?? hasCompletedKyc(email);
          router(kycOk ? "/dashboard" : "/dashboard/kyc");
        } catch (err) {
          setError(err.message || "Could not create account. Is the backend running?");
          setLoading(false);
        }
        return;
      }

      if (purpose === OTP_PURPOSE.STAFF_LOGIN) {
        if (result.kind === "ok" || result.api?.kind === "ok") {
          const apiData = result.api || result;
          const session = apiData.session;
          if (session) {
            applySession(session, { token: result.token || apiData.token });
            router(workspaceFor(session.role));
            return;
          }
        }
        if (result.kind && result.kind !== "ok") {
          const resolved = { kind: result.kind };
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
          setLoading(false);
          return;
        }
        // Fallback local resolve
        const resolved = resolveAdminLoginForEmail(email);
        if (resolved.kind !== "ok") {
          const msg =
            resolved.kind === "no_request"
              ? "No approved workspace for this email yet. Submit an access request first."
              : resolved.kind === "pending"
              ? "Your access request is still pending approval."
              : "Unable to sign in with this email.";
          setError(msg);
          setLoading(false);
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
        router(workspaceFor(req.role));
        return;
      }

      setError("Unknown verification flow. Start again.");
      setLoading(false);
    } catch (err) {
      setError(err.message || "Verification failed");
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError("");
    const r = await resendPendingEmailOtp();
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
