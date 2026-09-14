import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowUpRight, Sparkles } from "lucide-react";
import { EventActionRow, EventBadge } from "@/components/EventCtas";
import {
  fetchEventsCatalog,
  loadEventsCatalog,
  formatEventDateRange,
  resolveEventImage,
  filterActiveEvents,
  eventPublicPath,
  eventModeLabel,
} from "@/lib/eventsCatalog";
import { PATHS } from "@/lib/routes";

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
    <section id="events" className="relative overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-30" />
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
              <Sparkles size={12} className="text-[var(--gold)]" /> Events
            </span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Webinars, tours & <span className="text-gold-gradient">cohorts.</span>
            </h2>
            <p className="mt-4 text-white/60">
              Each programme has its own landing page and WhatsApp registration. Brochures are included when a PDF is published.
            </p>
          </div>
          <Link
            to={PATHS.events}
            className="btn-ghost inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-medium"
          >
            All events <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cards.map((e, i) => (
            <motion.article
              key={e.id || e.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card overflow-hidden"
            >
              <Link to={eventPublicPath(e)} className="relative block h-44 overflow-hidden">
                <img
                  src={resolveEventImage(e.img)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] to-transparent" />
                <div className="absolute left-4 top-4">
                  <EventBadge event={e} />
                </div>
              </Link>
              <div className="p-6">
                <h3 className="text-xl font-semibold leading-snug">
                  <Link to={eventPublicPath(e)} className="hover:text-emerald-200">
                    {e.title}
                  </Link>
                </h3>
                {e.subtitle ? <p className="mt-1 text-sm text-emerald-300">{e.subtitle}</p> : null}
                <ul className="mt-4 space-y-1.5 text-xs text-white/60">
                  <li className="flex items-center gap-2">
                    <Calendar size={13} className="text-emerald-300" />
                    {formatEventDateRange(e.startDate || e.date, e.endDate)}
                    {e.time ? ` · ${e.time}` : ""}
                  </li>
                  {eventModeLabel(e) ? (
                    <li className="flex items-center gap-2">
                      <MapPin size={13} className="text-emerald-300" /> {eventModeLabel(e)}
                    </li>
                  ) : null}
                </ul>
                <div className="mt-5">
                  <EventActionRow event={e} showDetails />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
