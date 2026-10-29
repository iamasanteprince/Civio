import PartnerSearchWidget from '@/components/PartnerSearchWidget';
import { APPLYBOARD_PARTNER_URL } from '@/data/applyBoard';

export default function ApplyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <header className="mb-8 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
          Partner University Search
        </p>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">
          Apply to 1,500+ universities
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
          Search accredited partner programs and start an application with verified fee-waiver support through the ApplyBoard partner desk.
        </p>
        <a
          href={APPLYBOARD_PARTNER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 transition shadow-sm"
        >
          Open full application portal
        </a>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <PartnerSearchWidget />
      </div>
    </div>
  );
}
