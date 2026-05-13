import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mail, Phone, ChevronDown, BookOpen, Sparkles } from "lucide-react";

const CHANNELS = [
  {
    icon: MessageSquare,
    label: "Workflow comments",
    desc: "There is no live chat. Post a note on your shipment case under Activity & notes — our team monitors workflow updates and replies there.",
    cta: "Open workflow",
    to: "/dashboard/workflow#workflow-activity",
  },
  { icon: Mail, label: "Email support", desc: "support@vistaraexports.com · 4h SLA", cta: "Compose email" },
  { icon: Phone, label: "Hotline", desc: "+91 80 4567 1200 · Mon–Sat", cta: "Call now" },
];

const FAQS = [
  { q: "How long does IEC issuance take?", a: "Typically 3–5 working days after we receive complete KYC. Vistara handles the DGFT submission end-to-end." },
  { q: "Can I upgrade my plan mid-cycle?", a: "Yes. We pro-rate the difference and apply it to your next invoice. Upgrades activate instantly." },
  { q: "Do you support shipments outside India?", a: "Yes. We coordinate with partner CHAs in Dubai, Rotterdam and Singapore for transshipment workflows." },
  { q: "How do I add a teammate?", a: "Go to Settings → Team and invite by email. Each role (Admin, Ops, Viewer) has scoped permissions." },
];

const ARTICLES = [
  "Getting started with VISTARA in 10 minutes",
  "Uploading PAN, GST and Bank documents securely",
  "Understanding DGFT, AD code and ICEGATE",
  "Reading your shipment workflow timeline",
];

export default function SupportPage() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Help center</h1>
        <p className="mt-1 text-sm text-white/55">Concierge support, knowledge base, and answers to common questions.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, label, desc, cta, to }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="glass-card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]"><Icon size={18} /></span>
            <div className="mt-3 text-sm font-semibold">{label}</div>
            <div className="text-xs text-white/55">{desc}</div>
            {to ? (
              <Link to={to} className="btn-ghost mt-4 flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs">
                {cta}
              </Link>
            ) : (
              <button type="button" className="btn-ghost mt-4 w-full rounded-xl px-3 py-2 text-xs">{cta}</button>
            )}
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Frequently asked</h3>
          <div className="mt-4 divide-y divide-white/5">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="py-3">
                  <button onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-4 text-left">
                    <span className="text-sm font-medium">{f.q}</span>
                    <ChevronDown size={16} className={`text-white/45 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-sm text-white/60">
                        <span className="block pt-2">{f.a}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-card p-6">
            <div className="inline-flex items-center gap-2 text-[var(--gold)]"><BookOpen size={16} /><span className="text-sm font-semibold">Knowledge base</span></div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {ARTICLES.map((a) => (
                <li key={a}><button className="text-left hover:text-white">{a}</button></li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-6">
            <div className="inline-flex items-center gap-2 text-[var(--gold)]"><Sparkles size={16} /><span className="text-sm font-semibold">Concierge desk</span></div>
            <p className="mt-2 text-xs text-white/55">Premium plan customers get a dedicated success manager. Book a 30-min strategy call.</p>
            <button className="btn-gold mt-4 w-full rounded-xl px-4 py-2 text-xs font-semibold">Book a call</button>
          </div>
        </div>
      </section>
    </div>
  );
}