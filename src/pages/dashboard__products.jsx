import { Link } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import { DASHBOARD_PRODUCT_CATEGORIES } from "@/lib/siteNav";

export default function DashboardProductsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Catalog</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-white/55">
          Browse export categories without leaving your workspace.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_PRODUCT_CATEGORIES.map(({ name, path, short }) => (
          <Link
            key={path}
            to={path}
            className="glass-card group flex items-center justify-between gap-4 p-5 transition hover:bg-white/[0.06]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]">
                <Package size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{name}</span>
                <span className="text-xs text-white/45">{short}</span>
              </span>
            </span>
            <ChevronRight size={16} className="text-white/35 transition group-hover:text-[var(--gold)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
