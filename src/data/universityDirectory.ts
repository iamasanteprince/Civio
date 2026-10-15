import type { ApiUniversity } from '@/types';
import { loadGlobalUniversityIndex } from './globalUniversityIndex';

export async function searchGlobalUniversities(
  query: string,
  signal?: AbortSignal
): Promise<ApiUniversity[]> {
  const universities = await loadGlobalUniversityIndex();
  if (signal?.aborted) throw new DOMException('The search was cancelled.', 'AbortError');

  const terms = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return universities;

  return universities.filter((university) => {
    const searchableText = [
      university.name,
      university.country,
      university.alpha_two_code,
      university.state_province ?? '',
    ]
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return terms.every((term) => searchableText.includes(term));
  });
}

export function getBaseWebsiteUrl(candidate: string): string {
  try {
    const url = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return '';
    url.protocol = 'https:';
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

export function getUniversityWebsite(university: ApiUniversity): string {
  const candidates = [...university.domains, ...university.web_pages];
  for (const candidate of candidates) {
    const website = getBaseWebsiteUrl(candidate);
    if (website) return website;
  }
  return '';
}

export function getAdmissionsSearchUrl(universityName: string): string {
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', `${universityName} admissions international`);
  return url.href;
}
