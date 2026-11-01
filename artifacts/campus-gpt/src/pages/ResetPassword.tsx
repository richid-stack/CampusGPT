import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth';

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const linkError = params.get('error');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (error) setError(error.message || 'Could not reset your password.');
    else setDone(true);
  }

  const base = import.meta.env.BASE_URL;
  const invalid = !token || !!linkError;

  return (
    <div className="min-h-full flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Choose a new password</h1>
        {done ? (
          <>
            <p className="text-sm text-muted-foreground">Your password has been updated. You can sign in now.</p>
            <a href={base} className="block w-full h-11 leading-[2.75rem] text-center rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium">Go to sign in</a>
          </>
        ) : invalid ? (
          <>
            <p className="text-sm text-muted-foreground">This reset link is invalid or has expired. Request a new one from the sign-in page.</p>
            <a href={base} className="text-sm font-medium text-primary hover:underline">Back to sign in</a>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">New password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
                className="mt-1 w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <span className="text-xs text-muted-foreground mt-1 block">At least 8 characters.</span>
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
