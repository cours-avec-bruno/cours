/* Animation commune : suites arithmétiques (data-suite="arith") et géométriques (data-suite="geo"). */
(() => {
  const A = document.body.dataset.suite === 'arith';
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');

  const S = {
    u0: A ? 2 : 1, p: 1.5, N: 10,
    mode: 'rec', shown: 11, sel: 5, grow: 1, wait: 0, playing: false,
  };

  const val = n => (A ? S.u0 + n * S.p : S.u0 * Math.pow(S.p, n));
  const num = x => Fig.num(x, 2);
  const par = x => (x < 0 ? `(${num(x)})` : num(x));
  const u = n => `<i>u</i><sub>${n}</sub>`;

  const view = Fig.setup(canvas, { minWidth: 600, height: W => Math.round(Math.min(440, Math.max(340, W * 0.38))) }, () => draw());
  let G;
  const X = n => G.L + (n + 0.5) * G.slot;
  const Y = v => G.T + ((G.hi - v) / (G.hi - G.lo)) * G.ph;

  function geom() {
    const W = view.W, H = view.H, L = 64, R = 20, T = 40, B = 42;
    const vals = [0];
    for (let k = 0; k <= S.N; k++) vals.push(val(k));
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
    const span = hi - lo;
    hi += span * 0.04; if (lo < 0) lo -= span * 0.04;
    const step = Fig.niceStep(hi - lo, 6);
    lo = Math.floor(lo / step + 1e-9) * step;
    hi = Math.ceil(hi / step - 1e-9) * step;
    const slot = (W - L - R) / (S.N + 1);
    G = { W, H, L, R, T, B, slot, lo, hi, step, ph: H - T - B, bw: Math.min(40, slot * 0.52) };
  }

  /* Rectangle vertical entre les valeurs a et b. */
  function vrect(x, a, b, fill, stroke, dash) {
    const ctx = view.ctx, y1 = Y(Math.max(a, b)), y2 = Y(Math.min(a, b)), w = G.bw;
    if (y2 - y1 < 0.4) return;
    ctx.fillStyle = fill; ctx.fillRect(x - w / 2, y1, w, y2 - y1);
    if (stroke) {
      ctx.save();
      ctx.strokeStyle = stroke; ctx.lineWidth = 1.2;
      if (dash) ctx.setLineDash([4, 3]);
      ctx.strokeRect(x - w / 2 + 0.6, y1 + 0.6, w - 1.2, Math.max(0, y2 - y1 - 1.2));
      ctx.restore();
    }
  }
  /* Ajout (bleu) ou retrait (rouge pointillé). */
  function delta(x, a, b, alt) {
    if (b >= a) vrect(x, a, b, alt ? C.addAlt : C.add, C.cos);
    else vrect(x, a, b, C.sub, C.sin, true);
  }

  const animV = (k, g) => (k === 0 ? val(0) * g : val(k - 1) + (val(k) - val(k - 1)) * g);

  function bar(k, g) {
    const ctx = view.ctx, x = X(k), v = val(k);
    if (k === 0) { vrect(x, 0, v * g, C.base); return; }
    if (S.mode === 'rec') {
      const prev = val(k - 1), d = (v - prev) * g;
      vrect(x, 0, prev, C.base);
      delta(x, prev, prev + d);
      ctx.save();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
      Fig.seg(ctx, X(k - 1) + G.bw / 2, Y(prev), x - G.bw / 2, Y(prev));
      ctx.restore();
      const showLbl = g > 0.99 && Math.abs(v - prev) > 1e-9 && (A ? G.slot >= 32 : k === S.sel);
      if (showLbl) {
        const dv = v - prev, h = Math.abs(Y(prev) - Y(v));
        const txt = (dv >= 0 ? '+' : '−') + num(Math.abs(dv));
        const y = h >= 18 ? (Y(prev) + Y(v)) / 2 : Y(Math.max(prev, v)) - 10;
        Fig.label(ctx, txt, h >= 18 ? x : x + G.bw / 2 + 2, y, {
          size: 11, weight: '600', color: dv >= 0 ? C.cos : C.sin, align: h >= 18 ? 'center' : 'left', halo: h < 18,
        });
      }
    } else if (A) {
      vrect(x, 0, S.u0, C.base);
      const nb = k * g;
      for (let j = 0; j < Math.ceil(nb - 1e-9); j++) {
        const f = Math.min(1, nb - j), a = S.u0 + j * S.p;
        delta(x, a, a + S.p * f, j % 2);
      }
    } else {
      vrect(x, 0, animV(k, g), C.base);
    }
  }

  /* Flèche courbe « ×q » entre deux points. */
  function qArrow(k, strong) {
    const ctx = view.ctx;
    const x1 = X(k - 1) + 4, y1 = Y(val(k - 1)) - 8, x2 = X(k) - 4, y2 = Y(val(k)) - 9;
    const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 16;
    ctx.save();
    ctx.globalAlpha = strong ? 1 : 0.45;
    ctx.strokeStyle = C.sin; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
    const a = Math.atan2(y2 - my, x2 - mx), h = 6;
    ctx.fillStyle = C.sin;
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45));
    ctx.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fill();
    ctx.restore();
    if (strong || G.slot >= 46) Fig.label(ctx, '×' + num(S.p), mx, my - 2, { size: 11, weight: '600', color: C.sin });
  }

  function draw() {
    geom();
    const ctx = view.ctx, { W, H, L, R, T, B, lo, hi, step } = G;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Colonne sélectionnée
    if (S.sel < S.shown) { ctx.fillStyle = C.soft; ctx.fillRect(X(S.sel) - G.slot / 2, T - 24, G.slot, H - T - B + 24); }

    // Quadrillage + graduations
    ctx.lineWidth = 1;
    for (let v = lo; v <= hi + step * 1e-6; v += step) {
      const y = Math.round(Y(v)) + 0.5, zero = Math.abs(v) < step * 1e-6;
      ctx.strokeStyle = zero ? C.axis : C.line;
      Fig.seg(ctx, L, y, W - R, y);
      Fig.label(ctx, num(zero ? 0 : v), L - 10, y, { align: 'right', size: 12, color: C.muted, halo: false });
    }
    for (let k = 0; k <= S.N; k++) {
      Fig.label(ctx, String(k), X(k), H - B + 20, {
        size: 12, color: k === S.sel ? C.text : k < S.shown ? C.muted : C.faint, weight: k === S.sel ? '600' : '', halo: false,
      });
    }
    Fig.math(ctx, [['n', true]], L - 10, H - B + 20, { align: 'right', size: 15, color: C.muted, halo: false });
    Fig.math(ctx, [['u', true], ['n', true, 'sub']], L - 10, T - 24, { align: 'right', size: 16, color: C.muted, halo: false });

    // Barres
    const last = S.shown - 1;
    for (let k = 0; k < S.shown; k++) bar(k, k === last ? Fig.ease(S.grow) : 1);

    // Flèches ×q (géométrique)
    if (!A) {
      const to = S.mode === 'rec' ? last : Math.min(S.sel, last);
      for (let k = 1; k <= to; k++) {
        if (k === last && S.grow < 0.99) continue;
        qArrow(k, S.mode === 'exp' || k === S.sel);
      }
    }

    // Points
    for (let k = 0; k < S.shown; k++) {
      const g = k === last ? Fig.ease(S.grow) : 1, v = animV(k, g), sel = k === S.sel;
      Fig.dot(ctx, X(k), Y(v), sel ? 5 : 3.5, C.text, true);
      if (sel && g > 0.99) {
        const up = !A && k > 0 ? 34 : 15;
        Fig.label(ctx, num(v), X(k), Y(v) + (v >= 0 ? -up : 16), { size: 13, weight: '600' });
      }
    }

    readout();
  }

  /* ---------- Texte explicatif à droite ---------- */
  function readout() {
    const n = S.sel, v = val(n);
    let f, note;
    if (n === 0) {
      f = `${u(0)} = <b>${num(v)}</b>`;
      note = 'C’est le premier terme : le point de départ de la suite.';
    } else if (A && S.mode === 'rec') {
      f = `${u(n)} = ${u(n - 1)} + <i>r</i> = ${num(val(n - 1))} + ${par(S.p)} = <b>${num(v)}</b>`;
      note = `Pour calculer ${u(n)}, il faut connaître ${u(n - 1)} : on avance pas à pas, en ajoutant toujours ${num(S.p)}.`;
    } else if (A) {
      f = `${u(n)} = ${u(0)} + ${n} × <i>r</i> = ${num(S.u0)} + ${n} × ${par(S.p)} = <b>${num(v)}</b>`;
      note = `De ${u(0)} à ${u(n)}, on fait ${n} pas, et chaque pas ajoute <i>r</i> : on a donc ajouté ${n} fois <i>r</i>. Pas besoin de calculer les termes intermédiaires.`;
    } else if (S.mode === 'rec') {
      const prev = val(n - 1), d = v - prev;
      f = `${u(n)} = ${u(n - 1)} × <i>q</i> = ${num(prev)} × ${num(S.p)} = <b>${num(v)}</b>`;
      note = Math.abs(d) < 1e-12
        ? 'Avec <i>q</i> = 1, on multiplie par 1 : la suite ne bouge pas.'
        : `${d > 0 ? 'La hausse' : 'La baisse'} vaut ${d > 0 ? '(<i>q</i> − 1)' : '(1 − <i>q</i>)'} × ${u(n - 1)} = ${num(Math.abs(S.p - 1))} × ${num(prev)} = ${num(Math.abs(d))}.
           Elle dépend de ${u(n - 1)} : plus la suite est grande, plus elle ${d > 0 ? 'augmente' : 'diminue'} vite.`;
    } else {
      const qs = n <= 6 ? Array(n).fill('<i>q</i>').join(' × ') : '<i>q</i> × <i>q</i> × … × <i>q</i>';
      f = `${u(n)} = ${u(0)} × <i>q</i><sup>${n}</sup> = ${num(S.u0)} × ${num(S.p)}<sup>${n}</sup> = <b>${num(v)}</b>`;
      note = `De ${u(0)} à ${u(n)}, on fait ${n} pas et on multiplie ${n} fois par <i>q</i> : ${u(0)} × ${qs} = ${u(0)} × <i>q</i><sup>${n}</sup>.`;
    }
    $('formula').innerHTML = f;
    $('note').innerHTML = note;
    document.querySelectorAll('#terms td').forEach(td => {
      const k = +td.dataset.k;
      td.classList.toggle('sel', k === S.sel);
      td.classList.toggle('off', k >= S.shown);
    });
  }

  function buildTable() {
    let h1 = '<tr><th>n</th>', h2 = '<tr><th>u<sub>n</sub></th>';
    for (let k = 0; k <= S.N; k++) { h1 += `<td data-k="${k}">${k}</td>`; h2 += `<td data-k="${k}">${num(val(k))}</td>`; }
    $('terms').innerHTML = h1 + '</tr>' + h2 + '</tr>';
    document.querySelectorAll('#terms td').forEach(td => (td.onclick = () => select(+td.dataset.k)));
  }

  /* ---------- Construction pas à pas ---------- */
  let lastT = 0;
  function loop(now) {
    if (!S.playing) return;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (S.grow < 1) S.grow = Math.min(1, S.grow + dt / 0.55);
    else {
      S.wait += dt;
      if (S.wait > 0.5) {
        if (S.shown <= S.N) { S.shown++; S.sel = S.shown - 1; S.grow = 0; S.wait = 0; }
        else S.playing = false;
      }
    }
    draw();
    syncPlay();
    if (S.playing) requestAnimationFrame(loop);
  }
  function play() {
    if (S.playing) { S.playing = false; syncPlay(); return; }
    S.shown = 1; S.sel = 0; S.grow = 0; S.wait = 0; S.playing = true;
    lastT = performance.now();
    requestAnimationFrame(loop);
    syncPlay();
  }
  function stop() { S.playing = false; S.grow = 1; syncPlay(); }
  function syncPlay() { $('play').textContent = S.playing ? '❚❚ Pause' : '▶ Construire pas à pas'; }

  function select(k) {
    stop();
    S.sel = Math.max(0, Math.min(S.N, k));
    if (S.sel >= S.shown) S.shown = S.sel + 1;
    draw();
  }

  /* ---------- Interface ---------- */
  function setParams(o) {
    stop();
    Object.assign(S, o);
    S.shown = S.N + 1;
    $('u0').value = S.u0; $('p').value = S.p;
    $('u0v').textContent = num(S.u0); $('pv').textContent = num(S.p);
    buildTable();
    draw();
  }

  ['u0', 'p'].forEach(id => $(id).addEventListener('input', e => setParams({ [id]: +e.target.value })));
  document.querySelectorAll('#modes button').forEach(b => (b.onclick = () => {
    S.mode = b.dataset.mode;
    document.querySelectorAll('#modes button').forEach(o => o.setAttribute('aria-pressed', o === b));
    draw();
  }));
  $('play').onclick = play;

  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect(), k = Math.floor((e.clientX - r.left - G.L) / G.slot);
    if (k >= 0 && k <= S.N) select(k);
  });
  canvas.style.cursor = 'pointer';
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') select(S.sel + 1);
    if (e.key === 'ArrowLeft') select(S.sel - 1);
  });

  setParams({});
})();
