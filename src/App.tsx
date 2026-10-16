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
  Users,
} from 'lucide-react';
import type { View, Initiative, CivioUser, DiscussionComment, DiscussionStore } from '@/types';
import SchoolHub from '@/components/SchoolHub';
import OpportunitiesHub from '@/components/OpportunitiesHub';
import Asante from '@/components/Asante';
import VisaIntelHub from '@/components/VisaIntelHub';
import StudentForum from '@/components/StudentForum';
import CreatePostModal from '@/components/CreatePostModal';
import SignInModal, { SetNewPasswordModal, UserMenu } from '@/components/SignInModal';
import AdminActivityDrawer from '@/components/AdminActivityDrawer';
import { DISCUSSION_STORAGE_KEY, parseDiscussionStore } from '@/data/discussions';
import { supabase } from '@/lib/supabase';
import { parseAdminAnalytics, type AdminAnalytics } from '@/lib/adminAnalytics';
import { getGuestSessionId, resetGuestSessionId, sanitizePlainText } from '@/utils/inputSecurity';
import LegalNotices, { type LegalNotice } from '@/components/LegalNotices';

const ADMIN_EMAIL = 'iamasanteprince@gmail.com';

const TABS: { id: View; label: string; icon: typeof ShieldCheck; description: string; mobileLabel: string }[] = [
  { id: 'hub', label: 'Admissions Hub', icon: GraduationCap, description: 'Universities, $0 App Fees, Waivers', mobileLabel: 'Hub' },
  { id: 'visa', label: 'Visa & Immigration', icon: ShieldCheck, description: 'Student Visa & Immigration Intel', mobileLabel: 'Visa Intel' },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase, description: 'Conferences, Fellowships, Internships', mobileLabel: 'Opps' },
  { id: 'asante', label: 'Asante', icon: Compass, description: 'Admissions, opportunities & intelligence', mobileLabel: 'Asante' },
  { id: 'forum', label: 'Forum', icon: MessageSquare, description: 'Applicant discussions and questions', mobileLabel: 'Forum' },
];

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Go to Hub" className="flex items-center">
      <img
        src="/civio-logo.png"
        alt="CivioHub"
        className="h-8 w-auto object-contain cursor-pointer"
      />
    </button>
  );
}
export default function App() {
  const [activeView, setActiveView] = useState<View>('hub');
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInPrompt, setSignInPrompt] = useState('');

  useEffect(() => {
    if (!signInOpen) setSignInPrompt('');
  }, [signInOpen]);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
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
  const [legalNotice, setLegalNotice] = useState<LegalNotice | null>(null);
  const isAdmin = currentUser?.email.trim().toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSignInOpen(false);
        setResetPasswordOpen(true);
      }
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
    const openRecoveryFromHash = () => {
      if (window.location.hash.toLowerCase().includes('reset-password')) {
        setSignInOpen(false);
        setResetPasswordOpen(true);
      }
    };
    openRecoveryFromHash();
    window.addEventListener('hashchange', openRecoveryFromHash);
    return () => window.removeEventListener('hashchange', openRecoveryFromHash);
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
      setDiscussionError('Account deleted, but browser storage could not be fully cleared. Clear this siteÃ¢â‚¬â„¢s storage in browser settings.');
    }
    setCurrentUser(null);
    setInitiatives([]);
    setDiscussions({});
    setActiveView('hub');
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
    <div className="box-border w-full max-w-full overflow-x-hidden min-h-screen bg-[#faf9f6] text-stone-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full max-w-full border-b border-stone-200 bg-[#faf9f6]/90 text-stone-900 backdrop-blur-md">
        <div className="w-full max-w-full px-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 py-3">
            <Logo onClick={() => setActiveView('hub')} />

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminDrawerOpen(true);
                    setAdminRefreshKey((key) => key + 1);
                  }}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 py-2 text-[10px] font-semibold text-stone-700 transition hover:border-stone-300 sm:px-3 sm:text-xs"
                  aria-label={`Open admin analytics. Members: ${adminAnalytics?.totalMembers ?? 'unavailable'}`}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="sm:hidden">Admin</span>
                  <span className="hidden sm:inline">Admin Ã‚Â·</span>
                  <Users className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                  <span className="hidden sm:inline">Members: {adminAnalyticsLoading ? 'Ã¢â‚¬Â¦' : adminAnalytics?.totalMembers.toLocaleString() ?? 'Ã¢â‚¬â€'}</span>
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
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors duration-150 hover:border-stone-300 hover:bg-stone-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              <button
                onClick={() => setCreatePostOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-2 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-stone-700 sm:px-3"
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
          <nav className="mx-auto hidden max-w-7xl items-center gap-1 pb-0.5 lg:flex">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeView === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`group relative inline-flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    active ? 'font-semibold text-stone-900' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-[#faf9f6]">
            <div className="w-full max-w-full px-3 py-3 space-y-1 sm:px-4">
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
                        ? 'bg-white font-semibold text-stone-900 border border-stone-200'
                        : 'text-stone-600 hover:bg-white hover:text-stone-900 border border-transparent'
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
      <nav className="fixed bottom-2 left-2 right-2 z-30 box-border max-w-full rounded-2xl border border-stone-200 bg-[#faf9f6]/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5 items-center gap-1 px-1.5 py-2">
          {TABS.map(({ id, mobileLabel, icon: Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex min-w-0 w-full flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-all ${
                  active ? 'font-semibold text-stone-900' : 'text-stone-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className="max-w-full truncate text-[10px] font-medium">{mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-full overflow-x-hidden pb-24 lg:pb-0">
        {discussionError && (
          <div role="alert" className="mx-auto mt-4 w-full max-w-7xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {discussionError}
          </div>
        )}
        {authError && (
          <div role="alert" className="mx-auto mt-4 w-full max-w-7xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {authError}
          </div>
        )}
        {activeView === 'visa' && (
          <VisaIntelHub />
        )}
        {activeView === 'hub' && (
          <SchoolHub
            currentUser={currentUser}
            onRequestSignIn={(message) => {
              setSignInPrompt(message ?? '');
              setSignInOpen(true);
            }}
          />
        )}
        {activeView === 'opportunities' && (
          <OpportunitiesHub />
        )}
        {activeView === 'asante' && (
          <Asante
            initiatives={initiatives}
            currentUser={currentUser}
            onUpdateInitiative={updateInitiative}
            onDeleteInitiative={deleteInitiative}
          />
        )}
        {activeView === 'forum' && (
          <StudentForum
            currentUser={currentUser}
            discussions={discussions}
            discussionsReady={discussionsReady}
            onAddComment={addDiscussionComment}
            onLikeComment={likeDiscussionComment}
            onEditComment={editDiscussionComment}
            onDeleteComment={deleteDiscussionComment}
            onRequestSignIn={() => setSignInOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-200 bg-[#faf9f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <img src="/civio-logo.png" alt="Civiohub Logo" className="h-5 w-5 rounded object-cover" />
              <span>Civiohub Ã‚Â· Civic Engagement, Admissions &amp; Global Opportunities</span>
            </div>
            <p className="text-xs text-slate-600">
              Community-driven. Transparent. Empowering the next generation.
            </p>
          </div>
          <nav aria-label="Legal information" className="mt-4 flex justify-center gap-5 border-t border-slate-800 pt-4">
            <button type="button" onClick={() => setLegalNotice('terms')} className="text-xs text-slate-400 transition-colors hover:text-slate-200">
              Terms of Service
            </button>
            <button type="button" onClick={() => setLegalNotice('privacy')} className="text-xs text-slate-400 transition-colors hover:text-slate-200">
              Privacy Policy
            </button>
          </nav>
        </div>
      </footer>

      {legalNotice && <LegalNotices initialNotice={legalNotice} onClose={() => setLegalNotice(null)} />}
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} onSignIn={handleSignIn} promptMessage={signInPrompt} />
      {resetPasswordOpen && (
        <SetNewPasswordModal onClose={() => setResetPasswordOpen(false)} />
      )}
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
