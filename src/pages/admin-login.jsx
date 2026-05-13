import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Workflow } from "lucide-react";
import AdminAuthShell from "@/components/auth/AdminAuthShell";
import { setSession, ROLES, ADMIN_STATUS, workspaceFor } from "@/lib/authSession";

const STAGES = [
  { label: "Verifying access", icon: ShieldCheck },
  { label: "Fetching workspace", icon: Workflow },
  { label: "Redirecting to dashboard", icon: ArrowRight },
];

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState("");

  const detectRole = (mail) => {
    const m = mail.toLowerCase();
    if (m.startsWith("super") || m.includes("super.admin")) return ROLES.SUPER;
    return ROLES.OPERATIONS;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setStage(0);
    setTimeout(() => setStage(1), 650);
    setTimeout(() => setStage(2), 1250);
    setTimeout(() => {
      const role = detectRole(email);
      setSession({ email, name: "", phone: "", role, status: ADMIN_STATUS.ACTIVE });
      navigate(workspaceFor(role));
    }, 1900);
  };

  return (
    <AdminAuthShell
      title="Sign in to operations"
      subtitle="Use your VISTARA work credentials"
      footer={
        <>
          New team member?{" "}
          <Link to="/admin/register" className="text-emerald-300 hover:underline">Request access</Link>
        </>
      }
    >
      {stage >= 0 ? (
        <div className="space-y-3">
          {STAGES.map(({ label, icon: Icon }, i) => {
            const active = i === stage;
            const done = i < stage;
            return (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  done
                    ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"
                    : active
                    ? "border-cyan-300/30 bg-cyan-300/5 text-white"
                    : "border-white/10 bg-white/[0.02] text-white/40"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.04]">
                  {active ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                </span>
                {label}
              </div>
            );
          })}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field icon={Mail} label="Official email" type="email" placeholder="you@vistara.in" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field icon={Lock} label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-black hover:opacity-90">
            Continue <ArrowRight size={15} />
          </button>
          <p className="text-center text-[11px] text-white/40">
            Tip: emails starting with <span className="text-white/70">super.</span> route to the Super Admin workspace.
          </p>
        </form>
      )}
    </AdminAuthShell>
  );
}

function Field({ icon: Icon, label, ...rest }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-white/55">{label}</span>
      <div className="mt-1.5 relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-emerald-300/40 transition">
        <Icon size={15} className="absolute left-3 text-white/45" />
        <input {...rest} required className="w-full bg-transparent pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/30 outline-none" />
      </div>
    </label>
  );
}