/* Petits utilitaires de dessin partagés par les animations. */
window.Fig = (() => {
  const FONT = 'ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  const MATH = '"Cambria Math","STIX Two Math","Latin Modern Math",Cambria,"Times New Roman",serif';

  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const g = n => cs.getPropertyValue('--' + n).trim();
    return {
      text: g('text'), muted: g('muted'), faint: g('faint'), line: g('line'), soft: g('soft'),
      axis: g('axis'), cos: g('cos'), sin: g('sin'), arc: g('arc'),
      base: g('base'), add: g('add'), addAlt: g('add-alt'), sub: g('sub'),
    };
  }

  /* Canvas net (Retina) qui suit la largeur de son conteneur. */
  function setup(canvas, opts, draw) {
    const ctx = canvas.getContext('2d');
    const st = { ctx, W: 0, H: 0 };
    function resize(redraw) {
      const W = Math.max(opts.minWidth || 0, canvas.parentElement.clientWidth);
      const H = opts.height(W);
      const dpr = window.devicePixelRatio || 1;
      if (W !== st.W || H !== st.H || dpr !== st.dpr) {
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        Object.assign(st, { W, H, dpr });
      }
      if (redraw) draw();
    }
    resize(false);
    new ResizeObserver(() => resize(true)).observe(canvas.parentElement);
    return st;
  }

  function seg(ctx, x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function dot(ctx, x, y, r, fill, ring = true) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (ring) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
  }

  function arrow(ctx, x1, y1, x2, y2, head = 7) {
    seg(ctx, x1, y1, x2, y2);
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - 0.4), y2 - head * Math.sin(a - 0.4));
    ctx.lineTo(x2 - head * Math.cos(a + 0.4), y2 - head * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function label(ctx, s, x, y, o = {}) {
    ctx.save();
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || ''} ${o.size || 13}px ${o.math ? MATH : FONT}`;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.halo !== false) {
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = o.color || '#1d1f23';
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  /* Texte mathématique : parts = ['cos ', ['θ', true], ['n', true, 'sub'], …] */
  function math(ctx, parts, x, y, o = {}) {
    const size = o.size || 15, align = o.align || 'center';
    ctx.save();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const items = parts.map(p => {
      const [s, it, pos] = Array.isArray(p) ? p : [p, false];
      const sz = pos ? size * 0.72 : size;
      const font = `${it ? 'italic ' : ''}${sz}px ${MATH}`;
      ctx.font = font;
      return { s, font, w: ctx.measureText(s).width, dy: pos === 'sub' ? size * 0.3 : pos === 'sup' ? -size * 0.35 : 0 };
    });
    const total = items.reduce((a, b) => a + b.w, 0);
    const x0 = align === 'left' ? x : align === 'right' ? x - total : x - total / 2;
    for (const pass of ['halo', 'fill']) {
      if (pass === 'halo' && o.halo === false) continue;
      let cx = x0;
      for (const it of items) {
        ctx.font = it.font;
        if (pass === 'halo') {
          ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff';
          ctx.strokeText(it.s, cx, y + it.dy);
        } else {
          ctx.fillStyle = o.color || '#1d1f23';
          ctx.fillText(it.s, cx, y + it.dy);
        }
        cx += it.w;
      }
    }
    ctx.restore();
  }

  /* Nombres à la française : virgule, vrai signe moins. */
  function num(x, d = 2) {
    if (Math.abs(x) < 1e-12) x = 0;
    return x.toLocaleString('fr-FR', { maximumFractionDigits: d }).replace('-', '−');
  }
  function fixed(x, d) {
    if (Math.abs(x) < 0.5 * Math.pow(10, -d)) x = 0;
    return x.toFixed(d).replace('.', ',').replace('-', '−');
  }

  function niceStep(span, target) {
    const raw = span / target;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  return { FONT, MATH, colors, setup, seg, dot, arrow, label, math, num, fixed, niceStep, ease };
})();
