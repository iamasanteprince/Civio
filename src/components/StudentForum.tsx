import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import type { CivioUser, DiscussionStore } from '@/types';
import DiscussionThread from '@/components/DiscussionThread';
import SkeletonCards from '@/components/SkeletonCards';

const CHANNELS = [
  { id: 'all', label: '#All Discussions', threadIds: [] },
  { id: 'visa', label: '#Visa & Consular Experience', threadIds: ['forum:visa-interviews'] },
  {
    id: 'admissions',
    label: '#Admissions & Fee Waivers',
    threadIds: ['forum:fee-waiver-codes', 'forum:waec-documents'],
  },
  {
    id: 'scholarships',
    label: '#Scholarships & Opportunities',
    threadIds: ['forum:scholarships-opportunities'],
  },
  {
    id: 'general',
    label: '#General Student Chat',
    threadIds: ['forum:housing-arrival', 'forum:general-chat'],
  },
] as const;

const THREADS = [
  { id: 'forum:visa-interviews', title: 'Visa & Consular Experience', description: 'Interview preparation and recent consular experiences.' },
  { id: 'forum:fee-waiver-codes', title: 'Admissions & Fee Waivers', description: 'Application fees, official waiver codes, and admissions questions.' },
  { id: 'forum:waec-documents', title: 'WAEC & Document Authentication', description: 'Document evaluation, English waivers, and authentication guidance.' },
  { id: 'forum:scholarships-opportunities', title: 'Scholarships & Opportunities', description: 'Funding, scholarships, fellowships, and global opportunities.' },
  { id: 'forum:housing-arrival', title: 'Housing & Arrival', description: 'Accommodation, travel, and settling in.' },
  { id: 'forum:general-chat', title: 'General Student Chat', description: 'General questions and conversations for students.' },
] as const;

interface StudentForumProps {
  currentUser: CivioUser | null;
  discussions: DiscussionStore;
  discussionsReady: boolean;
  onAddComment: (threadId: string, content: string, verified?: boolean) => void;
  onLikeComment: (threadId: string, commentId: string) => void;
  onEditComment: (threadId: string, commentId: string, content: string) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onRequestSignIn: () => void;
}

export default function StudentForum({
  currentUser,
  discussions,
  discussionsReady,
  onAddComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onRequestSignIn,
}: StudentForumProps) {
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const selectedChannel = CHANNELS.find((channel) => channel.id === activeChannel) ?? CHANNELS[0];
  const visibleThreads = activeChannel === 'all'
    ? THREADS
    : THREADS.filter((thread) => selectedChannel.threadIds.includes(thread.id as never));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-stone-200 pb-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">05 / Community Forum</p>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white">
            <MessageCircle className="h-5 w-5 text-stone-700" />
          </div>
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-stone-900">Community Forum</h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Browse conversations by channel, ask questions, and share experiences with applicants.
        </p>
      </header>

      <div className="mb-6 flex flex-nowrap justify-start gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Forum discussion channels">
        {CHANNELS.map((channel) => (
          <button
            key={channel.id}
            type="button"
            aria-pressed={activeChannel === channel.id}
            onClick={() => setActiveChannel(channel.id)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeChannel === channel.id
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900'
            }`}
          >
            {channel.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-50/60 p-4 text-amber-900">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold">Local Session</p>
          <p>
            Active on this device. Discussions are stored locally in your session. For privacy, avoid posting personal passport numbers, application IDs, or bank details.
          </p>
        </div>
      </div>

      {!discussionsReady ? (
        <SkeletonCards count={4} columns={2} />
      ) : visibleThreads.length ? (
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          {visibleThreads.map((thread) => (
            <section key={thread.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-colors duration-200 hover:border-slate-700">
              <div className="p-5">
                <h2 className="font-serif text-lg font-semibold text-stone-900">{thread.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{thread.description}</p>
              </div>
              <DiscussionThread
                threadId={thread.id}
                title={thread.title}
                comments={discussions[thread.id] ?? []}
                currentUser={currentUser}
                onAddComment={onAddComment}
                onLikeComment={onLikeComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                onRequestSignIn={onRequestSignIn}
              />
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-10 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm font-semibold text-slate-200">No discussions in this channel yet</p>
          <p className="mt-1 text-xs text-slate-500">Choose another channel to browse more topics.</p>
        </div>
      )}
    </div>
  );
}
