import { motion } from "framer-motion";

export default function CerealsAndPulsesPage() {
  const basmatiRice = [
    ["1509 WHITE SELLA BASMATI RICE", "8.3+ mm"],
    ["1509 GOLDEN SELLA BASMATI RICE", "8.35+ mm"],
    ["1509 STEAM BASMATI RICE", "8.35+ mm"],
    ["1121 WHITE SELLA BASMATI RICE", "8.35+ mm"],
    ["1121 GOLDEN SELLA BASMATI RICE", "8.35+ mm"],
    ["1121 STEAM RICE", "8.35+ mm"],
    ["SUGANDHA WHITE SELLA RICE", "7.85+ mm"],
    ["SUGANDHA GOLDEN SELLA RICE", "7.85+ mm"],
    ["SUGANDHA STEAM RICE", "7.85+ mm"],
    ["PR 11 WHITE SELLA RICE", "6.80+ mm"],
    ["PR 11 STEAM RICE", "6.80+ mm"],
    ["IR 64 (5% BROKEN RICE)", "6+ mm"],
  ];

  const nonBasmati = [
    "JAI SHREE RAM RICE",
    "AROMATIC CHINNOR RICE",
    "MASOORI RICE",
    "AROMATIC AMBIA MOHAR",
    "AROMATIC PARVATI SUT RICE",
  ];

  // Assign **actual image paths** for each cereal/pulse
  const otherItems = [
    { name: "SORGHUM (JOWAR)", img: "/cereals/jowar.jpg" },
    { name: "WHEAT", img: "/cereals/wheat.jpg" },
    { name: "MAIZE", img: "/cereals/maize.jpg" },
    { name: "SOYABEAN", img: "/cereals/soyabean.jpg" },
    { name: "PEAR MILLET", img: "/cereals/pear.jpg" },
    { name: "RED GRAM", img: "/cereals/redgram.jpg" },
    { name: "BLACK GRAM", img: "/cereals/blackgram.jpg" },
    { name: "GREEN GRAM", img: "/cereals/greengram.jpg" },
  ];

  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      {/* ==== HEADER ==== */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="Cereals and Pulses Header"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover brightness-75 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-[var(--background)]/80" />
        <div className="relative z-10 text-white px-6 mt-16 sm:mt-20">
          <div className="inline-block mb-6">
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto mb-4" />
            <h1 className="text-5xl sm:text-7xl font-bold mb-4 tracking-tight text-white">
              Cereals & Pulses
            </h1>
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto" />
          </div>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl font-light tracking-wide text-white/85">
            Explore our premium grains and pulses sourced directly from farmers
          </p>
        </div>
      </section>

      {/* ==== BASMATI RICE ==== */}
      <section className="py-14 px-4 sm:px-8 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-bold mb-8 text-center text-white"
        >
          Basmati Rice Varieties
        </motion.h2>

        <div className="relative w-full h-[50vh] sm:h-[60vh] mb-10 rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/40">
          <img
            src="/cereals/basmati.jpg"
            alt="Basmati Rice"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-base rounded-xl overflow-hidden border border-white/10">
            <thead className="bg-[var(--gold)]/25 text-[var(--gold)] border-b border-white/10">
              <tr>
                <th className="p-3 border border-white/10 font-semibold">SR. NO</th>
                <th className="p-3 border border-white/10 font-semibold">COMMODITY</th>
                <th className="p-3 border border-white/10 font-semibold">LENGTH</th>
              </tr>
            </thead>
            <tbody>
              {basmatiRice.map((item, i) => (
                <tr
                  key={i}
                  className="odd:bg-white/[0.03] even:bg-white/[0.06] hover:bg-[var(--gold)]/10 transition text-white/85"
                >
                  <td className="p-3 border border-white/10 text-center">{i + 1}</td>
                  <td className="p-3 border border-white/10 font-medium">{item[0]}</td>
                  <td className="p-3 border border-white/10 text-center">{item[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==== NON BASMATI RICE ==== */}
      <section className="py-14 px-4 sm:px-8 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-bold mb-8 text-center text-white"
        >
          Non-Basmati Rice Varieties
        </motion.h2>

        <div className="relative w-full h-[50vh] sm:h-[60vh] mb-10 rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/40">
          <img
            src="/cereals/nonbasmati.jpg"
            alt="Non-Basmati Rice"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <ul className="glass-card p-6 space-y-3 text-lg leading-relaxed text-white/80">
          {nonBasmati.map((item, i) => (
            <li key={i} className="flex items-center">
              <span className="text-[var(--gold)] font-semibold mr-2">{i + 1}.</span> {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ==== OTHER ITEMS ==== */}
      <section className="py-14 px-4 sm:px-8 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-bold mb-10 text-center text-white"
        >
          Other Cereals and Pulses
        </motion.h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {otherItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative glass-card hover:border-[var(--gold)]/20 transition-all p-4 text-center"
            >
              <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                <img
                  src={item.img}
                  alt={item.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold text-[var(--gold)]">{item.name}</h3>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
