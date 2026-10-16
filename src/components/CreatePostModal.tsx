import { useEffect, useState } from 'react';
import { X, Plus, Send } from 'lucide-react';
import type { Initiative, InitiativeCategory, CivioUser } from '@/types';
import {
  getPostCooldownRemaining,
  recordPostSubmission,
  getGuestSessionId,
  sanitizePlainText,
} from '@/utils/inputSecurity';

const CATEGORIES: InitiativeCategory[] = [
  'Education',
  'Business',
  'Public Policy',
  'Environment',
  'Community',
  'Tech & Coding',
];

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function CreatePostModal({
  open,
  onClose,
  currentUser,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: CivioUser | null;
  onCreate: (initiative: Initiative) => void;
}) {
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [category, setCategory] = useState<InitiativeCategory>('Education');
  const [volunteersNeeded, setVolunteersNeeded] = useState(5);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [formError, setFormError] = useState('');
  const [cooldownMs, setCooldownMs] = useState(() => getPostCooldownRemaining());

  useEffect(() => {
    if (!open || cooldownMs <= 0) return;
    const timer = window.setInterval(() => setCooldownMs(getPostCooldownRemaining()), 250);
    return () => window.clearInterval(timer);
  }, [open, cooldownMs]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeTitle = sanitizePlainText(title);
    const safeOrganizer = sanitizePlainText(organizer);
    const safeGoal = sanitizePlainText(goal);
    const safeDescription = sanitizePlainText(description);
    if (!safeTitle || !safeOrganizer || !safeGoal || !safeDescription || !verificationUrl.trim()) return;
    if (!isHttpUrl(verificationUrl.trim()) || (projectLink.trim() && !isHttpUrl(projectLink.trim()))) {
      setFormError('Use a valid http:// or https:// link for project and organizer evidence.');
      return;
    }
    const remaining = getPostCooldownRemaining();
    if (remaining > 0) {
      setCooldownMs(remaining);
      setFormError(`Please wait ${Math.ceil(remaining / 1000)} seconds before submitting again.`);
      return;
    }
    setFormError('');
    recordPostSubmission();
    setCooldownMs(5000);

    const newInitiative: Initiative = {
      id: `init-${Date.now()}`,
      category,
      author: sanitizePlainText(currentUser?.displayName || 'Guest').slice(0, 80) || 'Guest',
      organizer: safeOrganizer.slice(0, 120),
      verificationUrl: verificationUrl.trim(),
      verificationStatus: 'pending',
      goal: safeGoal.slice(0, 1000),
      title: safeTitle.slice(0, 160),
      description: safeDescription.slice(0, 5000),
      volunteersNeeded,
      volunteersJoined: 0,
      comments: [],
      postedAt: new Date().toLocaleDateString('en-GB'),
      link: projectLink.trim() ? new URL(projectLink.trim()).href : undefined,
      userId: currentUser?.id,
      guestSessionId: currentUser ? undefined : getGuestSessionId(),
    };

    onCreate(newInitiative);
    setTitle('');
    setOrganizer('');
    setDescription('');
    setGoal('');
    setCategory('Education');
    setVolunteersNeeded(5);
    setVerificationUrl('');
    setProjectLink('');
    setFormError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl animate-modalIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#0498cc]" />
            New Initiative
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Community Coding Bootcamp"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-[#0498cc]/50 focus:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Organizer or organization
            </label>
            <input
              type="text"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="Name of the person or organization leading the project"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-[#0498cc]/50 focus:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    category === cat
                      ? 'border-[#0498cc]/50 bg-[#0498cc]/15 text-[#0498cc]'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the mission, what the initiative does, and who it serves..."
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-[#0498cc]/50 focus:bg-slate-800 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Project goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe the measurable community or educational outcome this project aims to achieve..."
              rows={2}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-[#0498cc]/50 focus:bg-slate-800 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Volunteers Needed
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={volunteersNeeded}
                onChange={(e) => setVolunteersNeeded(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all focus:border-[#0498cc]/50 focus:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Project link (optional)
              </label>
              <input
                type="url"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-[#0498cc]/50 focus:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Organizer verification evidence
            </label>
            <input
              type="url"
              value={verificationUrl}
              onChange={(e) => setVerificationUrl(e.target.value)}
              placeholder="https://organization-site.org/about"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-[#0498cc]/50 focus:bg-slate-800"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              This workspace has no connected verification service. Submissions remain pending and visible only in this app session until an organizer review process is configured.
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-800">
            Posting as: <span className="text-slate-300 font-medium">{currentUser?.displayName ?? 'Guest'}</span>
          </div>

          {formError && (
            <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={!title.trim() || !organizer.trim() || !goal.trim() || !description.trim() || !verificationUrl.trim() || cooldownMs > 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#003574] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#003574] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {cooldownMs > 0 ? `Please wait ${Math.ceil(cooldownMs / 1000)}s` : 'Publish Initiative'}
          </button>
        </form>
      </div>
    </div>
  );
}
