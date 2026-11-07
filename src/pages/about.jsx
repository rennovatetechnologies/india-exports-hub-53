import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Globe, Leaf, Handshake, Package } from "lucide-react";
import { PATHS } from "@/lib/routes";
import BrandLogo from "@/components/BrandLogo";

const CORE_VALUES = [
  "Quality First",
  "Trust and Transparency",
  "Customer-Centric Service",
  "Global Mindset, Indian Roots",
  "Long-Term Partnerships",
];

export default function AboutPage() {
  const { pathname } = useLocation();
  const inDashboard = pathname.startsWith("/dashboard");
  const productLinks = [
    { label: "Spices", link: inDashboard ? PATHS.dashboardProductsSpices : PATHS.spices },
    { label: "Cereals & Pulses", link: inDashboard ? PATHS.dashboardProductsCereals : PATHS.cereals },
    { label: "Organic Foods", link: inDashboard ? PATHS.dashboardProductsOrganic : PATHS.organic },
    { label: "Fruits & Vegetables", link: inDashboard ? PATHS.dashboardProductsFruits : PATHS.fruits },
    { label: "Others", link: inDashboard ? PATHS.dashboardProductsOthers : PATHS.others },
  ];

  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/background1.jpeg"
          alt="About VIRASTRA by New India Export — Where Trust Travels"
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/75 via-transparent to-[var(--background)]/85" />
        <div className="relative z-10 text-white px-4 mt-6 sm:mt-8">
          <div className="inline-block mb-4">
            <BrandLogo className="mx-auto mb-4 h-20 w-auto sm:h-24" alt="VIRASTRA by New India Export" />
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto mb-3" />
            <h1 className="text-4xl sm:text-6xl font-bold mb-3 tracking-tight text-white">
              About Virastra
            </h1>
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto" />
          </div>
          <p className="max-w-2xl mx-auto text-base sm:text-lg font-light tracking-wide text-white/85">
            Where Trust Travels — taking India's Products Everywhere
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="glass-card p-8 sm:p-10"
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6 text-center">
              Who We Are
            </h2>
            <p className="text-lg text-white/75 leading-relaxed text-justify">
              <span className="font-semibold text-[var(--gold)]">
                VIRASTRA by New India Export
              </span>{" "}
              is the premium consultancy and workflow platform for modern exporters,
              founded by Ms. Gayatri Sharma of Virastra International Export and
              Mr. Saurabh Nathuram Yadav of New India Export. Pick a plan, complete KYC,
              and ship globally — DGFT, ICEGATE, AD code and compliance handled in one
              elegant flow.
            </p>
            <p className="text-lg text-white/75 mt-4 leading-relaxed text-justify">
              <span className="font-semibold text-white">India's products. The world's shelves.</span>{" "}
              Built on the principles of trust, quality, transparency, and sustainable
              business growth, our platform aims to bridge the gap between India's rich
              agricultural resources and the evolving needs of international buyers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="glass-card p-8 sm:p-10"
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6 text-center">
              Our Story
            </h2>
            <p className="text-lg text-white/75 leading-relaxed text-justify">
              <span className="font-semibold text-white">Ms. Gayatri Sharma</span>, Founder
              of Virastra International Export, brings the vision and entrepreneurial
              spirit behind Virastra. With a commitment to building dependable
              international trade relationships, she contributes to the development of a
              platform focused on quality-driven sourcing, professional service, and
              global business opportunities for Indian and International products.
            </p>
            <p className="text-lg text-white/75 mt-4 leading-relaxed text-justify">
              <span className="font-semibold text-white">Mr. Saurabh Nathuram Yadav</span>{" "}
              is the Director of New India Export. Driven by a vision to strengthen
              India's agricultural export ecosystem, he is committed to connecting Indian
              suppliers and producers with international buyers through reliable trade
              practices, export support, and long-term commercial partnerships.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="glass-card p-8">
              <h3 className="text-2xl font-semibold text-[var(--gold)] mb-4">
                Our Vision
              </h3>
              <p className="text-white/75 text-lg leading-relaxed">
                To make International trade more accessible, transparent, and dependable
                by connecting Indian suppliers with global demand, supporting efficient
                export processes, and fostering partnerships built on integrity and
                shared success.
              </p>
            </div>

            <div className="glass-card p-8">
              <h3 className="text-2xl font-semibold text-[var(--gold)] mb-4">
                Commitment to Core Values
              </h3>
              <ul className="list-disc list-inside text-white/75 text-lg space-y-2 marker:text-[var(--gold)]">
                {CORE_VALUES.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-8"
          >
            <h3 className="text-2xl font-semibold text-[var(--gold)] mb-6 text-center">
              Our Specialities
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {[
                {
                  icon: Leaf,
                  title: "Organic Food",
                  desc: "Delivering pure, natural, and chemical-free food.",
                },
                {
                  icon: Package,
                  title: "Direct From Farm",
                  desc: "We source directly from farmers ensuring freshness.",
                },
                {
                  icon: Globe,
                  title: "Merchant Exporter",
                  desc: "Serving global clients with wide export capabilities.",
                },
                {
                  icon: Handshake,
                  title: "Quality & Service",
                  desc: "Committed to supply, quality, and customer trust.",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center justify-center glass rounded-xl p-6 border border-white/10 hover:border-[var(--gold)]/25 transition-all"
                >
                  <item.icon className="w-10 h-10 text-[var(--gold)] mb-3" />
                  <h4 className="text-lg font-semibold mb-2 text-white">{item.title}</h4>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center px-4"
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-5 sm:mb-6">
              Explore Our Products
            </h3>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4">
              {productLinks.map((btn) => (
                <motion.div
                  key={btn.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    to={btn.link}
                    className="btn-gold block px-4 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm sm:text-base font-medium text-center"
                  >
                    {btn.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
