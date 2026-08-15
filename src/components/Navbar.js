import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Download } from "lucide-react";
import { getBrochureMenu, PRODUCT_CATEGORIES, openBrochureDownload } from "@/lib/siteNav";
import { fetchBrochuresCatalog, subscribeBrochures } from "@/lib/brochuresCatalog";
import { PATHS } from "@/lib/routes";
import {
  clearSession,
  getSession,
  isStaffSession,
  subscribeAuth,
  workspaceFor,
  ROLES,
} from "@/lib/authSession";

export default function Navbar() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopProductsOpen, setDesktopProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [desktopBrochuresOpen, setDesktopBrochuresOpen] = useState(false);
  const [mobileBrochuresOpen, setMobileBrochuresOpen] = useState(false);
  const [brochureMenu, setBrochureMenu] = useState(() => getBrochureMenu());
  const [session, setSessionState] = useState(null);
  const pathname = useLocation().pathname;

  const loggedIn = Boolean(session?.email);
  const workspaceHref = loggedIn
    ? workspaceFor(session?.role || ROLES.CUSTOMER)
    : "/login";
  const authLabel = !loggedIn
    ? "Log in"
    : isStaffSession(session)
      ? "Workspace"
      : "Dashboard";

  const handleLogout = () => {
    clearSession();
    setMobileOpen(false);
    navigate(PATHS.login, { replace: true });
  };

  useEffect(() => {
    setMounted(true);
    setSessionState(getSession());
    return subscribeAuth((next) => setSessionState(next));
  }, []);

  useEffect(() => {
    fetchBrochuresCatalog({ force: true })
      .then(() => setBrochureMenu(getBrochureMenu()))
      .catch(() => setBrochureMenu(getBrochureMenu()));
    return subscribeBrochures(() => setBrochureMenu(getBrochureMenu()));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("drawer-open");
    } else {
      document.body.style.overflow = "";
      document.documentElement.classList.remove("drawer-open");
    }
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => window.innerWidth >= 768 && setMobileOpen(false);
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMobileProductsOpen(false);
        setMobileBrochuresOpen(false);
        setDesktopProductsOpen(false);
        setDesktopBrochuresOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileProductsOpen(false);
    setMobileBrochuresOpen(false);
    setDesktopProductsOpen(false);
    setDesktopBrochuresOpen(false);
  }, [pathname]);

  // Workspace chrome owns its chrome; keep public nav on marketing + auth pages.
  const hideForDedicatedChrome =
    pathname?.startsWith("/dashboard") ||
    (pathname?.startsWith("/admin") &&
      !pathname.startsWith("/admin/login") &&
      !pathname.startsWith("/admin/register"));
  if (hideForDedicatedChrome) return null;

  const brochureDownloads = brochureMenu.filter((x) => x.type === "download");
  const navItems = [
    { name: "Home", path: PATHS.home },
    { name: "Plans", path: "/#plans" },
    brochureDownloads.length
      ? { name: "Brochures", sub: brochureMenu }
      : { name: "Brochures", path: PATHS.brochures },
    {
      name: "Products",
      sub: PRODUCT_CATEGORIES.map(({ name, path }) => ({ name, path })),
    },
    { name: "Gallery", path: PATHS.gallery },
    { name: "Events", path: PATHS.events },
    { name: "Contact Us", path: PATHS.contact },
    { name: "About Us", path: PATHS.about },
  ];

  const isActive = (path) => {
    if (!path) return false;
    if (path.startsWith("/#")) return pathname === "/";
    return path === "/" ? pathname === "/" : pathname.startsWith(path);
  };

  const handleBrochureClick = async (item) => {
    if (item.type === "download") {
      await openBrochureDownload(item);
    }
    setMobileOpen(false);
    setDesktopBrochuresOpen(false);
  };

  const BrochureItem = ({ item, isMobile = false }) => {
    if (item.type === "download") {
      return (
        <button
          onClick={() => handleBrochureClick(item)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${isMobile
            ? "text-zinc-300 hover:bg-white/5 hover:text-white"
            : "text-zinc-300 hover:bg-white/5 hover:text-white"
            }`}
        >
          <span>{item.name}</span>
          <Download size={14} className="text-zinc-400" />
        </button>
      );
    }

    return (
      <Link
        to={item.path}
        onClick={() => {
          setMobileOpen(false);
          setDesktopBrochuresOpen(false);
        }}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${isMobile
          ? "text-zinc-300 hover:bg-white/5 hover:text-white"
          : "text-zinc-300 hover:bg-white/5 hover:text-white"
          } ${isActive(item.path) ? "bg-white/5 text-white" : ""}`}
      >
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Navbar */}
      <nav
        role="navigation"
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${scrolled || mobileOpen
          ? "bg-[var(--background)]/85 backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-b from-[var(--background)]/70 to-transparent backdrop-blur-md"
          }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3">
            {/* Logo — stays left; does not shrink */}
            <Link
              to={PATHS.home}
              className="flex shrink-0 items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
              aria-label="VIRASTRA INTERNATIONAL EXPORT Home"
            >
              <span className="flex flex-col leading-tight">
                <span className="text-sm sm:text-base md:text-lg font-semibold tracking-tight text-gold-gradient">
                  VIRASTRA INTERNATIONAL EXPORT
                </span>
                <span className="hidden sm:block text-[9px] uppercase tracking-[0.18em] text-white/45">
                  where trust travels
                </span>
              </span>
            </Link>

            {/* Desktop: overflow must stay visible so Brochures/Products menus aren't clipped */}
            <div className="hidden md:flex flex-1 min-w-0 items-center justify-end gap-2 lg:gap-3">
              <div className="flex min-h-16 min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1 lg:gap-x-6 pr-1">
              {navItems.map((item) =>
                item.sub ? (
                  <div
                    key={item.name}
                    className="relative group shrink-0"
                    onMouseEnter={() => {
                      if (item.name === "Products") setDesktopProductsOpen(true);
                      if (item.name === "Brochures") setDesktopBrochuresOpen(true);
                    }}
                    onMouseLeave={() => {
                      if (item.name === "Products") setDesktopProductsOpen(false);
                      if (item.name === "Brochures") setDesktopBrochuresOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={item.name === "Products" ? desktopProductsOpen : desktopBrochuresOpen}
                      onClick={() => {
                        if (item.name === "Products") {
                          setDesktopProductsOpen((v) => !v);
                          setDesktopBrochuresOpen(false);
                        }
                        if (item.name === "Brochures") {
                          setDesktopBrochuresOpen((v) => !v);
                          setDesktopProductsOpen(false);
                        }
                      }}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md px-1 ${scrolled ? "text-zinc-300 hover:text-white" : "text-zinc-200 hover:text-white"
                        }`}
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ${(item.name === "Products" && desktopProductsOpen) ||
                          (item.name === "Brochures" && desktopBrochuresOpen) ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {(item.name === "Products" && desktopProductsOpen) ||
                        (item.name === "Brochures" && desktopBrochuresOpen) ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          role="menu"
                          className="absolute left-0 top-full z-[100] pt-2 min-w-[240px]"
                        >
                          <div className="rounded-xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-md">
                          {item.sub.map((sub) => (
                            item.name === "Brochures" ? (
                              <BrochureItem key={sub.id || sub.name} item={sub} />
                            ) : (
                              <Link
                                key={sub.name}
                                to={sub.path}
                                role="menuitem"
                                onClick={() => setDesktopProductsOpen(false)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors ${isActive(sub.path) ? "bg-white/5 text-white" : ""
                                  }`}
                              >
                                <span>{sub.name}</span>
                              </Link>
                            )
                          ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative group shrink-0 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md px-1 ${scrolled ? "text-zinc-300 hover:text-white" : "text-zinc-200 hover:text-white"
                      }`}
                  >
                    <span className={`${isActive(item.path) ? "text-white" : ""}`}>{item.name}</span>
                    {mounted && isActive(item.path) && (
                      <motion.span
                        className="absolute -bottom-1 left-0 h-0.5 bg-white"
                        layoutId="activeIndicator"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              )}
              </div>
              <div className="shrink-0 border-l border-white/10 pl-4 lg:pl-6 ml-1 flex items-center gap-2">
                {!loggedIn && (
                  <Link
                    to={PATHS.signup}
                    className={`hidden lg:inline-flex text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md px-2 py-1.5 ${scrolled ? "text-zinc-400 hover:text-white" : "text-zinc-300 hover:text-white"}`}
                  >
                    Sign up
                  </Link>
                )}
                <Link
                  to={workspaceHref}
                  className={`inline-flex text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md px-2.5 py-1.5 ${
                    loggedIn
                      ? scrolled
                        ? "text-zinc-300 hover:text-white"
                        : "text-zinc-200 hover:text-white"
                      : "bg-white/10 text-white hover:bg-white/15 border border-white/15"
                  }`}
                >
                  {authLabel}
                </Link>
                {loggedIn && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`inline-flex text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md px-2 py-1.5 ${scrolled ? "text-zinc-400 hover:text-white" : "text-zinc-300 hover:text-white"}`}
                  >
                    Log out
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen((s) => !s)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <div className="relative h-5 w-6">
                <motion.span
                  className="absolute left-0 top-0 h-[2px] w-6 rounded bg-current"
                  animate={mobileOpen ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.span
                  className="absolute left-0 top-1/2 h-[2px] w-6 -translate-y-1/2 rounded bg-current"
                  animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.span
                  className="absolute left-0 bottom-0 h-[2px] w-6 rounded bg-current"
                  animate={mobileOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/55 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Drawer */}
            <motion.aside
              className="fixed inset-y-0 left-0 z-[70] w-[86%] max-w-sm md:hidden border-r border-white/10 bg-zinc-950/100 shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.8 }}
            >
              <div className="flex h-16 items-center justify-between px-4">
                <span className="text-lg font-semibold text-white">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-2 text-zinc-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  ✕
                </button>
              </div>

              <nav className="px-2 pb-8">
                {navItems.map((item) =>
                  item.sub ? (
                    <div key={item.name} className="px-2">
                      <button
                        onClick={() => {
                          if (item.name === "Products") setMobileProductsOpen((v) => !v);
                          if (item.name === "Brochures") setMobileBrochuresOpen((v) => !v);
                        }}
                        aria-expanded={
                          (item.name === "Products" && mobileProductsOpen) ||
                          (item.name === "Brochures" && mobileBrochuresOpen)
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3.5 py-3 text-base font-medium text-zinc-200 hover:bg-white/5 hover:text-white"
                      >
                        <span>{item.name}</span>
                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-300 ${((item.name === "Products" && mobileProductsOpen) ||
                            (item.name === "Brochures" && mobileBrochuresOpen)) ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {(item.name === "Products" && mobileProductsOpen) ||
                          (item.name === "Brochures" && mobileBrochuresOpen) ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1 space-y-1 rounded-lg pl-2">
                              {item.sub.map((sub) => (
                                item.name === "Brochures" ? (
                                  <BrochureItem key={sub.id || sub.name} item={sub} isMobile={true} />
                                ) : (
                                  <Link
                                    key={sub.name}
                                    to={sub.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={`block rounded-md px-3.5 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white ${isActive(sub.path) ? "bg-white/5 text-white" : ""
                                      }`}
                                  >
                                    {sub.name}
                                  </Link>
                                )
                              ))}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`mx-2 mt-1 block rounded-lg px-3.5 py-3 text-base font-medium text-zinc-200 hover:bg-white/5 hover:text-white ${isActive(item.path) ? "bg-white/5 text-white" : ""
                        }`}
                    >
                      {item.name}
                    </Link>
                  )
                )}
                <div className="mx-2 mt-4 border-t border-white/10 pt-4 space-y-1 px-2">
                  <Link
                    to={workspaceHref}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3.5 py-3 text-base font-medium text-zinc-200 hover:bg-white/5 hover:text-white"
                  >
                    {authLabel}
                  </Link>
                  {!loggedIn && (
                    <Link
                      to={PATHS.signup}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3.5 py-3 text-base font-medium text-zinc-200 hover:bg-white/5 hover:text-white"
                    >
                      Sign up
                    </Link>
                  )}
                  {loggedIn && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-lg px-3.5 py-3 text-left text-base font-medium text-zinc-200 hover:bg-white/5 hover:text-white"
                    >
                      Log out
                    </button>
                  )}
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
