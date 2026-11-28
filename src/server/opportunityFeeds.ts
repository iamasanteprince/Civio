import type { FundingType, Opportunity, OpportunityCategory, TargetAudience } from '../types/index.js';

interface FeedSource {
  id: string;
  label: string;
  url: string;
  allowedHosts: string[];
}

export interface OpportunityFeedSourceStatus {
  id: string;
  label: string;
  status: 'ok' | 'error';
}

const FEED_SOURCES: FeedSource[] = [
  {
    id: 'opportunity-desk',
    label: 'Opportunity Desk',
    url: 'https://www.opportunitydesk.org/feed/',
    allowedHosts: ['opportunitydesk.org'],
  },
  {
    id: 'opportunities-for-africans',
    label: 'Opportunities for Africans',
    url: 'https://www.opportunitiesforafricans.com/feed/',
    allowedHosts: ['opportunitiesforafricans.com'],
  },
  {
    id: 'ukri-opportunities',
    label: 'UK Research and Innovation',
    url: 'https://www.ukri.org/opportunity/feed/',
    allowedHosts: ['ukri.org'],
  },
];

const REQUEST_TIMEOUT_MS = 12_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface ParsedFeedItem {
  title: string;
  link: string;
  publishedAt: string | null;
  description: string;
}

export interface OpportunityFeedPayload {
  status: 'ok';
  items: Opportunity[];
  sources: OpportunityFeedSourceStatus[];
  checkedAt: string;
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => decodeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => decodeCodePoint(parseInt(code, 16)))
    .trim();
}

function decodeCodePoint(code: number): string {
  return code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
    ? String.fromCodePoint(code)
    : '';
}

function stripMarkup(value: string): string {
  return decodeXml(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagValue(xml: string, tagName: string): string {
  const escapedName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(
    `<(?:(?:[\\w.-]+):)?${escapedName}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${escapedName}\\s*>`,
    'i',
  ));
  return match ? match[1] : '';
}

function getLink(entry: string): string {
  const links = Array.from(entry.matchAll(/<(?:[\w.-]+:)?link\b([^>]*)\/?\s*>/gi));
  const alternate = links.find(([, attributes]) => /\brel=["']alternate["']/i.test(attributes));
  const match = alternate ?? links[0];
  if (match) {
    const href = match[1].match(/\bhref=["']([^"']+)["']/i);
    if (href) return decodeXml(href[1]);
  }
  return stripMarkup(getTagValue(entry, 'link'));
}

function parsePublishedAt(value: string): string | null {
  const parsed = new Date(stripMarkup(value));
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function parseFeed(xml: string): ParsedFeedItem[] {
  return Array.from(xml.matchAll(/<(?:entry|item)\b[^>]*>([\s\S]*?)<\/(?:entry|item)\s*>/gi))
    .slice(0, 12)
    .map(([, entry]) => ({
      title: stripMarkup(getTagValue(entry, 'title')).slice(0, 240),
      link: getLink(entry),
      publishedAt: parsePublishedAt(
        getTagValue(entry, 'pubDate') ||
        getTagValue(entry, 'published') ||
        getTagValue(entry, 'updated'),
      ),
      description: stripMarkup(
        getTagValue(entry, 'description') ||
        getTagValue(entry, 'summary') ||
        getTagValue(entry, 'content'),
      ).slice(0, 500),
    }))
    .filter((item) => item.title && item.link);
}

function classifyCategory(text: string): OpportunityCategory {
  if (/\bintern(ship)?s?\b/i.test(text)) return 'Tech & Business Internship';
  if (/\b(summit|conference|forum|congress)\b/i.test(text)) return 'Youth & Civic Summit';
  if (/\bfellow(ship|ships|ship program(me)?)\b/i.test(text)) return 'Fellowship';
  return 'Scholarship & Education';
}

function classifyFunding(text: string): FundingType {
  if (/\b(virtual|online|remote)\b/i.test(text)) return 'Virtual / Online';
  if (/\bfully funded\b/i.test(text)) return 'Fully Funded';
  if (/\b(partially funded|partial funding)\b/i.test(text)) return 'Partial Funding';
  return 'Funding details vary';
}

function classifyAudience(text: string): TargetAudience {
  if (/\b(africa|african)\b/i.test(text)) return 'African Youth';
  if (/\b(developing (countries|economies)|low[- ]income countries|global south)\b/i.test(text)) {
    return 'Developing Economies';
  }
  if (/\b(international|global|worldwide|all countries|any nationality)\b/i.test(text)) {
    return 'Global / All Countries';
  }
  return 'Eligibility varies';
}

function toOpportunity(source: FeedSource, item: ParsedFeedItem): Opportunity | null {
  try {
    const url = new URL(item.link);
    if (
      url.protocol !== 'https:' ||
      !source.allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
    ) return null;

    const text = `${item.title} ${item.description}`;
    const keywords = ['scholarship', 'education', 'leadership', 'research', 'technology', 'climate', 'policy']
      .filter((keyword) => text.toLowerCase().includes(keyword));

    return {
      id: `live:${source.id}:${url.href}`,
      title: item.title,
      organization: source.label,
      category: classifyCategory(text),
      fundingType: classifyFunding(text),
      targetAudience: classifyAudience(text),
      region: 'See official listing',
      description: item.description || 'Open the source listing for full opportunity details.',
      keywords: keywords.length ? keywords : ['education', 'opportunities'],
      deadline: 'See official listing',
      link: url.href,
      eligibility: 'Eligibility varies; confirm requirements on the official listing.',
      benefits: 'Funding and benefits vary; confirm details on the official listing.',
      isLive: true,
      source: source.label,
      publishedAt: item.publishedAt,
    };
  } catch {
    return null;
  }
}

async function loadSource(source: FeedSource): Promise<Opportunity[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${source.label} returned HTTP ${response.status}.`);
    return parseFeed(await response.text())
      .map((item) => toOpportunity(source, item))
      .filter((item): item is Opportunity => item !== null);
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadOpportunityFeeds(): Promise<OpportunityFeedPayload> {
  const results = await Promise.allSettled(FEED_SOURCES.map(loadSource));
  const sources: OpportunityFeedSourceStatus[] = [];
  const items: Opportunity[] = [];

  results.forEach((result, index) => {
    const source = FEED_SOURCES[index];
    sources.push({
      id: source.id,
      label: source.label,
      status: result.status === 'fulfilled' ? 'ok' : 'error',
    });
    if (result.status === 'fulfilled') items.push(...result.value);
  });

  if (results.every((result) => result.status === 'rejected')) {
    throw new Error('All opportunity feeds are unavailable.');
  }

  const uniqueItems = Array.from(
    new Map(items.map((item) => [item.link, item])).values(),
  ).slice(0, 30);

  return {
    status: 'ok',
    items: uniqueItems,
    sources,
    checkedAt: new Date().toISOString(),
  };
}
