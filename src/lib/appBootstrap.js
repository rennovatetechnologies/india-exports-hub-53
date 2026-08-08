/**
 * Bootstraps catalogs + session case from Mongo on app load.
 * Call once from App root so public pages and dashboard share the same cache.
 */
import { fetchPublicConfig } from "@/lib/appConfig";
import { fetchPlanCatalog } from "@/lib/planCatalog";
import { fetchEventsCatalog } from "@/lib/eventsCatalog";
import { fetchBrochuresCatalog } from "@/lib/brochuresCatalog";
import { fetchMyCase, fetchCasesQueue } from "@/lib/customerCase";
import { getSession, ROLES, subscribeAuth } from "@/lib/authSession";

let started = false;

async function loadSessionData() {
  const session = getSession();
  if (!session) return;
  if (session.role === ROLES.CUSTOMER) {
    await fetchMyCase({ force: true });
  } else if (session.role === ROLES.ADMIN || session.role === ROLES.OPERATIONS) {
    await fetchCasesQueue({ force: true });
  }
}

export async function bootstrapAppData() {
  await Promise.all([
    fetchPublicConfig({ force: true }),
    fetchPlanCatalog({ force: true }),
    fetchEventsCatalog({ force: true }),
    fetchBrochuresCatalog({ force: true }),
  ]);
  await loadSessionData();
}

/** Idempotent: start bootstrap + re-fetch case on auth changes. */
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
