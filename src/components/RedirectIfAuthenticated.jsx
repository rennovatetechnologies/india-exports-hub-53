import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSession, subscribeAuth } from "@/lib/authSession";
import { dashboardPathForPublicUrl } from "@/lib/siteNav";

/**
 * Keeps signed-in users inside the workspace chrome.
 * Public marketing routes remap to /dashboard/* (or staff workspace).
 * Auth pages (login/signup/…) are left alone — they handle their own redirects.
 */
export default function RedirectIfAuthenticated({ children }) {
  const location = useLocation();
  const [session, setSession] = useState(() =>
    typeof window !== "undefined" ? getSession() : null
  );

  useEffect(() => subscribeAuth(setSession), []);

  const dest = dashboardPathForPublicUrl(
    `${location.pathname}${location.search}${location.hash}`,
    session
  );
  if (dest) return <Navigate to={dest} replace />;

  return children;
}
