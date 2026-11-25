(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');
  const n2 = x => Fig.num(x, 2);
  const sgn = (v, s = '') => (Math.abs(v) < 0.005 ? '' : v > 0 ? ` + ${n2(v)}${s}` : ` − ${n2(-v)}${s}`);
  const par = v => (v < 0 ? `(${n2(v)})` : n2(v));
  const coef = c => (Math.abs(c - 1) < 0.005 ? '' : Math.abs(c + 1) < 0.005 ? '−' : n2(c) + ' ');

  const EQS = [
    {
      chip: 'y′ = 2x', html: '<i>y</i>′ = 2<i>x</i>', slope: (x, y) => 2 * x, win: [-3, 3, -4, 6.5],
      sol: (k, x) => x * x + k, K: (x0, y0) => y0 - x0 * x0, def: [[-1, 3], [0.5, 0.25], [1.5, 0.25]],
      gen: '<i>x</i>² + <i>C</i>',
      kcalc: (x0, y0, k) => `<i>C</i> = ${n2(y0)} − ${par(x0)}² = <b>${n2(k)}</b>`,
      fmt: k => `<i>y</i> = <i>x</i>²${sgn(k)}`,
      txt: 'On cherche les fonctions dont la dérivée est 2<i>x</i> : ce sont les <b>primitives</b> de 2<i>x</i>. La pente ne dépend que de <i>x</i> : dans chaque colonne, tous les segments sont parallèles.',
      msg: 'Toutes les solutions sont des paraboles <i>x</i>² + <i>C</i>, <b>translatées verticalement</b> les unes des autres : deux primitives d’une même fonction diffèrent d’une constante.',
    },
    {
      chip: 'y′ = y', html: '<i>y</i>′ = <i>y</i>', slope: (x, y) => y, win: [-3, 2.5, -4, 5],
      sol: (k, x) => k * Math.exp(x), K: (x0, y0) => y0 * Math.exp(-x0), def: [[0, 1], [0, -0.5], [-1, 2]],
      gen: '<i>C</i> e<sup><i>x</i></sup>',
      kcalc: (x0, y0, k) => `<i>C</i> = ${n2(y0)} × e<sup>${Fig.num(-x0, 1)}</sup> ≈ <b>${n2(k)}</b>`,
      fmt: k => (Math.abs(k) < 0.005 ? '<i>y</i> = 0' : `<i>y</i> = ${coef(k)}e<sup><i>x</i></sup>`),
      txt: 'Ici la pente est égale à la hauteur : plus la courbe est haute, plus elle monte vite. Sur l’axe des abscisses (<i>y</i> = 0), les segments sont horizontaux.',
      msg: 'Les solutions sont les fonctions <i>C</i> e<sup><i>x</i></sup> : elles s’éloignent de l’axe de plus en plus vite. Partir de <i>y</i> = 0, c’est y rester : <i>C</i> = 0.',
    },
    {
      chip: 'y′ = −0,5y + 1', html: '<i>y</i>′ = −0,5<i>y</i> + 1', slope: (x, y) => -0.5 * y + 1, win: [-2, 6, -1.5, 5.5],
      sol: (k, x) => 2 + k * Math.exp(-0.5 * x), K: (x0, y0) => (y0 - 2) * Math.exp(0.5 * x0), def: [[0, 4.5], [0, 0], [-1, 3.2]],
      gen: '2 + <i>C</i> e<sup>−0,5<i>x</i></sup>',
      kcalc: (x0, y0, k) => `<i>C</i> = (${n2(y0)} − 2) × e<sup>${Fig.num(0.5 * x0, 2)}</sup> ≈ <b>${n2(k)}</b>`,
      fmt: k => (Math.abs(k) < 0.005 ? '<i>y</i> = 2' : `<i>y</i> = 2${sgn(k, ' e<sup>−0,5<i>x</i></sup>')}`),
      txt: 'Au-dessus de <i>y</i> = 2 la pente est négative, en dessous elle est positive, et sur la droite <i>y</i> = 2 elle est nulle : −0,5 × 2 + 1 = 0.',
      msg: 'Toutes les solutions sont attirées par la droite <i>y</i> = 2, la <b>solution constante</b> (celle pour laquelle <i>y</i>′ = 0). On la trouve en résolvant −0,5<i>y</i> + 1 = 0.',
    },
  ];
  const S = { ei: 0, sols: [], anim: 1 };
  const E = () => EQS[S.ei];

  const view = Fig.setup(canvas, { minWidth: 340, height: W => Math.round(Math.min(470, Math.max(360, W * 0.42))) }, () => draw());
  const P = { l: 34, r: 16, t: 14, b: 26 };
  const frame = () => {
    const [x0, x1, y0, y1] = E().win, W = view.W, H = view.H;
    const sx = (W - P.l - P.r) / (x1 - x0), sy = (H - P.t - P.b) / (y1 - y0);
    return { x0, x1, y0, y1, sx, sy, X: v => P.l + (v - x0) * sx, Y: v => P.t + (y1 - v) * sy };
  };

  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, e = E(), F = frame();
    const { X, Y } = F;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // quadrillage et axes
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let v = Math.ceil(F.x0); v <= F.x1; v++) Fig.seg(ctx, X(v), P.t, X(v), H - P.b);
    for (let v = Math.ceil(F.y0); v <= F.y1; v++) Fig.seg(ctx, P.l, Y(v), W - P.r, Y(v));
    ctx.strokeStyle = C.axis;
    Fig.arrow(ctx, P.l, Y(0), W - P.r + 6, Y(0), 6);
    Fig.arrow(ctx, X(0), H - P.b, X(0), P.t - 6, 6);

    // champ de directions
    ctx.strokeStyle = '#9aa1aa'; ctx.lineWidth = 1.3;
    const step = 30;
    for (let px = P.l + step / 2; px < W - P.r; px += step) {
      for (let py = P.t + step / 2; py < H - P.b; py += step) {
        const x = F.x0 + (px - P.l) / F.sx, y = F.y1 - (py - P.t) / F.sy;
        const m = e.slope(x, y), dx = F.sx, dy = -m * F.sy, n = Math.hypot(dx, dy);
        Fig.seg(ctx, px - (9 * dx) / n, py - (9 * dy) / n, px + (9 * dx) / n, py + (9 * dy) / n);
      }
    }

    for (let v = Math.ceil(F.x0); v <= F.x1; v++) if (v) Fig.label(ctx, String(v).replace('-', '−'), X(v), Y(0) + 12, { size: 11, color: C.muted });
    for (let v = Math.ceil(F.y0); v <= F.y1; v++) if (v) Fig.label(ctx, String(v).replace('-', '−'), X(0) - 7, Y(v), { size: 11, color: C.muted, align: 'right' });

    // solution d’équilibre
    if (S.ei === 2) {
      ctx.strokeStyle = C.arc; ctx.lineWidth = 2.4;
      Fig.seg(ctx, P.l, Y(2), W - P.r, Y(2));
      Fig.label(ctx, 'y = 2 (solution constante)', P.l + 6, Y(2) + 14, { size: 13, color: C.arc, align: 'left', weight: '600' });
    }

    // courbes solutions
    ctx.save();
    ctx.beginPath(); ctx.rect(P.l, P.t, W - P.l - P.r, H - P.t - P.b); ctx.clip();
    S.sols.forEach((s, i) => {
      const lastOne = i === S.sols.length - 1, t = lastOne ? Fig.ease(S.anim) : 1;
      const a = s.x0 - t * (s.x0 - F.x0), b = s.x0 + t * (F.x1 - s.x0);
      ctx.strokeStyle = C.cos; ctx.globalAlpha = lastOne ? 1 : 0.4; ctx.lineWidth = lastOne ? 2.6 : 2;
      ctx.beginPath();
      let pen = false;
      const n = Math.max(2, Math.ceil(((b - a) * F.sx) / 2));
      for (let j = 0; j <= n; j++) {
        const x = a + ((b - a) * j) / n, y = Y(e.sol(s.k, x));
        if (y < -H || y > 2 * H) { pen = false; continue; }
        pen ? ctx.lineTo(X(x), y) : ctx.moveTo(X(x), y);
        pen = true;
      }
      ctx.stroke();
    });
    ctx.restore();
    const s = S.sols[S.sols.length - 1];
    if (s) Fig.dot(ctx, X(s.x0), Y(s.y0), 6, C.cos);

    readout();
  }

  function readout() {
    const e = E(), s = S.sols[S.sols.length - 1];
    $('r-gen').innerHTML = `<i>y</i> = ${e.gen}`;
    if (!s) {
      $('r-pt').textContent = '—'; $('r-c').textContent = '—';
      $('res').innerHTML = '<span class="muted" style="font-size:16px;font-family:var(--font)">Clique sur la figure pour choisir un point de départ.</span>';
    } else {
      $('r-pt').innerHTML = `<i>y</i>(${n2(s.x0)}) = ${n2(s.y0)}`;
      $('r-c').innerHTML = e.kcalc(s.x0, s.y0, s.k);
      $('res').innerHTML = e.fmt(s.k);
    }
    $('msg').innerHTML = e.msg;
  }

  function add(x0, y0) {
    S.sols.push({ x0, y0, k: E().K(x0, y0) });
    S.anim = 0;
    let last = performance.now();
    const step = now => {
      S.anim = Math.min(1, S.anim + (now - last) / 900);
      last = now;
      draw();
      if (S.anim < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setEq(i) {
    S.ei = i; S.anim = 1;
    S.sols = E().def.map(([x0, y0]) => ({ x0, y0, k: E().K(x0, y0) }));
    document.querySelectorAll('#eqs .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    $('explain').innerHTML = `<span class="mx">${E().html}</span> — ${E().txt}`;
    $('legend').innerHTML = `<span><i class="sw" style="background:#9aa1aa"></i>pente imposée par l’équation</span>
      <span><i class="sw" style="background:var(--cos)"></i>courbes solutions</span>` +
      (i === 2 ? '<span><i class="sw" style="background:var(--arc)"></i>solution constante</span>' : '');
    draw();
  }

  canvas.addEventListener('pointerdown', ev => {
    const r = canvas.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
    if (px < P.l || px > view.W - P.r || py < P.t || py > view.H - P.b) return;
    const F = frame();
    const snap = v => Math.round(v * 10) / 10;
    add(snap(F.x0 + (px - P.l) / F.sx), snap(F.y1 - (py - P.t) / F.sy));
  });
  $('clear').onclick = () => { S.sols = []; draw(); };

  $('eqs').innerHTML = '<span class="label">Équation</span>' + EQS.map(e => `<button class="chip">${e.chip}</button>`).join('');
  document.querySelectorAll('#eqs .chip').forEach((b, k) => (b.onclick = () => setEq(k)));
  setEq(0);
})();
