import { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Calculator, ExternalLink, ShieldCheck } from 'lucide-react';
import type { CivioUser, DiscussionComment, DiscussionStore } from '@/types';
import DiscussionThread from '@/components/DiscussionThread';
import LivePolicyUpdates from '@/components/LivePolicyUpdates';
import {
  VISA_CALCULATOR_LIVING_FUNDS,
  VISA_COUNTRY_FILTERS,
  VISA_INTEL,
  type VisaDestination,
} from '@/data/visaIntel';

interface VisaIntelHubProps {
  currentUser: CivioUser | null;
  discussions: DiscussionStore;
  onAddComment: (threadId: string, content: string, verified?: boolean) => void;
  onLikeComment: (threadId: string, commentId: string) => void;
  onEditComment: (threadId: string, commentId: string, content: string) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onRequestSignIn: () => void;
}

const CURRENCY: Record<VisaDestination, string> = {
  us: 'USD',
  canada: 'CAD',
  uk: 'GBP',
  germany: 'EUR',
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function ProofOfFundsCalculator() {
  const [destination, setDestination] = useState<VisaDestination>('canada');
  const [tuition, setTuition] = useState('');
  const [usLivingCosts, setUsLivingCosts] = useState('');
  const [additionalCosts, setAdditionalCosts] = useState('');
  const [ukLocation, setUkLocation] = useState<'london' | 'outside'>('london');
  const tuitionAmount = Number(tuition);
  const additionalAmount = Number(additionalCosts || 0);
  const isUsAmountValid = destination !== 'us' || usLivingCosts.trim() !== '';
  const isValid = tuition.trim() !== '' && Number.isFinite(tuitionAmount) && tuitionAmount >= 0 &&
    Number.isFinite(additionalAmount) && additionalAmount >= 0 &&
    (destination !== 'us' || (Number.isFinite(Number(usLivingCosts)) && Number(usLivingCosts) >= 0));
  const livingFunds = destination === 'us'
    ? Number(usLivingCosts || 0)
    : destination === 'uk' && ukLocation === 'outside'
      ? 1171 * 9
      : VISA_CALCULATOR_LIVING_FUNDS[destination];
  const total = tuitionAmount + livingFunds + additionalAmount;
  const currency = CURRENCY[destination];

  return (
    <section className="mb-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/70 p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5">
          <Calculator className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Proof-of-Funds Quick Calculator</h2>
          <p className="mt-1 text-sm text-slate-400">Estimate the first-year amount to document before scheduling an appointment.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-300">
          Destination
          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value as VisaDestination)}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
          >
            <option value="us">United States (USD)</option>
            <option value="canada">Canada (CAD)</option>
            <option value="uk">United Kingdom (GBP)</option>
            <option value="germany">Germany (EUR)</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-300">
          First-year tuition ({currency})
          <input
            type="number"
            min="0"
            step="0.01"
            value={tuition}
            onChange={(event) => setTuition(event.target.value)}
            placeholder="Enter the amount on your offer or CAS"
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
          />
        </label>

        {destination === 'us' && (
          <label className="block text-xs font-semibold text-slate-300">
            First-year living and other costs from your I-20 (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={usLivingCosts}
              onChange={(event) => setUsLivingCosts(event.target.value)}
              placeholder="Use your school's first-year estimate"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
            />
          </label>
        )}

        {destination === 'uk' && (
          <label className="block text-xs font-semibold text-slate-300">
            Study location
            <select
              value={ukLocation}
              onChange={(event) => setUkLocation(event.target.value as 'london' | 'outside')}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
            >
              <option value="london">London — £1,529 × 9 months</option>
              <option value="outside">Outside London — £1,171 × 9 months</option>
            </select>
          </label>
        )}

        <label className="block text-xs font-semibold text-slate-300">
          Other required costs / travel ({currency}, optional)
          <input
            type="number"
            min="0"
            step="0.01"
            value={additionalCosts}
            onChange={(event) => setAdditionalCosts(event.target.value)}
            placeholder="Add any additional required amount"
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
          />
        </label>
      </div>

      {isValid && isUsAmountValid && (
        <div className="mt-5 grid gap-3 rounded-xl border border-emerald-500/20 bg-slate-950/40 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Tuition</p>
            <p className="mt-1 font-semibold text-slate-200">{formatMoney(tuitionAmount, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{destination === 'us' ? 'I-20 annual living / other costs' : 'Living funds minimum'}</p>
            <p className="mt-1 font-semibold text-slate-200">{formatMoney(livingFunds, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Estimated total to document</p>
            <p className="mt-1 text-xl font-bold text-emerald-300">{formatMoney(total, currency)}</p>
          </div>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Estimate only. US applicants should use the full first-year cost on Form I-20; Canada’s amount excludes tuition and travel. Sponsorships, exemptions, dependants, location, and rule changes can change the required evidence. Verify with the official authority and your institution.
      </p>
    </section>
  );
}

export default function VisaIntelHub({
  currentUser,
  discussions,
  onAddComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onRequestSignIn,
}: VisaIntelHubProps) {
  const [activeCountry, setActiveCountry] = useState<string>('all');
  const visaCards = useMemo(
    () => activeCountry === 'all' ? VISA_INTEL : VISA_INTEL.filter((item) => item.id === activeCountry),
    [activeCountry]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-7 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-200">
          <BadgeCheck className="h-4 w-4" />
          Official-source summaries and live policy feed
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Student Visa &amp; Immigration Intel</h1>
        <p className="mx-auto max-w-3xl text-base text-slate-400 sm:text-lg">
          Live verified consular rules, proof-of-funds thresholds, English test waivers, and policy updates.
        </p>
      </header>

      <LivePolicyUpdates />
      <ProofOfFundsCalculator />

      <section aria-label="Filter visa information by destination" className="mb-6 flex flex-wrap justify-center gap-2">
        {VISA_COUNTRY_FILTERS.map((country) => (
          <button
            key={country.id}
            type="button"
            onClick={() => setActiveCountry(country.id)}
            aria-pressed={activeCountry === country.id}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeCountry === country.id
                ? 'border-sky-500/50 bg-sky-500/15 text-sky-200'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {country.label}
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {visaCards.map((visa) => {
          const threadId = `visa:${visa.id}`;
          const comments: DiscussionComment[] = discussions[threadId] ?? [];
          return (
            <article key={visa.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0c1322]/90 shadow-lg shadow-black/10">
              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-2xl">
                    {visa.flag}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">{visa.country}</p>
                    <h2 className="mt-0.5 text-xl font-bold text-white">{visa.title}</h2>
                  </div>
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" aria-label="Official-source references included" />
                </div>

                <dl className="space-y-4">
                  {visa.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{fact.label}</dt>
                      <dd className="text-sm leading-relaxed text-slate-300">{fact.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
                  {visa.notes.map((note) => <p key={note} className="text-xs leading-relaxed text-amber-200/80">{note}</p>)}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {visa.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-sky-500/40 hover:text-sky-200"
                    >
                      {source.label}<ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>

              <DiscussionThread
                threadId={threadId}
                title={visa.title}
                comments={comments}
                currentUser={currentUser}
                onAddComment={onAddComment}
                onLikeComment={onLikeComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                onRequestSignIn={onRequestSignIn}
              />
            </article>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs leading-relaxed text-slate-500">
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <p>Immigration rules can change without notice. The linked government pages are authoritative; Civio’s summary is informational and is not legal advice.</p>
      </div>
    </div>
  );
}
