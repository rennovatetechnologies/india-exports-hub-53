import { useEffect, useRef, useState } from "react";
import { Download, Upload, AlertCircle, FileText, Loader2 } from "lucide-react";
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
  const [upError, setUpError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const fulfillInputRef = useRef(null);
  const [fulfillRequestId, setFulfillRequestId] = useState(null);

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("iehub-case-updated", h);
    return () => window.removeEventListener("iehub-case-updated", h);
  }, []);

  void tick;

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

  const uploadFile = async (file, { requestId, label } = {}) => {
    if (!session?.email || !file) return;
    setUpError("");
    setUploading(true);
    try {
      await addCustomerDocument(session.email, { file, requestId, label });
    } catch (e) {
      setUpError(e?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      setFulfillRequestId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-white/55">Files from ops and your uploads — stored in your case on the server.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "from_ops", label: "From ops" },
          { id: "from_you", label: "Your uploads" },
          { id: "requests", label: `Requests${requests.length ? ` (${requests.length})` : ""}` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              tab === t.id ? "bg-[var(--gold)]/20 text-[var(--gold)]" : "bg-white/5 text-white/55"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(dlError || upError) && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {dlError || upError}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) uploadFile(f);
        }}
      />
      <input
        ref={fulfillInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) uploadFile(f, { requestId: fulfillRequestId });
        }}
      />

      {tab === "from_ops" && (
        <ul className="space-y-3">
          {fromOps.map((d) => {
            const fileId = d.fileId || d.driveFileId;
            const busy = busyId === (d.id || fileId);
            return (
              <li key={d.id} className="glass-card flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={18} className="shrink-0 text-white/50" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.label || d.name}</div>
                    <div className="text-[11px] text-white/40">From operations</div>
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
          {!fromOps.length && <p className="text-sm text-white/45">No documents from ops yet.</p>}
        </ul>
      )}

      {tab === "from_you" && (
        <ul className="space-y-3">
          {fromYou.map((d) => {
            const fileId = d.fileId || d.driveFileId;
            const busy = busyId === (d.id || fileId);
            return (
              <li key={d.id} className="glass-card flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={18} className="shrink-0 text-white/50" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.label || d.name}</div>
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
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm text-white/60 hover:bg-white/5 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Uploading…" : "Upload a document"}
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
                    disabled={uploading}
                    className="btn-gold mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                    onClick={() => {
                      setFulfillRequestId(r.id);
                      fulfillInputRef.current?.click();
                    }}
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
