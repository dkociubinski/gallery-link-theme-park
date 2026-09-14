// src/memories.jsx — MemoriesScreen (step header + product carousel + meter + balanced mosaic) + Lightbox

const { useState: useStateM, useEffect: useEffectM, useRef: useRefM } = React;

function ProductCard({ p, idx, active, compact, onTap }) {
  // long-press → a transient "peek" bubble under the finger (no sheet to dismiss);
  // it vanishes on release. Cancelled on scroll/drag so it never fights the rail
  // swipe; the follow-up click is swallowed after a long-press.
  const pressT = useRefM(null);
  const longRef = useRefM(false);
  const startRef = useRefM({ x: 0, y: 0 });
  const cardRef = useRefM(null);
  const [tip, setTip] = useStateM(null);
  const onTouchStart = (e) => {
    longRef.current = false;
    const t = e.touches[0]; startRef.current = { x: t.clientX, y: t.clientY };
    clearTimeout(pressT.current);
    pressT.current = setTimeout(() => {
      longRef.current = true;
      if (navigator.vibrate) try { navigator.vibrate(8); } catch (_) {}
      const el = cardRef.current; if (el) { const r = el.getBoundingClientRect(); setTip({ cx: r.left + r.width / 2, bottom: r.bottom }); }
    }, 380);
  };
  const cancel = () => { clearTimeout(pressT.current); setTip(null); };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - startRef.current.x) > 9 || Math.abs(t.clientY - startRef.current.y) > 9) cancel();
  };
  const handleClick = () => { if (longRef.current) { longRef.current = false; return; } onTap(); };
  const press = { ref: cardRef, onClick: handleClick, onTouchStart, onTouchMove, onTouchEnd: cancel, onTouchCancel: cancel };

  // floating tooltip bubble, fixed to the viewport so the rail's overflow can't clip it
  let bubble = null;
  if (tip) {
    const BW = 246;
    const left = Math.max(8, Math.min(tip.cx - BW / 2, window.innerWidth - BW - 8));
    const tail = Math.max(18, Math.min(tip.cx - left, BW - 18));
    bubble = (
      <div className="anim-pop" style={{ position: 'fixed', left, top: tip.bottom + 13, width: BW, zIndex: 150, pointerEvents: 'none', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: '0 20px 55px rgba(0,0,0,0.42)', padding: '13px 15px 15px' }}>
        <div className="row between" style={{ alignItems: 'baseline', gap: 8 }}>
          <div className="display" style={{ fontSize: 19, lineHeight: 1 }}>{p.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', flexShrink: 0 }}><Price value={p.price} /></div>
        </div>
        <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 7 }}>{p.sub.toUpperCase()}</div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)', marginTop: 9 }}>{p.desc}</div>
        <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 11 }}>PICK {p.min}–{p.max} SHOTS</div>
        <div style={{ position: 'absolute', top: -6, left: tail, transform: 'translateX(-50%) rotate(45deg)', width: 12, height: 12, background: 'var(--bg)', borderLeft: '1px solid var(--line)', borderTop: '1px solid var(--line)' }} />
      </div>
    );
  }

  if (compact) {
    return (
      <>
        <div {...press} data-idx={idx} style={{ scrollSnapAlign: 'center', flex: '0 0 auto', cursor: 'pointer' }}>
          <div style={{
            borderRadius: 14, padding: '10px 16px',
            background: active ? 'var(--ink)' : 'var(--bg-1)',
            border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
            color: active ? 'var(--acc-ink)' : 'var(--ink)', transition: 'all .22s ease',
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <div className="display" style={{ fontSize: 19, lineHeight: 1 }}>{p.name}</div>
            <div className="mono" style={{ fontSize: 11, marginLeft: 'auto', opacity: 0.7 }}>{p.min}–{p.max}</div>
          </div>
        </div>
        {bubble}
      </>
    );
  }
  return (
    <>
      <div {...press} data-idx={idx} style={{ scrollSnapAlign: 'center', flex: '0 0 auto', width: 230, cursor: 'pointer' }}>
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          background: active ? 'var(--ink)' : 'var(--bg-1)',
          border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
          color: active ? 'var(--acc-ink)' : 'var(--ink)', transition: 'all .22s ease',
        }}>
          {/* product image fills the empty space */}
          <div style={{ position: 'relative', height: 104, background: `#0c0c0e url("${p.img}") center/cover no-repeat` }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.5))' }} />
            <div className="mono" style={{ position: 'absolute', top: 9, right: 10, fontSize: 9.5, color: '#fff', letterSpacing: '0.04em', opacity: 0.92 }}><Price value={p.price} /></div>
          </div>
          <div style={{ padding: '12px 15px 14px' }}>
            <div className="display" style={{ fontSize: 23, lineHeight: 1 }}>{p.name}</div>
            <div className="mono" style={{ fontSize: 10.5, marginTop: 8, opacity: active ? 0.65 : 0.55, letterSpacing: '0.06em' }}>{p.sub.toUpperCase()}</div>
            <div style={{ fontSize: 12.5, marginTop: 9, opacity: active ? 0.85 : 0.7, fontWeight: 500 }}>Pick {p.min}–{p.max} shots</div>
          </div>
        </div>
      </div>
      {bubble}
    </>
  );
}

// shared "Select recommended / Clear" pill — top of the photo list, both layouts
function RecommendBtn({ reco, onRecommend, min, style }) {
  return (
    <button onClick={onRecommend} className="btn" style={{
      width: 'auto', height: 38, padding: '0 15px', fontSize: 13, gap: 8,
      background: reco ? 'var(--bg-2)' : 'var(--bg-1)', color: 'var(--ink)',
      border: `1px solid ${reco ? 'var(--line-2)' : 'var(--line)'}`, ...style,
    }}>
      {reco
        ? <><Ic.close s={15} c="var(--ink)" /> Clear selection</>
        : <><Ic.spark s={14} c="var(--ink)" /> Select recommended</>}
    </button>
  );
}

// one mosaic tile — memoized so a selection toggle only re-renders the one tile
const Tile = React.memo(function Tile({ ph, idx, sel, onOpen, onToggle, big }) {
  const [shaking, setShaking] = useStateM(false);
  const [hint, setHint] = useStateM(false);
  const hintT = useRefM(null);
  const handleTap = () => {
    if (onToggle(ph.id) === false) {
      setShaking(true); setHint(true);
      clearTimeout(hintT.current); hintT.current = setTimeout(() => setHint(false), 1900);
    }
  };
  return (
    <div className={`tile ${ph.hero ? 'hero' : ''} ${shaking ? 'shake' : ''}`} data-sel={sel} onClick={handleTap}
      onAnimationEnd={(e) => { if (e.animationName === 'shakeX') setShaking(false); }}>
      <div className="tile-grad" style={{ background: ph.grad }} />
      <div className="tile-sel-ring" style={{ zIndex: 5 }} />
      <img src={ph.src} alt="" loading="lazy" style={{ aspectRatio: `1 / ${ph.ar}`, position: 'relative', zIndex: 1, filter: sel ? 'none' : 'saturate(0.92)' }}
        onError={(e) => { e.target.style.opacity = 0; }} />
      <div className="tile-shade" style={{ zIndex: 2 }} />
      <div className="check" data-on={sel} style={{ position: 'absolute', top: 9, right: 9, zIndex: 4 }}>
        {sel && <Ic.check s={14} c="var(--sel-ink)" />}
      </div>
      <div className="glass icon-btn" onClick={(e) => { e.stopPropagation(); onOpen(idx); }}
        style={{ position: 'absolute', bottom: big ? 11 : 9, right: big ? 11 : 9, width: big ? 48 : 32, height: big ? 48 : 32, zIndex: 4 }}>
        <Ic.expand s={big ? 19 : 14} c="var(--ink)" />
      </div>
      <div className="mono" style={{ position: 'absolute', bottom: 11, left: 11, zIndex: 4, fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>#{ph.frame}</div>
      {hint && (
        <div className="mono anim-pop" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 8, padding: '9px 13px', borderRadius: 999, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.35, color: 'var(--warn)', background: 'var(--bg)', border: '1px solid var(--line)', boxShadow: '0 6px 20px rgba(0,0,0,0.3)', maxWidth: '86%', pointerEvents: 'none' }}>
          Remove one first
        </div>
      )}
    </div>
  );
});

// balance photos into two columns (by aspect-ratio height); heroes break full-width.
// Greedy shortest-column packing removes the empty tails CSS columns leave behind.
function buildMosaic(photos, ncols = 2, flat = false) {
  const blocks = []; let buf = [];
  const flush = () => {
    if (!buf.length) return;
    const cols = Array.from({ length: ncols }, () => []); const h = new Array(ncols).fill(0);
    buf.forEach((it) => { let c = 0; for (let k = 1; k < ncols; k++) if (h[k] < h[c]) c = k; cols[c].push(it); h[c] += it.ph.ar; });
    blocks.push({ type: 'cols', cols }); buf = [];
  };
  photos.forEach((ph, i) => {
    // flat mode (desktop): never break a hero full-width — keep a true multi-column grid
    if (!flat && ph.hero) { flush(); blocks.push({ type: 'hero', ph, i }); }
    else buf.push({ ph, i });
  });
  flush();
  return blocks;
}

// desktop product row (vertical list in the left panel)
function DesktopProductRow({ p, active, onTap, onInfo }) {
  return (
    <div onClick={onTap} className="dt-hover" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px', borderRadius: 13, cursor: 'pointer',
      background: active ? 'var(--ink)' : 'var(--bg-1)', border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
      color: active ? 'var(--acc-ink)' : 'var(--ink)', transition: 'all .18s ease',
    }}>
      <div style={{ width: 92, height: 92, borderRadius: 14, flexShrink: 0, background: `#0c0c0e url("${p.img}") center/cover no-repeat` }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="row" style={{ gap: 6, alignItems: 'center' }}>
          <div className="display" style={{ fontSize: 17, lineHeight: 1 }}>{p.name}</div>
          <div onClick={(e) => { e.stopPropagation(); onInfo(e.currentTarget.closest('.dt-hover').getBoundingClientRect()); }} aria-label="Product details" style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: 0.5 }}>
            <Ic.info s={16} c="currentColor" />
          </div>
        </div>
        <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.06em', opacity: 0.6, marginTop: 4 }}>{p.sub.toUpperCase()}</div>
      </div>
      <div className="col" style={{ alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 10, opacity: 0.85 }}><Price value={p.price.replace('from ', '')} /></div>
        <div className="mono" style={{ fontSize: 9, opacity: 0.55 }}>{p.min}–{p.max}</div>
      </div>
    </div>
  );
}

// shared selection meter — used both on the gallery and in the lightbox.
// `bump` increments each time an over-max add is blocked → flash red + nudge.
function Meter({ n, product, bump = 0 }) {
  const [flash, setFlash] = useStateM(false);
  useEffectM(() => {
    if (!bump) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 700);
    return () => clearTimeout(t);
  }, [bump]);
  const p = product;
  const ok = n >= p.min && n <= p.max;
  const over = n > p.max;
  const atMax = n >= p.max;
  const fill = Math.min(n / p.max, 1) * 100;
  const status = n < p.min ? `${p.min - n} more to min` : over ? `Remove ${n - p.max}` : atMax ? 'Max reached' : 'Ready to print';
  const warn = flash || over;
  const statusColor = warn ? 'var(--warn)' : ok ? 'var(--ink)' : 'var(--ink-3)';
  return (
    <>
      <div key={bump} className={'row between' + (bump ? ' meter-bump' : '')} style={{ marginBottom: 8, alignItems: 'baseline' }}>
        <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
          <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{String(n).padStart(2, '0')}</span>
          <span className="mono faint" style={{ fontSize: 12 }}>selected</span>
        </div>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', color: statusColor, textTransform: 'uppercase', transition: 'color .15s ease' }}>{status}</span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${fill}%`, background: warn ? 'var(--warn)' : 'var(--acc)', transition: 'width .35s cubic-bezier(.4,0,.2,1), background .2s ease' }} />
        <div style={{ position: 'relative', top: -5, left: `${(p.min / p.max) * 100}%`, width: 1.5, height: 5, background: 'var(--ink-3)' }} />
      </div>
      <div className="mono faint" style={{ fontSize: 10.5, letterSpacing: '0.1em', marginTop: 7 }}>PICK {p.min}–{p.max} SHOTS</div>
    </>
  );
}

function MemoriesScreen({ desktop, wide, concert, product, productIdx, setProductIdx, selected, toggleSelect, maxBump, reco, onRecommend, onContinue, onBack, onOpen }) {
  const [compact, setCompact] = useStateM(false);
  const [continueNudge, setContinueNudge] = useStateM(0);
  const [infoProduct, setInfoProduct] = useStateM(null);
  const [infoAnchor, setInfoAnchor] = useStateM(null);
  const railRef = useRefM(null);
  const p = product;
  const n = selected.size;
  const ok = n >= p.min && n <= p.max;
  const over = n > p.max;
  const atMax = n >= p.max;
  const fill = Math.min(n / p.max, 1) * 100;
  const status = n < p.min ? `${p.min - n} more to min` : over ? `Remove ${n - p.max}` : atMax ? 'Max reached' : 'Ready to print';

  // product is chosen only by an intentional tap — scrolling the rail just browses
  const tapProduct = (i) => {
    const el = railRef.current; if (!el) return;
    const c = el.querySelector(`[data-idx="${i}"]`);
    if (!c) return;
    el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
    setProductIdx(i);
  };

  const blocks = buildMosaic(concert.photos);

  const renderBlocks = (bl) => bl.map((b, bi) => b.type === 'hero'
    ? <Tile key={'h' + b.i} ph={b.ph} idx={b.i} sel={selected.has(b.ph.id)} onOpen={onOpen} onToggle={toggleSelect} big />
    : (
      <div key={'c' + bi} className="mosaic-cols">
        {b.cols.map((col, ci) => (
          <div key={ci} className="mosaic-col">
            {col.map((it) => <Tile key={it.ph.id} ph={it.ph} idx={it.i} sel={selected.has(it.ph.id)} onOpen={onOpen} onToggle={toggleSelect} big />)}
          </div>
        ))}
      </div>
    ));

  // ───────── DESKTOP: two-pane (left panel + scrollable gallery) ─────────
  if (desktop) {
    const dblocks = buildMosaic(concert.photos, wide ? 4 : 3, true);
    return (
      <div className="screen dt-wide" style={{ overflow: 'hidden', background: 'var(--bg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 432px', width: '100%', height: '100%' }}>
          <aside className="no-sb" style={{ gridColumn: 2, height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--line)', padding: 'calc(var(--top) + 10px) 28px calc(var(--bottom) + 22px)', overflowY: 'auto' }}>
            <div className="row" style={{ gap: 12, marginBottom: 24 }}>
              <div className="glass icon-btn" style={{ width: 42, height: 42, flexShrink: 0 }} onClick={onBack}><Ic.chevL s={19} c="var(--ink)" /></div>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>STEP 1 / 3 · PICK SHOTS</div>
            </div>
            <div className="display" style={{ fontSize: 34, lineHeight: 0.96, letterSpacing: '0.01em' }}>{concert.artist}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: '0.1em', marginTop: 9 }}>{concert.date}</div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.08em', marginTop: 3 }}>{concert.venue.toUpperCase()}</div>
            <div style={{ height: 1, background: 'var(--line)', margin: '22px 0' }} />
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--ink-3)', marginBottom: 12 }}>CHOOSE A PRODUCT</div>
            <div className="col" style={{ gap: 8 }}>
              {PRODUCTS.map((pr, i) => <DesktopProductRow key={pr.id} p={pr} active={i === productIdx} onTap={() => setProductIdx(i)} onInfo={(rect) => { setInfoProduct(pr); setInfoAnchor(rect); }} />)}
            </div>
            <div style={{ flex: 1, minHeight: 20 }} />
            <div style={{ marginTop: 20 }}><Meter n={n} product={p} bump={maxBump + continueNudge} /></div>
            <button className="btn btn-primary" onClick={() => (ok ? onContinue() : setContinueNudge((b) => b + 1))}
              style={{ marginTop: 16, height: 52, background: ok ? 'var(--ink)' : 'var(--bg-3)', color: ok ? 'var(--acc-ink)' : 'var(--ink-3)' }}>
              Continue <Ic.chevR s={17} c={ok ? 'var(--acc-ink)' : 'var(--ink-3)'} />
            </button>
          </aside>
          <main className="scroll" style={{ gridColumn: 1, gridRow: 1, padding: 'calc(var(--top) + 10px) 28px 44px' }}>
            <div className="row" style={{ marginBottom: 16, alignItems: 'center' }}>
              <RecommendBtn reco={reco} onRecommend={onRecommend} min={p.min} />
            </div>
            <div className="mosaic" style={{ padding: 0 }}>{renderBlocks(dblocks)}</div>
          </main>
        </div>
        {infoProduct && (
          <>
            <div onClick={() => setInfoProduct(null)} style={{ position: 'fixed', inset: 0, zIndex: 139 }} />
            <div className="anim-pop" style={{
              position: 'fixed', zIndex: 140, width: 300,
              right: window.innerWidth - (infoAnchor ? infoAnchor.left : 0) + 14,
              top: Math.max(16, Math.min(infoAnchor ? infoAnchor.top : 90, window.innerHeight - 360)),
              background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{ aspectRatio: '16 / 9', background: `#0c0c0e url("${infoProduct.img}") center/cover no-repeat` }} />
                <div className="glass icon-btn" onClick={() => setInfoProduct(null)} style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32 }}><Ic.close s={15} c="var(--ink)" /></div>
              </div>
              <div style={{ padding: '16px 18px 18px' }}>
                <div className="row between" style={{ alignItems: 'baseline', gap: 10 }}>
                  <div className="display" style={{ fontSize: 21, lineHeight: 1 }}>{infoProduct.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', flexShrink: 0 }}><Price value={infoProduct.price} /></div>
                </div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8 }}>{infoProduct.sub.toUpperCase()}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)', marginTop: 11 }}>{infoProduct.desc}</div>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 13 }}>PICK {infoProduct.min}–{infoProduct.max} SHOTS</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    // NB: no root fade-in here. The loading screen unmounts instantly, so fading
    // this one up from opacity 0 left a one-frame flash of the bare app bg → a
    // visible "blik". An opaque, instant swap reads as a clean cut instead.
    <div className="screen" style={{ background: 'var(--bg)' }}>
      {/* ───── sticky header ───── */}
      <div style={{ paddingTop: 'var(--top)', background: 'linear-gradient(180deg, var(--bg) 70%, rgba(20,20,22,0))', position: 'relative', zIndex: 10 }}>
        {/* step + concert — collapses on scroll */}
        <div style={{ overflow: 'hidden', maxHeight: compact ? 0 : 120, opacity: compact ? 0 : 1, transition: 'max-height .25s ease, opacity .2s ease' }}>
          <div className="row" style={{ padding: '2px 18px 2px', gap: 12 }}>
            <div className="glass icon-btn" style={{ width: 40, height: 40, flexShrink: 0 }} onClick={onBack}><Ic.chevL s={19} c="var(--ink)" /></div>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>STEP 1 / 3 · PICK SHOTS</div>
          </div>
          {/* concert — its own, more prominent line above the products */}
          <div className="row between" style={{ padding: '8px 18px 12px', alignItems: 'flex-end', gap: 12 }}>
            <div className="display" style={{ fontSize: 21, letterSpacing: '0.02em', lineHeight: 1 }}>{concert.artist}</div>
            <div className="col" style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-2)', letterSpacing: '0.1em' }}>{concert.date}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{concert.venue.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* product rail */}
        <div ref={railRef} style={{
          display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x proximity',
          padding: compact ? '4px 18px 10px' : '2px 18px 14px',
          transition: 'padding .2s ease',
        }} className="no-sb">
          {PRODUCTS.map((pr, i) => (
            <ProductCard key={pr.id} p={pr} idx={i} active={i === productIdx} compact={compact} onTap={() => tapProduct(i)} />
          ))}
        </div>

        {/* meter */}
        <div style={{ padding: '0 20px 13px' }}>
          <Meter n={n} product={p} bump={maxBump + continueNudge} />
        </div>
        <div style={{ height: 1, background: 'var(--line)' }} />
      </div>

      {/* ───── mosaic ───── */}
      <div className="scroll" onScroll={(e) => setCompact(e.target.scrollTop > 44)}>
        <div className="row" style={{ padding: '12px 18px 0', alignItems: 'center' }}>
          <RecommendBtn reco={reco} onRecommend={onRecommend} min={p.min} />
        </div>
        <div className="mosaic">
          {blocks.map((b, bi) => b.type === 'hero'
            ? <Tile key={'h' + b.i} ph={b.ph} idx={b.i} sel={selected.has(b.ph.id)} onOpen={onOpen} onToggle={toggleSelect} />
            : (
              <div key={'c' + bi} className="mosaic-cols">
                {b.cols.map((col, ci) => (
                  <div key={ci} className="mosaic-col">
                    {col.map((it) => (
                      <Tile key={it.ph.id} ph={it.ph} idx={it.i} sel={selected.has(it.ph.id)} onOpen={onOpen} onToggle={toggleSelect} />
                    ))}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ───── floating continue ───── */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(var(--bottom) + 10px)', zIndex: 30, pointerEvents: 'none' }}>
        <div className="glass" style={{
          padding: 7, borderRadius: 999, display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'auto', background: 'var(--float-bg)',
          opacity: n > 0 ? 1 : 0, transform: n > 0 ? 'none' : 'translateY(12px)',
          transition: 'all .3s cubic-bezier(.2,.8,.2,1)',
        }}>
          <div className="row" style={{ gap: 11, paddingLeft: 12 }}>
            <span className="mono" style={{ fontSize: 19, fontWeight: 700 }}>{n}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.2, maxWidth: 96 }}>shots selected</span>
          </div>
          <button className="btn btn-primary" onClick={() => (ok ? onContinue() : setContinueNudge((b) => b + 1))}
            style={{ width: 'auto', height: 46, flex: 1, padding: '0 20px',
              background: ok ? 'var(--ink)' : 'var(--bg-3)', color: ok ? 'var(--acc-ink)' : 'var(--ink-3)' }}>
            Continue <Ic.chevR s={17} c={ok ? 'var(--acc-ink)' : 'var(--ink-3)'} />
          </button>
        </div>
      </div>

    </div>
  );
}

// memoized roll thumbnail — a selection/index change only re-renders the affected one
const RollThumb = React.memo(function RollThumb({ pp, idx, current, sel, onPick }) {
  return (
    <div onClick={() => onPick(idx)} className="roll-thumb" style={{
      flex: '0 0 auto', width: 44, height: 56, borderRadius: 8, overflow: 'hidden', position: 'relative', cursor: 'pointer',
      border: current ? '2px solid var(--acc)' : '1px solid var(--line)',
      opacity: current ? 1 : 0.55, transition: 'opacity .15s ease',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: pp.grad }} />
      <img src={pp.src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative' }} onError={(e) => { e.target.style.opacity = 0; }} />
      {sel && <div style={{ position: 'absolute', top: 3, right: 3, width: 14, height: 14, borderRadius: 999, background: 'var(--sel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.check s={9} c="var(--sel-ink)" /></div>}
    </div>
  );
});

// ───────── lightbox ─────────
function Lightbox({ desktop, photos, index, setIndex, product, selected, toggleSelect, maxBump, onClose }) {
  const ph = photos[index];
  const sel = selected.has(ph.id);
  const n = selected.size;
  const atMax = n >= product.max;
  const rollRef = useRefM(null);
  const drag = useRefM({ x: 0, y: 0, active: false });
  const imgRef = useRefM(null);
  const go = (d) => setIndex((i) => (i + d + photos.length) % photos.length);

  useEffectM(() => {
    const k = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);

  // keep the current thumbnail centered in the roll
  useEffectM(() => {
    const el = rollRef.current; if (!el) return;
    const c = el.children[index];
    if (c) el.scrollTo({ left: c.offsetLeft - el.clientWidth / 2 + c.offsetWidth / 2, behavior: 'smooth' });
  }, [index]);

  // ───────── DESKTOP: centered popup/modal (doesn't use the whole screen) ─────────
  if (desktop) {
    return (
      <div className="anim-in" style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }} onClick={onClose}>
        <div className="anim-pop" onClick={(e) => e.stopPropagation()} style={{ width: 'min(1120px, 94vw)', height: 'min(900px, 92vh)', background: 'var(--bg)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 120px rgba(0,0,0,0.6)', userSelect: 'none' }}>
          <div className="row" style={{ padding: '16px 18px', gap: 18, alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
            <div style={{ flex: 1, minWidth: 0 }}><Meter n={n} product={product} bump={maxBump} /></div>
            <div className="glass icon-btn" onClick={onClose} style={{ width: 42, height: 42, flexShrink: 0 }}><Ic.close s={18} c="var(--ink)" /></div>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-1)' }}>
            <div style={{ position: 'absolute', inset: 0, background: ph.grad, opacity: 0.22 }} />
            <img key={ph.id} src={ph.src} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, position: 'relative', zIndex: 1, objectFit: 'contain', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onError={(e) => { e.target.style.opacity = 0; }} />
            <div onClick={() => go(-1)} className="glass icon-btn" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, zIndex: 3 }}><Ic.chevL s={20} c="var(--ink)" /></div>
            <div onClick={() => go(1)} className="glass icon-btn" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, zIndex: 3 }}><Ic.chevR s={20} c="var(--ink)" /></div>
          </div>
          <div style={{ padding: '14px 16px 18px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
            <div ref={rollRef} className="no-sb" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 2px 14px' }}>
              {photos.map((pp, i) => <RollThumb key={pp.id} pp={pp} idx={i} current={i === index} sel={selected.has(pp.id)} onPick={setIndex} />)}
            </div>
            <button className="btn" onClick={() => toggleSelect(ph.id)} disabled={!sel && atMax} style={{
              width: 400, maxWidth: '100%', height: 54,
              background: sel ? 'var(--bg-2)' : atMax ? 'var(--bg-3)' : 'var(--ink)',
              color: sel ? 'var(--ink)' : atMax ? 'var(--ink-3)' : 'var(--acc-ink)',
              border: sel ? '1px solid var(--line-2)' : 'none',
            }}>
              {sel ? <><Ic.check s={15} c="var(--ink)" /> Selected — tap to remove</> : atMax ? 'Max reached' : <><Ic.plus s={18} c="var(--acc-ink)" /> Add to shots</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'screen anim-in' + (desktop ? ' dt-wide' : '')} style={{ background: 'var(--lb-bg)', zIndex: 120 }}>
      {/* top bar: close + full-width gallery meter */}
      <div className="row" style={{ paddingTop: 'var(--top)', paddingBottom: 14, paddingLeft: 14, paddingRight: 18, gap: 18, position: 'relative', zIndex: 4, alignItems: 'center', ...(desktop ? { width: '100%', maxWidth: 1100, margin: '0 auto' } : {}) }}>
        <div className="glass icon-btn" onClick={onClose} style={{ width: 42, height: 42, flexShrink: 0 }}><Ic.close s={18} c="var(--ink)" /></div>
        <div style={{ flex: 1, minWidth: 0 }}><Meter n={n} product={product} bump={maxBump} /></div>
      </div>

      {/* image — swipe left/right to navigate */}
      <div className="grow" style={{ position: 'relative', minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 14px', touchAction: 'none' }}
        onTouchStart={(e) => { const t = e.touches[0]; drag.current = { x: t.clientX, y: t.clientY, active: true }; if (imgRef.current) imgRef.current.style.transition = 'none'; }}
        onTouchMove={(e) => {
          if (!drag.current.active) return;
          const dx = e.touches[0].clientX - drag.current.x;
          const dy = e.touches[0].clientY - drag.current.y;
          if (Math.abs(dx) > Math.abs(dy) && imgRef.current) imgRef.current.style.transform = `translateX(${dx * 0.55}px)`;
        }}
        onTouchEnd={(e) => {
          if (!drag.current.active) return;
          drag.current.active = false;
          const dx = e.changedTouches[0].clientX - drag.current.x;
          if (imgRef.current) { imgRef.current.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)'; imgRef.current.style.transform = 'translateX(0)'; }
          if (dx > 32) go(-1); else if (dx < -32) go(1);
        }}>
        <div style={{ position: 'absolute', inset: 0, background: ph.grad, opacity: 0.5 }} />
        <img ref={imgRef} key={ph.id} src={ph.src} alt="" className="anim-pop" style={{ maxWidth: desktop ? 1100 : '100%', maxHeight: '100%', borderRadius: 12, position: 'relative', zIndex: 1, objectFit: 'contain', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}
          onError={(e) => { e.target.style.opacity = 0; }} />
      </div>

      {/* footer: thumbnail roll + add — symmetric top/bottom padding around the roll */}
      <div style={{ padding: 'calc((var(--bottom) + 14px) / 2) 12px calc(var(--bottom) + 14px)', ...(desktop ? { width: '100%', maxWidth: 1100, margin: '0 auto', textAlign: 'center' } : {}) }}>
        <div ref={rollRef} className="no-sb" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 2px 12px' }}>
          {photos.map((pp, i) => (
            <RollThumb key={pp.id} pp={pp} idx={i} current={i === index} sel={selected.has(pp.id)} onPick={setIndex} />
          ))}
        </div>

        <button className="btn" onClick={() => toggleSelect(ph.id)} disabled={!sel && atMax} style={{
          width: desktop ? 400 : '100%', maxWidth: '100%', height: 56,
          background: sel ? 'var(--bg-2)' : atMax ? 'var(--bg-3)' : 'var(--ink)',
          color: sel ? 'var(--ink)' : atMax ? 'var(--ink-3)' : 'var(--acc-ink)',
          border: sel ? '1px solid var(--line-2)' : 'none',
        }}>
          {sel ? <><Ic.check s={15} c="var(--ink)" /> Selected — tap to remove</>
            : atMax ? 'Max reached'
            : <><Ic.plus s={18} c="var(--acc-ink)" /> Add to shots</>}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { MemoriesScreen, Lightbox });
