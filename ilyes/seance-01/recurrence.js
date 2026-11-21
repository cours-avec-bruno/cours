(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);

  /* =================== Les dominos =================== */
  const N = 10;
  const D = { broken: new Set(), a: [], w: [], fall: [], running: false, started: false };
  const dom = $('dom');
  const vDom = Fig.setup(dom, { minWidth: 640, height: () => 250 }, () => drawDom());
  let L;

  function reset() {
    D.a = Array(N).fill(0); D.w = Array(N).fill(0); D.fall = Array(N).fill(false);
    D.running = false; D.started = false;
    drawDom();
  }

  function layout() {
    const W = vDom.W, H = vDom.H, nb = D.broken.size;
    const units = N * 0.16 + (N - 1 - nb) * 0.5 + nb * 1.15;
    const h = Math.min(120, (W - 110) / units), w = 0.16 * h;
    const xs = [];
    let x = (W - 40 - units * h) / 2;
    for (let i = 0; i < N; i++) { xs.push(x); x += w + (i < N - 1 ? (D.broken.has(i) ? 1.15 : 0.5) * h : 0); }
    L = { W, H, h, w, xs, g: H - 62 };
  }
  const gap = i => L.xs[i + 1] - (L.xs[i] + L.w);
  const reach = i => i < N - 1 && gap(i) < L.h;
  const contact = i => Math.asin(gap(i) / L.h);
  /* Angle maximal du domino i : son coin supérieur s’appuie contre la face gauche du domino suivant. */
  function limit(i) {
    if (!reach(i)) return Math.PI / 2;
    const { h, w, g } = L, b = D.a[i + 1], px = L.xs[i] + w, p2 = L.xs[i + 1] + w;
    const qx = p2 - w * Math.cos(b), qy = g - w * Math.sin(b), nx = -Math.cos(b), ny = -Math.sin(b);
    const free = a => (px + h * Math.sin(a) - qx) * nx + (g - h * Math.cos(a) - qy) * ny >= 0;
    if (free(Math.PI / 2)) return Math.PI / 2;
    let lo = 0, hi = Math.PI / 2;
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; free(m) ? (lo = m) : (hi = m); }
    return lo;
  }

  function drawDom() {
    layout();
    const ctx = vDom.ctx, { W, H, h, w, xs, g } = L;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

    // sol
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    Fig.seg(ctx, 16, g, W - 16, g);
    Fig.label(ctx, '…', xs[N - 1] + w + 0.5 * h, g - 14, { size: 20, color: C.muted });

    // écarts cassés
    for (const i of D.broken) {
      const cx = xs[i] + w + gap(i) / 2;
      ctx.strokeStyle = C.sin; ctx.lineWidth = 2;
      Fig.seg(ctx, cx - 6, g + 8, cx + 6, g + 20);
      Fig.seg(ctx, cx + 6, g + 8, cx - 6, g + 20);
    }

    for (let i = 0; i < N; i++) {
      const stuck = i === 0 && !$('init').checked;
      ctx.save();
      ctx.translate(xs[i] + w, g);
      ctx.rotate(D.a[i]);
      ctx.fillStyle = D.fall[i] ? C.text : '#fff';
      ctx.strokeStyle = stuck ? C.sin : C.text;
      ctx.lineWidth = 1.5;
      if (stuck) ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.roundRect(-w, -h, w, h, 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      const ok = D.fall[i];
      Fig.label(ctx, `P(${i})`, xs[i] + w / 2, g + 30, {
        size: 13, weight: ok ? '600' : '', color: stuck ? C.sin : ok ? C.arc : C.muted,
      });
    }
  }

  function message() {
    let m;
    const first = [...D.broken].sort((p, q) => p - q)[0];
    if (!$('init').checked) {
      m = D.started
        ? '<b>Rien ne tombe.</b> P(0) est fausse : personne ne pousse le premier domino. Même si l’hérédité marche partout, on ne peut rien conclure.'
        : 'Le premier domino est bloqué (P(0) fausse). Lance pour voir ce qui se passe.';
    } else if (!D.started) {
      m = 'Clique sur « Lancer » : on pousse le premier domino.';
    } else if (D.running) {
      m = 'Chaque domino qui tombe fait tomber le suivant…';
    } else if (first === undefined) {
      m = '<b>Tous les dominos tombent</b>, et ça continuerait à l’infini : P(<i>n</i>) est vraie <b>pour tout</b> <i>n</i>. Il fallait les deux : initialisation + hérédité.';
    } else {
      m = `<b>La chaîne s’arrête à P(${first})</b> : entre P(${first}) et P(${first + 1}), l’hérédité ne marche pas.
        P(0) à P(${first}) sont vraies, mais on ne peut <b>rien</b> dire de la suite.`;
    }
    $('msg').innerHTML = m;
    $('go').disabled = D.running;
  }

  let last = 0;
  function loop(now) {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    let moving = false;
    for (let i = 0; i < N; i++) {
      if (!D.fall[i]) continue;
      const lim = limit(i);
      if (D.a[i] < lim - 1e-4) {
        D.w[i] += 10 * dt;
        D.a[i] = Math.min(lim, D.a[i] + D.w[i] * dt);
        moving = true;
      } else { D.a[i] = lim; D.w[i] = 0; }
      if (reach(i) && !D.fall[i + 1] && D.a[i] >= contact(i) - 1e-3) {
        D.fall[i + 1] = true; D.w[i + 1] = 1.5; moving = true;
      }
    }
    drawDom();
    if (moving) requestAnimationFrame(loop);
    else { D.running = false; message(); }
  }

  $('go').onclick = () => {
    reset();
    D.started = true;
    if ($('init').checked) {
      D.fall[0] = true; D.w[0] = 2; D.running = true;
      last = performance.now();
      requestAnimationFrame(loop);
    }
    message();
  };
  $('reset').onclick = () => { reset(); message(); };
  $('init').onchange = () => { reset(); message(); };

  dom.addEventListener('pointerdown', e => {
    const x = e.clientX - dom.getBoundingClientRect().left;
    for (let i = 0; i < N - 1; i++) {
      if (x > L.xs[i] + L.w - 4 && x < L.xs[i + 1] + 4) {
        D.broken.has(i) ? D.broken.delete(i) : D.broken.add(i);
        reset(); message();
        return;
      }
    }
  });
  dom.addEventListener('pointermove', e => {
    const x = e.clientX - dom.getBoundingClientRect().left;
    let over = false;
    for (let i = 0; i < N - 1; i++) if (x > L.xs[i] + L.w - 4 && x < L.xs[i + 1] + 4) over = true;
    dom.style.cursor = over ? 'pointer' : 'default';
  });

  reset();
  message();

  /* =================== Le carré des impairs =================== */
  const sq = $('sq');
  const vSq = Fig.setup(sq, { minWidth: 400, height: () => 300 }, () => drawSq());
  let n = 4;
  const NMAX = 10;

  function drawSq() {
    const ctx = vSq.ctx, W = vSq.W, H = vSq.H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    const c = Math.floor((H - 40) / NMAX);
    const x0 = Math.round((W - c * NMAX) / 2), y0 = H - 20; // coin bas gauche
    for (let r = 0; r < n; r++) {
      for (let k = 0; k < n; k++) {
        const layer = Math.max(r, k) + 1; // la couche numéro « layer » contient 2·layer − 1 carrés
        const isNew = layer === n;
        ctx.fillStyle = isNew ? C.add : layer % 2 ? C.base : '#eceef1';
        ctx.fillRect(x0 + k * c, y0 - (r + 1) * c, c, c);
        ctx.strokeStyle = isNew ? C.cos : '#fff';
        ctx.lineWidth = isNew ? 1.2 : 1.5;
        ctx.strokeRect(x0 + k * c + 0.5, y0 - (r + 1) * c + 0.5, c - 1, c - 1);
      }
    }
    // numéro de chaque couche
    for (let layer = 1; layer <= n; layer++) {
      Fig.label(ctx, String(2 * layer - 1), x0 + (layer - 0.5) * c, y0 - (layer - 0.5) * c, {
        size: 12, color: layer === n ? C.cos : C.muted, weight: layer === n ? '600' : '', halo: false,
      });
    }
    Fig.label(ctx, `${n} × ${n}`, x0 + (n * c) / 2, y0 + 12, { size: 12, color: C.muted });

    const terms = Array.from({ length: n }, (_, k) => 2 * k + 1);
    const shown = n <= 6 ? terms.join(' + ') : `${terms.slice(0, 3).join(' + ')} + … + ${terms[n - 1]}`;
    $('sum').innerHTML = `${shown.replace(/(\d+)$/, '<span class="c-cos">$1</span>')} = <b>${n * n}</b> = ${n}²`;
    $('sqnote').innerHTML = n === 1
      ? 'Initialisation : 1 = 1². Le premier domino tombe.'
      : `Hérédité : on avait ${n - 1}² = ${(n - 1) ** 2}. On ajoute la couche bleue de
         2 × ${n - 1} + 1 = <b class="c-cos">${2 * n - 1}</b> carrés, et on obtient ${(n - 1) ** 2} + ${2 * n - 1} = ${n * n} = ${n}².
         Ça marche à chaque fois : (<i>n</i>)² + 2<i>n</i> + 1 = (<i>n</i> + 1)².`;
    $('minus').disabled = n <= 1;
    $('plus').disabled = n >= NMAX;
  }
  $('plus').onclick = () => { n = Math.min(NMAX, n + 1); drawSq(); };
  $('minus').onclick = () => { n = Math.max(1, n - 1); drawSq(); };
  drawSq();
})();
