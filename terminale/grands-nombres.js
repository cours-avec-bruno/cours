(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');
  const K = 20, NMAX = 1000, MU = 3.5, VX = 35 / 12, DUR = 6500;
  const S = { s: 1000, d: 0.5, M: [], playing: false };

  const nOf = s => Math.max(1, Math.min(NMAX, Math.round(Math.pow(10, (3 * s) / 1000))));

  function simulate() {
    S.M = Array.from({ length: K }, () => {
      const m = new Float64Array(NMAX + 1);
      let sum = 0;
      for (let n = 1; n <= NMAX; n++) { sum += 1 + Math.floor(Math.random() * 6); m[n] = sum / n; }
      return m;
    });
  }

  const view = Fig.setup(canvas, { minWidth: 340, height: W => Math.round(Math.min(420, Math.max(330, W * 0.36))) }, () => draw());
  const P = { l: 44, r: 24, t: 26, b: 34 };

  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, n = nOf(S.s), d = S.d;
    const X = k => P.l + (Math.log10(k) / 3) * (W - P.l - P.r);
    const Y = v => P.t + ((6.25 - v) / 5.5) * (H - P.t - P.b);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

    // bande μ ± δ
    ctx.fillStyle = 'rgba(43,147,72,0.12)';
    ctx.fillRect(P.l, Y(MU + d), W - P.l - P.r, Y(MU - d) - Y(MU + d));

    // quadrillage
    ctx.lineWidth = 1;
    for (let v = 1; v <= 6; v++) {
      ctx.strokeStyle = C.line; Fig.seg(ctx, P.l, Y(v), W - P.r, Y(v));
      Fig.label(ctx, String(v), P.l - 8, Y(v), { size: 11, color: C.muted, align: 'right', halo: false });
    }
    for (const k of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) {
      const major = [1, 10, 100, 1000].includes(k);
      ctx.strokeStyle = major ? C.line : '#f1f2f4'; Fig.seg(ctx, X(k), P.t, X(k), H - P.b);
      if (major || W >= 560) Fig.label(ctx, k === 1000 ? '1 000' : String(k), X(k), H - P.b + 14, { size: 11, color: major ? C.muted : C.faint, halo: false });
    }
    Fig.math(ctx, [['n', true]], P.l - 8, H - P.b + 14, { size: 14, color: C.muted, align: 'right', halo: false });
    ctx.save();
    ctx.strokeStyle = C.arc; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.3;
    Fig.seg(ctx, P.l, Y(MU), W - P.r, Y(MU));
    ctx.restore();
    Fig.label(ctx, 'μ = 3,5', W - P.r - 4, Y(MU + d) - 10, { size: 13, color: C.arc, align: 'right', math: true });

    // trajectoires
    ctx.save();
    ctx.strokeStyle = C.cos; ctx.globalAlpha = 0.38; ctx.lineWidth = 1.1; ctx.lineJoin = 'round';
    for (const m of S.M) {
      ctx.beginPath();
      for (let k = 1; k <= n; k++) k === 1 ? ctx.moveTo(X(k), Y(m[k])) : ctx.lineTo(X(k), Y(m[k]));
      ctx.stroke();
    }
    ctx.restore();

    // rang n courant
    ctx.save();
    ctx.strokeStyle = C.text; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    Fig.seg(ctx, X(n), P.t, X(n), H - P.b);
    ctx.restore();
    Fig.math(ctx, [['n', true], ' = ' + Fig.num(n, 0)], X(n) + (X(n) > W - 110 ? -6 : 6), P.t + 2, { size: 13, align: X(n) > W - 110 ? 'right' : 'left' });
    let out = 0;
    for (const m of S.M) {
      const o = Math.abs(m[n] - MU) >= d - 1e-9;
      if (o) out++;
      Fig.dot(ctx, X(n), Y(m[n]), 3.2, o ? C.sin : C.text, false);
    }
    readout(n, out);
  }

  function readout(n, out) {
    const d = S.d, b = VX / (n * d * d);
    $('nv').textContent = Fig.num(n, 0);
    $('dv').textContent = Fig.num(d, 2);
    $('r-out').innerHTML = `<b>${out}</b> / ${K} (${Fig.num((100 * out) / K, 0)} %)`;
    $('r-bt').innerHTML = b >= 1 ? `${Fig.num(b, 2)} ≥ 1` : `<b>${Fig.num(100 * b, 1)} %</b>`;
    $('res').innerHTML = `<i>P</i>(|<i>M</i><sub><i>n</i></sub> − 3,5| ≥ ${Fig.num(d, 2)}) ≤ <span style="white-space:nowrap">35 / (12 × ${Fig.num(n, 0)} × ${Fig.num(d, 2)}²)</span>`;
    $('msg').innerHTML = b >= 1
      ? 'Pour l’instant, la majoration dépasse 1 : elle ne dit rien. Augmente <i>n</i>.'
      : `La majoration garantit qu’au plus ${Fig.num(100 * b, 1)} % des échantillons sortent de la bande ; on en observe ${Fig.num((100 * out) / K, 0)} %.
        Elle est large, mais elle tend vers 0 quand <i>n</i> grandit : même avec une bande très fine, les moyennes finissent par y rester.`;
  }

  let t0 = 0;
  function loop(now) {
    if (!S.playing) return;
    const p = Math.min(1, (now - t0) / DUR);
    S.s = Math.round(1000 * p);
    $('s').value = S.s;
    draw();
    if (p < 1) requestAnimationFrame(loop);
    else { S.playing = false; $('play').disabled = false; }
  }
  $('play').onclick = () => {
    simulate();
    S.playing = true; $('play').disabled = true;
    t0 = performance.now();
    requestAnimationFrame(loop);
  };
  $('s').addEventListener('input', e => { S.playing = false; $('play').disabled = false; S.s = +e.target.value; draw(); });
  $('d').addEventListener('input', e => { S.d = +e.target.value; draw(); });
  $('s').value = S.s; $('d').value = S.d;
  simulate();
  draw();
})();
