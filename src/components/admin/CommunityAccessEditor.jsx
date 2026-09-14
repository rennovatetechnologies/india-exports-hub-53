import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { formatInr, GST_RATE } from "@/lib/planCatalog";
import {
  fetchCommunityAccess,
  getCachedCommunitySettings,
  saveCommunitySettings,
} from "@/lib/communityAccess";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";

export default function CommunityAccessEditor() {
  const [draft, setDraft] = useState(() => getCachedCommunitySettings());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchCommunityAccess({ force: true })
      .then((a) => setDraft({ ...a.settings }))
      .catch(() => {});
  }, []);

  const benefitsText = (draft.benefits || []).join("\n");
  const taxable = Math.max(0, Math.round(Number(draft.priceInr) || 0));
  const total = Math.round(taxable * (1 + GST_RATE));

  const onSave = async () => {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const saved = await saveCommunitySettings({
        enabled: draft.enabled !== false,
        title: draft.title,
        tagline: draft.tagline,
        priceInr: taxable,
        validityDays: Math.max(1, Number(draft.validityDays) || 365),
        benefits: String(benefitsText)
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setDraft({ ...saved });
      setMsg("Community access fee saved.");
    } catch (e) {
      setErr(toUserMessage(e, USER_MESSAGES.save));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card space-y-5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Community access fee</h2>
          <p className="mt-1 text-sm text-white/55">
            Customers can chat, attend free events, and see updates without buying a documentation plan.
            Set the annual fee here. ₹0 or disabled means every signed-in customer gets access.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Saving…" : "Save fee"}
        </button>
      </div>

      {msg ? <p className="text-xs text-emerald-300">{msg}</p> : null}
      {err ? <p className="text-xs text-rose-300">{err}</p> : null}

      <label className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={draft.enabled !== false}
          onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
        />
        Require this fee (uncheck to include access with every login)
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-white/45">
          Name
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={draft.title || ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="block text-xs text-white/45">
          List price (INR, before GST)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={draft.priceInr ?? 0}
            onChange={(e) => setDraft({ ...draft, priceInr: Number(e.target.value) })}
          />
        </label>
        <label className="block text-xs text-white/45">
          Validity (days)
          <input
            type="number"
            min={1}
            max={3650}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={draft.validityDays ?? 365}
            onChange={(e) => setDraft({ ...draft, validityDays: Number(e.target.value) })}
          />
        </label>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
          Customer pays{" "}
          <span className="font-medium text-white">{formatInr(total)}</span> incl. GST
          {taxable > 0 ? <span className="text-white/40"> · taxable {formatInr(taxable)}</span> : null}
        </div>
        <label className="block text-xs text-white/45 sm:col-span-2">
          Tagline
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={draft.tagline || ""}
            onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
          />
        </label>
        <label className="block text-xs text-white/45 sm:col-span-2">
          Benefits (one per line)
          <textarea
            rows={4}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={benefitsText}
            onChange={(e) =>
              setDraft({
                ...draft,
                benefits: e.target.value.split("\n"),
              })
            }
          />
        </label>
      </div>
    </div>
  );
}
