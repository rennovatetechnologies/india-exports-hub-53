/** Shared public-site navigation — keep Navbar, Footer, Explore bar, and dashboard in sync. */

import {
  getBrochureMenu,
  openBrochureItem,
  loadBrochuresCatalog,
} from "@/lib/brochuresCatalog";
import { PATHS } from "@/lib/routes";
import { isStaffSession, workspaceFor } from "@/lib/authSession";

export const PRODUCT_CATEGORIES = [
  { name: "Spices", path: PATHS.spices, short: "Spices" },
  { name: "Cereals & Pulses", path: PATHS.cereals, short: "Cereals" },
  { name: "Organic Food", path: PATHS.organic, short: "Organic" },
  { name: "Fruits & Vegetables", path: PATHS.fruits, short: "Fruits & Veg" },
  { name: "Others", path: PATHS.others, short: "Others" },
];

/** Product categories for the logged-in workspace (same content, dashboard routes). */
export const DASHBOARD_PRODUCT_CATEGORIES = [
  { name: "Spices", path: PATHS.dashboardProductsSpices, short: "Spices" },
  { name: "Cereals & Pulses", path: PATHS.dashboardProductsCereals, short: "Cereals" },
  { name: "Organic Food", path: PATHS.dashboardProductsOrganic, short: "Organic" },
  { name: "Fruits & Vegetables", path: PATHS.dashboardProductsFruits, short: "Fruits & Veg" },
  { name: "Others", path: PATHS.dashboardProductsOthers, short: "Others" },
];

/** @deprecated Prefer getBrochureMenu() — kept for any leftover imports */
export function getBrochureDownloads() {
  return getBrochureMenu(loadBrochuresCatalog()).filter((x) => x.type === "download");
}

/** Live brochure dropdown (reacts after admin saves via iehub-brochures-updated). */
export { getBrochureMenu };

/** Public marketing destinations (pre-login Navbar / Footer only). */
export const EXPLORE_LINKS = [
  { name: "Plans", path: "/#plans" },
  { name: "Products", path: "/#products" },
  { name: "Brochures", path: PATHS.brochures },
  { name: "Gallery", path: PATHS.gallery },
  { name: "Events", path: PATHS.events },
  { name: "Contact", path: PATHS.contact },
  { name: "About", path: PATHS.about },
];

/** Same explore destinations, kept inside /dashboard after login. */
export const DASHBOARD_EXPLORE_LINKS = [
  { name: "Plans", path: PATHS.dashboardBilling },
  { name: "Products", path: PATHS.dashboardProducts },
  { name: "Brochures", path: PATHS.dashboardBrochures },
  { name: "Gallery", path: PATHS.dashboardGallery },
  { name: "Events", path: PATHS.dashboardEvents },
  { name: "Contact", path: PATHS.dashboardContact },
  { name: "About", path: PATHS.dashboardAbout },
];

/** Auth / OTP flows — logged-in users may still land here briefly. */
const AUTH_PUBLIC_PATHS = new Set([
  PATHS.login,
  PATHS.signup,
  PATHS.forgotPassword,
  PATHS.verify,
  PATHS.adminLogin,
  PATHS.adminRegister,
]);

const PUBLIC_TO_DASHBOARD = {
  [PATHS.home]: PATHS.dashboard,
  [PATHS.about]: PATHS.dashboardAbout,
  [PATHS.contact]: PATHS.dashboardContact,
  [PATHS.gallery]: PATHS.dashboardGallery,
  [PATHS.brochures]: PATHS.dashboardBrochures,
  [PATHS.events]: PATHS.dashboardEvents,
  [PATHS.booking]: PATHS.dashboardBooking,
  [PATHS.spices]: PATHS.dashboardProductsSpices,
  [PATHS.cereals]: PATHS.dashboardProductsCereals,
  [PATHS.organic]: PATHS.dashboardProductsOrganic,
  [PATHS.fruits]: PATHS.dashboardProductsFruits,
  [PATHS.others]: PATHS.dashboardProductsOthers,
};

/**
 * If the user is signed in, return the workspace URL that replaces a public page.
 * Returns null when the visitor should stay on the public route.
 */
export function dashboardPathForPublicUrl(pathnameWithSearchHash = "", session) {
  if (!session?.email) return null;
  const raw = String(pathnameWithSearchHash || "");
  const pathname = raw.split("?")[0].split("#")[0] || "/";
  const hash = raw.includes("#") ? raw.slice(raw.indexOf("#")) : "";

  if (AUTH_PUBLIC_PATHS.has(pathname)) return null;
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/ops")) {
    return null;
  }

  if (isStaffSession(session)) {
    if (pathname === PATHS.events || pathname === PATHS.brochures || pathname === PATHS.booking) {
      return PUBLIC_TO_DASHBOARD[pathname] || workspaceFor(session.role);
    }
    return workspaceFor(session.role);
  }

  if (pathname === PATHS.home && (hash === "#plans" || hash === "#pricing")) {
    return PATHS.dashboardBilling;
  }
  if (pathname === PATHS.home && hash === "#products") {
    return PATHS.dashboardProducts;
  }

  return PUBLIC_TO_DASHBOARD[pathname] || PATHS.dashboard;
}

/** Open a brochure menu item or catalog row (static path or admin upload). */
export async function openBrochureDownload(itemOrPath) {
  if (!itemOrPath) return;
  if (typeof itemOrPath === "string") {
    window.open(encodeURI(itemOrPath), "_blank", "noopener,noreferrer");
    return;
  }
  await openBrochureItem(itemOrPath);
}
