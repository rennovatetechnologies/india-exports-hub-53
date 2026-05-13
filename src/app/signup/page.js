"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Building2, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 focus:border-[var(--gold)]/60 focus:bg-white/[0.07] outline-none pl-10 pr-3 py-2.5 text-sm placeholder:text-white/30 transition";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start your export journey in under a minute"
      footer={<>Already with us? <Link href="/login" className="text-[var(--gold)] hover:underline">Sign in</Link></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); setLoading(true); setTimeout(() => router.push("/verify"), 600); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input className={inputCls} placeholder="Company name" required />
          </div>
          <div className="relative col-span-2">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input className={inputCls} placeholder="Full name" required />
          </div>
          <div className="relative col-span-2">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="email" className={inputCls} placeholder="Work email" required />
          </div>
          <div className="relative col-span-2">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="password" className={inputCls} placeholder="Create password" required />
          </div>
        </div>
        <p className="text-[11px] text-white/45">By continuing you agree to VISTARA's Terms and Privacy.</p>
        <button disabled={loading} className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-black">
          {loading ? "Creating…" : (<>Create account <ArrowRight size={15} /></>)}
        </button>
      </form>
    </AuthShell>
  );
}