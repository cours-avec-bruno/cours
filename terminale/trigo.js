(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const PI = Math.PI, XMIN = -PI, XMAX = 2 * PI;

  const FNS = [
    { name: 'sinus', f: Math.sin, fl: 'sin', dl: 'cos', d: Math.cos, rule: 'sin′ = cos',
      txt: 'Le point rouge parcourt la courbe de sin. En dessous, on reporte à chaque instant la <b>pente de sa tangente</b>. La trace rouge tombe exactement sur la courbe de cos (en pointillés) : <b>sin′ = cos</b>.' },
    { name: 'cosinus', f: Math.cos, fl: 'cos', dl: '−sin', d: x => -Math.sin(x), rule: 'cos′ = −sin',
      txt: 'Même idée avec cos : on reporte la pente de la tangente en dessous. La trace tombe sur la courbe de sin <b>retournée</b> : <b>cos′ = −sin</b>.' },
  ];
  const S = { fi: 0, x: 1.2, playing: false };
  const F = () => FNS[S.fi];
  const slope = x => (F().f(x + 1e-5) - F().f(x - 1e-5)) / 2e-5;  // pente mesurée sur la courbe

  /* Multiples de π/2 écrits proprement */
  const PIS = { '-2': '−π', '-1': '−π/2', 0: '0', 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π' };
  const piName = x => { const k = Math.round(x / (PI / 2)); return Math.abs(x - (k * PI) / 2) < 0.02 ? PIS[k] : null; };

  const view = Fig.setup($('fig'), { minWidth: 340, height: W => Math.round(Math.min(540, Math.max(460, W * 0.48))) }, () => draw());

  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, f = F(), x = S.x;
    const L = 40, R = 20, gap = 46, T = 18, B = 30;
    const ph = (H - T - B - gap) / 2;                    // hauteur d’un panneau
    const tops = [T, T + ph + gap];
    const X = v => L + ((v - XMIN + 0.25) / (XMAX - XMIN + 0.5)) * (W - L - R);
    const Yp = (k, v) => tops[k] + ph / 2 - (v / 1.5) * (ph / 2);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    for (const k of [0, 1]) {
      ctx.lineWidth = 1; ctx.strokeStyle = C.line;
      for (let j = -2; j <= 4; j++) Fig.seg(ctx, X((j * PI) / 2), tops[k], X((j * PI) / 2), tops[k] + ph);
      for (const v of [-1, 1]) {
        Fig.seg(ctx, L, Yp(k, v), W - R, Yp(k, v));
        Fig.label(ctx, v < 0 ? '−1' : '1', L - 8, Yp(k, v), { size: 11, color: C.muted, align: 'right', halo: false });
      }
      ctx.strokeStyle = C.axis;
      Fig.arrow(ctx, L - 4, Yp(k, 0), W - R + 8, Yp(k, 0), 6);
      Fig.seg(ctx, X(0), tops[k], X(0), tops[k] + ph);
      for (let j = -2; j <= 4; j++) if (j) Fig.label(ctx, PIS[j], X((j * PI) / 2) + 4, Yp(k, 0) + 12, { size: 12, color: C.muted, align: 'left', math: true });
    }

    const plot = (k, g, a, b) => {
      ctx.beginPath();
      for (let i = 0; i <= 500; i++) {
        const t = a + ((b - a) * i) / 500;
        i ? ctx.lineTo(X(t), Yp(k, g(t))) : ctx.moveTo(X(t), Yp(k, g(t)));
      }
      ctx.stroke();
    };

    // panneau du haut : la courbe et sa tangente
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.2;
    plot(0, f.f, XMIN, XMAX);
    Fig.math(ctx, [['y', true], ` = ${f.fl} `, ['x', true]], X(XMIN) + 6, tops[0] + 10, { size: 15, align: 'left' });

    const p = slope(x), sx = (W - L - R) / (XMAX - XMIN + 0.5), sy = ph / 3;
    const dx = 85 / Math.hypot(sx, p * sy);              // demi-longueur de la tangente : 85 px
    ctx.strokeStyle = C.sin; ctx.lineWidth = 2;
    Fig.seg(ctx, X(x - dx), Yp(0, f.f(x) - p * dx), X(x + dx), Yp(0, f.f(x) + p * dx));

    // lien vertical entre les deux panneaux
    ctx.save();
    ctx.strokeStyle = C.faint; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
    Fig.seg(ctx, X(x), Yp(0, f.f(x)), X(x), Yp(1, p));
    ctx.restore();
    Fig.dot(ctx, X(x), Yp(0, f.f(x)), 6, C.sin);
    const up = f.f(x) < 0.2;
    const rt = X(x) + 110 < W;
    Fig.label(ctx, `pente ≈ ${Fig.fixed(p, 2)}`, X(x) + (rt ? 10 : -10), Yp(0, f.f(x)) + (up ? -22 : 22), { size: 13, color: C.sin, weight: '600', align: rt ? 'left' : 'right' });

    // panneau du bas : la courbe de la dérivée (pointillés) et la trace de la pente
    ctx.save();
    ctx.strokeStyle = C.cos; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]);
    plot(1, f.d, XMIN, XMAX);
    ctx.restore();
    if (x > XMIN + 0.01) { ctx.strokeStyle = C.sin; ctx.lineWidth = 2.8; plot(1, slope, XMIN, x); }
    Fig.dot(ctx, X(x), Yp(1, p), 6, C.sin);
    Fig.label(ctx, 'pente de la tangente', X(XMIN) + 6, tops[1] + 2, { size: 13, color: C.sin, align: 'left' });
    Fig.math(ctx, [['y', true], ` = ${f.dl} `, ['x', true]], X(XMAX) - 4, tops[1] + 4, { size: 15, color: C.cos, align: 'right' });

    readout();
  }

  function readout() {
    const f = F(), x = S.x, p = slope(x), nm = piName(x);
    $('r-x').innerHTML = `<b>${Fig.fixed(x, 2)}</b>${nm && nm !== '0' ? ` <span class="muted">(${nm})</span>` : ''}`;
    $('k-f').innerHTML = `${f.fl} <i>x</i>`;
    $('r-f').innerHTML = `<b>${Fig.fixed(f.f(x), 2)}</b>`;
    $('r-p').innerHTML = `<b class="c-sin">${Fig.fixed(p, 2)}</b> = ${f.dl} <i>x</i>`;
    $('res').innerHTML = f.rule.replace('′', '′(<i>x</i>)').replace(/ = (−?)(\w+)$/, ' = $1$2 <i>x</i>');
    let m;
    if (S.fi === 0 && Math.abs(x) < 0.12) {
      m = 'Près de 0, la courbe de sin se confond avec sa tangente <i>y</i> = <i>x</i> (pente 1 = cos 0) : c’est pour ça que sin <i>x</i> / <i>x</i> → 1 quand <i>x</i> → 0.';
    } else if (Math.abs(p) < 0.04) {
      m = '<b>Tangente horizontale</b> : la pente vaut 0. La courbe est à un sommet ou à un creux, et la trace coupe l’axe.';
    } else if (p > 0) {
      m = `${f.fl} <b>monte</b> ici : la pente est positive, la trace est au-dessus de l’axe.`;
    } else {
      m = `${f.fl} <b>descend</b> ici : la pente est négative, la trace est sous l’axe.`;
    }
    $('msg').innerHTML = m;
    $('x').value = x;
    $('play').textContent = S.playing ? '❚❚ Pause' : '▶ Faire avancer x';
  }

  function setFn(i) {
    S.fi = i;
    document.querySelectorAll('#fns .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    $('explain').innerHTML = F().txt;
    $('legend').innerHTML = `<span><i class="sw" style="background:var(--text)"></i>courbe de ${F().fl}</span>
      <span><i class="sw" style="background:var(--sin)"></i>tangente et trace de sa pente</span>
      <span><i class="sw" style="background:repeating-linear-gradient(90deg,var(--cos) 0 5px,transparent 5px 9px)"></i>courbe de ${F().dl}</span>`;
    draw();
  }

  let last = 0;
  function loop(now) {
    if (!S.playing) return;
    S.x = Math.min(XMAX, S.x + ((now - last) / 1000) * 1.6);
    last = now;
    if (S.x >= XMAX) S.playing = false;
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  $('play').onclick = () => {
    S.playing = !S.playing;
    if (S.playing) { if (S.x >= XMAX - 1e-6) S.x = XMIN; last = performance.now(); requestAnimationFrame(loop); }
    draw();
  };
  $('x').addEventListener('input', e => { S.playing = false; S.x = +e.target.value; draw(); });

  $('fns').innerHTML = '<span class="label">Fonction</span>' + FNS.map(f => `<button class="chip">${f.name}</button>`).join('');
  document.querySelectorAll('#fns .chip').forEach((b, k) => (b.onclick = () => setFn(k)));
  setFn(0);
})();
