import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Check, Save, Plus, Trash2, Pencil, ArrowLeft } from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import { loadEventsCatalog, saveEventsCatalog } from "@/lib/eventsCatalog";

const emptyDraft = () => ({
  id: `e${Date.now()}`,
  title: "New event",
  date: "",
  city: "",
  img: "/event.png",
  seats: "",
  desc: "",
});

function AdminEventsEditor() {
  const [events, setEvents] = useState(() => loadEventsCatalog());
  const [savedAt, setSavedAt] = useState(null);
  /** `null` = browse catalog; `new` or an event id = edit mode. */
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const h = () => setEvents(loadEventsCatalog());
    window.addEventListener("iehub-events-updated", h);
    return () => window.removeEventListener("iehub-events-updated", h);
  }, []);

  const openEditExisting = useCallback((id) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setDraft({ ...ev });
    setEditKey(id);
  }, [events]);

  const openNew = useCallback(() => {
    setDraft(emptyDraft());
    setEditKey("new");
  }, []);

  const leaveEdit = useCallback(() => {
    setEditKey(null);
    setDraft(null);
    setEvents(loadEventsCatalog());
  }, []);

  const updateDraft = useCallback((patch) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }, []);

  const saveDraft = () => {
    if (!draft) return;
    let next;
    if (editKey === "new") {
      next = [...events, { ...draft }];
    } else {
      next = events.map((e) => (e.id === editKey ? { ...draft, id: editKey } : e));
    }
    saveEventsCatalog(next);
    setEvents(loadEventsCatalog());
    setSavedAt(new Date());
    leaveEdit();
  };

  const removeCurrent = () => {
    if (editKey === "new" || !editKey) return;
    if (events.length <= 1) return;
    const next = events.filter((e) => e.id !== editKey);
    saveEventsCatalog(next);
    setEvents(loadEventsCatalog());
    leaveEdit();
  };

  const isEditing = editKey !== null && draft;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events catalog</h1>
          <p className="mt-1 text-sm text-white/55">
            {isEditing
              ? "Change fields below, then Save. Customer-facing Events page reads this catalog."
              : "Browse what is published. Open an event to review details, then use Edit to change it."}
          </p>
        </div>
        {!isEditing ? (
          <button type="button" onClick={openNew} className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
            <Plus size={16} /> Add event
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={leaveEdit} className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <ArrowLeft size={16} /> Back
            </button>
            {editKey !== "new" && events.length > 1 && (
              <button
                type="button"
                onClick={removeCurrent}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-400/10"
              >
                <Trash2 size={16} /> Remove
              </button>
            )}
            <button type="button" onClick={saveDraft} className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <Save size={16} /> Save
            </button>
          </div>
        )}
      </header>
      {savedAt && !isEditing && (
        <p className="text-xs text-emerald-300/90">Saved at {savedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.</p>
      )}

      {isEditing ? (
        <div className="glass-card p-5">
          <div className="border-b border-white/10 pb-3 font-mono text-[11px] text-white/50">{draft.id}</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Title
              <input
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Image URL
              <input
                value={draft.img}
                onChange={(e) => updateDraft({ img: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Date
              <input
                value={draft.date}
                onChange={(e) => updateDraft({ date: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              City / venue
              <input
                value={draft.city}
                onChange={(e) => updateDraft({ city: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45 sm:col-span-2">
              Seats / capacity label
              <input
                value={draft.seats}
                onChange={(e) => updateDraft({ seats: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
          </div>
          <label className="mt-4 block text-xs uppercase tracking-wider text-white/45">
            Description
            <textarea
              value={draft.desc}
              onChange={(e) => updateDraft({ desc: e.target.value })}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((ev) => (
            <motion.article key={ev.id} layout className="glass-card flex flex-col overflow-hidden">
              <div className="relative h-52 w-full shrink-0">
                <img src={ev.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--gold)] backdrop-blur">
                  Catalog
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-lg font-semibold text-white">{ev.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-white/60">{ev.desc}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--gold)]" /> {ev.date || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-[var(--gold)]" /> {ev.city || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} className="text-[var(--gold)]" /> {ev.seats || "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openEditExisting(ev.id)}
                  className="btn-ghost mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                >
                  <Pencil size={15} /> Edit
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {!isEditing && (
        <p className="text-xs text-white/40">
          Tip: open{" "}
          <Link to="/dashboard/billing" className="text-[var(--gold)] hover:underline">
            Revenue &amp; plan catalog
          </Link>{" "}
          to adjust pricing.
        </p>
      )}
    </div>
  );
}

function CustomerEvents() {
  const [events, setEvents] = useState(() => loadEventsCatalog());
  const [reserved, setReserved] = useState({});

  useEffect(() => {
    const h = () => setEvents(loadEventsCatalog());
    window.addEventListener("iehub-events-updated", h);
    return () => window.removeEventListener("iehub-events-updated", h);
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Events &amp; summits</h1>
        <p className="mt-1 text-sm text-white/55">Reserve your seat at curated trade events.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {events.map((ev) => {
          const isReserved = reserved[ev.id];
          return (
            <motion.article key={ev.id} whileHover={{ y: -3 }} className="glass-card overflow-hidden">
              <div className="relative h-52 w-full">
                <img src={ev.img} alt={ev.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--gold)] backdrop-blur">
                  Featured
                </span>
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold">{ev.title}</h2>
                <p className="mt-2 text-sm text-white/60">{ev.desc}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--gold)]" /> {ev.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-[var(--gold)]" /> {ev.city}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} className="text-[var(--gold)]" /> {ev.seats}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReserved((r) => ({ ...r, [ev.id]: !r[ev.id] }))}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                    isReserved ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "btn-gold"
                  }`}
                >
                  {isReserved ? (
                    <>
                      <Check size={15} /> Seat reserved
                    </>
                  ) : (
                    "Reserve seat"
                  )}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const session = getSession();
  if (session?.role === ROLES.ADMIN) return <AdminEventsEditor />;
  return <CustomerEvents />;
}
