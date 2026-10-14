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
  Loader2,
} from 'lucide-react';
import type { University, FeeWaiverDetail, ApiUniversity } from '@/types';
import { universities, countries, degreeLevels } from '@/data/universities';
import { loadGlobalUniversityIndex } from '@/data/globalUniversityIndex';
import { getUniversityWebsite } from '@/data/universityDirectory';

const FEE_WAIVER_STYLES: Record<FeeWaiverDetail, { badge: string; banner: string }> = {
  'always-free': { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', banner: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  'info-session': { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25', banner: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  'auto-international': { badge: 'bg-blue-500/15 text-blue-300 border-blue-500/25', banner: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
  'upon-request': { badge: 'bg-slate-600/30 text-slate-300 border-slate-600/30', banner: 'bg-slate-700/20 border-slate-600/30 text-slate-300' },
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
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900 overflow-hidden transition-colors duration-150 hover:border-slate-700">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center rounded-lg bg-blue-600 w-11 h-11 flex-shrink-0">
            <School className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight">{school.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-400">
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{school.city}, {school.country}</span>
              <span className="inline-flex items-center justify-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">{school.countryFlag}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 text-xs text-slate-400">
            <Building2 className="w-3 h-3" />
            {school.type}
          </span>
          {school.degreeLevels.map((level) => (
            <span key={level} className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs text-blue-300">
              <GraduationCap className="w-3 h-3" />
              {level}
            </span>
          ))}
        </div>

        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-3 ${feeStyle.banner}`}>
          <DollarSign className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{FEE_WAIVER_LABELS[school.feeWaiverDetail]}</p>
            <p className="text-xs opacity-80">{school.feeNote}</p>
          </div>
        </div>

        <div className="mb-3">
          {school.englishWaiver.available ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-300 mb-0.5">English Proficiency Waiver Available</p>
                <p className="text-xs text-slate-400 leading-snug">{school.englishWaiver.detail}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {school.englishWaiver.acceptedProofs.map((proof) => (
                    <span key={proof} className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">{proof}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-700/40 bg-slate-800/30 px-3 py-2.5">
              <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 mb-0.5">No English Proficiency Waiver</p>
                <p className="text-xs text-slate-500 leading-snug">{school.englishWaiver.detail}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 mb-4">
          {INTEL_ITEMS.map(({ key, icon: Icon, label }) => (
            <div key={key} className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{label}</p>
                <p className="text-sm text-slate-300 leading-snug">{school.intel[key]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 border-t border-slate-800 pt-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Ranking</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">{school.ranking}</p>
          </div>
          <div className="text-center border-x border-slate-800">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Acceptance</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">{school.acceptanceRate}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Est.</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">{school.established}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 p-4 mt-auto">
        <a href={school.portalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-500">
          View Portal & Apply <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function ApiSchoolCard({ apiUni }: { apiUni: ApiUniversity }) {
  const portalUrl = getUniversityWebsite(apiUni);

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900 overflow-hidden transition-colors duration-150 hover:border-slate-700">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center rounded-lg bg-slate-700 w-11 h-11 flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight">{apiUni.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-400">
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{apiUni.country}</span>
              <span className="inline-flex items-center justify-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">{apiUni.alpha_two_code}</span>
            </div>
            {apiUni.state_province && (
              <p className="mt-1 text-xs text-slate-500">{apiUni.state_province}</p>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
            <Globe className="w-3 h-3" />
            Global directory record
          </span>
          <span className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-400">
            Application fee: Check institution
          </span>
          <span className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-400">
            English testing: Not indexed
          </span>
        </div>

        <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-3 mb-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Listed in the Hipo global university directory. Fee, deadline, and language-testing requirements are not supplied by this directory; confirm current details with the institution.
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

      <div className="border-t border-slate-800 p-4 mt-auto">
        {portalUrl && (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:bg-slate-700 hover:border-slate-600">
            Visit Official Website <ExternalLink className="w-4 h-4" />
          </a>
        )}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">Admissions Hub</h1>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200">
          <Globe className="h-4 w-4 text-indigo-300" />
          9,000+ Global Universities &amp; Colleges Indexed
        </div>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Search an offline, locally bundled copy of the global Hipo directory alongside Civio admissions records. Fee and language policies are shown only where indexed; confirm current details with each institution.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <label htmlFor="global-university-search" className="mb-2 block text-sm font-semibold text-slate-200">
          Search global universities
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="global-university-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by university name..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500/50 focus:bg-slate-800"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Search runs locally across names, countries, and states or provinces. Directory entries do not confirm accreditation or admissions requirements.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">{freeCount}</span>
          <span className="text-xs text-slate-400">Free / Waiver Apps</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-2">
          <Languages className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-blue-300">{waiverCount}</span>
          <span className="text-xs text-slate-400">English Waiver Schools</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-300">{globalCountLabel}</span>
          <span className="text-xs text-slate-400">Offline Global Directory</span>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Country</label>
              <div className="flex flex-wrap gap-1.5">
                {countries.map((c) => (
                  <button key={c} onClick={() => setSelectedCountry(c)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selectedCountry === c ? 'border-blue-500/50 bg-blue-500/15 text-blue-200' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>{c}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Degree Level</label>
              <div className="flex flex-wrap gap-1.5">
                {degreeLevels.map((d) => (
                  <button key={d} onClick={() => setSelectedDegree(d)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selectedDegree === d ? 'border-blue-500/50 bg-blue-500/15 text-blue-200' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>{d}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Fee & Waiver Filters</label>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFreeOnly(!freeOnly)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${freeOnly ? 'border-blue-500/50 bg-blue-500/15 text-blue-300' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>
                  <DollarSign className="w-3.5 h-3.5" />$0 / Waivers
                </button>
                <button onClick={() => setIeltsExemptOnly(!ieltsExemptOnly)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${ieltsExemptOnly ? 'border-blue-500/50 bg-blue-500/15 text-blue-300' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>
                  <Languages className="w-3.5 h-3.5" />IELTS Exempt
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800 flex-wrap">
            <Search className="w-3.5 h-3.5" />
            <span>
              Searching across <span className="text-slate-300 font-semibold">{globalCountLabel}</span> global institutions
              {' · '}Found <span className="text-slate-300 font-semibold">{totalCount.toLocaleString()}</span> matching universities
              {isSearching && <> for "<span className="text-slate-300 font-semibold">{debouncedQuery}</span>"</>}
              {directoryLoading && <span className="text-indigo-400 ml-2 flex items-center gap-1 inline-flex"><Loader2 className="w-3 h-3 animate-spin" /> Loading bundled directory...</span>}
              {directoryError && <span role="status" className="text-amber-400 ml-2">· {directoryError} Curated admissions records remain available.</span>}
            </span>
          </div>
        </div>
      </div>

      {totalCount === 0 && !directoryLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-8 py-12">
            <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">No universities match your filters</p>
            <p className="text-slate-500 text-sm mt-1">Try broadening your search or clearing filters.</p>
          </div>
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
          {visibleResultCount < allResults.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisibleResultCount((count) => count + 30)}
                className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
              >
                Load more universities ({Math.min(30, allResults.length - visibleResultCount)} next)
              </button>
            </div>
          )}
        </>
      )}
      <p className="mt-8 text-center text-xs text-slate-500">
        Admissions fees, waivers, and English testing policies may change; confirm current requirements with each institution.
      </p>
    </div>
  );
}
