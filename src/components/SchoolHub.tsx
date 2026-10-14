import { useState, useMemo, useEffect, useRef } from 'react';
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
  Sparkles,
} from 'lucide-react';
import type { University, FeeWaiverDetail, ApiUniversity } from '@/types';
import { universities, countries, degreeLevels } from '@/data/universities';

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
  | { kind: 'api'; apiUni: ApiUniversity; matchedLocal?: University };

function findLocalMatch(apiUni: ApiUniversity): University | undefined {
  const apiName = apiUni.name.toLowerCase().trim();
  return universities.find((u) => {
    const localName = u.name.toLowerCase().trim();
    return localName === apiName || localName.includes(apiName) || apiName.includes(u.shortName.toLowerCase());
  });
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useApiSearch(query: string, enabled: boolean) {
  const [apiResults, setApiResults] = useState<ApiUniversity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setApiResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const url = `https://universities.hipolabs.com/search?name=${encodeURIComponent(query.trim())}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((data: ApiUniversity[]) => {
        setApiResults(data.slice(0, 30));
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(true);
        setLoading(false);
        setApiResults([]);
      });

    return () => controller.abort();
  }, [query, enabled]);

  return { apiResults, loading, error };
}

function SchoolCard({ school }: { school: University }) {
  const feeStyle = FEE_WAIVER_STYLES[school.feeWaiverDetail];
  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-800/80 bg-[#0c1322]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:bg-[#0f1729]/90 hover:shadow-2xl hover:shadow-blue-950/30">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 w-11 h-11 flex-shrink-0">
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
        <a href={school.portalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]">
          View Portal & Apply <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function ApiSchoolCard({ apiUni, matchedLocal }: { apiUni: ApiUniversity; matchedLocal?: University }) {
  const portalUrl = apiUni.web_page || (apiUni.domains.length > 0 ? `https://${apiUni.domains[0]}` : '#');

  if (matchedLocal) {
    return <SchoolCard school={matchedLocal} />;
  }

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-800/80 bg-[#0c1322]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:bg-[#0f1729]/90 hover:shadow-xl hover:shadow-indigo-950/20">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 w-11 h-11 flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight">{apiUni.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-400">
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{apiUni.country}</span>
              <span className="inline-flex items-center justify-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">{apiUni.alpha_two_code}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
            <Sparkles className="w-3 h-3" />
            Live global result
          </span>
        </div>

        <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-3 mb-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Found via global university registry. Detailed fee and admissions intel not yet indexed in Civio's local database. Visit the official website for application fees, deadlines, and language requirements.
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
        <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-700 hover:border-slate-600 active:scale-[0.98]">
          Visit Official Website <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function SchoolHub({ searchQuery }: { searchQuery: string }) {
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedDegree, setSelectedDegree] = useState('All');
  const [freeOnly, setFreeOnly] = useState(false);
  const [ieltsExemptOnly, setIeltsExemptOnly] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const isSearching = debouncedQuery.trim().length > 1;
  const { apiResults, loading: apiLoading, error: apiError } = useApiSearch(debouncedQuery, isSearching);

  const localFiltered = useMemo(() => {
    let result = universities;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.shortName.toLowerCase().includes(q) ||
          u.city.toLowerCase().includes(q) ||
          u.country.toLowerCase().includes(q) ||
          u.type.toLowerCase().includes(q) ||
          u.intel.languageTesting.toLowerCase().includes(q)
      );
    }

    if (selectedCountry !== 'All') result = result.filter((u) => u.country === selectedCountry);
    if (selectedDegree !== 'All') result = result.filter((u) => u.degreeLevels.includes(selectedDegree as University['degreeLevels'][number]));
    if (freeOnly) result = result.filter((u) => u.applicationFeeType === 'free' || u.applicationFeeType === 'waiver');
    if (ieltsExemptOnly) result = result.filter((u) => u.englishWaiver.available);

    return result;
  }, [debouncedQuery, selectedCountry, selectedDegree, freeOnly, ieltsExemptOnly]);

  const mergedApiResults = useMemo(() => {
    if (!isSearching || apiResults.length === 0) return [] as SearchResult[];
    const localIds = new Set(localFiltered.map((u) => u.id));
    return apiResults
      .map((apiUni): SearchResult | null => {
        const matched = findLocalMatch(apiUni);
        if (matched && localIds.has(matched.id)) return null;
        return { kind: 'api', apiUni, matchedLocal: matched };
      })
      .filter((r): r is SearchResult => r !== null);
  }, [apiResults, isSearching, localFiltered]);

  const allResults: SearchResult[] = useMemo(() => {
    const local: SearchResult[] = localFiltered.map((u) => ({ kind: 'local' as const, university: u }));
    return [...local, ...mergedApiResults];
  }, [localFiltered, mergedApiResults]);

  const freeCount = universities.filter((u) => u.applicationFeeType === 'free' || u.applicationFeeType === 'waiver').length;
  const waiverCount = universities.filter((u) => u.englishWaiver.available).length;
  const totalCount = allResults.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">Admissions Hub</h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Search {universities.length}+ indexed universities with deep fee intel, plus live global search of thousands more institutions worldwide.
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
          <span className="text-sm font-semibold text-indigo-300">Live</span>
          <span className="text-xs text-slate-400">Global API Search</span>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
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
                <button onClick={() => setFreeOnly(!freeOnly)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${freeOnly ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>
                  <DollarSign className="w-3.5 h-3.5" />$0 / Waivers
                </button>
                <button onClick={() => setIeltsExemptOnly(!ieltsExemptOnly)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${ieltsExemptOnly ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>
                  <Languages className="w-3.5 h-3.5" />IELTS Exempt
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800 flex-wrap">
            <Search className="w-3.5 h-3.5" />
            <span>
              {isSearching ? (
                <>Searching for "<span className="text-slate-300 font-semibold">{debouncedQuery}</span>" — </>
              ) : (
                <>Showing all indexed — </>
              )}
              <span className="text-slate-300 font-semibold">{totalCount}</span> result{totalCount !== 1 ? 's' : ''}
              {apiLoading && <span className="text-indigo-400 ml-2 flex items-center gap-1 inline-flex"><Loader2 className="w-3 h-3 animate-spin" /> Fetching global results...</span>}
              {apiError && isSearching && <span className="text-amber-400 ml-2">· Global API unavailable, showing local results</span>}
              {mergedApiResults.length > 0 && <span className="text-indigo-400 ml-2">· {mergedApiResults.length} from global registry</span>}
            </span>
          </div>
        </div>
      </div>

      {totalCount === 0 && !apiLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-8 py-12">
            <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">No universities match your filters</p>
            <p className="text-slate-500 text-sm mt-1">Try broadening your search or clearing filters.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allResults.map((result, idx) =>
            result.kind === 'local' ? (
              <SchoolCard key={`local-${result.university.id}`} school={result.university} />
            ) : (
              <ApiSchoolCard key={`api-${result.apiUni.name}-${idx}`} apiUni={result.apiUni} matchedLocal={result.matchedLocal} />
            )
          )}
        </div>
      )}
    </div>
  );
}
