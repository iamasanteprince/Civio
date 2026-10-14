import type { DiscussionComment, DiscussionStore } from '@/types';
import { sanitizePlainText } from '@/utils/inputSecurity';

export const DISCUSSION_STORAGE_KEY = 'civio-discussions-v1';

const FORUM_THREAD_IDS = new Set([
  'forum:visa-interviews',
  'forum:fee-waiver-codes',
  'forum:waec-documents',
  'forum:scholarships-opportunities',
  'forum:housing-arrival',
  'forum:general-chat',
]);

function getForumThreadId(threadId: string): string {
  if (FORUM_THREAD_IDS.has(threadId)) return threadId;
  if (threadId.startsWith('visa:')) return 'forum:visa-interviews';
  if (threadId.startsWith('university:')) return 'forum:fee-waiver-codes';
  if (threadId.startsWith('opportunity:')) return 'forum:scholarships-opportunities';
  if (threadId.startsWith('initiative:')) return 'forum:general-chat';
  return 'forum:general-chat';
}

function isDiscussionComment(value: unknown): value is DiscussionComment {
  if (!value || typeof value !== 'object') return false;
  const comment = value as Record<string, unknown>;
  return (
    typeof comment.id === 'string' &&
    typeof comment.author === 'string' &&
    typeof comment.content === 'string' &&
    typeof comment.timestamp === 'string' &&
    typeof comment.likes === 'number' &&
    (typeof comment.verified === 'boolean' || comment.verified === undefined) &&
    (comment.email === undefined || typeof comment.email === 'string' || comment.email === null) &&
    (comment.userId === undefined || typeof comment.userId === 'string') &&
    (comment.guestSessionId === undefined || typeof comment.guestSessionId === 'string') &&
    (comment.editedAt === undefined || typeof comment.editedAt === 'string')
  );
}

export function parseDiscussionStore(raw: string): DiscussionStore {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Saved discussion data has an invalid format.');
  }

  const store: DiscussionStore = {};
  for (const [threadId, comments] of Object.entries(parsed)) {
    if (!Array.isArray(comments) || !comments.every(isDiscussionComment)) {
      throw new Error(`Saved discussion data for "${threadId}" is invalid.`);
    }
    store[threadId] = comments.map((comment) => {
      const savedComment = comment as DiscussionComment & { email?: string | null };
      return {
        id: savedComment.id,
        author: sanitizePlainText(savedComment.author) || 'Guest',
        content: sanitizePlainText(savedComment.content),
        timestamp: savedComment.timestamp,
        likes: savedComment.likes,
        verified: savedComment.verified === true,
        userId: savedComment.userId,
        guestSessionId: savedComment.guestSessionId,
        editedAt: savedComment.editedAt,
      };
    });
  }
  const forumStore: DiscussionStore = {};
  for (const [threadId, comments] of Object.entries(store)) {
    const forumThreadId = getForumThreadId(threadId);
    forumStore[forumThreadId] = [...(forumStore[forumThreadId] ?? []), ...comments];
  }
  for (const comments of Object.values(forumStore)) {
    comments.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }
  return forumStore;
}
