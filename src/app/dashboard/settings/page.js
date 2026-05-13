"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Building2, Bell, Lock, Users, Trash2, Plus, Mail } from "lucide-react";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
];

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 focus:border-[var(--gold)]/60 focus:bg-white/[0.07] outline-none px-3.5 py-2.5 text-sm placeholder:text-white/30 transition";
const labelCls = "block text-xs uppercase tracking-[0.18em] text-white/45 mb-2";

function Toggle({ on, set }) {
  return (
    <button onClick={() => set(!on)} className={`relative h-5 w-9 rounded-full transition ${on ? "bg-[var(--gold)]" : "bg-white/15"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");
  const [notifs, setNotifs] = useState({ workflow: true, billing: true, marketing: false, weekly: true });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass-card h-fit p-3">
          <ul className="space-y-1">
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <li key={t.id}>
                  <button onClick={() => setTab(t.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${on ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                    <t.icon size={15} className={on ? "text-[var(--gold)]" : ""} /> {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8 space-y-6">
          {tab === "profile" && (
            <>
              <h2 className="text-lg font-semibold">Profile</h2>
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--grad-gold)] text-black text-xl font-bold">RA</span>
                <div>
                  <button className="rounded-lg glass px-3 py-1.5 text-xs">Upload photo</button>
                  <p className="mt-1 text-[11px] text-white/45">PNG or JPG · max 2MB</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Full name</label><input className={inputCls} defaultValue="Rohit Agarwal" /></div>
                <div><label className={labelCls}>Designation</label><input className={inputCls} defaultValue="Director" /></div>
                <div><label className={labelCls}>Email</label><input className={inputCls} defaultValue="rohit@aurora.in" /></div>
                <div><label className={labelCls}>Phone</label><input className={inputCls} defaultValue="+91 98220 12345" /></div>
              </div>
              <div className="flex justify-end"><button className="btn-gold rounded-xl px-5 py-2.5 text-sm font-semibold text-black">Save changes</button></div>
            </>
          )}

          {tab === "company" && (
            <>
              <h2 className="text-lg font-semibold">Company</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Legal entity</label><input className={inputCls} defaultValue="Aurora Exports Pvt Ltd" /></div>
                <div><label className={labelCls}>GSTIN</label><input className={inputCls} defaultValue="27AAACR1234F1Z5" /></div>
                <div><label className={labelCls}>IEC</label><input className={inputCls} defaultValue="0319045678" /></div>
                <div><label className={labelCls}>AD code</label><input className={inputCls} defaultValue="6390123-4500003" /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Registered address</label><textarea rows={3} className={inputCls} defaultValue="Plot 14, Industrial Area, Hingna, Nagpur 440016" /></div>
              </div>
              <div className="flex justify-end"><button className="btn-gold rounded-xl px-5 py-2.5 text-sm font-semibold text-black">Save</button></div>
            </>
          )}

          {tab === "team" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Team members</h2>
                <button className="btn-gold inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-black"><Plus size={13} /> Invite member</button>
              </div>
              <ul className="divide-y divide-white/5">
                {[
                  { n: "Rohit Agarwal", e: "rohit@aurora.in", r: "Owner" },
                  { n: "Neha Sharma", e: "neha@aurora.in", r: "Admin" },
                  { n: "Vikram Patil", e: "vikram@aurora.in", r: "Operations" },
                  { n: "Anita Rao", e: "anita@aurora.in", r: "Finance" },
                ].map((m) => (
                  <li key={m.e} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold">{m.n.split(" ").map((x) => x[0]).join("")}</span>
                      <div>
                        <div className="text-sm">{m.n}</div>
                        <div className="text-xs text-white/45">{m.e}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/70">{m.r}</span>
                      <button className="text-white/40 hover:text-rose-300"><Trash2 size={14} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === "notifications" && (
            <>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <ul className="divide-y divide-white/5">
                {[
                  ["workflow", "Workflow updates", "Stage changes, document approvals, ops messages"],
                  ["billing", "Billing & invoices", "Payments, renewals, GST invoices"],
                  ["weekly", "Weekly digest", "Every Monday at 9 AM IST"],
                  ["marketing", "Product updates", "New features, events, masterclasses"],
                ].map(([k, t, d]) => (
                  <li key={k} className="flex items-center justify-between py-4">
                    <div>
                      <div className="text-sm">{t}</div>
                      <div className="text-xs text-white/45">{d}</div>
                    </div>
                    <Toggle on={notifs[k]} set={(v) => setNotifs((n) => ({ ...n, [k]: v }))} />
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === "security" && (
            <>
              <h2 className="text-lg font-semibold">Security</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Current password</label><input type="password" className={inputCls} placeholder="••••••••" /></div>
                <div />
                <div><label className={labelCls}>New password</label><input type="password" className={inputCls} /></div>
                <div><label className={labelCls}>Confirm new password</label><input type="password" className={inputCls} /></div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">Two-factor authentication</div>
                    <div className="text-xs text-white/45">Authenticator app (TOTP)</div>
                  </div>
                  <button className="rounded-lg glass px-3 py-1.5 text-xs">Enable</button>
                </div>
              </div>
              <div className="flex justify-end"><button className="btn-gold rounded-xl px-5 py-2.5 text-sm font-semibold text-black">Update password</button></div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}