import { useEffect, useState } from "react";
import { Mail, MessageCircle, Phone, Bell, Check } from "lucide-react";
import { api } from "@/lib/api";
import { getSession, setSession } from "@/lib/authSession";
import { getOtpChannels } from "@/lib/appConfig";
import { InlineNotice } from "@/components/FallbackScreen";
import { toUserMessage } from "@/lib/friendlyError";

const TOPICS = [
  {
    key: "workflow",
    label: "Case & documents",
    desc: "KYC updates, milestone progress, and files from your desk",
  },
  {
    key: "billing",
    label: "Payments & invoices",
    desc: "Receipts, GST invoices, plan changes, and installment reminders",
  },
  {
    key: "weekly",
    label: "Weekly summary",
    desc: "A short recap of open items on your case",
  },
  {
    key: "marketing",
    label: "Events & offers",
    desc: "Workshops, trade events, and occasional product updates",
  },
];

export default function DashboardSettings() {
  const session = getSession();
  const live = getOtpChannels();
  const [phone, setPhone] = useState(session?.phone || "");
  const [prefs, setPrefs] = useState({
    email: true,
    whatsapp: true,
    workflow: true,
    billing: true,
    weekly: false,
    marketing: false,
  });
  const [channels, setChannels] = useState(live);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [notif, profile] = await Promise.all([
          api("/api/me/notifications"),
          api("/api/me/profile").catch(() => ({})),
        ]);
        if (cancelled) return;
        setPrefs((p) => ({
          ...p,
          email: notif.email !== false,
          whatsapp: notif.whatsapp !== false,
          workflow: notif.workflow !== false,
          billing: notif.billing !== false,
          weekly: Boolean(notif.weekly),
          marketing: Boolean(notif.marketing),
        }));
        if (notif.channels) setChannels(notif.channels);
        if (profile.phone != null) setPhone(String(profile.phone));
      } catch (err) {
        if (!cancelled) setError(toUserMessage(err, "Could not load notification settings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (key) => () => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const onSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        api("/api/me/notifications", { method: "PUT", body: prefs }),
        api("/api/me/profile", { method: "PUT", body: { phone: phone.trim() } }),
      ]);
      if (session) setSession({ ...session, phone: phone.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(toUserMessage(err, "Could not save settings. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const waLive = Boolean(channels.whatsappNotifications || channels.whatsappOtp);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-white/55">
          Choose how VIRASTRA reaches you. Sign-in codes always use the channels we currently have live.
        </p>
      </header>

      {error && <InlineNotice>{error}</InlineNotice>}

      <form onSubmit={onSave} className="space-y-6">
        <section className="glass-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Phone size={16} className="text-[var(--gold)]" /> Mobile for WhatsApp
          </div>
          <p className="mt-1 text-xs text-white/50">
            India numbers work as 10 digits or +91. We’ll only message this number about your account.
          </p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9XXXX XXXXX"
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[var(--gold)]/50"
          />
          {!waLive && (
            <p className="mt-3 text-xs text-white/45">
              WhatsApp is wired end-to-end but not live yet. Add your number now so codes and alerts start as soon as
              we switch it on.
            </p>
          )}
        </section>

        <section className="glass-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bell size={16} className="text-[var(--gold)]" /> Channels
          </div>
          <p className="mt-1 text-xs text-white/50">
            Turn a channel off to stop case and billing alerts there. OTP sign-in is controlled separately by VIRASTRA.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ChannelToggle
              icon={Mail}
              label="Email"
              desc={channels.emailNotifications ? "On for receipts, KYC, and desk updates" : "Email alerts are paused by VIRASTRA"}
              checked={prefs.email}
              onChange={toggle("email")}
              live={channels.emailNotifications}
            />
            <ChannelToggle
              icon={MessageCircle}
              label="WhatsApp"
              desc={
                waLive
                  ? "Friendly messages on your mobile, same updates as email"
                  : "Ready to go — we’ll enable this when our WhatsApp Business line is live"
              }
              checked={prefs.whatsapp}
              onChange={toggle("whatsapp")}
              live={waLive}
            />
          </div>
        </section>

        <section className="glass-card p-6">
          <div className="text-sm font-semibold">What to send</div>
          <ul className="mt-4 space-y-3">
            {TOPICS.map((t) => (
              <li key={t.key} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-white/50">{t.desc}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[t.key]}
                  onClick={toggle(t.key)}
                  className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                    prefs[t.key] ? "bg-[var(--gold)]" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition ${
                      prefs[t.key] ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || loading}
            className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function ChannelToggle({ icon: Icon, label, desc, checked, onChange, live }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-2xl border p-4 text-left transition ${
        checked ? "border-[var(--gold)]/35 bg-[var(--gold)]/10" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Icon size={16} className="text-[var(--gold)]" /> {label}
        </span>
        <span className={`text-[10px] uppercase tracking-wider ${live ? "text-emerald-300" : "text-white/40"}`}>
          {live ? "Live" : "Soon"}
        </span>
      </div>
      <p className="mt-2 text-xs text-white/50">{desc}</p>
      <p className="mt-3 text-xs text-white/70">{checked ? "You’ll receive these" : "Paused for your account"}</p>
    </button>
  );
}
