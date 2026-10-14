export type VisaDestination = 'us' | 'canada' | 'uk' | 'germany';

export interface VisaFact {
  label: string;
  value: string;
}

export interface VisaSource {
  label: string;
  url: string;
}

export interface VisaIntelRecord {
  id: VisaDestination;
  country: string;
  filterLabel: string;
  title: string;
  flag: string;
  category: string;
  facts: VisaFact[];
  sources: VisaSource[];
  notes: string[];
}

export const VISA_COUNTRY_FILTERS = [
  { id: 'all', label: 'All Countries' },
  { id: 'us', label: 'United States 🇺🇸' },
  { id: 'canada', label: 'Canada 🇨🇦' },
  { id: 'uk', label: 'United Kingdom 🇬🇧' },
  { id: 'germany', label: 'Germany / Schengen 🇩🇪' },
] as const;

export const VISA_INTEL: VisaIntelRecord[] = [
  {
    id: 'us',
    country: 'United States',
    filterLabel: 'United States 🇺🇸',
    title: 'F-1 Student Visa',
    flag: '🇺🇸',
    category: 'US Student Visa',
    facts: [
      { label: 'Proof of funds', value: 'Show funds for the first academic year based on the costs recorded on your Form I-20. There is no single federal $25,000–$45,000 minimum; use your school’s current I-20 amount.' },
      { label: 'Fees', value: 'I-901 SEVIS fee: $350 for most F-1 students. Visa application (MRV) fee: $185 for most non-petition-based applications.' },
      { label: 'Work rights', value: 'On-campus work is generally limited to 20 hours per week while school is in session. Eligible students may receive up to 12 months of post-completion OPT; qualifying STEM graduates may apply for a 24-month extension.' },
      { label: 'English proficiency', value: 'A school may assess English proficiency using its own standards and record the basis on the I-20. This does not exempt an applicant from consular review or interview questions.' },
    ],
    sources: [
      { label: 'Student visa guidance', url: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html' },
      { label: 'I-901 SEVIS fee', url: 'https://www.ice.gov/sevis/i901' },
      { label: 'Visa fee schedule', url: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html' },
      { label: 'OPT guidance', url: 'https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students' },
    ],
    notes: ['The school’s I-20 and consular instructions control your individual financial evidence. Work authorization is conditional; check current USCIS and school guidance.'],
  },
  {
    id: 'canada',
    country: 'Canada',
    filterLabel: 'Canada 🇨🇦',
    title: 'Study Permit & PAL',
    flag: '🇨🇦',
    category: 'Canada Study Permit',
    facts: [
      { label: 'Proof of funds', value: 'For one applicant outside Quebec, the current published living-expense amount is CAD $22,895 for one year, in addition to first-year tuition and transportation. IRCC updates this amount; verify it for your application date.' },
      { label: 'Fees', value: 'Study permit processing fee: CAD $150 per applicant. Biometrics fee: CAD $85 per applicant when required; family biometrics fees may be capped. Check IRCC’s current fee table before paying.' },
      { label: 'Provincial Attestation Letter', value: 'Most study-permit applicants need a PAL/TAL unless they qualify for an exemption. For the 2026 cap year, a PAL/TAL is generally valid through December 31, 2026; a PAL from a prior cap year cannot be reused. Confirm your case with the province or territory and institution.' },
      { label: 'Work rights', value: 'Eligible students may work up to 24 hours per week off campus during regular academic sessions. PGWP length depends on program and eligibility; some graduates may qualify for up to 3 years.' },
      { label: 'Financial evidence', value: 'Use acceptable evidence such as bank statements, scholarship or sponsor documents, or a GIC where applicable. The living-expense minimum is not a substitute for tuition and travel costs.' },
    ],
    sources: [
      { label: 'IRCC proof of funds', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html' },
      { label: 'IRCC application fees', url: 'https://ircc.canada.ca/english/information/fees/fees.asp' },
      { label: 'PAL/TAL guidance', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/provincial-attestation-letter.html' },
      { label: 'Off-campus work', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/work-off-campus.html' },
      { label: 'Post-graduation work permit', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/about.html' },
    ],
    notes: ['The CAD $22,895 figure is for one applicant outside Quebec and is subject to IRCC updates. Quebec and family applications have different requirements.'],
  },
  {
    id: 'uk',
    country: 'United Kingdom',
    filterLabel: 'United Kingdom 🇬🇧',
    title: 'Student Route',
    flag: '🇬🇧',
    category: 'UK Student Visa',
    facts: [
      { label: 'Maintenance funds', value: '£1,529/month in London (£13,761 for 9 months) or £1,171/month outside London (£10,539 for 9 months). Funds generally must be held for 28 consecutive days, with the period ending within 31 days of application.' },
      { label: 'Fees', value: 'Student visa application fee: £558. Immigration Health Surcharge for students: £776 per year; the amount charged depends on visa duration.' },
      { label: 'English proficiency', value: 'A licensed sponsor may assess English proficiency by an accepted method and record it on the CAS. WAEC or English-medium study is not an automatic IELTS or UKVI-test waiver; confirm the CAS and current rules.' },
      { label: 'Work and post-study route', value: 'Eligible degree-level students may generally work up to 20 hours per week during term time, subject to the conditions on their permission. Graduate Route applications made by 31 December 2026 may receive 2 years; applications from 1 January 2027 receive 18 months (doctoral graduates: 3 years).' },
    ],
    sources: [
      { label: 'Student visa funds', url: 'https://www.gov.uk/student-visa/money' },
      { label: 'Student visa application', url: 'https://www.gov.uk/student-visa' },
      { label: 'Healthcare surcharge', url: 'https://www.gov.uk/healthcare-immigration-application/how-much-pay' },
      { label: 'English language requirements', url: 'https://www.gov.uk/student-visa/knowledge-of-english' },
      { label: 'Graduate visa', url: 'https://www.gov.uk/graduate-visa' },
    ],
    notes: ['Evidence exemptions and permitted deductions may apply. Confirm the latest amount and CAS details with UKVI and your licensed sponsor.'],
  },
  {
    id: 'germany',
    country: 'Germany / Schengen',
    filterLabel: 'Germany / Schengen 🇩🇪',
    title: 'Study Visa & Sperrkonto',
    flag: '🇩🇪',
    category: 'Germany Study Visa',
    facts: [
      { label: 'Blocked account', value: 'The commonly published standard is €11,904 for one year (€992/month). Visa missions may update their required amount; confirm the current figure with the German mission handling your application before funding an account.' },
      { label: 'Visa fee', value: 'The standard national visa fee is €75. Reductions or exemptions may apply in specific cases; confirm the amount with the German mission handling your application.' },
      { label: 'Tuition', value: 'Many public universities charge no general tuition, but semester contributions apply and tuition exceptions exist by state, institution, program, and student status.' },
      { label: 'Work rights', value: 'International students may generally work up to 140 full days or 280 half days per year, subject to current rules and any applicable alternatives.' },
      { label: 'After graduation', value: 'Graduates of German higher-education institutions may be eligible for an 18-month residence permit to seek qualified employment.' },
    ],
    sources: [
      { label: 'Study visa guidance', url: 'https://www.make-it-in-germany.com/en/visa-residence/types/studying' },
      { label: 'German Foreign Office visa information', url: 'https://www.auswaertiges-amt.de/en/visa-service' },
      { label: 'DAAD: financing your studies', url: 'https://www.daad.de/en/studying-in-germany/living-in-germany/finances/' },
    ],
    notes: ['Blocked-account rules and the permitted form of financial proof can differ by mission. Public-university tuition is not universally free.'],
  },
];

export const VISA_CALCULATOR_LIVING_FUNDS: Record<VisaDestination, number> = {
  us: 0,
  canada: 22895,
  uk: 13761,
  germany: 11904,
};

export function getVisaIntelForQuery(query: string): VisaIntelRecord | undefined {
  const normalized = query.toLowerCase();
  if (/\b(germany|german|blocked account|sperrkonto)\b/.test(normalized)) return VISA_INTEL.find((item) => item.id === 'germany');
  if (/\b(canada|canadian|study permit|pal|provincial attestation)\b/.test(normalized)) return VISA_INTEL.find((item) => item.id === 'canada');
  if (/\b(uk|britain|united kingdom|cas|graduate route|london maintenance)\b/.test(normalized)) return VISA_INTEL.find((item) => item.id === 'uk');
  if (/\b(united states|u\.s\.|usa|f-1|f1|sevis|i-20|opt)\b/.test(normalized)) return VISA_INTEL.find((item) => item.id === 'us');
  return undefined;
}
