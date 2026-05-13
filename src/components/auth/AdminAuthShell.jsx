import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Activity } from "lucide-react";

export default function AdminAuthShell({ title, subtitle, badge = "Internal portal", footer, children }) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#05060a] text-white flex items-center py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(244,180,0,0.08),transparent_55%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:42px_42px] opacity-40" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8">
        <div className="hidden lg:col-span-6 lg:block">
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/45 hover:text-white">
            ← vistara.com
          </Link>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/65">
            <ShieldCheck size={12} className="text-emerald-300" /> {badge}
          </div>
          <h2 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight">
            Operations console for the <span className="text-aurora">VISTARA desk.</span>
          </h2>
          <p className="mt-5 max-w-md text-white/55 leading-relaxed">
            Secure, role-based workspace for the operations and leadership teams that
            run India&apos;s export pipeline end to end.
          </p>

          <ul className="mt-10 space-y-4 text-sm text-white/70">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-emerald-300"><Lock size={15} /></span>
              <div>
                <div className="font-medium text-white">SOC2-style controls</div>
                <div className="text-white/50">Hardware MFA, IP allowlists, audit trail on every action.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300"><Activity size={15} /></span>
              <div>
                <div className="font-medium text-white">Real-time queues</div>
                <div className="text-white/50">SLA-tracked cases, KYC review and escalations in one place.</div>
              </div>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-cyan-400/30 via-white/10 to-emerald-300/20 opacity-50 blur-xl" />
            <div className="relative rounded-[26px] border border-white/10 bg-[#0a0d14]/85 p-7 backdrop-blur-xl shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] sm:p-8">
              <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/65">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> {badge}
                </span>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-2 text-sm text-white/55">{subtitle}</p>}
              </div>

              <div className="mt-7">{children}</div>

              {footer && <div className="mt-6 text-center text-sm text-white/55">{footer}</div>}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}