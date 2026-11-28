import type { JobSource, RemoteJob } from '../types';

const REMOTE_OK_URL = 'https://remoteok.com/api';
const REQUEST_TIMEOUT_MS = 10_000;
const FALLBACK_TIMEOUT_MS = 8_000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CivioHubJobs/1.0)';
const REMOTE_OK: JobSource = 'Remote OK';
const JOBICY: JobSource = 'Jobicy';
const HIMALAYAS: JobSource = 'Himalayas';

const REGION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'United States', pattern: /\b(?:us|usa|u s|u s a|united states|america)\b/i },
  { label: 'Canada', pattern: /\bcanada\b/i },
  { label: 'United Kingdom', pattern: /\b(?:uk|u k|united kingdom|britain|england|scotland|wales)\b/i },
  { label: 'Europe', pattern: /\b(?:europe|european)\b/i },
  { label: 'Worldwide', pattern: /\b(?:worldwide|world wide|global|anywhere)\b/i },
];

export interface JobsDiagnostic {
  source: JobSource;
  code: 'blocked' | 'rate_limited' | 'upstream_http' | 'timeout' | 'network' | 'invalid_response' | 'service_error';
  message: string;
  status?: number;
}

export interface JobsPayload {
  jobs: RemoteJob[];
  error: boolean;
  diagnostics: JobsDiagnostic[];
}

class RemoteOkError extends Error {
  constructor(readonly diagnostic: JobsDiagnostic) {
    super(diagnostic.message);
    this.name = 'RemoteOkError';
  }
}

class JobsFeedError extends Error {
  constructor(readonly diagnostic: JobsDiagnostic) {
    super(diagnostic.message);
    this.name = 'JobsFeedError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function normalizeHttpsUrl(value: unknown): string | undefined {
  const candidate = text(value).trim();
  if (!/^https:\/\//i.test(candidate)) return undefined;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

function decodeEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, encoded: string) => {
    if (encoded[0] !== '#') return entities[encoded.toLowerCase()] ?? entity;
    const codePoint = encoded[1].toLowerCase() === 'x'
      ? Number.parseInt(encoded.slice(2), 16)
      : Number.parseInt(encoded.slice(1), 10);
    return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : ' ';
  });
}

function plainText(value: string): string {
  return decodeEntities(decodeEntities(value))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6])\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(value: string): string {
  const clean = plainText(value)
    .replace(/^headquarters\s*:\s*[\s\S]*?\bwho\s+we\s+are\b[\s:—-]*/i, '')
    .trim();
  if (clean.length <= 200) return clean;
  const candidate = clean.slice(0, 197);
  const wordBoundary = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, wordBoundary > 0 ? wordBoundary : candidate.length).trimEnd()}...`;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const raw = typeof entry === 'string'
      ? entry
      : isRecord(entry)
        ? text(entry.name) || text(entry.title) || text(entry.label)
        : '';
    const clean = plainText(raw);
    return clean ? [clean] : [];
  });
}

function regionsFrom(values: string[]): string[] {
  const sourceText = values.map(normalize).join(' ');
  return REGION_PATTERNS
    .filter(({ pattern }) => pattern.test(sourceText))
    .map(({ label }) => label);
}

function regionKeywords(regions: string[]): string[] {
  const aliases: Record<string, string[]> = {
    'United States': ['US', 'USA', 'U.S.', 'U.S.A.', 'United States'],
    Canada: ['Canada'],
    'United Kingdom': ['UK', 'U.K.', 'United Kingdom'],
    Europe: ['Europe', 'European'],
    Worldwide: ['Worldwide', 'Global'],
  };
  return regions.flatMap((region) => aliases[region] ?? [region]);
}

function dateValue(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const timestamp = value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function normalize(value: string): string {
  return value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeJob(item: Record<string, unknown>, source: JobSource): RemoteJob | undefined {
  const title = plainText(
    text(item.position) || text(item.jobTitle) || text(item.title) || text(item.name)
  );
  const company = plainText(
    text(item.company) || text(item.companyName) || text(item.employer)
  );
  const url = normalizeHttpsUrl(
    item.url ?? item.jobUrl ?? item.job_url ?? item.jobLink ?? item.guid
  );
  if (!title || !company || !url) return undefined;

  const tags = [
    ...stringArray(item.tags),
    ...stringArray(item.jobIndustry),
    ...stringArray(item.categories),
    ...stringArray(item.category),
    ...stringArray(item.jobType),
    ...stringArray(item.jobLevel),
  ];
  const description = text(item.description) || text(item.jobDescription) ||
    text(item.jobExcerpt) || text(item.excerpt) || text(item.summary);
  const locationText = plainText(
    text(item.location) || text(item.jobGeo) || text(item.locationName) || text(item.region)
  );
  const regions = regionsFrom([locationText, ...tags, plainText(description)]);
  const location = locationText || (regions.length ? regions.join(', ') : 'Remote');
  const category = plainText(
    text(item.category) || text(item.jobCategory) || tags[0] || 'Remote Jobs'
  );
  const companyUrl = normalizeHttpsUrl(
    item.apply_url ?? item.jobApplyLink ?? item.applicationLink ??
      item.applicationUrl ?? item.applyUrl ?? item.companyUrl ?? item.companyWebsite
  );
  const id = text(item.id) || text(item.slug) || text(item.guid) ||
    `${normalize(company)}-${normalize(title)}`;

  return {
    id: `${normalize(source).replace(/\s/g, '')}:${id}`,
    title,
    company,
    source,
    category,
    location,
    regions,
    keywords: [...new Set([...tags, ...regions, ...regionKeywords(regions)])],
    url,
    ...(companyUrl ? { companyUrl } : {}),
    publishedAt: dateValue(item.date) ?? dateValue(item.epoch) ??
      dateValue(item.pubDate) ?? dateValue(item.publishedAt),
    excerpt: excerpt(description),
  };
}

function parseRemoteOk(payload: unknown): RemoteJob[] {
  if (!Array.isArray(payload)) {
    throw new RemoteOkError({
      source: REMOTE_OK,
      code: 'invalid_response',
      message: 'Remote OK returned data in an unexpected format.',
    });
  }

  const jobs = payload.filter(isRecord);
  return jobs.flatMap((item): RemoteJob[] => {
    const job = normalizeJob(item, REMOTE_OK);
    return job ? [job] : [];
  });
}

async function loadRemoteOk(): Promise<RemoteJob[]> {
  let response: Response;
  try {
    response = await fetch(REMOTE_OK_URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new RemoteOkError({
      source: REMOTE_OK,
      code: timedOut ? 'timeout' : 'network',
      message: timedOut
        ? 'Remote OK did not respond before the request timed out.'
        : 'Could not connect to Remote OK.',
    });
  }

  if (!response.ok) {
    const code = response.status === 403
      ? 'blocked'
      : response.status === 429
        ? 'rate_limited'
        : 'upstream_http';
    const message = response.status === 403
      ? 'Remote OK temporarily blocked this request.'
      : response.status === 429
        ? 'Remote OK is rate-limiting requests. Please try again later.'
        : `Remote OK returned HTTP ${response.status}.`;
    throw new RemoteOkError({
      source: REMOTE_OK,
      code,
      message,
      status: response.status,
    });
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new RemoteOkError({
      source: REMOTE_OK,
      code: 'invalid_response',
      message: 'Remote OK returned a response that was not JSON.',
    });
  }

  let body: string;
  try {
    body = await response.text();
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new RemoteOkError({
      source: REMOTE_OK,
      code: timedOut ? 'timeout' : 'network',
      message: timedOut
        ? 'Remote OK did not finish sending the response before the request timed out.'
        : 'The Remote OK response could not be read.',
    });
  }
  if (!body.trim()) {
    throw new RemoteOkError({
      source: REMOTE_OK,
      code: 'invalid_response',
      message: 'Remote OK returned an empty response.',
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    throw new RemoteOkError({
      source: REMOTE_OK,
      code: 'invalid_response',
      message: 'Remote OK returned malformed JSON.',
    });
  }
  return parseRemoteOk(payload);
}

function feedItems(payload: unknown, source: JobSource): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    for (const key of ['jobs', 'data', 'results']) {
      if (Array.isArray(payload[key])) {
        return (payload[key] as unknown[]).filter(isRecord);
      }
    }
  }
  throw new JobsFeedError({
    source,
    code: 'invalid_response',
    message: `${source} returned data in an unexpected format.`,
  });
}

async function loadFallbackFeed(source: JobSource, endpoint: string): Promise<RemoteJob[]> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(FALLBACK_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new JobsFeedError({
      source,
      code: timedOut ? 'timeout' : 'network',
      message: timedOut
        ? `${source} did not respond before the request timed out.`
        : `Could not connect to ${source}.`,
    });
  }

  if (!response.ok) {
    throw new JobsFeedError({
      source,
      code: 'upstream_http',
      message: `${source} returned HTTP ${response.status}.`,
      status: response.status,
    });
  }

  let body: string;
  try {
    body = await response.text();
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new JobsFeedError({
      source,
      code: timedOut ? 'timeout' : 'network',
      message: timedOut
        ? `${source} did not finish sending the response before the request timed out.`
        : `The ${source} response could not be read.`,
    });
  }
  if (!body.trim()) {
    throw new JobsFeedError({
      source,
      code: 'invalid_response',
      message: `${source} returned an empty response.`,
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    throw new JobsFeedError({
      source,
      code: 'invalid_response',
      message: `${source} returned malformed JSON.`,
    });
  }
  return feedItems(payload, source).flatMap((item) => {
    const job = normalizeJob(item, source);
    return job ? [job] : [];
  });
}

function deduplicateAndSort(jobs: RemoteJob[]): RemoteJob[] {
  const seen = new Set<string>();
  return jobs
    .sort((left, right) => {
      if (!left.publishedAt) return right.publishedAt ? 1 : 0;
      if (!right.publishedAt) return -1;
      return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
    })
    .filter((job) => {
      const key = `${normalize(job.title)}|${normalize(job.company)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function loadJobs(): Promise<JobsPayload> {
  let remoteOkJobs: RemoteJob[] = [];
  let remoteOkFailed = false;
  let remoteOkDiagnostic: JobsDiagnostic | undefined;
  try {
    remoteOkJobs = await loadRemoteOk();
  } catch (error) {
    remoteOkFailed = true;
    if (error instanceof RemoteOkError) {
      remoteOkDiagnostic = error.diagnostic;
      console.warn('Remote OK jobs feed failed.', error.diagnostic);
    } else {
      console.warn('Remote OK jobs feed failed with an unexpected error.');
      remoteOkDiagnostic = {
        source: REMOTE_OK,
        code: 'service_error',
        message: 'Remote OK is temporarily unavailable.',
      };
    }
  }

  if (remoteOkJobs.length > 0) {
    return { jobs: deduplicateAndSort(remoteOkJobs), error: false, diagnostics: [] };
  }

  const fallbackFeeds = [
    { source: JOBICY, request: loadFallbackFeed(JOBICY, 'https://jobicy.com/api/v2/remote-jobs') },
    { source: HIMALAYAS, request: loadFallbackFeed(HIMALAYAS, 'https://himalayas.app/jobs/api') },
  ];
  const fallbackResults = await Promise.allSettled(fallbackFeeds.map(({ request }) => request));
  const diagnostics: JobsDiagnostic[] = [];
  if (remoteOkDiagnostic) diagnostics.push(remoteOkDiagnostic);
  const jobs = fallbackResults.flatMap((result, index): RemoteJob[] => {
    if (result.status === 'fulfilled') return result.value;
    if (result.reason instanceof JobsFeedError) {
      console.warn(`${result.reason.diagnostic.source} jobs feed failed.`, result.reason.diagnostic);
      diagnostics.push(result.reason.diagnostic);
    } else {
      console.warn('A fallback jobs feed failed with an unexpected error.');
      diagnostics.push({
        source: fallbackFeeds[index].source,
        code: 'service_error',
        message: 'A fallback jobs feed is temporarily unavailable.',
      });
    }
    return [];
  });

  const allFeedsFailed = remoteOkFailed && fallbackResults.every(
    (result) => result.status === 'rejected'
  );

  return {
    jobs: deduplicateAndSort(jobs),
    error: allFeedsFailed,
    diagnostics: allFeedsFailed ? diagnostics : [],
  };
}
