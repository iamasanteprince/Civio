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

export function getUniversityWebsite(university: ApiUniversity): string {
  const candidates = [...university.web_pages, ...university.domains.map((domain) => `https://${domain}`)];
  return candidates.find((candidate) => {
    try {
      const url = new URL(candidate);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }) ?? '';
}
