// src/data.jsx — concert data, products, icons. Exports to window.

// Concert 1 — rock (ticket all 1s, or default on scan)
const EVENT = {
  artist: 'WITHERED CROWN',
  tour: 'Resurrection Tour',
  venue: 'O2 Academy · Brixton',
  date: '31 MAY 2026',
  shooter: 'NIGHTSHIFT COLLECTIVE',
};

// Concert 2 — techno / electronic (ticket all 2s)
const EVENT_2 = {
  artist: 'PULSE ENGINE',
  tour: 'Modular Nights',
  venue: 'Berghain · Berlin',
  date: '14 JUN 2026',
  shooter: 'STROBE LAB',
};

// Frontend product list — replaced at runtime by loadProductsFromApi(), which
// fetches /api/products (admin-managed) and overwrites the array contents in
// place. DEFAULTS are the same set the backend seed ships with; they're the
// fallback when /api/products is unreachable.
//
// Admin-managed fields: id, name, thumbnailUrl, familyId, productId | slug |
// attributeValues, minPhotos, maxPhotos, variants[].
// Frontend-only metadata (sub / price / blurb / desc) overlays from
// PRODUCT_META below — keyed by id — so the cards stay nicely-decorated even
// for products defined purely through admin.
const DEFAULT_PRODUCTS = [
  { id: 'book',  name: 'Photobook', thumbnailUrl: 'assets/photobook.jpg', familyId: '305', productId: '7605', minPhotos: 26, maxPhotos: 100, allowOwnPhotos: true },
  { id: 'cal',   name: 'Calendar',  thumbnailUrl: 'assets/calendar.jpg',  familyId: '220', productId: '5809', minPhotos: 13, maxPhotos: 36 },
  { id: 'frame', name: 'Frame',     thumbnailUrl: 'assets/frame.jpg', minPhotos: 1, maxPhotos: 1,
    variants: [
      { orientation: 'landscape', familyId: '304', attributeValues: { orientation: 'horizontal', size: '12x8', theme: 'concertFrame', frameColor: 'black', frameThickness: '1inch' } },
      { orientation: 'portrait',  familyId: '304', attributeValues: { orientation: 'vertical',   size: '8x12', theme: 'concertFrame', frameColor: 'black', frameThickness: '1inch' } },
      { orientation: 'square',    familyId: '304', attributeValues: { orientation: 'square',     size: '10x10',theme: 'concertFrame', frameColor: 'black', frameThickness: '1inch' } },
    ] },
];

// Per-id frontend chrome (subtitle / price / blurb / desc). Anything not in
// here defaults to empty strings in the renderer.
const PRODUCT_META = {
  book:  { sub: 'Hardcover · 28 pages', price: 'from $149', blurb: 'Your night, bound in print.',
           desc: 'Lay-flat hardcover on museum-grade matte paper — every spread opens edge to edge, so the night plays back full-bleed.' },
  cal:   { sub: '12 months · A3',       price: 'from $79',  blurb: 'A year in the pit.',
           desc: 'Twelve months, one show per page. Sturdy A3, wire-bound and ready to hang — relive it all year.' },
  frame: { sub: 'Print · framed',       price: 'from $49',  blurb: 'One night, one print.',
           desc: 'A single hero shot, archival print framed in matte black — ready to hang the moment it arrives.' },
};

// Map an admin product into the shape memories/scan/upload already speak:
// img (was thumbnailUrl), min/max (was minPhotos/maxPhotos), plus chrome
// overlay from PRODUCT_META.
function decorateProduct(p) {
  const meta = PRODUCT_META[p.id] || {};
  return {
    ...p,
    img: p.thumbnailUrl || p.img || '',
    min: p.minPhotos != null ? p.minPhotos : (p.min != null ? p.min : 1),
    max: p.maxPhotos != null ? p.maxPhotos : (p.max != null ? p.max : 100),
    sub:   p.sub   != null ? p.sub   : (meta.sub   || ''),
    price: p.price != null ? p.price : (meta.price || ''),
    blurb: p.blurb != null ? p.blurb : (meta.blurb || ''),
    desc:  p.desc  != null ? p.desc  : (meta.desc  || ''),
  };
}

const PRODUCTS = DEFAULT_PRODUCTS.map(decorateProduct);

async function loadProductsFromApi() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data.products) || data.products.length === 0) return;
    const next = data.products.map(decorateProduct);
    PRODUCTS.length = 0;
    next.forEach((p) => PRODUCTS.push(p));
  } catch (e) {
    console.warn('[products] /api/products fetch failed, using defaults:', e);
  }
}

// stage-light gradient fallbacks (used behind every tile so nothing looks broken)
const GRADS = [
  'radial-gradient(80% 70% at 30% 20%, #3a2a1c, #0c0b0d 70%)',
  'radial-gradient(80% 70% at 70% 10%, #2a2030, #0b0b0e 70%)',
  'radial-gradient(90% 80% at 50% 0%, #2c2c30, #0a0a0c 72%)',
  'radial-gradient(80% 70% at 20% 30%, #322417, #0c0b0d 70%)',
  'radial-gradient(80% 80% at 80% 20%, #1c2730, #0a0b0d 70%)',
  'radial-gradient(90% 70% at 50% 15%, #332218, #0b0a0c 70%)',
];

// professional-looking concert shots (Unsplash). Each tile keeps a gradient
// behind it; if the photo fails the gradient shows through.
const U = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=72`;
const P = (id, ar, opt = {}) => {
  const w = opt.hero ? 900 : 560;
  return {
    id: 'm' + id,
    src: U(id, w),
    ar,                       // aspect ratio h/w for masonry height
    width: w,                 // Unsplash transform forces this width
    height: Math.round(w * ar),
    mimetype: 'image/jpeg',
    hero: !!opt.hero,
    pick: !!opt.pick,
    grad: GRADS[(opt.g ?? 0) % GRADS.length],
    frame: opt.frame,
  };
};

// Real Withered Crown gallery uploaded to GCS (2026-06-12). The bucket path
// uses "witthered" (two t's) intentionally — that's how the assets are
// stored on the server; do not "correct" the spelling here.
const WC_BASE = 'https://storage.googleapis.com/pbx2-sales-demo/media/uploads/concertgallery/witthered-crown';
const WC = (slug, w, h, opt = {}) => ({
  id: 'wc-' + slug,
  src: `${WC_BASE}/${slug}.jpg`,
  ar: h / w,
  width: w,
  height: h,
  mimetype: 'image/jpeg',
  hero: !!opt.hero,
  pick: !!opt.pick,
  grad: GRADS[(opt.g ?? 0) % GRADS.length],
  frame: opt.frame,
});

// Curated set shown first to Withered Crown viewers. Heroes = full-width
// in the masonry; pick = preselected by "Select recommended".
// Pixel dimensions verified against the actual files in the GCS bucket
// (System.Drawing readout, 2026-06-22 batch — files 9–15 were earlier guesses
// and several came out reversed; now matched 1:1 to bucket reality).
const WITHERED_PHOTOS = [
  WC('7drums', 768, 1376, { hero: true, pick: true, g: 0, frame: 'WC01' }),
  WC('6',      1024, 1024, { pick: true,             g: 1, frame: 'WC02' }),
  WC('3',      1408, 768,  { hero: true,             g: 2, frame: 'WC03' }),
  WC('5',      1024, 1024, { pick: true,             g: 3, frame: 'WC04' }),
  WC('1',      1408, 768,  { hero: true, pick: true, g: 4, frame: 'WC05' }),
  WC('8',      768, 1376,  {                         g: 5, frame: 'WC06' }),
  WC('4',      1024, 1024, {                         g: 0, frame: 'WC07' }),
  WC('2',      1408, 768,  {                         g: 1, frame: 'WC08' }),
  WC('9',      1264, 848,  { pick: true,             g: 2, frame: 'WC09' }),
  WC('10',     848,  1264, {                         g: 3, frame: 'WC10' }),
  WC('11',     1024, 1024, { hero: true,             g: 4, frame: 'WC11' }),
  WC('12',     1264, 848,  {                         g: 5, frame: 'WC12' }),
  WC('13',     848,  1264, { pick: true,             g: 0, frame: 'WC13' }),
  WC('14',     1264, 848,  {                         g: 1, frame: 'WC14' }),
  WC('15',     848,  1264, { hero: true,             g: 2, frame: 'WC15' }),
  WC('17',     1024, 1024, {                         g: 3, frame: 'WC17' }),
];

const PHOTOS = [
  // Real Withered Crown shots — always first in the gallery for this concert.
  ...WITHERED_PHOTOS,
  // Unsplash placeholders padding the set out to Photobook's 26-photo minimum.
  P('1470229722913-7c0e2dbbafd3', 0.62, { hero: true, pick: true, g: 0, frame: '0118' }),
  P('1501386761578-eac5c94b800a', 1.30, { pick: true, g: 1, frame: '0204' }),
  P('1459749411175-04bf5292ceea', 1.05, { g: 2, frame: '0231' }),
  P('1516280440614-37939bbacd81', 1.45, { g: 3, frame: '0288' }),
  P('1429962714451-bb934ecdc4ec', 0.78, { pick: true, g: 4, frame: '0312' }),
  P('1540039155733-5bb30b53aa14', 1.25, { g: 5, frame: '0349' }),
  P('1524368535928-5b5e00ddc76b', 0.60, { hero: true, g: 1, frame: '0377' }),
  P('1493676304819-0d7a8d026dcf', 1.35, { pick: true, g: 2, frame: '0401' }),
  P('1471478331149-c72f17e33c73', 1.10, { g: 3, frame: '0428' }),
  P('1506157786151-b8491531f063', 1.40, { g: 4, frame: '0452' }),
  P('1533174072545-7a4b6ad7a6c3', 0.80, { pick: true, g: 5, frame: '0488' }),
  P('1499364615650-ec38552f4f34', 1.20, { g: 0, frame: '0510' }),
  P('1485872299829-c673f5194813', 0.64, { hero: true, pick: true, g: 3, frame: '0547' }),
  P('1453090927415-5f45085b65c0', 1.30, { g: 1, frame: '0566' }),
  P('1574391884720-bbc3740c59d1', 1.05, { g: 2, frame: '0598' }),
  P('1492684223066-81342ee5ff30', 1.45, { pick: true, g: 4, frame: '0621' }),
  P('1511735111819-9a3f7709049c', 1.15, { g: 5, frame: '0654' }),
  P('1551845041-63e8e76836ea',    1.35, { g: 0, frame: '0689' }),
  P('1563841930606-67e2bce48b78', 0.66, { hero: true, g: 2, frame: '0712' }),
  P('1598387993441-a364f854c3e1', 1.25, { g: 3, frame: '0744' }),
  P('1514525253161-7a46d19cd819', 0.65, { hero: true, g: 4, frame: '0768' }),
  P('1493225457124-a3eb161ffa5f', 1.30, { pick: true, g: 5, frame: '0791' }),
  P('1518972559570-7cc1309f3229', 1.05, { g: 0, frame: '0814' }),
  P('1483393458019-411bc6bd104e', 1.40, { g: 1, frame: '0837' }),
  P('1454908027598-28c44b1716c1', 0.82, { pick: true, g: 2, frame: '0860' }),
  P('1470225620780-dba8ba36b745', 1.28, { g: 3, frame: '0883' }),
  P('1524650359799-842906ca1c06', 1.12, { g: 4, frame: '0906' }),
  P('1506377585622-bedcbb027afc', 1.36, { g: 5, frame: '0929' }),
  // ── extra concert shots (added 2026-06-03) — bigger gallery ──
  P('1565035010268-a3816f98589a', 0.66, { hero: true, g: 0, frame: '0952' }),
  P('1522158637959-30385a09e0da', 0.70, { g: 1, frame: '0975' }),
  P('1509824227185-9c5a01ceba0d', 1.35, { g: 2, frame: '0998' }),
  P('1450044804117-534ccd6e6a3a', 0.78, { g: 3, frame: '1021' }),
  P('1603910234616-3b5f4a6be2b4', 1.42, { g: 4, frame: '1044' }),
  P('1488036106564-87ecb155bb15', 1.30, { g: 5, frame: '1067' }),
  P('1603190287605-e6ade32fa852', 0.66, { hero: true, g: 1, frame: '1090' }),
  P('1619229725920-ac8b63b0631a', 1.28, { g: 2, frame: '1113' }),
  P('1600779547877-be592ef5aad3', 0.68, { g: 3, frame: '1136' }),
  P('1558620013-a08999547a36',    0.60, { hero: true, g: 4, frame: '1159' }),
  P('1468359601543-843bfaef291a', 1.05, { g: 5, frame: '1182' }),
  P('1567942712661-82b9b407abbf', 0.75, { g: 0, frame: '1205' }),
  P('1470229538611-16ba8c7ffbd7', 1.30, { g: 1, frame: '1228' }),
  P('1497911270199-1c552ee64aa4', 0.72, { g: 2, frame: '1251' }),
  P('1692271931628-adc2b16670dd', 1.40, { g: 3, frame: '1274' }),
  P('1515175192010-cf3250992719', 0.66, { hero: true, g: 4, frame: '1297' }),
  P('1510682657356-6ee07db8204b', 1.10, { g: 5, frame: '1320' }),
  P('1501612780327-45045538702b', 0.66, { g: 0, frame: '1343' }),
  P('1583795484071-3c453e3a7c71', 1.25, { g: 1, frame: '1366' }),
  P('1577648884063-1d3d1477b8a7', 0.80, { g: 2, frame: '1389' }),
];

// Real Pulse Engine gallery — same GCS bucket as Withered Crown, just under
// concertgallery/pulse-engine/. Was on Vercel Blob initially (2026-06-17)
// until thumbnails got generated on GCS (2026-06-22), so we switched over to
// pick up deriveThumbUrl()'s _versions/<file>_large.<ext> sibling for free.
const PE_BASE = 'https://storage.googleapis.com/pbx2-sales-demo/media/uploads/concertgallery/pulse-engine';
const PE = (slug, w, h, opt = {}) => ({
  id: 'pe-' + slug,
  src: `${PE_BASE}/${slug}.jpg`,
  ar: h / w,
  width: w,
  height: h,
  mimetype: 'image/jpeg',
  hero: !!opt.hero,
  pick: !!opt.pick,
  grad: GRADS[(opt.g ?? 0) % GRADS.length],
  frame: opt.frame,
});

const PULSE_PHOTOS = [
  PE('1',  1024, 1024, { pick: true,             g: 0, frame: 'PE01' }),
  PE('2',  1264, 848,  { hero: true,             g: 1, frame: 'PE02' }),
  PE('3',  848,  1264, { hero: true, pick: true, g: 2, frame: 'PE03' }),
  PE('4',  1024, 1024, {                         g: 3, frame: 'PE04' }),
  PE('5',  1264, 848,  { pick: true,             g: 4, frame: 'PE05' }),
  PE('6',  848,  1264, {                         g: 5, frame: 'PE06' }),
  PE('7',  1024, 1024, { pick: true,             g: 0, frame: 'PE07' }),
  PE('8',  1264, 848,  { hero: true,             g: 1, frame: 'PE08' }),
  PE('9',  848,  1264, {                         g: 2, frame: 'PE09' }),
  PE('10', 1264, 848,  {                         g: 3, frame: 'PE10' }),
  PE('11', 1024, 1024, { hero: true,             g: 4, frame: 'PE11' }),
  PE('12', 848,  1264, { pick: true,             g: 5, frame: 'PE12' }),
  PE('13', 1264, 848,  {                         g: 0, frame: 'PE13' }),
  PE('14', 848,  1264, {                         g: 1, frame: 'PE14' }),
];

// Concert 2 placeholder pool — Unsplash shots kept around for volume until
// the real Pulse Engine gallery grows; interleaved with PULSE_PHOTOS below.
const PULSE_PLACEHOLDERS = [
  P('1501612780327-45045538702b', 0.66, { hero: true, g: 1, frame: 'B021' }),
  P('1546707012-c46675f12716',    1.30, { g: 4, frame: 'B044' }),
  P('1558620013-a08999547a36',    1.05, { g: 2, frame: 'B067' }),
  P('1450044804117-534ccd6e6a3a', 1.42, { g: 1, frame: 'B090' }),
  P('1429514513361-8fa32282fd5f', 0.66, { hero: true, g: 4, frame: 'B113' }),
  P('1509824227185-9c5a01ceba0d', 1.35, { g: 2, frame: 'B136' }),
  P('1510682657356-6ee07db8204b', 0.70, { g: 5, frame: 'B159' }),
  P('1573152958734-1922c188fba3', 1.10, { g: 0, frame: 'B182' }),
  P('1603910234616-3b5f4a6be2b4', 1.40, { g: 3, frame: 'B205' }),
  P('1515175192010-cf3250992719', 0.66, { hero: true, g: 1, frame: 'B228' }),
  P('1470229538611-16ba8c7ffbd7', 1.28, { g: 2, frame: 'B251' }),
  P('1567942712661-82b9b407abbf', 0.75, { g: 0, frame: 'B274' }),
  P('1492684223066-81342ee5ff30', 1.45, { g: 4, frame: 'B297' }),
  P('1522158637959-30385a09e0da', 0.70, { g: 1, frame: 'B320' }),
  P('1511735111819-9a3f7709049c', 1.15, { g: 5, frame: 'B343' }),
  P('1518972559570-7cc1309f3229', 1.05, { g: 0, frame: 'B366' }),
];

// Interleave Pulse Engine real shots with the placeholder pool so the gallery
// reads as a mixed set rather than 14 reals followed by a placeholder tail.
function interleave(a, b) {
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}
const PHOTOS_2 = interleave(PULSE_PHOTOS, PULSE_PLACEHOLDERS);

// two concert sets; recognised from the ticket number
const CONCERTS = [
  { ...EVENT, genre: 'ROCK', photos: PHOTOS },
  { ...EVENT_2, genre: 'TECHNO', photos: PHOTOS_2 },
];
// all 2s → concert 2 (techno); anything else (incl. all 1s / scan / empty) → concert 1 (rock)
function concertForCode(code) {
  const s = String(code || '').replace(/\D/g, '');
  return /^2+$/.test(s) ? CONCERTS[1] : CONCERTS[0];
}

// ───────── icons ─────────
const Ic = {
  qr: (p) => (<svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke={p.c||'currentColor'} strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3M21 14v.01M21 21v-4M14 21h3" strokeLinecap="round"/></svg>),
  keypad: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill={p.c||'currentColor'}><circle cx="6" cy="6" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="12" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/></svg>),
  chevL: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke={p.c||'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>),
  chevR: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke={p.c||'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" width={p.s||15} height={p.s||15} fill="none" stroke={p.c||'#0b0b0c'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 6.5"/></svg>),
  expand: (p) => (<svg viewBox="0 0 24 24" width={p.s||15} height={p.s||15} fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" width={p.s||24} height={p.s||24} fill="none" stroke={p.c||'currentColor'} strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>),
  close: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>),
  star: (p) => (<svg viewBox="0 0 24 24" width={p.s||10} height={p.s||10} fill={p.c||'#0b0b0c'}><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z"/></svg>),
  cam: (p) => (<svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke={p.c||'currentColor'} strokeWidth="1.7"><path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.4"/></svg>),
  flash: (p) => (<svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke={p.c||'currentColor'} strokeWidth="1.7" strokeLinejoin="round"><path d="M13 2L4 13h6l-1 9 9-11h-6z"/></svg>),
  heart: (p) => (<svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill={p.f||'none'} stroke={p.c||'currentColor'} strokeWidth="1.7"><path d="M12 20s-7-4.4-9.2-8.5C1.2 8.3 2.6 5 5.8 5 8 5 9.4 6.6 12 9c2.6-2.4 4-4 6.2-4 3.2 0 4.6 3.3 3 6.5C19 15.6 12 20 12 20z"/></svg>),
  upload: (p) => (<svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke={p.c||'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>),
  spark: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill={p.c||'currentColor'}><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/></svg>),
  info: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke={p.c||'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.7h.01"/></svg>),
};

// price renderer — Space Mono draws the "$" a touch short next to its lining
// figures, so we bump just the glyph to sit level with the digits.
function Price({ value }) {
  const parts = String(value).split('$');
  if (parts.length < 2) return value;
  return <>{parts[0]}<span style={{ fontSize: '1.14em' }}>$</span>{parts[1]}</>;
}

// shared product-details bottom sheet — used by the landing product grid and the
// memories long-press. Renders nothing unless a product is passed in.
function ProductSheet({ product, onClose }) {
  if (!product) return null;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end' }}>
      <div className="anim-up" onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--bg)', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden', borderTop: '1px solid var(--line)' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ aspectRatio: '16 / 9', background: `#0c0c0e url("${product.img}") center/cover no-repeat` }} />
          <div className="glass icon-btn" onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34 }}><Ic.close s={16} c="var(--ink)" /></div>
        </div>
        <div style={{ padding: '18px 20px calc(var(--bottom) + 18px)' }}>
          <div className="row between" style={{ alignItems: 'baseline', gap: 10 }}>
            <div className="display" style={{ fontSize: 25, lineHeight: 1 }}>{product.name}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', flexShrink: 0 }}><Price value={product.price} /></div>
          </div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 9 }}>{product.sub.toUpperCase()}</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 12 }}>{product.desc}</div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 14 }}>PICK {product.min}–{product.max} SHOTS</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EVENT, EVENT_2, PRODUCTS, PHOTOS, PHOTOS_2, CONCERTS, concertForCode, Ic, Price, ProductSheet, loadProductsFromApi });
