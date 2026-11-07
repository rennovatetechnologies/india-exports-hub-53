import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import BookingModal from "./BookingModal";
import EventPromoCard from "./EventPromoCard";
import { isAuthenticated } from "@/lib/authSession";
import {
  fetchEventsCatalog,
  loadEventsCatalog,
  pickFeaturedEvent,
} from "@/lib/eventsCatalog";
import {
  ArrowRight,
  ShieldCheck,
  Globe2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

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

  return (
    <>
      <section className="relative isolate min-h-[100svh] overflow-hidden pt-20 pb-20 md:pt-24 md:pb-28">
        {/* Full-bleed hero photo + overlays (headline sits on the image) */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src="/background2.jpeg"
            alt="Virastra by New India Export — Where Trust Travels, taking India's Products Everywhere"
            className="h-full w-full object-cover object-center opacity-[0.42] sm:opacity-[0.38]"
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
              <BrandLogo className="mb-5 h-24 w-auto sm:h-28" alt="VIRASTRA by New India Export" />
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs uppercase tracking-[0.18em] text-white/80"
              >
                <Sparkles size={14} className="text-[var(--gold)]" />
                <span>VIRASTRA by New India Export</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="mt-6 text-[44px] leading-[1.05] tracking-tight font-semibold sm:text-6xl lg:text-7xl drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]"
              >
                Where Trust Travels,
                <br />
                <span className="text-aurora">taking India's Products Everywhere.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="mt-6 max-w-xl text-base sm:text-lg text-white/75 leading-relaxed"
              >
                VIRASTRA by New India Export is the premium consultancy and workflow
                platform for modern exporters, founded by Ms. Gayatri Sharma of Virastra
                International Export and Mr. Saurabh Nathuram Yadav of New India Export.
                Pick a plan, complete KYC, and ship globally — DGFT, ICEGATE, AD code
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
            <div className="lg:col-span-5">
              <div className="relative animate-float-y">
                <EventPromoCard event={featured} />
              </div>
            </div>
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
