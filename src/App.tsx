import { useState } from 'react';
import {
  Landmark,
  Search,
  X,
  Radio,
  GraduationCap,
  Compass,
  Menu,
  Plus,
  LogIn,
  BarChart3,
  Briefcase,
  DollarSign,
  Plane,
  Languages,
  Code2,
} from 'lucide-react';
import type { View, Initiative, CivioUser } from '@/types';
import CivicFeed from '@/components/CivicFeed';
import CivicPolls from '@/components/CivicPolls';
import SchoolHub from '@/components/SchoolHub';
import OpportunitiesHub from '@/components/OpportunitiesHub';
import CivioCopilot from '@/components/CivioCopilot';
import CreatePostModal from '@/components/CreatePostModal';
import SignInModal, { UserMenu } from '@/components/SignInModal';
import { initiatives as initialInitiatives } from '@/data/initiatives';

const TABS: { id: View; label: string; icon: typeof Radio; description: string; mobileLabel: string }[] = [
  { id: 'feed', label: 'Initiatives', icon: Radio, description: 'Civic & Educational Feed', mobileLabel: 'Initiatives' },
  { id: 'polls', label: 'Civic Polls & Votes', icon: BarChart3, description: 'Interactive polling & discussions', mobileLabel: 'Polls' },
  { id: 'hub', label: 'Admissions Hub', icon: GraduationCap, description: 'Universities, $0 App Fees, Waivers', mobileLabel: 'Hub' },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase, description: 'Conferences, Fellowships, Internships', mobileLabel: 'Opps' },
  { id: 'copilot', label: 'Civio Copilot', icon: Compass, description: 'AI Advisor', mobileLabel: 'Copilot' },
];

const QUICK_FILTERS: { label: string; icon: typeof DollarSign; view: View; query: string }[] = [
  { label: 'Universities with No Application Fee', icon: DollarSign, view: 'hub', query: '' },
  { label: 'Fully Funded Conferences with Flight Sponsorship', icon: Plane, view: 'opportunities', query: '' },
  { label: 'IELTS Exempt for African Applicants', icon: Languages, view: 'hub', query: '' },
  { label: 'Remote Tech Internships', icon: Code2, view: 'opportunities', query: 'coding' },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/30">
        <Landmark className="w-5 h-5 text-white" />
      </div>
      <div className="hidden sm:block">
        <h1 className="text-lg font-black text-white leading-none tracking-tight">Civio</h1>
        <p className="text-xs text-indigo-400 font-medium mt-0.5">Civic Engagement & Educational Empowerment</p>
      </div>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search initiatives, universities, topics..."
        className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-10 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/10"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function QuickFilterTags({
  onNavigate,
}: {
  activeView: View;
  searchQuery: string;
  onNavigate: (view: View, query?: string) => void;
}) {
  return (
    <div className="hidden xl:flex items-center gap-1.5">
      {QUICK_FILTERS.map(({ label, icon: Icon, view, query }) => (
        <button
          key={label}
          onClick={() => onNavigate(view, query || undefined)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 whitespace-nowrap"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [signInOpen, setSignInOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CivioUser | null>(null);
  const [initiatives, setInitiatives] = useState<Initiative[]>(initialInitiatives);

  const handleSignIn = (user: CivioUser) => {
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
  };

  const handleCreateInitiative = (initiative: Initiative) => {
    setInitiatives((prev) => [initiative, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-950/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-emerald-950/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-slate-900/30 blur-[100px]" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#060a12]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            <Logo />

            <div className="flex-1 flex justify-center px-4">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <QuickFilterTags
              activeView={activeView}
              searchQuery={searchQuery}
              onNavigate={(view, query) => {
                setActiveView(view);
                if (query !== undefined) setSearchQuery(query);
              }}
            />
            <div className="flex items-center gap-2">
              {currentUser ? (
                <UserMenu user={currentUser} onSignOut={handleSignOut} />
              ) : (
                <button
                  onClick={() => setSignInOpen(true)}
                  className="border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              <button
                onClick={() => setCreatePostOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Initiative</span>
              </button>

              {/* Mobile nav toggle */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1 pb-0.5">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeView === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`group relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    active ? 'text-indigo-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-[#060a12]/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {TABS.map(({ id, label, icon: Icon, description }) => {
                const active = activeView === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveView(id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="text-left">
                      <p>{label}</p>
                      <p className="text-[11px] text-slate-500">{description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-[#060a12]/95 backdrop-blur-xl">
        <div className="flex items-center justify-around py-2 px-2">
          {TABS.map(({ id, mobileLabel, icon: Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  active ? 'text-indigo-300' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pb-20 lg:pb-0">
        {activeView === 'feed' && (
          <CivicFeed
            currentUser={currentUser}
            searchQuery={searchQuery}
            initiatives={initiatives}
            onEndorse={(id) =>
              setInitiatives((prev) =>
                prev.map((i) => (i.id === id ? { ...i, endorsements: i.endorsements + 1 } : i))
              )
            }
            onVolunteer={(id) =>
              setInitiatives((prev) =>
                prev.map((i) =>
                  i.id === id && i.volunteersJoined < i.volunteersNeeded
                    ? { ...i, volunteersJoined: i.volunteersJoined + 1 }
                    : i
                )
              )
            }
            onAddComment={(initId, content) => {
              const author = currentUser ? currentUser.email : 'anonymous';
              const newComment = {
                id: `c-${Date.now()}`,
                author,
                content,
                timestamp: new Date().toLocaleDateString('en-GB'),
              };
              setInitiatives((prev) =>
                prev.map((i) =>
                  i.id === initId ? { ...i, comments: [...i.comments, newComment] } : i
                )
              );
            }}
            onOpenCreatePost={() => setCreatePostOpen(true)}
          />
        )}
        {activeView === 'polls' && <CivicPolls />}
        {activeView === 'hub' && <SchoolHub searchQuery={searchQuery} />}
        {activeView === 'opportunities' && <OpportunitiesHub searchQuery={searchQuery} />}
        {activeView === 'copilot' && <CivioCopilot />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-[#060a12]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Landmark className="w-4 h-4 text-indigo-400" />
              <span>Civio · Civic Engagement & Educational Empowerment</span>
            </div>
            <p className="text-xs text-slate-600">
              Community-driven. Transparent. Empowering the next generation.
            </p>
          </div>
        </div>
      </footer>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} onSignIn={handleSignIn} />
      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        currentUser={currentUser}
        onCreate={handleCreateInitiative}
      />
    </div>
  );
}
