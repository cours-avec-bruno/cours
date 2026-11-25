(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');
  const S = { n: 8, p: 0.5, counts: [], total: 0, balls: [], queue: 0, last: null, sum: 0 };
  const SEG = 150, GAP = 75; // ms par rangée, ms entre deux billes

  const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
  const prob = k => binom(S.n, k) * Math.pow(S.p, k) * Math.pow(1 - S.p, S.n - k);
  const bn = (n, k) => `<span class="bn"><span><span>${n}</span><span>${k}</span></span></span>`;

  const view = Fig.setup(canvas, { minWidth: 360, height: W => Math.round(Math.min(500, Math.max(440, W * 0.42))) }, () => draw());

  function geo() {
    const W = view.W, H = view.H, n = S.n;
    const dx = Math.min(58, (W - 90) / (n + 1));
    const top = 34, dy = Math.min(dx * 0.62, Math.min(230, H * 0.46) / n), boardH = dy * n;
    const binTop = top + boardH + 16, base = H - 30;
    return { W, H, n, dx, dy, top, binTop, base, cx: W / 2 };
  }
  const pegX = (g, i, j) => g.cx + (j - i / 2) * g.dx;
  const pegY = (g, i) => g.top + 14 + i * g.dy;
  const binX = (g, k) => g.cx + (k - g.n / 2) * g.dx;

  /* Points de passage d’une bille : départ, chaque clou, entrée de la case. */
  function waypoints(g, path) {
    const pts = [[g.cx, g.top - 14]];
    let j = 0;
    for (let i = 0; i < g.n; i++) { pts.push([pegX(g, i, j), pegY(g, i) - 6]); j += path[i]; }
    pts.push([binX(g, j), g.binTop + 4]);
    return pts;
  }
  function posAt(pts, t) { // t en nombre de segments parcourus
    const i = Math.min(pts.length - 2, Math.floor(t)), s = Math.min(1, t - i);
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    return [x0 + (x1 - x0) * s, y0 + (y1 - y0) * s * s];
  }

  function reset() {
    S.counts = Array(S.n + 1).fill(0); S.total = 0; S.balls = []; S.queue = 0; S.last = null; S.sum = 0;
    $('play').disabled = false;
  }

  function draw() {
    const ctx = view.ctx, g = geo(), { W, H, n, dx } = g;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

    // numéros des épreuves
    const xl = binX(g, 0) - dx * 0.9;
    Fig.label(ctx, 'épreuve', xl, g.top - 4, { size: 11, color: C.faint, align: 'right', halo: false });
    for (let i = 0; i < n; i++) Fig.label(ctx, String(i + 1), xl, pegY(g, i), { size: 11, color: C.faint, align: 'right', halo: false });

    // chemin de la dernière bille
    if (S.last) {
      const pts = waypoints(g, S.last.path);
      ctx.save(); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let i = 1; i < pts.length - 1; i++) {
        ctx.strokeStyle = S.last.path[i - 1] ? C.arc : C.sin;
        Fig.seg(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      }
      ctx.strokeStyle = C.faint; ctx.lineWidth = 1.2;
      Fig.seg(ctx, pts[0][0], pts[0][1], pts[1][0], pts[1][1]);
      ctx.restore();
    }

    // clous
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      ctx.beginPath(); ctx.arc(pegX(g, i, j), pegY(g, i), 3, 0, Math.PI * 2);
      ctx.fillStyle = C.muted; ctx.fill();
    }

    // cases
    const P = Array.from({ length: n + 1 }, (_, k) => prob(k));
    const F = S.counts.map(c => (S.total ? c / S.total : 0));
    const hmax = Math.max(...P, ...F) * 1.12;
    const hh = g.base - g.binTop - 18;
    const bh = v => (v / hmax) * hh;
    ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    for (let k = 0; k <= n + 1; k++) Fig.seg(ctx, binX(g, k) - dx / 2, g.binTop, binX(g, k) - dx / 2, g.base);
    ctx.strokeStyle = C.axis;
    Fig.seg(ctx, binX(g, 0) - dx / 2, g.base, binX(g, n) + dx / 2, g.base);
    const bw = dx * 0.62;
    for (let k = 0; k <= n; k++) {
      const x = binX(g, k);
      if (F[k] > 0) {
        ctx.fillStyle = C.add; ctx.fillRect(x - bw / 2, g.base - bh(F[k]), bw, bh(F[k]));
        ctx.strokeStyle = C.cos; ctx.lineWidth = 1; ctx.strokeRect(x - bw / 2 + 0.5, g.base - bh(F[k]) + 0.5, bw - 1, bh(F[k]) - 1);
      }
      ctx.strokeStyle = C.text; ctx.lineWidth = 1.4;
      ctx.strokeRect(x - bw / 2, g.base - bh(P[k]), bw, bh(P[k]));
      const hit = S.last && S.last.k === k;
      Fig.label(ctx, String(k), x, g.base + 14, { size: 12, color: hit ? C.text : C.muted, weight: hit ? '600' : '', halo: false });
    }
    Fig.math(ctx, [['k', true], ' ='], binX(g, 0) - dx / 2 - 6, g.base + 14, { size: 13, color: C.muted, align: 'right', halo: false });

    // billes en vol
    for (const b of S.balls) {
      const [x, y] = posAt(b.pts, b.t);
      Fig.dot(ctx, x, y, 4.2, C.cos);
    }
  }

  function readout() {
    const n = S.n, p = S.p;
    $('r-nb').textContent = S.total;
    $('r-e').innerHTML = `<b>${Fig.num(n * p, 2)}</b>`;
    $('r-s').innerHTML = `≈ <b>${Fig.num(Math.sqrt(n * p * (1 - p)), 2)}</b>`;
    $('r-m').innerHTML = S.total ? `≈ ${Fig.num(S.sum / S.total, 2)}` : '—';
    if (!S.last) {
      $('msg').innerHTML = 'Les contours noirs montrent les probabilités théoriques. Lâche des billes : l’histogramme bleu va s’en approcher.';
      return;
    }
    const { path, k } = S.last;
    const seq = path.map(s => (s ? '<span class="s">S</span>' : '<span class="e">E</span>')).join(' ');
    $('msg').innerHTML = `Dernière bille : <span class="path">${seq}</span> → <b>${k}</b> succès, case ${k}.<br>
      Ce chemin est l’un des ${bn(n, k)} = ${binom(n, k)} chemins menant à la case ${k}, chacun de probabilité
      ${Fig.num(p, 2)}<sup>${k}</sup> × ${Fig.num(1 - p, 2)}<sup>${n - k}</sup>. Donc <i>P</i>(<i>X</i> = ${k}) ≈ <b>${Fig.num(prob(k), 3)}</b>.`;
  }

  let looping = false, last = 0, spawnAcc = 0;
  function loop(now) {
    const dt = Math.min(50, now - last); last = now;
    const g = geo();
    spawnAcc += dt;
    while (S.queue > 0 && spawnAcc >= GAP) {
      spawnAcc -= GAP; S.queue--;
      const path = Array.from({ length: S.n }, () => (Math.random() < S.p ? 1 : 0));
      S.balls.push({ path, k: path.reduce((a, b) => a + b, 0), t: 0, pts: waypoints(g, path) });
    }
    for (const b of S.balls) b.t += dt / SEG;
    const landed = S.balls.filter(b => b.t >= b.pts.length - 1);
    for (const b of landed) { S.counts[b.k]++; S.total++; S.sum += b.k; S.last = b; }
    if (landed.length) { S.balls = S.balls.filter(b => b.t < b.pts.length - 1); readout(); }
    draw();
    if (S.queue > 0 || S.balls.length) requestAnimationFrame(loop);
    else { looping = false; $('play').disabled = false; }
  }

  $('play').onclick = () => {
    S.queue += 100;
    $('play').disabled = true;
    if (!looping) { looping = true; last = performance.now(); spawnAcc = GAP; requestAnimationFrame(loop); }
  };
  function onParam() {
    S.n = +$('n').value; S.p = +$('p').value;
    $('nv').textContent = S.n; $('pv').textContent = Fig.num(S.p, 2);
    reset(); readout(); draw();
  }
  $('n').value = S.n; $('p').value = S.p;
  $('n').addEventListener('input', onParam);
  $('p').addEventListener('input', onParam);
  onParam();
})();
