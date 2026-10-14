import type { ApiUniversity } from '@/types';

const DIRECTORY_URL = 'https://universities.hipolabs.com/search';

function isApiUniversity(value: unknown): value is ApiUniversity {
  if (!value || typeof value !== 'object') return false;
  const university = value as Record<string, unknown>;
  return (
    typeof university.name === 'string' &&
    typeof university.country === 'string' &&
    typeof university.alpha_two_code === 'string' &&
    Array.isArray(university.web_pages) &&
    university.web_pages.every((page) => typeof page === 'string') &&
    Array.isArray(university.domains) &&
    university.domains.every((domain) => typeof domain === 'string')
  );
}

export async function searchGlobalUniversities(
  name: string,
  signal?: AbortSignal
): Promise<ApiUniversity[]> {
  const url = new URL(DIRECTORY_URL);
  url.searchParams.set('name', name);
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Global university directory returned HTTP ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Global university directory returned an unexpected response.');
  }
  return data.filter(isApiUniversity);
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
