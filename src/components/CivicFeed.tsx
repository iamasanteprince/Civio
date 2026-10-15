import { useState } from 'react';
import {
  Users,
  MessageSquare,
  ArrowRight,
  Plus,
  Send,
  X,
  ExternalLink,
} from 'lucide-react';
import type { Initiative, InitiativeCategory, Comment, CivioUser } from '@/types';
import { sanitizePlainText } from '@/utils/inputSecurity';

const CATEGORY_FILTERS: (InitiativeCategory | 'All')[] = [
  'All',
  'Education',
  'Business',
  'Public Policy',
  'Environment',
  'Community',
  'Tech & Coding',
];

const CATEGORY_PILL_STYLES: Record<InitiativeCategory, string> = {
  Education: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Business: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Public Policy': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  Environment: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Community: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Tech & Coding': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

function CommentDrawer({
  initiative,
  onAddComment,
  onClose,
  currentUser,
}: {
  initiative: Initiative;
  onAddComment: (initId: string, content: string) => void;
  onClose: () => void;
  currentUser: CivioUser | null;
}) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedText = sanitizePlainText(text);
    if (!sanitizedText) return;
    onAddComment(initiative.id, sanitizedText.slice(0, 2000));
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-t-xl sm:rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[85vh] flex flex-col animate-modalIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Discussion ({initiative.comments.length})
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {initiative.comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No comments yet. Start the discussion!</p>
          ) : (
            initiative.comments.map((c: Comment) => (
              <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-indigo-300">{c.author}</span>
                  <span className="text-[10px] text-slate-500">{c.timestamp}</span>
                </div>
                <p className="text-sm text-slate-300">{c.content}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={currentUser ? 'Add your comment...' : 'Commenting as Anonymous...'}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/50"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function InitiativeCard({
  initiative,
  onVolunteer,
  onOpenComments,
}: {
  initiative: Initiative;
  onVolunteer: (id: string) => void;
  onOpenComments: (id: string) => void;
}) {
  const [volunteered, setVolunteered] = useState(false);
  const volunteerFull = initiative.volunteersJoined >= initiative.volunteersNeeded;

  const handleVolunteer = () => {
    if (volunteered || volunteerFull) return;
    setVolunteered(true);
    onVolunteer(initiative.id);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden transition-colors duration-150 hover:border-slate-700">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_PILL_STYLES[initiative.category]}`}>
              {initiative.category}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              initiative.verificationStatus === 'verified'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}>
              {initiative.verificationStatus === 'verified' ? 'Verified Organizer' : 'Verification pending'}
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-white leading-snug mb-2">{initiative.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{initiative.description}</p>

        <div className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs">
          <p className="text-slate-400">
            Organizer: <span className="font-medium text-slate-200">{initiative.organizer}</span>
          </p>
          <p className="text-slate-400">
            Goal: <span className="text-slate-300">{initiative.goal}</span>
          </p>
          <a
            href={initiative.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-indigo-400 hover:text-indigo-300"
          >
            Organizer evidence <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {initiative.link && (
          <a
            href={initiative.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mb-3"
          >
            Visit initiative page <ExternalLink className="w-3 h-3" />
          </a>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-slate-800 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="w-4 h-4" />
            <span className="tabular-nums">{initiative.volunteersJoined}/{initiative.volunteersNeeded}</span>
            <button
              onClick={handleVolunteer}
              disabled={volunteerFull || volunteered}
              className={`ml-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-all ${
                volunteerFull
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : volunteered
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {volunteerFull ? 'Full' : volunteered ? 'Joined' : 'Volunteer'}
            </button>
          </div>

          <button
            onClick={() => onOpenComments(initiative.id)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="tabular-nums">{initiative.comments.length}</span>
            <span className="hidden sm:inline">Comments</span>
          </button>

          {initiative.link && (
            <a
              href={initiative.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Join <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CivicFeed({
  currentUser,
  initiatives,
  onVolunteer,
  onAddComment,
  onOpenCreatePost,
}: {
  currentUser: CivioUser | null;
  initiatives: Initiative[];
  onVolunteer: (id: string) => void;
  onAddComment: (initId: string, content: string) => void;
  onOpenCreatePost: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState<InitiativeCategory | 'All'>('All');
  const [commentInitId, setCommentInitId] = useState<string | null>(null);
  const filtered = activeFilter === 'All'
    ? initiatives
    : initiatives.filter((initiative) => initiative.category === activeFilter);

  const commentInitiative = commentInitId
    ? initiatives.find((i) => i.id === commentInitId) || null
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
              Civic Engagement Feed
            </h1>
            <p className="text-slate-400 text-base max-w-2xl">
              Discover, support, and discuss local initiatives, student projects, and education opportunities.
            </p>
          </div>
          <button
            onClick={onOpenCreatePost}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-500"
          >
            <Plus className="w-4 h-4" />
            New Initiative
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CATEGORY_FILTERS.map((cat) => {
          const active = activeFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-8 py-12">
            <p className="text-slate-400 text-lg font-medium">
              {initiatives.length === 0
                ? 'No verified community initiatives have been submitted yet'
                : 'No initiatives match this category'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {initiatives.length === 0
                ? 'Share a project with organizer details and evidence to start the feed.'
                : 'Choose another category or submit a new initiative.'}
            </p>
            <p className="mx-auto mt-4 max-w-lg text-xs text-slate-600">
              This workspace has no shared project database or verification service. New submissions remain local to this app session and are marked pending.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((init) => (
            <InitiativeCard
              key={init.id}
              initiative={init}
              onVolunteer={onVolunteer}
              onOpenComments={setCommentInitId}
            />
          ))}
        </div>
      )}

      {commentInitiative && (
        <CommentDrawer
          initiative={commentInitiative}
          onAddComment={onAddComment}
          onClose={() => setCommentInitId(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
