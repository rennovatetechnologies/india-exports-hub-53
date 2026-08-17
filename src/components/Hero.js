import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import BookingModal from "./BookingModal";
import { isAuthenticated } from "@/lib/authSession";
import {
  fetchEventsCatalog,
  loadEventsCatalog,
  pickFeaturedEvent,
  formatEventDateRange,
  eventEffectivePrice,
  eventHasDiscount,
  resolveEventImage,
} from "@/lib/eventsCatalog";
import { formatInr } from "@/lib/planCatalog";
import { PATHS, loginWithNext } from "@/lib/routes";
import {
  ArrowRight,
  ShieldCheck,
  Globe2,
  Sparkles,
  CheckCircle2,
  Calendar,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

export default function Hero() {
  const [open, setOpen] = useState(false);
  const [featured, setFeatured] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventsCatalog({ force: true })
      .then((list) => setFeatured(pickFeaturedEvent(list)))
      .catch(() => setFeatured(null));
    const h = () => setFeatured(pickFeaturedEvent(loadEventsCatalog()));
    window.addEventListener("iehub-events-updated", h);
    return () => window.removeEventListener("iehub-events-updated", h);
  }, []);

  const openBooking = () => {
    if (!isAuthenticated()) {
      navigate(`/login?next=${encodeURIComponent("/dashboard")}`);
      return;
    }
    setOpen(true);
  };

  const reserveHref = isAuthenticated()
    ? PATHS.dashboardEvents
    : loginWithNext(PATHS.dashboardEvents);
  const payable = featured ? eventEffectivePrice(featured) : 0;
  const discounted = featured ? eventHasDiscount(featured) : false;

  return (
    <>
      <section className="relative isolate min-h-[100svh] overflow-hidden pt-20 pb-20 md:pt-24 md:pb-28">
        {/* Full-bleed hero photo + overlays (headline sits on the image) */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src="/Hero.jpg"
            alt=""
            className="h-full w-full object-cover opacity-[0.42] sm:opacity-[0.38]"
          />
          <div className="absolute inset-0 bg-mesh" />
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/75 via-[var(--background)]/82 to-[var(--background)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/90 via-transparent to-[var(--background)]/55" />
        </div>

        <div className="pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[var(--gold)]/15 blur-3xl z-[1]" />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-[380px] w-[380px] rounded-full bg-emerald-400/10 blur-3xl z-[1]" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: headline on hero art */}
            <div className={featured ? "lg:col-span-7" : "lg:col-span-12"}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs uppercase tracking-[0.18em] text-white/80"
              >
                <Sparkles size={14} className="text-[var(--gold)]" />
                <span>VIRASTRA INTERNATIONAL EXPORT · where trust travels</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="mt-6 text-[44px] leading-[1.05] tracking-tight font-semibold sm:text-6xl lg:text-7xl drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]"
              >
                Export products from
                <br />
                <span className="text-aurora">anywhere to everywhere.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="mt-6 max-w-xl text-base sm:text-lg text-white/75 leading-relaxed"
              >
                The premium consultancy & workflow platform for modern exporters.
                Buy a plan, complete KYC, and ship globally — DGFT, ICEGATE, AD code
                and compliance handled in one elegant flow.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="relative z-20 mt-8 flex flex-col sm:flex-row flex-wrap gap-3 pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={openBooking}
                  className="btn-gold group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                >
                  Start Your Export Journey
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                <Link
                  to="/#plans"
                  className="btn-ghost inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium"
                >
                  Explore Plans
                </Link>
                <Link
                  to="/login"
                  className="btn-ghost inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium border border-white/15"
                >
                  Log in
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/60"
              >
                <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-[var(--gold)]" /> DGFT · ICEGATE compliant</span>
                <span className="inline-flex items-center gap-2"><Globe2 size={14} className="text-emerald-300" /> IEC · GST · AD code</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-300" /> KYC to shipment in one timeline</span>
              </motion.div>
            </div>

            {/* Right: upcoming event from admin catalog */}
            {featured ? (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="relative animate-float-y">
                <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-[var(--gold)]/40 via-white/10 to-emerald-400/20 opacity-60 blur-xl" />
                <div className="glass-card relative overflow-hidden p-6 sm:p-7">
                  {featured.img ? (
                    <div className="relative -mx-6 -mt-6 mb-5 h-36 overflow-hidden sm:-mx-7 sm:-mt-7">
                      <img
                        src={resolveEventImage(featured.img)}
                        alt=""
                        className="h-full w-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] to-transparent" />
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-xs text-white/60">
                      <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
                      Upcoming event
                    </div>
                    {discounted ? (
                      <span className="shrink-0 text-[10px] uppercase tracking-widest text-[var(--gold)]">
                        {featured.discountPercent}% off
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/45">
                        {payable > 0 ? "Paid" : "Free"}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold leading-snug">
                    {featured.title}
                  </h3>
                  {featured.desc ? (
                    <p className="mt-2 text-sm text-white/55">{featured.desc}</p>
                  ) : null}

                  <ul className="mt-6 space-y-2.5 text-sm text-white/70">
                    <li className="flex items-center gap-2.5">
                      <Calendar size={15} className="shrink-0 text-[var(--gold)]" />
                      <span>{formatEventDateRange(featured.startDate || featured.date, featured.endDate)}</span>
                    </li>
                    {featured.city ? (
                      <li className="flex items-center gap-2.5">
                        <MapPin size={15} className="shrink-0 text-[var(--gold)]" />
                        <span>{featured.city}</span>
                      </li>
                    ) : null}
                  </ul>

                  {payable > 0 ? (
                    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs uppercase tracking-wider text-white/45">Fee</span>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-white">{formatInr(payable)}</span>
                          {discounted ? (
                            <span className="ml-2 text-sm text-white/40 line-through">{formatInr(featured.priceInr)}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <Link
                      to={reserveHref}
                      className="btn-gold inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                    >
                      Reserve a seat
                      <ArrowRight size={15} />
                    </Link>
                    <Link
                      to={PATHS.events}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85 transition hover:bg-white/[0.06]"
                    >
                      All events
                      <ArrowUpRight size={15} className="text-[var(--gold)]" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
            ) : (
              <div className="hidden lg:block lg:col-span-5" />
            )}
          </div>
        </div>
      </section>

      <BookingModal open={open} setOpen={setOpen} />
    </>
  );
}
