const PBX_BASE = process.env.PBX_BASE_URL || 'https://sales-demo-pbx2.getprintbox.com';
const PBX_SITE_NAME = process.env.PBX_SITE_NAME || 'sales_demo';
const PBX_STORE_ID = parseInt(process.env.PBX_STORE_ID || '1', 10);

// Backend is stateless about which products exist — admin manages the list
// in /api/products and the frontend hands us familyId + numeric productId
// straight from there. Each request is validated and forwarded as-is to
// POST /api/ec/v4/projects/.

const DEMO_PHOTO_BASE = 'https://storage.googleapis.com/pbx2-sales-demo/media/uploads/concertgallery';
const DEMO_PHOTO_SLUGS = [
  ['01_stage_wide_crowd',           'Amazing crowd energy.'],
  ['02_vocalist_closeup',           null],
  ['03_crowd_mosh_energy',          null],
  ['04_guitarist_solo_portrait',    'Epic guitar solo.'],
  ['05_stage_pyro_flames',          null],
  ['06_drummer_action_portrait',    null],
  ['07_silhouette_backlit',         null],
  ['08_crowd_surfer_action',        'Crowd surfing action!'],
  ['09_bassist_low_angle',          null],
  ['10_stage_from_pit',             null],
  ['11_microphone_hands_detail',    null],
  ['12_guitar_headstock_detail',    null],
  ['13_stage_lights_abstract',      null],
  ['14_vocalist_profile_intense',   null],
  ['15_drummer_overhead',           null],
  ['16_guitarist_jump_freeze',      null],
  ['17_smoke_laser_beams',          'Incredible light show.'],
  ['18_stage_dive_moment',          null],
  ['19_full_band_wide',             null],
  ['20_cymbal_crash_detail',        null],
  ['21_confetti_finale',            'The grand finale!'],
  ['22_spotlight_solo_moment',      null],
  ['23_led_screen_visuals',         null],
  ['24_bassist_profile',            null],
  ['25_crowd_phone_lights',         null],
  ['26_guitarist_silhouette',       null],
];

const DEMO_PHOTOS = DEMO_PHOTO_SLUGS.map(([slug, caption]) => {
  const metadata = { width: 3000, height: 2000, mimetype: 'image/jpeg' };
  if (caption) metadata.caption = caption;
  return {
    original_photo_url: `${DEMO_PHOTO_BASE}/${slug}.jpg`,
    thumbnail_photo_url: `${DEMO_PHOTO_BASE}/thumb/${slug}_thumb.jpg`,
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
