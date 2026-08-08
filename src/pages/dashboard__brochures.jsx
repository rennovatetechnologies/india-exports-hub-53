import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Save, Plus, Trash2, Pencil, ArrowLeft, FileText, Eye, Download, X,
} from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  loadBrochuresCatalog,
  fetchBrochuresCatalog,
  saveBrochuresCatalog,
  subscribeBrochures,
  putBrochureBlob,
  deleteBrochureBlob,
  validateBrochureFile,
  formatBrochureSize,
  newBrochureId,
  openBrochureItem,
  getPdfBrochures,
  getGalleryBrochures,
  resolveBrochureUrl,
} from "@/lib/brochuresCatalog";

const emptyPdfDraft = () => ({
  id: newBrochureId("pdf"),
  name: "New brochure PDF",
  kind: "pdf",
  path: "",
  hasBlob: false,
  showInNav: true,
  sortOrder: 50,
  fileName: "",
  fileType: "",
  fileSize: 0,
  _file: null,
  _preview: null,
});

function AdminBrochuresEditor() {
  const [catalog, setCatalog] = useState(() => loadBrochuresCatalog());
  const [savedAt, setSavedAt] = useState(null);
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchBrochuresCatalog().then(setCatalog).catch(() => {});
    return subscribeBrochures(setCatalog);
  }, []);

  useEffect(() => {
    return () => {
      if (draft?._preview) URL.revokeObjectURL(draft._preview);
    };
  }, [draft?._preview]);

  const pdfs = useMemo(() => getPdfBrochures(catalog), [catalog]);

  const openEditExisting = useCallback((id) => {
    const row = catalog.find((b) => b.id === id);
    if (!row || row.kind !== "pdf") return;
    setError("");
    setDraft({ ...row, _file: null, _preview: null });
    setEditKey(id);
  }, [catalog]);

  const openNew = useCallback(() => {
    setError("");
    setDraft(emptyPdfDraft());
    setEditKey("new");
  }, []);

  const leaveEdit = useCallback(() => {
    setEditKey(null);
    setDraft((d) => {
      if (d?._preview) URL.revokeObjectURL(d._preview);
      return null;
    });
    setError("");
    setCatalog(loadBrochuresCatalog());
  }, []);

  const updateDraft = useCallback((patch) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }, []);

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !draft) return;
    const isPdf =
      String(file.type || "").toLowerCase() === "application/pdf" ||
      /\.pdf$/i.test(file.name || "");
    if (!isPdf) {
      setError("Use a PDF file");
      return;
    }
    const check = validateBrochureFile(file, "pdf");
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError("");
    if (draft._preview) URL.revokeObjectURL(draft._preview);
    updateDraft({
      _file: file,
      _preview: null,
      fileName: file.name,
      fileType: file.type || "application/pdf",
      fileSize: file.size,
      hasBlob: true,
      path: "",
    });
  };

  const saveDraft = async () => {
    if (!draft || draft.kind !== "pdf") return;
    const name = String(draft.name || "").trim();
    if (!name) {
      setError("Name is required");
      return;
    }
    if (!draft.hasBlob && !draft.path && !draft._file) {
      setError("Upload a file or keep an existing site path");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const id = editKey === "new" ? draft.id : editKey;
      let hasBlob = Boolean(draft.hasBlob);
      let path = draft.path || undefined;
      let fileName = draft.fileName;
      let fileType = draft.fileType;
      let fileSize = draft.fileSize;

      if (draft._file) {
        await putBrochureBlob(id, draft._file);
        hasBlob = true;
        path = undefined;
        fileName = draft._file.name;
        fileType = draft._file.type || fileType;
        fileSize = draft._file.size;
      }

      const payload = {
        id,
        name,
        kind: "pdf",
        path,
        hasBlob,
        fileName,
        fileType,
        fileSize,
        showInNav: draft.showInNav !== false,
        sortOrder: Number(draft.sortOrder) || 0,
        createdAt: draft.createdAt || new Date().toISOString(),
      };

      let next;
      if (editKey === "new") {
        next = [...catalog, payload];
      } else {
        next = catalog.map((b) => (b.id === editKey ? payload : b));
      }
      saveBrochuresCatalog(next);
      setCatalog(loadBrochuresCatalog());
      setSavedAt(new Date());
      leaveEdit();
    } catch (err) {
      setError(err?.message || "Could not save brochure");
    } finally {
      setBusy(false);
    }
  };

  const removeById = async (id) => {
    if (!id || id === "new") return;
    const row = catalog.find((b) => b.id === id);
    if (!row || row.kind !== "pdf") return;
    const label = row.name || "this brochure";
    if (!window.confirm(`Remove “${label}” from the site? This cannot be undone.`)) return;

    setBusy(true);
    setError("");
    try {
      if (row.hasBlob) await deleteBrochureBlob(id);
      const next = catalog.filter((b) => b.id !== id);
      saveBrochuresCatalog(next.length ? next : []);
      setCatalog(loadBrochuresCatalog());
      setSavedAt(new Date());
      if (editKey === id) leaveEdit();
    } catch (err) {
      setError(err?.message || "Could not remove brochure");
    } finally {
      setBusy(false);
    }
  };

  const previewOrOpen = async (row) => {
    await openBrochureItem(row);
  };

  const isEditing = editKey !== null && draft;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brochures</h1>
          <p className="mt-1 text-sm text-white/55">
            {isEditing
              ? "Upload a PDF — it appears in the nav downloads after you save."
              : "Add, edit, or remove PDF brochure downloads shown in the nav."}
          </p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={openNew}
            className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus size={16} /> Add PDF
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={leaveEdit} disabled={busy} className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <ArrowLeft size={16} /> Back
            </button>
            {editKey !== "new" && (
              <button
                type="button"
                onClick={() => removeById(editKey)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-400/10"
              >
                <Trash2 size={16} /> Remove
              </button>
            )}
            <button type="button" onClick={saveDraft} disabled={busy} className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <Save size={16} /> {busy ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </header>

      {savedAt && !isEditing && (
        <p className="text-xs text-emerald-300/90">
          Saved at {savedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.
        </p>
      )}

      {error && !isEditing && (
        <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {isEditing ? (
        <div className="glass-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <span className="font-mono text-[11px] text-white/50">{draft.id}</span>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
              PDF download
            </span>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs uppercase tracking-wider text-white/45 sm:col-span-2">
              Display name
              <input
                value={draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/45">
              Sort order
              <input
                type="number"
                value={draft.sortOrder}
                onChange={(e) => updateDraft({ sortOrder: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[var(--gold)]/40"
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={draft.showInNav !== false}
                onChange={(e) => updateDraft({ showInNav: e.target.checked })}
                className="rounded border-white/20"
              />
              Show in top nav Brochures menu
            </label>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-white/45">File</div>
            <p className="mt-1 text-[11px] text-white/40">
              PDF (up to 20MB). Uploads replace any static path.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="btn-ghost inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={onPickFile}
                />
                Upload file
              </label>
              {(draft.fileName || draft.path) && (
                <span className="text-sm text-white/55">
                  {draft.fileName || draft.path}
                  {draft.fileSize ? ` · ${formatBrochureSize(draft.fileSize)}` : ""}
                  {draft.hasBlob || draft._file ? " · uploaded" : " · site file"}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
            <FileText size={14} /> PDF downloads ({pdfs.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {pdfs.map((row) => (
              <article key={row.id} className="glass-card flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="font-medium text-white truncate">{row.name}</h3>
                  <p className="mt-1 text-xs text-white/45 truncate">
                    {row.hasBlob ? row.fileName || "Uploaded file" : row.path}
                    {row.showInNav ? " · in nav" : " · hidden from nav"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => previewOrOpen(row)} disabled={busy} className="rounded-lg p-2 text-white/55 hover:bg-white/5 hover:text-white" title="Open">
                    <Eye size={16} />
                  </button>
                  <button type="button" onClick={() => openEditExisting(row.id)} disabled={busy} className="rounded-lg p-2 text-white/55 hover:bg-white/5 hover:text-white" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeById(row.id)}
                    disabled={busy}
                    className="rounded-lg p-2 text-rose-300/80 hover:bg-rose-400/10 hover:text-rose-200"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
            {pdfs.length === 0 && (
              <p className="text-sm text-white/45">No PDF brochures yet. Add one to show downloads in the nav.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function BrochuresDashPage() {
  const session = getSession();
  if (session?.role === ROLES.ADMIN || session?.role === ROLES.OPERATIONS) {
    return <AdminBrochuresEditor />;
  }
  return <CustomerBrochures />;
}

function CustomerBrochures() {
  const [catalog, setCatalog] = useState(() => loadBrochuresCatalog());
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchBrochuresCatalog().then(setCatalog).catch(() => {});
    return subscribeBrochures(setCatalog);
  }, []);

  const pdfs = useMemo(() => getPdfBrochures(catalog), [catalog]);

  useEffect(() => {
    let cancelled = false;
    /** @type {string[]} */
    const objectUrls = [];

    async function load() {
      const rows = getGalleryBrochures(catalog);
      const resolved = await Promise.all(
        rows.map(async (row) => {
          const src = await resolveBrochureUrl(row);
          if (!src) return null;
          if (row.hasBlob) objectUrls.push(src);
          return { id: row.id, name: row.name, src };
        })
      );
      if (!cancelled) setImages(resolved.filter(Boolean));
    }

    load();
    return () => {
      cancelled = true;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [catalog]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Brochures</h1>
        <p className="mt-1 text-sm text-white/55">
          Download product catalogues and browse visual brochures in your workspace.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/70">PDF catalogues</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {pdfs.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => openBrochureItem(row)}
              className="glass-card flex items-center justify-between gap-3 p-4 text-left transition hover:bg-white/[0.06]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)]/15 text-[var(--gold)]">
                  <FileText size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">{row.name}</span>
                  <span className="text-xs text-white/40">
                    {row.fileName || "PDF"}
                    {row.fileSize ? ` · ${formatBrochureSize(row.fileSize)}` : ""}
                  </span>
                </span>
              </span>
              <Download size={15} className="shrink-0 text-[var(--gold)]" />
            </button>
          ))}
          {pdfs.length === 0 && (
            <p className="text-sm text-white/45 sm:col-span-2">No PDF brochures available yet.</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/70">Visual brochures</h2>
        {images.length === 0 ? (
          <p className="text-sm text-white/45">No brochure images yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {images.map((img, i) => (
              <motion.button
                key={img.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                className="relative h-56 w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-left transition hover:border-[var(--gold)]/30"
                onClick={() => setSelectedImage(img.src)}
              >
                <img
                  src={img.src}
                  alt={img.name || `Brochure ${i + 1}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 transition hover:bg-white/40"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="relative h-[80vh] w-full max-w-4xl">
            <img
              src={selectedImage}
              alt="Fullscreen view"
              className="absolute inset-0 h-full w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
