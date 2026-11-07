import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Spinner } from '../../components/ui';
import { readableOn, useLang } from '../../features/public/useLang';
import { fmt12, openStatus } from '../../lib/hours';
import { t } from '../../lib/i18n';
import { formatPrice, LANGS } from '../../lib/menu';
import { getMenu, getRestaurant, pick, resolveTable, type PublicItem, type PublicMenu, type PublicRestaurant } from '../../lib/publicApi';
import { assetUrl } from '../../lib/storage';
import type { Lang } from '../../types/db';

function VegMark({ veg }: { veg: boolean }) {
  return (
    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 ${veg ? 'border-emerald-700' : 'border-red-700'}`} aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}>
      <span className={`h-2 w-2 rounded-full ${veg ? 'bg-emerald-700' : 'bg-red-700'}`} />
    </span>
  );
}

const lowestPrice = (i: PublicItem) => (i.variants.length > 0 ? Math.min(...i.variants.map((v) => v.price_paise)) : i.price_paise);
const priceLabel = (i: PublicItem, lang: Lang) => (i.variants.length > 0 ? t(lang, 'from', { price: formatPrice(lowestPrice(i)) }) : formatPrice(i.price_paise));

function ItemSheet({ item, lang, brand, onClose }: { item: PublicItem; lang: Lang; brand: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  const img = assetUrl(item.image_path);
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={pick(item.names, lang)} onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl">
        {img && <img src={img} alt="" className="h-56 w-full object-cover" />}
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-2">
            <span className="mt-1.5"><VegMark veg={item.is_veg} /></span>
            <h2 className="text-xl font-bold">{pick(item.names, lang)}</h2>
          </div>
          {pick(item.descriptions, lang) && <p className="text-stone-600">{pick(item.descriptions, lang)}</p>}
          {item.variants.length === 0 && <p className="text-lg font-semibold" style={{ color: brand }}>{formatPrice(item.price_paise)}</p>}
          {item.variants.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-stone-500">{t(lang, 'sizes')}</h3>
              <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {item.variants.map((v) => (
                  <li key={v.id} className={`flex justify-between px-3 py-2.5 ${v.is_available ? '' : 'text-stone-400'}`}>
                    <span>{pick(v.names, lang)}{!v.is_available && ` (${t(lang, 'soldOut')})`}</span>
                    <span className="font-medium">{formatPrice(v.price_paise)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {item.addons.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-stone-500">{t(lang, 'addons')}</h3>
              <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {item.addons.map((a) => (
                  <li key={a.id} className={`flex justify-between px-3 py-2.5 ${a.is_available ? '' : 'text-stone-400'}`}>
                    <span>{pick(a.names, lang)}</span>
                    <span className="font-medium">+{formatPrice(a.price_paise)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button onClick={onClose} className="h-11 w-full rounded-xl border border-stone-300 font-semibold text-stone-700">{t(lang, 'close')}</button>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantPage() {
  const { slug = '' } = useParams();
  const [search] = useSearchParams();
  const tableToken = search.get('table');

  const [state, setState] = useState<'loading' | 'notfound' | 'error' | 'ready'>('loading');
  const [r, setR] = useState<PublicRestaurant | null>(null);
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [tableLabel, setTableLabel] = useState<string | null>(null);
  const { lang, setLang } = useLang(r?.settings.default_language);

  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [selected, setSelected] = useState<PublicItem | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const rest = await getRestaurant(slug);
      if (!rest) return setState('notfound');
      setR(rest);
      if (rest.available) setMenu((await getMenu(slug)) ?? { categories: [] });
      if (tableToken) {
        const tb = await resolveTable(tableToken);
        setTableLabel(tb && tb.slug === rest.slug ? tb.label : null);
      }
      setState('ready');
    } catch {
      setState('error');
    }
  }, [slug, tableToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!menu) return [];
    return menu.categories
      .filter((c) => cat === 'all' || c.id === cat)
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => {
          if (vegOnly && !i.is_veg) return false;
          if (!q) return true;
          return Object.values(i.names).some((n) => n?.toLowerCase().includes(q));
        }),
      }))
      .filter((c) => c.items.length > 0);
  }, [menu, cat, vegOnly, q]);

  if (state === 'loading') return <Spinner />;
  if (state === 'notfound' || state === 'error' || !r) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" lang={lang}>
        <p className="text-lg text-stone-700">{state === 'error' ? t(lang, 'loadError') : t(lang, 'notFound')}</p>
        {state === 'error' && <button onClick={() => void load()} className="h-11 rounded-xl bg-stone-900 px-6 font-semibold text-white">{t(lang, 'retry')}</button>}
      </main>
    );
  }

  const primary = r.branding.primary_color;
  const onPrimary = readableOn(primary);
  const cover = assetUrl(r.branding.cover_path);
  const logo = assetUrl(r.branding.logo_path);
  const status = openStatus(r.settings.opening_hours);
  const hoursLine = status.today ? (status.today.closed ? t(lang, 'closedToday') : `${t(lang, 'today')}: ${fmt12(status.today.open)} - ${fmt12(status.today.close)}`) : null;
  const htmlLang = lang === 'as' ? 'as' : lang === 'hi' ? 'hi' : 'en';

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white pb-16 shadow-sm" lang={htmlLang}>
      <header>
        <div className="relative h-40 bg-cover bg-center sm:h-52" style={{ backgroundColor: r.branding.secondary_color, backgroundImage: cover ? `url(${cover})` : undefined }}>
          <div role="group" aria-label="Language" className="absolute right-3 top-3 flex gap-1 rounded-full bg-white/90 p-1 shadow">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} aria-pressed={lang === l.code}
                className="rounded-full px-3 py-1 text-sm font-medium"
                style={lang === l.code ? { backgroundColor: primary, color: onPrimary } : { color: '#44403c' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-9 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white text-3xl font-bold shadow" style={{ backgroundColor: primary, color: onPrimary }}>
            {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : r.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{r.name}</h1>
          {r.branding.description && <p className="mt-1 text-stone-600">{r.branding.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
            {status.known && <span className={`font-semibold ${status.open ? 'text-emerald-700' : 'text-red-700'}`}>{status.open ? t(lang, 'openNow') : t(lang, 'closedNow')}</span>}
            {hoursLine && <span>{hoursLine}</span>}
          </div>
          {(r.branding.address || r.branding.contact_phone) && (
            <p className="mt-1 text-sm text-stone-500">
              {r.branding.address}
              {r.branding.address && r.branding.contact_phone ? ' \u00B7 ' : ''}
              {r.branding.contact_phone && <a href={`tel:${r.branding.contact_phone.replace(/[^0-9+]/g, '')}`} className="underline">{r.branding.contact_phone}</a>}
            </p>
          )}
          {tableLabel && (
            <p className="mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: primary, color: onPrimary }}>
              {t(lang, 'table')}: {tableLabel}
            </p>
          )}
        </div>
      </header>

      {!r.available || !menu ? (
        <p className="mx-4 rounded-2xl bg-stone-100 p-5 text-center text-stone-700">{t(lang, 'unavailable')}</p>
      ) : (
        <>
          <div className="sticky top-0 z-10 space-y-2 border-y border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(lang, 'search')} aria-label={t(lang, 'search')}
              className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base outline-none focus:ring-2" style={{ '--tw-ring-color': primary } as CSSProperties} />
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[{ id: 'all', label: t(lang, 'all') }, ...menu.categories.map((c) => ({ id: c.id, label: pick(c.names, lang) }))].map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
                  className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium"
                  style={cat === c.id ? { backgroundColor: primary, color: onPrimary, borderColor: primary } : { borderColor: '#d6d3d1', color: '#44403c' }}>
                  {c.label}
                </button>
              ))}
              <label className="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-stone-700">
                <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} className="h-4 w-4" style={{ accentColor: primary }} />
                {t(lang, 'vegOnly')}
              </label>
            </div>
          </div>

          <div className="space-y-6 px-4 pt-4">
            {visible.length === 0 && <p className="py-10 text-center text-stone-500">{t(lang, 'noResults')}</p>}
            {visible.map((c) => (
              <section key={c.id}>
                <h2 className="mb-2 text-lg font-bold">{pick(c.names, lang)}</h2>
                <ul className="divide-y divide-stone-100">
                  {c.items.map((i) => {
                    const img = assetUrl(i.image_path);
                    return (
                      <li key={i.id}>
                        <button onClick={() => setSelected(i)} className={`flex w-full items-center gap-3 py-3 text-left ${i.is_available ? '' : 'opacity-60'}`}>
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 font-semibold"><VegMark veg={i.is_veg} /><span>{pick(i.names, lang)}</span></p>
                            {pick(i.descriptions, lang) && <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{pick(i.descriptions, lang)}</p>}
                            <p className="mt-1 text-sm font-semibold" style={{ color: '#292524' }}>
                              {priceLabel(i, lang)}
                              {!i.is_available && <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600">{t(lang, 'soldOut')}</span>}
                            </p>
                          </div>
                          {img && <img src={img} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <footer className="mt-10 text-center text-xs text-stone-400">{t(lang, 'poweredBy')}</footer>
      {selected && <ItemSheet item={selected} lang={lang} brand={primary} onClose={() => setSelected(null)} />}
    </div>
  );
}
