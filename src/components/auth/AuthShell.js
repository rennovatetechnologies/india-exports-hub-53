import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Globe2, Sparkles } from "lucide-react";

export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden pt-28 pb-16 flex items-center">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-60" />
      <div className="absolute inset-0 -z-10 grid-bg" />
      <div className="pointer-events-none absolute -top-40 -left-32 h-[460px] w-[460px] rounded-full bg-[var(--gold)]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-32 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left brand panel */}
          <div className="hidden lg:block lg:col-span-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
              ← Back to vistara.com
            </Link>
            <h2 className="mt-8 text-5xl font-semibold tracking-tight leading-[1.05]">
              The export OS for <span className="text-aurora">global India.</span>
            </h2>
            <p className="mt-5 max-w-md text-white/60 leading-relaxed">
              One workspace for plans, KYC, DGFT, ICEGATE and shipment ops —
              built like a fintech, run like a global desk.
            </p>

            <ul className="mt-10 space-y-4 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg glass-strong text-[var(--gold)]"><ShieldCheck size={16} /></span>
                <div>
                  <div className="font-medium text-white">Compliance-grade workflows</div>
                  <div className="text-white/55">DGFT, ICEGATE, AD code, RCMC tracked end-to-end.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg glass-strong text-emerald-300"><Globe2 size={16} /></span>
                <div>
                  <div className="font-medium text-white">30+ destination markets</div>
                  <div className="text-white/55">From Nagpur to Rotterdam, in a single timeline.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg glass-strong text-cyan-300"><Sparkles size={16} /></span>
                <div>
                  <div className="font-medium text-white">White-glove operations</div>
                  <div className="text-white/55">Real humans, dedicated success managers.</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Right form card */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mx-auto w-full max-w-md"
            >
              <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-[var(--gold)]/40 via-white/10 to-emerald-400/20 opacity-60 blur-xl" />
              <div className="glass-card relative p-7 sm:p-8">
                <div className="text-center">
                  <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> VISTARA Account
                  </span>
                  <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
                  {subtitle && <p className="mt-2 text-sm text-white/55">{subtitle}</p>}
                </div>

                <div className="mt-7">{children}</div>

                {footer && (
                  <div className="mt-6 text-center text-sm text-white/55">{footer}</div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}