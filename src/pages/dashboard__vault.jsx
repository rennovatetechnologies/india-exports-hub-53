import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Folder, FileText, Search, Upload, Filter, Download, MoreHorizontal,
  ShieldCheck, Clock3, CheckCircle2, AlertCircle, Image as ImageIcon
} from "lucide-react";

const FOLDERS = [
  { id: "all", label: "All documents", count: 22 },
  { id: "kyc", label: "KYC", count: 6 },
  { id: "licenses", label: "Licenses", count: 5 },
  { id: "shipments", label: "Shipments", count: 8 },
  { id: "invoices", label: "Invoices", count: 3 },
];

const DOCS = [
  { name: "PAN Card.pdf", folder: "kyc", size: "184 KB", updated: "12 Apr", status: "verified" },
  { name: "Aadhaar.pdf", folder: "kyc", size: "421 KB", updated: "12 Apr", status: "verified" },
  { name: "GST Certificate.pdf", folder: "licenses", size: "612 KB", updated: "Today", status: "review" },
  { name: "IEC Certificate.pdf", folder: "licenses", size: "298 KB", updated: "10 Apr", status: "verified" },
  { name: "AD Code Letter.pdf", folder: "licenses", size: "156 KB", updated: "Yesterday", status: "review" },
  { name: "Commercial Invoice VST-2041.pdf", folder: "invoices", size: "92 KB", updated: "08 Apr", status: "verified" },
  { name: "Packing List VST-2041.pdf", folder: "shipments", size: "144 KB", updated: "08 Apr", status: "verified" },
  { name: "BL Draft Rotterdam.pdf", folder: "shipments", size: "267 KB", updated: "07 Apr", status: "missing" },
  { name: "Phytosanitary Cert.jpg", folder: "shipments", size: "1.2 MB", updated: "06 Apr", status: "review" },
  { name: "Certificate of Origin.pdf", folder: "shipments", size: "201 KB", updated: "06 Apr", status: "verified" },
];

const STATUS = {
  verified: { label: "Verified", icon: CheckCircle2, cls: "bg-emerald-400/10 text-emerald-300" },
  review:   { label: "In review", icon: Clock3,      cls: "bg-amber-400/10 text-amber-300" },
  missing:  { label: "Missing",   icon: AlertCircle, cls: "bg-rose-400/10 text-rose-300" },
};

export default function VaultPage() {
  const [active, setActive] = useState("all");
  const [q, setQ] = useState("");

  const docs = useMemo(
    () => DOCS.filter((d) => (active === "all" || d.folder === active) && d.name.toLowerCase().includes(q.toLowerCase())),
    [active, q]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Storage · encrypted</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Document Vault</h1>
          <p className="mt-1 text-sm text-white/55">Single source of truth for KYC, licenses and shipment paperwork.</p>
        </div>
        <button className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black">
          <Upload size={15} /> Upload documents
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Folders */}
        <aside className="glass-card h-fit p-4">
          <div className="px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white/40">Folders</div>
          <ul className="mt-2 space-y-1">
            {FOLDERS.map((f) => {
              const on = active === f.id;
              return (
                <li key={f.id}>
                  <button
                    onClick={() => setActive(f.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${on ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                  >
                    <span className="flex items-center gap-2">
                      <Folder size={14} className={on ? "text-[var(--gold)]" : ""} /> {f.label}
                    </span>
                    <span className="rounded-md bg-white/5 px-1.5 text-[11px] text-white/50">{f.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 rounded-xl bg-white/[0.03] p-4 text-xs text-white/55">
            <div className="flex items-center gap-2 text-white"><ShieldCheck size={14} className="text-emerald-300" /> Vault security</div>
            <p className="mt-2 leading-relaxed">256-bit AES at rest. Versioned, audit-logged, and access-controlled per workspace member.</p>
          </div>
        </aside>

        {/* Document table */}
        <div className="glass-card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/5 p-4">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/60">
              <Search size={14} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search documents…"
                className="flex-1 bg-transparent outline-none placeholder:text-white/30"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-xs">
              <Filter size={13} /> Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left font-normal">Name</th>
                  <th className="px-4 py-3 text-left font-normal">Folder</th>
                  <th className="px-4 py-3 text-left font-normal">Status</th>
                  <th className="px-4 py-3 text-left font-normal">Size</th>
                  <th className="px-4 py-3 text-left font-normal">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {docs.map((d, i) => {
                  const S = STATUS[d.status];
                  const isImg = d.name.endsWith(".jpg") || d.name.endsWith(".png");
                  return (
                    <motion.tr
                      key={d.name}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/70">
                            {isImg ? <ImageIcon size={15} /> : <FileText size={15} />}
                          </span>
                          <span className="font-medium">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-white/60">{d.folder}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ${S.cls}`}>
                          <S.icon size={12} /> {S.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/55">{d.size}</td>
                      <td className="px-4 py-3 text-white/55">{d.updated}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button className="rounded-md p-1.5 text-white/50 hover:bg-white/5 hover:text-white"><Download size={14} /></button>
                          <button className="rounded-md p-1.5 text-white/50 hover:bg-white/5 hover:text-white"><MoreHorizontal size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {docs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-white/45">No documents match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}