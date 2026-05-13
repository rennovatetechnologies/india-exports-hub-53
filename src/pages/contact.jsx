import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const inputCls =
  "rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 px-4 py-3 focus:ring-2 focus:ring-[var(--gold)]/40 outline-none transition";

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (!plan) return;
    setFormData((d) => {
      if (d.message.trim()) return d;
      return { ...d, message: `I would like to know more about the ${plan} plan.` };
    });
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, message } = formData;
    const plan = searchParams.get("plan");
    const planLine = plan ? `\nPlan interest: ${plan}` : "";
    const whatsappMessage = `Hello, my name is ${name}.\nEmail: ${email}${planLine}\n\nMessage:\n${message}`;
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/919028894149?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen text-[var(--foreground)]">
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="Contact Header"
          className="absolute inset-0 h-full w-full object-cover brightness-75 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-[var(--background)]/80" />
        <div className="relative z-10 text-white px-4 mt-16 sm:mt-20">
          <div className="inline-block mb-4">
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto mb-3" />
            <h1 className="text-4xl sm:text-6xl font-bold mb-3 tracking-tight text-white">
              Contact Us
            </h1>
            <div className="w-20 h-1 bg-[var(--gold)] mx-auto" />
          </div>
          <p className="max-w-2xl mx-auto text-base sm:text-lg font-light tracking-wide text-white/85">
            We’d love to hear from you — let’s connect
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="glass-card p-8 space-y-6"
          >
            <h2 className="text-3xl font-semibold text-white mb-6 border-b border-white/10 pb-3">
              Reach Us
            </h2>
            <div className="space-y-5 text-white/80">
              <div className="flex items-start gap-4">
                <MapPin className="text-[var(--gold)] w-6 h-6 mt-1 shrink-0" />
                <p className="text-lg">
                  <span className="font-semibold text-white">Office:</span> SHOP NO M02,
                  Premium Plaza Commercial Complex, Dharampeth, Nagpur – 440010
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="text-[var(--gold)] w-6 h-6 shrink-0" />
                <p className="text-lg select-none">
                  <span className="font-semibold text-white">Email:</span>{" "}
                  Newindexport@gmail.com
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="text-[var(--gold)] w-6 h-6 shrink-0" />
                <p className="text-lg">
                  <span className="font-semibold text-white">Phone:</span>{" "}
                  <span className="text-[var(--gold)] font-medium">
                    +91 90288 94149
                  </span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="glass-card p-8 flex flex-col space-y-5"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 border-b border-white/10 pb-2">
              Send Us a Message
            </h2>

            <input
              type="text"
              required
              placeholder="Your Name"
              className={inputCls}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              type="email"
              required
              placeholder="Your Email"
              className={inputCls}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <textarea
              required
              placeholder="Your Message"
              rows="5"
              className={inputCls}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn-gold py-3 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            >
              <Send size={18} /> Send Message
            </motion.button>
          </motion.form>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="max-w-6xl mx-auto mt-14 rounded-2xl overflow-hidden border border-white/10 glass"
        >
          <iframe
            src="https://www.google.com/maps?q=Premium+Plaza+Commercial+Complex+Dharampeth+Nagpur+440010&output=embed"
            width="100%"
            height="450"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full border-0"
            title="Office location"
          />
        </motion.div>
      </section>
    </div>
  );
}
