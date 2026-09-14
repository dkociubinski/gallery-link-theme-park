// src/app.jsx — orchestrator: state machine, device frame, scaler, tweaks

const { useState: useS, useEffect: useE, useRef: useR, useCallback: useCb } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "displayFont": "Anton",
  "accent": "Mono",
  "framing": "Mosaic",
  "corners": "Soft",
  "grain": true
}/*EDITMODE-END*/;

const ACCENTS = {
  Mono:  { '--acc': 'oklch(0.975 0.004 95)', '--acc-ink': '#0b0b0c' },
  Ember: { '--acc': 'oklch(0.74 0.135 58)', '--acc-ink': '#0b0b0c' },
  Blood: { '--acc': 'oklch(0.57 0.17 25)', '--acc-ink': 'oklch(0.98 0.02 25)' },
};

// persistence
const load = () => { try { return JSON.parse(localStorage.getItem('encore') || '{}'); } catch { return {}; } };
const saved = load();

// responsive: true on classic desktop widths. Mobile keeps its exact layout;
// desktop branches render a wider two-pane / two-column layout.
function useMedia(q) {
  const [m, setM] = useS(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false));
  useE(() => {
    const mq = window.matchMedia(q);
    const h = (e) => setM(e.matches);
    mq.addEventListener('change', h); setM(mq.matches);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Pull admin-managed product list from /api/products before we render the
  // flow — without it the picker would briefly show the hardcoded defaults
  // and then jump when the fetch lands.
  const [productsReady, setProductsReady] = useS(false);
  useE(() => {
    let cancelled = false;
    loadProductsFromApi().finally(() => { if (!cancelled) setProductsReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Only restore "mid-flow" screens. `unlock` is an animation; `done` is a transient
  // handoff that redirects to /editor.html — restoring it would re-fire the API.
  const RESUMABLE = new Set(['scan', 'ticket', 'memories', 'upload']);
  const [screen, setScreen] = useS(RESUMABLE.has(saved.screen) ? saved.screen : 'scan');
  const [productIdx, setProductIdx] = useS(saved.productIdx || 0);
  const [selected, setSelected] = useS(new Set(saved.selected || []));
  const [lightbox, setLightbox] = useS(null);
  const [revealed, setRevealed] = useS(false);
  const desktop = useMedia('(min-width: 900px)');
  const wide = useMedia('(min-width: 1600px)');
  const [concert, setConcert] = useS(CONCERTS[0]);
  // "select recommended" is a toggle: applied → clearing it empties the set
  const [reco, setReco] = useS(false);
  // User's own uploads — lifted from UploadScreen so DoneScreen can upload
  // the first one to Vercel Blob and pass it as personalizedPresentationContent.
  // Entries: { id, url, file } — `file` is the raw File used for the Blob upload.
  const [own, setOwn] = useS([]);

  // theme: dark (default) | light. Persisted; applied to <html data-theme>.
  const [theme, setTheme] = useS(() => { try { return localStorage.getItem('encore_theme') || 'light'; } catch (_) { return 'light'; } });
  useE(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('encore_theme', theme); } catch (_) {}
  }, [theme]);
  const toggleTheme = () => setTheme((m) => (m === 'light' ? 'dark' : 'light'));

  // play entrance once per screen, then clear animations for a clean steady state
  useE(() => {
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 1100);
    return () => clearTimeout(t);
  }, [screen]);

  // persist
  useE(() => {
    localStorage.setItem('encore', JSON.stringify({ screen, productIdx, selected: [...selected] }));
  }, [screen, productIdx, selected]);

  // selection respects the active product's max (min is enforced at Continue).
  // returns false when an add is blocked → callers play "max reached" feedback.
  const [maxBump, setMaxBump] = useS(0);
  // refs mirror current state so the callbacks below can stay stable (stable
  // identity lets React.memo skip re-rendering the 48 tiles / roll thumbs that
  // didn't change — otherwise every selection toggle re-rendered all of them).
  const selRef = useR(selected); selRef.current = selected;
  const prodIdxRef = useR(productIdx); prodIdxRef.current = productIdx;
  const concertRef = useR(concert); concertRef.current = concert;
  const recoRef = useR(reco); recoRef.current = reco;
  const toggleSelect = useCb((id) => {
    const prod = PRODUCTS[prodIdxRef.current] || PRODUCTS[0];
    const sel = selRef.current;
    if (!sel.has(id) && sel.size >= prod.max) { setMaxBump((b) => b + 1); return false; }
    setReco(false); // a manual pick diverges from the recommended set
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    return true;
  }, []);
  // "Select recommended" → fill the active product's minimum (pref. the curated
  // "pick" shots, then in order); tapping again clears. Changing product re-arms it.
  const onRecommend = useCb(() => {
    if (recoRef.current) { setSelected(new Set()); setReco(false); return; }
    const prod = PRODUCTS[prodIdxRef.current] || PRODUCTS[0];
    const photos = concertRef.current.photos;
    const ids = [];
    for (const ph of photos) { if (ph.pick && ids.length < prod.min) ids.push(ph.id); }
    for (const ph of photos) { if (ids.length >= prod.min) break; if (!ids.includes(ph.id)) ids.push(ph.id); }
    setSelected(new Set(ids.slice(0, prod.min)));
    setReco(true);
  }, []);
  // re-arm the recommend toggle whenever the product changes (min count differs)
  useE(() => { setReco(false); }, [productIdx]);

  // ── navigation backed by browser history so the phone back button works ──
  const screenRef = useR(screen); screenRef.current = screen;
  const lightboxRef = useR(lightbox); lightboxRef.current = lightbox;
  const navTo = (to, push = true) => { setScreen(to); if (push) history.pushState({ screen: to }, ''); };
  const openLightbox = useCb((i) => { setLightbox(i); history.pushState({ screen: screenRef.current, lightbox: i }, ''); }, []);

  // In-app back buttons must NEVER leave the site. history.back() pops to
  // whatever the browser had before our pushStates — often the referrer
  // (e.g. encore-app.vibe.printboxteam.com), which is exactly what we want
  // to avoid. Walk our own state machine instead: lightbox close > screen
  // prev > no-op on scan/unlock. Browser's own back button is unaffected.
  const SCREEN_BACK = { ticket: 'scan', memories: 'scan', upload: 'memories', done: 'memories' };
  const goBack = () => {
    if (lightboxRef.current !== null) { setLightbox(null); return; }
    const target = SCREEN_BACK[screenRef.current];
    if (target) navTo(target);
  };
  useE(() => {
    const onPop = (e) => { const st = e.state || {}; setLightbox(st.lightbox ?? null); setScreen(st.screen || 'scan'); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const restart = () => { setSelected(new Set()); setProductIdx(0); setLightbox(null); setOwn([]); navTo('scan'); };
  // starting the flow from scan (camera / code) always restarts: clear picks, default to Photobook.
  const startFresh = () => { setSelected(new Set()); setProductIdx(0); setReco(false); setOwn([]); };
  // recognise the concert from the ticket number, then enter the flow (scan/empty → concert 1)
  const startWith = (code) => { setConcert(concertForCode(code)); startFresh(); navTo('unlock', false); };

  // theme vars from tweaks
  const themeVars = {
    '--font-display': `'${t.displayFont}', system-ui, sans-serif`,
    // NOTE: do NOT spread ACCENTS here — it would hardcode --acc/--acc-ink to the
    // dark palette and clobber light mode. Those vars live in CSS (:root + light).
    '--radius': t.corners === 'Sharp' ? '7px' : '20px',
    '--radius-sm': t.corners === 'Sharp' ? '5px' : '13px',
  };

  if (!productsReady) {
    return (
      <div className={`app ${desktop ? 'is-desktop' : ''} ${t.grain ? 'app-grain' : ''}`} style={{ ...themeVars, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>LOADING…</div>
      </div>
    );
  }

  return (
    <div className={`app ${desktop ? 'is-desktop' : ''} ${t.grain ? 'app-grain' : ''} ${t.framing === 'Uniform' ? 'uniform-grid' : ''} ${revealed ? 'anims-done' : ''}`} style={themeVars}>
      {screen === 'scan' && <ScanScreen desktop={desktop} onScan={() => startWith('')} onManual={() => navTo('ticket')} onTicket={(code) => startWith(code)} theme={theme} onToggleTheme={toggleTheme} />}
      {screen === 'ticket' && <TicketScreen desktop={desktop} onBack={goBack} onUnlock={(code) => startWith(code)} />}
      {screen === 'unlock' && <UnlockScreen concert={concert} onDone={() => navTo('memories')} />}
      {screen === 'memories' && (
        <MemoriesScreen
          desktop={desktop} wide={wide} concert={concert}
          product={PRODUCTS[productIdx] || PRODUCTS[0]}
          productIdx={productIdx} setProductIdx={setProductIdx}
          selected={selected} toggleSelect={toggleSelect} maxBump={maxBump}
          reco={reco} onRecommend={onRecommend}
          onContinue={() => navTo((PRODUCTS[productIdx] || PRODUCTS[0]).allowOwnPhotos ? 'upload' : 'done')}
          onBack={goBack}
          onOpen={openLightbox}
        />
      )}
      {screen === 'upload' && <UploadScreen desktop={desktop} product={PRODUCTS[productIdx] || PRODUCTS[0]} own={own} setOwn={setOwn} onBack={goBack} onFinish={() => navTo('done')} />}
      {screen === 'done' && <DoneScreen concert={concert} product={PRODUCTS[productIdx]} selected={selected} own={own} onRestart={restart} />}

      {lightbox !== null && (
        <Lightbox desktop={desktop} photos={concert.photos} index={lightbox} setIndex={setLightbox} product={PRODUCTS[productIdx] || PRODUCTS[0]} selected={selected} toggleSelect={toggleSelect} maxBump={maxBump} onClose={goBack} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
