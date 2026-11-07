import QRCode from 'qrcode';

/** Set VITE_PUBLIC_BASE_URL (for example https://assamorder.in) before printing QR codes for real. */
export const publicBaseUrl = (): string =>
  ((import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) || window.location.origin).replace(/\/+$/, '');

export const tableUrl = (token: string) => `${publicBaseUrl()}/t/${token}`;
export const takeawayUrl = (slug: string) => `${publicBaseUrl()}/r/${slug}`;

export const qrDataUrl = (url: string, width = 480): Promise<string> =>
  QRCode.toDataURL(url, { width, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not draw the QR code.'));
    img.src = src;
  });
}

/** A ready-to-print card (PNG): restaurant name, QR code, and label. */
export async function composeCardPng(opts: { name: string; heading: string; label: string; url: string; color: string }): Promise<Blob> {
  const img = await loadImage(await qrDataUrl(opts.url, 640));
  const W = 800;
  const H = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is not supported on this device.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = opts.color;
  ctx.fillRect(0, 0, W, 18);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#111111';
  const fit = (text: string, start: number, weight: string, maxW: number) => {
    let size = start;
    do {
      ctx.font = `${weight} ${size}px Inter, "Noto Sans Bengali", "Noto Sans Devanagari", sans-serif`;
      size -= 2;
    } while (ctx.measureText(text).width > maxW && size > 18);
  };
  fit(opts.name, 48, '700', W - 100);
  ctx.fillText(opts.name, W / 2, 100);
  fit(opts.heading, 32, '500', W - 100);
  ctx.fillStyle = '#57534e';
  ctx.fillText(opts.heading, W / 2, 160);
  ctx.drawImage(img, 80, 200, 640, 640);
  ctx.fillStyle = '#111111';
  fit(opts.label, 60, '700', W - 100);
  ctx.fillText(opts.label, W / 2, 920);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/png'));
}

export function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
