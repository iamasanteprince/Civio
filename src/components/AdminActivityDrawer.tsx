import { Clock3, RefreshCw, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import type { DiscussionStore } from '@/types';
import type { AdminAnalytics } from '@/lib/adminAnalytics';

interface AdminActivityDrawerProps {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  analytics: AdminAnalytics | null;
  loading: boolean;
  error: string | null;
  discussions: DiscussionStore;
  onRemoveComment: (threadId: string, commentId: string) => void;
}

function threadLabel(threadId: string): string {
  const [kind, ...rest] = threadId.split(':');
  const name = rest.join(':') || threadId;
  if (kind === 'visa') return `Visa Intel · ${name}`;
  if (kind === 'university') return `University · ${name}`;
  if (kind === 'opportunity') return `Opportunity · ${name}`;
  return name;
}

export default function AdminActivityDrawer({
  open,
  onClose,
  onRefresh,
  analytics,
  loading,
  error,
  discussions,
  onRemoveComment,
}: AdminActivityDrawerProps) {
  if (!open) return null;

  const recentComments = Object.entries(discussions)
    .flatMap(([threadId, comments]) => comments.map((comment) => ({ threadId, comment })))
    .sort((a, b) => new Date(b.comment.timestamp).getTime() - new Date(a.comment.timestamp).getTime())
    .slice(0, 30);

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-black/65 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-700 bg-[#faf9f6] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#faf9f6]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-2">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 id="admin-drawer-title" className="font-serif font-bold text-stone-900">Admin Activity</h2>
              <p className="text-xs text-slate-500">Restricted account analytics and moderation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button type="button" onClick={onClose} aria-label="Close admin activity" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-stone-900">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5">
          <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-indigo-300" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total registered students</p>
                <p className="mt-1 text-3xl font-bold text-stone-900">
                  {loading ? '…' : analytics ? analytics.totalMembers.toLocaleString() : '—'}
                </p>
              </div>
            </div>
            {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
            {!analytics && !loading && !error && <p className="mt-3 text-xs text-slate-500">No analytics data is available.</p>}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-stone-900">Recent sign-ups</h3>
                <p className="mt-1 text-xs text-slate-500">Latest 25 accounts · retrieved through an admin-only Supabase function</p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
                {analytics?.recentSignups.length ?? 0}
              </span>
            </div>
            <div className="space-y-2">
              {analytics?.recentSignups.map((signup) => (
                <article key={`${signup.email}:${signup.createdAt}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-medium text-slate-200">{signup.displayName || signup.email}</p>
                      {signup.displayName && <p className="break-all text-xs text-slate-500">{signup.email}</p>}
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                      signup.ageConsentGiven
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                    }`}>
                      {signup.ageConsentGiven ? 'Age consent recorded' : 'Consent not recorded'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> Signed up {new Date(signup.createdAt).toLocaleString()}</span>
                    {signup.ageConsentTimestamp && <span>Consent: {new Date(signup.ageConsentTimestamp).toLocaleString()}</span>}
                  </div>
                </article>
              ))}
              {!loading && !error && analytics?.recentSignups.length === 0 && (
                <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">No sign-ups were returned.</p>
              )}
            </div>
          </section>

          <section>
            <div className="mb-3">
              <h3 className="font-semibold text-stone-900">Community moderation</h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
                These discussions are stored only in this browser. Removing a post here does not remove a copy from another visitor’s device.
              </p>
            </div>
            <div className="space-y-2">
              {recentComments.map(({ threadId, comment }) => (
                <article key={`${threadId}:${comment.id}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-indigo-200">{comment.author}{comment.verified ? ' · Verified account' : ' · Guest'}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{threadLabel(threadId)} · {new Date(comment.timestamp).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveComment(threadId, comment.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">{comment.content}</p>
                </article>
              ))}
              {recentComments.length === 0 && (
                <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">No local discussion posts to review.</p>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
