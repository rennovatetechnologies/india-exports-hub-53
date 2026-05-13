import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSession } from "@/lib/authSession";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileCheck2, Folder, Workflow, CalendarDays,
  CreditCard, Settings, LifeBuoy, Bell, Search, Menu, X, LogOut, ChevronRight
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/kyc", label: "KYC Wizard", icon: FileCheck2 },
  { href: "/dashboard/vault", label: "Document Vault", icon: Folder },
  { href: "/dashboard/workflow", label: "Workflow", icon: Workflow },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const FOOTER_NAV = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

export default function DashboardChrome({ children }) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
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

            <div className="hidden flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/60 sm:flex">
              <Search size={15} />
              <input className="flex-1 bg-transparent outline-none placeholder:text-white/30" placeholder="Search shipments, documents, plans…" />
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">⌘K</kbd>
            </div>
            <div className="flex flex-1 sm:hidden" />

            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg glass">
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            </button>
            <Link to="/dashboard/settings" className="flex h-9 items-center gap-2 rounded-lg glass px-2 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--grad-gold)] text-black text-xs font-bold">RA</span>
              <span className="hidden text-sm sm:inline">Rohit A.</span>
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}