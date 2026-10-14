import globalUniversitiesUrl from './globalUniversities.json?url';
import type { ApiUniversity } from '@/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseUniversity(value: unknown): ApiUniversity | null {
  if (!isRecord(value)) return null;
  const { name, country, alpha_two_code: countryCode } = value;
  if (typeof name !== 'string' || typeof country !== 'string' || typeof countryCode !== 'string') {
    return null;
  }

  const webPages = Array.isArray(value.web_pages)
    ? value.web_pages.filter((page): page is string => typeof page === 'string')
    : [];
  const domains = Array.isArray(value.domains)
    ? value.domains.filter((domain): domain is string => typeof domain === 'string')
    : [];
  const stateProvince = value['state-province'];

  return {
    name,
    country,
    alpha_two_code: countryCode,
    web_pages: webPages,
    domains,
    state_province: typeof stateProvince === 'string' ? stateProvince : null,
  };
}

let universityIndexPromise: Promise<ApiUniversity[]> | null = null;

export function loadGlobalUniversityIndex(): Promise<ApiUniversity[]> {
  if (!universityIndexPromise) {
    universityIndexPromise = fetch(globalUniversitiesUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`The local university directory could not be loaded (HTTP ${response.status}).`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('The local university directory has an unexpected format.');
        }

        const uniqueUniversities = new Map<string, ApiUniversity>();
        for (const record of data) {
          const university = parseUniversity(record);
          if (!university) continue;
          const key = `${normalizeName(university.name)}|${normalizeName(university.country)}`;
          if (!uniqueUniversities.has(key)) uniqueUniversities.set(key, university);
        }

        return [...uniqueUniversities.values()];
      })
      .catch((error: unknown) => {
        universityIndexPromise = null;
        throw error;
      });
  }

  return universityIndexPromise;
}
