// src/data.jsx — Starloop Park visit data, products, icons. Exports to window.

// Pass 1 — Family Day (ticket all 1s, or default on scan)
const EVENT = {
  artist: 'STARLOOP PARK',
  tour: 'Family Day Pass',
  venue: 'Starloop Park · East Gate',
  date: '14 JUN 2026',
  shooter: 'PARK PHOTO TEAM',
};

// Pass 2 — Thrill Seeker (ticket all 2s)
const EVENT_2 = {
  artist: 'STARLOOP PARK',
  tour: 'Thrill Seeker Pass',
  venue: 'Starloop Park · Summit Peak',
  date: '21 JUN 2026',
  shooter: 'PARK PHOTO TEAM',
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
  { id: 'book',  name: 'Photobook', thumbnailUrl: 'assets/photobook.jpg', familyId: '305', productId: '7605', minPhotos: 25, maxPhotos: 100, allowOwnPhotos: true },
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
  book:  { sub: 'Hardcover · 28 pages', price: 'from $149', blurb: 'Your day, bound in print.',
           desc: 'Lay-flat hardcover on museum-grade matte paper — every spread opens edge to edge, so the day plays back full-bleed.' },
  cal:   { sub: '12 months · A3',       price: 'from $79',  blurb: 'A year of park days.',
           desc: 'Twelve months, one adventure per page. Sturdy A3, wire-bound and ready to hang — relive it all year.' },
  frame: { sub: 'Print · framed',       price: 'from $49',  blurb: 'One day, one print.',
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

// tile gradient fallbacks (used behind every photo so nothing looks broken
// while it loads, or if a src ever 404s)
const GRADS = [
  'radial-gradient(80% 70% at 30% 20%, #2a3a2c, #0b0d0c 70%)',
  'radial-gradient(80% 70% at 70% 10%, #203a2e, #0a0e0b 70%)',
  'radial-gradient(90% 80% at 50% 0%, #2c3230, #0a0c0a 72%)',
  'radial-gradient(80% 70% at 20% 30%, #323017, #0d0c0b 70%)',
  'radial-gradient(80% 80% at 80% 20%, #1c2f30, #0a0d0d 70%)',
  'radial-gradient(90% 70% at 50% 15%, #332818, #0b0a0a 70%)',
];

// Real Starloop Park gallery uploaded to GCS (2026-09-15). One full day's
// shoot, split into two curated passes so the ticket-code demo (all-1s vs
// all-2s) still shows two distinct galleries — everything here is a real
// photo, nothing padded out with stock placeholders.
const TP_BASE = 'https://storage.googleapis.com/pbx2-sales-demo/media/uploads/theme-park';
const TP = (slug, w, h, opt = {}) => ({
  id: 'tp-' + slug,
  src: `${TP_BASE}/${slug}.jpg`,
  ar: h / w,
  width: w,
  height: h,
  mimetype: 'image/jpeg',
  hero: !!opt.hero,
  pick: !!opt.pick,
  grad: GRADS[(opt.g ?? 0) % GRADS.length],
  frame: opt.frame,
});

// Pass 1 — Family Day: gentle rides, sweets, playground, parents resting.
// Exactly 25 photos = Photobook's minPhotos, so nothing needs padding.
const FAMILY_PHOTOS = [
  TP('01_family_group_entrance', 1200, 896,  { hero: true,             g: 0, frame: 'FD01' }),
  TP('02_girl_carousel',         1024, 1024, { pick: true,             g: 1, frame: 'FD02' }),
  TP('04_kiddie_coaster',        1200, 896,  {                         g: 2, frame: 'FD03' }),
  TP('05_ice_cream',             1200, 896,  { pick: true,             g: 3, frame: 'FD04' }),
  TP('06_teacups',               1024, 1024, {                         g: 4, frame: 'FD05' }),
  TP('08_balloon',               896,  1200, {                         g: 5, frame: 'FD06' }),
  TP('09_mascot',                1200, 896,  { pick: true,             g: 0, frame: 'FD07' }),
  TP('11_playground',            1200, 896,  {                         g: 1, frame: 'FD08' }),
  TP('12_facepaint',             1200, 896,  { pick: true,             g: 2, frame: 'FD09' }),
  TP('13_cotton_candy',          896,  1200, {                         g: 3, frame: 'FD10' }),
  TP('15_sunhat',                896,  1200, {                         g: 4, frame: 'FD11' }),
  TP('16_balloon_animal',        1200, 896,  {                         g: 5, frame: 'FD12' }),
  TP('17_lemonade',              1200, 896,  { pick: true,             g: 0, frame: 'FD13' }),
  TP('22_fence_peek',            896,  1200, {                         g: 1, frame: 'FD14' }),
  TP('26_lunch',                 1200, 896,  { hero: true,             g: 2, frame: 'FD15' }),
  TP('27_family_coaster',        1200, 896,  { pick: true,             g: 3, frame: 'FD16' }),
  TP('30_swinging_hands',        1200, 896,  {                         g: 4, frame: 'FD17' }),
  TP('31_gift_shop',             1200, 896,  { hero: true,             g: 5, frame: 'FD18' }),
  TP('33_bench_icecream',        1200, 896,  { pick: true,             g: 0, frame: 'FD19' }),
  TP('34_ferris_wheel_family',   1200, 896,  { hero: true,             g: 1, frame: 'FD20' }),
  TP('36_piggyback',             1200, 896,  {                         g: 2, frame: 'FD21' }),
  TP('37_family_icecream',       1200, 896,  { pick: true,             g: 3, frame: 'FD22' }),
  TP('38_parents_bench',         1200, 896,  {                         g: 4, frame: 'FD23' }),
  TP('41_parents_cafe',          1200, 896,  { pick: true,             g: 5, frame: 'FD24' }),
  TP('46_carousel',              1200, 896,  { hero: true,             g: 0, frame: 'FD25' }),
];

// Pass 2 — Thrill Seeker: coasters, drop tower, log flume, queueing, cheering.
const THRILL_PHOTOS = [
  TP('03_bumper_car',            1200, 896,  { pick: true,             g: 0, frame: 'TS01' }),
  TP('07_splash',                1200, 896,  {                         g: 1, frame: 'TS02' }),
  TP('10_droptower_queue',       896,  1200, {                         g: 2, frame: 'TS03' }),
  TP('14_pirate_ship',           1200, 896,  { pick: true,             g: 3, frame: 'TS04' }),
  TP('18_log_flume',             1200, 896,  { pick: true,             g: 4, frame: 'TS05' }),
  TP('19_pointing_coaster',      1200, 896,  { pick: true,             g: 5, frame: 'TS06' }),
  TP('20_map',                   896,  1200, {                         g: 0, frame: 'TS07' }),
  TP('21_chairoplane',           1200, 896,  {                         g: 1, frame: 'TS08' }),
  TP('23_selfie',                1024, 1024, {                         g: 2, frame: 'TS09' }),
  TP('24_walking',               1200, 896,  { pick: true,             g: 3, frame: 'TS10' }),
  TP('25_entrance',              1200, 896,  { hero: true,             g: 4, frame: 'TS11' }),
  TP('28_photo_op',              1200, 896,  {                         g: 5, frame: 'TS12' }),
  TP('29_cheering',              1200, 896,  { pick: true,             g: 0, frame: 'TS13' }),
  TP('32_evening_show',          1200, 896,  { hero: true,             g: 1, frame: 'TS14' }),
  TP('35_high_five',             1200, 896,  {                         g: 2, frame: 'TS15' }),
  TP('39_mom_waiting',           896,  1200, {                         g: 3, frame: 'TS16' }),
  TP('40_dad_photo',             1200, 896,  { pick: true,             g: 4, frame: 'TS17' }),
  TP('42_parents_walk',          1200, 896,  {                         g: 5, frame: 'TS18' }),
  TP('43_steel_coaster',         1200, 896,  { hero: true,             g: 0, frame: 'TS19' }),
  TP('44_wooden_coaster',        896,  1200, {                         g: 1, frame: 'TS20' }),
  TP('45_ferris_wheel',          1200, 896,  { hero: true,             g: 2, frame: 'TS21' }),
  TP('47_bumper_arena',          1200, 896,  { pick: true,             g: 3, frame: 'TS22' }),
  TP('48_drop_tower',            896,  1200, {                         g: 4, frame: 'TS23' }),
  TP('49_log_flume_scenic',      1200, 896,  { pick: true,             g: 5, frame: 'TS24' }),
  TP('50_food_stalls',           1200, 896,  { hero: true,             g: 0, frame: 'TS25' }),
];

const PHOTOS = FAMILY_PHOTOS;
const PHOTOS_2 = THRILL_PHOTOS;

// two ticket passes; recognised from the ticket number
const CONCERTS = [
  { ...EVENT, genre: 'FAMILY', photos: PHOTOS },
  { ...EVENT_2, genre: 'THRILL', photos: PHOTOS_2 },
];
// all 2s → pass 2 (thrill seeker); anything else (incl. all 1s / scan / empty) → pass 1 (family day)
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
