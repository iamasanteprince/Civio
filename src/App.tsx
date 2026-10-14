import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Compass,
  Menu,
  Plus,
  LogIn,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import type { View, Initiative, CivioUser, DiscussionComment, DiscussionStore } from '@/types';
import SchoolHub from '@/components/SchoolHub';
import OpportunitiesHub from '@/components/OpportunitiesHub';
import Asante from '@/components/Asante';
import VisaIntelHub from '@/components/VisaIntelHub';
import StudentForum from '@/components/StudentForum';
import CreatePostModal from '@/components/CreatePostModal';
import SignInModal, { UserMenu } from '@/components/SignInModal';
import AdminActivityDrawer from '@/components/AdminActivityDrawer';
import { DISCUSSION_STORAGE_KEY, parseDiscussionStore } from '@/data/discussions';
import { supabase } from '@/lib/supabase';
import { parseAdminAnalytics, type AdminAnalytics } from '@/lib/adminAnalytics';
import { getGuestSessionId, resetGuestSessionId, sanitizePlainText } from '@/utils/inputSecurity';

const ADMIN_EMAIL = 'iamasanteprince@gmail.com';

const TABS: { id: View; label: string; icon: typeof ShieldCheck; description: string; mobileLabel: string }[] = [
  { id: 'visa', label: 'Visa & Immigration', icon: ShieldCheck, description: 'Student Visa & Immigration Intel', mobileLabel: 'Visa Intel' },
  { id: 'hub', label: 'Admissions Hub', icon: GraduationCap, description: 'Universities, $0 App Fees, Waivers', mobileLabel: 'Hub' },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase, description: 'Conferences, Fellowships, Internships', mobileLabel: 'Opps' },
  { id: 'asante', label: 'Asante', icon: Compass, description: 'Admissions, opportunities & intelligence', mobileLabel: 'Asante' },
  { id: 'forum', label: 'Student Forum', icon: MessageSquare, description: 'Applicant discussions and questions', mobileLabel: 'Forum' },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/civio-logo.png"
        alt="Civiohub Logo"
        className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-indigo-500/25 border border-indigo-500/30"
      />
      <div className="hidden sm:block">
        <h1 className="text-lg font-black text-white leading-none tracking-tight">Civiohub</h1>
        <p className="text-xs text-indigo-400 font-medium mt-0.5">Civic Engagement, Admissions &amp; Global Opportunities</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('visa');
  const [signInOpen, setSignInOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CivioUser | null>(null);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionStore>({});
  const [discussionsReady, setDiscussionsReady] = useState(false);
  const [discussionError, setDiscussionError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false);
  const [adminRefreshKey, setAdminRefreshKey] = useState(0);
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalytics | null>(null);
  const [adminAnalyticsLoading, setAdminAnalyticsLoading] = useState(false);
  const [adminAnalyticsError, setAdminAnalyticsError] = useState<string | null>(null);
  const isAdmin = currentUser?.email.trim().toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!active || !user?.email) {
        if (active) setCurrentUser(null);
        return;
      }
      const displayName =
        typeof user.user_metadata.display_name === 'string'
          ? sanitizePlainText(user.user_metadata.display_name).slice(0, 80)
          : user.email.split('@')[0];
      const isVerified = Boolean(
        user.email_confirmed_at ||
        user.app_metadata.provider === 'google' ||
        user.identities?.some((identity) => identity.provider === 'google')
      );
      setCurrentUser({ id: user.id, email: user.email, displayName: displayName || user.email.split('@')[0], isVerified });
      setAuthError(null);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthError('Unable to restore your account session. Please sign in again.');
        return;
      }
      const user = data.session?.user;
      if (!user?.email) return;
      const displayName =
        typeof user.user_metadata.display_name === 'string'
          ? sanitizePlainText(user.user_metadata.display_name).slice(0, 80)
          : user.email.split('@')[0];
      const isVerified = Boolean(
        user.email_confirmed_at ||
        user.app_metadata.provider === 'google' ||
        user.identities?.some((identity) => identity.provider === 'google')
      );
      setCurrentUser({ id: user.id, email: user.email, displayName: displayName || user.email.split('@')[0], isVerified });
    }).catch(() => {
      if (active) setAuthError('Unable to restore your account session. Please sign in again.');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setAdminAnalytics(null);
      setAdminAnalyticsError(null);
      setAdminAnalyticsLoading(false);
      setAdminDrawerOpen(false);
      return;
    }
    if (!supabase) {
      setAdminAnalyticsError('Admin analytics are unavailable because account services are not configured.');
      return;
    }

    let active = true;
    setAdminAnalyticsLoading(true);
    setAdminAnalyticsError(null);
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('admin_activity_summary');
        if (!active) return;
        if (error) {
          setAdminAnalytics(null);
          setAdminAnalyticsError('Could not load admin analytics. Apply the admin activity migration and try again.');
          return;
        }
        try {
          setAdminAnalytics(parseAdminAnalytics(data));
        } catch {
          setAdminAnalytics(null);
          setAdminAnalyticsError('Admin analytics returned an unexpected response.');
        }
      } catch {
        if (active) {
          setAdminAnalytics(null);
          setAdminAnalyticsError('Could not load admin analytics. Check the connection and try again.');
        }
      } finally {
        if (active) setAdminAnalyticsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isAdmin, adminRefreshKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISCUSSION_STORAGE_KEY);
      setDiscussions(saved ? parseDiscussionStore(saved) : {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read saved discussions.';
      setDiscussionError(`Discussion storage is unavailable or invalid: ${message}`);
    } finally {
      setDiscussionsReady(true);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== DISCUSSION_STORAGE_KEY) return;
      try {
        setDiscussions(event.newValue ? parseDiscussionStore(event.newValue) : {});
        setDiscussionError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not read updated discussions.';
        setDiscussionError(`Could not sync discussions from another Civio tab: ${message}`);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSignIn = (user: CivioUser) => {
    setCurrentUser(user);
    setAuthError(null);
  };

  const handleSignOut = () => {
    if (!supabase) return;
    void supabase.auth.signOut().then(({ error }) => {
      if (error) setAuthError('Unable to sign out right now. Please try again.');
      else {
        setCurrentUser(null);
        setAuthError(null);
      }
    }).catch(() => setAuthError('Unable to sign out right now. Please try again.'));
  };

  const handleDeleteAccount = async () => {
    if (!supabase || !currentUser) throw new Error('Account services are unavailable.');
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;

    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) setAuthError('Account deleted. A local session could not be fully cleared; please close this browser tab.');
    try {
      const ownedKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
        .filter((key): key is string => Boolean(key && key.startsWith('civio-')));
      ownedKeys.forEach((key) => localStorage.removeItem(key));
      const projectRef = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0];
      localStorage.removeItem(`sb-${projectRef}-auth-token`);
      sessionStorage.clear();
      resetGuestSessionId();
    } catch {
      setDiscussionError('Account deleted, but browser storage could not be fully cleared. Clear this site’s storage in browser settings.');
    }
    setCurrentUser(null);
    setInitiatives([]);
    setDiscussions({});
    setActiveView('visa');
    setAdminDrawerOpen(false);
    setAdminAnalytics(null);
    setAuthError(null);
  };

  const handleCreateInitiative = (initiative: Initiative) => {
    setInitiatives((prev) => [initiative, ...prev]);
  };

  const canManageInitiative = (initiative: Initiative) =>
    isAdmin ||
    Boolean(currentUser && initiative.userId === currentUser.id) ||
    Boolean(initiative.guestSessionId && initiative.guestSessionId === getGuestSessionId());

  const updateInitiative = (
    initiativeId: string,
    fields: Pick<Initiative, 'title' | 'description' | 'goal'>
  ) => {
    setInitiatives((previous) => previous.map((initiative) =>
      initiative.id === initiativeId && canManageInitiative(initiative)
        ? { ...initiative, ...fields }
        : initiative
    ));
  };

  const deleteInitiative = (initiativeId: string) => {
    const initiative = initiatives.find((item) => item.id === initiativeId);
    if (!initiative || !canManageInitiative(initiative)) return;
    setInitiatives((previous) => previous.filter((initiative) =>
      initiative.id !== initiativeId || !canManageInitiative(initiative)
    ));
    const nextDiscussions = { ...discussions };
    delete nextDiscussions[`initiative:${initiativeId}`];
    saveDiscussions(nextDiscussions);
  };

  const saveDiscussions = (next: DiscussionStore) => {
    setDiscussions(next);
    try {
      localStorage.setItem(DISCUSSION_STORAGE_KEY, JSON.stringify(next));
      setDiscussionError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown storage error.';
      setDiscussionError(`Your discussion is visible in this session but could not be saved in this browser: ${message}`);
    }
  };

  const addDiscussionComment = (threadId: string, content: string, accountPost = false) => {
    if (!discussionsReady) return;
    const sanitizedContent = sanitizePlainText(content).slice(0, 2000);
    if (!sanitizedContent) return;
    const comment: DiscussionComment = {
      id: crypto.randomUUID(),
      author: accountPost
        ? sanitizePlainText(currentUser?.displayName || 'Member').slice(0, 80) || 'Member'
        : 'Guest',
      content: sanitizedContent,
      timestamp: new Date().toISOString(),
      likes: 0,
      verified: accountPost && Boolean(currentUser?.isVerified),
      userId: accountPost ? currentUser?.id : undefined,
      guestSessionId: accountPost ? undefined : getGuestSessionId(),
    };
    saveDiscussions({ ...discussions, [threadId]: [...(discussions[threadId] ?? []), comment] });
  };

  const canManageComment = (comment: DiscussionComment) =>
    isAdmin ||
    Boolean(currentUser && comment.userId === currentUser.id) ||
    Boolean(comment.guestSessionId && comment.guestSessionId === getGuestSessionId());

  const editDiscussionComment = (threadId: string, commentId: string, content: string) => {
    const thread = discussions[threadId] ?? [];
    const target = thread.find((comment) => comment.id === commentId);
    const sanitizedContent = sanitizePlainText(content).slice(0, 2000);
    if (!target || !sanitizedContent || !canManageComment(target)) return;
    saveDiscussions({
      ...discussions,
      [threadId]: thread.map((comment) => comment.id === commentId
        ? { ...comment, content: sanitizedContent, editedAt: new Date().toISOString() }
        : comment),
    });
  };

  const deleteDiscussionComment = (threadId: string, commentId: string) => {
    const thread = discussions[threadId] ?? [];
    const target = thread.find((comment) => comment.id === commentId);
    if (!target || !canManageComment(target)) return;
    const remainingComments = thread.filter((comment) => comment.id !== commentId);
    const next = { ...discussions };
    if (remainingComments.length === 0) delete next[threadId];
    else next[threadId] = remainingComments;
    saveDiscussions(next);
  };

  const likeDiscussionComment = (threadId: string, commentId: string) => {
    if (!discussionsReady) return;
    const thread = discussions[threadId] ?? [];
    if (!thread.some((comment) => comment.id === commentId)) return;
    saveDiscussions({
      ...discussions,
      [threadId]: thread.map((comment) =>
        comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment
      ),
    });
  };

  const removeDiscussionComment = (threadId: string, commentId: string) => {
    if (!discussionsReady) return;
    const remainingComments = (discussions[threadId] ?? []).filter((comment) => comment.id !== commentId);
    if (remainingComments.length === (discussions[threadId] ?? []).length) return;
    const next = { ...discussions };
    if (remainingComments.length === 0) delete next[threadId];
    else next[threadId] = remainingComments;
    saveDiscussions(next);
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

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminDrawerOpen(true);
                    setAdminRefreshKey((key) => key + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[10px] font-semibold text-amber-200 transition hover:border-amber-400/50 hover:bg-amber-500/15 sm:px-3 sm:text-xs"
                  aria-label={`Open admin analytics. Members: ${adminAnalytics?.totalMembers ?? 'unavailable'}`}
                >
                  🛡️ Admin · 👥 Members: {adminAnalyticsLoading ? '…' : adminAnalytics?.totalMembers.toLocaleString() ?? '—'}
                </button>
              )}
              {currentUser ? (
                <UserMenu
                  user={currentUser}
                  onSignOut={handleSignOut}
                  onDeleteAccount={handleDeleteAccount}
                />
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
        {discussionError && (
          <div role="alert" className="mx-auto mt-4 max-w-7xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {discussionError}
          </div>
        )}
        {authError && (
          <div role="alert" className="mx-auto mt-4 max-w-7xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {authError}
          </div>
        )}
        {activeView === 'visa' && (
          <VisaIntelHub
            currentUser={currentUser}
            discussions={discussions}
            onAddComment={addDiscussionComment}
            onLikeComment={likeDiscussionComment}
            onEditComment={editDiscussionComment}
            onDeleteComment={deleteDiscussionComment}
            onRequestSignIn={() => setSignInOpen(true)}
          />
        )}
        {activeView === 'hub' && (
          <SchoolHub
            currentUser={currentUser}
            discussions={discussions}
            onAddComment={addDiscussionComment}
            onLikeComment={likeDiscussionComment}
            onEditComment={editDiscussionComment}
            onDeleteComment={deleteDiscussionComment}
            onRequestSignIn={() => setSignInOpen(true)}
          />
        )}
        {activeView === 'opportunities' && (
          <OpportunitiesHub
            currentUser={currentUser}
            discussions={discussions}
            onAddComment={addDiscussionComment}
            onLikeComment={likeDiscussionComment}
            onEditComment={editDiscussionComment}
            onDeleteComment={deleteDiscussionComment}
            onRequestSignIn={() => setSignInOpen(true)}
          />
        )}
        {activeView === 'asante' && (
          <Asante
            initiatives={initiatives}
            currentUser={currentUser}
            discussions={discussions}
            onAddComment={addDiscussionComment}
            onLikeComment={likeDiscussionComment}
            onEditComment={editDiscussionComment}
            onDeleteComment={deleteDiscussionComment}
            onUpdateInitiative={updateInitiative}
            onDeleteInitiative={deleteInitiative}
            onRequestSignIn={() => setSignInOpen(true)}
          />
        )}
        {activeView === 'forum' && (
          <StudentForum
            currentUser={currentUser}
            discussions={discussions}
            onAddComment={addDiscussionComment}
            onLikeComment={likeDiscussionComment}
            onEditComment={editDiscussionComment}
            onDeleteComment={deleteDiscussionComment}
            onRequestSignIn={() => setSignInOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-[#060a12]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <img src="/civio-logo.png" alt="Civiohub Logo" className="h-5 w-5 rounded object-cover" />
              <span>Civiohub · Civic Engagement, Admissions &amp; Global Opportunities</span>
            </div>
            <p className="text-xs text-slate-600">
              Community-driven. Transparent. Empowering the next generation.
            </p>
          </div>
        </div>
      </footer>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} onSignIn={handleSignIn} />
      {isAdmin && (
        <AdminActivityDrawer
          open={adminDrawerOpen}
          onClose={() => setAdminDrawerOpen(false)}
          onRefresh={() => setAdminRefreshKey((key) => key + 1)}
          analytics={adminAnalytics}
          loading={adminAnalyticsLoading}
          error={adminAnalyticsError}
          discussions={discussions}
          onRemoveComment={removeDiscussionComment}
        />
      )}
      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        currentUser={currentUser}
        onCreate={handleCreateInitiative}
      />
    </div>
  );
}
