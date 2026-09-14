import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import EventPromoCard from "@/components/EventPromoCard";
import { EventActionRow, EventBadge } from "@/components/EventCtas";
import {
  fetchEventsCatalog,
  loadEventsCatalog,
  formatEventDateRange,
  eventEffectivePrice,
  eventHasDiscount,
  resolveEventImage,
  filterActiveEvents,
  pickFeaturedEvent,
  eventPublicPath,
  eventModeLabel,
} from "@/lib/eventsCatalog";
import { formatInr } from "@/lib/planCatalog";

export default function EventPage() {
  const [events, setEvents] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchEventsCatalog({ force: true })
      .then((list) => {
        setEvents(filterActiveEvents(list));
        setReady(true);
      })
      .catch(() => {
        setEvents([]);
        setReady(true);
      });
    const h = () => setEvents(filterActiveEvents(loadEventsCatalog()));
    window.addEventListener("iehub-events-updated", h);
    return () => window.removeEventListener("iehub-events-updated", h);
  }, []);

  const featured = pickFeaturedEvent(events);
  const rest = featured ? events.filter((e) => e.id !== featured.id) : events;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-hidden px-5 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-mesh opacity-40" />
        <div className="mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
            <Sparkles size={12} className="text-[var(--gold)]" /> Events
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Webinars, tours & <span className="text-gold-gradient">trade meets.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-white/60">
            Register on WhatsApp and join the next Virastra programme. Brochures appear when we publish them for an event.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-6 lg:px-8">
        {ready && events.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center text-white/50">
            No events are published yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-10">
            {featured ? (
              <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
                <div className="lg:col-span-7">
                  <EventPromoCard event={featured} />
                </div>
                <div className="hidden lg:col-span-5 lg:block">
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10">
                    <img
                      src={resolveEventImage(featured.img)}
                      alt=""
                      className="h-full min-h-[420px] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                </div>
              </div>
            ) : null}

            {rest.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {rest.map((e, i) => {
                  const payable = eventEffectivePrice(e);
                  const discounted = eventHasDiscount(e);
                  return (
                    <motion.article
                      key={e.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="glass-card overflow-hidden"
                    >
                      <Link to={eventPublicPath(e)} className="relative block h-52 bg-zinc-900">
                        <img
                          src={resolveEventImage(e.img)}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute left-4 top-4">
                          <EventBadge event={e} />
                        </div>
                      </Link>
                      <div className="p-6">
                        <h2 className="text-xl font-semibold">
                          <Link to={eventPublicPath(e)} className="hover:text-emerald-200">
                            {e.title}
                          </Link>
                        </h2>
                        {e.subtitle ? (
                          <p className="mt-1 text-sm font-medium text-emerald-300">{e.subtitle}</p>
                        ) : null}
                        {e.desc ? <p className="mt-2 line-clamp-3 text-sm text-white/60">{e.desc}</p> : null}
                        <ul className="mt-4 space-y-1.5 text-sm text-white/55">
                          <li className="flex items-center gap-2">
                            <Calendar size={14} className="text-emerald-300" />
                            {formatEventDateRange(e.startDate || e.date, e.endDate)}
                            {e.time ? ` · ${e.time}` : ""}
                          </li>
                          {eventModeLabel(e) ? (
                            <li className="flex items-center gap-2">
                              <MapPin size={14} className="text-emerald-300" /> {eventModeLabel(e)}
                            </li>
                          ) : null}
                        </ul>
                        <div className="mt-4 text-sm text-white/70">
                          {payable > 0 ? (
                            <>
                              {formatInr(payable)}
                              {discounted ? (
                                <span className="ml-2 text-white/40 line-through">{formatInr(e.priceInr)}</span>
                              ) : null}
                            </>
                          ) : (
                            "Free to attend"
                          )}
                        </div>
                        <div className="mt-5">
                          <EventActionRow event={e} showDetails />
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
