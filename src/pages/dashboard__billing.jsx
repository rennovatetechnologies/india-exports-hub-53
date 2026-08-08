import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, CreditCard, Save, Pencil, ArrowLeft, Sparkles, FileText, Download } from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  loadPlanCatalog,
  savePlanCatalog,
  fetchPlanCatalog,
  formatInr,
  planEffectivePrice,
  planHasDiscount,
  planPriceWithGst,
  upgradeDelta,
  GST_RATE,
} from "@/lib/planCatalog";
import {
  selectPlan,
  markPlanPaid,
  journeyStatus,
  CASE_STATUS,
  getCustomerCase,
  refreshCaseAfterPayment,
  isPlanEntitlementActive,
  formatPlanExpiry,
} from "@/lib/customerCase";
import { issueInvoiceForPayment, listInvoicesForEmail, fetchInvoicesForEmail } from "@/lib/invoice";
import { downloadInvoicePdf } from "@/lib/downloadInvoicePdf";
import { startRazorpayCheckout } from "@/components/PayButton";
import InvoiceModal from "@/components/InvoiceModal";

function singleFeatured(plans) {
  const idx = plans.findIndex((p) => p.featured);
  return plans.map((p, i) => ({ ...p, featured: idx !== -1 && i === idx }));
}

function AdminPlanEditor() {
  const [plans, setPlans] = useState(() => loadPlanCatalog());
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    fetchPlanCatalog().then(setPlans).catch(() => {});
    const h = () => setPlans(loadPlanCatalog());
    window.addEventListener("iehub-plans-updated", h);
    return () => window.removeEventListener("iehub-plans-updated", h);
  }, []);

  const openEdit = (id) => {
    const p = plans.find((x) => x.id === id);
    if (!p) return;
    setDraft({
      ...p,
      features: [...p.features],
      kycDocs: p.kycDocs.map((d) => ({ ...d })),
      workflowStages: p.workflowStages.map((s) => ({ ...s })),
    });
    setEditingId(id);
  };

  const leaveEdit = () => {
    setEditingId(null);
    setDraft(null);
    setPlans(loadPlanCatalog());
  };

  const saveDraft = async () => {
    if (!draft || !editingId) return;
    const merged = plans.map((p) => {
      if (p.id !== editingId) return { ...p, featured: draft.featured ? false : p.featured };
      return {
        ...draft,
        id: editingId,
        features: (draft.features || []).map((s) => String(s).trim()).filter(Boolean),
        kycDocs: (draft.kycDocs || []).filter((d) => d.id && d.label),
        workflowStages: (draft.workflowStages || []).filter((s) => s.id && s.label),
      };
    });
    const next = draft.featured ? merged.map((p) => ({ ...p, featured: p.id === editingId })) : singleFeatured(merged);
    await savePlanCatalog(next);
    setPlans(next);
    setSavedAt(new Date());
    leaveEdit();
  };

  if (editingId && draft) {
    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Edit plan · {draft.name}</h1>
            <p className="mt-1 text-sm text-white/55">List price, discount %, KYC pack, and workflow stages.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={leaveEdit} className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
              <ArrowLeft size={16} /> Back
            </button>
            <button type="button" onClick={saveDraft} className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <Save size={16} /> Save plan
            </button>
          </div>
        </header>

        <div className="glass-card space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs text-white/45">
              Name
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45">
              List price (INR, before GST)
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              />
            </label>
            <label className="block text-xs text-white/45">
              Discount %
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                value={draft.discountPercent ?? 0}
                onChange={(e) => setDraft({ ...draft, discountPercent: Number(e.target.value) })}
              />
            </label>
            <label className="block text-xs text-white/45 sm:col-span-2">
              Tagline
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
              />
            </label>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
            Effective before GST:{" "}
            <span className="font-medium text-white">{formatInr(planEffectivePrice(draft))}</span>
            {planHasDiscount(draft) ? (
              <span className="text-white/40">
                {" "}
                (was {formatInr(draft.price)} · {draft.discountPercent}% off)
              </span>
            ) : null}
            <span className="mt-1 block text-white/40">Events are always paid separately — not included in plans.</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={Boolean(draft.featured)} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} />
            Featured plan
          </label>

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/45">KYC documents</div>
            <div className="space-y-2">
              {draft.kycDocs.map((d, i) => (
                <div key={d.id + i} className="flex flex-wrap gap-2">
                  <input
                    className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
                    value={d.id}
                    onChange={(e) => {
                      const kycDocs = [...draft.kycDocs];
                      kycDocs[i] = { ...d, id: e.target.value };
                      setDraft({ ...draft, kycDocs });
                    }}
                    placeholder="id"
                  />
                  <input
                    className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
                    value={d.label}
                    onChange={(e) => {
                      const kycDocs = [...draft.kycDocs];
                      kycDocs[i] = { ...d, label: e.target.value };
                      setDraft({ ...draft, kycDocs });
                    }}
                    placeholder="Label"
                  />
                  <label className="flex items-center gap-1 text-xs text-white/50">
                    <input
                      type="checkbox"
                      checked={d.required !== false}
                      onChange={(e) => {
                        const kycDocs = [...draft.kycDocs];
                        kycDocs[i] = { ...d, required: e.target.checked };
                        setDraft({ ...draft, kycDocs });
                      }}
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    className="text-xs text-red-300/80"
                    onClick={() => setDraft({ ...draft, kycDocs: draft.kycDocs.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-[var(--gold)]"
                onClick={() =>
                  setDraft({
                    ...draft,
                    kycDocs: [...draft.kycDocs, { id: `doc${draft.kycDocs.length + 1}`, label: "New document", required: true }],
                  })
                }
              >
                + Add KYC document
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/45">Workflow stages</div>
            <div className="space-y-2">
              {draft.workflowStages.map((s, i) => (
                <div key={s.id + i} className="flex flex-wrap gap-2">
                  <input
                    className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
                    value={s.id}
                    onChange={(e) => {
                      const workflowStages = [...draft.workflowStages];
                      workflowStages[i] = { ...s, id: e.target.value };
                      setDraft({ ...draft, workflowStages });
                    }}
                  />
                  <input
                    className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
                    value={s.label}
                    onChange={(e) => {
                      const workflowStages = [...draft.workflowStages];
                      workflowStages[i] = { ...s, label: e.target.value };
                      setDraft({ ...draft, workflowStages });
                    }}
                  />
                  <input
                    className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
                    value={s.description || ""}
                    onChange={(e) => {
                      const workflowStages = [...draft.workflowStages];
                      workflowStages[i] = { ...s, description: e.target.value };
                      setDraft({ ...draft, workflowStages });
                    }}
                    placeholder="Description"
                  />
                  <button
                    type="button"
                    className="text-xs text-red-300/80"
                    onClick={() =>
                      setDraft({ ...draft, workflowStages: draft.workflowStages.filter((_, j) => j !== i) })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-[var(--gold)]"
                onClick={() =>
                  setDraft({
                    ...draft,
                    workflowStages: [
                      ...draft.workflowStages,
                      { id: `stage${draft.workflowStages.length + 1}`, label: "New stage", description: "" },
                    ],
                  })
                }
              >
                + Add stage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Plan catalog</h1>
        <p className="mt-1 text-sm text-white/55">
          Define list price, discount %, KYC documents, and workflow stages. Events are always charged separately.
        </p>
        {savedAt && (
          <p className="mt-2 text-xs text-emerald-300/90">Saved {savedAt.toLocaleTimeString("en-IN")}</p>
        )}
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={`glass-card relative p-5 ${p.featured ? "ring-1 ring-[var(--gold)]/40" : ""}`}>
            {p.featured && (
              <span className="absolute right-3 top-3 rounded-md bg-[var(--gold)]/20 px-2 py-0.5 text-[10px] text-[var(--gold)]">
                Featured
              </span>
            )}
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <p className="text-2xl font-semibold text-[var(--gold)]">{formatInr(planEffectivePrice(p))}</p>
              {planHasDiscount(p) && (
                <>
                  <p className="text-sm text-white/40 line-through">{formatInr(p.price)}</p>
                  <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                    {p.discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-white/45">+ {Math.round(GST_RATE * 100)}% GST</p>
            <p className="mt-2 text-sm text-white/55">{p.tagline}</p>
            <ul className="mt-3 space-y-1 text-xs text-white/50">
              <li>{p.kycDocs?.length || 0} KYC docs</li>
              <li>{p.workflowStages?.length || 0} workflow stages</li>
              <li>Events billed separately</li>
            </ul>
            <button
              type="button"
              onClick={() => openEdit(p.id)}
              className="btn-ghost mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
            >
              <Pencil size={14} /> Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerBilling() {
  const navigate = useNavigate();
  const session = getSession();
  const [plans, setPlans] = useState(() => loadPlanCatalog());
  const [tick, setTick] = useState(0);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoiceEmailNotice, setInvoiceEmailNotice] = useState(false);
  const [continueToKycAfterInvoice, setContinueToKycAfterInvoice] = useState(false);
  const [invoices, setInvoices] = useState(() =>
    session?.email ? listInvoicesForEmail(session.email) : [],
  );

  useEffect(() => {
    fetchPlanCatalog().then(setPlans).catch(() => {});
    if (session?.email) {
      fetchInvoicesForEmail(session.email).then(setInvoices).catch(() => {});
    }
    const h = () => {
      setPlans(loadPlanCatalog());
      setTick((t) => t + 1);
      if (session?.email) setInvoices(listInvoicesForEmail(session.email));
    };
    window.addEventListener("iehub-plans-updated", h);
    window.addEventListener("iehub-case-updated", h);
    window.addEventListener("iehub-invoices-updated", h);
    return () => {
      window.removeEventListener("iehub-plans-updated", h);
      window.removeEventListener("iehub-case-updated", h);
      window.removeEventListener("iehub-invoices-updated", h);
    };
  }, [session?.email]);

  const c = session?.email ? getCustomerCase(session.email) : null;
  const status = c ? journeyStatus(c) : CASE_STATUS.NO_PLAN;
  const hasPaidPlan = c?.paymentStatus === "paid" && Boolean(c?.paidPlanId);
  const paidPlan = plans.find((p) => p.id === c?.paidPlanId);
  const selected =
    plans.find((p) => p.id === (selectedId || c?.paidPlanId || c?.planId)) ||
    plans.find((p) => p.featured) ||
    plans[0];
  const entitlementActive = isPlanEntitlementActive(c);
  const expiryLabel = formatPlanExpiry(c);
  const needsRepurchase =
    status === CASE_STATUS.EXPIRED || status === CASE_STATUS.NO_PLAN || status === CASE_STATUS.UNPAID;

  const selectedIsHigher =
    Boolean(paidPlan && selected) &&
    selected.id !== paidPlan.id &&
    planEffectivePrice(selected) > planEffectivePrice(paidPlan);

  const selectedIsLowerOrSame =
    Boolean(paidPlan && selected) &&
    (selected.id === paidPlan.id || planEffectivePrice(selected) <= planEffectivePrice(paidPlan));

  // Upgrade while paid entitlement is active (including during KYC) — not only ACTIVE.
  const isUpgrade = entitlementActive && hasPaidPlan && selectedIsHigher;

  const isRenewal =
    status === CASE_STATUS.EXPIRED &&
    paidPlan &&
    selected &&
    selected.id === paidPlan.id;

  const pricing = useMemo(() => {
    if (!selected) return null;
    if (isUpgrade) return upgradeDelta(paidPlan, selected);
    if (needsRepurchase || isRenewal) return planPriceWithGst(selected);
    return null; // already paid current/lower — no checkout
  }, [selected, isUpgrade, paidPlan, needsRepurchase, isRenewal]);

  const showCheckout = Boolean(selected && pricing && (needsRepurchase || isRenewal || isUpgrade));

  useEffect(() => {
    // Default to purchased plan once; don't reset while browsing upgrades.
    if (hasPaidPlan && c?.paidPlanId) {
      setSelectedId((prev) => prev || c.paidPlanId);
      return;
    }
    if (!selectedId) {
      if (c?.planId) setSelectedId(c.planId);
      else if (plans[0]) setSelectedId(plans.find((p) => p.featured)?.id || plans[0].id);
    }
  }, [hasPaidPlan, c?.paidPlanId, c?.planId, plans, selectedId]);

  const onSelect = async (id) => {
    setSelectedId(id);
    setError("");
    // Persist plan choice before payment or when renewing after expiry.
    if (
      session?.email &&
      (status === CASE_STATUS.NO_PLAN || status === CASE_STATUS.UNPAID || status === CASE_STATUS.EXPIRED)
    ) {
      try {
        await selectPlan(session.email, id);
      } catch (e) {
        setError(e.message || "Could not save plan selection");
      }
    }
  };

  const finalizePlanPayment = async ({ paymentId, orderId } = {}) => {
    if (!session?.email || !selected || !pricing) return;
    const upgrading = Boolean(isUpgrade);
    const renewing = Boolean(isRenewal) || status === CASE_STATUS.EXPIRED;
    markPlanPaid(session.email).catch(() => {});
    await refreshCaseAfterPayment(session.email);
    await fetchInvoicesForEmail(session.email).then(setInvoices).catch(() => {});
    // Local invoice only if API has not issued one yet (e.g. Razorpay not configured).
    const existing = listInvoicesForEmail(session.email);
    let invoice = existing[0] || null;
    if (!invoice) {
      invoice = issueInvoiceForPayment({
        paymentId,
        orderId,
        sku: upgrading ? "plan_upgrade" : "plan",
        description: upgrading
          ? `Plan upgrade to ${selected.name}`
          : renewing
            ? `${selected.name} plan renewal (1 year)`
            : `${selected.name} plan subscription (1 year)`,
        customer: {
          name: session.name,
          email: session.email,
          phone: session.phone,
          company: session.company,
        },
        taxableAmount: pricing.base,
        lineItems: [
          {
            description: upgrading
              ? `Upgrade to ${selected.name} (price difference)`
              : renewing
                ? `${selected.name} plan renewal`
                : `${selected.name} plan (valid 1 year)`,
            quantity: 1,
            unitAmount: pricing.base,
          },
        ],
      });
      setInvoices(listInvoicesForEmail(session.email));
    }
    setContinueToKycAfterInvoice(!upgrading && !renewing);
    setInvoiceEmailNotice(true);
    setActiveInvoice(invoice);
  };

  const onPay = async () => {
    if (!session?.email || !selected || !pricing) return;
    if (entitlementActive && !isUpgrade) {
      setError("Select a higher plan to upgrade — you only pay the difference + GST.");
      return;
    }
    setError("");
    setPaying(true);
    try {
      if (!entitlementActive) await selectPlan(session.email, selected.id);
      await startRazorpayCheckout({
        amountInr: pricing.total,
        planId: selected.id,
        purpose: isUpgrade ? "plan_upgrade" : "plan",
        description: isUpgrade
          ? `Upgrade to ${selected.name} (difference + GST)`
          : isRenewal
            ? `Renew ${selected.name} plan · 1 year (incl. GST)`
            : `${selected.name} plan · 1 year (incl. GST)`,
        customer: { name: session.name, email: session.email, phone: session.phone },
        onSuccess: (result) => {
          finalizePlanPayment({
            paymentId: result.razorpay_payment_id || result.paymentId,
            orderId: result.razorpay_order_id || result.orderId,
          });
        },
        onFailure: (err) => setError(err?.message || "Payment failed"),
      });
    } catch (err) {
      // Allow local demo when backend/Razorpay unavailable
      const allowMock = String(import.meta.env?.VITE_ALLOW_AUTH_MOCK || "").toLowerCase() === "true";
      if (allowMock) {
        finalizePlanPayment({ paymentId: `mock_${Date.now()}`, orderId: `mock_order_${Date.now()}` });
      } else {
        setError(err?.message || "Payment failed. Is the backend running?");
      }
    } finally {
      setPaying(false);
    }
  };

  const closeInvoiceModal = () => {
    const goKyc = continueToKycAfterInvoice;
    setActiveInvoice(null);
    setInvoiceEmailNotice(false);
    setContinueToKycAfterInvoice(false);
    if (goKyc) navigate("/dashboard/kyc", { replace: true });
  };

  return (
    <div className="space-y-8">
      <InvoiceModal
        open={Boolean(activeInvoice)}
        invoice={activeInvoice}
        emailNotice={invoiceEmailNotice}
        onClose={closeInvoiceModal}
      />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {status === CASE_STATUS.EXPIRED
            ? "Renew your plan"
            : entitlementActive
              ? "Billing & upgrades"
              : "Choose your plan"}
        </h1>
        <p className="mt-1 text-sm text-white/55">
          {status === CASE_STATUS.EXPIRED
            ? "Your plan validity ended. Purchase again for another year to restore dashboard access."
            : entitlementActive
              ? status === CASE_STATUS.ACTIVE
                ? "Your purchased plan is marked below (valid 1 year). Upgrade anytime by selecting a higher plan."
                : "Your purchased plan is marked below (valid 1 year). Complete KYC to unlock workflow."
              : "Plans are valid for one year. Pay once, then complete KYC. Workflow unlocks after approval."}
        </p>
      </header>

      {status === CASE_STATUS.EXPIRED && paidPlan && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
          <span className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80">Plan expired</span>
          <p className="mt-1">
            <strong>{paidPlan.name}</strong>
            {expiryLabel ? <> expired on {expiryLabel}</> : null}. Purchase again to continue.
          </p>
        </div>
      )}

      {paidPlan && entitlementActive && (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Your purchased plan</span>
          <p className="mt-1">
            <strong>{paidPlan.name}</strong> · {formatInr(planEffectivePrice(paidPlan))} + GST
            <span className="text-emerald-100/70">
              {" "}
              · Valid 1 year
              {expiryLabel ? ` · until ${expiryLabel}` : ""}
              {" "}
              · Events charged separately
            </span>
          </p>
          {(status === CASE_STATUS.KYC_INCOMPLETE || status === CASE_STATUS.KYC_PENDING) && (
            <p className="mt-2 text-xs text-emerald-100/80">
              Next step: finish KYC — open the <strong>KYC</strong> item in the sidebar.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const active = selected?.id === p.id;
          const current = entitlementActive && paidPlan?.id === p.id;
          const wasPrevious = status === CASE_STATUS.EXPIRED && paidPlan?.id === p.id;
          const effective = planEffectivePrice(p);
          const discounted = planHasDiscount(p);
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card relative p-5 text-left transition ${
                current
                  ? "ring-2 ring-emerald-400/45 bg-emerald-400/[0.06]"
                  : wasPrevious
                    ? "ring-2 ring-amber-400/35 bg-amber-400/[0.05]"
                  : active
                    ? "ring-2 ring-[var(--gold)]/50"
                    : "hover:bg-white/[0.04]"
              }`}
            >
              <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
                {current && (
                  <span className="rounded-md bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                    Your plan
                  </span>
                )}
                {wasPrevious && (
                  <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                    Expired
                  </span>
                )}
                {p.featured && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--gold)]/15 px-2 py-0.5 text-[10px] text-[var(--gold)]">
                    <Sparkles size={10} /> Popular
                  </span>
                )}
                {discounted && (
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
                    {p.discountPercent}% off
                  </span>
                )}
              </div>
              <h3 className="pr-24 text-lg font-semibold">{p.name}</h3>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <p className="text-2xl font-semibold">{formatInr(effective)}</p>
                {discounted && <p className="text-sm text-white/40 line-through">{formatInr(p.price)}</p>}
              </div>
              <p className="text-xs text-white/40">+ GST · valid 1 year</p>
              <p className="mt-2 text-sm text-white/55">{p.tagline}</p>
              <ul className="mt-4 space-y-2">
                {(p.features || []).map((f) => (
                  <li key={f} className="flex gap-2 text-xs text-white/60">
                    <Check size={14} className="shrink-0 text-[var(--gold)]" /> {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-white/40">
                {p.kycDocs?.length || 0} KYC docs · {p.workflowStages?.length || 0} stages · Events paid separately
              </p>
              {current && (
                <p className="mt-3 text-xs font-medium text-emerald-300">
                  This is the plan you purchased{expiryLabel ? ` · until ${expiryLabel}` : ""}
                </p>
              )}
              {wasPrevious && (
                <p className="mt-3 text-xs font-medium text-amber-200">
                  Select and pay to renew for another year
                </p>
              )}
              {!current && !wasPrevious && p.featured && (
                <p className="mt-3 text-xs text-[var(--gold)]/90">Most popular choice</p>
              )}
            </motion.button>
          );
        })}
      </div>

      {showCheckout && (
        <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium">
              {isUpgrade
                ? `Upgrade to ${selected.name}`
                : isRenewal || status === CASE_STATUS.EXPIRED
                  ? `Renew ${selected.name} for 1 year`
                  : `Pay for ${selected.name} (1 year)`}
            </p>
            <p className="mt-1 text-xs text-white/45">
              {isUpgrade ? (
                <>
                  Difference {formatInr(pricing.base)} + GST {formatInr(pricing.gst)} ={" "}
                  <span className="text-white">{formatInr(pricing.total)}</span>
                  <span className="mt-1 block text-white/35">
                    ({paidPlan.name} {formatInr(planEffectivePrice(paidPlan))} → {selected.name}{" "}
                    {formatInr(planEffectivePrice(selected))})
                  </span>
                </>
              ) : planHasDiscount(selected) ? (
                <>
                  List {formatInr(selected.price)} − {selected.discountPercent}% = {formatInr(pricing.base)} + GST{" "}
                  {formatInr(pricing.gst)} = <span className="text-white">{formatInr(pricing.total)}</span>
                </>
              ) : (
                <>
                  Base {formatInr(pricing.base)} + GST {formatInr(pricing.gst)} ={" "}
                  <span className="text-white">{formatInr(pricing.total)}</span>
                </>
              )}
            </p>
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
          </div>
          <button
            type="button"
            disabled={paying}
            onClick={onPay}
            className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            <CreditCard size={16} />
            {paying
              ? "Opening Razorpay…"
              : isUpgrade
                ? `Pay difference ${formatInr(pricing.total)}`
                : `Pay ${formatInr(pricing.total)}`}
          </button>
        </div>
      )}

      {entitlementActive && hasPaidPlan && selectedIsLowerOrSame && selected?.id === paidPlan?.id && (
        <p className="text-sm text-white/45">
          Select a higher plan to upgrade — you only pay the difference + GST. Current plan stays valid
          {expiryLabel ? ` until ${expiryLabel}` : " for 1 year"}.
        </p>
      )}

      {entitlementActive && hasPaidPlan && selectedIsLowerOrSame && selected?.id !== paidPlan?.id && (
        <p className="text-sm text-white/45">
          Downgrades are not available. Choose a plan priced above {paidPlan.name} to pay only the difference + GST.
        </p>
      )}

      {invoices.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[var(--gold)]" />
            <h2 className="text-lg font-semibold">Invoices</h2>
          </div>
          <p className="text-xs text-white/45">
            GST tax invoices from New India Export (GSTIN 27AXGPY3435Q1ZK). Download PDF anytime — nothing is stored on Drive.
          </p>
          <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {new Date(inv.issuedAt).toLocaleDateString("en-IN")} · Taxable {formatInr(inv.amounts?.taxable)}{" "}
                    + GST {formatInr(inv.amounts?.gst)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">{formatInr(inv.amounts?.total)}</span>
                  <button
                    type="button"
                    onClick={() => downloadInvoicePdf(inv)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1.5 text-xs text-[var(--gold)] hover:bg-[var(--gold)]/20"
                  >
                    <Download size={12} /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContinueToKycAfterInvoice(false);
                      setInvoiceEmailNotice(false);
                      setActiveInvoice(inv);
                    }}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function BillingPage() {
  const session = getSession();
  if (session?.role === ROLES.ADMIN) return <AdminPlanEditor />;
  return <CustomerBilling />;
}
