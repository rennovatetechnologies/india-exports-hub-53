import { useEffect, useState } from "react";
import { Download, Upload, AlertCircle, FileText } from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  ensureCaseForSession,
  addCustomerDocument,
  downloadCaseFile,
} from "@/lib/customerCase";

export default function DocumentsPage() {
  const session = getSession();
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState("from_ops");
  const [busyId, setBusyId] = useState(null);
  const [dlError, setDlError] = useState("");

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("iehub-case-updated", h);
    return () => window.removeEventListener("iehub-case-updated", h);
  }, []);

  if (session?.role !== ROLES.CUSTOMER) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-white/55">Open a case from Operations to review and upload customer documents.</p>
      </div>
    );
  }

  const c = ensureCaseForSession();
  const fromOps = (c?.documents || []).filter((d) => d.from === "ops");
  const fromYou = (c?.documents || []).filter((d) => d.from === "customer");
  const requests = (c?.docRequests || []).filter((r) => r.status === "open");

  const downloadDoc = async (d) => {
    const fileId = d?.fileId || d?.driveFileId;
    if (!fileId) {
      setDlError("This file is not available for download yet.");
      return;
    }
    setDlError("");
    setBusyId(d.id || fileId);
    try {
      await downloadCaseFile(fileId, d.name || d.label || "document");
    } catch (e) {
      setDlError(e?.message || "Could not download file.");
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { id: "from_ops", label: "From Vistara", count: fromOps.length },
    { id: "from_you", label: "Your uploads", count: fromYou.length },
    { id: "requests", label: "Needed from you", count: requests.length },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-white/55">
          Download what ops prepares. Upload if something is missing or requested.
        </p>
      </header>

      {dlError && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {dlError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              tab === t.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-2 rounded-md bg-[var(--gold)]/20 px-1.5 text-[10px] text-[var(--gold)]">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "from_ops" && (
        <ul className="space-y-2">
          {fromOps.map((d) => {
            const fileId = d.fileId || d.driveFileId;
            const busy = busyId === (d.id || fileId);
            return (
              <li key={d.id} className="glass-card flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="shrink-0 text-cyan-300" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.label || d.name}</div>
                    <div className="text-[11px] text-white/40">
                      {d.label && d.name && d.label !== d.name ? `${d.name} · ` : ""}
                      {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString("en-IN") : ""} · ready
                    </div>
                    {d.note && <p className="mt-1 text-xs text-white/55">{d.note}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!fileId || busy}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg glass px-3 py-1.5 text-xs hover:bg-white/10 disabled:opacity-50"
                  onClick={() => downloadDoc(d)}
                >
                  <Download size={14} /> {busy ? "Downloading…" : "Download"}
                </button>
              </li>
            );
          })}
          {!fromOps.length && <p className="text-sm text-white/45">No documents from ops yet.</p>}
        </ul>
      )}

      {tab === "from_you" && (
        <ul className="space-y-2">
          {fromYou.map((d) => {
            const fileId = d.fileId || d.driveFileId;
            const busy = busyId === (d.id || fileId);
            return (
              <li key={d.id} className="glass-card flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="shrink-0 text-white/50" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.name}</div>
                    <div className="text-[11px] text-white/40">Uploaded by you</div>
                  </div>
                </div>
                {fileId && (
                  <button
                    type="button"
                    disabled={busy}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg glass px-3 py-1.5 text-xs hover:bg-white/10 disabled:opacity-50"
                    onClick={() => downloadDoc(d)}
                  >
                    <Download size={14} /> {busy ? "Downloading…" : "Download"}
                  </button>
                )}
              </li>
            );
          })}
          <button
            type="button"
            onClick={() =>
              session?.email &&
              addCustomerDocument(session.email, { name: `customer-upload-${Date.now()}.pdf` })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm text-white/60 hover:bg-white/5"
          >
            <Upload size={16} /> Upload a document
          </button>
        </ul>
      )}

      {tab === "requests" && (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 text-amber-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.label}</div>
                  {r.reason && <p className="mt-1 text-xs text-white/45">{r.reason}</p>}
                  <button
                    type="button"
                    className="btn-gold mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-black"
                    onClick={() =>
                      addCustomerDocument(session.email, {
                        name: `${r.label.replace(/\s+/g, "-").toLowerCase()}.pdf`,
                        requestId: r.id,
                      })
                    }
                  >
                    <Upload size={14} /> Upload &amp; mark done
                  </button>
                </div>
              </div>
            </li>
          ))}
          {!requests.length && (
            <p className="text-sm text-white/45">No open requests — 99% of the time your KYC pack is enough.</p>
          )}
        </ul>
      )}
    </div>
  );
}
