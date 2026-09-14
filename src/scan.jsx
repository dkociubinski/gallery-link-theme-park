// src/scan.jsx — ScanScreen, TicketScreen, UnlockScreen

const { useState, useEffect, useRef } = React;

// faux QR target shown inside the viewfinder — memoized so the random pattern
// is generated once and doesn't re-shuffle on every keystroke / re-render
const QrGhost = React.memo(function QrGhost() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 2, width: 92, height: 92, opacity: 0.85 }}>
      {Array.from({ length: 81 }).map((_, i) => {
        const corner = (r, c) => (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
        const r = Math.floor(i / 9), c = i % 9;
        const on = corner(r, c) ? ((r === 0 || r === 2 || c === 0 || c === 2 || r === 8 || c === 8) ? true : (r === 1 && c === 1) || (r === 1 && c === 7) || (r === 7 && c === 1)) : (Math.random() > 0.52);
        return <div key={i} style={{ background: on ? 'var(--ink)' : 'transparent', borderRadius: 1 }} />;
      })}
    </div>
  );
});

const STEPS = [
  { n: '01', t: 'Scan your ticket', d: 'Unlock every shot from the night, instantly.' },
  { n: '02', t: 'Pick your shots', d: 'Pro shots captured live at the concert — pick your favourites.' },
  { n: '03', t: 'Add your own', d: 'Drop in your phone photos to open the story.' },
  { n: '04', t: 'Get your keepsake', d: 'A photobook, poster or calendar — made from your night.' },
];

const HERO_IMG = 'https://images.unsplash.com/photo-1497911270199-1c552ee64aa4?auto=format&fit=crop&w=1800&q=72';

function ScanScreen({ desktop, onScan, onManual, onTicket, theme, onToggleTheme }) {
  const [code, setCode] = useState('');
  const [infoProduct, setInfoProduct] = useState(null);

  // camera scanner (desktop QR stub → front webcam)
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stopCam = () => { const s = streamRef.current; if (s) { s.getTracks().forEach((t) => t.stop()); streamRef.current = null; } };
  useEffect(() => {
    if (!scanning) return;
    let active = true;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((stream) => {
          if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
        })
        .catch(() => {});
    }
    // mock detection: after a moment, "recognise" the ticket and continue
    const t = setTimeout(() => { if (active) { stopCam(); setScanning(false); onScan(); } }, 3600);
    return () => { active = false; clearTimeout(t); stopCam(); };
  }, [scanning]);

  // ───────── DESKTOP: centered washed hero + ticket card (6-digit + QR) + how-it-works + products ─────────
  if (desktop) {
    const lightHero = theme === 'light';
    const submit = (e) => { e.preventDefault(); onTicket(code); };
    const onType = (e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
    return (
      <div className="screen dt-wide anim-in" style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'block', background: 'var(--bg)' }}>
        {/* HERO */}
        <section style={{ position: 'relative', minHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, background: `#0a0a0c url("${HERO_IMG}") center/cover no-repeat` }} />
          <div style={{ position: 'absolute', inset: 0, background: lightHero
            ? 'linear-gradient(180deg, rgba(250,249,246,0.5) 0%, rgba(250,249,246,0.74) 62%, var(--bg) 100%)'
            : 'linear-gradient(180deg, rgba(8,8,10,0.55) 0%, rgba(8,8,10,0.82) 62%, var(--bg) 100%)' }} />

          <div className="row between" style={{ position: 'relative', zIndex: 2, padding: '28px 48px' }}>
            <div className="wordmark">ENCORE</div>
            <button onClick={onToggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
              {theme === 'light' ? '◐ Switch to dark' : '◐ Try light mode'}
            </button>
          </div>

          <div className="anim-up" style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px 24px 48px' }}>
            <div className="kicker" style={{ marginBottom: 18 }}>✦ Your night, in print</div>
            <h1 className="display" style={{ fontSize: 104, lineHeight: 0.88, margin: 0, color: 'var(--ink)' }}>Relive the night</h1>
            <p className="muted" style={{ fontSize: 16.5, lineHeight: 1.55, margin: '20px auto 0', maxWidth: 620 }}>
              Every shot the night's photographers captured — unlocked with your ticket. Pick your moments, add your own, and print a keepsake worth keeping.
            </p>

            {/* ticket card */}
            <form onSubmit={submit} style={{ position: 'relative', width: '100%', maxWidth: 620, marginTop: 34, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: '0 24px 70px rgba(0,0,0,0.28)', display: 'flex', overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ flex: 1, padding: '22px 26px' }}>
                <div className="row between" style={{ marginBottom: 18 }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-3)' }}>✦ ADMIT ONE</div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>NO. ······</div>
                </div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-3)', marginBottom: 11 }}>ENTER TICKET NUMBER</div>
                <div style={{ position: 'relative' }}>
                  <div className="row" style={{ gap: 8 }}>
                    {Array.from({ length: 6 }).map((_, i) => {
                      const active = i === code.length, filled = i < code.length;
                      return (
                        <div key={i} style={{ flex: 1, height: 54, borderRadius: 11, background: filled ? 'var(--bg-2)' : 'transparent', border: `1.5px solid ${active ? 'var(--ink)' : filled ? 'var(--line-2)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 23, fontWeight: 700, color: 'var(--ink)' }}>{code[i] || ''}</div>
                      );
                    })}
                  </div>
                  <input value={code} onChange={onType} inputMode="numeric" autoFocus aria-label="Ticket number"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'text', border: 'none', background: 'transparent' }} />
                </div>
                <div className="row between" style={{ marginTop: 15, alignItems: 'center', gap: 14 }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', maxWidth: 270, lineHeight: 1.4 }}>6-digit code printed under the barcode · just start typing</div>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto', height: 46, padding: '0 22px', flexShrink: 0 }}>Unlock <Ic.chevR s={16} c="var(--acc-ink)" /></button>
                </div>
              </div>
              {/* perforated QR stub — opens the laptop camera */}
              <div onClick={(e) => { e.preventDefault(); setScanning(true); }} style={{ width: 142, borderLeft: '2px dashed var(--line-2)', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', background: 'var(--bg-1)' }}>
                <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-2)' }}><QrGhost /></div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.16em', color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.5 }}>SCAN<br/>THE QR</div>
              </div>
            </form>
          </div>
        </section>

        {/* HOW IT WORKS (bordered boxes) */}
        <section style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 48px 0' }}>
          <div className="kicker" style={{ marginBottom: 18 }}>How it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ padding: '30px 26px', borderLeft: i ? '1px solid var(--line)' : 'none' }}>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{s.n}</div>
                <div className="display" style={{ fontSize: 26, lineHeight: 1.02, margin: '14px 0 0', color: 'var(--ink)' }}>{s.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 11 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCTS — two-column showcase with richer copy */}
        <section style={{ maxWidth: 1160, margin: '0 auto', padding: '52px 48px 92px' }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Turn them into</div>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, maxWidth: 470, margin: '0 0 26px' }}>
            Lab-printed keepsakes made from your shots — premium materials, true-to-the-night colour. Pick a format in the editor.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {PRODUCTS.map((p, i) => (
              <div key={p.id} className="dt-zoom" style={{ display: 'flex', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--bg-1)', cursor: 'pointer', minHeight: 210 }}>
                <div className="dt-zoom-img" style={{ flex: '0 0 42%', background: `#0c0c0e url("${p.img}") center/cover no-repeat` }} />
                <div style={{ flex: 1, padding: '24px 26px', display: 'flex', flexDirection: 'column' }}>
                  <div className="row between" style={{ alignItems: 'baseline', gap: 12 }}>
                    <div className="display" style={{ fontSize: 28, lineHeight: 1, color: 'var(--ink)' }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', flexShrink: 0 }}><Price value={p.price} /></div>
                  </div>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 10 }}>{p.sub.toUpperCase()}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 14 }}>{p.desc}</div>
                  <div style={{ flex: 1, minHeight: 14 }} />
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{p.min}–{p.max} SHOTS</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {scanning && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }} onClick={() => setScanning(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 92vw)', background: 'var(--bg)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#000' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                <div className="scan-frame" style={{ position: 'absolute', inset: '18%', '--ink': '#fff' }}>
                  <div className="scan-corner c-tl" /><div className="scan-corner c-tr" /><div className="scan-corner c-bl" /><div className="scan-corner c-br" />
                  <div className="scan-line" />
                </div>
              </div>
              <div style={{ padding: '20px 24px', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink)' }}>SCANNING YOUR TICKET…</div>
                <div className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>Hold the QR code on your ticket up to the camera.</div>
                <button className="btn btn-ghost" onClick={() => setScanning(false)} style={{ width: '100%', marginTop: 10 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="screen anim-in">
      <div className="scroll">
        {/* top bar */}
        <div className="row" style={{ paddingTop: 'var(--top)', paddingLeft: 20, paddingRight: 20 }}>
          <div className="wordmark">ENCORE</div>
        </div>

        {/* heading */}
        <div className="anim-up" style={{ padding: '22px 20px 16px' }}>
          <div className="kicker" style={{ marginBottom: 12 }}>Your night, in print</div>
          <h1 className="display" style={{ fontSize: 46, margin: 0, color: 'var(--ink)' }}>Relive the<br/>night</h1>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.5, margin: '12px 0 0', maxWidth: 300 }}>
            Point your camera at the QR code on your ticket to unlock every shot from the night.
          </p>
        </div>

        {/* viewfinder */}
        <div className="anim-up" style={{ padding: '8px 20px 0', animationDelay: '.06s' }}>
          <div onClick={onScan} className="scan-frame" style={{
            position: 'relative', width: '100%', aspectRatio: '1 / 1.04', borderRadius: 22, overflow: 'hidden',
            background: 'var(--vf)',
            border: '1px solid var(--line)', cursor: 'pointer',
          }}>
            {/* faux camera glows */}
            <div style={{ position: 'absolute', top: '-12%', left: '12%', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,180,120,0.28), transparent 70%)', filter: 'blur(6px)' }} />
            <div style={{ position: 'absolute', bottom: '4%', right: '6%', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(150,120,180,0.22), transparent 70%)', filter: 'blur(8px)' }} />
            {/* center QR target */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18 }}>
              <div style={{ position: 'relative', padding: 22, borderRadius: 14, background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(2px)' }}>
                <QrGhost />
              </div>
            </div>
            {/* corner brackets, inset */}
            <div style={{ position: 'absolute', inset: 26 }} className="scan-frame">
              <div className="scan-corner c-tl" /><div className="scan-corner c-tr" />
              <div className="scan-corner c-bl" /><div className="scan-corner c-br" />
              <div className="scan-line" />
            </div>
            <div className="mono" style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', fontSize: 10.5, letterSpacing: '0.16em', color: 'var(--ink-2)' }}>
              TAP TO SCAN
            </div>
          </div>
        </div>

        {/* actions — breathing room above and below */}
        <div className="anim-up" style={{ padding: '30px 20px 0', animationDelay: '.12s' }}>
          <button className="btn btn-primary" onClick={onManual}><Ic.keypad s={18} c="var(--acc-ink)" /> Enter ticket number</button>
          <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-2)', marginTop: 13, lineHeight: 1.4 }}>
            No QR code handy? Enter the number printed on your ticket.
          </div>
        </div>

        {/* how it works (informational — does not navigate) */}
        <div className="anim-up" style={{ padding: '44px 20px calc(var(--bottom) + 22px)', animationDelay: '.18s' }}>
          <div className="card" style={{ padding: '15px 16px 4px' }}>
            <div className="row between" style={{ marginBottom: 2 }}>
              <div className="kicker">How it works</div>
              <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>4 STEPS</div>
            </div>
            {STEPS.map((s, i) => (
              <div key={s.n} className="row" style={{ gap: 13, alignItems: 'flex-start', padding: '12px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', width: 20, flexShrink: 0, paddingTop: 1, letterSpacing: '0.04em' }}>{s.n}</div>
                <div className="col" style={{ gap: 3 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{s.t}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--ink-2)' }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* product hint — there is more than just the book */}
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-3)', textAlign: 'center', margin: '20px 0 11px' }}>
            CHOOSE FROM
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PRODUCTS.map((p) => (
              <div key={p.id} onClick={() => setInfoProduct(p)} className="dt-hover" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--bg-1)', cursor: 'pointer' }}>
                <div style={{ aspectRatio: '4 / 3', background: `#0c0c0e url("${p.img}") center/cover no-repeat` }} />
                <div style={{ padding: '11px 12px 13px' }}>
                  <div className="row between" style={{ alignItems: 'center', gap: 6 }}>
                    <div className="display" style={{ fontSize: 17, lineHeight: 1, color: 'var(--ink)' }}>{p.name}</div>
                    <Ic.info s={14} c="var(--ink-3)" />
                  </div>
                  <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.08em', color: 'var(--ink-3)', marginTop: 7 }}>{p.sub.toUpperCase()}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-2)', marginTop: 8 }}><Price value={p.price} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* subtle test toggle — light mode A/B, low-key but findable */}
          <button onClick={onToggleTheme} style={{
            display: 'block', margin: '34px auto 0', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--ink-2)', opacity: 0.85, textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: 'var(--ink-3)',
          }}>
            {theme === 'light' ? '◐ Switch to dark' : '◐ Try light mode'}
          </button>
        </div>
      </div>
      <ProductSheet product={infoProduct} onClose={() => setInfoProduct(null)} />
    </div>
  );
}

// ───────── ticket number entry ─────────
function TicketScreen({ onBack, onUnlock }) {
  const [code, setCode] = useState('');
  const LEN = 6;
  const press = (d) => setCode((c) => (c.length < LEN ? c + d : c));
  const del = () => setCode((c) => c.slice(0, -1));
  const full = code.length === LEN;

  // auto-advance the moment the last digit lands — no need to tap the CTA.
  // small delay so the user sees the 6th cell fill; cleared if they backspace.
  useEffect(() => {
    if (code.length !== LEN) return;
    const t = setTimeout(() => onUnlock(code), 260);
    return () => clearTimeout(t);
  }, [code]);

  const Key = ({ d, wide, children, onTap, dim }) => (
    <button onClick={onTap || (() => press(d))} style={{
      flex: wide ? 1.0 : 1, height: 60, borderRadius: 16, cursor: 'pointer',
      background: dim ? 'transparent' : 'var(--bg-2)', border: '1px solid var(--line)',
      color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 23, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children ?? d}</button>
  );

  return (
    <div className="screen anim-in">
      {/* top */}
      <div className="row" style={{ paddingTop: 'var(--top)', paddingLeft: 18, paddingRight: 18, gap: 12 }}>
        <div className="glass icon-btn" style={{ width: 40, height: 40 }} onClick={onBack}><Ic.chevL s={19} c="var(--ink)" /></div>
        <div className="wordmark" style={{ fontSize: 16 }}>ENCORE</div>
      </div>

      <div className="grow" style={{ padding: '30px 24px 0', display: 'flex', flexDirection: 'column' }}>
        <div className="kicker" style={{ marginBottom: 12 }}>Manual entry</div>
        <h1 className="display" style={{ fontSize: 40, margin: 0 }}>Enter ticket<br/>number</h1>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, margin: '12px 0 0', maxWidth: 290 }}>
          The 6-digit code is printed under the barcode on your ticket.
        </p>

        {/* code cells */}
        <div className="row" style={{ gap: 9, marginTop: 30, justifyContent: 'center' }}>
          {Array.from({ length: LEN }).map((_, i) => {
            const active = i === code.length;
            const filled = i < code.length;
            return (
              <div key={i} style={{
                width: 46, height: 60, borderRadius: 13,
                background: filled ? 'var(--bg-2)' : 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${active ? 'var(--ink)' : filled ? 'var(--line-2)' : 'var(--line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--ink)',
                transition: 'all .15s ease',
              }}>{code[i] || (active ? <span style={{ width: 2, height: 26, background: 'var(--ink)', animation: 'fadeIn 1s steps(2) infinite alternate' }} /> : '')}</div>
            );
          })}
        </div>

        <div className="grow" />

        {/* keypad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
          {[['1','2','3'],['4','5','6'],['7','8','9']].map((r, ri) => (
            <div key={ri} className="row" style={{ gap: 9 }}>{r.map((d) => <Key key={d} d={d} />)}</div>
          ))}
          <div className="row" style={{ gap: 9 }}>
            <Key dim onTap={del}><Ic.close s={20} c="var(--ink-2)" /></Key>
            <Key d="0" />
            <Key dim onTap={del}><Ic.chevL s={20} c="var(--ink-2)" /></Key>
          </div>
        </div>

        <button className="btn btn-primary" disabled={!full} onClick={() => onUnlock(code)} style={{ marginBottom: 22 }}>
          Unlock shots
        </button>
      </div>
    </div>
  );
}

// ───────── unlock transition ─────────
function UnlockScreen({ concert, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="screen dt-wide anim-in" onClick={onDone} style={{
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      background: 'var(--radial)',
    }}>
      <div style={{ textAlign: 'center', padding: 30 }}>
        <div className="kicker anim-up" style={{ color: 'var(--ink-2)', marginBottom: 22 }}>✦ Ticket verified</div>
        <div className="display anim-up" style={{ fontSize: 52, lineHeight: 0.9, animationDelay: '.15s' }}>{concert.artist}</div>
        <div className="anim-up" style={{ height: 1, background: 'var(--line-2)', margin: '20px auto', width: 60, animationDelay: '.3s' }} />
        <div className="mono anim-up" style={{ fontSize: 12, color: 'var(--ink-2)', letterSpacing: '0.12em', animationDelay: '.4s' }}>
          {concert.tour.toUpperCase()}
        </div>
        <div className="mono anim-up" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em', marginTop: 6, animationDelay: '.5s' }}>
          {concert.venue.toUpperCase()} · {concert.date}
        </div>
        <div className="mono anim-up" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.18em', marginTop: 34, animationDelay: '.9s' }}>
          ENTERING THE PIT…
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScanScreen, TicketScreen, UnlockScreen });
