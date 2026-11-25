(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');
  const N = 10; // termes construits après u0

  const CASES = [
    { name: 'En escalier', f: x => 0.5 * x + 2, L: 4, win: [-0.6, 8.6], u: [0, 8, 0.5],
      fhtml: '0,5 <i>u</i><sub><i>n</i></sub> + 2' },
    { name: 'En escargot', f: x => -0.6 * x + 3.2, L: 2, win: [-0.3, 4.3], u: [0, 4, 0.2],
      fhtml: '−0,6 <i>u</i><sub><i>n</i></sub> + 3,2' },
    { name: 'Qui s’éloigne', f: x => 1.5 * x - 1, L: 2, win: [-1, 6], u: [0.5, 3.5, 2.4],
      fhtml: '1,5 <i>u</i><sub><i>n</i></sub> − 1' },
  ];
  const S = { c: 0, u0: 0.5, prog: 2 * N, playing: false };
  const cs = () => CASES[S.c];

  function terms() {
    const t = [S.u0];
    for (let n = 1; n <= N; n++) t.push(cs().f(t[n - 1]));
    return t;
  }
  /* Le chemin : (u0 ; 0) → (u0 ; u1) → (u1 ; u1) → (u1 ; u2) → … */
  function path(t) {
    const p = [[t[0], 0]];
    for (let n = 0; n < N; n++) p.push([t[n], t[n + 1]], [t[n + 1], t[n + 1]]);
    return p;
  }
  const known = n => n === 0 || S.prog >= 2 * n - 1e-9; // u_n est reporté sur l’axe

  const view = Fig.setup(canvas, { minWidth: 320, height: W => (W < 640 ? Math.round(W - 40) : Math.round(Math.min(500, Math.max(380, W * 0.44)))) }, () => draw());

  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, c = cs(), [lo, hi] = c.win;
    const T = 18, B = 34, Lp = 46, side = H - T - B;
    const X = v => Lp + ((v - lo) / (hi - lo)) * side;
    const Y = v => T + ((hi - v) / (hi - lo)) * side;
    const t = terms(), p = path(t);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // quadrillage et axes
    const st = Fig.niceStep(hi - lo, 8);
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) {
      Fig.seg(ctx, X(v), T, X(v), T + side);
      Fig.seg(ctx, Lp, Y(v), Lp + side, Y(v));
    }
    ctx.strokeStyle = C.axis;
    Fig.seg(ctx, Lp, Y(0), Lp + side, Y(0));
    Fig.seg(ctx, X(0), T, X(0), T + side);
    for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) {
      if (Math.abs(v) < 1e-9 || Math.abs(v - c.L) < st / 2) continue;
      Fig.label(ctx, Fig.num(v, 2), X(0) - 6, Y(v), { size: 11, color: C.muted, align: 'right', halo: false });
    }

    ctx.save();
    ctx.beginPath(); ctx.rect(Lp, T, side, side); ctx.clip();

    // droite y = x
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1.4;
    Fig.seg(ctx, X(lo), Y(lo), X(hi), Y(hi));
    // courbe de f
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.2;
    Fig.seg(ctx, X(lo), Y(c.f(lo)), X(hi), Y(c.f(hi)));

    // point fixe
    ctx.save();
    ctx.strokeStyle = C.arc; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
    Fig.seg(ctx, X(0), Y(c.L), X(c.L), Y(c.L));
    ctx.restore();

    // projections des termes sur l’axe des abscisses
    ctx.save();
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    for (let n = 1; n <= N; n++) if (known(n)) Fig.seg(ctx, X(t[n]), Y(t[n]), X(t[n]), Y(0));
    ctx.restore();

    // l’escalier
    ctx.strokeStyle = C.cos; ctx.lineWidth = 2;
    const full = Math.floor(S.prog), frac = S.prog - full;
    for (let i = 0; i < 2 * N && i <= full; i++) {
      const [x1, y1] = p[i], [x2, y2] = p[i + 1];
      const k = i < full ? 1 : Fig.ease(frac);
      if (k <= 0) break;
      const ax = X(x1), ay = Y(y1), bx = X(x1 + (x2 - x1) * k), by = Y(y1 + (y2 - y1) * k);
      if (Math.hypot(bx - ax, by - ay) > 16) Fig.arrow(ctx, ax, ay, bx, by, 6);
      else Fig.seg(ctx, ax, ay, bx, by);
    }
    ctx.restore();

    // point fixe (cercle)
    ctx.beginPath(); ctx.arc(X(c.L), Y(c.L), 6, 0, Math.PI * 2);
    ctx.strokeStyle = C.arc; ctx.lineWidth = 2; ctx.stroke();
    Fig.math(ctx, ['ℓ = ' + Fig.num(c.L)], X(0) - 6, Y(c.L), { size: 14, color: C.arc, align: 'right' });

    // étiquettes de la courbe et de la droite
    const lab = (s, v, fv, dy, col, align = 'right', dx = 0) => {
      if (fv > lo && fv < hi) Fig.math(ctx, s, X(v) + dx, Y(fv) + dy, { size: 14, color: col, align });
    };
    const xd = hi - 0.07 * (hi - lo);
    lab([['y', true], ' = ', ['x', true]], xd, xd, 12, C.muted, 'left', 8);
    const xf = c.f(hi) < hi ? hi - 0.03 * (hi - lo) : lo + 0.62 * (hi - lo);
    lab([['y', true], ' = ', ['f', true], '(', ['x', true], ')'], xf, c.f(xf), c.f(hi) < hi ? -14 : -16, C.text);

    // termes reportés sur l’axe des abscisses
    const placed = [];
    for (let n = 0; n <= N; n++) {
      if (!known(n) || t[n] < lo || t[n] > hi) continue;
      const x = X(t[n]);
      ctx.strokeStyle = C.cos; ctx.lineWidth = 2;
      Fig.seg(ctx, x, Y(0) - 4, x, Y(0) + 4);
      if (placed.every(q => Math.abs(q - x) > 24)) {
        placed.push(x);
        Fig.math(ctx, [['u', true], [String(n), false, 'sub']], x, Y(0) + 16, { size: 15, color: C.cos });
      }
    }

    // à droite : les mêmes termes en fonction de n
    const x0 = Lp + side + 64, x1 = W - 24;
    if (x1 - x0 > 220) {
      const Xn = n => x0 + (n / N) * (x1 - x0);
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) Fig.seg(ctx, x0, Y(v), x1, Y(v));
      ctx.strokeStyle = C.axis;
      Fig.seg(ctx, x0, Y(0), x1, Y(0));
      Fig.seg(ctx, x0, T, x0, T + side);
      for (let n = 0; n <= N; n += 2) Fig.label(ctx, String(n), Xn(n), T + side + 16, { size: 11, color: C.muted, halo: false });
      Fig.math(ctx, [['n', true]], x1 + 12, T + side + 16, { size: 14, color: C.muted, halo: false });
      Fig.math(ctx, [['u', true], ['n', true, 'sub'], ' en fonction de ', ['n', true]], x0 + 8, T + 10, { size: 14, color: C.muted, align: 'left' });
      ctx.save();
      ctx.strokeStyle = C.arc; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
      Fig.seg(ctx, x0, Y(c.L), x1, Y(c.L));
      ctx.restore();
      Fig.math(ctx, ['ℓ'], x1 + 10, Y(c.L), { size: 14, color: C.arc });
      for (let n = 0; n <= N; n++) {
        if (!known(n) || t[n] < lo || t[n] > hi) continue;
        Fig.dot(ctx, Xn(n), Y(t[n]), 4, C.cos);
      }
    }

    readout(t);
  }

  function readout(t) {
    const c = cs(), u = n => `<i>u</i><sub>${n}</sub>`;
    $('formula').innerHTML = `${u('<i>n</i>+1')} = ${c.fhtml}`;
    const shown = [];
    for (let n = 0; n <= 6; n++) if (known(n)) shown.push(`${u(n)} = ${Fig.num(t[n], 3)}`);
    $('terms').innerHTML = shown.join(' · ') + (known(7) ? ' · …' : '');

    let m;
    const at = Math.abs(S.u0 - c.L) < 1e-9;
    if (at) {
      m = `<i>u</i><sub>0</sub> = ℓ : on part du point fixe, donc <i>f</i>(<i>u</i><sub>0</sub>) = <i>u</i><sub>0</sub>. La suite est <b>constante</b>.`;
    } else if (S.c === 0) {
      m = S.u0 < c.L
        ? 'La suite est <b>croissante et majorée</b> par 4 : elle converge.'
        : 'La suite est <b>décroissante et minorée</b> par 4 : elle converge.';
      m += ' Comme <i>f</i> est continue, sa limite vérifie ℓ = <i>f</i>(ℓ), soit ℓ = 0,5ℓ + 2, donc <b>ℓ = 4</b>.';
    } else if (S.c === 1) {
      m = 'Les termes passent <b>alternativement</b> au-dessus et en dessous de 2, de plus en plus près : la suite n’est pas monotone, mais elle converge vers <b>2</b>, seule solution de ℓ = −0,6ℓ + 3,2.';
    } else {
      m = `Le point fixe existe (2 = 1,5 × 2 − 1), mais l’escalier <b>s’en éloigne</b> : la suite tend vers ${S.u0 > c.L ? '+∞' : '−∞'}.
        L’équation ℓ = <i>f</i>(ℓ) donne seulement la seule limite <b>possible</b> ; ici, il n’y a pas de limite finie.`;
    }
    $('msg').innerHTML = m;
  }

  /* Animation */
  let last = 0;
  function loop(now) {
    if (!S.playing) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    S.prog = Math.min(2 * N, S.prog + dt * 1.6);
    if (S.prog >= 2 * N) { S.playing = false; $('play').textContent = '▶ Construire pas à pas'; }
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  function stop() { S.playing = false; S.prog = 2 * N; $('play').textContent = '▶ Construire pas à pas'; }
  $('play').onclick = () => {
    if (S.playing) { stop(); draw(); return; }
    S.prog = 0; S.playing = true; $('play').textContent = '■ Arrêter';
    last = performance.now();
    requestAnimationFrame(loop);
  };

  function setU0(v) {
    S.u0 = v;
    $('u0v').textContent = Fig.num(v, 1);
  }
  $('u0').addEventListener('input', e => { stop(); setU0(+e.target.value); draw(); });

  function setCase(i) {
    S.c = i;
    const c = cs();
    document.querySelectorAll('#cases .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    const r = $('u0');
    r.min = c.u[0]; r.max = c.u[1]; r.step = 0.1; r.value = c.u[2];
    setU0(c.u[2]);
    stop();
    draw();
  }
  $('cases').innerHTML = CASES.map(c => `<button class="chip">${c.name}</button>`).join('');
  document.querySelectorAll('#cases .chip').forEach((b, k) => (b.onclick = () => setCase(k)));
  setCase(0);
})();
