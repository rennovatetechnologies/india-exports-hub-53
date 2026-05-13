import { motion } from "framer-motion";

export default function OthersPage() {
  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="Others Header"
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
              Others
            </h1>
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto" />
          </div>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl font-light tracking-wide text-white/85">
            Stay tuned! Products coming soon.
          </p>
        </div>
      </section>

      <section className="flex-grow flex flex-col justify-center items-center py-20 px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-5xl font-bold text-white mb-6"
        >
          Products Coming Soon
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl text-white/65 max-w-2xl"
        >
          We are working hard to add more exciting products to our collection.
          Stay tuned for updates and check back soon!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <img
            src="/Others.jpg"
            alt="Coming Soon"
            width={300}
            height={300}
            className="object-contain"
          />
        </motion.div>
      </section>
    </div>
  );
}
