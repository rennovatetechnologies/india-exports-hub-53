import { Link } from "react-router-dom";
import { MessageSquare, CalendarDays, Sparkles, Megaphone, ArrowUpRight } from "lucide-react";
import { formatInr } from "@/lib/planCatalog";
import { communityPayHref, getCachedCommunitySettings } from "@/lib/communityAccess";

const ICONS = [MessageSquare, CalendarDays, Megaphone, Sparkles];

export default function CommunityPaywall({
  title,
  description,
  settings,
  compact = false,
}) {
  const s = settings || getCachedCommunitySettings();
  const total = s.totalInr ?? Math.round((Number(s.priceInr) || 0) * 1.18);
  const benefits = Array.isArray(s.benefits) && s.benefits.length ? s.benefits : [];

  return (
    <div className={`glass-card overflow-hidden ${compact ? "p-5" : "p-6 sm:p-8"}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]/90">
        {s.title || "Community access"}
      </p>
      <h2 className={`mt-2 font-semibold ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
        {title || "Unlock chat, free events, and updates"}
      </h2>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        {description ||
          s.tagline ||
          "A small annual fee set by the team. Documentation plans stay optional."}
      </p>
      {s.required ? (
        <p className="mt-3 text-2xl font-semibold text-[var(--gold)]">
          {formatInr(total)}
          <span className="ml-2 text-xs font-normal text-white/45">
            incl. GST · {s.validityDays || 365} days
          </span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-emerald-300">Included with your account right now.</p>
      )}
      {benefits.length > 0 && (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {benefits.map((b, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={b} className="flex items-start gap-2 text-sm text-white/70">
                <Icon size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
                {b}
              </li>
            );
          })}
        </ul>
      )}
      <Link
        to={communityPayHref()}
        className="btn-gold mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
      >
        Continue <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
