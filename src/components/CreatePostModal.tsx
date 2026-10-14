import { useState } from 'react';
import { X, Plus, Send } from 'lucide-react';
import type { Initiative, InitiativeCategory, CivioUser } from '@/types';

const CATEGORIES: InitiativeCategory[] = [
  'Education',
  'Business',
  'Public Policy',
  'Environment',
  'Community',
  'Tech & Coding',
];

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
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InitiativeCategory>('Education');
  const [volunteersNeeded, setVolunteersNeeded] = useState(5);
  const [link, setLink] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newInitiative: Initiative = {
      id: `init-${Date.now()}`,
      category,
      author: currentUser ? currentUser.email : 'anonymous',
      title: title.trim(),
      description: description.trim(),
      endorsements: 0,
      volunteersNeeded,
      volunteersJoined: 0,
      comments: [],
      postedAt: new Date().toLocaleDateString('en-GB'),
      link: link.trim() || undefined,
    };

    onCreate(newInitiative);
    setTitle('');
    setDescription('');
    setCategory('Education');
    setVolunteersNeeded(5);
    setLink('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl animate-modalIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
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
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800"
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
                      ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-200'
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
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Link (optional)
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-800">
            Posting as: <span className="text-slate-300 font-medium">{currentUser ? currentUser.email : 'Anonymous'}</span>
          </div>

          <button
            type="submit"
            disabled={!title.trim() || !description.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Publish Initiative
          </button>
        </form>
      </div>
    </div>
  );
}
