import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe, Star, Leaf, Handshake, Package } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      {/* ==== HEADER SECTION ==== */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="About Header"
          className="absolute inset-0 h-full w-full object-cover brightness-75 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-[var(--background)]/80" />
        <div className="relative z-10 text-white px-4 mt-16 sm:mt-20">
          <div className="inline-block mb-4">
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto mb-3" />
            <h1 className="text-4xl sm:text-6xl font-bold mb-3 tracking-tight text-white">
              About Us
            </h1>
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto" />
          </div>
          <p className="max-w-2xl mx-auto text-base sm:text-lg font-light tracking-wide text-white/85">
            Committed to delivering India's quality worldwide
          </p>
        </div>
      </section>

      {/* ==== ABOUT SECTION ==== */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Intro */}
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
                NEW INDIA EXPORT
              </span>{" "}
              focuses on exporting premium Indian products to customers all over
              the world. We have built a strong, passionate team that works with
              dedication and courage to fulfill the goals of our company.
            </p>
            <p className="text-lg text-white/75 mt-4 leading-relaxed text-justify">
              Our focus lies in maintaining excellence in{" "}
              <span className="font-semibold text-emerald-300/95">
                quality, quantity, variety, accuracy, and long-term relations.
              </span>{" "}
              All our products meet international and national quality
              standards, reflecting the authenticity and richness of India’s
              agricultural and organic heritage.
            </p>
            <p className="text-lg text-white/75 mt-4 leading-relaxed text-justify">
              We aim to spread India’s diverse culture, taste, and quality
              across the globe — building trust through every shipment we make.
            </p>
          </motion.div>

          {/* Vision + Values */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Left */}
            <div className="glass-card p-8">
              <h3 className="text-2xl font-semibold text-[var(--gold)] mb-4">
                Our Vision
              </h3>
              <p className="text-white/75 text-lg leading-relaxed">
                To create a strong and reliable platform in the{" "}
                <span className="font-semibold text-white">Export-Import Community</span>,
                representing the best of Indian agriculture, spices, and organic
                excellence globally.
              </p>
              <p className="text-white/75 mt-3 text-lg leading-relaxed">
                We believe that{" "}
                <span className="font-semibold text-white">
                  customer satisfaction is our greatest review,
                </span>{" "}
                and we strive to achieve it with every transaction.
              </p>
            </div>

            {/* Right */}
            <div className="glass-card p-8">
              <h3 className="text-2xl font-semibold text-[var(--gold)] mb-4">
                Our Core Values
              </h3>
              <ul className="list-disc list-inside text-white/75 text-lg space-y-2 marker:text-[var(--gold)]">
                <li>No compromises on product quality</li>
                <li>Building long-lasting client relationships</li>
                <li>Timely supply and transparent services</li>
                <li>Focus on organic and farm-fresh sourcing</li>
                <li>Dedication to accuracy and trust</li>
              </ul>
            </div>
          </motion.div>

          {/* Specialities */}
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
              ].map((item, i) => (
                <motion.div
                  key={i}
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

          {/* Product Buttons */}
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
    {[
      { label: "Spices", link: "/spices" },
      { label: "Cereals & Pulses", link: "/cerealsandpulses" },
      { label: "Organic Foods", link: "/organicfood" },
      { label: "Fruits & Vegetables", link: "/fruitsandvegetables" },
      { label: "Others", link: "/others" },
    ].map((btn, i) => (
      <motion.div
        key={i}
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
