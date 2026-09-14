import { motion } from "framer-motion";
import { Check, MapPin, Phone, Mail, Download } from "lucide-react";
import {
  EventActionRow,
  EventBadge,
  EventBrochureButtons,
  EventMetaCards,
  EventWhatsAppButton,
  useEventBrochures,
} from "@/components/EventCtas";
import {
  formatEventDateRange,
  resolveEventImage,
} from "@/lib/eventsCatalog";
import {
  getCachedPublicConfig,
  getSupportEmail,
  getSupportWhatsAppDisplay,
} from "@/lib/appConfig";

function EventContactAndDocs({ event, seller }) {
  const catalog = useEventBrochures();
  const hasDocs = catalog.some(
    (b) => b.id === event.brochureId || b.id === event.tourBrochureId
  );

  return (
    <div className={`grid gap-6 ${hasDocs ? "lg:grid-cols-2" : ""}`}>
      <div className="glass-card p-6 sm:p-8">
        <SectionHead kicker="Get in touch" title="Contact & inquiries" />
        <p className="mt-3 text-sm text-white/60">
          Questions about this event or the related tour? Write to our trade desk on WhatsApp.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-white/75">
          <li className="flex items-center gap-2.5">
            <Phone size={15} className="text-[var(--gold)]" />
            {getSupportWhatsAppDisplay()}
          </li>
          <li className="flex items-center gap-2.5">
            <Mail size={15} className="text-[var(--gold)]" />
            {getSupportEmail()}
          </li>
          {seller.address ? (
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--gold)]" />
              <span>{seller.address}</span>
            </li>
          ) : null}
        </ul>
        <EventWhatsAppButton
          event={event}
          className="btn-whatsapp mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        />
      </div>
      {hasDocs ? (
        <div className="glass-card p-6 sm:p-8">
          <SectionHead kicker="Official documents" title="Brochures & itineraries" />
          <p className="mt-3 text-sm text-white/60">
            Download the PDFs published for this programme.
          </p>
          <EventBrochureButtons
            event={event}
            className="mt-6 flex flex-col gap-3"
            buttonClassName="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
          />
          <p className="mt-4 flex items-center gap-2 text-xs text-white/40">
            <Download size={12} /> PDF downloads open in a new tab.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SectionHead({ kicker, title, children }) {
  return (
    <div className="max-w-2xl">
      {kicker ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">{kicker}</p>
      ) : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {children ? <p className="mt-3 text-white/60">{children}</p> : null}
    </div>
  );
}

export default function EventLanding({ event }) {
  if (!event) return null;
  const img = resolveEventImage(event.img);
  const overview = event.overview || event.desc;
  const seller = getCachedPublicConfig().seller || {};
  const hasTour = Boolean(event.tourTitle || event.tourDates || event.tourDestination);
  const ended = Boolean(event.expired);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <img src={img} alt="" className="h-full w-full object-cover opacity-[0.28]" />
          <div className="absolute inset-0 bg-mesh opacity-70" />
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/80 via-[var(--background)]/75 to-[var(--background)]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <EventBadge event={event} />
          {ended ? (
            <p className="mt-4 text-sm text-amber-200/90">This event has ended. Brochures and tour details remain available.</p>
          ) : null}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            {event.title}
            {event.subtitle ? (
              <>
                <br />
                <span className="text-emerald-300">{event.subtitle}</span>
              </>
            ) : null}
          </motion.h1>
          {event.tagline ? (
            <p className="mt-5 text-lg font-medium text-emerald-200/90 sm:text-xl">{event.tagline}</p>
          ) : null}
          {event.desc ? (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">{event.desc}</p>
          ) : null}

          <div className="mt-8">
            <EventMetaCards event={event} />
          </div>
          <div className="mt-8">
            <EventActionRow event={event} />
          </div>
        </div>
      </section>

      {hasTour ? (
        <section id="delegation" className="relative mx-auto max-w-5xl px-5 pb-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/8 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">On-ground opportunity</p>
              <h2 className="mt-1 text-xl font-semibold">{event.tourTitle || "Business delegation"}</h2>
              <p className="mt-1 text-sm text-white/60">
                {[event.tourDates, event.tourDestination].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {event.tourStatus ? (
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                  {event.tourStatus}
                </span>
              ) : null}
              <EventWhatsAppButton
                event={event}
                className="btn-whatsapp inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                Join now
              </EventWhatsAppButton>
            </div>
          </div>
        </section>
      ) : null}

      {overview ? (
        <section className="relative mx-auto max-w-5xl px-5 py-16 sm:px-6 lg:px-8">
          <SectionHead kicker="Overview" title="About this event">
            {overview}
          </SectionHead>
        </section>
      ) : null}

      {event.learnings?.length ? (
        <section className="relative mx-auto max-w-5xl px-5 pb-16 sm:px-6 lg:px-8">
          <SectionHead kicker="Curriculum" title="What you will learn" />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {event.learnings.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-sm text-white/80"
              >
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasTour ? (
        <section className="relative mx-auto max-w-5xl px-5 pb-16 sm:px-6 lg:px-8">
          <SectionHead kicker="Delegation preview" title={event.tourTitle || "On-ground programme"} />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Delegation", event.tourTitle],
              ["Dates", event.tourDates || formatEventDateRange(event.startDate, event.endDate)],
              ["Destination", event.tourDestination],
              ["Status", event.tourStatus],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">{label}</div>
                  <div className="mt-1.5 text-sm font-medium text-white">{value}</div>
                </div>
              ))}
          </div>
          {event.tourNotice ? (
            <p className="mt-4 text-sm text-white/55">{event.tourNotice}</p>
          ) : null}
        </section>
      ) : null}

      {event.sectors?.length ? (
        <section className="relative mx-auto max-w-5xl px-5 pb-16 sm:px-6 lg:px-8">
          <SectionHead kicker="Sectors" title="Industries covered" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {event.sectors.map((s) => (
              <div key={s.title || s.desc} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                {s.desc ? <p className="mt-2 text-sm leading-relaxed text-white/60">{s.desc}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {event.inclusions?.length ? (
        <section className="relative mx-auto max-w-5xl px-5 pb-16 sm:px-6 lg:px-8">
          <SectionHead kicker="Highlights" title="What’s included" />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {event.inclusions.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-white/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {event.timeline?.length ? (
        <section className="relative mx-auto max-w-5xl px-5 pb-16 sm:px-6 lg:px-8">
          <SectionHead kicker="Schedule" title="Programme timeline" />
          <ol className="mt-10 space-y-0">
            {event.timeline.map((item, i) => (
              <li key={`${item.date}-${item.title}-${i}`} className="relative flex gap-5 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                  {i < event.timeline.length - 1 ? (
                    <span className="mt-1 w-px flex-1 bg-white/10" />
                  ) : null}
                </div>
                <div className="-mt-1">
                  {item.date ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/90">{item.date}</p>
                  ) : null}
                  {item.title ? <h3 className="mt-1 text-lg font-semibold">{item.title}</h3> : null}
                  {item.desc ? <p className="mt-1 text-sm text-white/60">{item.desc}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="relative mx-auto max-w-5xl px-5 pb-16 sm:px-6 lg:px-8">
        <EventContactAndDocs event={event} seller={seller} />
      </section>

      <section className="relative px-5 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-emerald-400/12 via-white/[0.03] to-[var(--gold)]/10 px-6 py-12 text-center sm:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Join the programme</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Start with {event.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60">
            Register on WhatsApp for access details
            {event.tourTitle ? ` and ask about the ${event.tourTitle}` : ""}.
          </p>
          <div className="mt-7 flex justify-center">
            <EventActionRow event={event} className="justify-center" />
          </div>
        </div>
      </section>
    </div>
  );
}
