import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, User, Building2, IdCard, ArrowRight, CheckCircle2 } from "lucide-react";
import AdminAuthShell from "@/components/auth/AdminAuthShell";
import { addAdminRequest, ROLES } from "@/lib/authSession";

const ROLE_OPTIONS = [
  { value: ROLES.OPERATIONS, label: "Operations Admin", desc: "Run customer cases, KYC and workflow ops." },
  { value: ROLES.SUPER, label: "Super Admin", desc: "Restricted — pricing, RBAC and revenue controls.", restricted: true },
];

export default function AdminRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: ROLES.OPERATIONS,
    department: "",
    employeeId: "",
    reason: "",
  });
  const [submitted, setSubmitted] = useState(null);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    const created = addAdminRequest(form);
    setSubmitted(created);
  };

  if (submitted) {
    return (
      <AdminAuthShell title="Request submitted" subtitle="Your access is awaiting Super Admin review">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto text-emerald-300" size={36} />
          <p className="text-sm text-white/65">
            We&apos;ve queued <span className="text-white">{submitted.name}</span> for approval.
            You&apos;ll receive an email at <span className="text-white">{submitted.email}</span> once activated.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs text-white/55">
            <div className="flex justify-between"><span>Request ID</span><span className="text-white">{submitted.id}</span></div>
            <div className="mt-1.5 flex justify-between"><span>Requested role</span><span className="text-white capitalize">{submitted.role}</span></div>
            <div className="mt-1.5 flex justify-between"><span>Status</span><span className="text-amber-300">Pending Approval</span></div>
          </div>
          <Link to="/admin/login" className="inline-flex items-center gap-2 text-emerald-300 hover:underline text-sm">
            Back to sign in <ArrowRight size={14} />
          </Link>
        </div>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      title="Request internal access"
      subtitle="Operations &amp; leadership accounts require approval"
      footer={
        <>
          Already have access?{" "}
          <Link to="/admin/login" className="text-emerald-300 hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field icon={User} label="Full name" placeholder="Riya Mehta" value={form.name} onChange={update("name")} />
          <Field icon={IdCard} label="Employee ID" placeholder="VST-220" value={form.employeeId} onChange={update("employeeId")} required={false} />
        </div>
        <Field icon={Mail} label="Official email" type="email" placeholder="you@vistara.in" value={form.email} onChange={update("email")} />
        <div className="grid grid-cols-2 gap-3">
          <Field icon={Phone} label="Mobile" placeholder="+91 9XXXX XXXXX" value={form.phone} onChange={update("phone")} />
          <Field icon={Building2} label="Department" placeholder="Compliance ops" value={form.department} onChange={update("department")} />
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-white/55">Requested role</span>
          <div className="mt-2 grid gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const active = form.role === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`text-left rounded-xl border px-4 py-3 transition ${
                    active ? "border-emerald-300/40 bg-emerald-300/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{opt.label}</span>
                    {opt.restricted && (
                      <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">Restricted</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-white/50">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-white/55">Reason for access</span>
          <textarea
            value={form.reason}
            onChange={update("reason")}
            required
            rows={3}
            placeholder="Why do you need this workspace?"
            className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-300/40"
          />
        </label>

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-black hover:opacity-90">
          Submit for approval <ArrowRight size={15} />
        </button>
        <p className="text-center text-[11px] text-white/40">
          Account stays in <span className="text-amber-300">Pending Approval</span> until a Super Admin reviews it.
        </p>
      </form>
    </AdminAuthShell>
  );
}

function Field({ icon: Icon, label, required = true, ...rest }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-white/55">{label}</span>
      <div className="mt-1.5 relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-emerald-300/40 transition">
        <Icon size={15} className="absolute left-3 text-white/45" />
        <input {...rest} required={required} className="w-full bg-transparent pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
      </div>
    </label>
  );
}