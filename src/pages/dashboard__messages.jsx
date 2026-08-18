import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  listAllCases,
  getCustomerCase,
} from "@/lib/customerCase";
import { fetchMessagesForCase, getMessagesForCase, sendMessage } from "@/lib/caseMessages";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";
import FallbackScreen, { InlineNotice } from "@/components/FallbackScreen";

export default function MessagesPage() {
  const session = getSession();
  const [tick, setTick] = useState(0);
  const [body, setBody] = useState("");
  const [activeEmail, setActiveEmail] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [queueReady, setQueueReady] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("iehub-messages-updated", h);
    window.addEventListener("iehub-case-updated", h);
    return () => {
      window.removeEventListener("iehub-messages-updated", h);
      window.removeEventListener("iehub-case-updated", h);
    };
  }, []);

  useEffect(() => {
    // Use bootstrap/cache; staff can hit header Refresh for a force reload.
    setQueueReady(true);
  }, [session?.role, session?.email]);

  const isCustomer = session?.role === ROLES.CUSTOMER;
  const staffCases = session?.role === ROLES.ADMIN || session?.role === ROLES.OPERATIONS ? listAllCases() : [];

  useEffect(() => {
    if (isCustomer && session?.email) setActiveEmail(session.email);
    else if (!activeEmail && staffCases[0]) setActiveEmail(staffCases[0].customerEmail);
  }, [isCustomer, session?.email, staffCases, activeEmail, queueReady]);

  const customerEmail = isCustomer ? session?.email : activeEmail;
  const caseInfo = customerEmail ? getCustomerCase(customerEmail) : null;
  void tick;
  const msgs = customerEmail ? getMessagesForCase(caseInfo || customerEmail) : [];

  useEffect(() => {
    if (!customerEmail || !queueReady) return;
    let cancelled = false;
    setLoadingThread(true);
    setError("");
    fetchMessagesForCase(caseInfo || customerEmail, { force: true })
      .catch((e) => {
        if (!cancelled) setError(toUserMessage(e, USER_MESSAGES.load));
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });
    return () => {
      cancelled = true;
    };
    // caseInfo.id changes when queue loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerEmail, caseInfo?.id, queueReady, retryKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, customerEmail]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!customerEmail || !body.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await sendMessage({
        customerEmail,
        caseId: caseInfo?.id,
        fromRole: isCustomer ? "customer" : session?.role === ROLES.ADMIN ? "admin" : "operations",
        fromName: session?.name,
        fromEmail: session?.email,
        body,
      });
      setBody("");
    } catch (err) {
      setError(toUserMessage(err, USER_MESSAGES.send));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100svh-8rem)] flex-col gap-4 lg:flex-row">
      {!isCustomer && (
        <aside className="glass-card w-full shrink-0 overflow-y-auto p-3 lg:w-64">
          <div className="mb-2 px-2 text-[10px] uppercase tracking-wider text-white/40">Cases</div>
          {!queueReady && (
            <p className="flex items-center gap-2 px-2 text-xs text-white/40">
              <Loader2 size={12} className="animate-spin" /> Loading…
            </p>
          )}
          {staffCases.map((c) => (
            <button
              key={c.id || c.customerEmail}
              type="button"
              onClick={() => setActiveEmail(c.customerEmail)}
              className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm ${
                activeEmail === c.customerEmail ? "bg-white/10" : "hover:bg-white/5 text-white/60"
              }`}
            >
              <div className="truncate font-medium text-white">{c.customerEmail}</div>
              <div className="truncate text-[11px] text-white/40">{c.opsName || "Unassigned"}</div>
            </button>
          ))}
          {queueReady && !staffCases.length && <p className="px-2 text-xs text-white/40">No cases</p>}
        </aside>
      )}

      <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-white/10 px-5 py-4">
          <h1 className="text-lg font-semibold">
            {isCustomer
              ? `Chat with ${caseInfo?.opsName || "operations"}`
              : customerEmail || "Messages"}
          </h1>
          <p className="text-xs text-white/45">
            {isCustomer
              ? "Your assigned operations owner — admin can also join when needed."
              : "Case thread with the customer"}
          </p>
          {error && <InlineNotice className="mt-2">{error}</InlineNotice>}
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loadingThread && !msgs.length && (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-white/40">
              <Loader2 size={16} className="animate-spin" /> Loading thread…
            </p>
          )}
          {msgs.map((m) => {
            const mine =
              (isCustomer && m.fromRole === "customer") ||
              (!isCustomer && m.fromRole !== "customer");
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "bg-[var(--gold)]/20 text-white" : "bg-white/5 text-white/85"
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                    {m.fromName} ·{" "}
                    {new Date(m.createdAt).toLocaleString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {m.body}
                </div>
              </div>
            );
          })}
          {!loadingThread && !msgs.length && error && (
            <FallbackScreen
              kind="unavailable"
              compact
              className="m-4 border-0 bg-transparent"
              message="We couldn't load this conversation. Try again in a moment."
              onRetry={() => setRetryKey((n) => n + 1)}
            />
          )}
          {!loadingThread && !msgs.length && !error && (
            <p className="py-8 text-center text-sm text-white/40">
              No messages yet. Say hello to start the thread.
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={onSend} className="flex gap-2 border-t border-white/10 p-4">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message…"
            disabled={sending || !customerEmail}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !body.trim() || !customerEmail}
            className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send
          </button>
        </form>
      </div>
    </div>
  );
}
