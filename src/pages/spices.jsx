import { motion } from "framer-motion";

export default function SpicesPage() {
  const spices = [
    {
      name: "TURMERIC",
      desc: "Renowned for its vibrant color and health benefits, Indian turmeric is used worldwide for cooking and medicinal purposes. Naturally rich in curcumin.",
      img: "/spices/turmeric.jpg",
    },
    {
      name: "BLACK PEPPER",
      desc: "Known as the ‘King of Spices’, black pepper adds strong aroma and spice to cuisines globally. Grown in the lush regions of southern India.",
      img: "/spices/blackpaper.jpg",
    },
    {
      name: "CUMIN (JEERA)",
      desc: "Cumin seeds from India are aromatic, earthy, and add warmth to every dish. Widely used in curries, rice, and spice blends.",
      img: "/spices/cumin.jpg",
    },
    {
      name: "CORIANDER",
      desc: "Coriander seeds have a citrusy aroma and sweet flavor, enhancing both savory and sweet preparations. High in essential oils and freshness.",
      img: "/spices/coriander.jpg",
    },
    {
      name: "RED CHILLY POWDER",
      desc: "A perfect blend of color and spice, our red chilly powder delivers rich flavor and natural heat to dishes — no artificial additives.",
      img: "/spices/redchili.jpg",
    },
    {
      name: "CLOVE",
      desc: "Highly aromatic and flavorful, Indian clove is used in both sweet and savory cuisines, known for its warm and pungent taste.",
      img: "/spices/clove.jpg",
    },
    {
      name: "CARDAMOM",
      desc: "Popularly known as the ‘Queen of Spices’, cardamom offers a sweet fragrance and complex flavor, ideal for desserts and teas.",
      img: "/spices/cardomom.jpg",
    },
    {
      name: "CINNAMON",
      desc: "Naturally sweet and woody in flavor, Indian cinnamon is widely used in bakery, beverages, and curries for its aroma and warmth.",
      img: "/spices/cinnamon.jpg",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      {/* ==== HEADER SECTION ==== */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="Spices Header"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover brightness-75 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-[var(--background)]/80" />

        <div className="relative z-10 text-white px-4 mt-16 sm:mt-20">
          <div className="inline-block mb-4">
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto mb-3" />
            <h1 className="text-4xl sm:text-6xl font-bold mb-3 tracking-tight text-white">
              Spices
            </h1>
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto" />
          </div>
          <p className="max-w-2xl mx-auto text-base sm:text-lg font-light tracking-wide text-white/85">
            Discover India’s finest spices — rich in aroma, flavor, and heritage.
          </p>
        </div>
      </section>

      {/* ==== SPICES LIST ==== */}
      <section className="py-16 px-4 sm:px-10">
        <div className="max-w-6xl mx-auto space-y-20">
          {spices.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={`flex flex-col ${
                i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } items-center gap-10`}
            >
              <div className="relative w-full lg:w-1/2 h-[350px] rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-black/50">
                <img
                  src={item.img}
                  alt={item.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="lg:w-1/2 text-center lg:text-left space-y-4">
                <h2 className="text-3xl font-bold text-[var(--gold)] tracking-tight">
                  {item.name}
                </h2>
                <p className="text-white/70 text-base leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
