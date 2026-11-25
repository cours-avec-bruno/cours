(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');

  const f = x => x ** 3 - 3 * x;
  const d1 = x => 3 * x * x - 3;
  const d2 = x => 6 * x;
  const S = { a: 1.2, playing: false };
  const EPS = 0.02; // autour de 0 : point d’inflexion

  const view = Fig.setup(canvas, { minWidth: 340, height: W => (W < 640 ? 470 : 540) }, () => draw());
  const x0 = -2.3, x1 = 2.3;
  const RED = 'rgba(214,69,43,0.05)', BLUE = 'rgba(36,99,214,0.05)';

  /* Un panneau = une fenêtre [x0 ; x1] × [y0 ; y1] dans un rectangle du canvas. */
  function panel(top, h, y0, y1, W) {
    const l = 34, r = 20;
    return {
      top, h, y0, y1, l, r,
      X: v => l + ((v - x0) / (x1 - x0)) * (W - l - r),
      Y: v => top + ((y1 - v) / (y1 - y0)) * h,
    };
  }

  function frame(ctx, p, W, ystep) {
    const { X, Y, top, h } = p;
    // fonds concave / convexe
    ctx.fillStyle = RED; ctx.fillRect(X(x0), top, X(0) - X(x0), h);
    ctx.fillStyle = BLUE; ctx.fillRect(X(0), top, X(x1) - X(0), h);
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let v = -2; v <= 2; v++) Fig.seg(ctx, X(v), top, X(v), top + h);
    for (let v = Math.ceil(p.y0 / ystep) * ystep; v <= p.y1; v += ystep) Fig.seg(ctx, X(x0), Y(v), X(x1), Y(v));
    ctx.strokeStyle = C.axis;
    Fig.seg(ctx, X(x0), Y(0), X(x1), Y(0));
    Fig.seg(ctx, X(0), top, X(0), top + h);
    for (let v = Math.ceil(p.y0 / ystep) * ystep; v <= p.y1; v += ystep) {
      if (v !== 0) Fig.label(ctx, Fig.num(v), X(0) - 5, Y(v), { size: 11, color: C.muted, align: 'right', halo: false });
    }
  }

  function curve(ctx, p, g) {
    for (const [lo, hi, col] of [[x0, 0, C.sin], [0, x1, C.cos]]) {
      ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = lo + ((hi - lo) * i) / 200;
        i ? ctx.lineTo(p.X(x), p.Y(g(x))) : ctx.moveTo(p.X(x), p.Y(g(x)));
      }
      ctx.stroke();
    }
  }

  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, a = S.a;
    const gap = 30, h2 = Math.round((H - gap - 24) * 0.33), h1 = H - gap - 24 - h2;
    const top = panel(12, h1, -4.6, 4.6, W), bot = panel(12 + h1 + gap, h2, -5.5, 13.5, W);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // ---- en haut : la courbe et la tangente
    frame(ctx, top, W, 2);
    Fig.label(ctx, 'concave', top.X(-1.15), top.top + 14, { size: 13, color: C.sin, weight: '600' });
    Fig.label(ctx, 'convexe', top.X(1.15), top.top + 14, { size: 13, color: C.cos, weight: '600' });
    ctx.save();
    ctx.beginPath(); ctx.rect(top.X(x0), top.top, top.X(x1) - top.X(x0), top.h); ctx.clip();
    curve(ctx, top, f);
    // tangente
    const t = x => d1(a) * (x - a) + f(a);
    ctx.strokeStyle = C.arc; ctx.lineWidth = 2;
    Fig.seg(ctx, top.X(x0), top.Y(t(x0)), top.X(x1), top.Y(t(x1)));
    ctx.restore();
    Fig.math(ctx, [['y', true], ' = ', ['f', true], '(', ['x', true], ')'], top.X(1.85), top.Y(f(1.85)), { size: 14, align: 'right' });
    // point d’inflexion
    ctx.beginPath(); ctx.arc(top.X(0), top.Y(0), 6.5, 0, Math.PI * 2);
    ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.stroke();
    // point A
    Fig.dot(ctx, top.X(a), top.Y(f(a)), 5.5, C.text);
    Fig.math(ctx, [['A', true]], top.X(a) + (a < 0 ? -12 : 12), top.Y(f(a)) + (Math.abs(a) < 0.6 ? 14 : -14), { size: 15 });

    // ---- en bas : la pente
    frame(ctx, bot, W, 4);
    ctx.save();
    ctx.beginPath(); ctx.rect(bot.X(x0), bot.top, bot.X(x1) - bot.X(x0), bot.h); ctx.clip();
    curve(ctx, bot, d1);
    ctx.restore();
    Fig.math(ctx, ['pente : ', ['y', true], ' = ', ['f', true], ' ′(', ['x', true], ')'], bot.X(x0) + 8, bot.top + 12, { size: 14, align: 'left', color: C.muted });

    // lien entre A et sa pente
    ctx.save();
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    Fig.seg(ctx, top.X(a), top.Y(f(a)), top.X(a), bot.Y(d1(a)));
    ctx.restore();
    Fig.dot(ctx, bot.X(a), bot.Y(d1(a)), 5.5, C.arc);
    Fig.math(ctx, [['a', true]], top.X(a) + 9, top.top + top.h + gap / 2, { size: 14, color: C.muted, align: 'left' });

    readout();
  }

  function readout() {
    const a = S.a, p = d1(a), s = d2(a);
    $('av').textContent = Fig.fixed(a, 2);
    $('r1').innerHTML = `<b>${Fig.fixed(p, 2)}</b>`;
    const infl = Math.abs(a) < EPS;
    $('r2').innerHTML = infl ? '<b>0</b>' : `<b style="color:${s > 0 ? 'var(--cos)' : 'var(--sin)'}">${Fig.fixed(s, 2)}</b> (${s > 0 ? 'positif' : 'négatif'})`;
    if (infl) {
      $('res').innerHTML = '<b>point d’inflexion</b>';
      $('msg').innerHTML = 'En O, la tangente <b>traverse</b> la courbe. <i>f</i> ″ s’annule en changeant de signe : la pente arrête de diminuer et se met à augmenter (<i>f</i> ′ est minimale en 0).';
    } else if (a < 0) {
      $('res').innerHTML = '<b class="c-sin">concave</b>';
      $('msg').innerHTML = 'La courbe est <b>en dessous</b> de sa tangente. En avançant, la tangente tourne dans le <b>sens des aiguilles d’une montre</b> : sa pente <i>f</i> ′(<i>a</i>) diminue, donc <i>f</i> ″(<i>a</i>) ≤ 0.';
    } else {
      $('res').innerHTML = '<b class="c-cos">convexe</b>';
      $('msg').innerHTML = 'La courbe est <b>au-dessus</b> de sa tangente. En avançant, la tangente tourne dans le <b>sens inverse des aiguilles d’une montre</b> : sa pente <i>f</i> ′(<i>a</i>) augmente, donc <i>f</i> ″(<i>a</i>) ≥ 0.';
    }
  }

  function setA(a) { S.a = Math.abs(a) < EPS ? 0 : a; $('a').value = a; }
  const PLAY = '▶ Faire glisser la tangente';
  let last = 0;
  function loop(now) {
    if (!S.playing) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (S.hold > 0) S.hold -= dt; // petite pause au point d’inflexion
    else {
      const prev = S.raw;
      S.raw = Math.min(2, S.raw + dt * 0.65);
      if (prev < 0 && S.raw >= 0) { S.raw = 0; S.hold = 1.4; }
    }
    setA(S.raw);
    if (S.raw >= 2) { S.playing = false; $('play').textContent = PLAY; }
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  function stop() { S.playing = false; $('play').textContent = PLAY; }
  $('play').onclick = () => {
    if (S.playing) { stop(); return; }
    S.raw = -2; S.hold = 0; setA(-2);
    S.playing = true; $('play').textContent = '■ Arrêter';
    last = performance.now();
    requestAnimationFrame(loop);
  };
  $('a').addEventListener('input', e => { stop(); setA(+e.target.value); draw(); });

  setA(S.a);
  draw();
})();
