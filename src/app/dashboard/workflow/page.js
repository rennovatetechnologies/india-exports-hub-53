"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Loader2, Circle, Ship, FileCheck2, Building2,
  Banknote, Globe2, PackageCheck, ClipboardList, MessageSquare, Paperclip
} from "lucide-react";

const CASES = [
  { id: "VST-2041", title: "Spices · Nagpur → Rotterdam", buyer: "EuroSpice BV", value: "$48,200", stage: 4 },
  { id: "VST-2038", title: "Pulses · Mumbai → Dubai", buyer: "Al-Madar Trading", value: "$22,900", stage: 6 },
  { id: "VST-2034", title: "Organic · Cochin → Hamburg", buyer: "BioNord GmbH", value: "$31,400", stage: 2 },
];

const STAGES = [
  { label: "Lead onboarded", icon: Building2 },
  { label: "KYC verified", icon: FileCheck2 },
  { label: "IEC issued", icon: ClipboardList },
  { label: "AD code mapped", icon: Banknote },
  { label: "Buyer confirmed", icon: Globe2 },
  { label: "Shipment booked", icon: Ship },
  { label: "Customs cleared", icon: PackageCheck },
  { label: "Payment received", icon: CheckCircle2 },
];

const NOTES = [
  { who: "Priya · Operations", when: "2h ago", text: "DGFT IEC reference 0319045678 issued. Updated vault." },
  { who: "Karan · Success",    when: "Yesterday", text: "Buyer EuroSpice BV signed proforma. Awaiting 30% advance." },
  { who: "System",             when: "2d ago", text: "AD code request submitted to ICICI Sitabuldi branch." },
];

export default function WorkflowPage() {
  const [active, setActive] = useState(CASES[0]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workflow tracker</h1>
        <p className="mt-1 text-sm text-white/55">Live status across every shipment case in your workspace.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Case list */}
        <aside className="space-y-3">
          {CASES.map((c) => {
            const on = active.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`glass-card w-full p-4 text-left transition ${on ? "ring-1 ring-[var(--gold)]/50" : "opacity-80 hover:opacity-100"}`}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/40">
                  <span>Case {c.id}</span>
                  <span className="text-[var(--gold)]">{Math.round((c.stage / STAGES.length) * 100)}%</span>
                </div>
                <div className="mt-2 text-sm font-medium">{c.title}</div>
                <div className="text-xs text-white/50">{c.buyer} · {c.value}</div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[var(--grad-gold)]" style={{ width: `${(c.stage / STAGES.length) * 100}%` }} />
                </div>
              </button>
            );
          })}
        </aside>

        {/* Active case detail */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-white/45">Case {active.id}</div>
                <h2 className="text-xl font-semibold">{active.title}</h2>
                <div className="mt-1 text-sm text-white/55">Buyer · {active.buyer} · Value {active.value}</div>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-xs"><Paperclip size={13} /> Attach</button>
                <button className="btn-gold inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-black"><MessageSquare size={13} /> Message ops</button>
              </div>
            </div>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2">
              {STAGES.map((s, i) => {
                const done = i < active.stage;
                const cur = i === active.stage;
                return (
                  <motion.li
                    key={s.label}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={`rounded-xl border p-4 ${cur ? "border-[var(--gold)]/40 bg-white/[0.04]" : done ? "border-emerald-400/20 bg-emerald-400/[0.04]" : "border-white/5 bg-white/[0.02]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${done ? "bg-emerald-400/15 text-emerald-300" : cur ? "bg-[var(--grad-gold)] text-black" : "bg-white/5 text-white/40"}`}>
                        {done ? <CheckCircle2 size={15} /> : cur ? <Loader2 size={15} className="animate-spin" /> : <s.icon size={15} />}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-[11px] text-white/45">
                          {done ? "Completed" : cur ? "In progress" : "Pending"}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold">Activity & notes</h3>
            <ul className="mt-4 space-y-4">
              {NOTES.map((n, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />
                  <div>
                    <div className="text-xs text-white/45">{n.who} · {n.when}</div>
                    <div className="mt-0.5 text-sm text-white/85">{n.text}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/5 p-2">
              <Circle size={14} className="ml-2 text-white/30" />
              <input className="flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-white/30" placeholder="Add a note for the ops team…" />
              <button className="btn-gold rounded-lg px-3 py-1.5 text-xs font-semibold text-black">Post</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}