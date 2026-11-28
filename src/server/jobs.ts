import type { JobSource, RemoteJob } from '../types';

const REMOTE_OK_URL = 'https://remoteok.com/api';
const REQUEST_TIMEOUT_MS = 10_000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CivioHubJobs/1.0)';
const SOURCE: JobSource = 'Remote OK';

const REGION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'United States', pattern: /\b(?:us|usa|u s|u s a|united states|america)\b/i },
  { label: 'Canada', pattern: /\bcanada\b/i },
  { label: 'United Kingdom', pattern: /\b(?:uk|u k|united kingdom|britain|england|scotland|wales)\b/i },
  { label: 'Europe', pattern: /\b(?:europe|european)\b/i },
  { label: 'Worldwide', pattern: /\b(?:worldwide|world wide|global|anywhere)\b/i },
];

export interface JobsDiagnostic {
  source: 'Remote OK';
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
    if (typeof entry !== 'string') return [];
    const clean = plainText(entry);
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

function parseRemoteOk(payload: unknown): RemoteJob[] {
  if (!Array.isArray(payload)) {
    throw new RemoteOkError({
      source: SOURCE,
      code: 'invalid_response',
      message: 'Remote OK returned data in an unexpected format.',
    });
  }

  const jobs = payload.filter(isRecord);
  return jobs.flatMap((item): RemoteJob[] => {
    const title = plainText(text(item.position));
    const company = plainText(text(item.company));
    const url = normalizeHttpsUrl(item.url);
    if (!title || !company || !url) return [];

    const tags = stringArray(item.tags);
    const description = text(item.description);
    const cleanDescription = plainText(description);
    const locationText = plainText(text(item.location));
    const regions = regionsFrom([locationText, ...tags, cleanDescription]);
    const location = locationText || (regions.length ? regions.join(', ') : 'Remote');
    const category = plainText(text(item.category)) || tags[0] || 'Remote Jobs';
    const companyUrl = normalizeHttpsUrl(item.apply_url);
    const id = text(item.id) || text(item.slug) || `${normalize(company)}-${normalize(title)}`;

    return [{
      id: `remoteok:${id}`,
      title,
      company,
      source: SOURCE,
      category,
      location,
      regions,
      keywords: [...new Set([...tags, ...regions, ...regionKeywords(regions)])],
      url,
      ...(companyUrl ? { companyUrl } : {}),
      publishedAt: dateValue(item.date) ?? dateValue(item.epoch),
      excerpt: excerpt(description),
    }];
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
      source: SOURCE,
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
      source: SOURCE,
      code,
      message,
      status: response.status,
    });
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new RemoteOkError({
      source: SOURCE,
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
      source: SOURCE,
      code: timedOut ? 'timeout' : 'network',
      message: timedOut
        ? 'Remote OK did not finish sending the response before the request timed out.'
        : 'The Remote OK response could not be read.',
    });
  }
  if (!body.trim()) {
    throw new RemoteOkError({
      source: SOURCE,
      code: 'invalid_response',
      message: 'Remote OK returned an empty response.',
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    throw new RemoteOkError({
      source: SOURCE,
      code: 'invalid_response',
      message: 'Remote OK returned malformed JSON.',
    });
  }
  return parseRemoteOk(payload);
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
  const results = await Promise.allSettled([loadRemoteOk()]);
  const diagnostics = results.flatMap((result): JobsDiagnostic[] => {
    if (result.status === 'fulfilled') return [];
    if (result.reason instanceof RemoteOkError) {
      console.warn('Remote OK jobs feed failed.', result.reason.diagnostic);
      return [result.reason.diagnostic];
    }
    console.warn('Remote OK jobs feed failed with an unexpected error.');
    return [{
      source: SOURCE,
      code: 'service_error',
      message: 'Remote OK is temporarily unavailable.',
    }];
  });
  const jobs = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);

  return {
    jobs: deduplicateAndSort(jobs),
    error: diagnostics.length > 0,
    diagnostics,
  };
}
