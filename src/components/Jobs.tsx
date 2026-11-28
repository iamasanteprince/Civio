import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, CalendarDays, ExternalLink, MapPin, RefreshCw, Search } from 'lucide-react';
import type { RemoteJob } from '@/types';

function isHttpsUrl(value: string): boolean {
  if (!/^https:\/\//i.test(value) || value !== value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getDiagnosticMessage(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  if (value.length > 1 && value.every(isRecord)) {
    return 'All remote job feeds are temporarily unavailable. Please try again later.';
  }
  const diagnostic = value.find(isRecord);
  if (!diagnostic || typeof diagnostic.code !== 'string') return undefined;
  const source = typeof diagnostic.source === 'string' ? diagnostic.source : 'Remote job feeds';

  switch (diagnostic.code) {
    case 'blocked':
      return `${source} is temporarily blocking job requests. Please try again later.`;
    case 'rate_limited':
      return `${source} is temporarily limiting requests. Please try again later.`;
    case 'timeout':
      return `${source} is taking too long to respond. Please try again shortly.`;
    case 'network':
      return `${source} could not be reached. Please try again shortly.`;
    case 'invalid_response':
      return `${source} returned no usable listings. Please try again later.`;
    case 'service_error':
      return `${source} is temporarily unavailable. Please try again shortly.`;
    case 'upstream_http':
      return typeof diagnostic.status === 'number'
        ? `${source} is temporarily unavailable (HTTP ${diagnostic.status}). Please try again later.`
        : `${source} is temporarily unavailable. Please try again later.`;
    default:
      return undefined;
  }
}

function getPayloadMessage(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.details === 'string' && value.details.trim()) return value.details;
  if (typeof value.error === 'string' && value.error.trim()) return value.error;
  return getDiagnosticMessage(value.diagnostics);
}

function httpErrorMessage(status: number): string {
  if (status === 403) return 'The jobs service could not access Remote OK right now. Please try again later.';
  if (status === 429) return 'The jobs service is temporarily rate-limited. Please try again later.';
  if (status >= 500) return 'The jobs service is temporarily unavailable. Please try again shortly.';
  return `The jobs service returned HTTP ${status}. Please try again later.`;
}

function isRemoteJob(value: unknown): value is RemoteJob {
  if (!value || typeof value !== 'object') return false;
  const job = value as Record<string, unknown>;
  const companyUrlIsValid = job.companyUrl === undefined
    ? true
    : typeof job.companyUrl === 'string' && isHttpsUrl(job.companyUrl);
  return typeof job.id === 'string' &&
    typeof job.title === 'string' &&
    typeof job.company === 'string' &&
    (job.source === 'Remote OK' || job.source === 'Jobicy' || job.source === 'Himalayas') &&
    typeof job.category === 'string' &&
    typeof job.location === 'string' &&
    Array.isArray(job.regions) && job.regions.every((region) => typeof region === 'string') &&
    Array.isArray(job.keywords) && job.keywords.every((keyword) => typeof keyword === 'string') &&
    typeof job.url === 'string' && isHttpsUrl(job.url) &&
    companyUrlIsValid &&
    (job.publishedAt === null || typeof job.publishedAt === 'string') &&
    typeof job.excerpt === 'string';
}

function formatDate(value: string | null): string {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Date unavailable';
}

function normalizeSearch(value: string): string {
  return value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cleanExcerpt(value: string): string {
  const clean = value
    .replace(/^headquarters\s*:\s*[\s\S]*?\bwho\s+we\s+are\b[\s:—-]*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= 200) return clean;
  const candidate = clean.slice(0, 197);
  const wordBoundary = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, wordBoundary > 0 ? wordBoundary : candidate.length).trimEnd()}...`;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceDetails, setSourceDetails] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [region, setRegion] = useState('All regions');
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/jobs', { signal: controller.signal });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        if (!response.ok) throw new Error(httpErrorMessage(response.status));
        throw new Error('The jobs service returned an invalid response. Please try again shortly.');
      }
      if (!response.ok) {
        throw new Error(getPayloadMessage(payload) ?? httpErrorMessage(response.status));
      }
      if (!isRecord(payload) || !Array.isArray(payload.jobs) || !payload.jobs.every(isRemoteJob)) {
        throw new Error(getPayloadMessage(payload) ??
          'The jobs service returned an unexpected response. Please try again shortly.');
      }
      if (controller.signal.aborted) return;
      setJobs(payload.jobs);
      const details = getPayloadMessage(payload) ?? null;
      const hasError = payload.error === true && payload.jobs.length === 0;
      setSourceDetails(details);
      setError(hasError
        ? details ??
          'All remote job feeds are temporarily unavailable. Please try again later.'
        : null);
    } catch (cause) {
      if (controller.signal.aborted) return;
      const message = cause instanceof TypeError
        ? 'Could not reach the CivioHub jobs service. Please check your connection and try again.'
        : cause instanceof Error
          ? cause.message
          : 'Remote jobs are temporarily unavailable. Please try again later.';
      setError(message);
      setJobs([]);
      setSourceDetails(null);
    } finally {
      if (!controller.signal.aborted && requestRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => requestRef.current?.abort();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(jobs.map((job) => job.category))].sort((left, right) => left.localeCompare(right)),
    [jobs]
  );
  const regions = useMemo(
    () => [...new Set(jobs.flatMap((job) => job.regions))].sort((left, right) => left.localeCompare(right)),
    [jobs]
  );
  const visibleJobs = useMemo(() => {
    const query = normalizeSearch(search);
    return jobs.filter((job) =>
      (category === 'All categories' || job.category === category) &&
      (region === 'All regions' || job.regions.includes(region)) &&
      (!query || [
        job.title,
        job.company,
        job.location,
        job.category,
        ...job.regions,
        ...job.keywords,
      ].map(normalizeSearch).join(' ').includes(query))
    );
  }, [category, jobs, region, search]);

  return (
    <section aria-label="Remote job listings" className="mx-auto w-full max-w-7xl px-4 py-8 pb-32 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-[#0498cc]/20 bg-[#0498cc]/10 p-2.5 text-[#003574]">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-stone-900">Remote Jobs</h1>
            <p className="mt-1 text-sm text-stone-500">Browse remote roles from public job feeds.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search role, company, keyword, or region"
            aria-label="Search jobs by role, company, keyword, or region"
            className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter jobs by category"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800"
        >
          <option>All categories</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          aria-label="Filter jobs by region"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800"
        >
          <option>All regions</option>
          {regions.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-center">
          <p className="text-sm text-red-800">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 text-sm font-semibold text-red-900 underline underline-offset-2">
            Try again
          </button>
        </div>
      )}
      {!error && loading && (
        <p role="status" className="rounded-xl border border-stone-200 bg-white px-5 py-10 text-center text-sm text-stone-500">
          Loading remote jobs…
        </p>
      )}
      {!error && !loading && jobs.length === 0 && (
        <p role="status" className="rounded-xl border border-stone-200 bg-white px-5 py-10 text-center text-sm text-stone-500">
          {sourceDetails ?? 'No remote job listings are available right now.'}
        </p>
      )}
      {!error && !loading && jobs.length > 0 && sourceDetails && (
        <p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          {sourceDetails}
        </p>
      )}
      {!error && !loading && jobs.length > 0 && visibleJobs.length === 0 && (
        <p className="rounded-xl border border-stone-200 bg-white px-5 py-10 text-center text-sm text-stone-500">
          No jobs match your search and category filters.
        </p>
      )}
      {!error && !loading && visibleJobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleJobs.map((job) => (
            <article key={job.id} className="flex min-w-0 flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-[#0498cc]/20 bg-[#0498cc]/10 px-2.5 py-1 text-xs font-semibold text-[#003574]">
                  {job.category}
                </span>
                <time dateTime={job.publishedAt ?? undefined} className="inline-flex items-center gap-1.5 text-xs text-stone-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(job.publishedAt)}
                </time>
              </div>
              <h2 className="break-words text-lg font-semibold leading-snug text-stone-900">{job.title}</h2>
              <p className="mt-1 text-sm font-medium text-stone-700">{job.company}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-500">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </p>
              {job.excerpt && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600">{cleanExcerpt(job.excerpt)}</p>
              )}
              <p className="mt-auto pt-4 text-xs text-stone-500">Source: {job.source}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                {job.companyUrl && isHttpsUrl(job.companyUrl) && (
                  <a
                    href={job.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#003574] px-3 py-2 text-sm font-semibold text-[#003574] transition hover:bg-[#003574]/5"
                  >
                    Apply on Company Site
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${job.companyUrl && isHttpsUrl(job.companyUrl) ? '' : 'ml-auto '}inline-flex items-center gap-1.5 text-sm font-semibold text-[#003574] underline-offset-2 hover:underline`}
                >
                  View original listing <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-6 border-t border-stone-200 pt-4 text-center text-xs leading-relaxed text-stone-500">
        Jobs sourced from public remote job feeds. Click through to view the original listing and apply.
      </p>
    </section>
  );
}
