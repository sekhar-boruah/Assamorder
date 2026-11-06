import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell, Button, ErrorNote, Field } from '../components/ui';
import { useAuth } from '../features/auth/AuthProvider';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError('Incorrect email or password.');
    else navigate(from, { replace: true });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your restaurant">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <ErrorNote message={error} />
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-600">
        New to AssamOrder?{' '}
        <Link to="/register" className="font-semibold text-amber-700 hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
