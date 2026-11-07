import type { Lang } from '../types/db';

export type StrKey =
  | 'search' | 'all' | 'vegOnly' | 'soldOut' | 'from' | 'sizes' | 'addons' | 'openNow' | 'closedNow'
  | 'today' | 'closedToday' | 'notFound' | 'unavailable' | 'noResults' | 'table' | 'close' | 'loadError'
  | 'retry' | 'invalidQr' | 'poweredBy';

const STRINGS: Record<Lang, Record<StrKey, string>> = {
  en: {
    search: 'Search the menu', all: 'All', vegOnly: 'Veg only', soldOut: 'Sold out', from: 'From {price}',
    sizes: 'Sizes', addons: 'Add-ons', openNow: 'Open now', closedNow: 'Closed now', today: 'Today',
    closedToday: 'Closed today', notFound: 'Restaurant not found',
    unavailable: 'This restaurant is not taking orders right now.', noResults: 'No dishes found',
    table: 'Table', close: 'Close',
    loadError: 'Could not load the menu. Please check your connection and try again.',
    retry: 'Retry', invalidQr: 'This QR code is no longer valid.', poweredBy: 'Powered by AssamOrder',
  },
  as: {
    search: 'মেনুত বিচাৰক', all: 'সকলো', vegOnly: 'নিৰামিষ মাত্ৰ', soldOut: 'শেষ হৈ গৈছে', from: '{price}ৰ পৰা',
    sizes: 'আকাৰ', addons: 'অতিৰিক্ত', openNow: 'এতিয়া খোলা', closedNow: 'এতিয়া বন্ধ', today: 'আজি',
    closedToday: 'আজি বন্ধ', notFound: "ৰেষ্টুৰেণ্ট পোৱা নগ'ল",
    unavailable: 'এই ৰেষ্টুৰেণ্টে এতিয়া অৰ্ডাৰ লোৱা নাই।', noResults: "কোনো খাদ্য পোৱা নগ'ল",
    table: 'টেবুল', close: 'বন্ধ কৰক',
    loadError: "মেনু লোড কৰিব পৰা নগ'ল। আপোনাৰ ইণ্টাৰনেট পৰীক্ষা কৰি পুনৰ চেষ্টা কৰক।",
    retry: 'পুনৰ চেষ্টা কৰক', invalidQr: 'এই QR কোডটো আৰু বৈধ নহয়।', poweredBy: 'AssamOrder ৰ দ্বাৰা চালিত',
  },
  hi: {
    search: 'मेनू में खोजें', all: 'सभी', vegOnly: 'सिर्फ़ शाकाहारी', soldOut: 'खत्म हो गया', from: '{price} से शुरू',
    sizes: 'साइज़', addons: 'ऐड-ऑन', openNow: 'अभी खुला है', closedNow: 'अभी बंद है', today: 'आज',
    closedToday: 'आज बंद', notFound: 'रेस्तरां नहीं मिला',
    unavailable: 'यह रेस्तरां अभी ऑर्डर नहीं ले रहा है।', noResults: 'कोई व्यंजन नहीं मिला',
    table: 'टेबल', close: 'बंद करें',
    loadError: 'मेनू लोड नहीं हो सका। कृपया अपना इंटरनेट जाँचें और फिर कोशिश करें।',
    retry: 'फिर कोशिश करें', invalidQr: 'यह QR कोड अब मान्य नहीं है।', poweredBy: 'AssamOrder द्वारा संचालित',
  },
};

export function t(lang: Lang, key: StrKey, vars?: Record<string, string>): string {
  let s = STRINGS[lang][key] ?? STRINGS.en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
