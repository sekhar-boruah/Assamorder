import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthShell, Button, ErrorNote, Field } from '../components/ui';
import { useAuth } from '../features/auth/AuthProvider';
import { supabase } from '../lib/supabase';

export default function Register() {
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  if (!loading && session) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setBusy(false);
    if (err) setError(err.message);
    else if (!data.session) setCheckEmail(true); // email confirmation is enabled
  }

  if (checkEmail) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${email}`}>
        <p className="text-sm text-stone-600">Open the link, then come back and sign in.</p>
        <Link to="/login" className="mt-4 block text-center text-sm font-semibold text-amber-700 hover:underline">Go to sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Start your free trial in a minute">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Your name" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters" />
        <ErrorNote message={error} />
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-600">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-amber-700 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
