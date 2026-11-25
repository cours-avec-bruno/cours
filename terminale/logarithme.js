(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const AMIN = -2.5, AMAX = 1.85;
  const S = { tab: 0, a: 0.7, playing: false, ra: 2, rb: 3 };
  const n2 = x => Fig.num(x, 2);

  /* =================== Onglet 1 : le miroir de exp =================== */
  const v1 = Fig.setup($('fig1'), { minWidth: 340, height: W => Math.round(Math.min(480, Math.max(340, W * 0.42))) }, () => draw1());

  function curve(ctx, f, X, Y, xa, xb, H) {
    ctx.beginPath();
    let pen = false;
    const n = 400;
    for (let i = 0; i <= n; i++) {
      const x = xa + ((xb - xa) * i) / n, y = Y(f(x));
      if (!isFinite(y) || y < -H || y > 2 * H) { pen = false; continue; }
      pen ? ctx.lineTo(X(x), y) : ctx.moveTo(X(x), y);
      pen = true;
    }
    ctx.stroke();
  }

  function draw1() {
    const ctx = v1.ctx, W = v1.W, H = v1.H, P = 24;
    const y0 = -3, y1 = 6.6;
    const u = (H - 2 * P) / (y1 - y0);          // même unité sur les deux axes : sinon pas de miroir
    const span = (W - 2 * P) / u;
    const x0 = Math.max(-5, Math.min(-2.8, 2.2 - span / 2)), x1 = x0 + span;
    const X = v => P + (v - x0) * u, Y = v => P + (y1 - v) * u;
    const a = S.a, b = Math.exp(a);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // quadrillage
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let v = Math.ceil(x0); v <= x1; v++) Fig.seg(ctx, X(v), P, X(v), H - P);
    for (let v = Math.ceil(y0); v <= y1; v++) Fig.seg(ctx, P, Y(v), W - P, Y(v));
    ctx.strokeStyle = C.axis;
    Fig.arrow(ctx, P - 6, Y(0), W - P + 12, Y(0), 6);
    Fig.arrow(ctx, X(0), H - P + 6, X(0), P - 12, 6);
    const st = u < 30 ? 2 : 1;
    for (let v = Math.ceil(x0); v <= x1; v++) if (v && v % st === 0) Fig.label(ctx, String(v).replace('-', '−'), X(v), Y(0) + 13, { size: 11, color: C.muted });
    for (let v = Math.ceil(y0); v <= y1; v++) if (v && v % st === 0) Fig.label(ctx, String(v).replace('-', '−'), X(0) - 7, Y(v), { size: 11, color: C.muted, align: 'right' });

    // miroir y = x
    ctx.save();
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1.4; ctx.setLineDash([7, 6]);
    Fig.seg(ctx, X(Math.max(x0, y0)), Y(Math.max(x0, y0)), X(Math.min(x1, y1)), Y(Math.min(x1, y1)));
    ctx.restore();
    Fig.math(ctx, [['y', true], ' = ', ['x', true]], X(6.2) + 8, Y(6.2) + 14, { size: 14, color: C.muted, align: 'left' });

    // exp
    ctx.strokeStyle = C.cos; ctx.lineWidth = 2.4;
    curve(ctx, Math.exp, X, Y, x0, Math.min(x1, Math.log(y1 + 1)), H);
    Fig.math(ctx, [['y', true], ' = e', ['x', true, 'sup']], X(1.62) - 10, Y(Math.exp(1.62)), { size: 15, color: C.cos, align: 'right' });

    // ln : trait léger partout, trait plein sur la partie déjà « reflétée »
    ctx.save();
    ctx.strokeStyle = C.sin; ctx.globalAlpha = 0.22; ctx.lineWidth = 1.6;
    curve(ctx, Math.log, X, Y, Math.max(1e-4, Math.exp(y0 - 0.5)), x1, H);
    ctx.restore();
    ctx.strokeStyle = C.sin; ctx.lineWidth = 2.4;
    curve(ctx, Math.log, X, Y, Math.exp(AMIN), b, H);
    // étiquette « y = ln x » : on la déplace si elle tombe sur celle de M′
    const mr = X(b) + 130 < W, lab = mr ? [X(b), X(b) + 140] : [X(b) - 140, X(b)];
    let xl = Math.min(x1 - 1.5, 9), dy = 18;
    if (X(xl) + 35 > lab[0] && X(xl) - 35 < lab[1] && Math.abs(Y(a) - Y(Math.log(xl))) < 24) { xl = 1.6; dy = -16; }
    Fig.math(ctx, [['y', true], ' = ln ', ['x', true]], X(xl), Y(Math.log(xl)) + dy, { size: 15, color: C.sin });

    // M, M′ et le segment perpendiculaire au miroir
    const m = (a + b) / 2;
    ctx.save();
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
    Fig.seg(ctx, X(a), Y(b), X(b), Y(a));
    ctx.restore();
    if (Math.abs(b - a) * u > 22) {          // petit angle droit sur le miroir
      const k = 7 / u / Math.SQRT2;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(m - k), Y(m + k)); ctx.lineTo(X(m), Y(m + 2 * k)); ctx.lineTo(X(m + k), Y(m + k));
      ctx.stroke();
    }
    Fig.dot(ctx, X(a), Y(b), 6, C.cos);
    Fig.dot(ctx, X(b), Y(a), 6, C.sin);
    const ml = X(a) - 120 > 0;
    Fig.label(ctx, `M(${n2(a)} ; ${n2(b)})`, X(a) + (ml ? -10 : 10), Y(b) - 14, { size: 13, color: C.cos, align: ml ? 'right' : 'left', weight: '600' });
    Fig.label(ctx, `M′(${n2(b)} ; ${n2(a)})`, X(b) + (mr ? 10 : -10), Y(a) + 16, { size: 13, color: C.sin, align: mr ? 'left' : 'right', weight: '600' });

    if (S.tab === 0) readout1();
  }

  function readout1() {
    const a = S.a, b = Math.exp(a);
    $('res').innerHTML = `e<sup>${n2(a)}</sup> ≈ <b class="c-cos">${n2(b)}</b> &nbsp;⇔&nbsp; ln ${n2(b)} ≈ <b class="c-sin">${n2(a)}</b>`;
    let m;
    if (Math.abs(a) < 0.03) m = 'e<sup>0</sup> = 1, donc <b>ln 1 = 0</b> : la courbe de ln coupe l’axe des abscisses en 1.';
    else if (Math.abs(a - 1) < 0.03) m = 'e<sup>1</sup> = e ≈ 2,72, donc <b>ln e = 1</b>.';
    else if (a < 0) m = `Ici <i>a</i> &lt; 0, donc e<sup><i>a</i></sup> est entre 0 et 1 : le ln d’un nombre entre 0 et 1 est <b>négatif</b>.
      Plus M s’écrase sur l’axe des abscisses, plus M′ plonge le long de l’axe des ordonnées.`;
    else m = 'M′ a les coordonnées de M <b>échangées</b> : c’est son symétrique par rapport à la droite <i>y</i> = <i>x</i>. exp monte de plus en plus vite, ln de plus en plus lentement.';
    $('msg').innerHTML = m;
    $('av').textContent = n2(a);
    $('a').value = a;
    $('play').textContent = S.playing ? '❚❚ Pause' : '▶ Faire glisser M';
  }

  /* =================== Onglet 2 : la règle à calcul =================== */
  const v2 = Fig.setup($('fig2'), { minWidth: 600, height: () => 236 }, () => draw2());

  function bracket(ctx, xa, xb, y, dir, color) {
    if (xb - xa < 2) return;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xa, y - dir * 6); ctx.lineTo(xa, y); ctx.lineTo(xb, y); ctx.lineTo(xb, y - dir * 6);
    ctx.stroke();
  }

  function draw2() {
    const ctx = v2.ctx, W = v2.W, H = v2.H;
    const L = 30, R = 30, s = (W - L - R) / Math.log(100);
    const X = d => L + d * s;                 // position d’une distance d (= ln x)
    const a = S.ra, b = S.rb, ab = a * b;
    const ym = 98, rh = 48;                    // jonction des deux réglettes, hauteur d’une réglette
    const off = Math.log(a);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

    // réglette du bas (fixe) : 1 → 100
    ctx.fillStyle = C.soft; ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.fillRect(X(0) - 12, ym, X(Math.log(100)) - X(0) + 24, rh);
    ctx.strokeRect(X(0) - 12 + 0.5, ym + 0.5, X(Math.log(100)) - X(0) + 24, rh);
    // réglette du haut (mobile) : 1 → 10, décalée de ln a
    ctx.fillStyle = '#eef3fc';
    ctx.fillRect(X(off) - 12, ym - rh, X(Math.log(10)) - X(0) + 24, rh);
    ctx.strokeRect(X(off) - 12 + 0.5, ym - rh + 0.5, X(Math.log(10)) - X(0) + 24, rh);

    // graduations
    const ticks = (vals, base, dir, sh) => {
      let lastX = -1e9;
      for (const [v, major] of vals) {
        const x = X(Math.log(v) + sh), len = major ? 13 : 7;
        ctx.strokeStyle = major ? C.text : C.faint; ctx.lineWidth = 1;
        Fig.seg(ctx, x, base, x, base + dir * len);
        if (major && x - lastX > 20) {
          Fig.label(ctx, Fig.num(v), x, base + dir * 24, { size: 11, color: C.text });
          lastX = x;
        }
      }
    };
    const bottom = [], top = [];
    for (let v = 1; v <= 10; v += 0.5) { top.push([v, Number.isInteger(v)]); if (v < 10) bottom.push([v, Number.isInteger(v)]); }
    for (let v = 10; v <= 100; v += 5) bottom.push([v, v % 10 === 0]);
    // le 1 du haut en face de a ; b en face de a × b
    const xab = X(off + Math.log(b));
    ctx.save();
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.cos; Fig.seg(ctx, X(off), ym - rh - 4, X(off), ym + rh + 4);
    ctx.setLineDash([]);
    ctx.strokeStyle = C.arc; Fig.seg(ctx, xab, ym - rh - 4, xab, ym + rh + 8);
    ctx.restore();
    ticks(bottom, ym, 1, 0);
    ticks(top, ym, -1, off);
    const right = xab > W - 130;
    Fig.label(ctx, `a × b = ${Fig.num(ab, 2)}`, xab + (right ? -6 : 6), ym + rh + 16, { size: 13, color: C.arc, weight: '600', align: right ? 'right' : 'left' });

    // longueurs : ln b (sur la réglette du haut), ln a puis ln(ab) (sous la réglette du bas)
    const yt = ym - rh - 16, yb1 = ym + rh + 16, yb2 = ym + rh + 54;
    bracket(ctx, X(off), X(off + Math.log(b)), yt, -1, C.sin);
    if (X(Math.log(b)) - X(0) > 40) Fig.label(ctx, `ln ${Fig.num(b)} ≈ ${Fig.fixed(Math.log(b), 3)}`, (X(off) + X(off + Math.log(b))) / 2, yt - 12, { size: 13, color: C.sin, math: true });
    bracket(ctx, X(0), X(off), yb1, 1, C.cos);
    if (X(off) - X(0) > 40) Fig.label(ctx, `ln ${Fig.num(a)} ≈ ${Fig.fixed(off, 3)}`, (X(0) + X(off)) / 2, yb1 + 13, { size: 13, color: C.cos, math: true });
    bracket(ctx, X(0), X(Math.log(ab)), yb2, 1, C.arc);
    if (ab > 1.001) {
      const xm = (X(0) + X(Math.log(ab))) / 2;
      Fig.label(ctx, `ln(${Fig.num(a)} × ${Fig.num(b)}) = ln ${Fig.num(ab, 2)} ≈ ${Fig.fixed(Math.log(ab), 3)}`, Math.max(xm, L + 120), yb2 + 13, { size: 13, color: C.arc, math: true });
    }

    if (S.tab === 1) readout2();
  }

  function readout2() {
    const a = S.ra, b = S.rb, ab = a * b;
    const la = Math.log(a), lb = Math.log(b);
    $('res').innerHTML = `ln(${Fig.num(a)} × ${Fig.num(b)}) = <span class="c-cos">ln ${Fig.num(a)}</span> + <span class="c-sin">ln ${Fig.num(b)}</span><br>
      <span class="c-arc">${Fig.fixed(la + lb, 3)}</span> ≈ <span class="c-cos">${Fig.fixed(la, 3)}</span> + <span class="c-sin">${Fig.fixed(lb, 3)}</span>`;
    $('msg').innerHTML = `Chaque nombre <i>x</i> est gravé à la distance ln <i>x</i> du 1. On pose la longueur ln ${Fig.num(b)} au bout de la longueur ln ${Fig.num(a)} :
      on tombe sur <b class="c-arc">${Fig.num(ab, 2)} = ${Fig.num(a)} × ${Fig.num(b)}</b>. Additionner les ln, c’est multiplier les nombres
      (c’est comme ça qu’on calculait avant les calculatrices).`;
    $('rav').textContent = Fig.num(a); $('rbv').textContent = Fig.num(b);
  }

  /* =================== Interface =================== */
  const EXPLAIN = [
    'On prend un point M(<i>a</i> ; e<sup><i>a</i></sup>) sur la courbe de exp et on <b>échange ses coordonnées</b> : on obtient M′(e<sup><i>a</i></sup> ; <i>a</i>), qui est sur la courbe de ln. Fais glisser M : M′ dessine la courbe de ln, reflet de exp dans le miroir <i>y</i> = <i>x</i>.',
    'Une règle à calcul : sur chaque réglette, le nombre <i>x</i> est gravé à la distance ln <i>x</i> du 1. On fait glisser la réglette du haut pour placer son 1 en face de <i>a</i>, puis on lit, en face de <i>b</i>, le produit <i>a</i> × <i>b</i>.',
  ];
  const LEGEND = [
    '<span><i class="sw" style="background:var(--cos)"></i>courbe de exp</span><span><i class="sw" style="background:var(--sin)"></i>courbe de ln</span><span><i class="sw" style="background:repeating-linear-gradient(90deg,var(--faint) 0 5px,transparent 5px 9px)"></i>miroir <em>y</em> = <em>x</em></span>',
    '<span><i class="sw" style="background:var(--cos)"></i>ln <em>a</em></span><span><i class="sw" style="background:var(--sin)"></i>ln <em>b</em></span><span><i class="sw" style="background:var(--arc)"></i>ln(<em>a</em> × <em>b</em>), où l’on lit le produit</span>',
  ];

  function setTab(t) {
    S.tab = t; S.playing = false;
    document.querySelectorAll('#tabs button').forEach((b, k) => b.setAttribute('aria-pressed', k === t));
    $('f1').hidden = t !== 0; $('f2').hidden = t !== 1;
    $('row-play').hidden = $('row-a').hidden = t !== 0;
    $('row-ra').hidden = $('row-rb').hidden = t !== 1;
    $('explain').innerHTML = EXPLAIN[t];
    $('legend').innerHTML = LEGEND[t];
    t === 0 ? draw1() : draw2();
  }
  document.querySelectorAll('#tabs button').forEach((b, k) => (b.onclick = () => setTab(k)));

  let last = 0;
  function loop(now) {
    if (!S.playing) return;
    S.a = Math.min(AMAX, S.a + ((now - last) / 1000) * 0.85);
    last = now;
    if (S.a >= AMAX) S.playing = false;
    draw1();
    if (S.playing) requestAnimationFrame(loop);
  }
  $('play').onclick = () => {
    S.playing = !S.playing;
    if (S.playing) { if (S.a >= AMAX - 1e-6) S.a = AMIN; last = performance.now(); requestAnimationFrame(loop); }
    draw1();
  };
  $('a').addEventListener('input', e => { S.playing = false; S.a = +e.target.value; draw1(); });
  $('ra').value = S.ra; $('rb').value = S.rb;
  $('ra').addEventListener('input', e => { S.ra = +e.target.value; draw2(); });
  $('rb').addEventListener('input', e => { S.rb = +e.target.value; draw2(); });

  setTab(0);
})();
