import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Spinner } from '../../components/ui';
import { useLang } from '../../features/public/useLang';
import { t } from '../../lib/i18n';
import { resolveTable } from '../../lib/publicApi';

/** What a table QR code opens: checks the token, then sends the guest to that restaurant's menu. */
export default function TableRedirect() {
  const { token = '' } = useParams();
  const { lang } = useLang();
  const [target, setTarget] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'invalid' | 'error'>('loading');

  useEffect(() => {
    let off = false;
    resolveTable(token)
      .then((r) => {
        if (off) return;
        if (r) setTarget(`/r/${r.slug}?table=${encodeURIComponent(token)}`);
        else setState('invalid');
      })
      .catch(() => !off && setState('error'));
    return () => {
      off = true;
    };
  }, [token]);

  if (target) return <Navigate to={target} replace />;
  if (state === 'loading') return <Spinner />;
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center" lang={lang}>
      <p className="text-lg text-stone-700">{state === 'invalid' ? t(lang, 'invalidQr') : t(lang, 'loadError')}</p>
    </main>
  );
}
