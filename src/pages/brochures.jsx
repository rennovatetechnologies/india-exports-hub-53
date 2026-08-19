import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import {
  fetchBrochuresCatalog,
  formatBrochureSize,
  getGalleryBrochures,
  getPdfBrochures,
  loadBrochuresCatalog,
  openBrochureItem,
  resolveBrochureUrl,
  subscribeBrochures,
} from "@/lib/brochuresCatalog";

export default function BrochuresPage() {
  const [catalog, setCatalog] = useState(() => loadBrochuresCatalog());
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ready, setReady] = useState(() => loadBrochuresCatalog().length > 0);

  const pdfs = useMemo(() => getPdfBrochures(catalog), [catalog]);

  useEffect(() => {
    fetchBrochuresCatalog({ force: true })
      .then((list) => {
        setCatalog(list);
        setReady(true);
      })
      .catch(() => setReady(true));
    return subscribeBrochures(() => setCatalog(loadBrochuresCatalog()));
  }, []);

  useEffect(() => {
    let cancelled = false;
    /** @type {string[]} */
    const objectUrls = [];

    async function loadImages() {
      const rows = getGalleryBrochures(catalog);
      const resolved = await Promise.all(
        rows.map(async (row) => {
          const src = await resolveBrochureUrl(row);
          if (!src) return null;
          if (src.startsWith("blob:")) objectUrls.push(src);
          return { id: row.id, name: row.name, src };
        })
      );
      if (!cancelled) setImages(resolved.filter(Boolean));
    }

    loadImages();
    return () => {
      cancelled = true;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [catalog]);

  const empty = ready && pdfs.length === 0 && images.length === 0;

  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="VIRASTRA by New India Export Brochures"
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
        <div className="max-w-7xl mx-auto space-y-12">
          {empty ? (
            <p className="text-center text-white/50 py-16">No brochures published yet.</p>
          ) : (
            <>
              {(pdfs.length > 0 || !ready) && (
                <div className="space-y-4">
                  <h2 className="px-2 text-sm font-medium uppercase tracking-wider text-white/55">
                    PDF catalogues
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pdfs.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => openBrochureItem(row)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-[var(--gold)]/25 hover:bg-white/[0.06]"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)]/15 text-[var(--gold)]">
                            <FileText size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-white">{row.name}</span>
                            <span className="text-xs text-white/40">
                              {row.fileName || "PDF"}
                              {row.fileSize ? ` · ${formatBrochureSize(row.fileSize)}` : ""}
                            </span>
                          </span>
                        </span>
                        <Download size={15} className="shrink-0 text-[var(--gold)]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {images.length > 0 && (
                <div className="space-y-4">
                  <h2 className="px-2 text-sm font-medium uppercase tracking-wider text-white/55">
                    Visual brochures
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                </div>
              )}
            </>
          )}
        </div>
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
