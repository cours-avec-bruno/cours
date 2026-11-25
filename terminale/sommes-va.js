(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);

  /* =================== Deux dés =================== */
  const two = $('two');
  const vTwo = Fig.setup(two, { minWidth: 340, height: W => (W < 720 ? 560 : 320) }, () => drawTwo());
  let sel = 7, G2 = null;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const ways = s => 6 - Math.abs(s - 7);

  function drawTwo() {
    const ctx = vTwo.ctx, W = vTwo.W, H = vTwo.H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    const narrow = W < 720;  // écran étroit : l’histogramme passe sous le tableau
    const c = narrow ? Math.min(36, (W - 100) / 6) : Math.min(40, (H - 84) / 6), gx = narrow ? (W - 6 * c) / 2 + 20 : 92, gy = 66;
    const hx0 = narrow ? 52 : gx + 6 * c + 86, hx1 = W - (narrow ? 12 : 24), hy0 = narrow ? gy + 6 * c + 44 : 40, hb = H - 40;
    const bwid = (hx1 - hx0) / 11, unit = (hb - hy0 - 24) / 6;
    G2 = { c, gx, gy, hx0, hx1, hy0, hb, bwid, unit };

    // tableau
    Fig.label(ctx, '+', gx - c / 2, gy - c / 2, { size: 15, color: C.muted, halo: false });
    Fig.math(ctx, [['Y', true]], gx + 3 * c - 26, gy - c - 12, { size: 14, color: C.muted, halo: false });
    Fig.label(ctx, '(2ᵉ dé)', gx + 3 * c + 6, gy - c - 12, { size: 11, color: C.faint, halo: false });
    Fig.math(ctx, [['X', true]], gx - c - 30, gy + 3 * c - 8, { size: 14, color: C.muted, halo: false });
    Fig.label(ctx, '(1ᵉʳ dé)', gx - c - 30, gy + 3 * c + 9, { size: 11, color: C.faint, halo: false });
    for (let i = 1; i <= 6; i++) {
      Fig.label(ctx, String(i), gx + (i - 0.5) * c, gy - c / 2, { size: 13, color: C.muted, weight: '600', halo: false });
      Fig.label(ctx, String(i), gx - c / 2, gy + (i - 0.5) * c, { size: 13, color: C.muted, weight: '600', halo: false });
    }
    for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) {
      const s = x + y, on = s === sel, px = gx + (y - 1) * c, py = gy + (x - 1) * c;
      ctx.fillStyle = on ? C.add : s % 2 ? '#fff' : C.soft;
      ctx.fillRect(px, py, c, c);
      ctx.strokeStyle = on ? C.cos : C.line; ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, c - 1, c - 1);
      Fig.label(ctx, String(s), px + c / 2, py + c / 2, { size: 14, color: on ? C.cos : C.muted, weight: on ? '600' : '', math: true, halo: false });
    }

    // histogramme
    for (let k = 1; k <= 6; k++) {
      const y = hb - k * unit;
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      Fig.seg(ctx, hx0, y, hx1, y);
      Fig.label(ctx, `${k}/36`, hx0 - 6, y, { size: 11, color: C.muted, align: 'right', halo: false });
    }
    ctx.strokeStyle = C.axis; Fig.seg(ctx, hx0, hb, hx1, hb);
    for (let s = 2; s <= 12; s++) {
      const x = hx0 + (s - 2) * bwid, on = s === sel, h = ways(s) * unit;
      ctx.fillStyle = on ? C.add : C.base;
      ctx.fillRect(x + bwid * 0.15, hb - h, bwid * 0.7, h);
      if (on) { ctx.strokeStyle = C.cos; ctx.lineWidth = 1.2; ctx.strokeRect(x + bwid * 0.15, hb - h, bwid * 0.7, h); }
      Fig.label(ctx, String(s), x + bwid / 2, hb + 14, { size: 12, color: on ? C.cos : C.muted, weight: on ? '600' : '', halo: false });
      if (on) Fig.label(ctx, `${ways(s)}/36`, x + bwid / 2, hb - h - 12, { size: 12, color: C.cos, weight: '600' });
    }
    Fig.math(ctx, [['X', true], ' + ', ['Y', true]], (hx0 + hx1) / 2, hb + 32, { size: 13, color: C.muted, halo: false });

    const w = ways(sel), d = gcd(w, 36);
    $('two-res').innerHTML = `<i>P</i>(<i>X</i> + <i>Y</i> = ${sel}) = ${w}/36${d > 1 ? ` = ${w / d}/${36 / d}` : ''}`;
    const cells = [];
    for (let x = 1; x <= 6; x++) if (sel - x >= 1 && sel - x <= 6) cells.push(`(${x} ; ${sel - x})`);
    $('two-msg').innerHTML = `La diagonale de ${sel} contient <b>${w}</b> case${w > 1 ? 's' : ''} : ${cells.join(', ')}.
      Plus la diagonale est longue, plus la somme est probable : 7 est la plus fréquente.
      Le centre de l’histogramme est <i>E</i>(<i>X</i> + <i>Y</i>) = 3,5 + 3,5 = 7.`;
  }

  function pick(e) {
    const r = two.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, g = G2;
    let s = null;
    if (x > g.gx && x < g.gx + 6 * g.c && y > g.gy && y < g.gy + 6 * g.c) {
      s = Math.floor((y - g.gy) / g.c) + 1 + Math.floor((x - g.gx) / g.c) + 1;
    } else if (x > g.hx0 && x < g.hx1 && y > g.hy0 - 20 && y < g.hb + 24) {
      s = Math.floor((x - g.hx0) / g.bwid) + 2;
    }
    two.style.cursor = s ? 'pointer' : 'default';
    if (s && s !== sel) { sel = s; drawTwo(); }
  }
  two.addEventListener('pointermove', pick);
  two.addEventListener('pointerdown', pick);
  drawTwo();

  /* =================== n dés =================== */
  const many = $('many');
  const vMany = Fig.setup(many, { minWidth: 340, height: W => Math.round(Math.min(340, Math.max(280, W * 0.3))) }, () => drawMany());
  const VMAX = 72;
  let n = 1, timer = null;

  function law(n) { // P(S_n = s) pour s = 0 … 6n
    let d = [1];
    for (let i = 0; i < n; i++) {
      const nd = Array(d.length + 6).fill(0);
      d.forEach((p, s) => { for (let f = 1; f <= 6; f++) nd[s + f] += p / 6; });
      d = nd;
    }
    return d;
  }

  function drawMany() {
    const ctx = vMany.ctx, W = vMany.W, H = vMany.H;
    const L = 56, R = 20, T = 34, B = 34;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    const d = law(n), pmax = Math.max(...d) * 1.18;
    const X = v => L + (v / VMAX) * (W - L - R), Y = p => H - B - (p / pmax) * (H - T - B);
    const E = 3.5 * n, sd = Math.sqrt((35 / 12) * n);

    // bande E ± σ
    ctx.fillStyle = 'rgba(43,147,72,0.12)';
    ctx.fillRect(X(E - sd), T - 14, X(E + sd) - X(E - sd), H - B - T + 14);

    // quadrillage
    const st = Fig.niceStep(pmax, 4);
    for (let p = st; p < pmax; p += st) {
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      Fig.seg(ctx, L, Y(p), W - R, Y(p));
      Fig.label(ctx, Fig.num(p * 100, 1) + ' %', L - 6, Y(p), { size: 11, color: C.muted, align: 'right', halo: false });
    }
    ctx.strokeStyle = C.axis; Fig.seg(ctx, L, H - B, W - R, H - B);
    for (let v = 0; v <= VMAX; v += 6) Fig.label(ctx, String(v), X(v), H - B + 14, { size: 11, color: C.muted, halo: false });

    // barres
    const bw = Math.max(1.5, (X(1) - X(0)) * 0.78);
    for (let s = n; s <= 6 * n; s++) {
      ctx.fillStyle = C.add; ctx.fillRect(X(s) - bw / 2, Y(d[s]), bw, H - B - Y(d[s]));
      ctx.strokeStyle = C.cos; ctx.lineWidth = 1;
      Fig.seg(ctx, X(s) - bw / 2, Y(d[s]), X(s) + bw / 2, Y(d[s]));
    }

    // espérance
    ctx.save();
    ctx.strokeStyle = C.sin; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
    Fig.seg(ctx, X(E), T - 14, X(E), H - B);
    ctx.restore();
    Fig.math(ctx, [['E', true], ' = ' + Fig.num(E, 1)], X(E) + 6, T - 6, { size: 13, color: C.sin, align: 'left' });
    Fig.math(ctx, ['σ ≈ ' + Fig.num(sd, 2)], X(E - sd) - 6, T - 6, { size: 13, color: C.arc, align: 'right' });

    $('nv').textContent = n;
    $('r-e').innerHTML = `<b>${Fig.num(E, 1)}</b>`;
    $('r-v').innerHTML = `≈ <b>${Fig.num((35 / 12) * n, 2)}</b>`;
    $('r-s').innerHTML = `≈ <b>${Fig.num(sd, 2)}</b>`;
    $('msg').innerHTML = n === 1
      ? 'Un seul dé : les 6 valeurs sont équiprobables. <i>E</i> = 3,5 et σ ≈ 1,71.'
      : `Par rapport à un seul dé, l’espérance est multipliée par <b>${n}</b>, mais l’écart type seulement par √${n} ≈ <b>${Fig.num(Math.sqrt(n), 2)}</b>.
        La somme est de plus en plus grande, mais relativement de moins en moins dispersée.`;
  }

  function setN(v) { n = v; $('n').value = n; drawMany(); }
  $('n').addEventListener('input', e => { clearInterval(timer); timer = null; setN(+e.target.value); });
  $('play').onclick = () => {
    clearInterval(timer);
    setN(1);
    timer = setInterval(() => {
      if (n >= 12) { clearInterval(timer); timer = null; return; }
      setN(n + 1);
    }, 700);
  };
  setN(4);
})();
