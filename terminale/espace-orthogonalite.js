(() => {
  const C = Fig.colors();
  const E = Espace;
  const $ = id => document.getElementById(id);

  /* Plan P incliné : base orthonormée (e1, e2), vecteur normal n. H est l’origine. */
  const a = 0.25;
  const e1 = [1, 0, 0], e2 = [0, Math.cos(a), -Math.sin(a)], n = E.cross(e1, e2);
  const H = [0, 0, 0], MH = 3, M = E.mul(n, MH), HALF = 4.25;
  const inP = (x, y) => E.add(E.mul(e1, x), E.mul(e2, y));

  const S = { r: 2.5, th: -0.5, playing: false };
  const view = E.view($('fig'), { center: [0, 0, 0.75], span: 12.5, spanH: 7, az: 0.6, el: 0.25, draw: () => draw() });

  function draw() {
    view.begin();
    const N = inP(S.r * Math.cos(S.th), S.r * Math.sin(S.th));

    // le plan P
    view.poly([inP(-HALF, -HALF), inP(HALF, -HALF), inP(HALF, HALF), inP(-HALF, HALF)], 'rgba(160,168,178,0.13)', C.axis, 1);
    view.label(inP(HALF - 0.5, -HALF + 0.5), 'P', { size: 16, italic: true, math: true, color: C.muted });

    // points du plan à la même distance de H : même distance de M
    if (S.r > 0.05) {
      const ring = [];
      for (let k = 0; k <= 96; k++) { const t = (k / 96) * Math.PI * 2; ring.push(inP(S.r * Math.cos(t), S.r * Math.sin(t))); }
      view.path(ring, C.faint, 1, [3, 4]);
      view.seg(H, N, C.muted, 1.5);
      view.square(H, n, E.sub(N, H), 0.38, C.text);
    }

    // un vecteur normal, dessiné à côté pour ne pas cacher [MH]
    const K = inP(-1.6, 2.6);
    view.arrow(K, E.add(K, E.mul(n, 1.5)), C.cos, 2.2);
    view.vec(E.add(K, E.mul(n, 1.15)), 'n', { color: C.cos, dx: -13 });

    view.seg(M, H, C.arc, 3);
    if (S.r > 0.05) view.seg(M, N, C.sin, 2.2);

    // points et noms
    view.dot(H, 4.5, C.arc);
    view.label(H, 'H', { size: 15, italic: true, math: true, color: C.arc, dx: 12, dy: 12 });
    view.dot(M, 5, C.text);
    view.label(M, 'M', { size: 15, italic: true, math: true, dx: -14, dy: -6 });
    if (S.r > 0.05) {
      const [hx, hy] = view.pt(H), [nx, ny] = view.pt(N), l = Math.hypot(nx - hx, ny - hy) || 1;
      view.dot(N, 5, C.sin);
      view.label(N, 'N', { size: 15, italic: true, math: true, color: C.sin, dx: ((nx - hx) / l) * 15, dy: ((ny - hy) / l) * 15 });
    }

    readout();
  }

  function readout() {
    const r = Math.round(S.r * 10) / 10, mn2 = 9 + r * r, mn = Math.sqrt(mn2);
    const exact = Math.abs(mn - Math.round(mn * 100) / 100) < 1e-9;
    $('rv').textContent = Fig.num(r, 1);
    $('r-hn').textContent = Fig.num(r, 1);
    $('r-mn').innerHTML = `<b class="c-sin">${exact ? '' : '≈ '}${Fig.num(mn, 2)}</b>`;
    $('pyth').innerHTML = `<i>MN</i>² = <i>MH</i>² + <i>HN</i>²<br>= 9 + ${Fig.num(r * r, 2)} = ${Fig.num(mn2, 2)}`;
    $('msg').innerHTML = r === 0
      ? `<b><i>N</i> est en <i>H</i></b> : <i>MN</i> = <i>MH</i> = 3. On ne peut pas faire plus court : la <b>distance du point <i>M</i> au plan <i>P</i></b> vaut 3.`
      : S.playing
        ? `<i>N</i> tourne, mais l’angle en <i>H</i> reste droit : (<i>MH</i>) est orthogonale à <b>toutes</b> les droites du plan qui passent par <i>H</i>. Et <i>MN</i> reste plus grand que 3.`
        : `<i>MN</i> ${exact ? '=' : '≈'} ${Fig.num(mn, 2)} &gt; <i>MH</i> = 3. Le triangle <i>MHN</i> est rectangle en <i>H</i> : l’hypoténuse <i>MN</i> est toujours plus longue que le côté <i>MH</i>.`;
  }

  /* N fait un tour complet autour de H. */
  let t0 = 0, th0 = 0;
  function loop(now) {
    if (!S.playing) return;
    const k = Math.min(1, (now - t0) / 5000);
    S.th = th0 + Fig.ease(k) * Math.PI * 2;
    if (k >= 1) S.playing = false;
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  $('play').onclick = () => {
    if (S.r < 0.5) { S.r = 2.5; $('r').value = S.r; }
    S.playing = true; t0 = performance.now(); th0 = S.th;
    requestAnimationFrame(loop);
  };
  $('r').value = S.r;
  $('r').addEventListener('input', e => { S.r = +e.target.value; draw(); });
  draw();
})();
