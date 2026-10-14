import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import type { CivioUser, DiscussionStore } from '@/types';
import DiscussionThread from '@/components/DiscussionThread';

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
  onAddComment: (threadId: string, content: string, verified?: boolean) => void;
  onLikeComment: (threadId: string, commentId: string) => void;
  onEditComment: (threadId: string, commentId: string, content: string) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onRequestSignIn: () => void;
}

export default function StudentForum({
  currentUser,
  discussions,
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
          <MessageCircle className="h-7 w-7 text-indigo-300" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Community Forum</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Browse conversations by channel, ask questions, and share experiences with applicants.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Forum discussion channels">
        {CHANNELS.map((channel) => (
          <button
            key={channel.id}
            type="button"
            aria-pressed={activeChannel === channel.id}
            onClick={() => setActiveChannel(channel.id)}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeChannel === channel.id
                ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-200'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {channel.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p className="text-xs leading-relaxed text-amber-100/80">
          Discussions are stored in this browser and sync between Civiohub tabs on this device. They are not shared with other users or devices because no forum backend is configured. Do not post sensitive personal or visa-document information.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {visibleThreads.map((thread) => (
          <section key={thread.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1322]/90">
            <div className="p-5">
              <h2 className="text-lg font-bold text-white">{thread.title}</h2>
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
    </div>
  );
}
