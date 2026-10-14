import type { DiscussionComment, DiscussionStore } from '@/types';
import { sanitizePlainText } from '@/utils/inputSecurity';

export const DISCUSSION_STORAGE_KEY = 'civio-discussions-v1';

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
  return store;
}
