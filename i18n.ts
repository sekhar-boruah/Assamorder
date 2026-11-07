import type { Lang } from '../types/db';

export type StrKey =
  | 'search' | 'all' | 'vegOnly' | 'soldOut' | 'from' | 'sizes' | 'addons' | 'openNow' | 'closedNow'
  | 'today' | 'closedToday' | 'notFound' | 'unavailable' | 'noResults' | 'table' | 'close' | 'loadError'
  | 'retry' | 'invalidQr' | 'poweredBy'
  | 'addToCart' | 'viewCart' | 'yourCart' | 'emptyCart' | 'backToMenu' | 'chooseSize' | 'quantity'
  | 'instructions' | 'instructionsHint' | 'orderNotes' | 'yourName' | 'yourPhone' | 'payment' | 'payCash'
  | 'payUpi' | 'subtotal' | 'gst' | 'gstIncluded' | 'total' | 'placeOrder' | 'placing' | 'remove'
  | 'dineInAt' | 'takeawayOrder' | 'scanToOrder' | 'viewOrder' | 'itemUnavailable' | 'orderNumber'
  | 'statusPending' | 'statusAccepted' | 'statusPreparing' | 'readyDineIn' | 'readyTakeaway'
  | 'statusCompleted' | 'statusCancelled' | 'trackTitle' | 'paymentDue' | 'paidStatus' | 'unpaidStatus'
  | 'payAtCounter' | 'upiInstruction' | 'payWithUpi' | 'copy' | 'copied' | 'cancelOrder' | 'cancelConfirm'
  | 'autoRefresh' | 'itemsHeading'
  | 'err_generic' | 'err_price_changed' | 'err_item_unavailable' | 'err_restaurant_unavailable'
  | 'err_invalid_phone' | 'err_name_required' | 'err_too_many_orders' | 'err_invalid_table'
  | 'err_order_type' | 'err_payment' | 'err_cannot_cancel';

const en: Record<StrKey, string> = {
  search: 'Search the menu', all: 'All', vegOnly: 'Veg only', soldOut: 'Sold out', from: 'From {price}',
  sizes: 'Sizes', addons: 'Add-ons', openNow: 'Open now', closedNow: 'Closed now', today: 'Today',
  closedToday: 'Closed today', notFound: 'Restaurant not found',
  unavailable: 'This restaurant is not taking orders right now.', noResults: 'No dishes found',
  table: 'Table', close: 'Close',
  loadError: 'Could not load the menu. Please check your connection and try again.',
  retry: 'Retry', invalidQr: 'This QR code is no longer valid.', poweredBy: 'Powered by AssamOrder',
  addToCart: 'Add to cart', viewCart: 'View cart', yourCart: 'Your cart', emptyCart: 'Your cart is empty',
  backToMenu: 'Back to menu', chooseSize: 'Choose a size', quantity: 'Quantity',
  instructions: 'Special instructions (optional)', instructionsHint: 'e.g. less spicy',
  orderNotes: 'Note for the restaurant (optional)', yourName: 'Your name', yourPhone: 'Mobile number',
  payment: 'Payment', payCash: 'I will pay cash at the restaurant', payUpi: 'I will pay by UPI at the restaurant',
  subtotal: 'Subtotal', gst: 'GST', gstIncluded: 'Prices include GST', total: 'Total',
  placeOrder: 'Place order', placing: 'Placing order...', remove: 'Remove',
  dineInAt: 'Dine-in at {table}', takeawayOrder: 'Takeaway order',
  scanToOrder: 'To order, please scan the QR code on your table.', viewOrder: 'View my order',
  itemUnavailable: 'No longer available', orderNumber: 'Order #{n}',
  statusPending: 'Waiting for the restaurant', statusAccepted: 'Order accepted', statusPreparing: 'Being prepared',
  readyDineIn: 'Ready, coming to your table', readyTakeaway: 'Ready for collection',
  statusCompleted: 'Completed', statusCancelled: 'Cancelled', trackTitle: 'Order status',
  paymentDue: 'Amount to pay', paidStatus: 'Paid', unpaidStatus: 'Not paid yet',
  payAtCounter: 'Please pay at the counter. Staff will confirm your payment.',
  upiInstruction: 'Pay {amount} to this UPI ID. Staff will confirm your payment.',
  payWithUpi: 'Pay with UPI app', copy: 'Copy', copied: 'Copied', cancelOrder: 'Cancel order',
  cancelConfirm: 'Cancel this order?', autoRefresh: 'This page updates automatically.', itemsHeading: 'Items',
  err_generic: 'Something went wrong. Please try again.',
  err_price_changed: 'Menu prices have changed. Please review your cart.',
  err_item_unavailable: 'Some items are no longer available. Please review your cart.',
  err_restaurant_unavailable: 'This restaurant is not taking orders right now.',
  err_invalid_phone: 'Enter a valid 10-digit mobile number.', err_name_required: 'Please enter your name.',
  err_too_many_orders: 'Too many orders. Please try again in a few minutes.',
  err_invalid_table: 'This table QR code is not valid. Please scan it again.',
  err_order_type: 'This kind of order is not accepted right now.',
  err_payment: 'This payment method is not available.', err_cannot_cancel: 'This order can no longer be cancelled.',
};

const as: Record<StrKey, string> = {
  search: 'মেনুত বিচাৰক', all: 'সকলো', vegOnly: 'নিৰামিষ মাত্ৰ', soldOut: 'শেষ হৈ গৈছে', from: '{price}ৰ পৰা',
  sizes: 'আকাৰ', addons: 'অতিৰিক্ত', openNow: 'এতিয়া খোলা', closedNow: 'এতিয়া বন্ধ', today: 'আজি',
  closedToday: 'আজি বন্ধ', notFound: "ৰেষ্টুৰেণ্ট পোৱা নগ'ল",
  unavailable: 'এই ৰেষ্টুৰেণ্টে এতিয়া অৰ্ডাৰ লোৱা নাই।', noResults: "কোনো খাদ্য পোৱা নগ'ল",
  table: 'টেবুল', close: 'বন্ধ কৰক',
  loadError: "মেনু লোড কৰিব পৰা নগ'ল। আপোনাৰ ইণ্টাৰনেট পৰীক্ষা কৰি পুনৰ চেষ্টা কৰক।",
  retry: 'পুনৰ চেষ্টা কৰক', invalidQr: 'এই QR কোডটো আৰু বৈধ নহয়।', poweredBy: 'AssamOrder ৰ দ্বাৰা চালিত',
  addToCart: 'কাৰ্টত যোগ কৰক', viewCart: 'কাৰ্ট চাওক', yourCart: 'আপোনাৰ কাৰ্ট', emptyCart: 'আপোনাৰ কাৰ্ট খালী',
  backToMenu: 'মেনুলৈ উভতি যাওক', chooseSize: 'আকাৰ বাছনি কৰক', quantity: 'পৰিমাণ',
  instructions: 'বিশেষ নিৰ্দেশ (ঐচ্ছিক)', instructionsHint: 'যেনে: কম জালুক',
  orderNotes: 'ৰেষ্টুৰেণ্টৰ বাবে টোকা (ঐচ্ছিক)', yourName: 'আপোনাৰ নাম', yourPhone: 'মোবাইল নম্বৰ',
  payment: 'মূল্য পৰিশোধ', payCash: 'ৰেষ্টুৰেণ্টত নগদত পৰিশোধ কৰিম', payUpi: 'ৰেষ্টুৰেণ্টলৈ UPI ৰে পৰিশোধ কৰিম',
  subtotal: 'উপমুঠ', gst: 'জিএছটি', gstIncluded: 'মূল্যত জিএছটি অন্তৰ্ভুক্ত', total: 'মুঠ',
  placeOrder: 'অৰ্ডাৰ দিয়ক', placing: 'অৰ্ডাৰ দি আছে...', remove: 'আঁতৰাওক',
  dineInAt: '{table}ত বহি খাম', takeawayOrder: 'টেকঅৱে অৰ্ডাৰ',
  scanToOrder: 'অৰ্ডাৰ দিবলৈ আপোনাৰ টেবুলৰ QR কোড স্কেন কৰক।', viewOrder: 'মোৰ অৰ্ডাৰ চাওক',
  itemUnavailable: 'আৰু উপলব্ধ নহয়', orderNumber: 'অৰ্ডাৰ #{n}',
  statusPending: 'ৰেষ্টুৰেণ্টৰ অপেক্ষাত', statusAccepted: 'অৰ্ডাৰ গ্ৰহণ কৰা হৈছে', statusPreparing: 'প্ৰস্তুত কৰা হৈছে',
  readyDineIn: 'প্ৰস্তুত, আপোনাৰ টেবুললৈ আহি আছে', readyTakeaway: 'সংগ্ৰহৰ বাবে প্ৰস্তুত',
  statusCompleted: 'সম্পূৰ্ণ হৈছে', statusCancelled: 'বাতিল কৰা হৈছে', trackTitle: 'অৰ্ডাৰৰ অৱস্থা',
  paymentDue: 'পৰিশোধ কৰিবলগীয়া', paidStatus: 'পৰিশোধ হৈছে', unpaidStatus: 'এতিয়ালৈ পৰিশোধ হোৱা নাই',
  payAtCounter: 'অনুগ্ৰহ কৰি কাউণ্টাৰত পৰিশোধ কৰক। কৰ্মীয়ে আপোনাৰ পৰিশোধ নিশ্চিত কৰিব।',
  upiInstruction: 'এই UPI ID লৈ {amount} পঠিয়াওক। কৰ্মীয়ে আপোনাৰ পৰিশোধ নিশ্চিত কৰিব।',
  payWithUpi: 'UPI এপেৰে পৰিশোধ কৰক', copy: 'কপি কৰক', copied: 'কপি হ’ল', cancelOrder: 'অৰ্ডাৰ বাতিল কৰক',
  cancelConfirm: 'এই অৰ্ডাৰ বাতিল কৰিবনে?', autoRefresh: 'এই পৃষ্ঠা নিজে নিজে আপডেট হয়।', itemsHeading: 'বস্তু',
  err_generic: 'কিবা ভুল হ’ল। অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক।',
  err_price_changed: 'মেনুৰ মূল্য সলনি হৈছে। অনুগ্ৰহ কৰি আপোনাৰ কাৰ্ট পৰীক্ষা কৰক।',
  err_item_unavailable: 'কিছুমান বস্তু আৰু উপলব্ধ নহয়। অনুগ্ৰহ কৰি আপোনাৰ কাৰ্ট পৰীক্ষা কৰক।',
  err_restaurant_unavailable: 'এই ৰেষ্টুৰেণ্টে এতিয়া অৰ্ডাৰ লোৱা নাই।',
  err_invalid_phone: 'সঠিক ১০ অংকৰ মোবাইল নম্বৰ দিয়ক।', err_name_required: 'অনুগ্ৰহ কৰি আপোনাৰ নাম লিখক।',
  err_too_many_orders: 'বহুত অৰ্ডাৰ দিয়া হৈছে। অলপ পিছত আকৌ চেষ্টা কৰক।',
  err_invalid_table: 'এই টেবুলৰ QR কোডটো বৈধ নহয়। অনুগ্ৰহ কৰি আকৌ স্কেন কৰক।',
  err_order_type: 'এই ধৰণৰ অৰ্ডাৰ এতিয়া গ্ৰহণ কৰা নহয়।',
  err_payment: 'এই পৰিশোধ পদ্ধতি উপলব্ধ নহয়।', err_cannot_cancel: 'এই অৰ্ডাৰ এতিয়া বাতিল কৰিব নোৱাৰি।',
};

const hi: Record<StrKey, string> = {
  search: 'मेनू में खोजें', all: 'सभी', vegOnly: 'सिर्फ़ शाकाहारी', soldOut: 'खत्म हो गया', from: '{price} से शुरू',
  sizes: 'साइज़', addons: 'ऐड-ऑन', openNow: 'अभी खुला है', closedNow: 'अभी बंद है', today: 'आज',
  closedToday: 'आज बंद', notFound: 'रेस्तरां नहीं मिला',
  unavailable: 'यह रेस्तरां अभी ऑर्डर नहीं ले रहा है।', noResults: 'कोई व्यंजन नहीं मिला',
  table: 'टेबल', close: 'बंद करें',
  loadError: 'मेनू लोड नहीं हो सका। कृपया अपना इंटरनेट जाँचें और फिर कोशिश करें।',
  retry: 'फिर कोशिश करें', invalidQr: 'यह QR कोड अब मान्य नहीं है।', poweredBy: 'AssamOrder द्वारा संचालित',
  addToCart: 'कार्ट में जोड़ें', viewCart: 'कार्ट देखें', yourCart: 'आपका कार्ट', emptyCart: 'आपका कार्ट खाली है',
  backToMenu: 'मेनू पर वापस जाएँ', chooseSize: 'साइज़ चुनें', quantity: 'मात्रा',
  instructions: 'विशेष निर्देश (वैकल्पिक)', instructionsHint: 'जैसे: कम तीखा',
  orderNotes: 'रेस्तरां के लिए नोट (वैकल्पिक)', yourName: 'आपका नाम', yourPhone: 'मोबाइल नंबर',
  payment: 'भुगतान', payCash: 'रेस्तरां में नकद भुगतान करूँगा', payUpi: 'रेस्तरां को UPI से भुगतान करूँगा',
  subtotal: 'उप-कुल', gst: 'जीएसटी', gstIncluded: 'कीमतों में जीएसटी शामिल है', total: 'कुल',
  placeOrder: 'ऑर्डर करें', placing: 'ऑर्डर हो रहा है...', remove: 'हटाएँ',
  dineInAt: '{table} पर डाइन-इन', takeawayOrder: 'टेकअवे ऑर्डर',
  scanToOrder: 'ऑर्डर करने के लिए अपनी टेबल का QR कोड स्कैन करें।', viewOrder: 'मेरा ऑर्डर देखें',
  itemUnavailable: 'अब उपलब्ध नहीं', orderNumber: 'ऑर्डर #{n}',
  statusPending: 'रेस्तरां की प्रतीक्षा में', statusAccepted: 'ऑर्डर स्वीकार हुआ', statusPreparing: 'तैयार हो रहा है',
  readyDineIn: 'तैयार है, आपकी टेबल पर आ रहा है', readyTakeaway: 'लेने के लिए तैयार',
  statusCompleted: 'पूरा हुआ', statusCancelled: 'रद्द किया गया', trackTitle: 'ऑर्डर की स्थिति',
  paymentDue: 'चुकाने योग्य राशि', paidStatus: 'भुगतान हो गया', unpaidStatus: 'अभी भुगतान नहीं हुआ',
  payAtCounter: 'कृपया काउंटर पर भुगतान करें। स्टाफ़ आपके भुगतान की पुष्टि करेगा।',
  upiInstruction: 'इस UPI ID पर {amount} भेजें। स्टाफ़ आपके भुगतान की पुष्टि करेगा।',
  payWithUpi: 'UPI ऐप से भुगतान करें', copy: 'कॉपी करें', copied: 'कॉपी हो गया', cancelOrder: 'ऑर्डर रद्द करें',
  cancelConfirm: 'क्या यह ऑर्डर रद्द करें?', autoRefresh: 'यह पेज अपने आप अपडेट होता है।', itemsHeading: 'आइटम',
  err_generic: 'कुछ गलत हो गया। कृपया फिर कोशिश करें।',
  err_price_changed: 'मेनू की कीमतें बदल गई हैं। कृपया अपना कार्ट जाँचें।',
  err_item_unavailable: 'कुछ आइटम अब उपलब्ध नहीं हैं। कृपया अपना कार्ट जाँचें।',
  err_restaurant_unavailable: 'यह रेस्तरां अभी ऑर्डर नहीं ले रहा है।',
  err_invalid_phone: 'सही 10 अंकों का मोबाइल नंबर दें।', err_name_required: 'कृपया अपना नाम लिखें।',
  err_too_many_orders: 'बहुत ज़्यादा ऑर्डर हो गए हैं। थोड़ी देर बाद फिर कोशिश करें।',
  err_invalid_table: 'इस टेबल का QR कोड मान्य नहीं है। कृपया फिर स्कैन करें।',
  err_order_type: 'इस तरह के ऑर्डर अभी स्वीकार नहीं किए जा रहे।',
  err_payment: 'यह भुगतान तरीका उपलब्ध नहीं है।', err_cannot_cancel: 'यह ऑर्डर अब रद्द नहीं किया जा सकता।',
};

const STRINGS: Record<Lang, Record<StrKey, string>> = { en, as, hi };

export function t(lang: Lang, key: StrKey, vars?: Record<string, string>): string {
  let s = STRINGS[lang][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
