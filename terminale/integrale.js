(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const S = { tab: 0, n: 6, x: 2.6, playing: false };
  const BLUE = 'rgba(36,99,214,0.22)', RED = 'rgba(214,69,43,0.22)';

  function axes(ctx, X, Y, x0, x1, y0, y1, l, r, t, b, step = 1) {
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let v = Math.ceil(x0 / step) * step; v <= x1; v += step) Fig.seg(ctx, X(v), t, X(v), b);
    for (let v = Math.ceil(y0); v <= y1; v++) Fig.seg(ctx, l, Y(v), r, Y(v));
    ctx.strokeStyle = C.axis;
    Fig.arrow(ctx, l, Y(0), r + 6, Y(0), 6);
    Fig.arrow(ctx, X(0), b, X(0), t - 6, 6);
  }
  function ticks(ctx, X, Y, x0, x1, y0, y1, step = 1) {
    for (let v = Math.ceil(x0 / step) * step; v <= x1; v += step) if (v) Fig.label(ctx, Fig.num(v), X(v), Y(0) + 12, { size: 11, color: C.muted });
    for (let v = Math.ceil(y0); v <= y1; v++) if (v) Fig.label(ctx, String(v).replace('-', '−'), X(0) - 7, Y(v), { size: 11, color: C.muted, align: 'right' });
  }
  function plot(ctx, g, X, Y, a, b) {
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const t = a + ((b - a) * i) / 400;
      i ? ctx.lineTo(X(t), Y(g(t))) : ctx.moveTo(X(t), Y(g(t)));
    }
    ctx.stroke();
  }

  /* =================== Onglet 1 : les rectangles =================== */
  const f1 = x => x * x, A = 0, B = 2, EXACT = 8 / 3;
  const v1 = Fig.setup($('fig1'), { minWidth: 340, height: W => Math.round(Math.min(420, Math.max(340, W * 0.38))) }, () => draw1());

  const sums = n => {
    let lo = 0, hi = 0;
    for (let k = 0; k < n; k++) { const xa = A + ((B - A) * k) / n, xb = A + ((B - A) * (k + 1)) / n; lo += f1(xa); hi += f1(xb); }
    return [(lo * (B - A)) / n, (hi * (B - A)) / n];
  };

  function draw1() {
    const ctx = v1.ctx, W = v1.W, H = v1.H, l = 34, r = W - 16, t = 14, b = H - 24;
    const x0 = -0.25, x1 = W < 600 ? 2.6 : 2.45, y0 = -0.35, y1 = 4.5;
    const X = v => l + ((v - x0) / (x1 - x0)) * (r - l), Y = v => t + ((y1 - v) / (y1 - y0)) * (b - t);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    axes(ctx, X, Y, x0, x1, y0, y1, l, r, t, b, 0.5);

    const n = S.n, w = (B - A) / n, wpx = X(w) - X(0);
    for (let k = 0; k < n; k++) {
      const xa = A + k * w, hiY = Y(f1(xa + w)), loY = Y(f1(xa));
      ctx.fillStyle = C.sub; ctx.fillRect(X(xa), hiY, wpx, Y(0) - hiY);
      ctx.fillStyle = C.add; ctx.fillRect(X(xa), loY, wpx, Y(0) - loY);
      if (wpx > 6) {
        ctx.lineWidth = 1;
        ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = C.sin;
        ctx.strokeRect(X(xa) + 0.5, hiY + 0.5, wpx - 1, Y(0) - hiY - 1);
        ctx.restore();
        ctx.strokeStyle = C.cos;
        ctx.strokeRect(X(xa) + 0.5, loY + 0.5, wpx - 1, Y(0) - loY - 1);
      }
    }
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.4;
    plot(ctx, f1, X, Y, x0 + 0.05, 2.12);
    Fig.math(ctx, [['y', true], ' = ', ['x', true], ['2', false, 'sup']], X(2.12) + 8, Y(f1(2.12)) + 4, { size: 15, align: 'left' });
    ticks(ctx, X, Y, x0, x1, y0, y1, 0.5);

    if (S.tab === 0) readout1();
  }

  function readout1() {
    const [lo, hi] = sums(S.n);
    $('rows').innerHTML = `
      <div class="ro"><span class="k">somme basse <i>s</i><sub><i>n</i></sub> (rectangles bleus)</span><span class="v"><b class="c-cos">${Fig.fixed(lo, 3)}</b></span></div>
      <div class="ro"><span class="k">somme haute <i>S</i><sub><i>n</i></sub> (bleu + rouge)</span><span class="v"><b class="c-sin">${Fig.fixed(hi, 3)}</b></span></div>
      <div class="ro"><span class="k">écart <i>S</i><sub><i>n</i></sub> − <i>s</i><sub><i>n</i></sub></span><span class="v"><b>${Fig.fixed(hi - lo, 3)}</b> = 8/${S.n}</span></div>`;
    $('res').innerHTML = `<span class="c-cos">${Fig.fixed(lo, 3)}</span> ≤ ∫<sub>0</sub><sup>2</sup> <i>x</i>² d<i>x</i> ≤ <span class="c-sin">${Fig.fixed(hi, 3)}</span><br>
      ∫<sub>0</sub><sup>2</sup> <i>x</i>² d<i>x</i> = <b>8/3 ≈ ${Fig.fixed(EXACT, 3)}</b>`;
    $('msg').innerHTML = S.n === 1
      ? 'Un seul rectangle : l’encadrement est très grossier (entre 0 et 8). Augmente <i>n</i>.'
      : `Empile les bandes rouges les unes sur les autres : elles forment une colonne de largeur 2/${S.n} et de hauteur 4. L’écart vaut donc 8/${S.n} :
        il tend vers 0, et les deux sommes se rejoignent sur l’aire exacte.`;
    $('nv').textContent = S.n;
  }

  /* =================== Onglet 2 : l’aire qui s’accumule =================== */
  const f2 = x => x * x - 5 * x + 4;
  const F2 = x => (x * x * x) / 3 - (5 * x * x) / 2 + 4 * x;
  const XMAX = 5;
  const v2 = Fig.setup($('fig2'), { minWidth: 340, height: W => Math.round(Math.min(560, Math.max(480, W * 0.5))) }, () => draw2());

  function draw2() {
    const ctx = v2.ctx, W = v2.W, H = v2.H, l = 34, r = W - 16, gap = 44, T = 16, Bm = 26;
    const ph = (H - T - Bm - gap) / 2;
    const x0 = -0.3, x1 = 5.35;
    const X = v => l + ((v - x0) / (x1 - x0)) * (r - l);
    const [ya0, ya1] = [-2.8, 4.6], [yb0, yb1] = [-3.2, 2.4];
    const Ya = v => T + ((ya1 - v) / (ya1 - ya0)) * ph;
    const Yb = v => T + ph + gap + ((yb1 - v) / (yb1 - yb0)) * ph;
    const x = S.x;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    axes(ctx, X, Ya, x0, x1, ya0, ya1, l, r, T, T + ph);
    axes(ctx, X, Yb, x0, x1, yb0, yb1, l, r, T + ph + gap, T + 2 * ph + gap);

    // aire signée de 0 à x, colonne de pixels par colonne de pixels
    for (let px = X(0); px < X(x); px += 1) {
      const t = x0 + ((px + 0.5 - l) / (r - l)) * (x1 - x0), v = f2(t);
      ctx.fillStyle = v >= 0 ? BLUE : RED;
      const y = Ya(v), z = Ya(0);
      ctx.fillRect(px, Math.min(y, z), Math.min(1, X(x) - px), Math.abs(z - y));
    }
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.4;
    plot(ctx, f2, X, Ya, -0.08, 5.08);
    Fig.math(ctx, [['y', true], ' = ', ['f', true], '(', ['x', true], ') = ', ['x', true], ['2', false, 'sup'], ' − 5', ['x', true], ' + 4'], X(1.25), T + 10, { size: 15, align: 'left' });

    // trace de F, bleue quand F monte (f > 0), rouge quand F descend (f < 0)
    const n = Math.max(2, Math.ceil(X(x) - X(0)));
    ctx.lineWidth = 2.8;
    for (let i = 0; i < n; i++) {
      const a = (x * i) / n, b = (x * (i + 1)) / n;
      ctx.strokeStyle = f2((a + b) / 2) >= 0 ? C.cos : C.sin;
      Fig.seg(ctx, X(a), Yb(F2(a)), X(b), Yb(F2(b)));
    }
    Fig.math(ctx, [['F', true], '(', ['x', true], ') = ∫', ['0', false, 'sub'], ['x', true, 'sup'], ' ', ['f', true], '(', ['t', true], ') d', ['t', true]], r - 6, T + ph + gap + 10, { size: 15, align: 'right' });

    // lien vertical, points
    ctx.save();
    ctx.strokeStyle = C.faint; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
    Fig.seg(ctx, X(x), Ya(f2(x)), X(x), Yb(F2(x)));
    ctx.restore();
    const col = f2(x) >= 0 ? C.cos : C.sin;
    Fig.dot(ctx, X(x), Ya(f2(x)), 6, col);
    Fig.dot(ctx, X(x), Yb(F2(x)), 6, col);
    ticks(ctx, X, Ya, x0, x1, ya0, ya1);
    ticks(ctx, X, Yb, x0, x1, yb0, yb1);
    const right = X(x) > r - 120;
    Fig.label(ctx, `F(x) ≈ ${Fig.fixed(F2(x), 2)}`, X(x) + (right ? -10 : 10), Yb(F2(x)) + (F2(x) >= 0 ? -16 : 18), { size: 13, color: C.text, weight: '600', align: right ? 'right' : 'left' });

    if (S.tab === 1) readout2();
  }

  function readout2() {
    const x = S.x, v = f2(x), Fx = F2(x);
    $('rows').innerHTML = `
      <div class="ro"><span class="k"><i>x</i></span><span class="v"><b>${Fig.fixed(x, 2)}</b></span></div>
      <div class="ro"><span class="k"><i>f</i>(<i>x</i>)</span><span class="v"><b class="${v >= 0 ? 'c-cos' : 'c-sin'}">${Fig.fixed(v, 2)}</b></span></div>
      <div class="ro"><span class="k"><i>F</i>(<i>x</i>) = aire bleue − aire rouge</span><span class="v"><b>${Fig.fixed(Fx, 2)}</b></span></div>`;
    $('res').innerHTML = '<i>F</i>′(<i>x</i>) = <i>f</i>(<i>x</i>)';
    let m;
    if (x < 0.06) m = 'Au départ, <i>F</i>(0) = 0 : on n’a encore rien accumulé.';
    else if (Math.abs(x - 1) < 0.06) m = '<i>f</i> s’annule et devient négative : <i>F</i> arrête de monter et commence à descendre. <i>F</i> atteint un <b>maximum</b>.';
    else if (Math.abs(x - 4) < 0.06) m = '<i>f</i> s’annule et redevient positive : <i>F</i> arrête de descendre. <i>F</i> atteint un <b>minimum</b>.';
    else if (v > 0) m = '<i>f</i>(<i>x</i>) &gt; 0 : on ajoute de l’aire <b class="c-cos">bleue</b>, <i>F</i> <b>monte</b>. Plus <i>f</i>(<i>x</i>) est grand, plus <i>F</i> monte vite : la pente de <i>F</i>, c’est <i>f</i>(<i>x</i>).';
    else m = '<i>f</i>(<i>x</i>) &lt; 0 : l’aire <b class="c-sin">rouge</b> compte en négatif, <i>F</i> <b>descend</b>' + (Fx < 0 ? ' et passe même sous 0 : il y a maintenant plus de rouge que de bleu.' : '.');
    $('msg').innerHTML = m;
    $('x').value = x;
    $('play').textContent = S.playing ? '❚❚ Pause' : '▶ Faire avancer x';
  }

  /* =================== Interface =================== */
  const EXPLAIN = [
    'On cherche l’aire sous la courbe de <i>x</i> ↦ <i>x</i>² entre 0 et 2. On découpe [0 ; 2] en <i>n</i> bandes : les rectangles bleus restent sous la courbe, les rectangles « bleu + rouge » la dépassent. L’aire est coincée entre les deux.',
    'On fait avancer la borne <i>x</i> et on mesure l’aire entre la courbe et l’axe, de 0 à <i>x</i> : comptée en <b>positif</b> au-dessus de l’axe (bleu), en <b>négatif</b> en dessous (rouge). En dessous, on trace cette aire <i>F</i>(<i>x</i>) au fur et à mesure.',
  ];
  const LEGEND = [
    '<span><i class="box" style="background:var(--add);outline:1px solid var(--cos)"></i>somme basse</span><span><i class="box" style="background:var(--sub);outline:1px dashed var(--sin)"></i>ce qu’ajoute la somme haute</span>',
    '<span><i class="box" style="background:rgba(36,99,214,.22)"></i>aire comptée en positif</span><span><i class="box" style="background:rgba(214,69,43,.22)"></i>aire comptée en négatif</span><span><i class="sw" style="background:var(--cos)"></i><em>F</em> monte</span><span><i class="sw" style="background:var(--sin)"></i><em>F</em> descend</span>',
  ];

  function setTab(t) {
    S.tab = t; S.playing = false;
    document.querySelectorAll('#tabs button').forEach((b, k) => b.setAttribute('aria-pressed', k === t));
    $('f1').hidden = t !== 0; $('f2').hidden = t !== 1;
    $('row-n').hidden = t !== 0; $('row-x').hidden = t !== 1;
    $('explain').innerHTML = EXPLAIN[t];
    $('legend').innerHTML = LEGEND[t];
    t === 0 ? draw1() : draw2();
  }
  document.querySelectorAll('#tabs button').forEach((b, k) => (b.onclick = () => setTab(k)));

  $('n').value = S.n;
  $('n').addEventListener('input', e => { S.n = +e.target.value; draw1(); });

  let last = 0;
  function loop(now) {
    if (!S.playing) return;
    S.x = Math.min(XMAX, S.x + ((now - last) / 1000) * 0.85);
    last = now;
    if (S.x >= XMAX) S.playing = false;
    draw2();
    if (S.playing) requestAnimationFrame(loop);
  }
  $('play').onclick = () => {
    S.playing = !S.playing;
    if (S.playing) { if (S.x >= XMAX - 1e-6) S.x = 0; last = performance.now(); requestAnimationFrame(loop); }
    draw2();
  };
  $('x').addEventListener('input', e => { S.playing = false; S.x = +e.target.value; draw2(); });

  setTab(0);
})();
