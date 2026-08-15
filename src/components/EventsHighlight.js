import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowUpRight, Sparkles } from "lucide-react";
import {
  fetchEventsCatalog,
  loadEventsCatalog,
  formatEventDateRange,
  eventEffectivePrice,
  eventHasDiscount,
  resolveEventImage,
  filterActiveEvents,
} from "@/lib/eventsCatalog";
import { formatInr } from "@/lib/planCatalog";
import { PATHS, loginWithNext } from "@/lib/routes";

export default function EventsHighlight() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEventsCatalog({ force: true })
      .then((list) => setEvents(filterActiveEvents(list)))
      .catch(() => setEvents([]));
    const h = () => setEvents(filterActiveEvents(loadEventsCatalog()));
    window.addEventListener("iehub-events-updated", h);
    return () => window.removeEventListener("iehub-events-updated", h);
  }, []);

  const cards = events.slice(0, 4);
  if (!cards.length) return null;

  return (
    <section id="events" className="relative py-24 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-30" />
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
              <Sparkles size={12} className="text-[var(--gold)]" /> Events
            </span>
            <h2 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight">
              Workshops, summits & <span className="text-gold-gradient">cohorts.</span>
            </h2>
            <p className="mt-4 text-white/60">
              Learn the export playbook from operators who ship every week.
            </p>
          </div>
          <Link
            to={PATHS.events}
            className="btn-ghost rounded-full px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 self-start"
          >
            All events <ArrowUpRight size={16} />
          </Link>
        </div>

        {cards.length > 0 && (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cards.map((e, i) => {
            const href = e.href || loginWithNext(PATHS.dashboardEvents);
            const payable = eventEffectivePrice(e);
            const discounted = eventHasDiscount(e);
            return (
              <motion.div
                key={e.id || e.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative"
              >
                <div className="absolute -inset-px rounded-[24px] bg-gradient-to-br from-[var(--gold)]/30 via-white/5 to-cyan-300/15 opacity-0 group-hover:opacity-100 blur-md transition" />
                <Link
                  to={href}
                  className="relative grid grid-cols-5 glass-card overflow-hidden h-full"
                >
                  <div className="relative col-span-2 min-h-[220px] overflow-hidden">
                    <img
                      src={resolveEventImage(e.img)}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#06080d]/70" />
                  </div>
                  <div className="col-span-3 p-6 flex flex-col">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      {discounted ? `${e.discountPercent}% off` : payable > 0 ? "Open" : "Free"}
                    </span>
                    <h3 className="mt-4 text-lg sm:text-xl font-semibold text-white leading-snug">
                      {e.title}
                    </h3>
                    <ul className="mt-4 space-y-1.5 text-xs text-white/60">
                      <li className="flex items-center gap-2">
                        <Calendar size={13} className="text-[var(--gold)]" />
                        {formatEventDateRange(e.startDate || e.date, e.endDate) || e.desc || "Date TBA"}
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin size={13} className="text-[var(--gold)]" /> {e.city || "Venue TBA"}
                      </li>
                    </ul>
                    <div className="mt-auto pt-5 flex items-center justify-between">
                      <span className="text-sm text-white/70 group-hover:text-white transition">
                        {payable > 0 ? (
                          <>
                            {formatInr(payable)}
                            {discounted ? (
                              <span className="ml-2 text-white/40 line-through">{formatInr(e.priceInr)}</span>
                            ) : null}
                          </>
                        ) : (
                          "Reserve seat"
                        )}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition group-hover:bg-[var(--gold)]/15 group-hover:text-[var(--gold)] group-hover:border-[var(--gold)]/40">
                        <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
