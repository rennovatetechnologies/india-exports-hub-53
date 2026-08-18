/**
 * Bootstraps catalogs + session case from Mongo on app load.
 * Call once from App root so public pages and dashboard share the same cache.
 */
import { fetchPublicConfig } from "@/lib/appConfig";
import { fetchPlanCatalog } from "@/lib/planCatalog";
import { fetchEventsCatalog } from "@/lib/eventsCatalog";
import { fetchBrochuresCatalog } from "@/lib/brochuresCatalog";
import { fetchMyCase, fetchCasesQueue, fetchOpsRoster } from "@/lib/customerCase";
import { getSession, ROLES, subscribeAuth } from "@/lib/authSession";

let started = false;

/** Soft load once — uses in-tab cache; no forced refresh for every user. */
async function loadSessionData() {
  const session = getSession();
  if (!session) return;
  if (session.role === ROLES.CUSTOMER) {
    await fetchMyCase();
  } else if (session.role === ROLES.ADMIN || session.role === ROLES.OPERATIONS) {
    await Promise.all([fetchCasesQueue(), fetchOpsRoster()]);
  }
}

export async function bootstrapAppData() {
  await Promise.all([
    fetchPublicConfig(),
    fetchPlanCatalog(),
    fetchEventsCatalog(),
    fetchBrochuresCatalog({ force: true }),
  ]);
  await loadSessionData();
}

/** Idempotent: start bootstrap + soft-load case when auth changes. Manual refresh is in the dashboard header. */
export function startAppDataBootstrap() {
  if (typeof window === "undefined") return () => {};
  if (!started) {
    started = true;
    bootstrapAppData().catch((e) => console.warn("[bootstrap]", e.message));
  }
  return subscribeAuth(() => {
    loadSessionData().catch(() => {});
  });
}
