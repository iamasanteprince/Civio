import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import type { View } from '@/types';

interface Notice {
  id: string;
  category: 'Admissions' | 'Visa Alert' | 'Scholarships';
  title: string;
  timestamp: string;
  view: View;
}

const NOTICES: Notice[] = [
  { id: 'us-fall-fee-waiver', category: 'Admissions', title: 'US Fall application fee waiver updates', timestamp: '2h ago', view: 'hub' },
  { id: 'de-sperrkonto-funds', category: 'Visa Alert', title: 'Germany: Sperrkonto proof-of-funds rules updated', timestamp: '1d ago', view: 'visa' },
  { id: 'uk-cas-update', category: 'Visa Alert', title: 'UK CAS issuance and timeline updates', timestamp: '2d ago', view: 'visa' },
  { id: 'scholarship-deadlines', category: 'Scholarships', title: 'New fully funded scholarship deadlines posted', timestamp: '3d ago', view: 'opportunities' },
];

const STORAGE_KEY = 'civiohub_read_notices';

function loadRead(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export default function NotificationCenter({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>(loadRead);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(read));
    } catch {
      /* storage unavailable */
    }
  }, [read]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = NOTICES.filter((n) => !read.includes(n.id)).length;
  const markAll = () => setRead(NOTICES.map((n) => n.id));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative inline-flex items-center rounded-xl border border-stone-200 bg-white px-2 py-2 text-[#003574] transition hover:border-[#0498cc]"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-[#0498cc]" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-stone-200 bg-[#faf9f6] p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-widest text-stone-500">01 / RECENT NOTICES</span>
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className="text-xs font-semibold text-[#0498cc] disabled:text-stone-400"
            >
              Mark all read
            </button>
          </div>
          <ul className="space-y-2">
            {NOTICES.map((n) => {
              const isRead = read.includes(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRead((r) => (r.includes(n.id) ? r : [...r, n.id]));
                      setOpen(false);
                      onNavigate(n.view);
                    }}
                    className="w-full rounded-lg border border-stone-200 bg-[#fffdf7] p-3 text-left transition hover:border-stone-300"
                  >
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="font-semibold uppercase tracking-wider text-[#0498cc]">{n.category}</span>
                      <span className="flex items-center gap-1.5 text-stone-500">
                        {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-[#0498cc]" />}
                        {n.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm ${isRead ? 'text-stone-500' : 'font-medium text-stone-900'}`}>{n.title}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
