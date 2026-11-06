import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

/**
 * Confirmation before ending a session. Used by every user-facing sign-out control.
 */
export default function SignOutConfirm({ open, onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(frame);
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sign-out-title"
        aria-describedby="sign-out-desc"
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/80">
          <LogOut size={18} />
        </div>
        <h2 id="sign-out-title" className="mt-4 text-base font-semibold text-white">
          Sign out?
        </h2>
        <p id="sign-out-desc" className="mt-1.5 text-sm leading-relaxed text-white/60">
          You will be signed out of this device. You can sign back in anytime.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
          >
            Stay signed in
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-white/90"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
