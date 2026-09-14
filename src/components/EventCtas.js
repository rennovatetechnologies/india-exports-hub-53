import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Download, MapPin, Monitor, ArrowRight, MessageCircle } from "lucide-react";
import {
  fetchBrochuresCatalog,
  loadBrochuresCatalog,
  openBrochureItem,
  subscribeBrochures,
} from "@/lib/brochuresCatalog";
import {
  eventBrochureLabel,
  eventKindLabel,
  eventModeLabel,
  eventPublicPath,
  eventWhatsAppText,
  formatEventDateRange,
} from "@/lib/eventsCatalog";
import { getSupportWhatsAppUrl } from "@/lib/appConfig";
import { PATHS, loginWithNext } from "@/lib/routes";
import { isAuthenticated } from "@/lib/authSession";

export function useEventBrochures() {
  const [items, setItems] = useState(() => loadBrochuresCatalog());
  useEffect(() => {
    fetchBrochuresCatalog()
      .then(setItems)
      .catch(() => setItems(loadBrochuresCatalog()));
    return subscribeBrochures(setItems);
  }, []);
  return items;
}

export function eventWhatsAppHref(event) {
  return getSupportWhatsAppUrl(eventWhatsAppText(event));
}

export function EventWhatsAppButton({ event, className = "", children }) {
  if (!event) return null;
  return (
    <a
      href={eventWhatsAppHref(event)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <MessageCircle size={16} />
      {children || "Register on WhatsApp"}
    </a>
  );
}

export function EventBrochureButtons({ event, className = "", buttonClassName = "" }) {
  const catalog = useEventBrochures();
  if (!event) return null;
  const webinar = catalog.find((b) => b.id === event.brochureId);
  const tour = catalog.find((b) => b.id === event.tourBrochureId);
  if (!webinar && !tour) return null;

  const open = (item) => {
    if (!item) return;
    void openBrochureItem(item);
  };

  return (
    <div className={className}>
      {webinar ? (
        <button type="button" onClick={() => open(webinar)} className={buttonClassName}>
          <Download size={15} />
          {eventBrochureLabel(event, "event")}
        </button>
      ) : null}
      {tour ? (
        <button type="button" onClick={() => open(tour)} className={buttonClassName}>
          <Download size={15} />
          {eventBrochureLabel(event, "tour")}
        </button>
      ) : null}
    </div>
  );
}

export function EventReserveLink({ className = "", children }) {
  const href = isAuthenticated() ? PATHS.dashboardEvents : loginWithNext(PATHS.dashboardEvents);
  return (
    <Link to={href} className={className}>
      {children || (
        <>
          Reserve a seat <ArrowRight size={15} />
        </>
      )}
    </Link>
  );
}

export function EventMetaCards({ event, compact = false }) {
  if (!event) return null;
  const dateLabel = formatEventDateRange(event.startDate || event.date, event.endDate);
  const time = String(event.time || "").trim();
  const timeNote = String(event.timeNote || "").trim();
  const mode = eventModeLabel(event);
  const modeNote = String(event.modeNote || event.city || "").trim();
  const cards = [
    {
      key: "date",
      icon: Calendar,
      label: "Date",
      value: dateLabel,
      note: event.endDate && event.endDate !== event.startDate ? "Live programme" : "Live event",
    },
  ];
  if (time) {
    cards.push({
      key: "time",
      icon: Clock,
      label: "Time",
      value: time,
      note: timeNote || "Indian Standard Time (IST)",
    });
  }
  if (mode) {
    cards.push({
      key: "mode",
      icon: /online|webinar|virtual/i.test(mode) ? Monitor : MapPin,
      label: /online|webinar|virtual/i.test(mode) ? "Mode" : "Venue",
      value: mode,
      note: modeNote && modeNote !== mode ? modeNote : event.city && event.city !== mode ? event.city : "",
    });
  }

  return (
    <div className={`grid gap-3 ${cards.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-2xl border border-white/10 bg-white/[0.04] ${compact ? "px-4 py-3" : "px-4 py-4"}`}
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
            <card.icon size={13} className="text-emerald-300" />
            {card.label}
          </div>
          <div className={`mt-1.5 font-semibold text-white ${compact ? "text-sm" : "text-base"}`}>
            {card.value}
          </div>
          {card.note ? <div className="mt-0.5 text-xs text-white/45">{card.note}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function EventBadge({ event }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
      <Calendar size={12} />
      {eventKindLabel(event)}
    </span>
  );
}

export function EventDetailsLink({ event, className = "", children }) {
  if (!event) return null;
  return (
    <Link to={eventPublicPath(event)} className={className}>
      {children || (
        <>
          View details <ArrowRight size={15} />
        </>
      )}
    </Link>
  );
}

const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]";
const whatsappBtn =
  "btn-whatsapp inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold";
const goldBtn =
  "btn-gold inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold";

export function EventActionRow({ event, showDetails = false, showReserve = false, className = "" }) {
  if (!event) return null;
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${className}`}>
      {showDetails ? (
        <EventDetailsLink event={event} className={goldBtn} />
      ) : null}
      <EventWhatsAppButton event={event} className={showDetails ? whatsappBtn : `${whatsappBtn} sm:min-w-[220px]`} />
      {showReserve ? (
        <EventReserveLink className={ghostBtn} />
      ) : null}
      <EventBrochureButtons
        event={event}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        buttonClassName={ghostBtn}
      />
    </div>
  );
}
