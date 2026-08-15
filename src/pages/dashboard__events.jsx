import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MapPin, Users, Check, Save, Plus, Trash2, Pencil, ArrowLeft, AlertCircle,
  Mail, Send, CreditCard, X,
} from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  loadEventsCatalog,
  fetchEventsCatalog,
  saveEventsCatalog,
  deleteEventFromCatalog,
  EVENT_IMAGE_OPTIONS,
  resolveEventImage,
  formatEventDateRange,
  toDateInputValue,
  eventEffectivePrice,
  eventHasDiscount,
  getEventRegistrations,
  countEventRegistrations,
  seatsRemaining,
  isEventFull,
  occupancyLabel,
  registerForEvent,
  unregisterFromEvent,
  getMyRegistration,
  isPartialRegistration,
  seedEventRegistrationsIfNeeded,
  fetchEventRegistrationCounts,
  fetchEventRegistrations,
  fetchMyEventRegistrations,
  fetchMyInstallmentPlans,
  notifyEventRegistrants,
  fetchEventCommunications,
  filterActiveEvents,
  isEventExpired,
} from "@/lib/eventsCatalog";
import { formatInr } from "@/lib/planCatalog";
import { getCustomerCase } from "@/lib/customerCase";
import { PATHS } from "@/lib/routes";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";
import { InlineNotice } from "@/components/FallbackScreen";

const emptyDraft = () => ({
  title: "New event",
  date: "",
  startDate: "",
  endDate: "",
  city: "",
  img: "/event.png",
  capacity: 50,
  desc: "",
  priceInr: 0,
  discountPercent: 0,
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
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
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
    fetchEventsCatalog({ force: true })
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
      startDate: toDateInputValue(ev.startDate || ev.date),
      endDate: toDateInputValue(ev.endDate || ev.startDate || ev.date),
      date: toDateInputValue(ev.startDate || ev.date),
      capacity: Number(ev.capacity) || 50,
      priceInr: Math.max(0, Math.round(Number(ev.priceInr) || 0)),
      discountPercent: Math.max(0, Number(ev.discountPercent) || 0),
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
    setSaveError("");
    setSaving(false);
    setEvents(loadEventsCatalog());
  }, []);

  const updateDraft = useCallback((patch) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }, []);

  const saveDraft = async () => {
    if (!draft || saving) return;
    if (!String(draft.title || "").trim()) {
      setSaveError("Title is required.");
      return;
    }
    if (!toDateInputValue(draft.startDate || draft.date)) {
      setSaveError("Start date is required.");
      return;
    }
    const startDate = toDateInputValue(draft.startDate || draft.date);
    let endDate = toDateInputValue(draft.endDate) || startDate;
    if (endDate < startDate) endDate = startDate;
    const payload = {
      ...draft,
      title: String(draft.title).trim(),
      date: startDate,
      startDate,
      endDate,
      capacity: Math.max(1, Number(draft.capacity) || 1),
      img: resolveEventImage(draft.img),
      priceInr: Math.max(0, Math.round(Number(draft.priceInr) || 0)),
      discountPercent: Math.min(100, Math.max(0, Number(draft.discountPercent) || 0)),
    };
    setSaveError("");
    setSaving(true);
    try {
      if (editKey === "new") {
        await saveEventsCatalog([payload], { create: true });
      } else {
        const next = events.map((e) => (e.id === editKey ? { ...payload, id: editKey } : e));
        await saveEventsCatalog(next, { onlyIds: [editKey] });
      }
      const list = await fetchEventsCatalog({ force: true }).catch(() => loadEventsCatalog());
      setEvents(list);
      setSavedAt(new Date());
      setEditKey(null);
      setDraft(null);
    } catch (e) {
      setSaveError(toUserMessage(e, USER_MESSAGES.save));
    } finally {
      setSaving(false);
    }
  };

  const removeCurrent = async () => {
    if (editKey === "new" || !editKey || saving) return;
    if (!window.confirm("Remove this event from the site?")) return;
    setSaveError("");
    setSaving(true);
    try {
      const next = await deleteEventFromCatalog(editKey);
      setEvents(next);
      setSavedAt(new Date());
      setEditKey(null);
      setDraft(null);
    } catch (e) {
      setSaveError(toUserMessage(e, "We couldn't remove that event. Please try again."));
    } finally {
      setSaving(false);
    }
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
      setNotifyMsg(toUserMessage(e, USER_MESSAGES.send));
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
              ? "Set dates, price, discount, image, and seat capacity. Saved events appear for users immediately."
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
                disabled={saving}
                onClick={() => void removeCurrent()}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-400/10 disabled:opacity-50"
              >
                <Trash2 size={16} /> Remove
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveDraft()}
              className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              <Save size={16} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </header>
      {saveError && isEditing && (
        <p className="text-xs text-rose-300/90">{saveError}</p>
      )}
      {savedAt && !isEditing && (
        <p className="text-xs text-emerald-300/90">Saved at {savedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.</p>
      )}

      {isEditing ? (
        <div className="glass-card p-5 space-y-5">
          <div className="border-b border-white/10 pb-3 font-mono text-[11px] text-white/50">
            {editKey === "new" ? "ID assigned on save" : draft.id}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs uppercase tracking-wider text-white/45 sm:col-span-2">
              Title
              <input
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                required
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Start date
              <input
                type="date"
                required
                value={toDateInputValue(draft.startDate || draft.date)}
                onChange={(e) =>
                  updateDraft({
                    startDate: e.target.value,
                    date: e.target.value,
                    endDate:
                      !draft.endDate || draft.endDate < e.target.value
                        ? e.target.value
                        : draft.endDate,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40 [color-scheme:dark]"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              End date
              <input
                type="date"
                min={toDateInputValue(draft.startDate || draft.date) || undefined}
                value={toDateInputValue(draft.endDate || draft.startDate || draft.date)}
                onChange={(e) => updateDraft({ endDate: e.target.value })}
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
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Price (INR)
              <input
                type="number"
                min={0}
                step={1}
                value={draft.priceInr ?? 0}
                onChange={(e) => updateDraft({ priceInr: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Discount %
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={draft.discountPercent ?? 0}
                onChange={(e) => updateDraft({ discountPercent: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55 sm:col-span-2">
              Payable:{" "}
              <span className="font-medium text-white">{formatInr(eventEffectivePrice(draft))}</span>
              {eventHasDiscount(draft) ? (
                <span className="text-white/40">
                  {" "}
                  (list {formatInr(draft.priceInr)} · {draft.discountPercent}% off)
                </span>
              ) : Number(draft.priceInr) > 0 ? (
                <span className="text-white/40"> · users pay this + GST to reserve a seat</span>
              ) : (
                <span className="text-white/40"> · free registration</span>
              )}
              <span className="mt-1 block text-white/35">
                Payable + GST of ₹1,00,000 or more unlocks 3 installments (every 10 days, within 30 days).
              </span>
            </div>
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
          {events.length === 0 && (
            <p className="text-sm text-white/50 md:col-span-2">
              No events yet. Click Add event — new events go live for users as soon as you save.
            </p>
          )}
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
                      isEventExpired(ev)
                        ? "bg-white/20 text-white/80"
                        : full
                          ? "bg-rose-500/80 text-white"
                          : "bg-emerald-500/80 text-white"
                    }`}
                  >
                    {isEventExpired(ev) ? "Ended" : full ? "Sold out" : `${left} seats left`}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-lg font-semibold text-white">{ev.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{ev.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/55">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} className="text-[var(--gold)]" /> {formatEventDateRange(ev.startDate || ev.date, ev.endDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-[var(--gold)]" /> {ev.city || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} className="text-[var(--gold)]" /> {occupancyLabel(ev)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    {eventEffectivePrice(ev) > 0 ? (
                      <>
                        <span className="text-base font-semibold text-[var(--gold)]">{formatInr(eventEffectivePrice(ev))}</span>
                        {eventHasDiscount(ev) && (
                          <>
                            <span className="text-xs text-white/40 line-through">{formatInr(ev.priceInr)}</span>
                            <span className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--gold)]">
                              {ev.discountPercent}% off
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-medium text-emerald-300/90">Free</span>
                    )}
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
                    {formatEventDateRange(detailEvent.startDate || detailEvent.date, detailEvent.endDate)} · {occupancyLabel(detailEvent)}
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
                  {notifyMsg && (
                    <InlineNotice tone={/^Sent to/.test(notifyMsg) ? "success" : "error"}>{notifyMsg}</InlineNotice>
                  )}
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
                      {r.status === "partial"
                        ? ` · installment ${r.paidInstallments || 0}/${r.installmentCount || 3}`
                        : r.paymentId
                          ? " · paid"
                          : ""}
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

function formatDue(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function CustomerEvents() {
  const session = getSession();
  const [events, setEvents] = useState(() => filterActiveEvents(loadEventsCatalog()));
  const [regTick, setRegTick] = useState(0);
  const [msg, setMsg] = useState("");
  const [msgTone, setMsgTone] = useState("info");
  const [plans, setPlans] = useState([]);
  const [choiceEvent, setChoiceEvent] = useState(null);
  const [paying, setPaying] = useState(false);
  const c = session?.email ? getCustomerCase(session.email) : null;

  const reloadPlans = async () => {
    const list = await fetchMyInstallmentPlans();
    setPlans(list);
    setRegTick((t) => t + 1);
  };

  useEffect(() => {
    fetchEventsCatalog({ force: true }).then((list) => setEvents(filterActiveEvents(list))).catch(() => {});
    fetchMyEventRegistrations().then(() => setRegTick((t) => t + 1)).catch(() => {});
    fetchMyInstallmentPlans().then(setPlans).catch(() => {});
    seedEventRegistrationsIfNeeded();
    const h = () => setEvents(filterActiveEvents(loadEventsCatalog()));
    const hr = () => setRegTick((t) => t + 1);
    window.addEventListener("iehub-events-updated", h);
    window.addEventListener("iehub-event-regs-updated", hr);
    return () => {
      window.removeEventListener("iehub-events-updated", h);
      window.removeEventListener("iehub-event-regs-updated", hr);
    };
  }, []);

  const payForEvent = async (ev, { payInInstallments = false, installmentPlanId } = {}) => {
    if (isEventExpired(ev) && !installmentPlanId) {
      setMsgTone("error");
      setMsg("This event has ended.");
      return;
    }
    const price = Math.max(0, Math.round(Number(ev.effectivePrice ?? ev.priceInr) || 0));
    setPaying(true);
    setMsgTone("info");
    setMsg(payInInstallments || installmentPlanId ? "Opening installment payment…" : "Opening payment…");
    const result = await registerForEvent(ev.id, {
      email: session.email,
      name: session.name,
      company: session.company || c?.company || "",
      priceInr: price,
      title: ev.title,
      payInInstallments,
      installmentPlanId,
    });
    setPaying(false);
    if (!result.ok) {
      if (result.reason === "cancelled") {
        setMsgTone("info");
        setMsg("Payment was cancelled. You can try again when you're ready.");
        return;
      }
      setMsgTone("error");
      setMsg(
        result.reason === "full"
          ? "This event is full."
          : result.reason === "already"
            ? "You're already registered for this event."
            : toUserMessage(result.reason, USER_MESSAGES.payment)
      );
      return;
    }
    await fetchMyEventRegistrations().catch(() => {});
    await reloadPlans();
    setChoiceEvent(null);
    setMsgTone("success");
    setMsg(
      result.installment
        ? "Installment received — remaining payments are due every 10 days."
        : result.paid
          ? "Payment successful — seat reserved."
          : "Seat reserved."
    );
  };

  const toggleReserve = async (ev) => {
    if (!session?.email) {
      setMsgTone("info");
      setMsg("Sign in to reserve a seat.");
      return;
    }
    void regTick;
    const mine = getMyRegistration(ev.id, session.email);
    const plan = plans.find((p) => p.eventId === ev.id);
    if (mine && isPartialRegistration(mine) && plan?.next) {
      await payForEvent(ev, { installmentPlanId: plan.id });
      return;
    }
    if (mine && !isPartialRegistration(mine)) {
      try {
        await unregisterFromEvent(ev.id, session.email);
        setMsgTone("success");
        setMsg("Reservation cancelled.");
        await reloadPlans();
      } catch (e) {
        setMsgTone("error");
        setMsg(toUserMessage(e, "We couldn't cancel that reservation. Please try again."));
      }
      return;
    }
    const price = Math.max(0, Math.round(Number(ev.effectivePrice ?? ev.priceInr) || 0));
    if (price > 0 && (ev.installmentEligible || ev.installmentOptions)) {
      setChoiceEvent(ev);
      return;
    }
    if (price <= 0) {
      setMsgTone("info");
      setMsg("Reserving seat…");
    }
    await payForEvent(ev);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Events &amp; summits</h1>
        <p className="mt-1 text-sm text-white/55">
          Reserve your seat at curated trade events. Event fees apply to every plan, including Premium.
          Fees of ₹1,00,000 or more can be split into 3 payments over 30 days.
        </p>
        {msg && (
          <InlineNotice className="mt-3" tone={msgTone === "error" ? "error" : msgTone === "success" ? "success" : "info"}>
            {msg}
          </InlineNotice>
        )}
      </header>

      {plans.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/80">Pending event payments</h2>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="glass-card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-medium">{plan.eventTitle}</p>
                <p className="mt-1 text-xs text-white/50">
                  {plan.paidCount} of {plan.installmentCount} paid
                  {plan.next
                    ? ` · next ${formatInr(plan.next.amounts?.total)} due ${formatDue(plan.next.dueAt)}`
                    : ""}
                  {plan.dueBy ? ` · complete by ${formatDue(plan.dueBy)}` : ""}
                </p>
              </div>
              {plan.next && (
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => {
                    const ev = events.find((e) => e.id === plan.eventId) || {
                      id: plan.eventId,
                      title: plan.eventTitle,
                      effectivePrice: plan.next.amounts?.total,
                      priceInr: plan.next.amounts?.total,
                    };
                    payForEvent(ev, { installmentPlanId: plan.id });
                  }}
                  className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  <CreditCard size={14} />
                  Pay installment {plan.next.number} of {plan.installmentCount}
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {events.length === 0 && (
          <p className="text-sm text-white/50 md:col-span-2">No events published yet. Check back soon.</p>
        )}
        {events.map((ev) => {
          void regTick;
          const mine = session?.email ? getMyRegistration(ev.id, session.email) : null;
          const reserved = Boolean(mine);
          const partial = isPartialRegistration(mine);
          const plan = plans.find((p) => p.eventId === ev.id);
          const full = isEventFull(ev) && !reserved;
          const eligible = Boolean(ev.installmentEligible || ev.installmentOptions);
          const price = eventEffectivePrice(ev);
          const discounted = eventHasDiscount(ev);
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
                {discounted && (
                  <span className="absolute right-4 top-4 rounded-full bg-[var(--gold)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                    {ev.discountPercent}% off
                  </span>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold">{ev.title}</h2>
                <p className="mt-2 text-sm text-white/60">{ev.desc}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--gold)]" /> {formatEventDateRange(ev.startDate || ev.date, ev.endDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-[var(--gold)]" /> {ev.city}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} className="text-[var(--gold)]" /> {occupancyLabel(ev)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  {price > 0 ? (
                    <>
                      <span className="text-lg font-semibold text-[var(--gold)]">{formatInr(price)}</span>
                      {discounted && (
                        <span className="text-sm text-white/40 line-through">{formatInr(ev.priceInr)}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-medium text-emerald-300/90">Free to attend</span>
                  )}
                </div>
                {eligible && !reserved && (
                  <p className="mt-3 text-[11px] text-[var(--gold)]/80">
                    Pay in full or in 3 parts every 10 days (within 30 days).
                  </p>
                )}
                {partial && plan?.next && (
                  <p className="mt-3 text-[11px] text-amber-200/90">
                    Seat held · {plan.paidCount}/{plan.installmentCount} paid · next due {formatDue(plan.next.dueAt)}
                  </p>
                )}
                <button
                  type="button"
                  disabled={full || paying}
                  onClick={() => toggleReserve(ev)}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    reserved && !partial
                      ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "btn-gold"
                  }`}
                >
                  {partial && plan?.next ? (
                    <>
                      <CreditCard size={15} /> Pay installment {plan.next.number} of {plan.installmentCount} (
                      {formatInr(plan.next.amounts?.total)})
                    </>
                  ) : reserved ? (
                    <>
                      <Check size={15} /> Seat reserved — tap to cancel
                    </>
                  ) : full ? (
                    "Seats completed"
                  ) : price > 0 ? (
                    `Reserve seat (${formatInr(price)} + GST)`
                  ) : (
                    "Reserve seat — free"
                  )}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>

      <AnimatePresence>
        {choiceEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => !paying && setChoiceEvent(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-x-4 top-[12%] z-50 mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0d14] p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">How would you like to pay?</h3>
                  <p className="mt-1 text-sm text-white/55">{choiceEvent.title}</p>
                </div>
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => setChoiceEvent(null)}
                  className="rounded-md p-1 text-white/45 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="mt-4 text-xs text-white/50">
                This event is above ₹1 lakh. Pay in full now, or split into 3 payments 10 days apart,
                all within 30 days. We will email reminders before each due date.
              </p>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => payForEvent(choiceEvent)}
                  className="btn-gold rounded-xl px-4 py-3 text-left text-sm font-semibold disabled:opacity-50"
                >
                  Pay in full
                  <span className="mt-1 block text-xs font-normal text-black/70">
                    {formatInr(choiceEvent.payableTotalInr || eventEffectivePrice(choiceEvent))} including GST
                  </span>
                </button>
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => payForEvent(choiceEvent, { payInInstallments: true })}
                  className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-3 text-left text-sm font-semibold text-[var(--gold)] disabled:opacity-50"
                >
                  Pay in 3 installments
                  <span className="mt-1 block text-xs font-normal text-white/55">
                    {(choiceEvent.installmentOptions?.parts || []).length
                      ? choiceEvent.installmentOptions.parts
                          .map(
                            (p) =>
                              `${p.number}. ${formatInr(p.totalInr)} · day ${p.dueOffsetDays}`
                          )
                          .join("  ·  ")
                      : "Three equal payments, 10 days apart"}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
