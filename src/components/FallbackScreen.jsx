import { Link } from "react-router-dom";
import { AlertCircle, Home, RefreshCw, SearchX } from "lucide-react";
import { PATHS } from "@/lib/routes";
import { getSession } from "@/lib/authSession";
import { USER_MESSAGES } from "@/lib/friendlyError";

const COPY = {
  crash: {
    kicker: "Something went wrong",
    title: "This page hit a snag",
    body: "Please refresh and try again. If it keeps happening, come back in a few minutes or contact support.",
    Icon: AlertCircle,
  },
  "not-found": {
    kicker: "Page not found",
    title: "We couldn't find that page",
    body: "The link may be out of date, or the page may have moved.",
    Icon: SearchX,
  },
  unavailable: {
    kicker: "Temporarily unavailable",
    title: "We couldn't load this",
    body: USER_MESSAGES.load,
    Icon: AlertCircle,
  },
};

function homeHref() {
  try {
    return getSession() ? PATHS.dashboard : PATHS.home;
  } catch {
    return PATHS.home;
  }
}

/**
 * Full-page or in-layout friendly fallback (crash, 404, failed load).
 */
export default function FallbackScreen({
  kind = "unavailable",
  title,
  message,
  compact = false,
  onRetry,
  retryLabel = "Try again",
  homeLabel,
  className = "",
}) {
  const preset = COPY[kind] || COPY.unavailable;
  const Icon = preset.Icon;
  const heading = title || preset.title;
  const body = message || preset.body;
  const home = homeHref();
  const goHome = homeLabel || (home === PATHS.dashboard ? "Back to workspace" : "Back to home");

  const inner = (
    <div className={`mx-auto w-full max-w-lg text-center ${compact ? "py-10 px-4" : ""}`}>
      <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
        {preset.kicker}
      </span>
      <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--gold)]">
        <Icon size={26} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">{heading}</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">{body}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            <RefreshCw size={15} /> {retryLabel}
          </button>
        ) : null}
        <Link
          to={home}
          className="btn-ghost inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          <Home size={15} /> {goHome}
        </Link>
      </div>
    </div>
  );

  if (compact) {
    return <div className={`glass-card ${className}`}>{inner}</div>;
  }

  return (
    <section className={`relative isolate flex min-h-[70svh] items-center justify-center px-5 py-16 ${className}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh opacity-70" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-40" aria-hidden />
      {inner}
    </section>
  );
}

/** Compact, non-technical notice for forms and inline actions. */
export function InlineNotice({ children, tone = "error", className = "" }) {
  if (!children) return null;
  const styles =
    tone === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100/90"
      : tone === "info"
        ? "border-white/10 bg-white/[0.04] text-white/70"
        : "border-rose-400/25 bg-rose-400/10 text-rose-100/90";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${styles} ${className}`}>
      {children}
    </p>
  );
}
