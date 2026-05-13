import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession, ROLES } from "@/lib/authSession";
import {
  loadWorkflowCasesWithOverrides,
  sortWorkflowCases,
  workflowCaseMatchesSmartQuery,
  workflowCaseStageLabel,
} from "@/lib/workflowVault";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileCheck2, Folder, Workflow, CalendarDays,
  CreditCard, Settings, LifeBuoy, Bell, Search, Menu, LogOut, ChevronRight,
  ShieldCheck, Crown, Briefcase, BarChart3, Users
} from "lucide-react";

const CUSTOMER_NAV_BASE = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/kyc", label: "KYC Wizard", icon: FileCheck2 },
  { href: "/dashboard/vault", label: "Document Vault", icon: Folder, matchPrefix: true },
  { href: "/dashboard/workflow", label: "Workflow", icon: Workflow },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const OPS_NAV = [
  { href: "/admin", label: "Operations", icon: Briefcase },
  { href: "/dashboard/workflow", label: "Workflow board", icon: Workflow },
  { href: "/dashboard/vault", label: "Document review", icon: Folder, matchPrefix: true },
];

const ADMIN_NAV = [
  { href: "/admin/platform", label: "Control center", icon: Crown },
  { href: "/admin", label: "Operations", icon: Briefcase },
  { href: "/dashboard/billing", label: "Revenue", icon: BarChart3 },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/settings", label: "RBAC &amp; team", icon: Users },
];

const FOOTER_NAV = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
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
  const [workspaceQ, setWorkspaceQ] = useState("");
  const [workflowTick, setWorkflowTick] = useState(0);
  const workspaceSearchRef = useRef(null);
  const workspaceWrapRef = useRef(null);
  const session = getSession();
  const role =
    session?.role ||
    (pathname.startsWith("/admin/platform") || pathname.startsWith("/admin/super")
      ? ROLES.ADMIN
      : pathname.startsWith("/admin")
        ? ROLES.OPERATIONS
        : ROLES.CUSTOMER);
  const meta = roleMeta(role);
  const customerNav = useMemo(() => {
    if (role !== ROLES.CUSTOMER || !session || session.kycComplete) return CUSTOMER_NAV_BASE;
    const kycItem = CUSTOMER_NAV_BASE.find((i) => i.href === "/dashboard/kyc");
    const rest = CUSTOMER_NAV_BASE.filter((i) => i.href !== "/dashboard/kyc");
    return kycItem ? [kycItem, ...rest] : CUSTOMER_NAV_BASE;
  }, [role, session?.kycComplete]);
  const NAV = role === ROLES.ADMIN ? ADMIN_NAV : role === ROLES.OPERATIONS ? OPS_NAV : customerNav;

  const refreshWorkflowCases = useCallback(() => setWorkflowTick((t) => t + 1), []);
  useEffect(() => {
    const h = () => refreshWorkflowCases();
    window.addEventListener("iehub-workflow-updated", h);
    return () => window.removeEventListener("iehub-workflow-updated", h);
  }, [refreshWorkflowCases]);

  const workspaceCases = useMemo(() => loadWorkflowCasesWithOverrides(), [workflowTick]);
  const workspaceMatches = useMemo(() => {
    const q = workspaceQ.trim();
    if (!q) return [];
    const hits = workspaceCases.filter((c) => workflowCaseMatchesSmartQuery(c, q));
    return sortWorkflowCases(hits, "smart").slice(0, 10);
  }, [workspaceCases, workspaceQ]);

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "k") return;
      e.preventDefault();
      workspaceSearchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (!workspaceWrapRef.current?.contains(e.target)) setWorkspaceQ((q) => (q ? "" : q));
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const isAdminShell = pathname.startsWith("/admin");
  const sessionEmail = session?.email;
  const sessionRole = session?.role;
  const sessionKycComplete = session?.kycComplete;
  useEffect(() => {
    if (isAdminShell) return;
    if (!sessionEmail) return;
    const r = sessionRole || ROLES.CUSTOMER;
    if (r !== ROLES.CUSTOMER) return;
    if (sessionKycComplete) return;
    const allowed = ["/dashboard/kyc", "/dashboard/settings", "/dashboard/support"];
    const ok = allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!ok) navigate("/dashboard/kyc", { replace: true });
  }, [isAdminShell, sessionEmail, sessionRole, sessionKycComplete, pathname, navigate]);
  const initials = (session?.name || meta.label).split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const signOut = () => {
    clearSession();
    navigate("/");
  };

  const SideContent = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--grad-gold)] text-black font-bold">V</span>
        <div className="leading-tight">
          <div className="text-sm font-semibold">VISTARA</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Export OS</div>
        </div>
      </Link>

      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] uppercase tracking-wider ${meta.chip}`}>
        <meta.icon size={12} /> {meta.label} workspace
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon, matchPrefix }) => {
          const active = matchPrefix ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
          return (
            <Link
              key={href}
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
      </nav>

      {role === ROLES.CUSTOMER && (
      <div className="rounded-2xl glass p-4">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Plan progress</span>
          <span className="text-[var(--gold)]">62%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[62%] rounded-full bg-[var(--grad-gold)]" />
        </div>
        <p className="mt-3 text-[11px] text-white/45">IEC issued · AD code pending</p>
      </div>
      )}
      {role === ROLES.ADMIN && (
        <div className="rounded-2xl glass p-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Pending approvals</span>
            <Link to="/admin/platform" className="text-[var(--gold)] hover:underline">Review →</Link>
          </div>
          <p className="mt-2 text-[11px] text-white/45">3 admin requests · 2 KYC escalations</p>
        </div>
      )}

      <div className="space-y-1">
        {FOOTER_NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} to={href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            <Icon size={15} /> {label}
          </Link>
        ))}
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

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-4 left-4 z-30 hidden w-64 lg:block">
        <div className="glass-card h-full overflow-hidden">{SideContent}</div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              <div className="glass-card m-3 h-[calc(100%-1.5rem)] overflow-hidden">
                {SideContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-20 px-4 pt-4 lg:px-8">
          <div className="glass-card flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg glass lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <div ref={workspaceWrapRef} className="relative hidden min-w-0 flex-1 sm:block">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/60">
                <Search size={15} className="shrink-0" />
                <input
                  ref={workspaceSearchRef}
                  value={workspaceQ}
                  onChange={(e) => setWorkspaceQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || !workspaceMatches[0]) return;
                    e.preventDefault();
                    const c = workspaceMatches[0];
                    if (role === ROLES.CUSTOMER) {
                      navigate(`/dashboard/workflow?case=${encodeURIComponent(c.id)}`);
                    } else {
                      navigate(`/admin/workflow/${encodeURIComponent(c.id)}`);
                    }
                    setWorkspaceQ("");
                    workspaceSearchRef.current?.blur();
                  }}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/30"
                  placeholder="Smart search: id, buyer, sla:breached, words…"
                  aria-autocomplete="list"
                  aria-expanded={Boolean(workspaceQ.trim())}
                  aria-controls="workspace-search-results"
                />
                <kbd className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">⌘K</kbd>
              </div>
              {workspaceMatches.length > 0 && (
                <ul
                  id="workspace-search-results"
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 py-1 text-sm shadow-xl backdrop-blur-md"
                  role="listbox"
                >
                  {workspaceMatches.map((c) => (
                    <li key={c.id} role="option" className="border-b border-white/5 last:border-0">
                      <div className="flex flex-col gap-1 px-3 py-2">
                        <div className="text-xs text-white/45">
                          {c.id} · <span className="text-white/70">{workflowCaseStageLabel(c.stage)}</span>
                        </div>
                        <div className="font-medium text-white">{c.title}</div>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <Link
                            to={
                              role === ROLES.CUSTOMER
                                ? `/dashboard/workflow?case=${encodeURIComponent(c.id)}`
                                : `/admin/workflow/${encodeURIComponent(c.id)}`
                            }
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setWorkspaceQ("")}
                            className="text-[var(--gold)] hover:underline"
                          >
                            Workflow
                          </Link>
                          <span className="text-white/25">·</span>
                          <Link
                            to={`/dashboard/vault/${encodeURIComponent(c.id)}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setWorkspaceQ("")}
                            className="text-cyan-200/90 hover:underline"
                          >
                            Vault
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {workspaceQ.trim() && workspaceMatches.length === 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-white/10 bg-zinc-950/95 px-3 py-3 text-xs text-white/50 backdrop-blur-md">
                  No cases match. Try multiple words (all must match), <span className="text-white/60">sla:breached</span>, or{" "}
                  <span className="text-white/60">stage:kyc</span>.
                </div>
              )}
            </div>
            <div className="flex flex-1 sm:hidden" />

            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg glass">
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            </button>
            <Link to="/dashboard/settings" className="flex h-9 items-center gap-2 rounded-lg glass px-2 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--grad-gold)] text-black text-xs font-bold">{initials}</span>
              <span className="hidden text-sm sm:inline">{session?.name || meta.label}</span>
              <span className={`hidden md:inline rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${meta.chip}`}>{meta.label}</span>
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}