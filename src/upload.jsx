// src/upload.jsx — UploadScreen (add your own shots) + DoneScreen

const { useState: useStateU, useEffect: useEffectU, useRef: useRefU } = React;

// example "your own" shot — a personal phone photo taken at the show
const SELFIE = 'https://images.unsplash.com/photo-1722608274468-06938c516fba?auto=format&fit=crop&w=200&q=72';

// `own` / `setOwn` are lifted to App so DoneScreen can access the raw File
// for the personalization upload to /api/upload-photo.
function UploadScreen({ desktop, product, own, setOwn, onBack, onFinish }) {
  const MAX = 3;
  const inputRef = useRefU(null);
  const pick = () => inputRef.current && inputRef.current.click();
  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setOwn((o) => {
      const room = MAX - o.length;
      const next = files.slice(0, room).map((f, i) => ({
        id: 'o' + Date.now() + '_' + i,
        url: URL.createObjectURL(f),
        file: f,  // keep raw File for the Blob upload in DoneScreen
        mine: true,
      }));
      return [...o, ...next];
    });
    e.target.value = '';
  };
  const remove = (id) => setOwn((o) => {
    const t = o.find((x) => x.id === id);
    if (t && t.url) { try { URL.revokeObjectURL(t.url); } catch (_) {} }
    return o.filter((x) => x.id !== id);
  });
  const empty = own.length === 0;

  const fileInput = <input ref={inputRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />;

  const uploadGrid = (cols) => empty ? (
    <div onClick={pick} style={{
      borderRadius: 18, border: '1.5px dashed var(--line-2)', background: 'rgba(255,255,255,0.015)',
      minHeight: cols >= 4 ? 340 : 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, cursor: 'pointer', padding: 24, textAlign: 'center',
    }}>
      <div className="glass" style={{ width: 62, height: 62, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ic.plus s={28} c="var(--ink)" />
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>Add your photos</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', maxWidth: 240, lineHeight: 1.45 }}>
        {desktop ? 'Click' : 'Tap'} to choose up to {MAX} of your own shots from this device.
      </div>
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
      {own.map((o) => (
        <div key={o.id} onClick={() => remove(o.id)} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-3)', cursor: 'pointer' }}>
          {o.url && <img src={o.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.opacity = 0; }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.45))' }} />
          <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}><Ic.close s={12} c="#0b0b0c" /></div>
        </div>
      ))}
      {own.length < MAX && (
        <div onClick={pick} style={{ aspectRatio: '1', borderRadius: 12, border: '1.5px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.015)' }}>
          <Ic.plus s={22} c="var(--ink-2)" />
          <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>ADD</span>
        </div>
      )}
    </div>
  );

  const infoCard = (
    <div className="card" style={{ padding: '13px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ flexShrink: 0, width: 76, height: 76, borderRadius: 13, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.85)', position: 'relative', transform: 'rotate(-3deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
        <img src={SELFIE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%', transform: 'scale(1.55)' }} onError={(e) => { e.target.style.opacity = 0; }} />
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-2)' }}>
        Optional — add up to <b style={{ color: 'var(--ink)' }}>{MAX} of your own photos</b> and we'll use them in your product. Skip to keep just the pro shots.
      </div>
    </div>
  );

  // ───────── DESKTOP: two-pane (left panel like memories + nicer right uploads pane) ─────────
  if (desktop) {
    const slots = Array.from({ length: MAX }).map((_, i) => {
      const o = own[i];
      if (o) return (
        <div key={o.id} onClick={() => remove(o.id)} style={{ position: 'relative', aspectRatio: '1', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-3)', cursor: 'pointer' }}>
          {o.url && <img src={o.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.opacity = 0; }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.45))' }} />
          <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}><Ic.close s={13} c="#0b0b0c" /></div>
        </div>
      );
      if (i === own.length) return (
        <div key="add" onClick={pick} className="dt-hover" style={{ aspectRatio: '1', borderRadius: 14, border: '1.5px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: 'rgba(127,127,127,0.04)' }}>
          <div className="glass" style={{ width: 48, height: 48, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.plus s={22} c="var(--ink)" /></div>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--ink-2)' }}>ADD PHOTO</span>
        </div>
      );
      return (
        <div key={'ph' + i} style={{ aspectRatio: '1', borderRadius: 14, border: '1px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', opacity: 0.45 }}>{String(i + 1).padStart(2, '0')}</span>
        </div>
      );
    });
    return (
      <div className="screen dt-wide anim-in" style={{ overflow: 'hidden' }}>
        {fileInput}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 432px', width: '100%', height: '100%' }}>
          <aside className="no-sb" style={{ gridColumn: 2, height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--line)', padding: 'calc(var(--top) + 10px) 30px calc(var(--bottom) + 22px)', overflowY: 'auto' }}>
            <div className="row" style={{ gap: 12, marginBottom: 24 }}>
              <div className="glass icon-btn" style={{ width: 42, height: 42, flexShrink: 0 }} onClick={onBack}><Ic.chevL s={19} c="var(--ink)" /></div>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>STEP 2 / 3 · ADD YOUR SHOTS</div>
            </div>
            <h1 className="display" style={{ fontSize: 34, margin: 0, lineHeight: 0.96 }}>Add your<br/>own shots</h1>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, margin: '14px 0 0' }}>
              Optional — add up to {MAX} of your own photos and we'll use them in your {product.name.toLowerCase()}.
            </p>
            <div style={{ marginTop: 20 }}>{infoCard}</div>
            <div style={{ flex: 1, minHeight: 22 }} />
            <button className="btn btn-primary" onClick={onFinish} style={{ height: 54 }}>
              <Ic.spark s={16} c="var(--acc-ink)" /> Create {product.name}
            </button>
          </aside>
          <main className="scroll" style={{ gridColumn: 1, gridRow: 1, padding: '40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="kicker">Your uploads</div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{own.length} / {MAX}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>{slots}</div>
              <div className="row gap8" style={{ marginTop: 16, alignItems: 'center', color: 'var(--ink-3)' }}>
                <Ic.upload s={15} c="var(--ink-3)" /><span style={{ fontSize: 11.5 }}>JPG or PNG, up to 25MB each · optional</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="screen anim-in">
      {fileInput}

      <div className="row" style={{ paddingTop: 'var(--top)', paddingLeft: 18, paddingRight: 18, gap: 12 }}>
        <div className="glass icon-btn" style={{ width: 40, height: 40 }} onClick={onBack}><Ic.chevL s={19} c="var(--ink)" /></div>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>STEP 2 / 3 · ADD YOUR SHOTS</div>
      </div>

      <div className="scroll">
        <div style={{ padding: '26px 22px 0' }}>
          <h1 className="display" style={{ fontSize: 40, margin: 0 }}>Add your<br/>own shots</h1>

          {/* counter */}
          <div className="row between" style={{ marginTop: 26, marginBottom: 12 }}>
            <div className="kicker">Your uploads</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{own.length} / {MAX}</div>
          </div>

          {empty ? (
            /* empty state — one big add tile */
            <div onClick={pick} style={{
              borderRadius: 18, border: '1.5px dashed var(--line-2)', background: 'rgba(255,255,255,0.015)',
              minHeight: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 14, cursor: 'pointer', padding: 24, textAlign: 'center',
            }}>
              <div className="glass" style={{ width: 62, height: 62, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic.plus s={28} c="var(--ink)" />
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>Add your photos</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', maxWidth: 240, lineHeight: 1.45 }}>
                Tap to choose up to {MAX} of your own shots from this device.
              </div>
            </div>
          ) : (
            /* grid of uploaded photos + add tile */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {own.map((o) => (
                <div key={o.id} onClick={() => remove(o.id)} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-3)', cursor: 'pointer' }}>
                  {o.url && <img src={o.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.opacity = 0; }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.45))' }} />
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}><Ic.close s={12} c="#0b0b0c" /></div>
                </div>
              ))}
              {own.length < MAX && (
                <div onClick={pick} style={{ aspectRatio: '1', borderRadius: 12, border: '1.5px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.015)' }}>
                  <Ic.plus s={22} c="var(--ink-2)" />
                  <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>ADD</span>
                </div>
              )}
            </div>
          )}

          <div className="row gap8" style={{ marginTop: 16, alignItems: 'center', color: 'var(--ink-3)' }}>
            <Ic.upload s={15} c="var(--ink-3)" />
            <span style={{ fontSize: 11.5 }}>JPG or PNG, up to 25MB each · optional</span>
          </div>
        </div>
        <div style={{ height: 240 }} />
      </div>

      {/* footer */}
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 'calc(var(--bottom) + 10px)', zIndex: 30 }}>
        {/* explanation — selfie example + optional/skip note, just above the CTA */}
        <div className="card" style={{ padding: '13px 14px', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>
          <div style={{ flexShrink: 0, width: 76, height: 76, borderRadius: 13, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.85)', position: 'relative', transform: 'rotate(-3deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
            <img src={SELFIE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%', transform: 'scale(1.55)' }} onError={(e) => { e.target.style.opacity = 0; }} />
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-2)' }}>
            Optional — add up to <b style={{ color: 'var(--ink)' }}>{MAX} of your own photos</b> and we'll use them in your product. Skip to keep just the pro shots.
          </div>
        </div>
        <button className="btn btn-primary" onClick={onFinish} style={{ boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
          <Ic.spark s={16} c="var(--acc-ink)" /> Create {product.name}
        </button>
      </div>
    </div>
  );
}

// Photo `ar` is height/width. Tight band around 1.0 keeps almost-square
// shots on the square variant; outside it we switch by axis.
function photoOrientation(photo) {
  if (!photo || typeof photo.ar !== 'number') return 'landscape';
  if (photo.ar >= 0.95 && photo.ar <= 1.05) return 'square';
  return photo.ar > 1 ? 'portrait' : 'landscape';
}

// For variant products: score each variant by how many of its declared
// criteria match the current context (band, orientation). Mismatch on any
// declared criterion eliminates the variant. The variant with the highest
// score wins (more specific > less specific); ties go to the first
// encountered. Falls back to the first variant when nothing matches at all.
function pickVariantFromContext(variants, ctx) {
  let best = null;
  let bestScore = -1;
  for (const v of variants) {
    let score = 0;
    let mismatch = false;
    if (v.orientation != null && v.orientation !== '') {
      if (v.orientation === ctx.orientation) score++;
      else mismatch = true;
    }
    if (v.band != null && v.band !== '') {
      if (v.band === ctx.band) score++;
      else mismatch = true;
    }
    if (mismatch) continue;
    if (score > bestScore) { best = v; bestScore = score; }
  }
  return best || variants[0];
}

// editorUrlSuffix is appended verbatim to the final editor URL — admins
// almost always start it with "&" but we auto-prefix when they forget so
// "?a=b" + "dapi=…" still parses cleanly.
function normalizeSuffix(s) {
  if (!s) return '';
  return (s[0] === '&' || s[0] === '?') ? s : '&' + s;
}

// Printbox / GCS storage convention: photos uploaded at
//   /media/uploads/<path>/<file>.<ext>
// have their generated thumbnail at
//   /media/uploads/_versions/<path>/<file>_large.<ext>
// We derive that URL and pass it as thumbnail_photo_url to /api/ec/v4/projects/
// so Printbox doesn't need to regenerate a thumbnail before showing the photo
// in the editor. Returns null for non-GCS URLs (Vercel Blob user uploads, etc.) —
// callers should just omit thumbnail_photo_url when null. Printbox falls back
// to the original on missing/403 thumbs at ingest time.
function deriveThumbUrl(url) {
  const m = String(url).match(/^(https:\/\/storage\.googleapis\.com\/[^/]+\/media\/uploads)\/(.+)\.([a-zA-Z]+)(\?.*)?$/);
  if (!m) return null;
  const [, base, path, ext, query] = m;
  return base + '/_versions/' + path + '_large.' + ext + (query || '');
}

// Demo gig-goer photos pre-uploaded to GCS. When the user picks one of these
// filenames from the Upload step, we skip /api/upload-photo entirely and
// reference the hosted URL + its parallel _versions thumb directly. Keeps
// the demo cheap on Vercel Blob and lets Printbox use external storage
// straight away. Anything else falls through to a plain Blob upload below.
const GIG_GOER_BASE = 'https://storage.googleapis.com/pbx2-sales-demo/media/uploads/concertgallery';
const GIG_GOER_THUMB_BASE = 'https://storage.googleapis.com/pbx2-sales-demo/media/uploads/_versions/concertgallery';
const GIG_GOER_PHOTOS = {
  'gig-goers-outside.jpg':  { url: GIG_GOER_BASE + '/gig-goers-outside.jpg',  thumb: GIG_GOER_THUMB_BASE + '/gig-goers-outside_large.jpg' },
  'gig-goers-selfie.jpg':   { url: GIG_GOER_BASE + '/gig-goers-selfie.jpg',   thumb: GIG_GOER_THUMB_BASE + '/gig-goers-selfie_large.jpg' },
  'gig-goers-selfie-2.jpg': { url: GIG_GOER_BASE + '/gig-goers-selfie-2.jpg', thumb: GIG_GOER_THUMB_BASE + '/gig-goers-selfie-2_large.jpg' },
};

async function uploadToBlob(blob) {
  const upRes = await fetch('/api/upload-photo', {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'application/octet-stream' },
    body: blob,
  });
  const upData = await upRes.json().catch(() => ({}));
  if (!upRes.ok) throw new Error('Blob upload failed: ' + (upData.error || upRes.status));
  return upData.url;
}

// Decode the user-supplied file: read its pixel dimensions, compress (re-
// encode to max-3500px JPEG @0.85) when it'd otherwise exceed Vercel's
// ~4.5 MB function body cap. Always returns the dims + mimetype that match
// the blob we hand off to upload, so we can drop them into Printbox's
// required metadata.{width,height,mimetype} on the projects/create payload.
async function prepareUserUpload(file) {
  const SAFE_BYTES = 4 * 1024 * 1024;
  const MAX_DIM = 3500;
  const QUALITY = 0.85;

  const objUrl = URL.createObjectURL(file);
  let img;
  try {
    img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Cannot decode image: ' + file.name));
      i.src = objUrl;
    });
  } catch (e) {
    URL.revokeObjectURL(objUrl);
    throw e;
  }
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  if (file.size <= SAFE_BYTES) {
    URL.revokeObjectURL(objUrl);
    return {
      blob: file,
      width: origW,
      height: origH,
      mimetype: file.type || 'image/jpeg',
    };
  }

  try {
    const scale = Math.min(1, MAX_DIM / Math.max(origW, origH));
    const w = Math.max(1, Math.round(origW * scale));
    const h = Math.max(1, Math.round(origH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    const compressed = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('canvas.toBlob returned null')), 'image/jpeg', QUALITY);
    });
    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    console.log('[upload] compressed', file.name, file.size, '→', compressed.size, '(' + w + 'x' + h + ')');
    return {
      blob: new File([compressed], newName, { type: 'image/jpeg', lastModified: file.lastModified }),
      width: w,
      height: h,
      mimetype: 'image/jpeg',
    };
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

// For a product fetched from /api/products, pick the actual spec block that
// will drive setEditorConfig. Variant products go through multi-criteria
// matching; flat products carry the spec at the top level.
function pickProductSpec(product, ctx) {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return pickVariantFromContext(product.variants, ctx);
  }
  return product;
}

// {{name}} → ctx[name]. Strings keep unresolved placeholders as-is; the
// containing object drops the key when *any* placeholder went unresolved
// (avoids sending empty / partially-templated values to the editor).
const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;
function substituteTemplate(value, ctx) {
  if (typeof value === 'string') {
    let unresolved = false;
    const out = value.replace(PLACEHOLDER_RE, (m, name) => {
      const v = ctx[name];
      if (v == null || v === '') { unresolved = true; return m; }
      return String(v);
    });
    return unresolved ? { __drop: true } : out;
  }
  if (Array.isArray(value)) return value.map((v) => substituteTemplate(v, ctx)).filter((v) => !(v && v.__drop));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const sub = substituteTemplate(v, ctx);
      if (sub && sub.__drop) continue;
      out[k] = sub;
    }
    return out;
  }
  return value;
}

// Final handoff: upload personalization photo to Vercel Blob (if any), create
// the project against Printbox, then redirect to /editor.html with the URL
// params our editor shell expects (projectId / familyId / siteName / customImageUrl).
function DoneScreen({ concert, product, selected, own, onRestart }) {
  const count = selected ? selected.size : 0;
  const [stage, setStage] = useStateU('uploading');  // 'uploading' | 'creating' | 'redirecting' | 'error'
  const [errorMsg, setErrorMsg] = useStateU(null);

  useEffectU(() => {
    let cancelled = false;

    (async () => {
      try {
        // Build the ordered list of selected photos against the active concert.
        const selectedIds = selected ? [...selected] : [];
        const selectedPhotos = selectedIds
          .map((id) => concert.photos.find((p) => p.id === id))
          .filter(Boolean);

        if (cancelled) return;

        // Concert metadata feeds into the editorParams placeholder substitution
        // (see tplCtx below) — it gets baked into the substituted JSON we hand
        // to setEditorConfig. We no longer mirror it as separate URL params:
        // the editor shell doesn't read them anymore (the per-key fallback was
        // dropped a while back) and the duplicate values just bloated the URL.
        const concertDnV = (concert.date || concert.venue)
          ? [concert.date, concert.venue].filter(Boolean).join(' · ')
          : '';

        // Variant matching context: photo orientation drives Frame variants;
        // concert.artist drives band-keyed variants (Photobook per band, or
        // Frame band×orientation combinations).
        const ctx = {
          orientation: photoOrientation(selectedPhotos[0]),
          band: concert && concert.artist,
        };
        const spec = pickProductSpec(product, ctx);

        // Resolve every user-supplied photo to a public URL. Filenames in
        // GIG_GOER_PHOTOS short-circuit to their pre-hosted GCS URL (+ thumb)
        // without ever touching Vercel Blob — that's the demo-day common
        // case. Anything else compresses (when > 4 MB) and POSTs to
        // /api/upload-photo with a random suffix. Dimensions + mimetype come
        // along so we can populate Printbox's metadata when external storage
        // gets used downstream.
        let uploadedUserPhotos = [];
        const ownFiles = (own || []).filter((o) => o && o.file);
        if (ownFiles.length > 0) {
          setStage('uploading');
          uploadedUserPhotos = await Promise.all(ownFiles.map(async (o) => {
            const known = GIG_GOER_PHOTOS[o.file.name];
            const prep = await prepareUserUpload(o.file);  // also reads dims
            if (known) {
              return {
                url: known.url,
                thumbnailUrl: known.thumb,
                width: prep.width,
                height: prep.height,
                mimetype: prep.mimetype,
              };
            }
            const url = await uploadToBlob(prep.blob);
            return { url, width: prep.width, height: prep.height, mimetype: prep.mimetype };
          }));
        }
        const userPhotoUrls = uploadedUserPhotos.map((u) => u.url);
        const customImageUrl = userPhotoUrls[0] || null;

        if (cancelled) return;

        // Combined photo arrays carry gallery shots AND every user upload.
        // Backend/api flow consumes sources[] verbatim — user-supplied photos
        // are tagged with metadata.caption = "gig-goer" so Smart Creation /
        // downstream filters can distinguish them from the curated gallery.
        // thumbnail_photo_url is included when it can be derived (GCS originals
        // map to a /_versions/<path>_large.<ext> sibling); for Vercel Blob
        // uploads there's no thumb so we skip the key.
        // original_photo_storage: "external" tells Printbox to reference our
        // URLs directly instead of mirroring the bytes into its own bucket.
        // original_photo_storage: "external" only when we have a thumbnail to
        // pair it with — Printbox rejects external storage without a thumb
        // ("metadata.width/height/mimetype required …"). For URLs we can't
        // derive a thumb for (Vercel Blob user uploads, Unsplash transforms)
        // we fall through to default storage and Printbox mirrors the bytes.
        const apiPhotoSources = [
          ...selectedPhotos.map((p) => {
            const thumb = deriveThumbUrl(p.src);
            const src = { original_photo_url: p.src };
            if (thumb) {
              src.thumbnail_photo_url = thumb;
              src.original_photo_storage = 'external';
              src.metadata = {
                width: p.width,
                height: p.height,
                mimetype: p.mimetype || 'image/jpeg',
              };
            }
            return src;
          }),
          ...uploadedUserPhotos.map(({ url, thumbnailUrl, width, height, mimetype }) => {
            // Known gig-goer files come with an explicit thumbnailUrl from the
            // hardcoded map; off-script Blob uploads have no parallel thumb.
            const thumb = thumbnailUrl || deriveThumbUrl(url);
            const src = {
              original_photo_url: url,
              metadata: { caption: 'gig-goer' },
            };
            if (thumb) {
              src.thumbnail_photo_url = thumb;
              src.original_photo_storage = 'external';
              src.metadata.width = width;
              src.metadata.height = height;
              src.metadata.mimetype = mimetype || 'image/jpeg';
            }
            return src;
          }),
        ];
        // Editor-direct flow uses the photosToUploadForNewProject shape, which
        // doesn't carry metadata — the caption distinction only lives in the
        // /api/create-project path. Both photo sets land in the sidebar.
        const editorPhotos = [
          ...selectedPhotos.map((p) => ({
            id: p.id,
            name: (p.frame || p.id) + '.jpg',
            downloadUrl: p.src,
            publishTime: Date.now(),
          })),
          ...userPhotoUrls.map((url, i) => ({
            id: 'own-' + i,
            name: 'user-photo-' + (i + 1) + '.jpg',
            downloadUrl: url,
            publishTime: Date.now(),
          })),
        ];

        // Substitution context for editorParams placeholders.
        const tplCtx = {
          bandName: concert.artist || '',
          concertDnV,
          customImageUrl: customImageUrl || '',
        };
        selectedPhotos.forEach((p, i) => { tplCtx['photo' + (i + 1)] = p.src; });
        const substitutedEditorParams = spec.editorParams
          ? substituteTemplate(spec.editorParams, tplCtx)
          : null;

        // Routing: admin-defined creationMethod wins; otherwise default by spec
        // (numeric productId → api so photos auto-place, else editor-direct).
        const method = spec.creationMethod
          || (spec.productId && !spec.attributeValues ? 'api' : 'editor');

        // ── api flow: backend POSTs /api/ec/v4/projects/ with familyId +
        // productId? + attributes?, returns uuid → editor opens it.
        if (method === 'api') {
          setStage('creating');
          const cpRes = await fetch('/api/create-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              familyId: spec.familyId,
              productId: spec.productId || undefined,
              attributes: spec.attributeValues || undefined,
              photos: apiPhotoSources,
              name: 'Gallery Link ' + product.name,
            }),
          });
          const cpData = await cpRes.json().catch(() => ({}));
          if (!cpRes.ok) {
            const detail = typeof cpData.details === 'object' ? ' · ' + JSON.stringify(cpData.details) : '';
            throw new Error('create-project failed: ' + (cpData.error || cpRes.status) + detail);
          }

          if (cancelled) return;

          setStage('redirecting');
          try { localStorage.removeItem('encore'); } catch (_) {}
          const urlParams = new URLSearchParams({
            projectId: cpData.uuid,
            familyId: String(cpData.familyId),
            siteName: cpData.siteName,
          });
          if (substitutedEditorParams) {
            urlParams.set('editorParams', JSON.stringify(substitutedEditorParams));
          }
          window.location.href = '/editor/playground?' + urlParams.toString() + normalizeSuffix(spec.editorUrlSuffix);
          return;
        }

        // ── editor flow: hand productId/attributeValues straight to
        // setEditorConfig with photos in the sidebar (no backend round-trip).
        setStage('redirecting');
        try { localStorage.removeItem('encore'); } catch (_) {}
        const urlParams = new URLSearchParams({
          familyId: String(spec.familyId),
          siteName: 'sales_demo',
          photos: JSON.stringify(editorPhotos),
        });
        if (spec.attributeValues) urlParams.set('attributeValues', JSON.stringify(spec.attributeValues));
        if (spec.slug) urlParams.set('productId', spec.slug);
        else if (spec.productId) urlParams.set('productId', String(spec.productId));
        if (substitutedEditorParams) {
          urlParams.set('editorParams', JSON.stringify(substitutedEditorParams));
        }
        window.location.href = '/editor/playground?' + urlParams.toString() + normalizeSuffix(spec.editorUrlSuffix);
      } catch (e) {
        if (cancelled) return;
        console.error('[done] handoff failed', e);
        setErrorMsg(e.message || String(e));
        setStage('error');
      }
    })();

    return () => { cancelled = true; };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const statusLabel = stage === 'uploading' ? '⤓ UPLOADING YOUR PHOTO…'
    : stage === 'creating' ? '⏳ CREATING PROJECT…'
    : stage === 'redirecting' ? '✓ OPENING EDITOR…'
    : '✕ HANDOFF FAILED';

  return (
    <div className="screen dt-wide anim-in" style={{ alignItems: 'center', justifyContent: 'center', background: 'var(--radial)' }}>
      <div style={{ textAlign: 'center', padding: 34, maxWidth: 420 }}>
        <div className="anim-pop glass" style={{ width: 76, height: 76, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 26px' }}>
          <Ic.spark s={30} c="var(--ink)" />
        </div>
        <div className="kicker anim-up" style={{ marginBottom: 14 }}>Handing off</div>
        <div className="display anim-up" style={{ fontSize: 30, lineHeight: 1.12, animationDelay: '.1s' }}>Your {product.name.toLowerCase()}<br/>is taking shape</div>
        <p className="muted anim-up" style={{ fontSize: 13.5, lineHeight: 1.5, margin: '22px auto 0', maxWidth: 280, animationDelay: '.2s' }}>
          {count} shots from {concert.artist} are loading into the editor, where you'll lay out every page.
        </p>
        <div className="mono anim-up" style={{ fontSize: 10.5, color: stage === 'error' ? 'var(--warn)' : 'var(--ink-3)', letterSpacing: '0.14em', margin: '26px 0', animationDelay: '.3s' }}>
          {statusLabel}
        </div>
        {stage === 'error' && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, textAlign: 'left', wordBreak: 'break-word' }}>
            {errorMsg}
          </div>
        )}
        <button className="btn btn-outline anim-up" onClick={onRestart} style={{ width: 'auto', padding: '0 28px', height: 48, animationDelay: '.4s' }}>Restart demo</button>
      </div>
    </div>
  );
}

Object.assign(window, { UploadScreen, DoneScreen });
