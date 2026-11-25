(() => {
  const C = Fig.colors();
  const E = Espace;
  const $ = id => document.getElementById(id);

  /* Droite d : M(t) = A + t·u.  Plan P : 2x + y + 2z − 6 = 0, de vecteur normal n(2 ; 1 ; 2). */
  const A = [3, 0, 3], U = [-1, 1, -1], N = [2, 1, 2];
  const val = p => E.dot(N, p) - 6;
  const Mt = t => E.add(A, E.mul(U, t));
  const TRI = [[3, 0, 0], [0, 6, 0], [0, 0, 3]]; // traces du plan sur les axes
  const I = Mt(2);
  const S = { t: 0, playing: false };
  const side = v => (Math.abs(v) < 1e-9 ? C.arc : v < 0 ? C.cos : C.sin);

  const view = E.view($('fig'), { center: [1.3, 2.7, 1.5], span: 11, spanH: 7.6, az: 0.55, el: 0.36, draw: () => draw() });

  function draw() {
    view.begin();
    const eye = Math.sign(E.dot(N, view.eye())); // côté du plan où se trouve l’observateur
    const hidden = p => eye !== 0 && Math.sign(val(p)) === -eye && view.covers(TRI, p);

    view.axes([4.5, 7.5, 4]);

    // la droite d, découpée en morceaux vus / cachés par le plan
    const runs = [];
    for (let k = 0; k <= 160; k++) {
      const p = Mt(-1.3 + (5.9 * k) / 160), h = hidden(p), last = runs[runs.length - 1];
      if (!last || last.h !== h) runs.push({ h, pts: last ? [last.pts[last.pts.length - 1], p] : [p] });
      else last.pts.push(p);
    }
    for (const r of runs) if (r.h) view.path(r.pts, C.muted, 1.4, [5, 4]);

    // le plan P (triangle de ses traces sur les axes)
    view.poly(TRI, 'rgba(120,140,170,0.16)', C.muted, 1.2);
    view.label([3, 0, 0], '3', { size: 12, color: C.muted, dx: -6, dy: 12 });
    view.label([0, 6, 0], '6', { size: 12, color: C.muted, dx: 2, dy: 13 });
    view.label([0, 0, 3], '3', { size: 12, color: C.muted, dx: -10, dy: 0 });
    view.label([0.3, 5.2, 0.35], 'P', { size: 16, italic: true, math: true, color: C.muted });

    for (const r of runs) if (!r.h) view.path(r.pts, C.text, 1.7);
    view.label(Mt(4.5), 'd', { size: 16, italic: true, math: true, dx: 12, dy: 2 });

    // vecteur normal n, posé sur le plan
    const P0 = [0.5, 4, 0.5];
    view.arrow(P0, E.add(P0, E.mul(N, 0.6)), C.cos, 2);
    view.vec(E.add(P0, E.mul(N, 0.6)), 'n', { color: C.cos, dx: 12, dy: -6 });

    // vecteur directeur u en A
    view.arrow(A, E.add(A, U), C.text, 2.2);
    view.vec(E.add(A, E.mul(U, 0.7)), 'u', { dx: -4, dy: 17 });
    pointAt(A, C.text, 4, hidden(A));
    view.label(A, 'A', { size: 15, italic: true, math: true, dx: -12, dy: -8 });

    // point d’intersection, une fois atteint
    if (S.t >= 2 - 1e-9) {
      view.dot(I, 7, 'rgba(43,147,72,0.18)', false);
      view.label(I, 'I', { size: 15, italic: true, math: true, color: C.arc, dx: -12, dy: 10 });
    }

    const M = Mt(S.t), v = val(M);
    pointAt(M, side(v), 6, hidden(M));
    view.label(M, 'M', { size: 15, italic: true, math: true, color: side(v), dx: 14, dy: -10 });

    readout(M, v);
  }

  /* Point plein, ou simple cercle s’il est caché derrière le plan. */
  function pointAt(p, color, r, behind) {
    if (!behind) return view.dot(p, r, color);
    const [x, y] = view.pt(p), ctx = view.ctx;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }

  function readout(M, v) {
    const c = side(v);
    $('tv').textContent = Fig.num(S.t, 2);
    $('r-m').textContent = `(${Fig.num(M[0], 2)} ; ${Fig.num(M[1], 2)} ; ${Fig.num(M[2], 2)})`;
    $('val').innerHTML = `2<i>x</i> + <i>y</i> + 2<i>z</i> − 6 = <b style="color:${c}">${Fig.num(v, 2)}</b>`;
    $('msg').innerHTML = Math.abs(v) < 1e-9
      ? `<b>La valeur est nulle : <i>M</i> est sur le plan.</b> C’est le point d’intersection <i>I</i>(1 ; 2 ; 1), atteint pour <i>t</i> = 2.`
      : v < 0
        ? `Valeur <b>négative</b> : <i>M</i> est du même côté du plan que l’origine <i>O</i> (en <i>O</i>, la valeur vaut −6).`
        : `Valeur <b>positive</b> : <i>M</i> est de l’autre côté du plan par rapport à l’origine <i>O</i>.`;
  }

  /* M avance de t = −1 à t = 4, avec une pause quand il touche le plan (t = 2). */
  let t0 = 0;
  function loop(now) {
    if (!S.playing) return;
    const e = (now - t0) / 1000, go = s => -1 + (5 * s) / 6; // 6 s pour aller de −1 à 4
    S.t = e < 3.6 ? go(e) : e < 4.8 ? 2 : Math.min(4, go(e - 1.2));
    if (e >= 7.2) S.playing = false;
    $('t').value = S.t;
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  $('play').onclick = () => { S.playing = true; t0 = performance.now(); requestAnimationFrame(loop); };
  $('t').value = S.t;
  $('t').addEventListener('input', e => { S.playing = false; S.t = Math.round(+e.target.value * 10) / 10; draw(); });
  draw();
})();
