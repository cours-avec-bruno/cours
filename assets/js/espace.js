/* Géométrie dans l’espace : une petite vue 3D sur un canvas.
   Projection orthographique (comme en perspective cavalière, les parallèles restent parallèles),
   axe z vers le haut. On fait tourner la vue en glissant sur la figure (souris ou doigt). */
window.Espace = (() => {
  /* Vecteurs [x, y, z] */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => Math.hypot(a[0], a[1], a[2]);
  const unit = a => mul(a, 1 / norm(a));
  const lerp = (a, b, k) => add(a, mul(sub(b, a), k));

  /* Nom de vecteur surmonté de sa flèche (u⃗, AM⃗…), centré en (x, y). */
  function vecName(ctx, s, x, y, o = {}) {
    const size = o.size || 16, color = o.color || '#1d1f23';
    ctx.save();
    ctx.font = `italic ${size}px ${Fig.MATH}`;
    const w = ctx.measureText(s).width;
    ctx.restore();
    Fig.label(ctx, s, x, y, { size, italic: true, math: true, color });
    const ya = y - size * 0.68, x1 = x - w / 2 + 1, x2 = x + w / 2 + 2;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    Fig.seg(ctx, x1, ya, x2, ya);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.2;
    Fig.seg(ctx, x1, ya, x2 - 2, ya);
    ctx.beginPath(); ctx.moveTo(x2 + 1, ya); ctx.lineTo(x2 - 4, ya - 2.8); ctx.lineTo(x2 - 4, ya + 2.8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* Une vue 3D.
     o.draw   : fonction de dessin (rappelée quand on tourne la vue ou quand la taille change)
     o.center : point visé · o.span, o.spanH : largeur et hauteur (en unités) à faire tenir · o.az, o.el : angles de vue */
  function view(canvas, o) {
    const C = Fig.colors();
    const V = { az: o.az ?? 0.62, el: o.el ?? 0.42, center: o.center || [0, 0, 0], span: o.span || 10 };
    V.spanH = o.spanH || V.span * 0.72;
    const st = Fig.setup(canvas, {
      minWidth: o.minWidth || 300,
      height: o.height || (W => Math.round(Math.min(470, Math.max(300, W * 0.44)))),
    }, () => o.draw());
    canvas.parentElement.classList.add('drag');
    let R, U, D, S; // droite et haut de l’écran, direction de l’observateur, échelle

    function basis() {
      const ca = Math.cos(V.az), sa = Math.sin(V.az), ce = Math.cos(V.el), se = Math.sin(V.el);
      R = [-sa, ca, 0];
      U = [-se * ca, -se * sa, ce];
      D = [ce * ca, ce * sa, se];
      S = Math.min(st.W / V.span, st.H / V.spanH);
    }
    basis();

    Object.defineProperties(V, {
      ctx: { get: () => st.ctx }, W: { get: () => st.W }, H: { get: () => st.H },
    });

    /* Projection : point de l’espace → pixel du canvas. */
    V.pt = p => {
      const q = sub(p, V.center);
      return [st.W / 2 + S * dot(q, R), st.H / 2 - S * dot(q, U)];
    };
    V.eye = () => D.slice();           // vers l’observateur
    V.depth = p => dot(p, D);          // plus grand = plus près de nous

    V.begin = () => {
      basis();
      const ctx = st.ctx;
      ctx.clearRect(0, 0, st.W, st.H);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, st.W, st.H);
      return ctx;
    };

    V.seg = (p, q, color, w = 1.5, dash) => {
      const ctx = st.ctx, a = V.pt(p), b = V.pt(q);
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
      if (dash) ctx.setLineDash(dash);
      Fig.seg(ctx, a[0], a[1], b[0], b[1]);
      ctx.restore();
    };
    V.path = (pts, color, w = 1.5, dash) => {
      if (pts.length < 2) return;
      const ctx = st.ctx;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      pts.forEach((p, i) => { const [x, y] = V.pt(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke(); ctx.restore();
    };
    V.arrow = (p, q, color, w = 2) => {
      const ctx = st.ctx, a = V.pt(p), b = V.pt(q);
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 2) return;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w;
      Fig.arrow(ctx, a[0], a[1], b[0], b[1], 6 + 1.5 * w);
      ctx.restore();
    };
    V.dot = (p, r, color, ring = true) => { const [x, y] = V.pt(p); Fig.dot(st.ctx, x, y, r, color, ring); };
    V.poly = (pts, fill, stroke, w = 1) => {
      const ctx = st.ctx;
      ctx.save(); ctx.beginPath();
      pts.forEach((p, i) => { const [x, y] = V.pt(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.stroke(); }
      ctx.restore();
    };
    /* Le point p est-il caché par le polygone plan pts (vu de face) ? */
    V.covers = (pts, p) => {
      const [x, y] = V.pt(p), q = pts.map(V.pt);
      let inside = false;
      for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
        if ((q[i][1] > y) !== (q[j][1] > y) && x < ((q[j][0] - q[i][0]) * (y - q[i][1])) / (q[j][1] - q[i][1]) + q[i][0]) inside = !inside;
      }
      return inside;
    };
    V.label = (p, s, o = {}) => { const [x, y] = V.pt(p); Fig.label(st.ctx, s, x + (o.dx || 0), y + (o.dy || 0), o); };
    V.math = (p, parts, o = {}) => { const [x, y] = V.pt(p); Fig.math(st.ctx, parts, x + (o.dx || 0), y + (o.dy || 0), o); };
    V.vec = (p, s, o = {}) => { const [x, y] = V.pt(p); vecName(st.ctx, s, x + (o.dx || 0), y + (o.dy || 0), o); };

    /* Marque d’angle droit en h, entre les directions a et b. */
    V.square = (h, a, b, size = 0.35, color = C.text) => {
      const ua = mul(unit(a), size), ub = mul(unit(b), size);
      V.path([add(h, ua), add(add(h, ua), ub), add(h, ub)], color, 1.2);
    };

    /* Sol quadrillé (plan z = 0), pour mieux lire la profondeur. */
    V.floor = (nx, ny) => {
      V.poly([[0, 0, 0], [nx, 0, 0], [nx, ny, 0], [0, ny, 0]], 'rgba(160,168,178,0.10)', null);
      for (let i = 1; i <= nx; i++) V.seg([i, 0, 0], [i, ny, 0], 'rgba(160,168,178,0.35)', 1);
      for (let j = 1; j <= ny; j++) V.seg([0, j, 0], [nx, j, 0], 'rgba(160,168,178,0.35)', 1);
    };

    /* Repère (O ; x, y, z) : len = longueurs des trois axes. */
    V.axes = (len = [4, 4, 4], ticks = true) => {
      const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], names = ['x', 'y', 'z'], O = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const tip = mul(E[k], len[k]);
        V.seg(mul(E[k], -0.8), O, C.line, 1);
        V.arrow(O, tip, C.axis, 1.2);
        if (ticks) {
          const a = V.pt(O), b = V.pt(E[k]);
          const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * 3, ny = dx / l * 3;
          for (let i = 1; i < len[k]; i++) {
            const [x, y] = V.pt(mul(E[k], i));
            st.ctx.save(); st.ctx.strokeStyle = C.axis; st.ctx.lineWidth = 1;
            Fig.seg(st.ctx, x - nx, y - ny, x + nx, y + ny);
            st.ctx.restore();
          }
        }
        V.label(mul(E[k], len[k] + 0.45), names[k], { size: 15, italic: true, math: true, color: C.muted });
      }
      V.label(O, 'O', { size: 13, color: C.muted, dx: -10, dy: 10 });
    };

    /* Rotation de la vue en glissant. */
    let drag = null;
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, az: V.az, el: V.el };
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ }
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', e => {
      if (!drag) return;
      V.az = drag.az - (e.clientX - drag.x) * 0.007;
      V.el = Math.max(-0.25, Math.min(1.5, drag.el + (e.clientY - drag.y) * 0.007));
      o.draw();
    });
    const end = () => { drag = null; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    return V;
  }

  return { view, vecName, add, sub, mul, dot, cross, norm, unit, lerp };
})();
