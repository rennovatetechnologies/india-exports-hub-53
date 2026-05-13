import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Smartphone, Building2, Download, Sparkles, Save, Pencil, ArrowLeft } from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import { loadPlanCatalog, savePlanCatalog } from "@/lib/planCatalog";

const INVOICES = [
  { id: "INV-2041", date: "12 Apr 2026", plan: "Standard (one-time)", amount: 519188, status: "Paid" },
  { id: "INV-1987", date: "08 Jan 2026", plan: "Standard (one-time)", amount: 51919, status: "Paid" },
  { id: "INV-1902", date: "08 Dec 2025", plan: "Basic (one-time)", amount: 40119, status: "Paid" },
];

const PAYMENTS = [
  { id: "upi", label: "UPI", desc: "Pay with any UPI app via Razorpay", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, Rupay, Amex", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", desc: "All major Indian banks", icon: Building2 },
];

function singleFeatured(plans) {
  const idx = plans.findIndex((p) => p.featured);
  return plans.map((p, i) => ({ ...p, featured: idx !== -1 && i === idx }));
}

function AdminRevenueCatalog() {
  const [plans, setPlans] = useState(() => loadPlanCatalog());
  const [savedAt, setSavedAt] = useState(null);
  /** `null` = browse catalog; otherwise editing that plan id. */
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const h = () => setPlans(loadPlanCatalog());
    window.addEventListener("iehub-plans-updated", h);
    return () => window.removeEventListener("iehub-plans-updated", h);
  }, []);

  const openEdit = useCallback((id) => {
    const p = plans.find((x) => x.id === id);
    if (!p) return;
    setDraft({
      ...p,
      features: [...p.features],
    });
    setEditingId(id);
  }, [plans]);

  const leaveEdit = useCallback(() => {
    setEditingId(null);
    setDraft(null);
    setPlans(loadPlanCatalog());
  }, []);

  const updateDraft = useCallback((patch) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }, []);

  const saveDraft = () => {
    if (!draft || !editingId) return;
    const cleanedFeatures = [...(draft.features || [])].map((s) => String(s).trim()).filter(Boolean);
    const merged = plans.map((p) => {
      if (p.id === editingId) {
        return {
          ...draft,
          id: editingId,
          features: cleanedFeatures,
        };
      }
      return { ...p, features: [...p.features], featured: draft.featured ? false : p.featured };
    });
    const next = draft.featured ? merged.map((p) => ({ ...p, featured: p.id === editingId })) : singleFeatured(merged);
    savePlanCatalog(next);
    setPlans(next);
    setSavedAt(new Date());
    leaveEdit();
  };

  const editingPlan = editingId && draft;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue &amp; plan catalog</h1>
          <p className="mt-1 text-sm text-white/55">
            {editingPlan
              ? "Update this plan’s list price and copy. Save applies to customer billing after refresh."
              : "Review published plans. Choose Edit to change pricing or copy. Stored in the browser for this demo."}
          </p>
        </div>
        {editingPlan ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={leaveEdit} className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <ArrowLeft size={16} /> Back
            </button>
            <button type="button" onClick={saveDraft} className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <Save size={16} /> Save plan
            </button>
          </div>
        ) : null}
      </header>
      {savedAt && !editingPlan && (
        <p className="text-xs text-emerald-300/90">
          Saved {savedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Customers see these plans after refresh.
        </p>
      )}

      {editingPlan ? (
        <div className="glass-card p-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-3">
            <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/60">{draft.id}</span>
            <label className="inline-flex items-center gap-2 text-xs text-white/55">
              <input
                type="checkbox"
                checked={Boolean(draft.featured)}
                onChange={(e) => {
                  const on = e.target.checked;
                  setDraft((d) => (d ? { ...d, featured: on } : d));
                }}
                className="rounded border-white/20 bg-black/40"
              />
              Featured catalog plan
            </label>
          </div>
          <p className="mt-3 text-[11px] text-white/40">Only one plan should be featured. Saving with this checked clears Featured on other plans.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Display name
              <input
                value={draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Base price (₹, excl. GST)
              <input
                type="number"
                min={0}
                step={1}
                value={draft.price}
                onChange={(e) => updateDraft({ price: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
          </div>
          <label className="mt-4 block text-xs uppercase tracking-wider text-white/45">
            Tagline
            <input
              value={draft.tagline}
              onChange={(e) => updateDraft({ tagline: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
            />
          </label>
          <label className="mt-4 block text-xs uppercase tracking-wider text-white/45">
            Features (one per line)
            <textarea
              value={(draft.features || []).join("\n")}
              onChange={(e) =>
                updateDraft({
                  features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                })
              }
              rows={5}
              className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white outline-none focus:border-[var(--gold)]/40"
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((p) => {
            const base = p.price;
            const gst = base * 0.18;
            const total = base + gst;
            return (
              <div key={p.id} className="relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                {p.featured && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[10px] font-semibold text-black">
                    <Sparkles size={11} /> Featured
                  </span>
                )}
                <span className="font-mono text-[10px] text-white/40">{p.id}</span>
                <div className="mt-1 text-sm text-white/55">{p.tagline}</div>
                <div className="mt-0.5 text-lg font-semibold text-white">{p.name}</div>
                <div className="mt-3 text-2xl font-semibold">₹{Math.round(base).toLocaleString("en-IN")}</div>
                <div className="text-[11px] text-white/40">+ GST ₹{Math.round(gst).toLocaleString("en-IN")} · Total ₹{Math.round(total).toLocaleString("en-IN")}</div>
                <ul className="mt-4 flex-1 space-y-1.5 text-xs text-white/65">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check size={12} className="mt-0.5 shrink-0 text-emerald-300/90" /> {f}
                    </li>
                  ))}
                  {p.features.length > 4 && (
                    <li className="pl-5 text-white/40">+{p.features.length - 4} more</li>
                  )}
                </ul>
                <button
                  type="button"
                  onClick={() => openEdit(p.id)}
                  className="btn-ghost mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  <Pencil size={15} /> Edit plan
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!editingPlan && (
      <section className="glass-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Sample ledger (demo)</h3>
        <p className="mt-1 text-xs text-white/45">Invoice rows are static mock data; plan names above drive customer-facing pricing.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="text-white/75">
                  <td className="py-3 pr-4 font-medium text-white">{inv.id}</td>
                  <td className="py-3 pr-4">{inv.date}</td>
                  <td className="py-3 pr-4">{inv.plan}</td>
                  <td className="py-3 pr-4">₹{inv.amount.toLocaleString("en-IN")}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  );
}

function CustomerBilling() {
  const [plans, setPlans] = useState(() => loadPlanCatalog());
  const [selected, setSelected] = useState(() => {
    const list = loadPlanCatalog();
    const featured = list.find((p) => p.featured);
    return (featured || list[1] || list[0])?.id ?? "standard";
  });
  const [pay, setPay] = useState("upi");
  const [invoiceQuery, setInvoiceQuery] = useState("");

  useEffect(() => {
    const h = () => {
      const next = loadPlanCatalog();
      setPlans(next);
      setSelected((cur) => (next.some((p) => p.id === cur) ? cur : (next.find((p) => p.featured) || next[0])?.id));
    };
    window.addEventListener("iehub-plans-updated", h);
    return () => window.removeEventListener("iehub-plans-updated", h);
  }, []);

  const filteredInvoices = useMemo(() => {
    const q = invoiceQuery.trim().toLowerCase();
    if (!q) return INVOICES;
    return INVOICES.filter((inv) =>
      [inv.id, inv.date, inv.plan, inv.amount, inv.status].join(" ").toLowerCase().includes(q)
    );
  }, [invoiceQuery]);

  const current = plans.find((p) => p.id === selected) || plans[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plans &amp; billing</h1>
          <p className="mt-1 text-sm text-white/55">One-time fees per plan. Manage invoices and payment methods.</p>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const base = p.price;
          const gst = base * 0.18;
          const total = base + gst;
          const active = selected === p.id;
          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -3 }}
              className={`relative rounded-3xl border p-6 transition ${active ? "border-[var(--gold)]/60 bg-[var(--gold)]/5" : "border-white/10 bg-white/[0.02]"}`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[10px] font-semibold text-black">
                  <Sparkles size={11} /> Popular
                </span>
              )}
              <div className="text-sm text-white/55">{p.tagline}</div>
              <div className="mt-1 text-lg font-semibold">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">₹{Math.round(base).toLocaleString("en-IN")}</span>
                <span className="text-xs text-white/45">one-time</span>
              </div>
              <div className="mt-1 text-[11px] text-white/40">+ ₹{Math.round(gst).toLocaleString("en-IN")} GST · Total ₹{Math.round(total).toLocaleString("en-IN")}</div>
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={15} className="mt-0.5 text-emerald-300" /> {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setSelected(p.id)}
                className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${active ? "btn-gold" : "btn-ghost"}`}
              >
                {active ? "Selected" : "Choose plan"}
              </button>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Payment method</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PAYMENTS.map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPay(id)}
                className={`rounded-2xl border p-4 text-left transition ${pay === id ? "border-[var(--gold)]/60 bg-[var(--gold)]/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}
              >
                <Icon size={18} className="text-[var(--gold)]" />
                <div className="mt-2 text-sm font-medium">{label}</div>
                <div className="text-[11px] text-white/45">{desc}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-gold mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold sm:w-auto"
          >
            Pay securely with Razorpay
          </button>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Current plan</h3>
          <div className="mt-3 text-lg font-semibold">
            {current?.name ?? "—"} · One-time
          </div>
          <div className="text-xs text-white/50">Paid in full · 12 Apr 2026</div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
            Used: 3 of 5 product categories · 2 active shipments
          </div>
          <button type="button" className="btn-ghost mt-4 w-full rounded-xl px-4 py-2 text-xs">
            Invoice &amp; receipts
          </button>
        </div>
      </section>

      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/55">Invoices</h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              placeholder="Filter invoices…"
              className="min-w-[140px] rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[var(--gold)]/40"
            />
            <button type="button" className="btn-ghost inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs">
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="text-white/75">
                  <td className="py-3 pr-4 font-medium text-white">{inv.id}</td>
                  <td className="py-3 pr-4">{inv.date}</td>
                  <td className="py-3 pr-4">{inv.plan}</td>
                  <td className="py-3 pr-4">₹{inv.amount.toLocaleString("en-IN")}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">{inv.status}</span>
                  </td>
                  <td className="py-3">
                    <button type="button" className="text-xs text-[var(--gold)] hover:underline">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && (
          <p className="mt-4 text-center text-xs text-white/45">No invoices match your filter.</p>
        )}
      </section>
    </div>
  );
}

export default function BillingPage() {
  const session = getSession();
  const isAdmin = session?.role === ROLES.ADMIN;
  if (isAdmin) return <AdminRevenueCatalog />;
  return <CustomerBilling />;
}
