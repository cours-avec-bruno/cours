(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');
  const INF = Infinity;

  const FUNCS = [
    { name: '1/x', html: '1/<i>x</i>', f: x => 1 / x,
      dirs: [{ k: '+inf', L: 0 }, { k: 'a+', a: 0, L: INF }, { k: 'a-', a: 0, L: -INF }] },
    { name: '(2x + 1)/(x − 1)', html: '(2<i>x</i> + 1)/(<i>x</i> − 1)', f: x => (2 * x + 1) / (x - 1),
      dirs: [{ k: '+inf', L: 2, x0: 2 }, { k: 'a+', a: 1, L: INF }, { k: 'a-', a: 1, L: -INF }] },
    { name: 'x²', html: '<i>x</i>²', f: x => x * x,
      dirs: [{ k: '+inf', L: INF }, { k: '-inf', L: INF }] },
    { name: 'sin(x)/x', html: 'sin(<i>x</i>)/<i>x</i>', f: x => Math.sin(x) / x,
      dirs: [{ k: '+inf', L: 0 }, { k: 'a+', a: 0, L: 1, both: true }] },
  ];
  const S = { fi: 0, di: 0, s: 250, playing: false };
  const F = () => FUNCS[S.fi];
  const Dd = () => F().dirs[S.di];

  const pm = v => (v === INF ? '+∞' : v === -INF ? '−∞' : Fig.num(v));
  function dirLabel(d, html) {
    const x = html ? '<i>x</i>' : 'x';
    if (d.k === '+inf') return `${x} → +∞`;
    if (d.k === '-inf') return `${x} → −∞`;
    if (d.both) return `${x} → ${d.a}`;
    return `${x} → ${d.a}${html ? `<sup>${d.k === 'a+' ? '+' : '−'}</sup>` : d.k === 'a+' ? '⁺' : '⁻'}`;
  }

  /* Position de x en fonction du curseur (échelle logarithmique) */
  function xOf(s, d = Dd()) {
    const t = s / 1000;
    if (d.k === '+inf') return (d.x0 || 1) * Math.pow(10, 3.7 * t);
    if (d.k === '-inf') return -(d.x0 || 1) * Math.pow(10, 3.7 * t);
    const h = Math.pow(10, -3.5 * t);
    return d.k === 'a+' ? d.a + h : d.a - h;
  }
  const samples = d => (d.k.includes('inf')
    ? [10, 100, 1000, 10000].map(v => (d.k === '-inf' ? -v : v))
    : [0.1, 0.01, 0.001, 0.0001].map(h => (d.k === 'a+' ? d.a + h : d.a - h)));
  const sig = v => (isFinite(v) ? Fig.num(Number(v.toPrecision(6)), 6) : '—');

  const view = Fig.setup(canvas, { minWidth: 600, height: W => Math.round(Math.min(440, Math.max(340, W * 0.4))) }, () => draw());
  const P = 28;

  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, d = Dd(), f = F().f;
    const x = xOf(S.s), fx = f(x);

    // Fenêtre : on dézoome quand x part à l’infini, on reste autour de a sinon
    let x0, x1, y0, y1;
    if (d.k.includes('inf')) {
      const X = Math.max(8, 1.3 * Math.abs(x));
      [x0, x1] = d.k === '+inf' ? [-0.12 * X, X] : [-X, 0.12 * X];
    } else { x0 = d.a - 4; x1 = d.a + 4; }
    if (isFinite(d.L)) { const r = d.k.includes('inf') ? 2.5 : 1.5; y0 = d.L - r; y1 = d.L + r; }
    else if (d.k.includes('inf')) { const Y = Math.max(10, 1.3 * Math.abs(fx)); y0 = -0.12 * Y; y1 = Y; }
    else { const Y = Math.max(6, 1.3 * Math.abs(fx)); y0 = -Y; y1 = Y; }

    const X = v => P + ((v - x0) / (x1 - x0)) * (W - 2 * P);
    const Y = v => P + ((y1 - v) / (y1 - y0)) * (H - 2 * P);
    const inv = px => x0 + ((px - P) / (W - 2 * P)) * (x1 - x0);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // quadrillage + graduations
    const sx = Fig.niceStep(x1 - x0, 10), sy = Fig.niceStep(y1 - y0, 8);
    const ax = Math.min(Math.max(Y(0), P), H - P), ay = Math.min(Math.max(X(0), P), W - P);
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let v = Math.ceil(x0 / sx) * sx; v <= x1; v += sx) Fig.seg(ctx, X(v), P, X(v), H - P);
    for (let v = Math.ceil(y0 / sy) * sy; v <= y1; v += sy) Fig.seg(ctx, P, Y(v), W - P, Y(v));
    ctx.strokeStyle = C.axis;
    Fig.arrow(ctx, P - 8, ax, W - P + 14, ax, 6);
    Fig.arrow(ctx, ay, H - P + 8, ay, P - 14, 6);
    for (let v = Math.ceil(x0 / sx) * sx; v <= x1; v += sx) {
      if (Math.abs(v) > sx / 2) Fig.label(ctx, Fig.num(v, 2), X(v), ax + 13, { size: 11, color: C.muted });
    }
    for (let v = Math.ceil(y0 / sy) * sy; v <= y1; v += sy) {
      if (Math.abs(v) > sy / 2) Fig.label(ctx, Fig.num(v, 2), ay - 6, Y(v), { size: 11, color: C.muted, align: 'right' });
    }

    // asymptote
    ctx.save();
    ctx.strokeStyle = C.arc; ctx.lineWidth = 1.5; ctx.setLineDash([7, 5]);
    if (isFinite(d.L)) {
      Fig.seg(ctx, P, Y(d.L), W - P, Y(d.L));
    } else if (!d.k.includes('inf')) {
      Fig.seg(ctx, X(d.a), P, X(d.a), H - P);
    }
    ctx.restore();
    if (isFinite(d.L) && d.k.includes('inf')) {
      Fig.math(ctx, [['y', true], ` = ${Fig.num(d.L)}`], d.k === '+inf' ? W - P - 4 : P + 4, Y(d.L) - 11, { size: 14, color: C.arc, align: d.k === '+inf' ? 'right' : 'left' });
    } else if (!isFinite(d.L)) {
      if (!d.k.includes('inf')) Fig.math(ctx, [['x', true], ` = ${d.a}`], X(d.a) + 6, P + 10, { size: 14, color: C.arc, align: 'left' });
    }

    // courbe
    ctx.save();
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.2; ctx.beginPath();
    let pen = false, py = 0;
    for (let px = P - 8; px <= W - P + 8; px += 0.5) {
      const v = f(inv(px)), y = Y(v);
      if (!isFinite(v) || Math.abs(y) > 20 * H || (pen && Math.abs(y - py) > 2 * H)) { pen = false; continue; }
      pen ? ctx.lineTo(px, y) : ctx.moveTo(px, y);
      pen = true; py = y;
    }
    ctx.stroke();
    ctx.restore();

    // trou (fonction non définie en a mais limite finie)
    if (!d.k.includes('inf') && isFinite(d.L)) {
      ctx.beginPath(); ctx.arc(X(d.a), Y(d.L), 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = C.text; ctx.lineWidth = 1.6; ctx.stroke();
    }

    // point mobile + projections
    const MX = X(x), MY = Math.min(Math.max(Y(fx), -50), H + 50);
    ctx.save();
    ctx.setLineDash([3, 4]); ctx.strokeStyle = C.cos; ctx.globalAlpha = 0.6; ctx.lineWidth = 1;
    Fig.seg(ctx, MX, MY, MX, ax); Fig.seg(ctx, MX, MY, ay, MY);
    ctx.restore();
    // flèche de direction sur l’axe des abscisses
    const dir = d.k === '+inf' || d.k === 'a-' ? 1 : -1;
    ctx.strokeStyle = C.cos; ctx.lineWidth = 2;
    Fig.arrow(ctx, MX - dir * 4, ax + 26, MX + dir * 26, ax + 26, 7);
    if (MY > -10 && MY < H + 10) Fig.dot(ctx, MX, MY, 6, C.cos);

    readout(x, fx);
  }

  function readout(x, fx) {
    const d = Dd(), f = F().f;
    $('r-x').innerHTML = `<b>${sig(x)}</b>`;
    $('r-f').innerHTML = `<b>${sig(fx)}</b>`;
    $('lim').innerHTML = `lim<sub>${dirLabel(d, true)}</sub> <i>f</i>(<i>x</i>) = <b>${pm(d.L)}</b>`;
    let m;
    if (d.k.includes('inf') && isFinite(d.L)) {
      m = `Plus <i>x</i> est ${d.k === '+inf' ? 'grand' : 'grand en négatif'}, plus <i>f</i>(<i>x</i>) se rapproche de ${Fig.num(d.L)} : la courbe se colle à la droite <i>y</i> = ${Fig.num(d.L)}, <b>asymptote horizontale</b>.`;
    } else if (d.k.includes('inf')) {
      m = '<i>f</i>(<i>x</i>) dépasse n’importe quel nombre, aussi grand soit-il : la limite est +∞.';
    } else if (isFinite(d.L)) {
      m = `<i>f</i> n’est pas définie en ${d.a} (division par 0), mais quand <i>x</i> s’en approche, <i>f</i>(<i>x</i>) se rapproche de ${Fig.num(d.L)}. La courbe a juste un « trou ».`;
    } else {
      m = `Quand <i>x</i> s’approche de ${d.a} par la ${d.k === 'a+' ? 'droite' : 'gauche'}, on divise par un nombre minuscule
        ${d.k === 'a+' ? 'positif' : 'négatif'} : <i>f</i>(<i>x</i>) devient énorme (${pm(d.L)}). La droite <i>x</i> = ${d.a} est <b>asymptote verticale</b>.`;
    }
    $('msg').innerHTML = m;
    $('table').innerHTML = '<tr><th>x</th><th>f(x)</th></tr>' +
      samples(d).map(v => `<tr><td>${Fig.num(v, 4)}</td><td>${sig(f(v))}</td></tr>`).join('') +
      `<tr><td>${dirLabel(d, false).replace('x ', '')}</td><td><b style="color:var(--arc)">${pm(d.L)}</b></td></tr>`;
    $('s').value = S.s;
    $('play').textContent = S.playing ? '❚❚ Pause' : '▶ Faire avancer x';
  }

  /* ---------- Interface ---------- */
  function setFunc(i) {
    S.fi = i; S.di = 0;
    document.querySelectorAll('#funcs .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    $('dirs').innerHTML = F().dirs.map(d => `<button class="chip">${dirLabel(d, true)}</button>`).join('');
    document.querySelectorAll('#dirs .chip').forEach((b, k) => (b.onclick = () => setDir(k)));
    setDir(0);
  }
  function setDir(k) {
    S.di = k; S.s = 150; S.playing = false;
    document.querySelectorAll('#dirs .chip').forEach((b, j) => b.setAttribute('aria-pressed', j === k));
    draw();
  }

  let last = 0;
  function loop(now) {
    if (!S.playing) return;
    S.s = Math.min(1000, S.s + ((now - last) / 1000) * 220);
    last = now;
    if (S.s >= 1000) S.playing = false;
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  $('play').onclick = () => {
    S.playing = !S.playing;
    if (S.playing) { if (S.s >= 1000) S.s = 0; last = performance.now(); requestAnimationFrame(loop); }
    draw();
  };
  $('s').addEventListener('input', e => { S.playing = false; S.s = +e.target.value; draw(); });

  $('funcs').innerHTML = FUNCS.map(fn => `<button class="chip">${fn.html.replace(/<\/?i>/g, '')}</button>`).join('');
  document.querySelectorAll('#funcs .chip').forEach((b, k) => (b.onclick = () => setFunc(k)));
  setFunc(0);
})();
