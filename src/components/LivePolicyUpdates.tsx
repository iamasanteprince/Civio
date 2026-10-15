import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw, Rss } from 'lucide-react';
import SkeletonCards from '@/components/SkeletonCards';

interface PolicyFeedSource {
  id: string;
  label: string;
  allowedHosts: string[];
  fallback: PolicyUpdate;
}

interface PolicyUpdate {
  id: string;
  sourceId: string;
  sourceLabel: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
  preIndexed: boolean;
}

interface Rss2JsonItem {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
  description?: unknown;
  content?: unknown;
}

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const SOURCES: PolicyFeedSource[] = [
  {
    id: 'canada',
    label: 'Official IRCC Bulletin',
    allowedHosts: ['canada.ca'],
    fallback: {
      id: 'fallback-canada',
      sourceId: 'canada',
      sourceLabel: 'Official IRCC Guidance',
      title: 'Study permit: financial support requirements',
      summary: 'Review IRCC’s current proof-of-funds rules, accepted evidence, and study-permit application guidance before applying.',
      url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html',
      publishedAt: null,
      preIndexed: true,
    },
  },
  {
    id: 'uk',
    label: 'UKVI Update',
    allowedHosts: ['gov.uk'],
    fallback: {
      id: 'fallback-uk',
      sourceId: 'uk',
      sourceLabel: 'Official UKVI Guidance',
      title: 'Student visa: money and financial evidence',
      summary: 'Check the current maintenance amounts, evidence rules, and required holding period in the official Student visa guidance.',
      url: 'https://www.gov.uk/student-visa/money',
      publishedAt: null,
      preIndexed: true,
    },
  },
  {
    id: 'us',
    label: 'USCIS Alert',
    allowedHosts: ['uscis.gov'],
    fallback: {
      id: 'fallback-us',
      sourceId: 'us',
      sourceLabel: 'Official U.S. Visa Guidance',
      title: 'Student visa application guidance',
      summary: 'Review the Department of State’s F-1 student visa application steps and use your institution’s Form I-20 for financial planning.',
      url: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html',
      publishedAt: null,
      preIndexed: true,
    },
  },
  {
    id: 'germany',
    label: 'German Foreign Office Update',
    allowedHosts: ['auswaertiges-amt.de'],
    fallback: {
      id: 'fallback-germany',
      sourceId: 'germany',
      sourceLabel: 'Official German Foreign Office Guidance',
      title: 'Visa information for study in Germany',
      summary: 'Confirm the visa route and current proof-of-financing requirements with the German mission responsible for your place of residence.',
      url: 'https://www.auswaertiges-amt.de/en/visa-service',
      publishedAt: null,
      preIndexed: true,
    },
  },
];

function getString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePublishedDate(value: string): Date | null {
  if (!value) return null;
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
  const normalized = hasTimezone ? value.trim() : `${value.trim().replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function parseItem(source: PolicyFeedSource, item: Rss2JsonItem): PolicyUpdate | null {
  const title = stripMarkup(getString(item.title));
  const url = getString(item.link);
  if (!title || !url) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' || !source.allowedHosts.some(
      (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
    )) return null;

    const date = parsePublishedDate(getString(item.pubDate));
    const publishedAt = date?.toISOString() ?? null;
    const description = stripMarkup(getString(item.description) || getString(item.content));
    return {
      id: `${source.id}:${parsedUrl.href}`,
      sourceId: source.id,
      sourceLabel: source.label,
      title: title.slice(0, 240),
      summary: (description || 'Open the official source for the full policy update.').slice(0, 360),
      url: parsedUrl.href,
      publishedAt,
      preIndexed: false,
    };
  } catch {
    return null;
  }
}

function relativeTime(value: string): string {
  const date = new Date(value);
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (elapsedMinutes < 60) return `Updated ${elapsedMinutes} minute${elapsedMinutes === 1 ? '' : 's'} ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Updated ${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Updated ${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;
}

export default function LivePolicyUpdates() {
  const [updates, setUpdates] = useState<PolicyUpdate[]>(SOURCES.map((source) => source.fallback));
  const [refreshing, setRefreshing] = useState(true);
  const [activeFeedCount, setActiveFeedCount] = useState(0);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const requestRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setRefreshing(true);
    setMessage('');

    try {
      const response = await fetch('/api/policy-updates', { signal: controller.signal });
      if (!response.ok) throw new Error(`Policy feeds returned HTTP ${response.status}.`);
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== 'object') throw new Error('Policy feed response was invalid.');
      const data = payload as { status?: unknown; items?: unknown; sources?: unknown };
      if (data.status !== 'ok' || !Array.isArray(data.items) || !Array.isArray(data.sources)) {
        throw new Error('Policy feed response did not contain valid items.');
      }
      if (controller.signal.aborted) return;

      const updatesBySource = new Map<string, PolicyUpdate[]>();
      for (const value of data.items) {
        if (!value || typeof value !== 'object') continue;
        const item = value as Rss2JsonItem & { sourceId?: unknown };
        if (typeof item.sourceId !== 'string') continue;
        const source = SOURCES.find((candidate) => candidate.id === item.sourceId);
        if (!source || !source.allowedHosts.length) continue;
        const update = parseItem(source, item);
        if (update) updatesBySource.set(source.id, [...(updatesBySource.get(source.id) ?? []), update]);
      }

      const activeSources = SOURCES.filter((source) => (updatesBySource.get(source.id)?.length ?? 0) > 0);
      const combined = SOURCES
        .flatMap((source) => updatesBySource.get(source.id)?.slice(0, 2) ?? [source.fallback])
        .sort((a, b) => {
          if (!a.publishedAt && !b.publishedAt) return 0;
          if (!a.publishedAt) return 1;
          if (!b.publishedAt) return -1;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

      setUpdates(combined);
      setActiveFeedCount(activeSources.length);
      setLastCheckedAt(new Date().toISOString());
      setMessage(activeSources.length === 0
        ? 'Live feeds could not be reached. Showing pre-indexed official guidance links instead.'
        : activeSources.length < 2
          ? `${activeSources.length} of 2 live feeds connected; other destinations show pre-indexed official guidance.`
          : '');
    } catch {
      if (controller.signal.aborted) return;
      setUpdates(SOURCES.map((source) => source.fallback));
      setActiveFeedCount(0);
      setLastCheckedAt(new Date().toISOString());
      setMessage('Live feeds could not be reached. Showing pre-indexed official guidance links instead.');
    } finally {
      if (!controller.signal.aborted && requestRef.current === controller) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      requestRef.current?.abort();
    };
  }, [refresh]);

  return (
    <section aria-label="Live embassy and policy updates" aria-busy={refreshing && !lastCheckedAt} className="mb-8 w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg border border-blue-500/25 bg-blue-500/10 p-2.5">
            <Rss className="h-5 w-5 text-blue-300" />
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-white">Live Embassy &amp; Policy Updates</h2>
            <p className="mt-1 text-xs text-slate-400">Official public feeds · auto-refreshes every 15 minutes</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            activeFeedCount > 0
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/25 bg-amber-500/10 text-amber-200'
          }`}>
            <span className={`h-2 w-2 rounded-full ${activeFeedCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {activeFeedCount > 0 ? `Live Feed Active · ${activeFeedCount}/${SOURCES.length}` : 'Showing Indexed Guidance'}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-500/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
        </div>
      </div>

      {message && <p role="status" className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">{message}</p>}
      {lastCheckedAt && <p className="mb-3 text-[11px] text-slate-500">Last checked {new Date(lastCheckedAt).toLocaleTimeString()}</p>}

      {refreshing && !lastCheckedAt ? (
        <SkeletonCards count={4} columns={2} />
      ) : updates.length ? (
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          {updates.slice(0, 8).map((update) => (
            <article key={update.id} className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/40 p-4 transition-colors duration-200 hover:border-slate-700">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-1 text-[10px] font-semibold text-slate-300">{update.sourceLabel}</span>
                <time className="text-[10px] text-slate-500" dateTime={update.publishedAt ?? undefined}>
                  {update.publishedAt ? relativeTime(update.publishedAt) : 'Official publication date unavailable'}
                </time>
              </div>
              <h3 className="break-words text-sm font-semibold leading-snug text-slate-100">{update.title}</h3>
              <p className="mt-1.5 break-words text-xs leading-relaxed text-slate-400">{update.summary}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                {update.preIndexed && <span className="text-[10px] text-slate-500">Pre-indexed reference · verify current rules</span>}
                <a href={update.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-300 transition-colors hover:text-blue-200">
                  Official bulletin <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400">
          No policy updates are available right now. Please check an official source directly.
        </p>
      )}
    </section>
  );
}
