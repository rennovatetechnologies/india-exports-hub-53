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
import { isAuthenticated } from "@/lib/authSession";

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

  const reserveHref = isAuthenticated()
    ? PATHS.dashboardEvents
    : loginWithNext(PATHS.dashboardEvents);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-mesh opacity-40" />
        <div className="mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
            <Sparkles size={12} className="text-[var(--gold)]" /> Events
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Workshops, summits & <span className="text-gold-gradient">trade meets.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-white/60">
            Published by our operations team. Sign in to reserve a seat.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-6 lg:px-8">
        {ready && events.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center text-white/50">
            No events are published yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((e, i) => {
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
                  <div className="relative h-52 bg-zinc-900">
                    <img
                      src={resolveEventImage(e.img)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold">{e.title}</h2>
                    {e.desc ? <p className="mt-2 text-sm text-white/60">{e.desc}</p> : null}
                    <ul className="mt-4 space-y-1.5 text-sm text-white/55">
                      <li className="flex items-center gap-2">
                        <Calendar size={14} className="text-[var(--gold)]" />
                        {formatEventDateRange(e.startDate || e.date, e.endDate)}
                      </li>
                      {e.city ? (
                        <li className="flex items-center gap-2">
                          <MapPin size={14} className="text-[var(--gold)]" /> {e.city}
                        </li>
                      ) : null}
                    </ul>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-sm text-white/70">
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
                      </span>
                      <Link
                        to={reserveHref}
                        className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                      >
                        Reserve seat <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
