(() => {
  const PI = Math.PI, TAU = 2 * PI;
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');

  const S = {
    t: PI / 3, playing: false, speed: 1, step: 1,
    f: { proj: false, tri: false, arc: true, sin: false, cos: false, ghost: false, marks: false },
  };

  const STEPS = {
    1: {
      t: PI / 3, play: false,
      f: { proj: false, tri: false, arc: true, sin: false, cos: false, ghost: false, marks: false },
      html: `<b>Le cercle trigonométrique.</b> C'est un cercle de centre O et de <b>rayon 1</b>. Le point M part de I et tourne
        dans le sens inverse des aiguilles d'une montre. On « enroule » l'axe des nombres autour du cercle :
        la longueur de l'arc IM (<span class="c-arc">en vert</span>) vaut exactement <i>θ</i>. À droite, on voit cet arc
        « déroulé » sur l'axe. Un tour complet mesure 2π ≈ 6,28 : c'est pour ça que 360° = 2π radians.`,
    },
    2: {
      t: PI / 3, play: false,
      f: { proj: true, tri: true, arc: false, sin: false, cos: false, ghost: false, marks: true },
      html: `<b>Cosinus et sinus.</b> cos <i>θ</i> est l'<span class="c-cos">abscisse</span> de M et sin <i>θ</i> son
        <span class="c-sin">ordonnée</span> : M(cos <i>θ</i> ; sin <i>θ</i>). Dans le triangle rectangle OHM, l'hypoténuse OM vaut 1,
        donc on retrouve le collège : cos = adjacent ÷ hypoténuse = OH, et sin = opposé ÷ hypoténuse = HM.
        Pythagore donne cos²<i>θ</i> + sin²<i>θ</i> = 1. Et comme M reste sur un cercle de rayon 1, cos et sin restent entre −1 et 1.`,
    },
    3: {
      t: 0, play: true,
      f: { proj: true, tri: false, arc: false, sin: true, cos: false, ghost: false, marks: false },
      html: `<b>La courbe du sinus.</b> À chaque instant, on reporte la <span class="c-sin">hauteur de M</span> (sin <i>θ</i>)
        au-dessus de l'abscisse <i>θ</i>. De I à J, M monte : sin <i>θ</i> passe de 0 à 1. Puis M redescend : 0 en π,
        il passe sous l'axe jusqu'à −1 en 3π/2, et revient à 0. Après un tour complet (2π), M est revenu en I :
        tout recommence. La courbe se répète, on dit que sin est <b>périodique de période 2π</b>.`,
    },
    4: {
      t: 0, play: true,
      f: { proj: true, tri: false, arc: false, sin: true, cos: true, ghost: true, marks: false },
      html: `<b>La courbe du cosinus.</b> Même principe, mais avec l'<span class="c-cos">abscisse de M</span> (segment bleu) :
        cos <i>θ</i> part de 1 (M est en I), vaut 0 en π/2, −1 en π, puis revient à 1 en 2π. On obtient
        exactement la même vague que le sinus, mais <b>décalée de π/2</b> : le cosinus a un quart de tour d'avance.`,
    },
    0: {
      f: { proj: true, tri: false, arc: false, sin: true, cos: true, ghost: true, marks: false },
      html: `<b>Mode libre.</b> Attrape M à la souris (sur le cercle, ou directement sur la courbe), utilise le curseur,
        M s'aimante sur les angles remarquables (π/6, π/4, π/3…) : les valeurs exactes s'affichent alors.`,
    },
  };

  const REM = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
  const RADL = ['0', 'π/2', 'π', '3π/2', '2π', '5π/2', '3π', '7π/2', '4π'];

  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const deg = t => (t * 180) / PI;
  function piFrac(t) {
    const k = Math.round(t / (PI / 12));
    if (Math.abs(t - (k * PI) / 12) > 1e-7) return null;
    if (k === 0) return '0';
    const g = gcd(k, 12), n = k / g, d = 12 / g;
    const ns = n === 1 ? 'π' : n + 'π';
    return d === 1 ? ns : ns + '/' + d;
  }
  const isRem = t => REM.some(r => Math.abs(deg(t) - r) < 1e-6);
  function exact(v) {
    const a = Math.abs(v);
    const T = [[0, '0'], [0.5, '1/2'], [Math.SQRT1_2, '√2/2'], [Math.sqrt(3) / 2, '√3/2'], [1, '1']];
    for (const [x, s] of T) if (Math.abs(a - x) < 1e-9) return (v < 0 && x > 0 ? '−' : '') + s;
    return null;
  }

  /* ---------- Géométrie : cercle et graphe à la même échelle ---------- */
  const rOf = W => Math.min(150, (W - 144) / (2 + TAU));
  const view = Fig.setup(canvas, { minWidth: 680, height: W => Math.round(2 * rOf(W) + 104) }, () => draw());
  let G;
  function geom() {
    const W = view.W, H = view.H, R = rOf(W);
    const cx = 56 + R, cy = H / 2, x0 = cx + R + 48;
    G = { W, H, R, cx, cy, x0, tMax: (W - x0 - 30) / R };
  }
  const gx = t => G.x0 + t * G.R;
  const gy = v => G.cy - v * G.R;

  function curve(fn, from, to, color, width, alpha) {
    if (to <= from) return;
    const ctx = view.ctx, step = 1.5 / G.R;
    ctx.save();
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath();
    for (let t = from, first = true; ; t += step) {
      const tt = Math.min(t, to);
      const x = gx(tt), y = gy(fn(tt));
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      if (tt >= to) break;
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    geom();
    const ctx = view.ctx, { W, H, R, cx, cy, x0, tMax } = G, t = S.t, f = S.f;
    const c = Math.cos(t), s = Math.sin(t), Mx = cx + R * c, My = cy - R * s;
    const xEnd = gx(tMax);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Repères y = 1 et y = −1, prolongés depuis le cercle
    ctx.save();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    for (const v of [1, -1]) Fig.seg(ctx, cx, gy(v), xEnd, gy(v));
    ctx.restore();

    // Graduations du graphe (multiples de π/2)
    for (let k = 1; (k * PI) / 2 <= tMax + 1e-9; k++) {
      const x = gx((k * PI) / 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.line; Fig.seg(ctx, x, gy(1), x, gy(-1));
      ctx.strokeStyle = C.axis; Fig.seg(ctx, x, cy - 4, x, cy + 4);
      const far = (k * PI) / 2 > TAU + 1e-9;
      Fig.label(ctx, RADL[k] || k + 'π/2', x, gy(-1) + 19, { size: 12, color: far ? C.faint : C.muted, halo: false });
      Fig.label(ctx, k * 90 + '°', x, gy(-1) + 34, { size: 11, color: C.faint, halo: false });
    }

    // Axes
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    Fig.arrow(ctx, cx - R - 20, cy, cx + R + 22, cy, 6);
    Fig.arrow(ctx, cx, cy + R + 20, cx, cy - R - 22, 6);
    Fig.arrow(ctx, x0, cy, xEnd + 14, cy, 6);
    Fig.arrow(ctx, x0, gy(-1) - 0 + 14, x0, gy(1) - 22, 6);
    Fig.math(ctx, [['θ', true]], xEnd + 12, cy + 15, { size: 15, color: C.muted });
    Fig.label(ctx, '1', x0 - 9, gy(1), { align: 'right', size: 12, color: C.muted });
    Fig.label(ctx, '−1', x0 - 9, gy(-1), { align: 'right', size: 12, color: C.muted });
    Fig.label(ctx, '0', x0 - 9, cy + 11, { align: 'right', size: 12, color: C.muted });

    // Cercle
    ctx.strokeStyle = C.text; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();

    // Repères sur le cercle
    if (f.marks) {
      for (const d of REM) {
        if (d === 360) continue;
        const a = (d * PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
        ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
        Fig.seg(ctx, cx + (R - 4) * ca, cy - (R - 4) * sa, cx + (R + 4) * ca, cy - (R + 4) * sa);
        if (d === 0) continue;
        const lab = piFrac(a);
        const rr = R + 15;
        Fig.label(ctx, lab, cx + rr * ca, cy - rr * sa, {
          size: 11, color: C.muted, align: ca > 0.3 ? 'left' : ca < -0.3 ? 'right' : 'center',
        });
      }
    }

    // Enroulement : l'arc IM et sa longueur reportée sur l'axe
    if (f.arc && t > 0.001) {
      ctx.strokeStyle = C.arc; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, -t, true); ctx.stroke();
      Fig.seg(ctx, gx(0), cy, gx(t), cy);
      ctx.lineWidth = 1.5;
      Fig.seg(ctx, gx(t), cy - 6, gx(t), cy + 6);
      if (!f.sin && !f.cos) {
        Fig.label(ctx, 'longueur de l’arc IM ≈ ' + Fig.fixed(t, 2), Math.max(gx(t / 2), x0 + 80), cy + 18, { size: 12, color: C.arc });
      }
    }

    // Triangle OHM
    if (f.tri) {
      ctx.fillStyle = 'rgba(29,31,35,0.05)';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(Mx, cy); ctx.lineTo(Mx, My); ctx.closePath(); ctx.fill();
      const q = Math.min(9, Math.abs(Mx - cx) / 2.5, Math.abs(My - cy) / 2.5);
      if (q > 3) {
        const sx = cx > Mx ? 1 : -1, sy = My > cy ? 1 : -1;
        ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(Mx + sx * q, cy); ctx.lineTo(Mx + sx * q, cy + sy * q); ctx.lineTo(Mx, cy + sy * q); ctx.stroke();
      }
      ctx.strokeStyle = C.sin; ctx.lineWidth = 3; Fig.seg(ctx, Mx, cy, Mx, My);
    }

    // Projections de M sur les axes
    if (f.proj) {
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
      if (!f.tri) Fig.seg(ctx, Mx, My, Mx, cy);
      Fig.seg(ctx, Mx, My, cx, My);
      ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = C.sin; Fig.seg(ctx, cx, cy, cx, My);
    }
    if (f.proj || f.tri) { ctx.lineWidth = 4; ctx.strokeStyle = C.cos; Fig.seg(ctx, cx, cy, Mx, cy); }

    // Angle θ
    const r0 = Math.min(28, R * 0.24);
    if (t > 0.001) {
      ctx.strokeStyle = C.text; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, r0, 0, -t, true); ctx.stroke();
    }
    if (t > 0.3) Fig.math(ctx, [['θ', true]], cx + (r0 + 11) * Math.cos(t / 2), cy - (r0 + 11) * Math.sin(t / 2), { size: 15 });

    // Rayon OM
    ctx.strokeStyle = C.text; ctx.lineWidth = 2; Fig.seg(ctx, cx, cy, Mx, My);

    // Étiquettes cos / sin sur le cercle
    if ((f.proj || f.tri) && Math.abs(c) > 0.32) {
      Fig.math(ctx, ['cos ', ['θ', true]], (cx + Mx) / 2, cy + (s >= 0 ? 16 : -15), { size: 14, color: C.cos });
    }
    if (Math.abs(s) > 0.22) {
      if (f.proj) {
        Fig.math(ctx, ['sin ', ['θ', true]], cx + (c >= 0 ? -8 : 8), (cy + My) / 2, { size: 14, color: C.sin, align: c >= 0 ? 'right' : 'left' });
      } else if (f.tri) {
        Fig.math(ctx, ['sin ', ['θ', true]], Mx + (c >= 0 ? 8 : -8), (cy + My) / 2, { size: 14, color: C.sin, align: c >= 0 ? 'left' : 'right' });
      }
    }

    // Points et noms
    Fig.dot(ctx, cx, cy, 2.5, C.text, false);
    Fig.label(ctx, 'O', cx - 10, cy + 13, { size: 13, color: C.muted });
    if (!f.marks) {
      Fig.label(ctx, 'I', cx + R + 8, cy + 13, { size: 13, color: C.muted });
      Fig.label(ctx, 'J', cx - 10, cy - R - 9, { size: 13, color: C.muted });
    }
    if (f.tri && Math.abs(s) > 0.15 && Math.abs(c) > 0.15) {
      Fig.label(ctx, 'H', Mx + (c >= 0 ? 9 : -9), cy + (s >= 0 ? 13 : -13), { size: 13, color: C.muted });
    }
    Fig.dot(ctx, Mx, My, 5.5, C.text);
    const rl = f.marks ? R - 17 : R + 17;
    Fig.label(ctx, 'M', cx + rl * c, cy - rl * s, { size: 14, weight: '600' });

    // Courbes
    if (f.cos) { if (f.ghost) curve(Math.cos, 0, tMax, C.cos, 1.5, 0.22); curve(Math.cos, 0, t, C.cos, 2.5, 1); }
    if (f.sin) { if (f.ghost) curve(Math.sin, 0, tMax, C.sin, 1.5, 0.22); curve(Math.sin, 0, t, C.sin, 2.5, 1); }

    const X1 = gx(t), off = f.sin && f.cos ? 2.5 : 0;
    if (f.sin) {
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.globalAlpha = 0.55; ctx.strokeStyle = C.sin; ctx.lineWidth = 1;
      Fig.seg(ctx, Mx, My, X1, My);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = C.sin; ctx.lineWidth = 4;
      Fig.seg(ctx, X1 + off, cy, X1 + off, My); ctx.restore();
    }
    if (f.cos) {
      ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = C.cos; ctx.lineWidth = 4;
      Fig.seg(ctx, X1 - off, cy, X1 - off, gy(c)); ctx.restore();
    }

    // Étape 4 : montrer le décalage de π/2 entre les deux courbes
    if (S.step === 4 && f.sin && f.cos && t >= PI / 2) {
      const y = gy(1) - 16;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2;
      Fig.arrow(ctx, gx(PI / 2), y, gx(0) + 2, y, 6);
      Fig.label(ctx, 'décalage de π/2', gx(PI / 4), y - 12, { size: 12, color: C.muted });
    }

    if (f.cos) Fig.dot(ctx, X1, gy(c), 4.5, C.cos);
    if (f.sin) Fig.dot(ctx, X1, My, 4.5, C.sin);

    readout();
  }

  /* ---------- Valeurs affichées ---------- */
  function readout() {
    const t = S.t, c = Math.cos(t), s = Math.sin(t), pf = piFrac(t), ex = isRem(t);
    const degS = Fig.num(deg(t), 1) + '°';
    const radS = (pf || Fig.fixed(t, 3)) + ' rad';
    const eq = pf ? '=' : '≈';
    $('r-theta').innerHTML = `<b>${radS}</b> <span class="muted">${eq} ${degS}</span>`;
    $('r-cos').innerHTML = `<b>${Fig.fixed(c, 3)}</b>` + (ex ? ` <span class="muted">= ${exact(c)}</span>` : '');
    $('r-sin').innerHTML = `<b>${Fig.fixed(s, 3)}</b>` + (ex ? ` <span class="muted">= ${exact(s)}</span>` : '');
    const sl = $('slider');
    if (document.activeElement !== sl) sl.value = deg(t);
    $('play').textContent = S.playing ? '❚❚ Pause' : '▶ Lecture';
  }

  /* ---------- Lecture ---------- */
  let last = 0;
  function loop(now) {
    if (!S.playing) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    S.t += (dt * TAU * S.speed) / 8;
    if (S.t >= TAU) { S.t = TAU; S.playing = false; }
    draw();
    if (S.playing) requestAnimationFrame(loop);
  }
  function setPlaying(p) {
    const was = S.playing;
    S.playing = p;
    if (p && !was) {
      if (S.t >= TAU - 1e-6) S.t = 0;
      last = performance.now();
      requestAnimationFrame(loop);
    }
    draw();
  }

  /* ---------- Souris / tactile ---------- */
  let drag = null;
  const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function hit(p) {
    const d = Math.hypot(p.x - G.cx, p.y - G.cy);
    if (d > 12 && d < G.R + 34) return 'circle';
    if (p.x >= G.x0 - 6 && p.x <= gx(TAU) + 8 && p.y > gy(1) - 30 && p.y < gy(-1) + 30) return 'graph';
    return null;
  }
  function setFrom(p, mode) {
    let a;
    if (mode === 'circle') { a = Math.atan2(G.cy - p.y, p.x - G.cx); if (a < 0) a += TAU; }
    else a = Math.max(0, Math.min(TAU, (p.x - G.x0) / G.R));
    for (const d of REM) { const r = (d * PI) / 180; if (Math.abs(a - r) < 0.035) { a = r; break; } }
    S.t = a;
    draw();
  }
  canvas.addEventListener('pointerdown', e => {
    const p = pos(e), m = hit(p);
    if (!m) return;
    drag = m;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    S.playing = false;
    setFrom(p, m);
  });
  canvas.addEventListener('pointermove', e => {
    const p = pos(e);
    if (drag) setFrom(p, drag);
    else canvas.style.cursor = hit(p) ? 'grab' : 'default';
  });
  ['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => { drag = null; canvas.style.cursor = 'grab'; }));

  /* ---------- Interface ---------- */
  function syncUI() {
    document.querySelectorAll('#steps button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.step === S.step));
  }
  function setStep(n) {
    const st = STEPS[n];
    S.step = n;
    if (st.f) Object.assign(S.f, st.f);
    if (st.t !== undefined) S.t = st.t;
    $('explain').innerHTML = st.html;
    syncUI();
    S.playing = false;
    setPlaying(!!st.play);
  }

  $('slider').addEventListener('input', e => { S.playing = false; S.t = (+e.target.value * PI) / 180; draw(); });
  $('play').onclick = () => setPlaying(!S.playing);
  document.querySelectorAll('#steps button').forEach(b => (b.onclick = () => setStep(+b.dataset.step)));

  setStep(1);
})();
