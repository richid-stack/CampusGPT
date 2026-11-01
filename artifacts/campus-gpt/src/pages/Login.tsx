import { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { authClient, appUrl } from '@/lib/auth';
import { useAuthConfig } from '@/hooks/useAuthConfig';

type Mode = 'signin' | 'signup' | 'forgot' | 'check-inbox' | 'reset-sent';

const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary';

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function Login() {
  const { data: config } = useAuthConfig();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domains = config?.allowedEmailDomains ?? [];
  const providers = config?.socialProviders ?? [];
  const isSignup = mode === 'signup';

  const go = (m: Mode) => { setMode(m); setError(null); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { error } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password, callbackURL: appUrl('/') });
        if (error) throw error;
        go('check-inbox');
      } else if (mode === 'signin') {
        const { error } = await authClient.signIn.email({ email: email.trim(), password, callbackURL: appUrl('/') });
        if (error) {
          if (error.code === 'EMAIL_NOT_VERIFIED') { go('check-inbox'); return; }
          throw error;
        }
        // useSession in AuthGate picks up the new session and swaps screens.
      } else if (mode === 'forgot') {
        // Same message whether or not the account exists (no account enumeration).
        await authClient.requestPasswordReset({ email: email.trim(), redirectTo: appUrl('/reset-password') });
        go('reset-sent');
      }
    } catch (err) {
      setError((err as { message?: string })?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: 'microsoft' | 'google') {
    setError(null);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: appUrl('/'),
      errorCallbackURL: appUrl('/'),
    });
    if (error) setError(error.message || 'Could not start sign-in.');
  }

  async function resend() {
    setBusy(true);
    setError(null);
    const { error } = await authClient.sendVerificationEmail({ email: email.trim(), callbackURL: appUrl('/') });
    setBusy(false);
    if (error) setError(error.message || 'Could not resend the email.');
  }

  const card = (children: React.ReactNode) => (
    <div className="min-h-full flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-primary text-white items-center justify-center font-semibold text-lg mb-4">C</div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">CampusGPT</h1>
          <p className="text-sm text-muted-foreground mt-1">Your campus, in conversation.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );

  if (mode === 'check-inbox' || mode === 'reset-sent') {
    const reset = mode === 'reset-sent';
    return card(
      <div className="text-center space-y-3">
        <div className="mx-auto w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <MailCheck className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{reset ? 'Check your email' : 'Verify your student email'}</h2>
        <p className="text-sm text-muted-foreground">
          {reset
            ? <>If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a link to reset your password.</>
            : <>We sent a link to <span className="font-medium text-foreground">{email}</span>. Open it to finish signing in. It may take a minute to arrive.</>}
        </p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {!reset && (
          <button onClick={resend} disabled={busy} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
            {busy ? 'Sending…' : 'Resend email'}
          </button>
        )}
        <div>
          <button onClick={() => go('signin')} className="text-sm text-muted-foreground hover:text-foreground">Back to sign in</button>
        </div>
      </div>
    );
  }

  return card(
    <>
      {mode !== 'forgot' && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-background border border-border rounded-xl mb-5" role="tablist">
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => go(m)}
              className={`h-9 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-card shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
      )}

      {mode === 'forgot' && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Reset your password</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your student email and we'll send you a link.</p>
        </div>
      )}

      {mode !== 'forgot' && providers.length > 0 && (
        <>
          <div className="space-y-2">
            {providers.includes('microsoft') && (
              <button type="button" onClick={() => social('microsoft')} className="w-full h-11 rounded-xl border border-border bg-background hover:bg-card text-sm font-medium text-foreground flex items-center justify-center gap-2.5 transition-colors">
                <MicrosoftIcon /> Continue with Microsoft
              </button>
            )}
            {providers.includes('google') && (
              <button type="button" onClick={() => social('google')} className="w-full h-11 rounded-xl border border-border bg-background hover:bg-card text-sm font-medium text-foreground flex items-center justify-center gap-2.5 transition-colors">
                <GoogleIcon /> Continue with Google
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 my-4 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or use email <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-3">
        {isSignup && (
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Full name</span>
            <input className={`${inputClass} mt-1`} value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
          </label>
        )}
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Student email</span>
          <input
            className={`${inputClass} mt-1`}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={domains[0] ? `you@${domains[0]}` : 'you@example.com'}
            autoComplete="email"
            required
          />
        </label>
        {mode !== 'forgot' && (
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <input
              className={`${inputClass} mt-1`}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
            {isSignup && <span className="text-xs text-muted-foreground mt-1 block">At least 8 characters.</span>}
          </label>
        )}

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        {mode === 'signin' && (
          <button onClick={() => go('forgot')} className="text-muted-foreground hover:text-foreground">Forgot your password?</button>
        )}
        {mode === 'forgot' && (
          <button onClick={() => go('signin')} className="text-muted-foreground hover:text-foreground">Back to sign in</button>
        )}
        {isSignup && domains.length > 0 && (
          <p className="text-xs text-muted-foreground">Only {domains.map(d => `@${d}`).join(', ')} emails can sign up.</p>
        )}
      </div>
    </>
  );
}
