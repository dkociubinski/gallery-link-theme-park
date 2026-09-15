const PBX_BASE = process.env.PBX_BASE_URL || 'https://sales-demo-pbx2.getprintbox.com';
const PBX_SITE_NAME = process.env.PBX_SITE_NAME || 'sales_demo';
const PBX_STORE_ID = parseInt(process.env.PBX_STORE_ID || '1', 10);

// Backend is stateless about which products exist — admin manages the list
// in /api/products and the frontend hands us familyId + numeric productId
// straight from there. Each request is validated and forwarded as-is to
// POST /api/ec/v4/projects/.

const DEMO_PHOTO_BASE = 'https://storage.googleapis.com/pbx2-sales-demo/media/uploads/theme-park';
const DEMO_PHOTO_SLUGS = [
  ['01_family_group_entrance',    'First steps into the park!'],
  ['02_girl_carousel',            null],
  ['03_bumper_car',               null],
  ['04_kiddie_coaster',           null],
  ['05_ice_cream',                null],
  ['06_teacups',                  null],
  ['07_splash',                   'Splash zone!'],
  ['08_balloon',                  null],
  ['09_mascot',                   null],
  ['10_droptower_queue',          null],
  ['11_playground',               null],
  ['12_facepaint',                null],
  ['13_cotton_candy',             null],
  ['14_pirate_ship',              null],
  ['15_sunhat',                   null],
  ['16_balloon_animal',           null],
  ['17_lemonade',                 null],
  ['18_log_flume',                'Log flume drop!'],
  ['19_pointing_coaster',         null],
  ['20_map',                      null],
  ['21_chairoplane',              null],
  ['22_fence_peek',               null],
  ['23_selfie',                   null],
  ['24_walking',                  null],
  ['25_entrance',                 null],
  ['26_lunch',                    null],
  ['27_family_coaster',           null],
  ['28_photo_op',                 null],
  ['29_cheering',                 'Best day ever!'],
  ['30_swinging_hands',           null],
  ['31_gift_shop',                null],
  ['32_evening_show',             'The evening show.'],
  ['33_bench_icecream',           null],
  ['34_ferris_wheel_family',      null],
  ['35_high_five',                null],
  ['36_piggyback',                null],
  ['37_family_icecream',          null],
  ['38_parents_bench',            null],
  ['39_mom_waiting',              null],
  ['40_dad_photo',                null],
  ['41_parents_cafe',             null],
  ['42_parents_walk',             null],
  ['43_steel_coaster',            null],
  ['44_wooden_coaster',           null],
  ['45_ferris_wheel',             'The big wheel.'],
  ['46_carousel',                 null],
  ['47_bumper_arena',             null],
  ['48_drop_tower',               null],
  ['49_log_flume_scenic',         null],
  ['50_food_stalls',              null],
];

// Actual pixel dimensions (read from the uploaded files, 2026-09-15) — most
// are landscape 1200x896, a handful portrait 896x1200, three square 1024x1024.
const PORTRAIT_SLUGS = new Set(['08_balloon', '10_droptower_queue', '13_cotton_candy', '15_sunhat', '20_map', '22_fence_peek', '39_mom_waiting', '44_wooden_coaster', '48_drop_tower']);
const SQUARE_SLUGS = new Set(['02_girl_carousel', '06_teacups', '23_selfie']);

const DEMO_PHOTOS = DEMO_PHOTO_SLUGS.map(([slug, caption]) => {
  const [width, height] = SQUARE_SLUGS.has(slug) ? [1024, 1024] : PORTRAIT_SLUGS.has(slug) ? [896, 1200] : [1200, 896];
  const metadata = { width, height, mimetype: 'image/jpeg' };
  if (caption) metadata.caption = caption;
  return {
    original_photo_url: `${DEMO_PHOTO_BASE}/${slug}.jpg`,
    // No separate thumb/ variant exists for this bucket (unlike the old
    // concertgallery one) — reuse the original as its own thumbnail.
    thumbnail_photo_url: `${DEMO_PHOTO_BASE}/${slug}.jpg`,
    metadata,
  };
});

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 60_000) return cachedToken;

  const clientId = process.env.client_id_sales_demo;
  const clientSecret = process.env.client_secret_sales_demo;
  if (!clientId || !clientSecret) {
    throw httpError(500, 'Server misconfigured: client_id_sales_demo and client_secret_sales_demo env vars must be set in Vercel');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${PBX_BASE}/o/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw httpError(res.status, `OAuth token request failed: ${res.status}`, safeJson(text));
  }

  const json = JSON.parse(text);
  cachedToken = json.access_token;
  cachedTokenExpiry = now + (json.expires_in || 3600) * 1000;
  return cachedToken;
}

async function pbxFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${PBX_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const body = safeJson(text);
  if (!res.ok) {
    throw httpError(res.status, `PBX ${path} failed: ${res.status}`, body);
  }
  return body;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

function httpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}

function buildPhotoSources(custom, minRequired) {
  if (Array.isArray(custom) && custom.length > 0) {
    // Each entry is either a plain URL string (legacy) or a rich source
    // object — { original_photo_url, thumbnail_photo_url?, metadata?,
    // external_id?, … } — that we forward to Printbox verbatim.
    return custom.map((item) => {
      if (typeof item === 'string') return { original_photo_url: item };
      if (item && typeof item === 'object' && item.original_photo_url) return item;
      return null;
    }).filter(Boolean);
  }
  return DEMO_PHOTOS.slice(0, Math.max(minRequired || 1, 1));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
    const { familyId, productId, photos, name, attributes } = body;

    const familyIdNum = parseInt(familyId, 10);
    if (!familyIdNum) {
      res.status(400).json({ error: 'familyId (numeric) is required in the body' });
      return;
    }
    const productIdNum = productId != null && productId !== '' ? parseInt(productId, 10) : null;
    const hasAttrs = attributes && typeof attributes === 'object'
      && !Array.isArray(attributes) && Object.keys(attributes).length > 0;
    if (!productIdNum && !hasAttrs) {
      res.status(400).json({
        error: 'one of productId (numeric) or attributes (object) is required',
      });
      return;
    }

    const sources = buildPhotoSources(photos, 1);

    const projectName = name || `Gallery Link ${Math.floor(Math.random() * 99999)}`;

    const payload = {
      name: projectName,
      store_id: PBX_STORE_ID,
      family_id: familyIdNum,
      photos: { sources },
    };
    if (productIdNum) payload.product_id = productIdNum;
    if (hasAttrs) payload.attributes = attributes;

    const project = await pbxFetch('/api/ec/v4/projects/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    res.status(200).json({
      uuid: project.uuid,
      siteName: PBX_SITE_NAME,
      familyId: familyIdNum,
      productId: productIdNum,
      photoCount: sources.length,
      project: {
        id: project.id,
        name: project.name,
        family_id: project.family_id,
        product_id: project.product_id,
      },
    });
  } catch (e) {
    console.error('[create-project]', e.status || '?', e.message, e.details);
    res.status(e.status && e.status < 600 ? e.status : 500).json({
      error: e.message,
      details: e.details,
    });
  }
};
