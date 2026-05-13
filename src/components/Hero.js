import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import BookingModal from "./BookingModal";
import EventBookingModal from "./EventBookingModal";
import { isAuthenticated } from "@/lib/authSession";
import {
  ArrowRight,
  ShieldCheck,
  Globe2,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

export default function Hero() {
  const [open, setOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const navigate = useNavigate();

  const openBooking = () => {
    if (!isAuthenticated()) {
      navigate(`/login?next=${encodeURIComponent("/")}`);
      return;
    }
    setOpen(true);
  };

  const openEventBooking = () => {
    if (!isAuthenticated()) {
      navigate(`/login?next=${encodeURIComponent("/events#register")}`);
      return;
    }
    setEventOpen(true);
  };

  return (
    <>
      <section className="relative isolate min-h-[100svh] overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28">
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
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs uppercase tracking-[0.18em] text-white/80"
              >
                <Sparkles size={14} className="text-[var(--gold)]" />
                <span>VISTARA · Global Trade OS</span>
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
                <span className="inline-flex items-center gap-2"><Globe2 size={14} className="text-emerald-300" /> 30+ countries served</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-300" /> 1,200+ exporters onboarded</span>
              </motion.div>
            </div>

            {/* Right: upcoming event */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="relative animate-float-y">
                <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-[var(--gold)]/40 via-white/10 to-emerald-400/20 opacity-60 blur-xl" />
                <div className="glass-card relative p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-xs text-white/60">
                      <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
                      Upcoming event
                    </div>
                    <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/45">Limited seats</span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold leading-snug">
                    Virtual Shipment Workshop · 5 days
                  </h3>
                  <p className="mt-2 text-sm text-white/55">
                    Live online cohort — documentation, customs, and shipment planning with our ops team.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-sm text-white/70">
                    <li className="flex items-center gap-2.5">
                      <Calendar size={15} className="shrink-0 text-[var(--gold)]" />
                      <span>02 – 06 May 2026</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Clock size={15} className="shrink-0 text-[var(--gold)]" />
                      <span>11:00 AM – 2:00 PM IST</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <MapPin size={15} className="shrink-0 text-[var(--gold)]" />
                      <span>Online · Zoom</span>
                    </li>
                  </ul>

                  <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs uppercase tracking-wider text-white/45">Workshop fee</span>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-white">₹6,399</span>
                        <span className="ml-2 text-sm text-white/40 line-through">₹34,999</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={openEventBooking}
                      className="btn-gold inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                    >
                      Reserve a seat
                      <ArrowRight size={15} />
                    </button>
                    <Link
                      to="/events"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85 transition hover:bg-white/[0.06]"
                    >
                      Event details
                      <ArrowUpRight size={15} className="text-[var(--gold)]" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <BookingModal open={open} setOpen={setOpen} />
      <EventBookingModal open={eventOpen} setOpen={setEventOpen} />
    </>
  );
}
