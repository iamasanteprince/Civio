import { useState } from 'react';
import { X, Mail, Lock, Landmark, LogOut } from 'lucide-react';
import type { CivioUser } from '@/types';

export default function SignInModal({
  open,
  onClose,
  onSignIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignIn: (user: CivioUser) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  if (!open) return null;

  const handleAuth = (userEmail?: string) => {
    setLoading(true);
    const finalEmail = userEmail || email.trim();
    if (!finalEmail) return;
    setTimeout(() => {
      const displayName = finalEmail.split('@')[0];
      onSignIn({ email: finalEmail, displayName });
      setLoading(false);
      setEmail('');
      setPassword('');
      onClose();
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    handleAuth();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl animate-modalIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="relative inline-flex items-center justify-center mb-3">
              <div className="absolute inset-0 rounded-xl bg-indigo-500/30 blur-md animate-pulseGlow" />
              <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 w-12 h-12 border border-indigo-400/30">
                <Landmark className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'sign-in' ? 'Sign In to Civio' : 'Create Your Civio Account'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {mode === 'sign-in'
                ? 'Connect to post initiatives, vote, and join discussions.'
                : 'Join the Civio community to make your voice heard.'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-800/60 mb-5">
            <button
              onClick={() => setMode('sign-in')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'sign-in'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('sign-up')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'sign-up'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Connecting...' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <button
            onClick={() => handleAuth('demo.user@gmail.com')}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserMenu({
  user,
  onSignOut,
}: {
  user: CivioUser;
  onSignOut: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5">
        <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 w-7 h-7 text-xs font-bold text-white">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-slate-200 font-medium hidden sm:inline">{user.email}</span>
      </div>
      <button
        onClick={onSignOut}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  );
}
