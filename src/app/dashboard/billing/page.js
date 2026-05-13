"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Smartphone, Building2, Download, Sparkles } from "lucide-react";

const PLANS = [
  { id: "basic", name: "Basic", monthly: 33999, tagline: "For first-time exporters", features: ["IEC + AD code", "1 product category", "Email support", "Basic KYC review"] },
  { id: "standard", name: "Standard", monthly: 43999, tagline: "Most exporters pick this", featured: true, features: ["Everything in Basic", "RCMC + DGFT advisory", "5 product categories", "Priority ops support", "Quarterly compliance review"] },
  { id: "premium", name: "Premium", monthly: 83999, tagline: "Full white-glove desk", features: ["Everything in Standard", "Dedicated success manager", "Unlimited categories", "Buyer matchmaking", "Trade finance intro"] },
];

const INVOICES = [
  { id: "INV-2041", date: "12 Apr 2026", plan: "Standard (Annual)", amount: 519188, status: "Paid" },
  { id: "INV-1987", date: "08 Jan 2026", plan: "Standard (Monthly)", amount: 51919, status: "Paid" },
  { id: "INV-1902", date: "08 Dec 2025", plan: "Basic (Monthly)", amount: 40119, status: "Paid" },
];

const PAYMENTS = [
  { id: "upi", label: "UPI", desc: "Pay with any UPI app via Razorpay", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, Rupay, Amex", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", desc: "All major Indian banks", icon: Building2 },
];

export default function BillingPage() {
  const [billing, setBilling] = useState("monthly");
  const [selected, setSelected] = useState("standard");
  const [pay, setPay] = useState("upi");

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plans & billing</h1>
          <p className="mt-1 text-sm text-white/55">Pick a plan, manage invoices and payment methods.</p>
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
          {["monthly", "annual"].map((m) => (
            <button
              key={m}
              onClick={() => setBilling(m)}
              className={`rounded-full px-4 py-1.5 capitalize transition ${billing === m ? "bg-[var(--gold)] text-black font-semibold" : "text-white/60 hover:text-white"}`}
            >
              {m}{m === "annual" && <span className="ml-1 text-[10px]">−15%</span>}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => {
          const base = billing === "annual" ? p.monthly * 12 * 0.85 : p.monthly;
          const gst = base * 0.18;
          const total = base + gst;
          const active = selected === p.id;
          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -3 }}
              className={`relative rounded-3xl border p-6 transition ${active ? "border-[var(--gold)]/60 bg-[var(--gold)]/5" : "border-white/10 bg-white/[0.02]"}`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[10px] font-semibold text-black">
                  <Sparkles size={11} /> Popular
                </span>
              )}
              <div className="text-sm text-white/55">{p.tagline}</div>
              <div className="mt-1 text-lg font-semibold">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">₹{Math.round(base).toLocaleString("en-IN")}</span>
                <span className="text-xs text-white/45">/{billing === "annual" ? "yr" : "mo"}</span>
              </div>
              <div className="mt-1 text-[11px] text-white/40">+ ₹{Math.round(gst).toLocaleString("en-IN")} GST · Total ₹{Math.round(total).toLocaleString("en-IN")}</div>
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-300" /> {f}</li>
                ))}
              </ul>
              <button
                onClick={() => setSelected(p.id)}
                className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${active ? "btn-gold" : "btn-ghost"}`}
              >
                {active ? "Selected" : "Choose plan"}
              </button>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Payment method</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PAYMENTS.map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPay(id)}
                className={`rounded-2xl border p-4 text-left transition ${pay === id ? "border-[var(--gold)]/60 bg-[var(--gold)]/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}
              >
                <Icon size={18} className="text-[var(--gold)]" />
                <div className="mt-2 text-sm font-medium">{label}</div>
                <div className="text-[11px] text-white/45">{desc}</div>
              </button>
            ))}
          </div>
          <button className="btn-gold mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold sm:w-auto">
            Pay securely with Razorpay
          </button>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Current plan</h3>
          <div className="mt-3 text-lg font-semibold">Standard · Annual</div>
          <div className="text-xs text-white/50">Renews 12 Apr 2027</div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
            Used: 3 of 5 product categories · 2 active shipments
          </div>
          <button className="btn-ghost mt-4 w-full rounded-xl px-4 py-2 text-xs">Manage subscription</button>
        </div>
      </section>

      <section className="glass-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Invoices</h3>
          <button className="btn-ghost inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"><Download size={13} /> Export CSV</button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-white/40">
              <tr><th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Plan</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Status</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="text-white/75">
                  <td className="py-3 pr-4 font-medium text-white">{inv.id}</td>
                  <td className="py-3 pr-4">{inv.date}</td>
                  <td className="py-3 pr-4">{inv.plan}</td>
                  <td className="py-3 pr-4">₹{inv.amount.toLocaleString("en-IN")}</td>
                  <td className="py-3 pr-4"><span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">{inv.status}</span></td>
                  <td className="py-3"><button className="text-xs text-[var(--gold)] hover:underline">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}