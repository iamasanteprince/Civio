import { useEffect, useState } from 'react';
import { LogOut, Lock, Mail, X, ShieldCheck, Settings, Trash2, KeyRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { CivioUser } from '@/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  clearAuthCooldown,
  getAuthCooldownRemaining,
  recordAuthFailure,
  sanitizePlainText,
} from '@/utils/inputSecurity';
import LegalNotices, { type LegalNotice } from '@/components/LegalNotices';

const GENERIC_AUTH_ERROR = 'Unable to complete request. Please verify your email and password.';
const AGE_CONSENT_TEXT = 'I am 18 or older, or I have permission from a parent or guardian to use this app.';

function getRequestErrorMessage(error: unknown, fallback = GENERIC_AUTH_ERROR): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function toCivioUser(user: User): CivioUser | null {
  if (!user.email) return null;
  const displayName =
    typeof user.user_metadata.display_name === 'string'
      ? sanitizePlainText(user.user_metadata.display_name).slice(0, 80)
      : user.email.split('@')[0];
  const isVerified = Boolean(
    user.email_confirmed_at ||
    user.app_metadata.provider === 'google' ||
    (Array.isArray(user.identities) && user.identities.some((identity) => identity.provider === 'google'))
  );
  return { id: user.id, email: user.email, displayName: displayName || user.email.split('@')[0], isVerified };
}

export default function SignInModal({
  open,
  onClose,
  onSignIn,
  captchaToken,
  promptMessage,
}: {
  open: boolean;
  onClose: () => void;
  onSignIn: (user: CivioUser) => void;
  captchaToken?: string;
  promptMessage?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageConsent, setAgeConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'reset-request'>('sign-in');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(() => getAuthCooldownRemaining());

  useEffect(() => {
    if (!open || cooldownMs <= 0) return;
    const timer = window.setInterval(() => setCooldownMs(getAuthCooldownRemaining()), 250);
    return () => window.clearInterval(timer);
  }, [open, cooldownMs]);

  if (!open) return null;

  const waitSeconds = Math.ceil(cooldownMs / 1000);
  const failRequest = (message = GENERIC_AUTH_ERROR) => {
    recordAuthFailure();
    setCooldownMs(getAuthCooldownRemaining());
    setError(message);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'sign-up' && !ageConsent) {
      setError('Please confirm the age or parent/guardian permission statement.');
      return;
    }
    if (waitSeconds > 0 || loading) return;
    if (!supabase) {
      failRequest();
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign-up') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            ...(captchaToken ? { captchaToken } : {}),
            data: {
              age_consent_given: true,
              age_consent_timestamp: new Date().toISOString(),
            },
          },
        });
        if (authError) {
          failRequest(authError.message);
          return;
        }
        clearAuthCooldown();
        setCooldownMs(0);
        if (data.session && data.user) {
          const user = toCivioUser(data.user);
          if (user) {
            onSignIn(user);
            setEmail('');
            setPassword('');
            setAgeConsent(false);
            onClose();
            return;
          }
        }
        setNotice('If your account can be created, check your email for the next step.');
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (authError) {
        failRequest(authError.message);
        return;
      }
      const user = data.user ? toCivioUser(data.user) : null;
      if (!user) {
        failRequest();
        return;
      }
      clearAuthCooldown();
      setCooldownMs(0);
      onSignIn(user);
      setEmail('');
      setPassword('');
      onClose();
    } catch (requestError) {
      failRequest(getRequestErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim() || loading) return;
    if (!supabase) {
      setNotice('');
      setError('Account services are not configured. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/#reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setNotice('If an account exists for this email, a reset link has been sent.');
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Unable to send the reset link. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setNotice('');
    if (waitSeconds > 0 || loading) return;
    if (!supabase) {
      failRequest();
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (authError) {
        failRequest(authError.message);
        setLoading(false);
      }
    } catch (requestError) {
      failRequest(getRequestErrorMessage(requestError));
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-2xl animate-modalIn"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="relative mb-3 inline-flex items-center justify-center">
                <img
                  src="/civio-logo.png"
                  alt="Civiohub Logo"
                  className="relative h-12 w-12 rounded-lg border border-slate-700 object-cover"
                />
              </div>
              <h2 id="auth-title" className="font-serif text-xl font-semibold text-stone-900">
                {mode === 'sign-in'
                  ? 'Sign In to Civiohub'
                  : mode === 'sign-up'
                    ? 'Create Your Civiohub Account'
                    : 'Reset Your Password'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {mode === 'sign-in'
                  ? 'Connect to submit initiatives and join community discussions.'
                  : mode === 'sign-up'
                    ? 'Create a free account to join the Civiohub community.'
                    : 'Enter your account email and we will send a password reset link.'}
              </p>
              {promptMessage && mode !== 'reset-request' && (
                <p className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs leading-relaxed text-stone-700">
                  {promptMessage}
                </p>
              )}
            </div>

            {mode !== 'reset-request' && (
              <div className="mb-5 flex gap-1 rounded-xl bg-slate-800/60 p-1">
                {(['sign-in', 'sign-up'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setMode(option);
                      setError('');
                      setNotice('');
                    }}
                    aria-pressed={mode === option}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                      mode === option ? 'bg-[#003574] text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {option === 'sign-in' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>
            )}

            {mode === 'reset-request' ? (
              <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-[#0498cc]/50 focus:bg-slate-800"
                    />
                  </div>
                </div>
                {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
                {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{notice}</p>}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full rounded-xl bg-[#003574] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#003574] disabled:opacity-50"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('sign-in');
                    setError('');
                    setNotice('');
                  }}
                  className="w-full rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-[#0498cc]/50 focus:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-[#0498cc]/50 focus:bg-slate-800"
                  />
                </div>
              </div>
              {mode === 'sign-in' && (
                <div className="-mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset-request');
                      setError('');
                      setNotice('');
                    }}
                    className="text-xs font-medium text-[#0498cc] underline decoration-indigo-500/40 underline-offset-2 hover:text-[#003574]"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {mode === 'sign-up' && (
                <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                  <div className="flex items-start gap-2">
                    <input
                      id="age-consent"
                      type="checkbox"
                      checked={ageConsent}
                      onChange={(event) => setAgeConsent(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-[#0498cc] focus:ring-indigo-500"
                    />
                    <label htmlFor="age-consent" className="text-xs leading-relaxed text-slate-300">
                      {AGE_CONSENT_TEXT}
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    className="ml-6 mt-1 inline-flex items-center gap-1 text-xs text-[#0498cc] underline decoration-indigo-500/40 underline-offset-2 hover:text-[#003574]"
                  >
                    Privacy Policy
                  </button>
                </div>
              )}

              {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
              {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{notice}</p>}
              {!isSupabaseConfigured() && (
                <p className="text-xs text-slate-500">
                  Account services are not configured. Public browsing remains available.
                </p>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  waitSeconds > 0 ||
                  !email.trim() ||
                  !password ||
                  password.length < 8 ||
                  (mode === 'sign-up' && !ageConsent)
                }
                className="w-full rounded-md bg-[#003574] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#003574] disabled:opacity-50"
              >
                {loading ? 'Connecting...' : waitSeconds > 0 ? `Please wait ${waitSeconds}s` : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            )}

            {mode !== 'reset-request' && <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs text-slate-500">or</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>}

            {mode !== 'reset-request' && <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={loading || waitSeconds > 0}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>}
            {mode !== 'reset-request' && <p className="mt-3 text-center text-[11px] text-slate-500">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
              Authentication is handled by Supabase. Civio never stores your password.
            </p>}
          </div>
        </div>
      </div>
      {privacyOpen && <LegalNotices initialNotice="privacy" onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}

export function UserMenu({
  user,
  onSignOut,
  onDeleteAccount,
}: {
  user: CivioUser;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legalNotice, setLegalNotice] = useState<LegalNotice | null>(null);
  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-2">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-2 py-1.5 sm:px-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003574] text-xs font-bold text-white">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="max-w-[120px] truncate text-xs font-medium text-slate-200 sm:max-w-none sm:text-sm">{user.email}</span>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Account settings"
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition-all hover:bg-slate-800 hover:text-stone-900"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-stone-900"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
      {settingsOpen && (
        <AccountSettingsModal
          user={user}
          onClose={() => setSettingsOpen(false)}
          onDeleteAccount={onDeleteAccount}
          onOpenLegal={setLegalNotice}
        />
      )}
      {legalNotice && <LegalNotices initialNotice={legalNotice} onClose={() => setLegalNotice(null)} />}
    </>
  );
}

function AccountSettingsModal({
  user,
  onClose,
  onDeleteAccount,
  onOpenLegal,
}: {
  user: CivioUser;
  onClose: () => void;
  onDeleteAccount: () => Promise<void>;
  onOpenLegal: (notice: LegalNotice) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [error, setError] = useState('');

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordNotice('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The passwords do not match.');
      return;
    }
    if (!supabase) {
      setPasswordError('Account services are not configured. Please try again later.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      setPasswordNotice('Password updated successfully.');
    } catch (requestError) {
      setPasswordError(getRequestErrorMessage(requestError, 'Unable to update your password. Please try again.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setError('');
    try {
      await onDeleteAccount();
    } catch {
      setError('Unable to delete your account right now. Please try again or contact support.');
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="account-settings-title" className="font-serif text-xl font-semibold text-stone-900">Account Settings</h2>
            <p className="mt-1 text-sm text-slate-400">Manage your account and personal data.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close account settings" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-stone-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-5 rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <h3 className="flex items-center gap-2 font-bold text-slate-200">
            <KeyRound className="h-4 w-4 text-[#0498cc]" /> Security
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Update the password for {user.email}.
          </p>
          <form onSubmit={updatePassword} className="mt-4 space-y-3">
            <div>
              <label htmlFor="settings-new-password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">New Password</label>
              <input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#0498cc]/50"
              />
            </div>
            <div>
              <label htmlFor="settings-confirm-password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm New Password</label>
              <input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#0498cc]/50"
              />
            </div>
            {passwordError && <p role="alert" className="text-sm text-rose-300">{passwordError}</p>}
            {passwordNotice && <p role="status" className="text-sm text-emerald-300">{passwordNotice}</p>}
            <button
              type="submit"
              disabled={passwordLoading || newPassword.length < 8 || confirmPassword.length < 8}
              className="rounded-lg bg-[#003574] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#003574] disabled:opacity-50"
            >
              {passwordLoading ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-4">
          <h3 className="flex items-center gap-2 font-bold text-rose-200">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Permanently delete your account and associated personal data.
          </p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-4 rounded-lg border border-rose-500/40 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Delete Account
            </button>
          ) : (
            <div className="mt-4 rounded-lg border border-rose-500/30 bg-slate-950/50 p-3">
              <p className="text-sm font-medium leading-relaxed text-rose-100">
                Are you sure you want to delete your account? This action is permanent and removes your profile and personal data.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void deleteAccount()}
                  disabled={deleting}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Permanently Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        </section>
        <nav aria-label="Legal information" className="mt-5 flex gap-5 border-t border-slate-800 pt-4">
          <button type="button" onClick={() => onOpenLegal('terms')} className="text-xs text-slate-400 transition-colors hover:text-slate-200">Terms of Service</button>
          <button type="button" onClick={() => onOpenLegal('privacy')} className="text-xs text-slate-400 transition-colors hover:text-slate-200">Privacy Policy</button>
        </nav>
      </section>
    </div>
  );
}

export function SetNewPasswordModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submitNewPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    if (!supabase) {
      setError('Account services are not configured. Please request a new reset link later.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`
      );
      setPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Unable to update your password. Request a new reset link and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-password-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close set new password"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 id="set-password-title" className="pr-8 font-serif text-xl font-semibold text-stone-900">
          Set New Password
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Choose a new password with at least 8 characters.
        </p>

        {success ? (
          <div className="mt-5 space-y-4">
            <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Password updated successfully. You are signed in.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#003574] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003574]"
            >
              Continue to Civiohub
            </button>
          </div>
        ) : (
          <form onSubmit={submitNewPassword} className="mt-5 space-y-4">
            <div>
              <label htmlFor="recovery-new-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="recovery-new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#0498cc]/50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="recovery-confirm-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="recovery-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#0498cc]/50"
                />
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
            <button
              type="submit"
              disabled={loading || password.length < 8 || confirmPassword.length < 8}
              className="w-full rounded-xl bg-[#003574] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003574] disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
