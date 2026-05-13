import { Routes, Route, Outlet, useLocation } from "react-router-dom";
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="relative"><Outlet /></main>
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
        </Route>

        <Route path="/dashboard" element={<ChromeLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="billing" element={<DashBilling />} />
          <Route path="events" element={<DashEvents />} />
          <Route path="kyc" element={<DashKyc />} />
          <Route path="settings" element={<DashSettings />} />
          <Route path="support" element={<DashSupport />} />
          <Route path="vault" element={<DashVault />} />
          <Route path="workflow" element={<DashWorkflow />} />
        </Route>

        <Route path="/admin" element={<ChromeLayout />}>
          <Route index element={<Admin />} />
        </Route>
      </Routes>
    </>
  );
}
