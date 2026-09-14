const { put } = require('@vercel/blob');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      res.status(500).json({
        error: 'Vercel Blob not configured. In Vercel dashboard: Storage → Create Database → Blob → link to this project. BLOB_READ_WRITE_TOKEN will be auto-injected.',
      });
      return;
    }

    const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      res.status(400).json({
        error: `Unsupported content-type: "${contentType}". Allowed: ${[...ALLOWED_TYPES].join(', ')}`,
      });
      return;
    }

    // Demo-day reality: the gig-goer photos that should round-trip back into
    // the editor are pre-uploaded to GCS and resolved by filename in the
    // frontend (see GIG_GOER_PHOTOS in src/upload.jsx). This endpoint exists
    // only as a fallback for off-script files — plain random-suffix put().
    const ext = contentType.split('/')[1] || 'bin';
    const filename = `gallery-link/customer-image.${ext}`;
    const blob = await put(filename, req, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });
    res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (e) {
    console.error('[upload-photo]', e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
}

module.exports = handler;
module.exports.config = {
  api: { bodyParser: false },
};
