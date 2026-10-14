import { useState, useMemo } from 'react';
import {
  ExternalLink,
  Search,
  Filter,
  Calendar,
  Globe,
  Users,
  CheckCircle,
  Plane,
  Code2,
  Award,
  Megaphone,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { Opportunity, OpportunityCategory, FundingType, TargetAudience } from '@/types';
import { opportunities } from '@/data/opportunities';

const CATEGORY_ICON: Record<OpportunityCategory, typeof Award> = {
  'Youth & Civic Summit': Megaphone,
  'Fellowship': Award,
  'Tech & Business Internship': Code2,
};

const CATEGORY_STYLES: Record<OpportunityCategory, { badge: string; iconBg: string }> = {
  'Youth & Civic Summit': { badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25', iconBg: 'from-cyan-600 to-blue-700' },
  'Fellowship': { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25', iconBg: 'from-amber-600 to-orange-700' },
  'Tech & Business Internship': { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', iconBg: 'from-emerald-600 to-teal-700' },
};

const FUNDING_STYLES: Record<FundingType, string> = {
  'Fully Funded': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'Partial Funding': 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'Virtual / Online': 'bg-blue-500/15 text-blue-300 border-blue-500/25',
};

const FUNDING_ICON: Record<FundingType, typeof Plane> = {
  'Fully Funded': Plane,
  'Partial Funding': TrendingUp,
  'Virtual / Online': Globe,
};

const AUDIENCE_STYLES: Record<TargetAudience, string> = {
  'African Youth': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  'Global / All Countries': 'bg-slate-600/30 text-slate-300 border-slate-600/30',
  'Developing Economies': 'bg-purple-500/15 text-purple-300 border-purple-500/25',
};

const CATEGORIES: (OpportunityCategory | 'All')[] = ['All', 'Youth & Civic Summit', 'Fellowship', 'Tech & Business Internship'];
const FUNDING_TYPES: (FundingType | 'All')[] = ['All', 'Fully Funded', 'Partial Funding', 'Virtual / Online'];
const AUDIENCES: (TargetAudience | 'All')[] = ['All', 'African Youth', 'Global / All Countries', 'Developing Economies'];

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const catStyle = CATEGORY_STYLES[opportunity.category];
  const CatIcon = CATEGORY_ICON[opportunity.category];
  const FundIcon = FUNDING_ICON[opportunity.fundingType];

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-800/80 bg-[#0c1322]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:bg-[#0f1729]/90 hover:shadow-xl hover:shadow-indigo-950/20">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${catStyle.iconBg} w-11 h-11 flex-shrink-0`}>
            <CatIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white leading-tight">{opportunity.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{opportunity.organization}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${catStyle.badge}`}>
            <CatIcon className="w-3 h-3" />
            {opportunity.category}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${FUNDING_STYLES[opportunity.fundingType]}`}>
            <FundIcon className="w-3 h-3" />
            {opportunity.fundingType}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${AUDIENCE_STYLES[opportunity.targetAudience]}`}>
            <Target className="w-3 h-3" />
            {opportunity.targetAudience}
          </span>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed mb-3">{opportunity.description}</p>

        <div className="space-y-2 text-xs text-slate-400 mb-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span><span className="text-slate-500 font-semibold">Eligibility: </span>{opportunity.eligibility}</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <span><span className="text-slate-500 font-semibold">Benefits: </span>{opportunity.benefits}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span><span className="text-slate-500 font-semibold">Deadline: </span>{opportunity.deadline}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span><span className="text-slate-500 font-semibold">Region: </span>{opportunity.region}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {opportunity.keywords.slice(0, 5).map((kw) => (
            <span key={kw} className="inline-flex items-center rounded-md bg-slate-800/60 border border-slate-700/50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">#{kw}</span>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800 p-4 mt-auto">
        <a href={opportunity.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98]">
          View & Apply <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function OpportunitiesHub({ searchQuery }: { searchQuery: string }) {
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | 'All'>('All');
  const [selectedFunding, setSelectedFunding] = useState<FundingType | 'All'>('All');
  const [selectedAudience, setSelectedAudience] = useState<TargetAudience | 'All'>('All');

  const filtered = useMemo(() => {
    let result = opportunities;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.organization.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.keywords.some((k) => k.toLowerCase().includes(q)) ||
          o.region.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') result = result.filter((o) => o.category === selectedCategory);
    if (selectedFunding !== 'All') result = result.filter((o) => o.fundingType === selectedFunding);
    if (selectedAudience !== 'All') result = result.filter((o) => o.targetAudience === selectedAudience);

    return result;
  }, [searchQuery, selectedCategory, selectedFunding, selectedAudience]);

  const fullyFundedCount = opportunities.filter((o) => o.fundingType === 'Fully Funded').length;
  const virtualCount = opportunities.filter((o) => o.fundingType === 'Virtual / Online').length;
  const africanYouthCount = opportunities.filter((o) => o.targetAudience === 'African Youth').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
          Opportunities & Conferences
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Explore {opportunities.length}+ global summits, fully funded fellowships, and paid internships for young leaders, students, and changemakers.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
          <Plane className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">{fullyFundedCount}</span>
          <span className="text-xs text-slate-400">Fully Funded</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-blue-300">{virtualCount}</span>
          <span className="text-xs text-slate-400">Virtual / Online</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-300">{africanYouthCount}</span>
          <span className="text-xs text-slate-400">For African Youth</span>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setSelectedCategory(c)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selectedCategory === c ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-200' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>{c}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Funding Type</label>
              <div className="flex flex-wrap gap-1.5">
                {FUNDING_TYPES.map((f) => (
                  <button key={f} onClick={() => setSelectedFunding(f)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selectedFunding === f ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>{f}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Target Audience</label>
              <div className="flex flex-wrap gap-1.5">
                {AUDIENCES.map((a) => (
                  <button key={a} onClick={() => setSelectedAudience(a)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selectedAudience === a ? 'border-purple-500/50 bg-purple-500/15 text-purple-200' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>{a}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800">
            <Search className="w-3.5 h-3.5" />
            <span>
              Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of {opportunities.length} opportunities
              {searchQuery.trim() && <> for "<span className="text-slate-300 font-semibold">{searchQuery}</span>"</>}
            </span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-8 py-12">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">No opportunities match your filters</p>
            <p className="text-slate-500 text-sm mt-1">Try a different keyword or broaden your filters.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
