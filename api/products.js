const { put, list } = require('@vercel/blob');

// Required env var — no fallback. Missing => admin is locked out (POST returns
// 401 for every attempt) so the previous public default ("pbxadmin") can't
// be used to bypass auth in an under-configured deployment.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PRODUCTS_PATH = 'gallery-link/products.json';

const VALID_ORIENTATIONS = ['portrait', 'landscape', 'square'];
const VALID_CREATION_METHODS = ['api', 'editor'];

// Seed used the very first time admin loads and no blob exists yet.
// Products can be EITHER flat (familyId + productId/slug/attributeValues
// at top level) OR variant-based (variants[] array, each entry carries its
// own orientation + spec). Frontend renders one card per product, and for
// variant products auto-picks the entry whose orientation matches the
// selected photo's aspect ratio.
const DEFAULT_PRODUCTS = [
  {
    id: 'book',
    name: 'Photobook',
    thumbnailUrl: 'assets/photobook.jpg',
    familyId: '305',
    productId: '7605',
    minPhotos: 26,
    maxPhotos: 100,
    allowOwnPhotos: true,
  },
  {
    id: 'cal',
    name: 'Calendar',
    thumbnailUrl: 'assets/calendar.jpg',
    familyId: '220',
    productId: '5809',
    minPhotos: 13,
    maxPhotos: 36,
  },
  {
    id: 'frame',
    name: 'Frame',
    thumbnailUrl: 'assets/frame.jpg',
    minPhotos: 1,
    maxPhotos: 1,
    variants: [
      {
        orientation: 'landscape',
        familyId: '304',
        attributeValues: {
          orientation: 'horizontal', size: '12x8',
          theme: 'concertFrame', frameColor: 'black', frameThickness: '1inch',
        },
      },
      {
        orientation: 'portrait',
        familyId: '304',
        attributeValues: {
          orientation: 'vertical', size: '8x12',
          theme: 'concertFrame', frameColor: 'black', frameThickness: '1inch',
        },
      },
      {
        orientation: 'square',
        familyId: '304',
        attributeValues: {
          orientation: 'square', size: '10x10',
          theme: 'concertFrame', frameColor: 'black', frameThickness: '1inch',
        },
      },
    ],
  },
];

let cached = null;
let cachedAt = 0;
// 5 min — admin saves are rare, cache invalidates immediately on write via
// writeProducts() so we don't serve stale data after a real change. Reads
// fetch from Blob (list() is an "advanced op" in billing).
const CACHE_TTL_MS = 5 * 60_000;

async function readProducts() {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;

  try {
    const result = await list({ prefix: PRODUCTS_PATH });
    const blob = (result.blobs || []).find((b) => b.pathname === PRODUCTS_PATH);
    if (!blob) {
      cached = DEFAULT_PRODUCTS;
      cachedAt = Date.now();
      return cached;
    }
    const res = await fetch(blob.url);
    if (!res.ok) throw new Error('Blob fetch failed: ' + res.status);
    const products = await res.json();
    cached = products;
    cachedAt = Date.now();
    return products;
  } catch (e) {
    console.error('[products] read error', e);
    return DEFAULT_PRODUCTS;
  }
}

async function writeProducts(products) {
  await put(PRODUCTS_PATH, JSON.stringify(products, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
    addRandomSuffix: false,
  });
  cached = products;
  cachedAt = Date.now();
}

function hasSpec(o) {
  const hasProductId = o.productId && String(o.productId).trim().length > 0;
  const hasSlug = o.slug && String(o.slug).trim().length > 0;
  const hasAttrs = o.attributeValues && typeof o.attributeValues === 'object'
    && !Array.isArray(o.attributeValues) && Object.keys(o.attributeValues).length > 0;
  return hasProductId || hasSlug || hasAttrs;
}

function validateExtras(o, label) {
  if (o.creationMethod != null && !VALID_CREATION_METHODS.includes(o.creationMethod)) {
    return `${label}.creationMethod must be one of: ${VALID_CREATION_METHODS.join(', ')}`;
  }
  if (o.editorParams != null
      && (typeof o.editorParams !== 'object' || Array.isArray(o.editorParams))) {
    return `${label}.editorParams must be an object`;
  }
  if (o.allowOwnPhotos != null && typeof o.allowOwnPhotos !== 'boolean') {
    return `${label}.allowOwnPhotos must be a boolean`;
  }
  if (o.editorUrlSuffix != null && typeof o.editorUrlSuffix !== 'string') {
    return `${label}.editorUrlSuffix must be a string`;
  }
  return null;
}

function validateProduct(p, idx) {
  if (!p || typeof p !== 'object') return `products[${idx}] must be an object`;
  if (!p.id || typeof p.id !== 'string') return `products[${idx}].id is required (string)`;
  if (!p.name || typeof p.name !== 'string') return `products[${idx}].name is required (string)`;
  if (typeof p.minPhotos !== 'number' || p.minPhotos < 1) {
    return `products[${idx}] (${p.id}).minPhotos must be a positive number`;
  }

  // Variant-based products: each entry in `variants` carries its own
  // orientation and/or band + familyId + spec. Either dimension is optional,
  // but a variant must have at least one of them (otherwise it's just a flat
  // product in disguise) AND the (band, orientation) pair must be unique.
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    const seenKeys = new Set();
    for (let v = 0; v < p.variants.length; v++) {
      const variant = p.variants[v];
      if (!variant || typeof variant !== 'object') {
        return `products[${idx}] (${p.id}).variants[${v}] must be an object`;
      }
      const hasOri = variant.orientation != null && variant.orientation !== '';
      const hasBand = variant.band != null && variant.band !== '';
      if (hasOri && !VALID_ORIENTATIONS.includes(variant.orientation)) {
        return `products[${idx}] (${p.id}).variants[${v}].orientation must be one of: ${VALID_ORIENTATIONS.join(', ')}`;
      }
      if (hasBand && typeof variant.band !== 'string') {
        return `products[${idx}] (${p.id}).variants[${v}].band must be a string`;
      }
      if (!hasOri && !hasBand) {
        return `products[${idx}] (${p.id}).variants[${v}] must set at least one of: orientation, band`;
      }
      const key = (variant.band || '') + '|' + (variant.orientation || '');
      if (seenKeys.has(key)) {
        return `products[${idx}] (${p.id}).variants has duplicate (band, orientation) = (${variant.band || ''}, ${variant.orientation || ''})`;
      }
      seenKeys.add(key);
      if (!variant.familyId) {
        return `products[${idx}] (${p.id}).variants[${v}].familyId is required`;
      }
      if (!hasSpec(variant)) {
        return `products[${idx}] (${p.id}).variants[${v}] needs one of: productId, slug, attributeValues`;
      }
      const extrasErr = validateExtras(variant, `products[${idx}] (${p.id}).variants[${v}]`);
      if (extrasErr) return extrasErr;
    }
    const extrasErr = validateExtras(p, `products[${idx}] (${p.id})`);
    if (extrasErr) return extrasErr;
    return null;
  }

  // Flat (no-variant) products: spec lives at top level.
  if (!p.familyId) return `products[${idx}] (${p.id}).familyId is required`;
  if (!hasSpec(p)) {
    return `products[${idx}] (${p.id}) needs one of: productId, slug, attributeValues (or define variants[])`;
  }
  const extrasErr = validateExtras(p, `products[${idx}] (${p.id})`);
  if (extrasErr) return extrasErr;
  return null;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const products = await readProducts();
      res.status(200).json({ products });
    } catch (e) {
      console.error('[products] GET error', e);
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const password = req.headers['x-admin-password'];
    if (!ADMIN_PASSWORD || !password || password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const products = body.products;
      if (!Array.isArray(products)) {
        res.status(400).json({ error: 'Body must include "products" array' });
        return;
      }

      const seenIds = new Set();
      for (let i = 0; i < products.length; i++) {
        const err = validateProduct(products[i], i);
        if (err) {
          res.status(400).json({ error: err });
          return;
        }
        if (seenIds.has(products[i].id)) {
          res.status(400).json({ error: `Duplicate product id: ${products[i].id}` });
          return;
        }
        seenIds.add(products[i].id);
      }

      await writeProducts(products);
      res.status(200).json({ saved: true, count: products.length });
    } catch (e) {
      console.error('[products] POST error', e);
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
