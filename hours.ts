import type { DayHours, OpeningHours } from '../types/db';

const KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Restaurants in Assam run on Indian Standard Time, whatever the customer's phone says. */
function istNow(): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = KEYS.indexOf(get('weekday').toLowerCase().slice(0, 3));
  return { day: day < 0 ? 0 : day, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

export function openStatus(hours: OpeningHours | null | undefined): { known: boolean; open: boolean; today?: DayHours } {
  if (!hours || Object.keys(hours).length === 0) return { known: false, open: false };
  const { day, minutes } = istNow();
  const today = hours[KEYS[day]];
  const yesterday = hours[KEYS[(day + 6) % 7]];
  let open = false;
  if (today && !today.closed) {
    const o = toMin(today.open);
    const c = toMin(today.close);
    open = o < c ? minutes >= o && minutes < c : minutes >= o; // overnight: open until midnight here
  }
  if (!open && yesterday && !yesterday.closed) {
    const o = toMin(yesterday.open);
    const c = toMin(yesterday.close);
    if (c <= o) open = minutes < c; // spill-over after midnight
  }
  return { known: true, open, today };
}

export function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
