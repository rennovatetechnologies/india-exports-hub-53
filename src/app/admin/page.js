"use client";
import { motion } from "framer-motion";
import { Users, Briefcase, IndianRupee, AlertTriangle, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";

const STATS = [
  { label: "Active customers", value: "284", delta: "+12 this week", icon: Users },
  { label: "Open cases", value: "47", delta: "9 due today", icon: Briefcase },
  { label: "MTD revenue", value: "₹38.4L", delta: "+18% MoM", icon: IndianRupee },
  { label: "SLA breaches", value: "3", delta: "−2 vs last week", icon: AlertTriangle },
];

const CASES = [
  { id: "VST-2041", customer: "Anil Sharma", company: "Sharma Spices Pvt Ltd", stage: "AD code registration", sla: "On track", owner: "Riya M.", updated: "2h ago" },
  { id: "VST-2039", customer: "Priya Nair", company: "Coastal Organics", stage: "ICEGATE filing", sla: "Due today", owner: "Karan S.", updated: "20m ago" },
  { id: "VST-2036", customer: "Mohit Verma", company: "Verma Agro Exports", stage: "IEC issuance", sla: "Breached", owner: "Riya M.", updated: "1d ago" },
  { id: "VST-2033", customer: "Lakshmi Iyer", company: "Iyer Foods", stage: "RCMC pending", sla: "On track", owner: "Aman P.", updated: "5h ago" },
  { id: "VST-2030", customer: "Rohan Gupta", company: "Saffron Trade Co.", stage: "KYC review", sla: "On track", owner: "Karan S.", updated: "3h ago" },
];

const KYC = [
  { customer: "Aarav Mehta", doc: "GST certificate", priority: "High", waiting: "2d" },
  { customer: "Sneha Rao", doc: "Bank cancelled cheque", priority: "Medium", waiting: "1d" },
  { customer: "Vivek Shah", doc: "PAN + Aadhaar", priority: "High", waiting: "3h" },
];

const TEAM = [
  { name: "Riya M.", role: "Senior ops", load: 12, capacity: 15 },
  { name: "Karan S.", role: "Ops", load: 9, capacity: 12 },
  { name: "Aman P.", role: "Ops", load: 7, capacity: 12 },
  { name: "Neha T.", role: "Compliance", load: 4, capacity: 10 },
];

const slaColor = (s) =>
  s === "Breached" ? "bg-rose-400/10 text-rose-300" : s === "Due today" ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> Operations console
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Workspace overview</h1>
          <p className="mt-1 text-sm text-white/55">Internal command center for the VISTARA ops team.</p>
        </div>
        <button className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold">New case <ArrowUpRight size={13} /></button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, delta, icon: Icon }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/45">{label}</span>
              <Icon size={16} className="text-[var(--gold)]" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-[11px] text-white/50">{delta}</div>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Active cases</h3>
            <input placeholder="Search cases…" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[var(--gold)]/50" />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-white/40">
                <tr><th className="py-2 pr-4">Case</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Stage</th><th className="py-2 pr-4">SLA</th><th className="py-2 pr-4">Owner</th><th className="py-2">Updated</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {CASES.map((c) => (
                  <tr key={c.id} className="text-white/75 hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 font-medium text-white">{c.id}</td>
                    <td className="py-3 pr-4">
                      <div className="text-white">{c.customer}</div>
                      <div className="text-[11px] text-white/45">{c.company}</div>
                    </td>
                    <td className="py-3 pr-4">{c.stage}</td>
                    <td className="py-3 pr-4"><span className={`rounded-full px-2 py-0.5 text-[10px] ${slaColor(c.sla)}`}>{c.sla}</span></td>
                    <td className="py-3 pr-4">{c.owner}</td>
                    <td className="py-3 text-[11px] text-white/50">{c.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">KYC review queue</h3>
          <ul className="mt-4 space-y-3">
            {KYC.map((k) => (
              <li key={k.customer} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{k.customer}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${k.priority === "High" ? "bg-rose-400/10 text-rose-300" : "bg-amber-400/10 text-amber-300"}`}>{k.priority}</span>
                </div>
                <div className="mt-1 text-xs text-white/55">{k.doc}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> waiting {k.waiting}</span>
                  <button className="text-[var(--gold)] hover:underline">Review</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Team capacity</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((t) => {
            const pct = Math.round((t.load / t.capacity) * 100);
            const tone = pct > 85 ? "bg-rose-400" : pct > 65 ? "bg-amber-400" : "bg-emerald-400";
            return (
              <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-[11px] text-white/45">{t.role}</div>
                  </div>
                  <CheckCircle2 size={14} className="text-white/30" />
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 text-[11px] text-white/50">{t.load} / {t.capacity} cases · {pct}%</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}