import { motion } from "framer-motion";
import {
  EventActionRow,
  EventBadge,
  EventMetaCards,
} from "@/components/EventCtas";
import { resolveEventImage } from "@/lib/eventsCatalog";

/** Homepage / listing overlay card — date, time, WhatsApp, brochures. */
export default function EventPromoCard({ event, className = "" }) {
  if (!event) return null;
  const img = resolveEventImage(event.img);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className={`relative ${className}`}
    >
      <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-emerald-400/30 via-white/10 to-[var(--gold)]/20 opacity-70 blur-xl" />
      <article className="glass-card relative overflow-hidden p-6 sm:p-7">
        <div className="pointer-events-none absolute inset-0">
          <img src={img} alt="" className="h-full w-full object-cover opacity-[0.18]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e14]/70 via-[#0b0e14]/88 to-[#0b0e14]" />
        </div>
        <div className="relative">
          <EventBadge event={event} />

          <h3 className="mt-5 text-2xl font-semibold leading-snug tracking-tight sm:text-[1.7rem]">
            {event.title}
          </h3>
          {event.subtitle ? (
            <p className="mt-1.5 text-lg font-medium text-emerald-300">{event.subtitle}</p>
          ) : null}
          {event.tagline ? (
            <p className="mt-1 text-sm font-medium text-emerald-200/80">{event.tagline}</p>
          ) : null}
          {event.desc ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/65">{event.desc}</p>
          ) : null}

          <div className="mt-5">
            <EventMetaCards event={event} compact />
          </div>

          <div className="mt-6">
            <EventActionRow event={event} showDetails />
          </div>
        </div>
      </article>
    </motion.div>
  );
}
