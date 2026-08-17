import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { isAuthenticated } from "@/lib/authSession";
import {
  loadPlanCatalog,
  fetchPlanCatalog,
  formatInr,
  planEffectivePrice,
  planHasDiscount,
  planMarketingGroups,
} from "@/lib/planCatalog";

export default function PlansSection() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchPlanCatalog({ force: true })
      .then(setPlans)
      .catch(() => setPlans([]));
    const h = () => setPlans(loadPlanCatalog());
    window.addEventListener("iehub-plans-updated", h);
    return () => window.removeEventListener("iehub-plans-updated", h);
  }, []);

  if (!plans.length) return null;

  return (
    <section id="plans" className="relative py-24 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-50" />
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
            <Sparkles size={12} className="text-[var(--gold)]" /> Consultancy Plans
          </span>
          <h2 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight">
            Pick a plan. <span className="text-gold-gradient">Start exporting.</span>
          </h2>
          <p className="mt-4 text-white/60">
            Transparent pricing with optional admin discounts. Choose Basic documentation, Standard
            compliance integrations, or Premium end-to-end export setup. Every plan is valid for one
            year — renew if you need another year. Event tickets are billed separately on every plan.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p, idx) => {
            const planHref = isAuthenticated()
              ? "/dashboard/billing"
              : `/login?next=${encodeURIComponent("/dashboard/billing")}`;
            const groups = planMarketingGroups(p);
            const effective = planEffectivePrice(p);
            const discounted = planHasDiscount(p);
            const glow = p.featured ? "rgba(244,196,106,0.35)" : "rgba(255,255,255,0.12)";
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className={`relative ${p.featured ? "lg:-mt-4" : ""}`}
              >
                {p.featured && (
                  <div
                    className="absolute -inset-px rounded-[26px] opacity-80 blur-md"
                    style={{ background: `radial-gradient(60% 50% at 50% 0%, ${glow}, transparent 70%)` }}
                  />
                )}
                <div
                  className={`relative glass-card p-7 h-full flex flex-col ${
                    p.featured ? "ring-1 ring-[var(--gold)]/40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-white/55">
                      {p.name} plan
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      {p.featured && (
                        <span className="rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--gold)]">
                          Popular
                        </span>
                      )}
                      {discounted && (
                        <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                          {p.discountPercent}% off
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className={`mt-3 text-2xl font-semibold ${p.featured ? "text-gold-gradient" : "text-white"}`}>
                    {p.name}
                  </h3>
                  {p.tagline ? <p className="mt-1 text-sm text-white/55">{p.tagline}</p> : null}

                  <div className="mt-4 flex flex-wrap items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight">{formatInr(effective)}</span>
                    {discounted && (
                      <span className="text-lg text-white/40 line-through">{formatInr(p.price)}</span>
                    )}
                    <span className="text-sm text-white/50">+ GST</span>
                  </div>
                  <div className="text-xs text-white/50 mt-1">{p.timeline || "Liaisoning"}</div>
                  {p.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-white/55">{p.description}</p>
                  ) : null}

                  <div className="my-6 divider-glow" />

                  <div className="space-y-4 flex-1">
                    {groups.map((g) => (
                      <div key={g.group || p.id}>
                        {g.group ? (
                          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]/80">
                            {g.group}
                          </div>
                        ) : null}
                        <ul className="space-y-2.5">
                          {g.items.map((item) => (
                            <li key={item.label} className="flex items-start gap-2.5 text-sm">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                                <Check size={11} />
                              </span>
                              <span className="text-white/85">{item.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <Link
                    to={planHref}
                    className={`mt-7 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      p.featured ? "btn-gold" : "btn-ghost"
                    }`}
                  >
                    {p.featured ? `Get ${p.name}` : `Choose ${p.name}`}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          * T&amp;C applied · Valid for 1 year from purchase · Event tickets charged separately on all plans · Inclusive of standard government processing
        </p>
      </div>
    </section>
  );
}
