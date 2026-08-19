import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Building2, Phone, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { startEmailOtp, OTP_PURPOSE, setSignupDraft } from "@/lib/authSession";
import { toUserMessage } from "@/lib/friendlyError";
import { InlineNotice } from "@/components/FallbackScreen";
import { getOtpChannels, otpSendHint } from "@/lib/appConfig";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 focus:border-[var(--gold)]/60 focus:bg-white/[0.07] outline-none pl-10 pr-3 py-2.5 text-sm placeholder:text-white/30 transition";

export default function SignupPage() {
  const router = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const channels = getOtpChannels();
  const phoneRequired = Boolean(channels.whatsappOtp);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const em = email.trim();
    if (!em) return;
    const profile = {
      company: company.trim(),
      name: name.trim(),
      phone: phone.trim(),
    };
    if (phoneRequired && !profile.phone) {
      setError("Please add a mobile number so we can send your WhatsApp code.");
      return;
    }
    setLoading(true);
    const { ok, message, code } = await startEmailOtp(em, OTP_PURPOSE.CUSTOMER_SIGNUP, profile);
    if (!ok) {
      setError(
        code === "already_registered"
          ? "An account already exists for this email. Please sign in."
          : toUserMessage(message, "We couldn't send a verification code. Please try again.")
      );
      setLoading(false);
      return;
    }
    setSignupDraft({
      ...profile,
      email: em,
    });
    router("/verify?mode=signup");
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle={otpSendHint()}
      footer={<>Already with us? <Link to="/login" className="text-[var(--gold)] hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input className={inputCls} placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="relative col-span-2">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="relative col-span-2">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="email" className={inputCls} placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="relative col-span-2">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="tel"
              className={inputCls}
              placeholder="Mobile for WhatsApp (India +91)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required={phoneRequired}
            />
          </div>
        </div>
        {error && <InlineNotice>{error}</InlineNotice>}
        <p className="text-[11px] text-white/45">By continuing you agree to VIRASTRA by New India Export Terms and Privacy.</p>
        <button disabled={loading} className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-black disabled:opacity-60">
          {loading ? "Sending code…" : (<>Continue with a one-time code <ArrowRight size={15} /></>)}
        </button>
      </form>
    </AuthShell>
  );
}
