import { useState, useMemo, useEffect } from 'react';
import {
  ExternalLink,
  GraduationCap,
  DollarSign,
  Globe,
  Languages,
  ClipboardCheck,
  Calendar,
  CheckCircle,
  XCircle,
  School,
  Building2,
  Search,
  Filter,
} from 'lucide-react';
import type { University, FeeWaiverDetail, ApiUniversity } from '@/types';
import { universities, countries, degreeLevels } from '@/data/universities';
import { loadGlobalUniversityIndex } from '@/data/globalUniversityIndex';
import { getAdmissionsSearchUrl, getBaseWebsiteUrl, getUniversityWebsite } from '@/data/universityDirectory';
import SkeletonCards from '@/components/SkeletonCards';

const FEE_WAIVER_STYLES: Record<FeeWaiverDetail, { banner: string }> = {
  'always-free': { banner: 'border-emerald-800 text-emerald-300' },
  'info-session': { banner: 'border-emerald-800 text-emerald-300' },
  'auto-international': { banner: 'border-emerald-800 text-emerald-300' },
  'upon-request': { banner: 'border-emerald-800 text-emerald-300' },
};

const FEE_WAIVER_LABELS: Record<FeeWaiverDetail, string> = {
  'always-free': '$0 App Fee (Always Free)',
  'info-session': 'Waiver Code Available via Info Session',
  'auto-international': 'Automatic Waiver for International Applicants',
  'upon-request': 'Waiver Upon Request',
};

const INTEL_ITEMS = [
  { key: 'languageTesting' as const, icon: Languages, label: 'Language Testing' },
  { key: 'standardizedTests' as const, icon: ClipboardCheck, label: 'Standardized Tests' },
  { key: 'keyIntakes' as const, icon: Calendar, label: 'Key Intakes' },
  { key: 'deadlines' as const, icon: Globe, label: 'Deadlines' },
];

type SearchResult =
  | { kind: 'local'; university: University }
  | { kind: 'api'; apiUni: ApiUniversity };

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findLocalMatch(apiUni: ApiUniversity): University | undefined {
  const apiName = normalizeSearchText(apiUni.name);
  return universities.find((u) => {
    const localName = normalizeSearchText(u.name);
    const localShortName = normalizeSearchText(u.shortName);
    return localName === apiName ||
      (localName.length > 8 && (localName.includes(apiName) || apiName.includes(localName))) ||
      (localShortName.length > 3 && localShortName === apiName);
  });
}

function isWithinOneEdit(query: string, candidate: string): boolean {
  if (Math.abs(query.length - candidate.length) > 1) return false;

  let queryIndex = 0;
  let candidateIndex = 0;
  let edits = 0;
  while (queryIndex < query.length && candidateIndex < candidate.length) {
    if (query[queryIndex] === candidate[candidateIndex]) {
      queryIndex++;
      candidateIndex++;
      continue;
    }
    edits++;
    if (edits > 1) return false;
    if (query.length > candidate.length) queryIndex++;
    else if (query.length < candidate.length) candidateIndex++;
    else {
      queryIndex++;
      candidateIndex++;
    }
  }
  if (queryIndex < query.length || candidateIndex < candidate.length) edits++;
  return edits <= 1;
}

function scoreUniversityMatch(university: ApiUniversity, query: string): number | null {
  if (!query) return 0;
  const name = normalizeSearchText(university.name);
  const country = normalizeSearchText(university.country);
  const stateProvince = normalizeSearchText(university.state_province ?? '');
  const searchableFields = [name, country, stateProvince];
  if (searchableFields.some((field) => field.includes(query))) {
    if (name.startsWith(query)) return 120;
    if (name.includes(query)) return 110;
    return 90;
  }

  const queryTokens = query.split(' ').filter(Boolean);
  const fieldTokens = searchableFields.map((field) => field.split(' ').filter(Boolean));
  let nameMatches = 0;
  for (const token of queryTokens) {
    let matched = false;
    for (let fieldIndex = 0; fieldIndex < fieldTokens.length; fieldIndex++) {
      if (fieldTokens[fieldIndex].some((word) =>
        word.includes(token) ||
        (word.length >= 3 && token.includes(word)) ||
        (token.length >= 5 && isWithinOneEdit(token, word))
      )) {
        if (fieldIndex === 0) nameMatches++;
        matched = true;
        break;
      }
    }
    if (!matched) return null;
  }
  return nameMatches === queryTokens.length ? 80 : 60;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SchoolCard({ school }: { school: University }) {
  const feeStyle = FEE_WAIVER_STYLES[school.feeWaiverDetail];
  const websiteUrl = getBaseWebsiteUrl(school.portalUrl);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition-colors duration-200 hover:border-slate-700">
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
            <School className="h-5 w-5 text-slate-300" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold leading-snug text-white">{school.name}</h3>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-400">
              <Globe className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" strokeWidth={1.75} />
              <span>{school.city}, {school.country}</span>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
            <Building2 className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
            {school.type}
          </span>
          {school.degreeLevels.map((level) => (
            <span key={level} className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
              <GraduationCap className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
              {level}
            </span>
          ))}
        </div>

        <div className={`mb-4 flex items-start gap-3 rounded-lg border bg-emerald-950/20 px-3.5 py-3 ${feeStyle.banner}`}>
          <DollarSign className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{FEE_WAIVER_LABELS[school.feeWaiverDetail]}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{school.feeNote}</p>
          </div>
        </div>

        <div className="mb-5">
          {school.englishWaiver.available ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-800 bg-emerald-950/20 px-3.5 py-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <p className="mb-1 text-xs font-semibold text-emerald-300">English proficiency waiver available</p>
                <p className="text-xs leading-relaxed text-slate-400">{school.englishWaiver.detail}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {school.englishWaiver.acceptedProofs.map((proof) => (
                    <span key={proof} className="inline-flex items-center rounded-md border border-emerald-900 bg-emerald-950/40 px-2 py-1 text-[10px] font-medium text-emerald-200">{proof}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-3">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <p className="mb-1 text-xs font-semibold text-slate-300">No English proficiency waiver</p>
                <p className="text-xs leading-relaxed text-slate-500">{school.englishWaiver.detail}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4">
          {INTEL_ITEMS.map(({ key, icon: Icon, label }) => (
            <div key={key} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="text-sm leading-relaxed text-slate-300">{school.intel[key]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-1 grid grid-cols-3 gap-3 border-t border-slate-800 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Ranking</p>
            <p className="mt-1 text-xs font-medium text-slate-300">{school.ranking}</p>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Acceptance</p>
            <p className="mt-1 text-xs font-medium text-slate-300">{school.acceptanceRate}</p>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Est.</p>
            <p className="mt-1 text-xs font-medium text-slate-300">{school.established}</p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex gap-2 border-t border-slate-800 p-4">
        {websiteUrl && (
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-500">
            Visit Website <ExternalLink className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          </a>
        )}
        <a href={getAdmissionsSearchUrl(school.name)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:bg-slate-800">
          Search Admissions <ExternalLink className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
        </a>
      </div>
    </div>
  );
}

function ApiSchoolCard({ apiUni }: { apiUni: ApiUniversity }) {
  const portalUrl = getUniversityWebsite(apiUni);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition-colors duration-200 hover:border-slate-700">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
            <Building2 className="h-5 w-5 text-slate-300" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold leading-snug text-white">{apiUni.name}</h3>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-400">
              <Globe className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" strokeWidth={1.75} />
              <span>{apiUni.country}</span>
              <span className="inline-flex items-center justify-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">{apiUni.alpha_two_code}</span>
            </div>
            {apiUni.state_province && (
              <p className="mt-1 text-xs text-slate-500">{apiUni.state_province}</p>
            )}
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
            <Globe className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
            Directory record
          </span>
          <span className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
            Application fee: Check institution
          </span>
          <span className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
            English testing: Not indexed
          </span>
        </div>

        <div className="mb-5 rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-3">
          <p className="text-xs leading-relaxed text-slate-400">
            Directory records do not include verified fee, deadline, or language-testing requirements. Confirm current details with the institution.
          </p>
        </div>

        {apiUni.domains.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {apiUni.domains.slice(0, 3).map((d) => (
              <span key={d} className="inline-flex items-center rounded-md bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 text-[10px] font-mono text-slate-400">{d}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-2 border-t border-slate-800 p-4">
        {portalUrl && (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-500">
            Visit Website <ExternalLink className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          </a>
        )}
        <a href={getAdmissionsSearchUrl(apiUni.name)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:bg-slate-800">
          Search Admissions <ExternalLink className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
        </a>
      </div>
    </div>
  );
}

export default function SchoolHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleResultCount, setVisibleResultCount] = useState(30);
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedDegree, setSelectedDegree] = useState('All');
  const [freeOnly, setFreeOnly] = useState(false);
  const [ieltsExemptOnly, setIeltsExemptOnly] = useState(false);
  const [globalUniversities, setGlobalUniversities] = useState<ApiUniversity[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 250);
  const isSearching = debouncedQuery.trim().length > 0;
  const normalizedQuery = normalizeSearchText(debouncedQuery);

  useEffect(() => {
    let active = true;
    loadGlobalUniversityIndex()
      .then((index) => {
        if (active) setGlobalUniversities(index);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDirectoryError(error instanceof Error ? error.message : 'Could not load the local university directory.');
      })
      .finally(() => {
        if (active) setDirectoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setVisibleResultCount(30);
  }, [debouncedQuery, selectedCountry, selectedDegree, freeOnly, ieltsExemptOnly]);

  const localFiltered = useMemo(() => {
    let result = universities;

    if (isSearching) {
      const q = debouncedQuery.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.shortName.toLowerCase().includes(q) ||
          u.city.toLowerCase().includes(q) ||
          u.country.toLowerCase().includes(q) ||
          u.applicationFeeDisplay.toLowerCase().includes(q) ||
          u.applicationFeeType.toLowerCase().includes(q) ||
          u.feeNote.toLowerCase().includes(q) ||
          u.feeWaiverDetail.toLowerCase().includes(q) ||
          u.englishWaiver.detail.toLowerCase().includes(q) ||
          u.englishWaiver.acceptedProofs.some((proof) => proof.toLowerCase().includes(q))
      );
    }

    if (selectedCountry !== 'All') result = result.filter((u) => u.country === selectedCountry);
    if (selectedDegree !== 'All') result = result.filter((u) => u.degreeLevels.includes(selectedDegree as University['degreeLevels'][number]));
    if (freeOnly) result = result.filter((u) => u.applicationFeeType === 'free' || u.applicationFeeType === 'waiver');
    if (ieltsExemptOnly) result = result.filter((u) => u.englishWaiver.available);

    return result;
  }, [debouncedQuery, isSearching, selectedCountry, selectedDegree, freeOnly, ieltsExemptOnly]);

  const globalResults = useMemo(() => {
    if (selectedDegree !== 'All' || freeOnly || ieltsExemptOnly) return [];

    return globalUniversities
      .filter((university) =>
        selectedCountry === 'All' || university.country === selectedCountry
      )
      .map((university) => ({
        university,
        score: scoreUniversityMatch(university, normalizedQuery),
      }))
      .filter((result): result is { university: ApiUniversity; score: number } => result.score !== null)
      .sort((left, right) => right.score - left.score);
  }, [globalUniversities, normalizedQuery, selectedCountry, selectedDegree, freeOnly, ieltsExemptOnly]);

  const allResults = useMemo(() => {
    const matchedLocalIds = new Set<string>();
    const global: SearchResult[] = globalResults.map(({ university }) => {
      const matched = findLocalMatch(university);
      if (matched) {
        matchedLocalIds.add(matched.id);
        return { kind: 'local', university: matched };
      }
      return { kind: 'api', apiUni: university };
    });
    const localOnly: SearchResult[] = localFiltered
      .filter((university) => !matchedLocalIds.has(university.id))
      .map((university) => ({ kind: 'local', university }));

    return [...localOnly, ...global];
  }, [globalResults, localFiltered]);
  const visibleResults = allResults.slice(0, visibleResultCount);

  const freeCount = universities.filter((u) => u.applicationFeeType === 'free' || u.applicationFeeType === 'waiver').length;
  const waiverCount = universities.filter((u) => u.englishWaiver.available).length;
  const totalCount = allResults.length;
  const globalCountLabel = directoryLoading ? '9,000+' : globalUniversities.length.toLocaleString();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <header className="mb-10 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Admissions directory</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Find universities and admissions details</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Search directory records and compare application fees, waivers, deadlines, and language requirements where available. Confirm requirements with each institution.
        </p>
      </header>

      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
        <label htmlFor="global-university-search" className="mb-2 block text-sm font-semibold text-slate-200">
          Search universities
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.75} />
          <input
            id="global-university-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by university name..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Search runs locally across names, countries, and states or provinces. Directory entries do not confirm accreditation or admissions requirements.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
          <DollarSign className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
          <span className="text-lg font-semibold tabular-nums text-emerald-300">{freeCount}</span>
          <span className="text-sm text-slate-400">Free applications or fee waivers</span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
          <Languages className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
          <span className="text-lg font-semibold tabular-nums text-emerald-300">{waiverCount}</span>
          <span className="text-sm text-slate-400">English waiver records</span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
          <Globe className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          <span className="text-lg font-semibold tabular-nums text-slate-200">{globalCountLabel}</span>
          <span className="text-sm text-slate-400">Directory records</span>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
            <span className="font-medium">Filters</span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Country</label>
              <div className="flex flex-wrap gap-1.5">
                {countries.map((c) => (
                  <button key={c} onClick={() => setSelectedCountry(c)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${selectedCountry === c ? 'border-slate-600 bg-slate-800 text-white' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>{c}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Degree Level</label>
              <div className="flex flex-wrap gap-1.5">
                {degreeLevels.map((d) => (
                  <button key={d} onClick={() => setSelectedDegree(d)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${selectedDegree === d ? 'border-slate-600 bg-slate-800 text-white' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>{d}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Fee & Waiver Filters</label>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFreeOnly(!freeOnly)} className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${freeOnly ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>
                  <DollarSign className="h-3.5 w-3.5" strokeWidth={1.75} />$0 / Waivers
                </button>
                <button onClick={() => setIeltsExemptOnly(!ieltsExemptOnly)} className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${ieltsExemptOnly ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>
                  <Languages className="h-3.5 w-3.5" strokeWidth={1.75} />IELTS Exempt
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800 flex-wrap">
            <Search className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
            <span>
              Searching across <span className="text-slate-300 font-semibold">{globalCountLabel}</span> global institutions
              {' · '}Found <span className="text-slate-300 font-semibold">{totalCount.toLocaleString()}</span> matching universities
              {isSearching && <> for "<span className="text-slate-300 font-semibold">{debouncedQuery}</span>"</>}
              {directoryLoading && <span className="ml-2 text-slate-400">· Loading bundled directory</span>}
              {directoryError && <span role="status" className="ml-2 text-slate-400">· {directoryError} Saved university records remain available.</span>}
            </span>
          </div>
        </div>
      </div>

      {totalCount === 0 && !directoryLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-6 py-10">
          <p className="text-base font-semibold text-slate-200">No universities match these filters</p>
          <p className="mt-1 text-sm text-slate-400">Clear your search or broaden the selected criteria.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCountry('All');
              setSelectedDegree('All');
              setFreeOnly(false);
              setIeltsExemptOnly(false);
            }}
            className="mt-5 inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Clear search &amp; filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleResults.map((result, idx) =>
              result.kind === 'local' ? (
                <SchoolCard
                  key={`local-${result.university.id}`}
                  school={result.university}
                />
              ) : (
                <ApiSchoolCard
                  key={`api-${result.apiUni.name}-${idx}`}
                  apiUni={result.apiUni}
                />
              )
            )}
          </div>
          {directoryLoading && <div className="mt-5"><SkeletonCards count={3} /></div>}
          {visibleResultCount < allResults.length && (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setVisibleResultCount((count) => count + 30)}
                className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Load more universities ({Math.min(30, allResults.length - visibleResultCount)} next)
              </button>
            </div>
          )}
        </>
      )}
      <p className="mt-10 border-t border-slate-800 pt-5 text-xs leading-relaxed text-slate-500">
        Fees, waivers, and testing requirements can change. Confirm current details with each institution.
      </p>
    </div>
  );
}
