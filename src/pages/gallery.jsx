import { motion } from "framer-motion";

export default function GalleryPage() {
  const galleryImages = [
    "/f1.jpg",
    "/gallery/DelhiIITF.jpg",
    "/gallery/dgft.jpg",
    "/gallery/FarmVisit.jpg",
    "/gallery/GulfFood.jpg",
    "/gallery/ICARYavatmal.jpg",
    "/gallery/ICDMihan.jpg",
    "/gallery/MCED.jpg",
    "/gallery/ODOP.jpg",
    "/gallery/PuneAwards.jpg",
    "/gallery/SaudiArabia.jpg",
    "/gallery/Spain.jpg",
    "/gallery/WTC2023.jpg",
    "/f2.jpg",
    "/f3.jpg",
    "/f4.jpg",
    "/f5.jpg",
    "/f6.jpg",
    "/f7.jpg",
    "/f8.jpg",
    "/f9.jpg",
    "/f10.jpg",
    "/f11.jpg",
    "/f12.jpg",
    "/f.jpg",
  ];

  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      {/* ==== HEADER SECTION ==== */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="Gallery Header"
          className="absolute inset-0 h-full w-full object-cover brightness-75 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-[var(--background)]/80" />

        <div className="relative z-10 text-white px-4 mt-16 sm:mt-20">
          <div className="inline-block mb-4">
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto mb-3" />
            <h1 className="text-4xl sm:text-6xl font-bold mb-3 tracking-tight text-white">
              Gallery
            </h1>
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto" />
          </div>
          <p className="max-w-2xl mx-auto text-base sm:text-lg font-light tracking-wide text-white/85">
            A glimpse into our vibrant collection and visual highlights
          </p>
        </div>
      </section>

      {/* ==== MASONRY GALLERY ==== */}
      <section className="w-full py-12 px-2 sm:px-8">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-2 sm:gap-4 space-y-2 sm:space-y-4 max-w-6xl mx-auto">
          {galleryImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-black/40 hover:border-[var(--gold)]/30 transition-all duration-300 cursor-pointer"
            >
              <img
                src={img}
                alt={`Gallery Image ${i + 1}`}
                width={900}
                height={900}
                loading="lazy"
                className="w-full h-auto rounded-xl object-cover hover:scale-105 transition-transform duration-300"
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
