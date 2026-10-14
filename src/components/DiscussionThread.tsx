import { useEffect, useState } from 'react';
import { Check, Heart, MessageSquare, Pencil, Send, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import type { CivioUser, DiscussionComment } from '@/types';
import { getGuestSessionId, getPostCooldownRemaining, recordPostSubmission, sanitizePlainText } from '@/utils/inputSecurity';

interface DiscussionThreadProps {
  threadId: string;
  title: string;
  comments: DiscussionComment[];
  currentUser: CivioUser | null;
  onAddComment: (threadId: string, content: string, verified?: boolean) => void;
  onLikeComment: (threadId: string, commentId: string) => void;
  onEditComment: (threadId: string, commentId: string, content: string) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onRequestSignIn: () => void;
}

export default function DiscussionThread({
  threadId,
  title,
  comments,
  currentUser,
  onAddComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onRequestSignIn,
}: DiscussionThreadProps) {
  const [content, setContent] = useState('');
  const [postingAs, setPostingAs] = useState<'guest' | 'account'>('guest');
  const [cooldownMs, setCooldownMs] = useState(() => getPostCooldownRemaining());
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [guestSessionId] = useState(() => {
    try {
      return getGuestSessionId();
    } catch {
      return '';
    }
  });
  const isAdmin = currentUser?.email.trim().toLowerCase() === 'iamasanteprince@gmail.com';

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const timer = window.setInterval(() => setCooldownMs(getPostCooldownRemaining()), 250);
    return () => window.clearInterval(timer);
  }, [cooldownMs]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = sanitizePlainText(content);
    if (!trimmed) return;
    if (postingAs === 'account' && !currentUser) {
      onRequestSignIn();
      return;
    }
    if (postingAs === 'account' && currentUser && !currentUser.isVerified) {
      setStatus('Verify your account email before posting with the Verified Badge, or choose Post as Guest.');
      return;
    }
    const remaining = getPostCooldownRemaining();
    if (remaining > 0) {
      setCooldownMs(remaining);
      setStatus(`Please wait ${Math.ceil(remaining / 1000)} seconds before posting again.`);
      return;
    }
    recordPostSubmission();
    setCooldownMs(5000);
    onAddComment(threadId, trimmed, postingAs === 'account' && Boolean(currentUser?.isVerified));
    setContent('');
    setStatus('');
  };

  return (
    <section className="border-t border-slate-800 p-4" aria-label={`${title} discussion`}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <MessageSquare className="h-4 w-4 text-indigo-400" />
        Discussion <span className="text-xs font-normal text-slate-500">({comments.length})</span>
      </h3>

      <div className="mb-3 max-h-56 space-y-2 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="rounded-lg bg-slate-900/60 px-3 py-3 text-xs text-slate-500">
            No messages yet. Ask a question or share a recent experience.
          </p>
        ) : comments.map((comment) => (
          <article key={comment.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-indigo-200">{comment.author}</span>
                {comment.verified && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <time className="shrink-0 text-[10px] text-slate-500" dateTime={comment.timestamp}>
                {new Date(comment.timestamp).toLocaleString()}
              </time>
            </div>
            {editingId === comment.id ? (
              <div>
                <textarea
                  aria-label="Edit discussion comment"
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={!sanitizePlainText(editContent)}
                    onClick={() => {
                      const sanitized = sanitizePlainText(editContent).slice(0, 2000);
                      if (!sanitized) return;
                      onEditComment(threadId, comment.id, sanitized);
                      setEditingId(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
                {comment.content}
                {comment.editedAt && <span className="ml-2 text-[10px] italic text-slate-500">(edited {new Date(comment.editedAt).toLocaleString()})</span>}
              </p>
            )}
            {(isAdmin ||
              (currentUser && comment.userId === currentUser.id) ||
              (comment.guestSessionId && comment.guestSessionId === guestSessionId)) && editingId !== comment.id && (
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                  aria-label="Edit your comment"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this comment?')) onDeleteComment(threadId, comment.id);
                  }}
                  aria-label="Delete your comment"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => onLikeComment(threadId, comment.id)}
              aria-label={`Like comment by ${comment.author}; ${comment.likes} likes`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Heart className="h-3.5 w-3.5" />
              {comment.likes}
            </button>
          </article>
        ))}
      </div>

      <fieldset className="mb-3 flex flex-wrap gap-2">
        <legend className="sr-only">Choose how to post</legend>
        <button
          type="button"
          aria-pressed={postingAs === 'guest'}
          onClick={() => setPostingAs('guest')}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            postingAs === 'guest'
              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200'
              : 'border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserRound className="h-3.5 w-3.5" />
          Post as Guest
        </button>
        <button
          type="button"
          aria-pressed={postingAs === 'account'}
          onClick={() => {
            setPostingAs('account');
            if (!currentUser) onRequestSignIn();
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            postingAs === 'account'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Sign in to Post with Verified Badge
        </button>
      </fieldset>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <label className="sr-only" htmlFor={`comment-${threadId}`}>Write a message in {title}</label>
        <textarea
          id={`comment-${threadId}`}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={2}
          maxLength={2000}
          placeholder={`Post as ${postingAs === 'guest' ? 'Guest' : currentUser?.displayName ?? 'Signed-in account'}: ask or share an experience...`}
          className="min-h-10 flex-1 resize-y rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/50"
        />
        <button
          type="submit"
          disabled={!content.trim() || cooldownMs > 0 || (postingAs === 'account' && !currentUser)}
          aria-label="Post discussion message"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-3 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {status && <p role="status" className="mt-2 text-xs text-amber-300">{status}</p>}
      {cooldownMs > 0 && (
        <p className="mt-2 text-xs text-slate-500" aria-live="polite">
          Posting cooldown: {Math.ceil(cooldownMs / 1000)}s
        </p>
      )}
      <p className="mt-2 text-[10px] text-slate-600">
        Posting as {postingAs === 'guest' ? 'Guest' : currentUser ? currentUser.displayName : 'Signed-in account'} · stored in this browser, not shared
      </p>
    </section>
  );
}
