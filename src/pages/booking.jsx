import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, isAuthenticated } from "@/lib/authSession";

export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [product, setProduct] = useState("");
  const [shipment, setShipment] = useState("");
  const [quantity, setQuantity] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(`/login?next=${encodeURIComponent("/booking")}`);
    }
  }, [navigate]);

  const handleFinalSubmit = async () => {
    const session = getSession();
    const message = `New Booking Request:
Product: ${product}
Shipment: ${shipment}
Quantity: ${quantity}
Account: ${session?.name || ""} <${session?.email || ""}>
Phone (profile): ${session?.phone || "—"}
Phone (form): ${phone}
Email (form): ${email}
Address: ${address}
Country: ${country}`;

    window.location.href = `mailto:Newindexport@gmail.com?subject=Booking Request&body=${encodeURIComponent(message)}`;
  };

  const Popup = ({ children }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 text-[var(--foreground)] border border-white/10">
        {children}
      </div>
    </div>
  );

  const btnPrimary =
    "w-full btn-gold py-3 rounded-xl font-semibold text-sm disabled:opacity-50";
  const btnSplit = "flex-1 py-3 rounded-xl font-semibold text-sm transition";
  const fieldCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 px-3 py-3 focus:ring-2 focus:ring-[var(--gold)]/40 outline-none";

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <img
          src="/Hero.jpg"
          alt="Booking Header"
          className="absolute inset-0 h-full w-full object-cover brightness-75 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-[var(--background)]/80" />
        <div className="relative z-10 text-white px-6 mt-16 sm:mt-20">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">Book Shipment</h1>
          <p className="max-w-2xl mx-auto text-white/80 text-lg sm:text-xl font-light tracking-wide mt-4">
            Guided booking with simple pop‑ups
          </p>
        </div>
      </section>

      {step === 1 && (
        <Popup>
          <h2 className="text-2xl font-bold mb-4 text-white">Select Shipment Type</h2>
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={() => {
                setShipment("Air");
                setStep(2);
              }}
              className={`${btnSplit} bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/30`}
            >
              Air
            </button>
            <button
              type="button"
              onClick={() => {
                setShipment("Sea");
                setStep(2);
              }}
              className={`${btnSplit} bg-cyan-500/15 text-cyan-100 border border-cyan-400/25 hover:bg-cyan-500/25`}
            >
              Sea
            </button>
          </div>
        </Popup>
      )}

      {step === 2 && (
        <Popup>
          <h2 className="text-2xl font-bold mb-4 text-white">Select Product</h2>
          <select
            className={`${fieldCls} mt-1`}
            onChange={(e) => setProduct(e.target.value)}
            defaultValue=""
          >
            <option value="" className="bg-[var(--background)] text-white">
              Choose product
            </option>
            <option className="bg-[var(--background)]">Spices</option>
            <option className="bg-[var(--background)]">Cereals & Pulses</option>
            <option className="bg-[var(--background)]">Organic Food</option>
            <option className="bg-[var(--background)]">Fruits & Vegetables</option>
            <option className="bg-[var(--background)]">Others</option>
          </select>
          <button
            type="button"
            onClick={() => product && setStep(3)}
            className={`mt-5 ${btnPrimary}`}
          >
            Next
          </button>
        </Popup>
      )}

      {step === 3 && (
        <Popup>
          <h2 className="text-2xl font-bold mb-4 text-white">Enter Quantity</h2>
          <input
            type="text"
            placeholder="Example: 500 kg"
            className={fieldCls}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button
            type="button"
            onClick={() => quantity && setStep(4)}
            className={`mt-5 ${btnPrimary}`}
          >
            Next
          </button>
        </Popup>
      )}

      {step === 4 && (
        <Popup>
          <h2 className="text-2xl font-bold mb-4 text-white">Contact Details</h2>

          <input
            type="text"
            placeholder="Phone Number"
            className={`${fieldCls} mb-3`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="email"
            placeholder="Your Email"
            className={`${fieldCls} mb-3`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            placeholder="Address"
            className={`${fieldCls} mb-3`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <input
            type="text"
            placeholder="Country"
            className={`${fieldCls} mb-3`}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          <button
            type="button"
            onClick={() => address && country && setStep(5)}
            className={`mt-2 ${btnPrimary}`}
          >
            Review
          </button>
        </Popup>
      )}

      {step === 5 && (
        <Popup>
          <h2 className="text-2xl font-bold mb-4 text-white">Review Your Details</h2>
          <div className="space-y-2 text-sm text-white/75">
            <p><strong className="text-white">Shipment:</strong> {shipment}</p>
            <p><strong className="text-white">Product:</strong> {product}</p>
            <p><strong className="text-white">Quantity:</strong> {quantity}</p>
            <p><strong className="text-white">Phone:</strong> {phone}</p>
            <p><strong className="text-white">Email:</strong> {email}</p>
            <p><strong className="text-white">Address:</strong> {address}</p>
            <p><strong className="text-white">Country:</strong> {country}</p>
          </div>

          <button
            type="button"
            onClick={handleFinalSubmit}
            className={`mt-5 ${btnPrimary}`}
          >
            Send Booking Request
          </button>
        </Popup>
      )}
    </div>
  );
}
