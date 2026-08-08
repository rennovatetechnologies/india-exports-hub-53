import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getSession,
  initSessionExpiryWatch,
  isStaffSession,
  subscribeAuth,
  ROLES,
  workspaceFor,
} from "@/lib/authSession";

/**
 * Protects workspaces.
 * - area="customer": any signed-in user (customers + staff using shared tools)
 * - area="staff": operations / admin only
 * Guests are sent to the correct login with a safe `next` return path.
 * After JWT TTL (2h), session is cleared and this redirects to login.
 */
export default function AuthGuard({ children, area = "customer" }) {
  const location = useLocation();
  const [session, setSessionState] = useState(() =>
    typeof window !== "undefined" ? getSession() : null
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initSessionExpiryWatch();
    setSessionState(getSession());
    setReady(true);
    return subscribeAuth((next) => setSessionState(next));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-white/70">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
      </div>
    );
  }

  const next = `${location.pathname}${location.search}${location.hash}`;

  if (!session) {
    const loginPath =
      area === "staff"
        ? `/admin/login?next=${encodeURIComponent(next)}`
        : `/login?next=${encodeURIComponent(next)}`;
    return <Navigate to={loginPath} replace />;
  }

  if (area === "staff" && !isStaffSession(session)) {
    return <Navigate to={workspaceFor(session.role || ROLES.CUSTOMER)} replace />;
  }

  return children;
}
