const FEED_URLS: Record<string, string> = {
  uk: 'https://www.gov.uk/government/organisations/uk-visas-and-immigration.atom',
  us: 'https://www.uscis.gov/news/rss-feed/22984',
};

const REQUEST_TIMEOUT_MS = 12_000;
const USER_AGENT = 'Mozilla/5.0 (compatible; Civiohub/1.0; +https://civiohub.com)';

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .trim();
}

function getTagValue(xml: string, tagName: string): string {
  const escapedName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<(?:(?:[\\w.-]+):)?${escapedName}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${escapedName}\\s*>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function getLink(entry: string): string {
  const links = Array.from(entry.matchAll(/<(?:[\w.-]+:)?link\b([^>]*)\/?\s*>/gi));
  const alternate = links.find(([, attributes]) => /\brel=["']alternate["']/i.test(attributes));
  const match = alternate ?? links[0];
  if (match) {
    const href = match[1].match(/\bhref=["']([^"']+)["']/i);
    if (href) return decodeXml(href[1]);
  }
  return getTagValue(entry, 'link');
}

function parseFeed(xml: string): { status: 'ok'; items: Array<Record<string, string>> } {
  const entries = Array.from(xml.matchAll(/<(?:entry|item)\b[^>]*>([\s\S]*?)<\/(?:entry|item)\s*>/gi));
  const items = entries.slice(0, 8).map(([, entry]) => ({
    title: getTagValue(entry, 'title'),
    link: getLink(entry),
    pubDate: getTagValue(entry, 'pubDate') || getTagValue(entry, 'published') || getTagValue(entry, 'updated'),
    description: getTagValue(entry, 'description') || getTagValue(entry, 'summary') || getTagValue(entry, 'content'),
  }));
  return { status: 'ok', items };
}

export async function loadPolicyFeed(sourceId: string | null): Promise<unknown> {
  const feedUrl = sourceId ? FEED_URLS[sourceId] : undefined;
  if (!feedUrl) {
    throw new Error('Unknown policy feed source.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Policy feed returned HTTP ${response.status}.`);
    }
    return parseFeed(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}
