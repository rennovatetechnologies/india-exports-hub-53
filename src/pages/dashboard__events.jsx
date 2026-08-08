import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MapPin, Users, Check, Save, Plus, Trash2, Pencil, ArrowLeft, AlertCircle,
  Mail, Send,
} from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  loadEventsCatalog,
  fetchEventsCatalog,
  saveEventsCatalog,
  EVENT_IMAGE_OPTIONS,
  resolveEventImage,
  formatEventDate,
  toDateInputValue,
  getEventRegistrations,
  countEventRegistrations,
  seatsRemaining,
  isEventFull,
  occupancyLabel,
  registerForEvent,
  unregisterFromEvent,
  isEmailRegistered,
  seedEventRegistrationsIfNeeded,
  fetchEventRegistrationCounts,
  fetchEventRegistrations,
  fetchMyEventRegistrations,
  notifyEventRegistrants,
  fetchEventCommunications,
} from "@/lib/eventsCatalog";
import { getCustomerCase } from "@/lib/customerCase";
import { PATHS } from "@/lib/routes";

const emptyDraft = () => ({
  id: `e${Date.now()}`,
  title: "New event",
  date: "",
  city: "",
  img: "/event.png",
  capacity: 50,
  desc: "",
});

const NOTIFY_KINDS = [
  { value: "reschedule", label: "Reschedule" },
  { value: "followup", label: "Follow-up" },
  { value: "update", label: "General update" },
];

function AdminEventsEditor() {
  const [events, setEvents] = useState(() => loadEventsCatalog());
  const [regTick, setRegTick] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [comms, setComms] = useState([]);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyKind, setNotifyKind] = useState("followup");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyDate, setNotifyDate] = useState("");
  const [notifyCity, setNotifyCity] = useState("");
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyAllUsers, setNotifyAllUsers] = useState(false);

  useEffect(() => {
    fetchEventsCatalog()
      .then(async (list) => {
        setEvents(list);
        await fetchEventRegistrationCounts();
        setRegTick((t) => t + 1);
      })
      .catch(() => {});
    seedEventRegistrationsIfNeeded();
    const h = () => setEvents(loadEventsCatalog());
    const hr = () => setRegTick((t) => t + 1);
    window.addEventListener("iehub-events-updated", h);
    window.addEventListener("iehub-event-regs-updated", hr);
    return () => {
      window.removeEventListener("iehub-events-updated", h);
      window.removeEventListener("iehub-event-regs-updated", hr);
    };
  }, []);

  useEffect(() => {
    if (!detailId) {
      setComms([]);
      setNotifyOpen(false);
      setNotifyMsg("");
      return;
    }
    let cancelled = false;
    setLoadingRegs(true);
    (async () => {
      await fetchEventRegistrations(detailId);
      const history = await fetchEventCommunications(detailId);
      if (!cancelled) {
        setComms(history);
        setRegTick((t) => t + 1);
        setLoadingRegs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const openEditExisting = useCallback((id) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setDraft({
      ...ev,
      date: toDateInputValue(ev.date),
      capacity: Number(ev.capacity) || 50,
    });
    setEditKey(id);
    setDetailId(null);
  }, [events]);

  const openNew = useCallback(() => {
    setDraft(emptyDraft());
    setEditKey("new");
    setDetailId(null);
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
    if (!toDateInputValue(draft.date)) return;
    if (!String(draft.title || "").trim()) return;
    const payload = {
      ...draft,
      title: String(draft.title).trim(),
      date: toDateInputValue(draft.date),
      capacity: Math.max(1, Number(draft.capacity) || 1),
      img: resolveEventImage(draft.img),
    };
    let next;
    if (editKey === "new") {
      next = [...events, payload];
      void saveEventsCatalog(next, { onlyIds: [payload.id] });
    } else {
      next = events.map((e) => (e.id === editKey ? { ...payload, id: editKey } : e));
      void saveEventsCatalog(next, { onlyIds: [editKey] });
    }
    setEvents(next);
    setSavedAt(new Date());
    leaveEdit();
  };

  const removeCurrent = () => {
    if (editKey === "new" || !editKey) return;
    if (events.length <= 1) return;
    const next = events.filter((e) => e.id !== editKey);
    void saveEventsCatalog(next);
    setEvents(next);
    leaveEdit();
  };

  const sendNotify = async () => {
    if (!detailId || !notifyMessage.trim()) return;
    setNotifyBusy(true);
    setNotifyMsg("");
    try {
      const result = await notifyEventRegistrants(detailId, {
        kind: notifyKind,
        message: notifyMessage.trim(),
        subject: notifySubject.trim() || undefined,
        newDate: notifyKind === "reschedule" ? notifyDate || undefined : undefined,
        newCity: notifyKind === "reschedule" ? notifyCity || undefined : undefined,
        notifyAllUsers,
      });
      setNotifyMsg(
        notifyAllUsers
          ? `Sent to ${result?.recipientCount || 0} user(s) (registrants + all customers).`
          : `Sent to ${result?.recipientCount || 0} registrant(s).`
      );
      setNotifyMessage("");
      setNotifySubject("");
      const history = await fetchEventCommunications(detailId);
      setComms(history);
      if (notifyKind === "reschedule") {
        const refreshed = await fetchEventsCatalog({ force: true });
        setEvents(refreshed);
      }
    } catch (e) {
      setNotifyMsg(e?.message || "Could not send.");
    } finally {
      setNotifyBusy(false);
    }
  };

  const isEditing = editKey !== null && draft;
  const detailEvent = detailId ? events.find((e) => e.id === detailId) : null;
  const detailRegs = detailEvent ? getEventRegistrations(detailEvent.id) : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events catalog</h1>
          <p className="mt-1 text-sm text-white/55">
            {isEditing
              ? "Set date, image, and seat capacity. Registrations update the fill count automatically."
              : "See who registered, email them for reschedules or follow-ups, and track seat fill."}
          </p>
        </div>
        {!isEditing ? (
          <div className="flex flex-wrap gap-2">
            <Link
              to={PATHS.adminPayments}
              className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Payments
            </Link>
            <button type="button" onClick={openNew} className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <Plus size={16} /> Add event
            </button>
          </div>
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
        <div className="glass-card p-5 space-y-5">
          <div className="border-b border-white/10 pb-3 font-mono text-[11px] text-white/50">{draft.id}</div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs uppercase tracking-wider text-white/45 sm:col-span-2">
              Title
              <input
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Date
              <input
                type="date"
                value={toDateInputValue(draft.date)}
                onChange={(e) => updateDraft({ date: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40 [color-scheme:dark]"
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
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Seat capacity
              <input
                type="number"
                min={1}
                value={draft.capacity}
                onChange={(e) => updateDraft({ capacity: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45 sm:col-span-2">
              Description
              <textarea
                value={draft.desc}
                onChange={(e) => updateDraft({ desc: e.target.value })}
                rows={3}
                className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-white/45">Cover photo</div>
            <p className="mt-1 text-[11px] text-white/40">Pick one of the existing site photos — uploads are not allowed.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {EVENT_IMAGE_OPTIONS.map((opt) => {
                const selected = resolveEventImage(draft.img) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateDraft({ img: opt.value })}
                    className={`group overflow-hidden rounded-xl border text-left transition ${
                      selected
                        ? "border-[var(--gold)] ring-1 ring-[var(--gold)]/50"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-zinc-900">
                      <img src={opt.value} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                    </div>
                    <div className={`px-2 py-1.5 text-[10px] ${selected ? "text-[var(--gold)]" : "text-white/55"}`}>
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((ev) => {
            const used = countEventRegistrations(ev.id);
            const left = seatsRemaining(ev);
            const full = isEventFull(ev);
            const pct = ev.capacity ? Math.min(100, Math.round((used / ev.capacity) * 100)) : 0;
            void regTick;
            return (
              <motion.article key={ev.id} layout className="glass-card flex flex-col overflow-hidden">
                <div className="relative h-48 w-full shrink-0 bg-zinc-900">
                  <img
                    src={ev.img}
                    alt={ev.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/event.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <span
                    className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur ${
                      full ? "bg-rose-500/80 text-white" : "bg-emerald-500/80 text-white"
                    }`}
                  >
                    {full ? "Sold out" : `${left} seats left`}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-lg font-semibold text-white">{ev.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{ev.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/55">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} className="text-[var(--gold)]" /> {formatEventDate(ev.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-[var(--gold)]" /> {ev.city || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} className="text-[var(--gold)]" /> {occupancyLabel(ev)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/40">
                      <span>Fill</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${full ? "bg-rose-400" : "bg-[var(--grad-gold)]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailId(ev.id)}
                      className="btn-ghost inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                    >
                      <Users size={15} /> Registrations ({used})
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditExisting(ev.id)}
                      className="btn-gold inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                    >
                      <Pencil size={15} /> Edit
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {!isEditing && (
        <p className="text-xs text-white/40">
          Event fees apply to every plan. Saving an event emails all registrants
          automatically. Open{" "}
          <Link to={PATHS.adminPayments} className="text-[var(--gold)] hover:underline">
            Payments
          </Link>{" "}
          for the payment ledger.
        </p>
      )}

      <AnimatePresence>
        {detailEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDetailId(null)}
            />
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0a0d14] p-6 overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{detailEvent.title}</h3>
                  <p className="mt-1 text-xs text-white/50">
                    {formatEventDate(detailEvent.date)} · {occupancyLabel(detailEvent)}
                  </p>
                </div>
                <button type="button" onClick={() => setDetailId(null)} className="rounded-md p-1 text-white/45 hover:text-white">✕</button>
              </div>

              {isEventFull(detailEvent) ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                  <AlertCircle size={14} /> Seats completed — this event is full.
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
                  {seatsRemaining(detailEvent)} seats still available.
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setNotifyOpen((o) => !o)}
                  className="btn-gold inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"
                >
                  <Mail size={15} /> {notifyOpen ? "Hide compose" : "Email attendees"}
                </button>
              </div>

              {notifyOpen && (
                <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <label className="block text-[11px] uppercase tracking-wider text-white/45">
                    Type
                    <select
                      value={notifyKind}
                      onChange={(e) => setNotifyKind(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none"
                    >
                      {NOTIFY_KINDS.map((k) => (
                        <option key={k.value} value={k.value}>{k.label}</option>
                      ))}
                    </select>
                  </label>
                  {notifyKind === "reschedule" && (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block text-[11px] uppercase tracking-wider text-white/45">
                        New date
                        <input
                          type="date"
                          value={notifyDate}
                          onChange={(e) => setNotifyDate(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none [color-scheme:dark]"
                        />
                      </label>
                      <label className="block text-[11px] uppercase tracking-wider text-white/45">
                        New city
                        <input
                          value={notifyCity}
                          onChange={(e) => setNotifyCity(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </div>
                  )}
                  <label className="block text-[11px] uppercase tracking-wider text-white/45">
                    Subject (optional)
                    <input
                      value={notifySubject}
                      onChange={(e) => setNotifySubject(e.target.value)}
                      placeholder="Leave blank for default"
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block text-[11px] uppercase tracking-wider text-white/45">
                    Message
                    <textarea
                      value={notifyMessage}
                      onChange={(e) => setNotifyMessage(e.target.value)}
                      rows={4}
                      placeholder="Share reschedule details, agenda notes, or a follow-up ask…"
                      className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={notifyAllUsers}
                      onChange={(e) => setNotifyAllUsers(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Also notify all platform users
                      <span className="mt-0.5 block text-[11px] text-white/40">
                        Emails every customer account, not only this event&apos;s registrants.
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={
                      notifyBusy ||
                      !notifyMessage.trim() ||
                      (!notifyAllUsers && detailRegs.length === 0)
                    }
                    onClick={sendNotify}
                    className="btn-gold inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    <Send size={14} />{" "}
                    {notifyBusy
                      ? "Sending…"
                      : notifyAllUsers
                        ? "Send to all users"
                        : `Send to ${detailRegs.length} registrant(s)`}
                  </button>
                  {notifyMsg && <p className="text-xs text-emerald-300/90">{notifyMsg}</p>}
                </div>
              )}

              <div className="mt-5 text-[11px] uppercase tracking-wider text-white/45">
                Registered attendees ({loadingRegs ? "…" : detailRegs.length})
              </div>
              <ul className="mt-2 space-y-2">
                {!loadingRegs && detailRegs.length === 0 && (
                  <li className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/45">
                    No registrations yet.
                  </li>
                )}
                {detailRegs.map((r) => (
                  <li key={`${r.email}-${r.at}`} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                    <div className="text-sm text-white">{r.name || r.email}</div>
                    <div className="text-[11px] text-white/45">{r.email}{r.company ? ` · ${r.company}` : ""}</div>
                    <div className="mt-1 text-[10px] text-white/35">
                      {r.at ? new Date(r.at).toLocaleString("en-IN") : ""}
                      {r.paymentId ? ` · paid` : ""}
                    </div>
                  </li>
                ))}
              </ul>

              {comms.length > 0 && (
                <>
                  <div className="mt-6 text-[11px] uppercase tracking-wider text-white/45">
                    Recent communications ({comms.length})
                  </div>
                  <ul className="mt-2 space-y-2">
                    {comms.slice(0, 8).map((c) => (
                      <li key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-white/45">
                          <span className="uppercase tracking-wider text-[var(--gold)]">{c.kind}</span>
                          <span>{c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN") : ""}</span>
                        </div>
                        <p className="mt-1 line-clamp-3 text-xs text-white/70">{c.message}</p>
                        <div className="mt-1 text-[10px] text-white/35">
                          {c.recipientCount || 0} recipients · {c.sentBy?.email || ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerEvents() {
  const session = getSession();
  const [events, setEvents] = useState(() => loadEventsCatalog());
  const [regTick, setRegTick] = useState(0);
  const [msg, setMsg] = useState("");
  const c = session?.email ? getCustomerCase(session.email) : null;

  useEffect(() => {
    fetchEventsCatalog().then(setEvents).catch(() => {});
    fetchMyEventRegistrations().then(() => setRegTick((t) => t + 1)).catch(() => {});
    seedEventRegistrationsIfNeeded();
    const h = () => setEvents(loadEventsCatalog());
    const hr = () => setRegTick((t) => t + 1);
    window.addEventListener("iehub-events-updated", h);
    window.addEventListener("iehub-event-regs-updated", hr);
    return () => {
      window.removeEventListener("iehub-events-updated", h);
      window.removeEventListener("iehub-event-regs-updated", hr);
    };
  }, []);

  const toggleReserve = async (ev) => {
    if (!session?.email) {
      setMsg("Sign in to reserve a seat.");
      return;
    }
    void regTick;
    if (isEmailRegistered(ev.id, session.email)) {
      await unregisterFromEvent(ev.id, session.email);
      setMsg("Reservation cancelled.");
      setRegTick((t) => t + 1);
      return;
    }
    const price = Math.max(0, Math.round(Number(ev.priceInr) || 0));
    setMsg(price > 0 ? "Opening payment…" : "Reserving seat…");
    const result = await registerForEvent(ev.id, {
      email: session.email,
      name: session.name,
      company: session.company || c?.company || "",
      priceInr: price,
      title: ev.title,
    });
    if (!result.ok) {
      if (result.reason === "cancelled") {
        setMsg("Payment cancelled.");
        return;
      }
      setMsg(
        result.reason === "full"
          ? "This event is full."
          : result.reason === "already"
            ? "Already registered."
            : result.reason
      );
      return;
    }
    setMsg(
      result.paid
        ? "Payment successful — seat reserved."
        : "Seat reserved."
    );
    setRegTick((t) => t + 1);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Events &amp; summits</h1>
        <p className="mt-1 text-sm text-white/55">
          Reserve your seat at curated trade events. Event fees apply to every plan, including Premium.
        </p>
        {msg && <p className="mt-2 text-xs text-emerald-300/90">{msg}</p>}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {events.map((ev) => {
          void regTick;
          const mine = session?.email ? isEmailRegistered(ev.id, session.email) : false;
          const full = isEventFull(ev) && !mine;
          return (
            <motion.article key={ev.id} whileHover={{ y: -3 }} className="glass-card overflow-hidden">
              <div className="relative h-52 w-full bg-zinc-900">
                <img
                  src={ev.img}
                  alt={ev.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/event.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span
                  className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider backdrop-blur ${
                    full ? "bg-rose-500/80 text-white" : "bg-black/50 text-[var(--gold)]"
                  }`}
                >
                  {full ? "Sold out" : occupancyLabel(ev)}
                </span>
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold">{ev.title}</h2>
                <p className="mt-2 text-sm text-white/60">{ev.desc}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--gold)]" /> {formatEventDate(ev.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-[var(--gold)]" /> {ev.city}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} className="text-[var(--gold)]" /> {occupancyLabel(ev)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={full}
                  onClick={() => toggleReserve(ev)}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    mine ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "btn-gold"
                  }`}
                >
                  {mine ? (
                    <>
                      <Check size={15} /> Seat reserved — tap to cancel
                    </>
                  ) : full ? (
                    "Seats completed"
                  ) : Number(ev.priceInr) > 0 ? (
                    `Reserve seat (₹${Number(ev.priceInr).toLocaleString("en-IN")})`
                  ) : (
                    "Reserve seat — free"
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
  if (session?.role === ROLES.ADMIN || session?.role === ROLES.OPERATIONS) {
    return <AdminEventsEditor />;
  }
  return <CustomerEvents />;
}
