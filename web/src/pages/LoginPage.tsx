import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const redirect = params.get('redirect') ?? (location.state as { from?: string } | null)?.from ?? null;
  const target = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
  const [tab, setTab] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error: err } = tab === 'login' ? await signIn(email, password) : await signUp(email, password, fullName);
    setBusy(false);
    if (err) return setError(err);
    navigate(target, { replace: true });
  }

  const input = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900';
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="grid grid-cols-2 border-b">
          {(['login', 'signup'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(null); }}
              className={`py-4 text-sm font-semibold transition ${tab === t ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}>
              {t === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4 p-8">
          <h1 className="text-2xl font-semibold">{tab === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          {tab === 'signup' && <input className={input} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
          <input className={input} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password" minLength={6} autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 py-3 font-semibold text-white hover:brightness-95 disabled:opacity-70">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{tab === 'login' ? 'Log in' : 'Sign up'}
          </button>
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            Demo account: <span className="font-mono">demo@staybnb.test</span> / <span className="font-mono">Demo1234!</span>
            {tab === 'login' && (
              <button type="button" onClick={() => { setEmail('demo@staybnb.test'); setPassword('Demo1234!'); }}
                className="ml-2 font-semibold text-gray-900 underline">Use it</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
