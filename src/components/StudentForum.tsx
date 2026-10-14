import { MessageCircle, Users } from 'lucide-react';
import type { CivioUser, DiscussionStore } from '@/types';
import DiscussionThread from '@/components/DiscussionThread';

const FORUM_CATEGORIES = [
  { id: 'visa-interviews', label: 'Visa Interviews', description: 'Preparation tips and recent interview experiences.' },
  { id: 'fee-waiver-codes', label: 'Fee Waiver Codes', description: 'Share official fee-waiver opportunities and application guidance.' },
  { id: 'housing-arrival', label: 'Housing & Arrival', description: 'Discuss accommodation, travel, and settling in.' },
  { id: 'waec-documents', label: 'WAEC & Document Authentication', description: 'Compare document evaluation and authentication steps.' },
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
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
          <MessageCircle className="h-7 w-7 text-indigo-300" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Student Forum / Discussion</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Ask applicants questions and share experiences across visa, admissions, and arrival topics.
        </p>
      </header>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p className="text-xs leading-relaxed text-amber-100/80">
          These discussions are stored in this browser and sync between Civio tabs on this device. They are not shared with other users or devices because no forum backend is configured. Do not post sensitive personal or visa-document information.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {FORUM_CATEGORIES.map((category) => {
          const threadId = `forum:${category.id}`;
          return (
            <section key={category.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1322]/90">
              <div className="p-5">
                <h2 className="text-lg font-bold text-white">{category.label}</h2>
                <p className="mt-1 text-sm text-slate-500">{category.description}</p>
              </div>
              <DiscussionThread
                threadId={threadId}
                title={category.label}
                comments={discussions[threadId] ?? []}
                currentUser={currentUser}
                onAddComment={onAddComment}
                onLikeComment={onLikeComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                onRequestSignIn={onRequestSignIn}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
