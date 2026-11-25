(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');
  const XMIN = -3.5, XMAX = 3.5, H0 = 1.5;
  const S = { f: x => x * x, a: 1, h: H0, lo: -1, hi: 16, drag: null, anim: false };
  const num = (x, d = 3) => (isFinite(x) ? Fig.num(x, d) : '—');
  const par = x => (x < 0 ? `(${num(x)})` : num(x));

  /* ---------- Lecture d'une fonction tapée au clavier (sans eval) ---------- */
  const FUNCS = {
    sqrt: Math.sqrt, racine: Math.sqrt, '√': Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
    exp: Math.exp, ln: Math.log, log: Math.log10, abs: Math.abs,
  };
  const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E };
  const NAMES = [...Object.keys(FUNCS), ...Object.keys(CONSTS), 'x'].sort((p, q) => q.length - p.length);

  function tokenize(src) {
    const s = src.toLowerCase()
      .replace(/^\s*(f\s*\(\s*x\s*\)|y)\s*=/, '')
      .replace(/,/g, '.').replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/\*\*/g, '^');
    const T = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      const n = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (n) { T.push({ t: 'num', v: parseFloat(n[0]) }); i += n[0].length; continue; }
      if ('+-*/^()'.includes(ch)) { T.push({ t: 'op', v: ch }); i++; continue; }
      const name = NAMES.find(k => s.startsWith(k, i));
      if (name) { T.push({ t: 'id', v: name }); i += name.length; continue; }
      throw new Error(`« ${ch} » non reconnu`);
    }
    return T;
  }

  function compile(src) {
    const T = tokenize(src);
    if (!T.length) throw new Error('fonction vide');
    let i = 0;
    const peek = () => T[i];
    const isOp = v => peek() && peek().t === 'op' && peek().v === v;
    const startsAtom = t => t && (t.t === 'num' || t.t === 'id' || t.v === '(');
    const expect = v => { if (!isOp(v)) throw new Error(`« ${v} » manquant`); i++; };

    function expr() {
      let a = term();
      while (isOp('+') || isOp('-')) {
        const op = T[i++].v, l = a, r = term();
        a = op === '+' ? x => l(x) + r(x) : x => l(x) - r(x);
      }
      return a;
    }
    function term() {
      let a = unary();
      for (;;) {
        const l = a;
        if (isOp('*') || isOp('/')) {
          const op = T[i++].v, r = unary();
          a = op === '*' ? x => l(x) * r(x) : x => l(x) / r(x);
        } else if (startsAtom(peek())) {
          const r = unary(); // multiplication implicite : 2x, x(x+1)…
          a = x => l(x) * r(x);
        } else return a;
      }
    }
    function unary() {
      if (isOp('-')) { i++; const a = unary(); return x => -a(x); }
      if (isOp('+')) { i++; return unary(); }
      return power();
    }
    function power() {
      const b = atom();
      if (isOp('^')) { i++; const e = unary(); return x => Math.pow(b(x), e(x)); }
      return b;
    }
    function atom() {
      const t = T[i++];
      if (!t) throw new Error('expression incomplète');
      if (t.t === 'num') { const v = t.v; return () => v; }
      if (t.t === 'id') {
        if (t.v === 'x') return x => x;
        if (t.v in CONSTS) { const v = CONSTS[t.v]; return () => v; }
        const F = FUNCS[t.v];
        let a;
        if (isOp('(')) { i++; a = expr(); expect(')'); } else a = power();
        return x => F(a(x));
      }
      if (t.v === '(') { const a = expr(); expect(')'); return a; }
      throw new Error(`« ${t.v} » mal placé`);
    }

    const f = expr();
    if (i < T.length) throw new Error(`« ${T[i].v} » en trop`);
    return f;
  }

  /* ---------- Repère ---------- */
  const view = Fig.setup(canvas, { minWidth: 600, height: W => Math.round(Math.min(500, Math.max(360, W * 0.44))) }, () => draw());
  let G;
  const P = 30;
  function geom() { G = { W: view.W, H: view.H }; }
  const X = x => P + ((x - XMIN) / (XMAX - XMIN)) * (G.W - 2 * P);
  const Y = y => P + ((S.hi - y) / (S.hi - S.lo)) * (G.H - 2 * P);
  const invX = px => XMIN + ((px - P) / (G.W - 2 * P)) * (XMAX - XMIN);
  const ok = x => isFinite(S.f(x));

  function yRange() {
    const ys = [];
    for (let k = 0; k <= 400; k++) {
      const y = S.f(XMIN + ((XMAX - XMIN) * k) / 400);
      if (isFinite(y)) ys.push(y);
    }
    ys.sort((p, q) => p - q);
    let lo = ys.length ? ys[Math.floor(ys.length * 0.08)] : -1;
    let hi = ys.length ? ys[Math.max(0, Math.ceil(ys.length * 0.92) - 1)] : 1;
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
    const sp = hi - lo;
    S.lo = lo - sp * 0.12; S.hi = hi + sp * 0.12;
  }

  const deriv = a => (S.f(a + 1e-5) - S.f(a - 1e-5)) / 2e-5;
  const rate = (a, h) => (S.f(a + h) - S.f(a)) / h;

  function line(x0, y0, m, color, width, dash) {
    if (!isFinite(m) || !isFinite(y0)) return;
    const ctx = view.ctx;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    Fig.seg(ctx, X(XMIN - 1), Y(y0 + m * (XMIN - 1 - x0)), X(XMAX + 1), Y(y0 + m * (XMAX + 1 - x0)));
    ctx.restore();
  }

  function draw() {
    geom();
    const ctx = view.ctx, { W, H } = G;
    const a = S.a, b = S.a + S.h, fa = S.f(a), fb = S.f(b);
    const m = Math.abs(S.h) < 1e-9 ? deriv(a) : rate(a, S.h), d = deriv(a);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Quadrillage
    const ys = Fig.niceStep(S.hi - S.lo, 8);
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let x = Math.ceil(XMIN); x <= XMAX; x++) Fig.seg(ctx, X(x), P - 10, X(x), H - P + 10);
    for (let y = Math.ceil(S.lo / ys) * ys; y <= S.hi; y += ys) Fig.seg(ctx, P - 10, Y(y), W - P + 10, Y(y));

    // Axes
    const y0 = Math.min(Math.max(Y(0), P), H - P), x0 = X(0);
    ctx.strokeStyle = C.axis;
    Fig.arrow(ctx, P - 10, y0, W - P + 16, y0, 6);
    Fig.arrow(ctx, x0, H - P + 10, x0, P - 16, 6);
    for (let x = Math.ceil(XMIN); x <= XMAX; x++) {
      if (x !== 0) Fig.label(ctx, String(x).replace('-', '−'), X(x), y0 + 13, { size: 11, color: C.muted });
    }
    for (let y = Math.ceil(S.lo / ys) * ys; y <= S.hi; y += ys) {
      if (Math.abs(y) > ys / 2) Fig.label(ctx, Fig.num(y), x0 - 7, Y(y), { size: 11, color: C.muted, align: 'right' });
    }
    Fig.math(ctx, [['x', true]], W - P + 14, y0 + 14, { size: 15, color: C.muted });
    Fig.math(ctx, [['y', true]], x0 + 12, P - 12, { size: 15, color: C.muted });

    // Courbe (coupée aux asymptotes et hors domaine)
    ctx.save();
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.2;
    ctx.beginPath();
    let pen = false, py = 0;
    for (let px = P - 10; px <= W - P + 10; px += 1) {
      const y = S.f(invX(px)), sy = Y(y);
      if (!isFinite(y) || Math.abs(sy) > 4 * H || (pen && Math.abs(sy - py) > H)) { pen = false; continue; }
      pen ? ctx.lineTo(px, sy) : ctx.moveTo(px, sy);
      pen = true; py = sy;
    }
    ctx.stroke();
    ctx.restore();

    // Tangente puis sécante
    line(a, fa, d, C.arc, 1.6, [7, 5]);
    line(a, fa, m, C.cos, 2);

    // Triangle h / Δy
    const XA = X(a), YA = Y(fa), XB = X(b), YB = Y(fb);
    if (Math.abs(XB - XA) > 8 && isFinite(fb)) {
      ctx.save();
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5;
      Fig.seg(ctx, XA, YA, XB, YA);
      ctx.strokeStyle = C.sin; ctx.lineWidth = 2;
      Fig.seg(ctx, XB, YA, XB, YB);
      ctx.restore();
      const below = fb >= fa;
      Fig.math(ctx, [['h', true], ` = ${num(S.h, 2)}`], (XA + XB) / 2, YA + (below ? 15 : -14), { size: 14, color: C.muted });
      if (Math.abs(YB - YA) > 14) {
        Fig.math(ctx, ['Δ', ['y', true], ` = ${num(fb - fa, 2)}`], XB + (S.h > 0 ? 8 : -8), (YA + YB) / 2,
          { size: 14, color: C.sin, align: S.h > 0 ? 'left' : 'right' });
      }
    }

    // Repères a et a + h sur l'axe des abscisses
    ctx.save();
    ctx.setLineDash([3, 4]); ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
    Fig.seg(ctx, XA, YA, XA, y0);
    if (Math.abs(XB - XA) > 8) Fig.seg(ctx, XB, YB, XB, y0);
    ctx.restore();
    const lblY = v => y0 + (v >= 0 ? 28 : -26); // du côté opposé au point
    Fig.math(ctx, [['a', true]], XA, lblY(fa), { size: 15 });
    if (Math.abs(XB - XA) > 26) Fig.math(ctx, [['a', true], ' + ', ['h', true]], XB, lblY(fb), { size: 15, color: C.cos });

    // Points
    Fig.dot(ctx, XA, YA, 6, C.text);
    Fig.label(ctx, 'A', XA - 12, YA - 12, { size: 14, weight: '600' });
    if (isFinite(fb)) {
      Fig.dot(ctx, XB, YB, 6, C.cos);
      Fig.label(ctx, 'B', XB + 12, YB - 12, { size: 14, weight: '600', color: C.cos });
    }

    readout(fa, fb, m, d);
  }

  function readout(fa, fb, m, d) {
    const a = S.a, h = S.h;
    $('r-a').innerHTML = `<i>a</i> = ${num(a, 2)} &nbsp; <i>f</i>(<i>a</i>) = ${num(fa)}`;
    $('r-b').innerHTML = `<i>a</i> + <i>h</i> = ${num(a + h, 3)} &nbsp; <i>f</i>(<i>a</i> + <i>h</i>) = ${num(fb)}`;
    $('r-m').innerHTML = `<b>${num(m)}</b>`;
    $('r-d').innerHTML = isFinite(d) ? `<b>${num(d)}</b>` : '<span class="muted">n’existe pas</span>';
    $('formula').innerHTML = Math.abs(h) < 0.01
      ? `<i>h</i> ≈ 0 : la sécante est devenue la <b style="color:var(--arc)">tangente</b>`
      : `<span style="white-space:nowrap">[<i>f</i>(<i>a</i>+<i>h</i>) − <i>f</i>(<i>a</i>)] ÷ <i>h</i></span>
         = (${num(fb)} − ${par(fa)}) ÷ ${par(h)} = <b>${num(m)}</b>`;
    $('htable').innerHTML = '<tr><th>h</th><th style="font-style:normal;font-family:var(--font);font-size:13px">taux d’accroissement</th></tr>' +
      [1, 0.1, 0.01, 0.001].map(k => `<tr><td>${Fig.num(k, 3)}</td><td>${num(rate(a, k), 4)}</td></tr>`).join('') +
      `<tr><td>→ 0</td><td><b style="color:var(--arc)">${isFinite(d) ? num(d, 3) : '—'}</b></td></tr>`;
    $('go').textContent = Math.abs(h) < 0.01 ? 'Écarter B' : 'Rapprocher B de A';
  }

  /* ---------- Déplacer A et B le long de la courbe ---------- */
  const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const snap = x => Math.round(x * 20) / 20;
  function pick(p) {
    const dA = Math.hypot(p.x - X(S.a), p.y - Y(S.f(S.a)));
    const dB = Math.hypot(p.x - X(S.a + S.h), p.y - Y(S.f(S.a + S.h)));
    if (Math.min(dA, dB) < 22) return dB <= dA ? 'B' : 'A';
    return null;
  }
  function moveTo(p, who) {
    const x = snap(Math.max(XMIN, Math.min(XMAX, invX(p.x))));
    if (!ok(x)) return;
    if (who === 'A') {
      const b = S.a + S.h;
      if (Math.abs(b - x) < 1e-9) return;
      S.a = x; S.h = b - x;
    } else {
      if (Math.abs(x - S.a) < 1e-9) return;
      S.h = x - S.a;
    }
    draw();
  }
  canvas.addEventListener('pointerdown', e => {
    const p = pos(e);
    S.anim = false;
    S.drag = pick(p) || (Math.abs(p.x - X(S.a)) < Math.abs(p.x - X(S.a + S.h)) ? 'A' : 'B');
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    moveTo(p, S.drag);
  });
  canvas.addEventListener('pointermove', e => {
    if (S.drag) moveTo(pos(e), S.drag);
    else canvas.style.cursor = pick(pos(e)) ? 'grab' : 'crosshair';
  });
  ['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => { S.drag = null; canvas.style.cursor = 'grab'; }));

  /* ---------- h → 0 ---------- */
  $('go').onclick = () => {
    if (Math.abs(S.h) < 0.01) {
      S.anim = false;
      S.h = ok(S.a + H0) ? H0 : -H0;
      draw();
      return;
    }
    const h0 = S.h, T = 3, k = Math.log(Math.abs(h0) / 0.001) / T, t0 = performance.now();
    S.anim = true;
    const step = now => {
      if (!S.anim) return;
      const t = Math.min(T, (now - t0) / 1000);
      S.h = h0 * Math.exp(-k * t);
      if (t >= T) { S.h = Math.sign(h0) * 0.001; S.anim = false; }
      draw();
      if (S.anim) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Saisie de la fonction ---------- */
  function setFunction(src) {
    let f;
    try {
      f = compile(src);
      f(1); // test
    } catch (err) {
      $('fx').classList.add('bad');
      $('fx-err').textContent = 'Fonction non reconnue : ' + err.message;
      return;
    }
    $('fx').classList.remove('bad');
    $('fx-err').textContent = '';
    S.f = f; S.anim = false;
    // Place A et B sur une partie de la courbe où f est définie
    if (!ok(S.a)) S.a = [1, 0.5, 2, -1, 3].find(ok) ?? 1;
    if (!ok(S.a + S.h)) S.h = ok(S.a + H0) ? H0 : ok(S.a - H0) ? -H0 : 0.5;
    yRange();
    draw();
  }
  $('fx').addEventListener('input', e => setFunction(e.target.value));
  document.querySelectorAll('.ex').forEach(b => (b.onclick = () => { $('fx').value = b.textContent; setFunction(b.textContent); }));

  setFunction($('fx').value);
})();
