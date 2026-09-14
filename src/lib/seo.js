/** Public site origin used in canonical / Open Graph tags. */
export const SITE_URL = "https://www.virastrainternationalexport.com";

export const DEFAULT_SEO = {
  title: "Virastra | New India Export | Indian Export Consultancy by Saurabh Yadav",
  description:
    "Virastra International Export (VIRASTRA by New India Export) is an Indian export consultancy and workflow platform founded by Saurabh Nathuram Yadav in Nagpur.",
};

const PAGE_SEO = {
  "/": DEFAULT_SEO,
  "/about": {
    title: "About Virastra | New India Export & Founder Saurabh Yadav",
    description:
      "About Virastra International Export and New India Export. Founded by Saurabh Nathuram Yadav to help Indian exporters ship spices, organic food, and farm products worldwide.",
  },
  "/contact": {
    title: "Contact Virastra | New India Export, Nagpur",
    description:
      "Contact Virastra by New India Export in Nagpur. Talk to Saurabh Yadav’s export desk about plans, KYC, and shipping from India.",
  },
  "/events": {
    title: "Export Events | Virastra by New India Export",
    description:
      "Workshops and export events from Virastra International Export / New India Export in Nagpur.",
  },
  "/brochures": {
    title: "Export Brochures | Virastra · New India Export",
    description: "Download Virastra by New India Export product and plan brochures.",
  },
  "/gallery": {
    title: "Gallery | Virastra International Export",
    description: "Photos from Virastra by New India Export — Indian export, events, and products.",
  },
  "/booking": {
    title: "Book an Export Plan | Virastra · New India Export",
    description: "Book a Virastra by New India Export consultancy plan and start exporting from India.",
  },
  "/spices": {
    title: "Spices Export | Virastra · New India Export",
    description: "Indian spices export with Virastra by New India Export.",
  },
  "/cerealsandpulses": {
    title: "Cereals & Pulses Export | Virastra · New India Export",
    description: "Cereals and pulses export from India with Virastra / New India Export.",
  },
  "/organicfood": {
    title: "Organic Food Export | Virastra · New India Export",
    description: "Organic food export from India with Virastra by New India Export.",
  },
  "/fruitsandvegetables": {
    title: "Fruits & Vegetables Export | Virastra · New India Export",
    description: "Fresh produce export from India with Virastra / New India Export.",
  },
  "/others": {
    title: "Other Export Products | Virastra · New India Export",
    description: "More Indian export products from Virastra by New India Export.",
  },
  "/login": {
    title: "Sign in | Virastra by New India Export",
    description: "Sign in to your Virastra / New India Export account.",
  },
  "/signup": {
    title: "Create account | Virastra by New India Export",
    description: "Create a Virastra by New India Export account to start your export workflow.",
  },
};

export function seoForPath(pathname) {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  if (path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/ops")) {
    return {
      title: "VIRASTRA by New India Export",
      description: DEFAULT_SEO.description,
      robots: "noindex, nofollow",
    };
  }
  if (path.startsWith("/events/") && path !== "/events") {
    return PAGE_SEO["/events"];
  }
  return PAGE_SEO[path] || DEFAULT_SEO;
}
