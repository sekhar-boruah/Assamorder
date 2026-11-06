import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthShell, Button, ErrorNote, Field } from '../components/ui';
import { useAuth } from '../features/auth/AuthProvider';
import { friendlyError, slugify } from '../lib/errors';
import { supabase } from '../lib/supabase';

export default function Onboarding() {
  const { memberships, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && memberships.length > 0) return <Navigate to="/dashboard" replace />;

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc('register_restaurant', { p_name: name, p_slug: slug });
    if (err) {
      setBusy(false);
      setError(friendlyError(err.message));
      return;
    }
    await refresh();
    setBusy(false);
    navigate('/dashboard', { replace: true });
  }

  return (
    <AuthShell title="Set up your restaurant" subtitle="You can change branding and details later">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Restaurant name" required value={name} onChange={(e) => onNameChange(e.target.value)} />
        <Field
          label="Web address"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          hint={`Customers will visit /r/${slug || 'your-restaurant'}`}
        />
        <ErrorNote message={error} />
        <Button type="submit" loading={busy} className="w-full">Create restaurant</Button>
      </form>
    </AuthShell>
  );
}
