import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp, FileCheck2, Workflow, Clock, ArrowUpRight,
  CheckCircle2, Circle, Loader2, Upload, AlertCircle
} from "lucide-react";
import { getSession } from "@/lib/authSession";

const STAGES = [
  { label: "IEC Issued", desc: "DGFT · 12 Apr", status: "done" },
  { label: "AD Code Registration", desc: "ICEGATE · in review", status: "active" },
  { label: "RCMC Application", desc: "APEDA · pending docs", status: "pending" },
  { label: "First Shipment", desc: "Nagpur → Rotterdam", status: "pending" },
];

const ACTIONS = [
  { title: "Upload GST certificate", meta: "KYC · required", icon: Upload, tone: "gold" },
  { title: "Sign AD code authorization", meta: "Bank · awaiting e-sign", icon: AlertCircle, tone: "amber" },
  { title: "Confirm HS code mapping", meta: "Spices · 0904.11", icon: FileCheck2, tone: "emerald" },
];

const ACTIVITY = [
  { who: "Operations · Priya", what: "submitted IEC application to DGFT", when: "2h ago" },
  { who: "You", what: "uploaded PAN card", when: "5h ago" },
  { who: "System", what: "verified bank account ICICI ••4421", when: "Yesterday" },
  { who: "Success · Karan", what: "scheduled shipment kickoff call", when: "2d ago" },
];

export default function DashboardOverview() {
  const session = getSession();
  const kycDone = Boolean(session?.kycComplete);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Workspace · Aurora Exports Pvt Ltd</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Good evening, Rohit</h1>
          <p className="mt-1 text-sm text-white/55">Here's where your export operation stands today.</p>
        </div>
        {kycDone ? (
          <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-200">
            <CheckCircle2 size={16} /> KYC verified
          </span>
        ) : (
          <Link to="/dashboard/kyc" className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black">
            Continue KYC <ArrowUpRight size={15} />
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active plan", value: "Standard · one-time", sub: "Paid in full · 12 Apr 2026", icon: TrendingUp, accent: "text-[var(--gold)]" },
          { label: "Onboarding", value: "62%", sub: "5 of 8 steps complete", icon: Workflow, accent: "text-emerald-300" },
          { label: "Documents", value: "14 / 22", sub: "8 pending review", icon: FileCheck2, accent: "text-cyan-300" },
          { label: "Avg response", value: "3h 12m", sub: "Success desk SLA", icon: Clock, accent: "text-fuchsia-300" },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card relative overflow-hidden p-5"
          >
            <div className="flex items-start justify-between">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">{c.label}</span>
              <c.icon size={16} className={c.accent} />
            </div>
            <div className="mt-3 text-2xl font-semibold">{c.value}</div>
            <div className="mt-1 text-xs text-white/45">{c.sub}</div>
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          </motion.div>
        ))}
      </div>

      {/* Workflow + side widgets */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Shipment workflow</h2>
              <p className="text-xs text-white/45">Case #VST-2041 · Spices to Rotterdam</p>
            </div>
            <Link to="/dashboard/workflow" className="text-xs text-[var(--gold)] hover:underline">View timeline →</Link>
          </div>

          <ol className="mt-6 space-y-5">
            {STAGES.map((s, i) => (
              <li key={s.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {s.status === "done" ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : s.status === "active" ? (
                    <Loader2 size={20} className="animate-spin text-[var(--gold)]" />
                  ) : (
                    <Circle size={20} className="text-white/20" />
                  )}
                  {i < STAGES.length - 1 && <span className="mt-1 h-12 w-px bg-white/10" />}
                </div>
                <div className="pb-2">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-white/45">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold">Next actions</h3>
            <ul className="mt-4 space-y-3">
              {ACTIONS.map((a) => (
                <li key={a.title} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                  <a.icon size={16} className={a.tone === "gold" ? "text-[var(--gold)]" : a.tone === "amber" ? "text-amber-300" : "text-emerald-300"} />
                  <div className="flex-1">
                    <div className="text-sm">{a.title}</div>
                    <div className="text-[11px] text-white/45">{a.meta}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="flex justify-between gap-3 border-b border-white/5 pb-3 last:border-none last:pb-0">
                  <div>
                    <span className="text-white/80">{a.who}</span>{" "}
                    <span className="text-white/50">{a.what}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-white/35">{a.when}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}