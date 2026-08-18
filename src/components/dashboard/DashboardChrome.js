import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ensureCaseForSession,
  gatePathForCase,
  getCaseWorkflowStages,
  isPathAllowedDuringGate,
  isWorkspaceUnlocked,
  journeyStatus,
  CASE_STATUS,
  fetchMyCase,
  fetchCasesQueue,
} from "@/lib/customerCase";
import { getPlanById, fetchPlanCatalog } from "@/lib/planCatalog";
import { getSession, ROLES, subscribeAuth, clearSession, workspaceFor } from "@/lib/authSession";
import { DASHBOARD_EXPLORE_LINKS } from "@/lib/siteNav";
import { PATHS } from "@/lib/routes";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileCheck2,
  Folder,
  Workflow,
  CalendarDays,
  CreditCard,
  LifeBuoy,
  Settings2,
  Bell,
  Menu,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Crown,
  Briefcase,
  MessageSquare,
  Users,
  Compass,
  BookOpen,
  RefreshCw,
} from "lucide-react";

const CUSTOMER_NAV_FULL = [
  { href: PATHS.dashboard, label: "Home", icon: LayoutDashboard },
  { href: PATHS.dashboardWorkflow, label: "Workflow", icon: Workflow },
  { href: PATHS.dashboardDocuments, label: "Documents", icon: Folder, matchPrefix: true },
  { href: PATHS.dashboardMessages, label: "Messages", icon: MessageSquare },
  { href: PATHS.dashboardEvents, label: "Events", icon: CalendarDays },
  { href: PATHS.dashboardBilling, label: "Billing", icon: CreditCard },
];

const CUSTOMER_NAV_GATED = [
  { href: PATHS.dashboardBilling, label: "Plan & pay", icon: CreditCard, when: [CASE_STATUS.NO_PLAN, CASE_STATUS.UNPAID, CASE_STATUS.EXPIRED] },
  { href: PATHS.dashboardBilling, label: "Billing", icon: CreditCard, when: [CASE_STATUS.KYC_INCOMPLETE, CASE_STATUS.KYC_PENDING] },
  { href: PATHS.dashboardKyc, label: "KYC", icon: FileCheck2, when: [CASE_STATUS.KYC_INCOMPLETE, CASE_STATUS.KYC_PENDING] },
  { href: PATHS.dashboardMessages, label: "Messages", icon: MessageSquare, when: "always" },
  { href: PATHS.dashboardEvents, label: "Events", icon: CalendarDays, when: "always" },
];

const OPS_NAV = [
  { href: PATHS.admin, label: "My cases", icon: Briefcase },
  { href: PATHS.dashboardMessages, label: "Messages", icon: MessageSquare },
  { href: PATHS.dashboardEvents, label: "Events", icon: CalendarDays },
  { href: PATHS.dashboardBrochures, label: "Brochures", icon: BookOpen },
];

const ADMIN_NAV = [
  { href: PATHS.adminPlatform, label: "Control center", icon: Crown },
  { href: PATHS.admin, label: "All cases", icon: Briefcase },
  { href: PATHS.dashboardMessages, label: "Messages", icon: MessageSquare },
  { href: PATHS.dashboardBilling, label: "Plans", icon: CreditCard },
  { href: PATHS.dashboardEvents, label: "Events", icon: CalendarDays },
  { href: PATHS.adminAudit, label: "Payments", icon: CreditCard },
  { href: PATHS.dashboardBrochures, label: "Brochures", icon: BookOpen },
];

const FOOTER_NAV = [
  { href: PATHS.dashboardSettings, label: "Notifications", icon: Settings2 },
  { href: PATHS.dashboardSupport, label: "Support", icon: LifeBuoy },
];

function roleMeta(role) {
  if (role === ROLES.ADMIN) return { label: "Admin", chip: "bg-[var(--gold)]/15 text-[var(--gold)]", icon: Crown };
  if (role === ROLES.OPERATIONS) return { label: "Operations", chip: "bg-cyan-300/15 text-cyan-200", icon: ShieldCheck };
  return { label: "Customer", chip: "bg-emerald-300/15 text-emerald-200", icon: LayoutDashboard };
}

export default function DashboardChrome({ children }) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [caseTick, setCaseTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [session, setSessionState] = useState(() =>
    typeof window !== "undefined" ? getSession() : null
  );

  useEffect(() => {
    if (!session?.email) {
      setNotifications([]);
      return undefined;
    }
    let cancelled = false;
    api("/api/notifications")
      .then((rows) => {
        if (!cancelled) setNotifications(Array.isArray(rows) ? rows : rows?.items || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.email]);

  useEffect(() => {
    if (!notifOpen) return undefined;
    const onDown = (e) => {
      if (!notifRef.current?.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  useEffect(() => {
    fetchPlanCatalog().catch(() => {});
  }, []);

  useEffect(() => {
    setSessionState(getSession());
    return subscribeAuth((next) => {
      setSessionState(next);
      // Cold load after login only — no background polling for everyone.
      if (next?.role === ROLES.CUSTOMER) fetchMyCase().catch(() => {});
      if (next?.role === ROLES.ADMIN || next?.role === ROLES.OPERATIONS) {
        fetchCasesQueue().catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    const h = () => setCaseTick((t) => t + 1);
    window.addEventListener("iehub-case-updated", h);
    return () => window.removeEventListener("iehub-case-updated", h);
  }, []);

  // Never invent a role from the URL — AuthGuard already requires a real session.
  const role = session?.role || ROLES.CUSTOMER;
  const meta = roleMeta(role);

  const customerCase = useMemo(() => {
    if (role !== ROLES.CUSTOMER || !session?.email) return null;
    return ensureCaseForSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, session?.email, caseTick]);

  // Never assume ACTIVE when case is missing — that hides Plan & pay / KYC after payment.
  const status = customerCase ? journeyStatus(customerCase) : CASE_STATUS.NO_PLAN;
  const plan = getPlanById(customerCase?.paidPlanId || customerCase?.planId);
  const stages = customerCase ? getCaseWorkflowStages(customerCase) : [];
  const progressPct =
    status === CASE_STATUS.COMPLETED && stages.length
      ? 100
      : status === CASE_STATUS.ACTIVE && stages.length
      ? Math.round((Math.min(customerCase.stageIndex, stages.length) / stages.length) * 100)
      : status === CASE_STATUS.KYC_PENDING
        ? 40
        : status === CASE_STATUS.KYC_INCOMPLETE
          ? 25
          : status === CASE_STATUS.UNPAID || status === CASE_STATUS.EXPIRED
            ? 10
            : 0;

  const customerNav = useMemo(() => {
    if (role !== ROLES.CUSTOMER) return CUSTOMER_NAV_FULL;
    if (isWorkspaceUnlocked(status)) return CUSTOMER_NAV_FULL;
    return CUSTOMER_NAV_GATED.filter(
      (i) => i.when === "always" || (Array.isArray(i.when) && i.when.includes(status))
    ).map(({ href, label, icon }) => ({ href, label, icon }));
  }, [role, status]);

  const NAV = role === ROLES.ADMIN ? ADMIN_NAV : role === ROLES.OPERATIONS ? OPS_NAV : customerNav;

  const isAdminShell = pathname.startsWith("/admin");
  // Gate using cached case. Only hit the network if we have no snapshot yet —
  // never re-fetch on caseTick (that used to loop: fetch → emit → tick → fetch).
  useEffect(() => {
    if (isAdminShell) return;
    if (!session?.email) return;
    if ((session.role || ROLES.CUSTOMER) !== ROLES.CUSTOMER) return;
    let cancelled = false;
    (async () => {
      let c = ensureCaseForSession();
      if (!c) c = await fetchMyCase();
      if (cancelled || !c) return;
      if (isPathAllowedDuringGate(pathname, c)) return;
      navigate(gatePathForCase(c), { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdminShell, session?.email, session?.role, pathname, navigate, caseTick]);

  const initials = (session?.name || meta.label)
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const signOut = () => {
    clearSession();
    navigate(PATHS.login, { replace: true });
  };

  const refreshWorkspace = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (role === ROLES.CUSTOMER) await fetchMyCase({ force: true });
      else if (role === ROLES.ADMIN || role === ROLES.OPERATIONS) {
        await fetchCasesQueue({ force: true });
      }
    } catch {
      /* ignore — UI keeps last good snapshot */
    } finally {
      setRefreshing(false);
    }
  };

  const statusLabel =
    status === CASE_STATUS.NO_PLAN
      ? "Choose a plan"
      : status === CASE_STATUS.UNPAID
        ? "Complete payment"
        : status === CASE_STATUS.EXPIRED
          ? "Plan expired — renew"
          : status === CASE_STATUS.KYC_INCOMPLETE
            ? "Upload KYC docs"
            : status === CASE_STATUS.KYC_PENDING
              ? "KYC under review"
              : status === CASE_STATUS.COMPLETED
                ? plan
                  ? `${plan.name} · completed`
                  : "Completed"
                : plan
                ? `${plan.name} · in progress`
                : "Active";

  const SideContent = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to={workspaceFor(role)} className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--grad-gold)] text-black font-bold">
          V
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold">VIRASTRA INTERNATIONAL EXPORT</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">where trust travels</div>
        </div>
      </Link>

      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] uppercase tracking-wider ${meta.chip}`}>
        <meta.icon size={12} /> {meta.label} workspace
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, matchPrefix }) => {
          const active = matchPrefix
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;
          return (
            <Link
              key={`${href}:${label}`}
              to={href}
              onClick={() => setOpen(false)}
              className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={16} className={active ? "text-[var(--gold)]" : ""} />
                {label}
              </span>
              {active && <ChevronRight size={14} className="text-[var(--gold)]" />}
            </Link>
          );
        })}

        {role === ROLES.CUSTOMER && (
          <div className="pt-4">
            <div className="mb-2 flex items-center gap-2 px-3 text-[10px] uppercase tracking-[0.2em] text-white/35">
              <Compass size={11} /> Explore
            </div>
            <div className="space-y-0.5">
              {DASHBOARD_EXPLORE_LINKS.map(({ name, path }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white/55 hover:bg-white/5 hover:text-white"
                >
                  <span>{name}</span>
                  <ChevronRight size={12} className="opacity-40" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {role === ROLES.CUSTOMER && (
        <div className="rounded-2xl glass p-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Your journey</span>
            <span className="text-[var(--gold)]">{progressPct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--grad-gold)] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] text-white/45">{statusLabel}</p>
          {customerCase?.opsName && isWorkspaceUnlocked(status) && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
              <Users size={10} /> Ops · {customerCase.opsName}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        {FOOTER_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={15} className={active ? "text-[var(--gold)]" : ""} /> {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[100svh] bg-black text-white">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-50" />
      <div className="absolute inset-0 -z-10 grid-bg" />

      <aside className="fixed inset-y-4 left-4 z-30 hidden w-64 lg:block">
        <div className="glass-card h-full overflow-hidden">{SideContent}</div>
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              <div className="glass-card m-3 h-[calc(100%-1.5rem)] overflow-hidden">{SideContent}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 px-4 pt-4 lg:px-8">
          <div className="glass-card flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg glass lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={refreshWorkspace}
              disabled={refreshing}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg glass px-2.5 text-sm text-white/70 hover:text-white disabled:opacity-50"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg glass"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--gold)]" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#0a0d14]">
                  <div className="border-b border-white/10 px-3 py-2 text-[11px] uppercase tracking-wider text-white/45">
                    Payment reminders
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <li className="px-3 py-4 text-xs text-white/45">No reminders yet.</li>
                    )}
                    {notifications.slice(0, 12).map((n) => (
                      <li key={n.id}>
                        <Link
                          to={n.href || PATHS.dashboardEvents}
                          onClick={async () => {
                            setNotifOpen(false);
                            if (!n.read) {
                              try {
                                await api(`/api/notifications/${encodeURIComponent(n.id)}/read`, {
                                  method: "POST",
                                });
                                setNotifications((prev) =>
                                  prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                                );
                              } catch {
                                /* ignore */
                              }
                            }
                          }}
                          className={`block px-3 py-2.5 text-left hover:bg-white/5 ${
                            n.read ? "opacity-60" : ""
                          }`}
                        >
                          <div className="text-xs font-medium text-white">{n.title}</div>
                          {n.body ? (
                            <div className="mt-0.5 line-clamp-2 text-[11px] text-white/50">{n.body}</div>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex h-9 items-center gap-2 rounded-lg glass px-2 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--grad-gold)] text-xs font-bold text-black">
                {initials}
              </span>
              <span className="hidden text-sm sm:inline">{session?.name || meta.label}</span>
              <span className={`hidden md:inline rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${meta.chip}`}>
                {meta.label}
              </span>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg glass px-3 text-sm text-white/70 hover:text-white"
              aria-label="Log out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
