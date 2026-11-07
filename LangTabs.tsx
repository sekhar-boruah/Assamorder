import { LANGS } from '../lib/menu';
import type { I18n, Lang } from '../types/db';

/** Language switcher for forms. A dot shows which languages already have text. */
export function LangTabs({ value, onChange, filled }: { value: Lang; onChange: (l: Lang) => void; filled: Partial<I18n> }) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 rounded-xl bg-stone-100 p-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          role="tab"
          aria-selected={value === l.code}
          onClick={() => onChange(l.code)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${value === l.code ? 'bg-white shadow-sm' : 'text-stone-600'}`}
        >
          {l.label}
          {filled[l.code]?.trim() ? <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-600 align-middle" aria-label="filled" /> : null}
        </button>
      ))}
    </div>
  );
}
