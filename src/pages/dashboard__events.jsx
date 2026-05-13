import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Check } from "lucide-react";

const EVENTS = [
  { id: "e1", title: "Global Buyer-Seller Meet 2026", date: "22 Jun 2026", city: "Mumbai, India", img: "/event.png", seats: "120 delegates", desc: "Curated meet between Indian exporters and 40+ international buyers across spices, organic food and fresh produce." },
  { id: "e2", title: "Vistara Export Summit", date: "14 Aug 2026", city: "Dubai, UAE", img: "/event2.webp", seats: "200 delegates", desc: "Two-day summit on MENA market access, halal certification and trade finance for Indian exporters." },
];

export default function EventsPage() {
  const [reserved, setReserved] = useState({});
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Events & summits</h1>
        <p className="mt-1 text-sm text-white/55">Reserve your seat at curated trade events.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {EVENTS.map((ev) => {
          const isReserved = reserved[ev.id];
          return (
            <motion.article key={ev.id} whileHover={{ y: -3 }} className="glass-card overflow-hidden">
              <div className="relative h-52 w-full">
                <img src={ev.img} alt={ev.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-black/50 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--gold)]">Featured</span>
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold">{ev.title}</h2>
                <p className="mt-2 text-sm text-white/60">{ev.desc}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-[var(--gold)]" /> {ev.date}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-[var(--gold)]" /> {ev.city}</span>
                  <span className="inline-flex items-center gap-1.5"><Users size={13} className="text-[var(--gold)]" /> {ev.seats}</span>
                </div>
                <button
                  onClick={() => setReserved((r) => ({ ...r, [ev.id]: !r[ev.id] }))}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${isReserved ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "btn-gold"}`}
                >
                  {isReserved ? <><Check size={15} /> Seat reserved</> : "Reserve seat"}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}