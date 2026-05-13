import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

const products = [
  {
    name: "Spices",
    desc: "Turmeric, chilli, cumin, cardamom — aromatic, export-grade.",
    img: "/Spices.jpg",
    link: "/spices",
    tag: "Top export",
  },
  {
    name: "Cereals & Pulses",
    desc: "Rice, wheat, lentils — sourced direct from origin clusters.",
    img: "/Pulses.jpg",
    link: "/cerealsandpulses",
    tag: "Volume",
  },
  {
    name: "Organic Food",
    desc: "Certified organic produce. APEDA · FSSAI compliant.",
    img: "/Organic.jpg",
    link: "/organicfood",
    tag: "Certified",
  },
  {
    name: "Fruits & Vegetables",
    desc: "Cold-chain ready, harvest-fresh, globally shippable.",
    img: "/Veg1.jpg",
    link: "/fruitsandvegetables",
    tag: "Fresh",
  },
  {
    name: "Others",
    desc: "Specialty agri & food categories on request.",
    img: "/Others2.png",
    link: "/others",
    tag: "Custom",
  },
];

export default function ProductsSection() {
  return (
    <section id="products" className="relative py-24 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-40" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[680px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 max-w-5xl">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
              <Sparkles size={12} className="text-[var(--gold)]" /> Categories
            </span>
            <h2 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight">
              What we ship to <span className="text-gold-gradient">the world.</span>
            </h2>
            <p className="mt-4 max-w-xl text-white/60">
              Premium agri-exports curated for global buyers — quality assured,
              compliance-ready, dispatched from Indian ports.
            </p>
          </div>
          <Link
            to="/contact"
            className="btn-ghost rounded-full px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 self-start md:self-auto"
          >
            Request a quote <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group relative"
            >
              <div className="absolute -inset-px rounded-[24px] bg-gradient-to-br from-[var(--gold)]/30 via-white/5 to-emerald-400/20 opacity-0 group-hover:opacity-100 blur-md transition" />
              <Link
                to={p.link}
                className="relative block glass-card overflow-hidden h-full"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/40 to-transparent" />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full glass-strong px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    {p.tag}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition group-hover:bg-[var(--gold)]/15 group-hover:text-[var(--gold)] group-hover:border-[var(--gold)]/40">
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">{p.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* CTA tile */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.36 }}
            className="relative glass-card p-6 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
            <div>
              <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Custom sourcing
              </span>
              <h3 className="mt-4 text-xl font-semibold">
                Looking for something specific?
              </h3>
              <p className="mt-2 text-sm text-white/55">
                Tell us your spec and destination — we'll build the supply chain.
              </p>
            </div>
            <Link
              to="/contact"
              className="mt-6 btn-gold rounded-full px-5 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              Talk to sourcing <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}