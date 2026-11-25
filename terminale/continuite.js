(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);

  /* =================== Théorème des valeurs intermédiaires =================== */
  const A = 1, B = 7; // [a ; b]
  const cubic = s => 0.8 * (s ** 3 / 3 - 2.7 * s * s + 5.04 * s) + 0.5;
  const FB = cubic(6); // f(b), identique dans les trois cas
  const CASES = [
    { name: 'Continue',
      pieces: [{ a: A, b: B, f: x => cubic(x - A) }],
      txt: '<i>f</i> est continue sur [<i>a</i> ; <i>b</i>] : sa courbe se trace sans lever le crayon. Elle monte, redescend, remonte… mais pour aller de <i>f</i>(<i>a</i>) à <i>f</i>(<i>b</i>), elle doit traverser chaque droite <i>y</i> = <i>k</i> intermédiaire.' },
    { name: 'Continue et strictement croissante',
      pieces: [{ a: A, b: B, f: x => { const t = (x - A) / 6; return 0.5 + (FB - 0.5) * (t - 0.12 * Math.sin(2 * Math.PI * t)); } }],
      txt: '<i>f</i> est continue et <b>strictement croissante</b> : elle traverse chaque droite <i>y</i> = <i>k</i> intermédiaire une fois, et une seule.' },
    { name: 'Avec un saut',
      pieces: [
        { a: A, b: 4, f: x => 0.5 + 0.5 * (x - A), openB: true },
        { a: 4, b: B, f: x => 3.5 + ((FB - 3.5) / 3) * (x - 4) },
      ],
      txt: '<i>f</i> a un <b>saut</b> en <i>x</i> = 4 : la courbe passe de la hauteur 2 à la hauteur 3,5 sans prendre les valeurs entre les deux.' },
  ];
  const S = { c: 0, k: 2, playing: false };
  const cs = () => CASES[S.c];
  const fa = () => cs().pieces[0].f(A), fb = () => FB;
  const between = k => k >= Math.min(fa(), fb()) - 1e-9 && k <= Math.max(fa(), fb()) + 1e-9;

  function solutions(k) {
    const out = [];
    for (const p of cs().pieces) {
      const g = x => p.f(x) - k, M = 600;
      const b = p.openB ? p.b - 1e-9 : p.b;
      let x0 = p.a, g0 = g(x0);
      if (Math.abs(g0) < 1e-12) out.push(x0);
      for (let i = 1; i <= M; i++) {
        const x1 = p.a + ((b - p.a) * i) / M, g1 = g(x1);
        if (Math.abs(g1) < 1e-12) out.push(x1);
        else if (g0 * g1 < 0) {
          let lo = x0, hi = x1;
          for (let j = 0; j < 50; j++) { const m = (lo + hi) / 2; g(lo) * g(m) <= 0 ? (hi = m) : (lo = m); }
          out.push((lo + hi) / 2);
        }
        x0 = x1; g0 = g1;
      }
    }
    return out.filter((x, i) => i === 0 || Math.abs(x - out[i - 1]) > 1e-6);
  }

  const fig = $('fig');
  const view = Fig.setup(fig, { minWidth: 340, height: W => Math.round(Math.min(440, Math.max(320, W * 0.4))) }, () => draw());
  const x0 = -0.4, x1 = 7.6, y0 = -1.5, y1 = 5.7;

  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, P = { l: 30, r: 54, t: 16, b: 30 };
    const X = v => P.l + ((v - x0) / (x1 - x0)) * (W - P.l - P.r);
    const Y = v => P.t + ((y1 - v) / (y1 - y0)) * (H - P.t - P.b);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // quadrillage et axes
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let v = 0; v <= 7; v++) Fig.seg(ctx, X(v), P.t, X(v), H - P.b);
    for (let v = -1; v <= 5; v++) Fig.seg(ctx, P.l, Y(v), W - P.r, Y(v));
    ctx.strokeStyle = C.axis;
    Fig.arrow(ctx, P.l, Y(0), W - P.r + 12, Y(0), 6);
    Fig.arrow(ctx, X(0), H - P.b, X(0), P.t - 4, 6);

    const lo = Math.min(fa(), fb()), hi = Math.max(fa(), fb());
    // bande des valeurs entre f(a) et f(b)
    ctx.fillStyle = 'rgba(43,147,72,0.07)';
    ctx.fillRect(X(0), Y(hi), X(B) - X(0), Y(lo) - Y(hi));
    ctx.save();
    ctx.strokeStyle = C.arc; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    Fig.seg(ctx, X(0), Y(fa()), X(A), Y(fa()));
    Fig.seg(ctx, X(0), Y(fb()), X(B), Y(fb()));
    ctx.restore();
    ctx.strokeStyle = C.arc; ctx.lineWidth = 5; ctx.lineCap = 'butt';
    Fig.seg(ctx, X(0), Y(lo), X(0), Y(hi));
    if (S.c === 2) { // valeurs jamais atteintes à cause du saut
      ctx.fillStyle = 'rgba(214,69,43,0.08)';
      ctx.fillRect(X(0), Y(3.5), X(B) - X(0), Y(2) - Y(3.5));
      ctx.strokeStyle = C.sin;
      Fig.seg(ctx, X(0), Y(2), X(0), Y(3.5));
      Fig.label(ctx, 'valeurs jamais prises', X(0) + 10, (Y(2) + Y(3.5)) / 2, { size: 12, color: C.sin, align: 'left' });
    }
    ctx.lineCap = 'round';
    Fig.math(ctx, [['f', true], '(', ['a', true], ')'], X(0) - 7, Y(fa()), { size: 14, color: C.arc, align: 'right' });
    Fig.math(ctx, [['f', true], '(', ['b', true], ')'], X(0) - 7, Y(fb()), { size: 14, color: C.arc, align: 'right' });

    // bornes a et b
    ctx.save();
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    Fig.seg(ctx, X(A), Y(fa()), X(A), Y(0));
    Fig.seg(ctx, X(B), Y(fb()), X(B), Y(0));
    ctx.restore();
    Fig.math(ctx, [['a', true]], X(A), Y(0) + 15, { size: 15, color: C.muted });
    Fig.math(ctx, [['b', true]], X(B), Y(0) + 15, { size: 15, color: C.muted });

    // courbe
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.4;
    for (const p of cs().pieces) {
      ctx.beginPath();
      const M = 300, b = p.openB ? p.b - 1e-9 : p.b;
      for (let i = 0; i <= M; i++) {
        const x = p.a + ((b - p.a) * i) / M;
        i ? ctx.lineTo(X(x), Y(p.f(x))) : ctx.moveTo(X(x), Y(p.f(x)));
      }
      ctx.stroke();
      if (p.openB) {
        ctx.beginPath(); ctx.arc(X(p.b), Y(p.f(p.b)), 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 2.4;
      }
    }
    for (const p of cs().pieces) if (p !== cs().pieces[0]) Fig.dot(ctx, X(p.a), Y(p.f(p.a)), 4.5, C.text, false);
    Fig.dot(ctx, X(A), Y(fa()), 4.5, C.text, false);
    Fig.dot(ctx, X(B), Y(fb()), 4.5, C.text, false);

    // droite y = k
    ctx.strokeStyle = C.cos; ctx.lineWidth = 2;
    Fig.seg(ctx, P.l, Y(S.k), W - P.r + 4, Y(S.k));
    Fig.math(ctx, [['y', true], ' = ', ['k', true]], W - P.r + 8, Y(S.k), { size: 14, color: C.cos, align: 'left' });

    // solutions
    const sol = solutions(S.k);
    sol.forEach((x, i) => {
      ctx.save();
      ctx.strokeStyle = C.sin; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
      Fig.seg(ctx, X(x), Y(S.k), X(x), Y(0));
      ctx.restore();
      ctx.strokeStyle = C.sin; ctx.lineWidth = 2;
      Fig.seg(ctx, X(x), Y(0) - 5, X(x), Y(0) + 5);
      Fig.dot(ctx, X(x), Y(S.k), 5.5, C.sin);
      const lab = sol.length > 1 ? [['c', true], [String(i + 1), false, 'sub']] : [['c', true]];
      const below = S.k > 0.35, dx = Math.abs(X(x) - X(B)) < 16 ? -12 : Math.abs(X(x) - X(A)) < 16 ? 12 : 0;
      Fig.math(ctx, lab, X(x) + dx, Y(0) + (below ? 16 : -14), { size: 15, color: C.sin });
    });

    readout(sol);
  }

  function readout(sol) {
    const n = sol.length, inside = between(S.k), c = S.c;
    const nb = n === 0 ? 'aucune solution' : n === 1 ? '1 solution' : `${n} solutions`;
    $('res').innerHTML = `<i>k</i> = ${Fig.fixed(S.k, 2)} : <b>${nb}</b>` + (n ? ` (${sol.map(x => '≈ ' + Fig.fixed(x, 2)).join(' ; ')})` : '');
    let m;
    if (!inside) {
      m = `<i>k</i> n’est pas compris entre <i>f</i>(<i>a</i>) = ${Fig.num(fa(), 2)} et <i>f</i>(<i>b</i>) ≈ ${Fig.num(fb(), 2)} : le théorème <b>ne dit rien</b>. Ici, il y a ${nb}.`;
    } else if (c === 0) {
      m = `<i>k</i> est entre <i>f</i>(<i>a</i>) et <i>f</i>(<i>b</i>) et <i>f</i> est continue : le théorème garantit <b>au moins une</b> solution.` +
        (n > 1 ? ` Ici il y en a ${n} : rien n’interdit d’en avoir plusieurs.` : ' Ici il y en a une seule.');
    } else if (c === 1) {
      m = '<i>f</i> est continue et strictement croissante : la droite coupe la courbe en <b>exactement un point</b>. C’est le corollaire du théorème des valeurs intermédiaires.';
    } else if (n === 0) {
      m = 'La droite passe <b>dans le trou</b> : <i>k</i> est bien entre <i>f</i>(<i>a</i>) et <i>f</i>(<i>b</i>), mais <i>f</i> n’est pas continue en 4, et l’équation <i>f</i>(<i>x</i>) = <i>k</i> n’a aucune solution. Sans continuité, le théorème ne s’applique pas.';
    } else {
      m = 'Ici la droite coupe la courbe, mais pour <i>k</i> entre 2 et 3,5 elle passerait dans le trou : sans continuité, <b>rien n’est garanti</b>.';
    }
    $('msg').innerHTML = m;
    $('kv').textContent = Fig.fixed(S.k, 2);
  }

  function setK(k) { S.k = k; $('k').value = k; }
  const PLAY = '▶ Faire monter <em>k</em>';
  let last = 0;
  function loop(now) {
    if (!S.playing) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const hi = Math.max(fa(), fb());
    setK(Math.min(hi, S.k + dt * 0.9));
    if (S.k >= hi) { S.playing = false; $('play').innerHTML = PLAY; }
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  function stop() { S.playing = false; $('play').innerHTML = PLAY; }
  $('play').onclick = () => {
    if (S.playing) { stop(); return; }
    setK(Math.min(fa(), fb()));
    S.playing = true; $('play').textContent = '■ Arrêter';
    last = performance.now();
    requestAnimationFrame(loop);
  };
  $('k').addEventListener('input', e => { stop(); S.k = +e.target.value; draw(); });

  function setCase(i) {
    S.c = i;
    document.querySelectorAll('#cases .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    $('explain').innerHTML = cs().txt;
    draw();
  }
  $('cases').innerHTML = CASES.map(c => `<button class="chip">${c.name}</button>`).join('');
  document.querySelectorAll('#cases .chip').forEach((b, k) => (b.onclick = () => { stop(); setCase(k); }));
  setK(S.k);
  setCase(0);

  /* =================== Dichotomie =================== */
  const g = x => x ** 3 + x - 1;
  const MAXCUT = 8;
  const D = { hist: [[0, 1]], from: [0, 1], t: 1 };
  const dic = $('dic');
  const vD = Fig.setup(dic, { minWidth: 340, height: () => 230 }, () => drawD());

  function drawD() {
    const ctx = vD.ctx, W = vD.W, H = vD.H, P = { l: 24, r: 24, t: 14, b: 30 };
    const u0 = -0.08, u1 = 1.08, v0 = -1.15, v1 = 1.15;
    const X = v => P.l + ((v - u0) / (u1 - u0)) * (W - P.l - P.r);
    const Y = v => P.t + ((v1 - v) / (v1 - v0)) * (H - P.t - P.b);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round';

    const [lo1, hi1] = D.hist[D.hist.length - 1], e = Fig.ease(D.t);
    const lo = D.from[0] + (lo1 - D.from[0]) * e, hi = D.from[1] + (hi1 - D.from[1]) * e;

    // encadrement courant
    ctx.fillStyle = 'rgba(36,99,214,0.08)';
    ctx.fillRect(X(lo), P.t, Math.max(1.5, X(hi) - X(lo)), H - P.t - P.b);
    // axes
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    Fig.arrow(ctx, P.l - 4, Y(0), W - P.r + 10, Y(0), 6);
    Fig.seg(ctx, X(0), P.t, X(0), H - P.b);
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      Fig.seg(ctx, X(v), Y(0) - 3, X(v), Y(0) + 3);
      Fig.label(ctx, Fig.num(v, 2), X(v), H - P.b + 16, { size: 11, color: C.muted, halo: false });
    }
    // courbe
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.2; ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = u0 + ((u1 - u0) * i) / 200;
      i ? ctx.lineTo(X(x), Y(g(x))) : ctx.moveTo(X(x), Y(g(x)));
    }
    ctx.stroke();
    Fig.math(ctx, [['y', true], ' = ', ['g', true], '(', ['x', true], ')'], X(0.3), Y(g(0.3)) - 16, { size: 14 });
    // bornes de l’encadrement
    ctx.strokeStyle = C.cos; ctx.lineWidth = 4; ctx.lineCap = 'butt';
    Fig.seg(ctx, X(lo), Y(0), Math.max(X(lo) + 1.5, X(hi)), Y(0));
    ctx.lineWidth = 2;
    Fig.seg(ctx, X(lo), Y(0) - 11, X(lo), Y(0) + 11);
    Fig.seg(ctx, X(hi), Y(0) - 11, X(hi), Y(0) + 11);
    ctx.lineCap = 'round';
    Fig.dot(ctx, X(lo), Y(g(lo)), 4.5, C.sin);
    Fig.dot(ctx, X(hi), Y(g(hi)), 4.5, C.arc);
    // milieu à tester ensuite
    if (D.t >= 1 && D.hist.length <= MAXCUT) {
      const m = (lo + hi) / 2;
      ctx.save();
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      Fig.seg(ctx, X(m), P.t, X(m), H - P.b);
      ctx.restore();
      if (D.hist.length < 5) Fig.math(ctx, [['m', true]], X(m) + 8, P.t + 8, { size: 14, color: C.muted, align: 'left' });
    }
  }

  function tableD() {
    const n = D.hist.length - 1;
    const rows = D.hist.map(([lo, hi], i) =>
      `<tr><td>${i}</td><td class="${i === n ? 'sel' : ''}">${Fig.num(lo, 10)} &lt; α &lt; ${Fig.num(hi, 10)}</td><td>${Fig.num(hi - lo, 10)}</td></tr>`);
    $('dtable').innerHTML = '<tr><th>Étape</th><th>Encadrement</th><th>Amplitude</th></tr>' + rows.join('');
    if (n === 0) {
      $('dmsg').innerHTML = '<i>g</i>(0) = −1 &lt; 0 et <i>g</i>(1) = 1 &gt; 0 : α est entre 0 et 1. On teste le milieu <i>m</i>.';
    } else {
      const [a, b] = D.hist[n - 1], m = (a + b) / 2, gm = g(m);
      $('dmsg').innerHTML = `Milieu <i>m</i> = ${Fig.num(m, 10)} : <i>g</i>(<i>m</i>) ≈ ${Fig.num(gm, 4)} ${gm < 0 ? '&lt; 0' : '&gt; 0'},
        donc α est dans la moitié ${gm < 0 ? 'de droite' : 'de gauche'}.` +
        (n >= MAXCUT ? ` Après ${n} coupes, l’amplitude vaut 1/${2 ** n} : α ≈ 0,68.` : '');
    }
    $('cut').disabled = n >= MAXCUT;
  }

  function animD(now0) {
    const step = now => {
      D.t = Math.max(0, Math.min(1, (now - now0) / 450));
      drawD();
      if (D.t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  $('cut').onclick = () => {
    const [a, b] = D.hist[D.hist.length - 1], m = (a + b) / 2;
    D.from = [a, b];
    D.hist.push(g(m) < 0 ? [m, b] : [a, m]);
    D.t = 0; tableD(); animD(performance.now());
  };
  $('restart').onclick = () => { D.hist = [[0, 1]]; D.from = [0, 1]; D.t = 1; tableD(); drawD(); };
  tableD();
  drawD();
})();
