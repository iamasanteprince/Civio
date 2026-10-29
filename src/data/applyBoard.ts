export const APPLYBOARD_PARTNER_URL =
  'https://app.applyboard.com/partners/2369466/invite-student';
export const APPLYBOARD_EMBED_SCRIPT =
  'https://app.applyboard.com/assets/embedded_search.js';
export const APPLYBOARD_HOST = 'https://app.applyboard.com';
export const APPLYBOARD_RP_REF = '94595';

const PARTNER_COUNTRY_KEYS = new Set([
  'australia',
  'au',
  'canada',
  'ca',
  'ireland',
  'ie',
  'republic of ireland',
  'united kingdom',
  'uk',
  'gb',
  'great britain',
  'united states',
  'united states of america',
  'usa',
  'us',
]);

function normalizeCountryKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isApplyBoardPartnerCountry(country: string, alphaTwo?: string | null): boolean {
  return PARTNER_COUNTRY_KEYS.has(normalizeCountryKey(country)) ||
    PARTNER_COUNTRY_KEYS.has(normalizeCountryKey(alphaTwo ?? ''));
}

export function withPartnerFlag<T extends { is_partner?: boolean; country: string; alpha_two_code?: string }>(
  school: T
): T & { is_partner: boolean } {
  return {
    ...school,
    is_partner: typeof school.is_partner === 'boolean'
      ? school.is_partner
      : isApplyBoardPartnerCountry(school.country, school.alpha_two_code),
  };
}

export function prioritizePartners<T extends { is_partner?: boolean }>(matchedSchools: T[]): T[] {
  const ranked = [...matchedSchools];
  ranked.sort((a, b) => Number(b.is_partner) - Number(a.is_partner));
  return ranked;
}
