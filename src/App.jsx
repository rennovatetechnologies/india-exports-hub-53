import { Routes, Route, Outlet, useLocation, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DashboardChrome from "@/components/dashboard/DashboardChrome";
import AuthGuard from "@/components/AuthGuard";
import RedirectIfAuthenticated from "@/components/RedirectIfAuthenticated";
import ErrorBoundary from "@/components/ErrorBoundary";
import { startAppDataBootstrap } from "@/lib/appBootstrap";
import { initSessionExpiryWatch } from "@/lib/authSession";
import { PATHS, adminWorkflowPath } from "@/lib/routes";

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
import DashBrochures from "@/pages/dashboard__brochures.jsx";
import DashProducts from "@/pages/dashboard__products.jsx";
import DashKyc from "@/pages/dashboard__kyc.jsx";
import DashSupport from "@/pages/dashboard__support.jsx";
import DashDocuments from "@/pages/dashboard__documents.jsx";
import DashMessages from "@/pages/dashboard__messages.jsx";
import DashWorkflow from "@/pages/dashboard__workflow.jsx";
import DashSettings from "@/pages/dashboard__settings.jsx";

import Admin from "@/pages/admin.jsx";
import AdminWorkflow from "@/pages/admin-workflow.jsx";
import AdminLogin from "@/pages/admin-login.jsx";
import AdminRegister from "@/pages/admin-register.jsx";
import AdminSuper from "@/pages/admin-super.jsx";
import AdminAudit from "@/pages/admin-audit.jsx";
import NotFound from "@/pages/not-found.jsx";

/** Email/legacy `/ops/cases/:id` → canonical admin workflow. */
function OpsCaseRedirect() {
  const { caseId } = useParams();
  return <Navigate to={adminWorkflowPath(caseId)} replace />;
}

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
  const { pathname } = useLocation();
  return (
    <RedirectIfAuthenticated>
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
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </RedirectIfAuthenticated>
  );
}

function ChromeLayout() {
  const { pathname } = useLocation();
  return (
    <DashboardChrome>
      <ErrorBoundary resetKey={pathname} compact>
        <Outlet />
      </ErrorBoundary>
    </DashboardChrome>
  );
}

export default function App() {
  useEffect(() => {
    initSessionExpiryWatch();
    return startAppDataBootstrap();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={PATHS.home} element={<Home />} />
          <Route path={PATHS.about} element={<About />} />
          <Route path={PATHS.booking} element={<Booking />} />
          <Route path={PATHS.brochures} element={<Brochures />} />
          <Route path={PATHS.cereals} element={<Cereals />} />
          <Route path={PATHS.contact} element={<Contact />} />
          <Route path={PATHS.events} element={<Events />} />
          <Route path={PATHS.forgotPassword} element={<Forgot />} />
          <Route path={PATHS.fruits} element={<Fruits />} />
          <Route path={PATHS.gallery} element={<Gallery />} />
          <Route path={PATHS.login} element={<Login />} />
          <Route path={PATHS.organic} element={<Organic />} />
          <Route path={PATHS.others} element={<Others />} />
          <Route path={PATHS.signup} element={<Signup />} />
          <Route path={PATHS.spices} element={<Spices />} />
          <Route path={PATHS.verify} element={<Verify />} />
          <Route path={PATHS.adminLogin} element={<AdminLogin />} />
          <Route path={PATHS.adminRegister} element={<AdminRegister />} />
        </Route>

        <Route
          path={PATHS.dashboard}
          element={
            <AuthGuard area="customer">
              <ChromeLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="billing" element={<DashBilling />} />
          <Route path="events" element={<DashEvents />} />
          <Route path="brochures" element={<DashBrochures />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="booking" element={<Booking />} />
          <Route path="products" element={<DashProducts />} />
          <Route path="products/spices" element={<Spices />} />
          <Route path="products/cerealsandpulses" element={<Cereals />} />
          <Route path="products/organicfood" element={<Organic />} />
          <Route path="products/fruitsandvegetables" element={<Fruits />} />
          <Route path="products/others" element={<Others />} />
          <Route path="kyc" element={<DashKyc />} />
          <Route path="support" element={<DashSupport />} />
          <Route path="documents" element={<DashDocuments />} />
          <Route path="messages" element={<DashMessages />} />
          <Route path="vault/:caseId?" element={<Navigate to={PATHS.dashboardDocuments} replace />} />
          <Route path="workflow" element={<DashWorkflow />} />
          <Route path="settings" element={<DashSettings />} />
          <Route path="*" element={<NotFound compact />} />
        </Route>

        <Route
          path="/admin"
          element={
            <AuthGuard area="staff">
              <ChromeLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Admin />} />
          <Route path="workflow/:caseId" element={<AdminWorkflow />} />
          <Route path="platform" element={<AdminSuper />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="super" element={<Navigate to={PATHS.adminPlatform} replace />} />
          <Route path="staff" element={<Navigate to={PATHS.adminPlatform} replace />} />
          <Route path="support" element={<Navigate to={PATHS.dashboardSupport} replace />} />
          <Route path="*" element={<NotFound compact />} />
        </Route>

        {/* Legacy / email deep-link aliases → canonical staff paths */}
        <Route
          path="/ops"
          element={
            <AuthGuard area="staff">
              <Outlet />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to={PATHS.admin} replace />} />
          <Route path="kyc" element={<Navigate to={PATHS.adminKycQueue} replace />} />
          <Route path="cases/:caseId" element={<OpsCaseRedirect />} />
          <Route path="bookings" element={<Navigate to={PATHS.dashboardEvents} replace />} />
        </Route>

        <Route
          path="*"
          element={
            <>
              <Navbar />
              <main className="relative isolate min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                <NotFound />
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </>
  );
}
