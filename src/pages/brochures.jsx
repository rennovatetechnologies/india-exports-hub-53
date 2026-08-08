import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getGalleryBrochures,
  resolveBrochureUrl,
  subscribeBrochures,
} from "@/lib/brochuresCatalog";

export default function BrochuresPage() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    /** @type {string[]} */
    const objectUrls = [];

    async function load() {
      const rows = getGalleryBrochures();
      const resolved = await Promise.all(
        rows.map(async (row) => {
          const src = await resolveBrochureUrl(row);
          if (!src) return null;
          if (row.hasBlob) objectUrls.push(src);
          return { id: row.id, name: row.name, src };
        })
      );
      if (!cancelled) setImages(resolved.filter(Boolean));
    }

    load();
    const unsub = subscribeBrochures(() => {
      objectUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
      load();
    });

    return () => {
      cancelled = true;
      unsub();
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="VIRASTRA INTERNATIONAL EXPORT Brochures"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover brightness-75 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-[var(--background)]/80" />

        <div className="relative z-10 text-white px-6 mt-6 sm:mt-8">
          <div className="inline-block mb-6">
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto mb-4" />
            <h1 className="text-5xl sm:text-7xl font-bold mb-4 tracking-tight text-white">
              Brochures
            </h1>
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto" />
          </div>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl font-light tracking-wide text-white/85">
            Explore our product catalogues and visual brochures
          </p>
        </div>
      </section>

      <section className="w-full py-10 px-2 sm:px-6">
        {images.length === 0 ? (
          <p className="text-center text-white/50 py-16">No brochure images yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: Math.min(i * 0.05, 0.4) }}
                viewport={{ once: true }}
                className="relative w-full h-[60vh] sm:h-[80vh] overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md cursor-pointer hover:border-[var(--gold)]/25 transition-colors"
                onClick={() => setSelectedImage(img.src)}
              >
                <img
                  src={img.src}
                  alt={img.name || `Brochure ${i + 1}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain rounded-xl hover:scale-[1.02] transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition"
          >
            <X className="text-white w-6 h-6" />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh]">
            <img
              src={selectedImage}
              alt="Fullscreen view"
              className="absolute inset-0 h-full w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
