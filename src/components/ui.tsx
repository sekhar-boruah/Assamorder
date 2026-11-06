import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label={label}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
    </div>
  );
}

export function Button({
  loading,
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: 'primary' | 'ghost' }) {
  const styles =
    variant === 'primary'
      ? 'bg-amber-700 text-white hover:bg-amber-800 focus-visible:outline-amber-700'
      : 'bg-transparent text-stone-700 hover:bg-stone-100 focus-visible:outline-stone-400';
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      <input
        {...props}
        className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base outline-none transition placeholder:text-stone-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
      />
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-700 text-xl font-bold text-white">A</div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-stone-600">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function TextArea({ label, ...props }: import('react').TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      <textarea
        {...props}
        className="min-h-24 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base outline-none transition placeholder:text-stone-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
      />
    </label>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      {title && <h2 className="mb-4 text-base font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
