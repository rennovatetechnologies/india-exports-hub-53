import { useEffect, useMemo, useState } from "react";
import { Megaphone, Sparkles, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { getSession, ROLES } from "@/lib/authSession";
import {
  fetchCommunityAccess,
  fetchCommunityPosts,
  saveCommunityPost,
  deleteCommunityPost,
  isCommunityAccessActive,
} from "@/lib/communityAccess";
import { ensureCaseForSession } from "@/lib/customerCase";
import CommunityPaywall from "@/components/CommunityPaywall";
import { toUserMessage, USER_MESSAGES } from "@/lib/friendlyError";
import FallbackScreen, { InlineNotice } from "@/components/FallbackScreen";

const EMPTY_DRAFT = { kind: "update", title: "", body: "", published: true };

function PostCard({ post, isAdmin, onEdit, onDelete }) {
  return (
    <article className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            {post.kind === "upcoming" ? "Upcoming" : "Update"}
            {post.published === false ? " · draft" : ""}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{post.title}</h3>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEdit(post)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(post)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-rose-300"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/65">{post.body}</p>
      {post.publishedAt || post.createdAt ? (
        <p className="mt-4 text-[11px] text-white/35">
          {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      ) : null}
    </article>
  );
}

export default function UpdatesPage() {
  const session = getSession();
  const isAdmin = session?.role === ROLES.ADMIN;
  const isStaff = isAdmin || session?.role === ROLES.OPERATIONS;
  const [tab, setTab] = useState("update");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [access, setAccess] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const customerCase = ensureCaseForSession();
  const unlocked = isStaff || isCommunityAccessActive(customerCase, access);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const nextAccess = await fetchCommunityAccess({ force: true });
      setAccess(nextAccess);
      if (isStaff || isCommunityAccessActive(customerCase, nextAccess)) {
        const items = await fetchCommunityPosts({ force: true });
        setPosts(items);
      } else {
        setPosts([]);
      }
    } catch (e) {
      if (e.status === 402 || e.data?.code === "COMMUNITY_ACCESS_REQUIRED") {
        setPosts([]);
      } else {
        setError(toUserMessage(e, USER_MESSAGES.load));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email, session?.role]);

  const visible = useMemo(
    () => posts.filter((p) => p.kind === tab && (isStaff || p.published !== false)),
    [posts, tab, isStaff]
  );

  const onSave = async () => {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      await saveCommunityPost(
        {
          kind: draft.kind,
          title: draft.title,
          body: draft.body,
          published: draft.published !== false,
        },
        draft.id
      );
      setDraft(null);
      await load();
    } catch (e) {
      setError(toUserMessage(e, USER_MESSAGES.save));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (post) => {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    try {
      await deleteCommunityPost(post.id);
      await load();
    } catch (e) {
      setError(toUserMessage(e, USER_MESSAGES.save));
    }
  };

  if (!unlocked && !loading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Updates &amp; upcoming</h1>
          <p className="mt-1 text-sm text-white/55">
            Product notes and features on the roadmap — included with community access.
          </p>
        </header>
        <CommunityPaywall
          title="Join to follow updates"
          description="Community members see desk updates and upcoming features as they are published. Documentation plans are optional."
          settings={access?.settings}
        />
      </div>
    );
  }

  if (loading && !posts.length) {
    return <FallbackScreen compact title="Loading updates…" />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Updates &amp; upcoming</h1>
          <p className="mt-1 text-sm text-white/55">
            What shipped, and what the team is building next.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setDraft({ ...EMPTY_DRAFT, kind: tab })}
            className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus size={16} /> New {tab === "upcoming" ? "upcoming" : "update"}
          </button>
        )}
      </header>

      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

      {draft && isAdmin && (
        <div className="glass-card space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{draft.id ? "Edit post" : "New post"}</h2>
            <button type="button" onClick={() => setDraft(null)} className="text-white/45 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-white/45">
              Type
              <select
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
              >
                <option value="update">Update</option>
                <option value="upcoming">Upcoming feature</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm text-white/70">
              <input
                type="checkbox"
                checked={draft.published !== false}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />
              Published
            </label>
            <label className="block text-xs text-white/45 sm:col-span-2">
              Title
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45 sm:col-span-2">
              Body
              <textarea
                rows={6}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("update")}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
            tab === "update" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
          }`}
        >
          <Megaphone size={14} /> Updates
        </button>
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
            tab === "upcoming" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
          }`}
        >
          <Sparkles size={14} /> Upcoming
        </button>
      </div>

      <div className="grid gap-4">
        {visible.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            isAdmin={isAdmin}
            onEdit={(post) => setDraft({ ...post })}
            onDelete={onDelete}
          />
        ))}
        {!visible.length && (
          <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/45">
            {tab === "upcoming" ? "No upcoming features published yet." : "No updates yet."}
          </p>
        )}
      </div>
    </div>
  );
}
