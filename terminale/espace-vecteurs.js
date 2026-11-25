(() => {
  const C = Fig.colors();
  const E = Espace;
  const $ = id => document.getElementById(id);

  const A = [2, 2, 2];
  const U = [2, 0, -1];
  const CASES = [
    { v: [1, 2, 0], vtxt: '(1 ; 2 ; 0)' },      // non colinéaire à u
    { v: [-1, 0, 0.5], vtxt: '(−1 ; 0 ; 0,5)' }, // v = −½ u
  ];
  const S = { c: 0, s: 0.5, t: 0.5, trace: 1, playing: false };
  const vv = () => CASES[S.c].v;
  const at = (s, t) => E.add(A, E.add(E.mul(U, s), E.mul(vv(), t)));
  const vec = s => `<span class="vec"><i>${s}</i></span>`;

  /* Chemin du balayage dans le carré −1 ≤ s, t ≤ 1 : les lignes (t constant), puis les colonnes (s constant). */
  const PATH = [];
  for (let k = 0; k <= 4; k++) { const t = -1 + 0.5 * k; PATH.push([k % 2 ? 1 : -1, t], [k % 2 ? -1 : 1, t]); }
  for (let k = 0; k <= 4; k++) { const s = 1 - 0.5 * k; PATH.push([s, k % 2 ? -1 : 1], [s, k % 2 ? 1 : -1]); }
  const LEN = [0];
  for (let i = 1; i < PATH.length; i++) LEN.push(LEN[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
  const TOTAL = LEN[LEN.length - 1];
  function walk(tau) {
    const d = tau * TOTAL, pts = [PATH[0]];
    for (let i = 1; i < PATH.length; i++) {
      if (LEN[i] <= d) { pts.push(PATH[i]); continue; }
      const k = (d - LEN[i - 1]) / (LEN[i] - LEN[i - 1]), p = PATH[i - 1], q = PATH[i];
      pts.push([p[0] + k * (q[0] - p[0]), p[1] + k * (q[1] - p[1])]);
      break;
    }
    return pts;
  }

  const view = E.view($('fig'), { center: [2.3, 2.5, 1.9], span: 11, az: 0.6, el: 0.42, draw: () => draw() });

  function draw() {
    view.begin();
    view.floor(5, 5);
    view.axes([5.5, 6, 4.5]);
    const v = vv(), P = E.add(A, E.mul(U, S.s)), M = at(S.s, S.t);

    // la trace de M : le plan (ou la droite) apparaît
    if (S.trace >= 1 && S.c === 0) view.poly([at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)], 'rgba(43,147,72,0.10)', null);
    view.path(walk(S.trace).map(([s, t]) => at(s, t)), 'rgba(43,147,72,0.6)', S.c ? 3.5 : 1.3);

    // vecteurs de base, en clair
    view.arrow(A, E.add(A, U), 'rgba(36,99,214,0.28)', 5);
    view.arrow(A, E.add(A, v), 'rgba(214,69,43,0.28)', 5);
    view.vec(E.add(A, E.mul(U, 1.18)), 'u', { color: C.cos, dy: -2 });
    view.vec(E.add(A, E.mul(v, S.c ? 1.45 : 1.2)), 'v', { color: C.sin, dy: -2 });

    // le chemin A → s·u → t·v = M
    view.arrow(A, P, C.cos, 2);
    view.arrow(P, M, C.sin, 2);
    view.seg(A, M, C.text, 1, [4, 3]);

    view.dot(A, 4.5, C.text);
    view.label(A, 'A', { size: 15, italic: true, math: true, dx: -12, dy: -10 });
    view.seg(M, [M[0], M[1], 0], C.faint, 1, [2, 3]);
    view.dot([M[0], M[1], 0], 2, C.faint, false);
    view.dot(M, 5.5, C.arc);
    view.label(M, 'M', { size: 15, italic: true, math: true, color: C.arc, dx: 13, dy: -11 });

    readout(M);
  }

  function term(k, name, first) {
    const n = Fig.num(Math.abs(k), 1);
    return (first ? (k < 0 ? '−' : '') : k < 0 ? ' − ' : ' + ') + `${n} ${vec(name)}`;
  }

  function readout(M) {
    $('rel').innerHTML = `${vec('AM')} = ${term(S.s, 'u', true)}${term(S.t, 'v')}`;
    $('r-m').textContent = `(${Fig.num(M[0], 2)} ; ${Fig.num(M[1], 2)} ; ${Fig.num(M[2], 2)})`;
    $('msg').innerHTML = S.c === 0
      ? `Quels que soient <i>s</i> et <i>t</i>, <i>M</i> reste dans le plan vert : le plan qui passe par <i>A</i> et qui est dirigé par ${vec('u')} et ${vec('v')}.`
      : `<i>M</i> ne quitte jamais la droite passant par <i>A</i> et dirigée par ${vec('u')} : avancer selon ${vec('v')}, c’est encore avancer selon ${vec('u')}.
         Avec deux vecteurs colinéaires, on n’obtient pas un plan.`;
    $('sv').textContent = Fig.num(S.s, 1);
    $('tv').textContent = Fig.num(S.t, 1);
  }

  function setCase(i) {
    S.c = i; S.trace = 1; S.playing = false;
    document.querySelectorAll('#cases .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    $('explain').innerHTML = i === 0
      ? `Les vecteurs ${vec('u')}(2 ; 0 ; −1) et ${vec('v')}(1 ; 2 ; 0) partent du point <i>A</i>(2 ; 2 ; 2).
         On place <i>M</i> en avançant de <i>s</i> fois ${vec('u')}, puis de <i>t</i> fois ${vec('v')} : ${vec('AM')} = <i>s</i> ${vec('u')} + <i>t</i> ${vec('v')}.`
      : `Cette fois ${vec('v')}${CASES[1].vtxt} = −½ ${vec('u')} : il a la même direction que ${vec('u')}.
         On garde la même construction ${vec('AM')} = <i>s</i> ${vec('u')} + <i>t</i> ${vec('v')}. Que devient le plan ?`;
    draw();
  }

  /* Balayage : M parcourt le carré des valeurs (s, t) en laissant une trace. */
  let t0 = 0;
  function loop(now) {
    if (!S.playing) return;
    S.trace = Math.min(1, (now - t0) / 7000);
    const pts = walk(S.trace);
    [S.s, S.t] = pts[pts.length - 1];
    $('s').value = S.s; $('t').value = S.t;
    if (S.trace >= 1) S.playing = false;
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  $('play').onclick = () => {
    S.trace = 0; S.playing = true; t0 = performance.now();
    requestAnimationFrame(loop);
  };

  document.querySelectorAll('#cases .chip').forEach((b, k) => (b.onclick = () => setCase(k)));
  for (const k of ['s', 't']) {
    $(k).value = S[k];
    $(k).addEventListener('input', e => { S[k] = +e.target.value; S.playing = false; S.trace = 1; draw(); });
  }
  setCase(0);
})();
