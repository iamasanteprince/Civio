import { useState } from 'react';
import { X } from 'lucide-react';

export type LegalNotice = 'terms' | 'privacy';

export default function LegalNotices({
  initialNotice,
  onClose,
}: {
  initialNotice: LegalNotice;
  onClose: () => void;
}) {
  const [notice, setNotice] = useState<LegalNotice>(initialNotice);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-notice-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close legal information"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5 flex gap-2 border-b border-slate-800 pr-8">
          {(['terms', 'privacy'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setNotice(item)}
              aria-pressed={notice === item}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize transition ${
                notice === item
                  ? 'border-blue-500 text-[#0498cc]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {item === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </button>
          ))}
        </div>
        <h2 id="legal-notice-title" className="mb-3 font-serif text-lg font-semibold text-stone-900">
          {notice === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
        </h2>
        {notice === 'terms' ? (
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Civiohub provides educational, admissions, immigration, and opportunity information for general guidance. It is not legal, immigration, financial, or admissions advice.
            </p>
            <p>
              Information and links may change or become outdated. Confirm requirements and deadlines with the relevant institution or official authority before acting.
            </p>
            <p>
              Use Civiohub lawfully and respectfully. Do not submit sensitive personal, financial, or identity-document information in community discussions.
            </p>
            <p>
              Community discussions in this version are stored in your browser and are not shared with other users or devices.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Civiohub uses account information to provide sign-in and account features. Community discussions in this version are stored in your browser and sync only between Civiohub tabs on this device.
            </p>
            <p>
              Do not post sensitive personal, financial, or visa-document information. Public opportunity and policy feeds are loaded from their listed sources.
            </p>
            <p>Account data may be managed or deleted through Account Settings.</p>
          </div>
        )}

        {/* Official Partnership Accreditation Footer */}
        <div className="mt-6 border-t border-slate-800 pt-4 text-center">
          <p className="text-xs tracking-wide text-slate-400">
            Civiohub is operated in official partnership with{' '}
            <span className="font-semibold text-slate-200">
              Paramount Bridge Educational Consult
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}