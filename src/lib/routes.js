/**
 * Canonical UI paths — single source of truth for App routes, nav, and deep links.
 * Backend email CTAs should match these (see new-india-exports mail defaultCta).
 */

export const PATHS = {
  home: "/",
  about: "/about",
  booking: "/booking",
  brochures: "/brochures",
  cereals: "/cerealsandpulses",
  contact: "/contact",
  events: "/events",
  forgotPassword: "/forgot-password",
  fruits: "/fruitsandvegetables",
  gallery: "/gallery",
  login: "/login",
  organic: "/organicfood",
  others: "/others",
  signup: "/signup",
  spices: "/spices",
  verify: "/verify",

  adminLogin: "/admin/login",
  adminRegister: "/admin/register",

  dashboard: "/dashboard",
  dashboardBilling: "/dashboard/billing",
  dashboardEvents: "/dashboard/events",
  dashboardBrochures: "/dashboard/brochures",
  dashboardGallery: "/dashboard/gallery",
  dashboardAbout: "/dashboard/about",
  dashboardContact: "/dashboard/contact",
  dashboardProducts: "/dashboard/products",
  dashboardProductsSpices: "/dashboard/products/spices",
  dashboardProductsCereals: "/dashboard/products/cerealsandpulses",
  dashboardProductsOrganic: "/dashboard/products/organicfood",
  dashboardProductsFruits: "/dashboard/products/fruitsandvegetables",
  dashboardProductsOthers: "/dashboard/products/others",
  dashboardBooking: "/dashboard/booking",
  dashboardKyc: "/dashboard/kyc",
  dashboardSettings: "/dashboard/settings",
  dashboardSupport: "/dashboard/support",
  dashboardDocuments: "/dashboard/documents",
  dashboardMessages: "/dashboard/messages",
  dashboardWorkflow: "/dashboard/workflow",
  /** Legacy vault URLs redirect here */
  dashboardVault: "/dashboard/documents",

  admin: "/admin",
  adminPlatform: "/admin/platform",
  /** Staff access requests live on the control center */
  adminStaff: "/admin/platform",
  /** Shared support surface (staff + customer) */
  adminSupport: "/dashboard/support",
  adminKycQueue: "/admin?filter=pending_kyc",
  /** Legacy alias kept for redirects */
  adminSuper: "/admin/platform",

  /** Ops aliases (email / legacy deep links) → staff workspace */
  ops: "/admin",
  opsKyc: "/admin?filter=pending_kyc",
  opsBookings: "/dashboard/events",
};

/** Admin case workspace — `caseRef` may be case id or customer email. */
export function adminWorkflowPath(caseRef) {
  return `/admin/workflow/${encodeURIComponent(String(caseRef || "").trim())}`;
}

/** Legacy /ops/cases/:id deep link (emails); same as admin workflow. */
export function opsCasePath(caseRef) {
  return `/ops/cases/${encodeURIComponent(String(caseRef || "").trim())}`;
}

/** Login with safe return path. */
export function loginWithNext(next, { staff = false } = {}) {
  const base = staff ? PATHS.adminLogin : PATHS.login;
  if (!next) return base;
  return `${base}?next=${encodeURIComponent(next)}`;
}
