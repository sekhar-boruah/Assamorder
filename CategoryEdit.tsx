import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LangTabs } from '../components/LangTabs';
import { Button, Card, ErrorNote, Field, Spinner } from '../components/ui';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { friendlyError } from '../lib/errors';
import { emptyI18n, toI18n } from '../lib/menu';
import { supabase } from '../lib/supabase';
import type { Lang } from '../types/db';

export default function CategoryEdit() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { restaurant } = useRestaurant();
  const [lang, setLang] = useState<Lang>('en');
  const [names, setNames] = useState(emptyI18n());
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    let off = false;
    Promise.all([
      supabase.from('categories').select('is_active').eq('id', id).eq('restaurant_id', restaurant.id).maybeSingle(),
      supabase.from('category_translations').select('lang, name').eq('category_id', id),
    ]).then(([c, t]) => {
      if (off) return;
      if (c.error || !c.data) setError('Category not found.');
      else {
        setActive(c.data.is_active);
        setNames(toI18n((t.data ?? []) as { lang: string }[], 'name'));
      }
      setLoading(false);
    });
    return () => {
      off = true;
    };
  }, [id, isNew, restaurant.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!names.en.trim()) {
      setLang('en');
      setError('Enter the English name.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.rpc('save_category', {
      p_restaurant_id: restaurant.id,
      p_category: { id: isNew ? null : id, is_active: active, names },
    });
    setSaving(false);
    if (err) setError(friendlyError(err.message));
    else navigate('/dashboard/menu');
  }

  if (loading) return <Spinner />;

  return (
    <>
      <Link to="/dashboard/menu" className="text-sm font-medium text-stone-600 hover:underline">&larr; Back to menu</Link>
      <h1 className="text-2xl font-bold tracking-tight">{isNew ? 'New category' : 'Edit category'}</h1>
      <form onSubmit={onSubmit} className="space-y-5">
        <Card title="Name">
          <LangTabs value={lang} onChange={setLang} filled={names} />
          <Field
            label={lang === 'en' ? 'Name (required)' : 'Name'}
            value={names[lang]}
            maxLength={80}
            onChange={(e) => setNames({ ...names, [lang]: e.target.value })}
            lang={lang === 'as' ? 'as' : lang === 'hi' ? 'hi' : 'en'}
          />
        </Card>
        <Card>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-amber-700" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Show this category to customers
          </label>
        </Card>
        <ErrorNote message={error} />
        <Button type="submit" loading={saving}>Save category</Button>
      </form>
    </>
  );
}
