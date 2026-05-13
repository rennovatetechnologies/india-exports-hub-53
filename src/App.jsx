import { Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DashboardChrome from "@/components/dashboard/DashboardChrome";

import Home from "@/pages/index.jsx";
import About from "@/pages/about.jsx";
import Booking from "@/pages/booking.jsx";
import Brochures from "@/pages/brochures.jsx";
import Cereals from "@/pages/cerealsandpulses.jsx";
import Contact from "@/pages/contact.jsx";
import Events from "@/pages/events.jsx";
import Forgot from "@/pages/forgot-password.jsx";
import Fruits from "@/pages/fruitsandvegetables.jsx";
import Gallery from "@/pages/gallery.jsx";
import Login from "@/pages/login.jsx";
import Organic from "@/pages/organicfood.jsx";
import Others from "@/pages/others.jsx";
import Signup from "@/pages/signup.jsx";
import Spices from "@/pages/spices.jsx";
import Verify from "@/pages/verify.jsx";

import Dashboard from "@/pages/dashboard.jsx";
import DashBilling from "@/pages/dashboard__billing.jsx";
import DashEvents from "@/pages/dashboard__events.jsx";
import DashKyc from "@/pages/dashboard__kyc.jsx";
import DashSettings from "@/pages/dashboard__settings.jsx";
import DashSupport from "@/pages/dashboard__support.jsx";
import DashVault from "@/pages/dashboard__vault.jsx";
import DashWorkflow from "@/pages/dashboard__workflow.jsx";

import Admin from "@/pages/admin.jsx";
import AdminWorkflow from "@/pages/admin-workflow.jsx";
import AdminLogin from "@/pages/admin-login.jsx";
import AdminRegister from "@/pages/admin-register.jsx";
import AdminSuper from "@/pages/admin-super.jsx";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [pathname, hash]);
  return null;
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="relative isolate min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-mesh opacity-90" />
          <div className="absolute inset-0 grid-bg opacity-[0.35]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/85 via-transparent to-[var(--background)]" />
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[var(--gold)]/12 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-[380px] w-[380px] rounded-full bg-emerald-400/10 blur-3xl" />
        </div>
        <div className="relative z-[1]">
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  );
}

function ChromeLayout() {
  return (
    <DashboardChrome>
      <Outlet />
    </DashboardChrome>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/brochures" element={<Brochures />} />
          <Route path="/cerealsandpulses" element={<Cereals />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/events" element={<Events />} />
          <Route path="/forgot-password" element={<Forgot />} />
          <Route path="/fruitsandvegetables" element={<Fruits />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/login" element={<Login />} />
          <Route path="/organicfood" element={<Organic />} />
          <Route path="/others" element={<Others />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/spices" element={<Spices />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
        </Route>

        <Route path="/dashboard" element={<ChromeLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="billing" element={<DashBilling />} />
          <Route path="events" element={<DashEvents />} />
          <Route path="kyc" element={<DashKyc />} />
          <Route path="settings" element={<DashSettings />} />
          <Route path="support" element={<DashSupport />} />
          <Route path="vault/:caseId?" element={<DashVault />} />
          <Route path="workflow" element={<DashWorkflow />} />
        </Route>

        <Route path="/admin" element={<ChromeLayout />}>
          <Route index element={<Admin />} />
          <Route path="workflow/:caseId" element={<AdminWorkflow />} />
          <Route path="platform" element={<AdminSuper />} />
          <Route path="super" element={<Navigate to="/admin/platform" replace />} />
        </Route>
      </Routes>
    </>
  );
}
