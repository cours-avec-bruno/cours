(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');
  const MAXN = 5000;

  const CASES = [
    { name: '1/n', html: '<i>u</i><sub><i>n</i></sub> = 1/<i>n</i>', u: n => 1 / n, n0: 1, L: 0, y: [-0.15, 1.1],
      txt: 'Les termes diminuent et se rapprochent de 0, sans jamais l’atteindre.' },
    { name: '2 + (−1)ⁿ/n', html: '<i>u</i><sub><i>n</i></sub> = 2 + (−1)<sup><i>n</i></sup>/<i>n</i>', u: n => 2 + (-1) ** n / n, n0: 1, L: 2, y: [0.85, 2.65],
      txt: 'Les termes sautent au-dessus puis en dessous de 2, mais les sauts sont de plus en plus petits.' },
    { name: '3 − 2 × 0,8ⁿ', html: '<i>u</i><sub><i>n</i></sub> = 3 − 2 × 0,8<sup><i>n</i></sup>', u: n => 3 - 2 * 0.8 ** n, n0: 0, L: 3, y: [0.8, 3.3],
      txt: 'Les termes montent et se rapprochent de 3, car 0,8<sup><i>n</i></sup> devient minuscule.' },
    { name: '√n', html: '<i>u</i><sub><i>n</i></sub> = √<i>n</i>', u: n => Math.sqrt(n), n0: 0, L: Infinity, y: null,
      txt: 'Les termes grandissent sans s’arrêter, lentement mais sans limite : ils dépassent n’importe quel nombre.' },
    { name: '(−1)ⁿ', html: '<i>u</i><sub><i>n</i></sub> = (−1)<sup><i>n</i></sup>', u: n => (-1) ** n, n0: 0, L: null, y: [-1.6, 1.6],
      txt: 'Les termes valent 1, −1, 1, −1… Essaie de trouver une limite ℓ qui marche.' },
  ];
  const S = { c: 0, p: 300, l: 1 };

  const cs = () => CASES[S.c];
  const eps = () => Math.pow(10, -2.5 * (S.p / 1000)) * 0.6; // 0,6 → 0,002
  const thr = () => 1 + (S.p / 1000) * 24;                 // seuil A de 1 à 25
  const L = () => (cs().L === null ? S.l : cs().L);
  const inside = v => (cs().L === Infinity ? v > thr() : Math.abs(v - L()) < eps());

  /* Rang à partir duquel tous les termes vérifient la condition (null s’il n’existe pas). */
  function rankN() {
    let lastFail = cs().n0 - 1;
    for (let n = cs().n0; n <= MAXN; n++) if (!inside(cs().u(n))) lastFail = n;
    return lastFail >= MAXN - 2 ? null : lastFail + 1;
  }

  const view = Fig.setup(canvas, { minWidth: 600, height: W => Math.round(Math.min(420, Math.max(320, W * 0.36))) }, () => draw());
  const P = { l: 56, r: 20, t: 22, b: 36 };

  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, c = cs(), N = rankN();
    const nMax = c.L === null ? 30 : Math.min(800, Math.max(30, Math.ceil((N ?? 30) * 1.25)));
    let [lo, hi] = c.y || [0, Math.max(Math.sqrt(nMax), thr()) * 1.12];
    const X = n => P.l + ((n - c.n0 + 0.5) / (nMax - c.n0 + 1)) * (W - P.l - P.r);
    const Y = v => P.t + ((hi - v) / (hi - lo)) * (H - P.t - P.b);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

    // quadrillage horizontal
    const st = Fig.niceStep(hi - lo, 6);
    for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) {
      ctx.strokeStyle = Math.abs(v) < 1e-9 ? C.axis : C.line; ctx.lineWidth = 1;
      Fig.seg(ctx, P.l, Y(v), W - P.r, Y(v));
      Fig.label(ctx, Fig.num(v, 2), P.l - 8, Y(v), { size: 11, color: C.muted, align: 'right', halo: false });
    }
    // graduations n
    const nst = Fig.niceStep(nMax - c.n0, 10);
    for (let n = Math.ceil(c.n0 / nst) * nst; n <= nMax; n += nst) {
      Fig.label(ctx, String(n), X(n), H - P.b + 16, { size: 11, color: C.muted, halo: false });
    }
    Fig.math(ctx, [['n', true]], P.l - 8, H - P.b + 16, { size: 14, color: C.muted, align: 'right', halo: false });

    // bande ou seuil
    ctx.save();
    ctx.fillStyle = 'rgba(43,147,72,0.09)';
    if (c.L === Infinity) {
      ctx.fillRect(P.l, P.t, W - P.l - P.r, Y(thr()) - P.t);
      ctx.strokeStyle = C.arc; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.3;
      Fig.seg(ctx, P.l, Y(thr()), W - P.r, Y(thr()));
      ctx.restore();
      Fig.math(ctx, [['A', true], ' = ' + Fig.num(thr(), 1)], W - P.r - 6, Y(thr()) + 12, { size: 13, color: C.arc, align: 'right' });
    } else {
      const e = eps(), l = L();
      ctx.fillRect(P.l, Y(l + e), W - P.l - P.r, Math.max(1, Y(l - e) - Y(l + e)));
      ctx.strokeStyle = C.arc; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.3;
      Fig.seg(ctx, P.l, Y(l), W - P.r, Y(l));
      ctx.restore();
      Fig.label(ctx, 'ℓ = ' + Fig.num(l, 2), P.l + 6, Y(l) - 10, { size: 13, color: C.arc, align: 'left', math: true });
    }

    // rang N
    if (N !== null && N > c.n0) {
      ctx.save();
      ctx.strokeStyle = C.text; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      const xn = X(N) - (X(1) - X(0)) / 2;
      Fig.seg(ctx, xn, P.t, xn, H - P.b);
      ctx.restore();
      Fig.math(ctx, [['N', true], ' = ' + N], xn + 6, P.t + 10, { size: 13, align: 'left' });
    }

    // termes
    const r = nMax > 300 ? 1.4 : nMax > 150 ? 1.8 : nMax > 60 ? 2.5 : 3.5;
    for (let n = c.n0; n <= nMax; n++) {
      const v = c.u(n), y = Y(v);
      if (y < P.t - 4 || y > H - P.b + 4) continue;
      const ok = inside(v), after = N !== null && n >= N;
      ctx.beginPath(); ctx.arc(X(n), y, r, 0, Math.PI * 2);
      ctx.fillStyle = after ? C.text : ok ? C.faint : C.sin;
      ctx.fill();
    }

    readout(N);
  }

  function readout(N) {
    const c = cs();
    if (c.L === Infinity) {
      $('res').innerHTML = N === null ? 'Aucun rang ne marche' : `À partir du rang <i>N</i> = <b>${N}</b>, <i>u</i><sub><i>n</i></sub> &gt; ${Fig.num(thr(), 1)}`;
      $('msg').innerHTML = 'Monte le seuil <i>A</i> : <i>N</i> grandit, mais on trouve toujours un rang à partir duquel tous les termes passent au-dessus. C’est ça, lim <i>u</i><sub><i>n</i></sub> = +∞.';
    } else if (N === null) {
      $('res').innerHTML = 'Aucun rang ne marche';
      $('msg').innerHTML = `Avec ℓ = ${Fig.num(L(), 1)} et une bande de largeur ${Fig.num(eps(), 3)} de chaque côté, il reste toujours des termes dehors (en rouge), aussi loin qu’on aille.
        Aucune valeur de ℓ ne fonctionne quand la bande est fine : la suite <b>n’a pas de limite</b>.`;
    } else {
      $('res').innerHTML = `À partir du rang <i>N</i> = <b>${N}</b>, tous les termes sont dans la bande`;
      $('msg').innerHTML = c.L === null
        ? 'La bande est assez large pour contenir les deux valeurs : resserre-la et regarde ce qui se passe.'
        : `Bande ]${Fig.num(L() - eps(), 3)} ; ${Fig.num(L() + eps(), 3)}[. Resserre-la : <i>N</i> grandit, mais on en trouve toujours un. C’est ça, lim <i>u</i><sub><i>n</i></sub> = ${Fig.num(c.L)}.`;
    }
    $('pv').textContent = c.L === Infinity ? Fig.num(thr(), 1) : '± ' + Fig.num(eps(), 3);
  }

  function setCase(i) {
    S.c = i;
    const c = cs();
    document.querySelectorAll('#cases .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    $('explain').innerHTML = `<span class="mx">${c.html}</span> — ${c.txt}`;
    $('plabel').innerHTML = c.L === Infinity ? 'Seuil <em>A</em>' : 'Largeur de la bande';
    $('row-l').hidden = c.L !== null;
    $('legend').innerHTML = c.L === Infinity
      ? '<span><i class="box" style="background:rgba(43,147,72,.15)"></i>au-dessus du seuil</span><span><i class="box" style="background:var(--sin);border-radius:50%"></i>termes encore en dessous</span>'
      : '<span><i class="box" style="background:rgba(43,147,72,.15)"></i>bande autour de ℓ</span><span><i class="box" style="background:var(--sin);border-radius:50%"></i>termes hors de la bande</span><span><i class="box" style="background:var(--text);border-radius:50%"></i>termes à partir du rang N</span>';
    draw();
  }

  $('cases').innerHTML = CASES.map(c => `<button class="chip">${c.name}</button>`).join('');
  document.querySelectorAll('#cases .chip').forEach((b, k) => (b.onclick = () => setCase(k)));
  $('p').value = S.p; $('l').value = S.l; $('lv').textContent = Fig.num(S.l, 1);
  $('p').addEventListener('input', e => { S.p = +e.target.value; draw(); });
  $('l').addEventListener('input', e => { S.l = +e.target.value; $('lv').textContent = Fig.num(S.l, 1); draw(); });
  setCase(0);
})();
