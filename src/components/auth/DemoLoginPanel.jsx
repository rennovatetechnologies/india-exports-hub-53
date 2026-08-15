import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import {
  allowAuthMock,
  clearSession,
  DEMO_USERS,
  getSession,
  loginAsDemoUser,
  ROLES,
  subscribeAuth,
} from "@/lib/authSession";
import { gatePathForCase, getCustomerCase, seedDemoCasesIfNeeded } from "@/lib/customerCase";

/**
 * One-click role switcher for offline UI demos.
 * Only renders when VITE_ALLOW_AUTH_MOCK=true.
 */
export default function DemoLoginPanel({ filter }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() =>
    typeof window !== "undefined" ? getSession() : null
  );

  useEffect(() => {
    setSession(getSession());
    return subscribeAuth((next) => setSession(next));
  }, []);

  if (!allowAuthMock()) return null;

  const users = typeof filter === "function" ? DEMO_USERS.filter(filter) : DEMO_USERS;

  const onPick = (id) => {
    // Replace any leftover persona so role switches always work.
    clearSession();
    const result = loginAsDemoUser(id);
    if (!result.ok) return;
    // Customers follow journey gate: plan → pay → KYC → workspace (not KYC-first).
    if (result.user?.role === ROLES.CUSTOMER) {
      seedDemoCasesIfNeeded();
      const c = getCustomerCase(result.user.email);
      navigate(gatePathForCase(c), { replace: true });
      return;
    }
    navigate(result.path, { replace: true });
  };

  return (
    <div className="mt-5 rounded-xl border border-dashed border-amber-300/35 bg-amber-300/[0.06] p-3.5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-amber-200/90">
        <FlaskConical size={13} />
        Demo mode
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-white/50">
        Jump straight into a role. Data falls back to local seed catalogs.
      </p>
      {session?.email && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-[11px] text-white/60">
          <span>
            Signed in as <span className="text-white/85">{session.email}</span>
            {session.role ? ` (${session.role})` : ""}
          </span>
          <button
            type="button"
            onClick={() => {
              clearSession();
              navigate(0);
            }}
            className="shrink-0 text-amber-200/90 hover:text-amber-100 underline-offset-2 hover:underline"
          >
            Sign out
          </button>
        </div>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onPick(u.id)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-amber-300/40 hover:bg-white/[0.06]"
          >
            <div className="text-xs font-medium text-white">{u.label}</div>
            <div className="mt-0.5 text-[10px] text-white/45">{u.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function staffDemoFilter(u) {
  return u.role === ROLES.OPERATIONS || u.role === ROLES.ADMIN;
}

export function customerDemoFilter(u) {
  return u.role === ROLES.CUSTOMER;
}
