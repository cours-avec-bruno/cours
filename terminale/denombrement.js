(() => {
  const C = Fig.colors();
  const $ = id => document.getElementById(id);
  const canvas = $('fig');
  const LET = ['A', 'B', 'C', 'D', 'E'];
  const S = { mode: 'arr', k: 3, box: 0, col: 0, caption: '' };
  let tiles = new Map(); // mot → { x, y, a, … }
  let A = null;          // animation en cours : { stages, i, t0 }
  let looping = false;

  const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
  const arr = k => fact(5) / fact(5 - k);
  const comb = k => arr(k) / fact(k);
  const distinct = w => new Set(w).size === w.length;
  const sorted = w => [...w].sort().join('');
  const isHead = w => distinct(w) && w === sorted(w);
  const ord = i => (i ? `${i + 1}<sup>e</sup>` : '1<sup>re</sup>');

  function words(k) {
    let res = [''];
    for (let i = 0; i < k; i++) res = res.flatMap(w => LET.map(l => w + l));
    return res;
  }
  const combos = k => words(k).filter(isHead);

  const view = Fig.setup(canvas, { minWidth: 600, height: W => (W < 860 ? 320 : 300) }, () => { tw(); if (!A) snap(); draw(); });
  const TOP = 46, BOT = 18, PAD = 20, GG = 12;
  let G = 6, TH = 28;
  const narrow = () => view.W < 860;

  /* Largeur d’une tuile : avec k = 3 et remise, il faut loger 25 tuiles par ligne (ou 15 sur un écran étroit). */
  function tw() {
    const k = S.k, W = view.W;
    G = narrow() ? 4 : 6; TH = narrow() ? 21 : 28;
    const base = [0, 40, 46, 54][k];
    if (k < 3) return base;
    return Math.min(base, narrow() ? (W - 2 * PAD - 2 * GG - 12 * G) / 15 : (W - 2 * PAD - 20 * G - 4 * GG) / 25);
  }

  /* Écran étroit, k = 3 avec remise : 5 blocs 5 × 5 (un par première lettre), rangés 3 + 2. */
  function blocks(list) {
    const W = view.W, H = view.H, w = tw(), res = new Map();
    const bw = 5 * w + 4 * G, bh = 5 * TH + 4 * G, gb = 10;
    const y0 = TOP + (H - TOP - BOT - 2 * bh - gb) / 2;
    list.forEach(word => {
      const b = LET.indexOf(word[0]), r = LET.indexOf(word[1]), c = LET.indexOf(word[2]);
      const inRow = b < 3 ? 3 : 2, bc = b < 3 ? b : b - 3;
      const x0 = (W - (inRow * bw + (inRow - 1) * GG)) / 2 + bc * (bw + GG);
      res.set(word, { x: x0 + c * (w + G), y: y0 + (b < 3 ? 0 : bh + gb) + r * (TH + G), a: 1 });
    });
    return res;
  }

  /* Lignes par première lettre, avec un petit espace entre les sous-groupes. */
  function rows(list, sub) {
    const W = view.W, H = view.H, w = tw(), res = new Map();
    const R = S.k === 1 ? [list] : LET.map(l => list.filter(x => x[0] === l));
    const total = R.length * TH + (R.length - 1) * G;
    const y0 = TOP + (H - TOP - BOT - total) / 2;
    R.forEach((row, r) => {
      const width = row.length * w + (row.length - 1) * G + (sub ? (row.length / sub - 1) * (GG - G) : 0);
      let x = (W - width) / 2;
      row.forEach((word, i) => {
        if (i && sub && i % sub === 0) x += GG - G;
        res.set(word, { x, y: y0 + r * (TH + G), a: 1 });
        x += w + G;
      });
    });
    return res;
  }

  /* Colonnes par main : chaque main reçoit ses k! rangements. */
  function colX(j, n) {
    const W = view.W, w = tw();
    const cs = Math.min(w + 34, (W - 2 * PAD) / n);
    return W / 2 + (j - (n - 1) / 2) * cs - w / 2;
  }
  const yMid = () => TOP + (view.H - TOP - BOT) / 2 - TH / 2;

  function groups(collapsed) {
    tw();
    const k = S.k, cb = combos(k), res = new Map();
    const R = fact(k), total = R * TH + (R - 1) * G;
    const y0 = TOP + (view.H - TOP - BOT - total) / 2;
    const rank = new Map();
    for (const w of words(k)) {
      if (!distinct(w)) { res.set(w, { x: null, y: null, a: 0 }); continue; }
      const key = sorted(w), j = cb.indexOf(key), r = rank.get(key) || 0;
      rank.set(key, r + 1);
      res.set(w, collapsed
        ? { x: colX(j, cb.length), y: yMid(), a: isHead(w) ? 1 : 0 }
        : { x: colX(j, cb.length), y: y0 + r * (TH + G), a: 1 });
    }
    return res;
  }

  function tRep() { return S.k === 3 && narrow() ? blocks(words(3)) : rows(words(S.k), S.k === 3 ? 5 : 0); }
  function tArr() {
    const res = rows(words(S.k).filter(distinct), S.k === 3 ? 3 : 0);
    for (const w of words(S.k)) if (!res.has(w)) res.set(w, { x: null, y: null, a: 0 });
    return res;
  }

  const captions = {
    rep: () => `${Math.pow(5, S.k)} tirages ordonnés`,
    arr: () => `${arr(S.k)} tirages sans répétition`,
    grp: () => `${comb(S.k)} paquets de ${S.k}! = ${fact(S.k)} tirages qui ont les mêmes lettres`,
    coll: () => `${comb(S.k)} mains : on garde une tuile par paquet`,
  };
  const st = (targets, cap, o = {}) => ({ targets, caption: cap, box: 0, col: 0, dur: 800, ...o });
  const finalStage = () => (S.mode === 'rep' ? st(tRep(), captions.rep())
    : S.mode === 'arr' ? st(tArr(), captions.arr())
      : st(groups(true), captions.coll(), { box: 1, col: 1 }));

  function snap() {
    const f = finalStage();
    for (const w of words(S.k)) {
      const g = f.targets.get(w);
      const t = tiles.get(w) || { x: 0, y: 0, a: 0 };
      if (g.x !== null) { t.x = g.x; t.y = g.y; }
      t.a = g.a;
      tiles.set(w, t);
    }
    S.box = f.box; S.col = f.col; S.caption = f.caption;
  }

  /* ---------- animation par étapes ---------- */
  function run(stages) {
    A = { stages, i: -1 };
    next();
    if (!looping) { looping = true; requestAnimationFrame(loop); }
  }
  function next() {
    A.i++;
    if (A.i >= A.stages.length) { A = null; return; }
    const s = A.stages[A.i];
    for (const [w, t] of tiles) {
      const g = s.targets.get(w);
      t.fx = t.x; t.fy = t.y; t.fa = t.a;
      t.tx = g.x === null ? t.x : g.x; t.ty = g.y === null ? t.y : g.y; t.ta = g.a;
      t.d = s.delay ? s.delay(w) : 0;
    }
    S.fbox = S.box; S.fcol = S.col;
    A.t0 = performance.now() + (s.wait || 0);
  }
  function loop(now) {
    if (!A) { looping = false; return; }
    const s = A.stages[A.i], t = now - A.t0;
    if (t >= 0) S.caption = s.caption;
    let done = t >= 0;
    for (const tile of tiles.values()) {
      const p = Math.max(0, Math.min(1, (t - tile.d) / s.dur));
      if (p < 1) done = false;
      const e = Fig.ease(p);
      tile.x = tile.fx + (tile.tx - tile.fx) * e;
      tile.y = tile.fy + (tile.ty - tile.fy) * e;
      tile.a = tile.fa + (tile.ta - tile.fa) * e;
    }
    const e = Fig.ease(Math.max(0, Math.min(1, t / s.dur)));
    S.box = S.fbox + (s.box - S.fbox) * e;
    S.col = S.fcol + (s.col - S.fcol) * e;
    draw();
    if (done) next();
    requestAnimationFrame(loop);
  }

  /* ---------- dessin ---------- */
  function draw() {
    const ctx = view.ctx, W = view.W, H = view.H, w = tw(), k = S.k;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    Fig.label(ctx, S.caption, W / 2, 22, { size: 14, color: C.text, weight: '500' });

    // cadres des paquets (mode sans ordre)
    if (S.box > 0.01) {
      const cb = combos(k), R = fact(k), total = R * TH + (R - 1) * G;
      const y0 = TOP + (H - TOP - BOT - total) / 2;
      const top = y0 + (yMid() - y0) * S.col, bot = y0 + total + (yMid() + TH - y0 - total) * S.col;
      ctx.save();
      ctx.globalAlpha = S.box * (1 - 0.6 * S.col);
      ctx.strokeStyle = C.arc; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      cb.forEach((_, j) => {
        ctx.beginPath(); ctx.roundRect(colX(j, cb.length) - 5, top - 5, w + 10, bot - top + 10, 8); ctx.stroke();
      });
      ctx.restore();
    }

    const fs = Math.min(15, TH * 0.6, (w - 6) / (k * 0.62));
    const list = [...tiles.entries()].sort((p, q) => isHead(p[0]) - isHead(q[0]));
    for (const [word, t] of list) {
      if (t.a < 0.01) continue;
      const green = S.mode === 'comb' && isHead(word) ? S.col : 0;
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.a);
      ctx.beginPath(); ctx.roundRect(t.x, t.y, w, TH, 5);
      ctx.fillStyle = distinct(word) ? '#fff' : C.soft; ctx.fill();
      if (green > 0) { ctx.fillStyle = `rgba(43,147,72,${0.1 * green})`; ctx.fill(); }
      ctx.strokeStyle = green > 0.5 ? C.arc : C.axis; ctx.lineWidth = green > 0.5 ? 1.5 : 1.1;
      ctx.stroke();
      Fig.label(ctx, word, t.x + w / 2, t.y + TH / 2 + 1, {
        size: fs, math: true, halo: false, color: distinct(word) ? C.text : C.muted,
      });
      ctx.restore();
    }
  }

  /* ---------- texte ---------- */
  function readout() {
    const k = S.k, m = S.mode;
    const vals = m === 'rep' ? Array(k).fill(5) : [5, 4, 3].slice(0, k);
    const boxes = vals.map((v, i) => `<span class="slot"><small>${ord(i)} lettre</small><b>${v}</b></span>`).join('<span class="op">×</span>');
    const bn = `<span class="bn"><span><span>5</span><span>${k}</span></span></span>`;
    if (m === 'rep') {
      $('slots').innerHTML = `${boxes}<span class="op">=</span><span class="tot">${Math.pow(5, k)}</span>`;
      $('res').innerHTML = `<i>n</i><sup><i>k</i></sup> = 5<sup>${k}</sup> = <b>${Math.pow(5, k)}</b>`;
      $('msg').innerHTML = 'Chaque case peut recevoir n’importe laquelle des 5 lettres : on multiplie les choix. Les tuiles grisées contiennent une lettre répétée.';
      $('explain').innerHTML = `Un tirage est une <b>liste ordonnée</b> de ${k} lettre${k > 1 ? 's' : ''} : AB et BA sont différents, et une lettre peut revenir (on la remet dans le sac).`;
    } else if (m === 'arr') {
      $('slots').innerHTML = `${boxes}<span class="op">=</span><span class="tot">${arr(k)}</span>`;
      $('res').innerHTML = `<i>n</i>! / (<i>n</i> − <i>k</i>)! = 5! / ${5 - k}! = <b>${arr(k)}</b>`;
      $('msg').innerHTML = k === 1
        ? 'Avec une seule lettre, la remise ne change rien : 5 tirages.'
        : `Une lettre tirée n’est plus disponible : ${vals.join(' choix, puis ')} choix. Les tuiles avec une répétition ont disparu.`;
      $('explain').innerHTML = 'On ne remet pas la lettre dans le sac : un tirage est une <b>liste ordonnée sans répétition</b> (un arrangement). AB et BA restent différents.';
    } else {
      const kf = Array.from({ length: k }, (_, i) => k - i).join(' × ');
      $('slots').innerHTML = `${boxes}<span class="op">÷</span><span class="slot"><small>rangements</small><b class="g">${kf}</b></span><span class="op">=</span><span class="tot">${comb(k)}</span>`;
      $('res').innerHTML = `${bn} = ${arr(k)} ÷ ${k}! = <b>${comb(k)}</b>`;
      const ex = k === 3 ? '« ABC », « ACB », « BAC », « BCA », « CAB », « CBA »' : k === 2 ? '« AB » et « BA »' : '« A »';
      $('msg').innerHTML = k === 1
        ? 'Une main d’une seule lettre ne peut être rangée que d’une façon : 1! = 1, rien ne change.'
        : `${ex} forment la même main {${'ABC'.slice(0, k).split('').join(', ')}}. Chaque main apparaît ${k}! = ${fact(k)} fois parmi les ${arr(k)} arrangements, d’où ${arr(k)} ÷ ${fact(k)} = ${comb(k)}.`;
      $('explain').innerHTML = 'On prend les lettres <b>d’un coup</b> : l’ordre ne compte plus, seul compte l’ensemble des lettres obtenues (une combinaison, ou une « main »).';
    }
  }

  /* ---------- transitions ---------- */
  function stagesTo(m, from) {
    if (m === 'rep') return [st(tRep(), captions.rep())];
    if (m === 'arr') return [st(tArr(), captions.arr())];
    const out = [];
    if (from === 'rep') out.push(st(tArr(), captions.arr()));
    if (from === 'comb') out.push(st(groups(false), captions.grp(), { box: 1, dur: 700 }));
    else out.push(st(groups(false), captions.grp(), { box: 1, dur: 1100, wait: from === 'rep' ? 300 : 0 }));
    out.push(st(groups(true), captions.coll(), { box: 1, col: 1, dur: 900, wait: 900 }));
    return out;
  }

  function setMode(m) {
    const from = S.mode;
    S.mode = m;
    document.querySelectorAll('#modes .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m));
    readout();
    run(stagesTo(m, from));
  }

  function replay() {
    const m = S.mode;
    if (m === 'rep') {
      const f = tRep();
      for (const [w, t] of tiles) { const g = f.get(w); t.x = g.x; t.y = g.y - 10; t.a = 0; }
      S.box = 0; S.col = 0;
      const n = tiles.size, idx = new Map(words(S.k).map((w, i) => [w, i]));
      run([st(f, captions.rep(), { dur: 350, delay: w => (idx.get(w) * 1400) / n })]);
    } else if (m === 'arr') {
      const f = tRep();
      for (const [w, t] of tiles) { const g = f.get(w); t.x = g.x; t.y = g.y; t.a = 1; }
      S.box = 0; S.col = 0;
      run([st(f, captions.rep(), { dur: 1, wait: 500 }), ...stagesTo('arr')]);
    } else {
      const f = tArr();
      for (const [w, t] of tiles) { const g = f.get(w); if (g.x !== null) { t.x = g.x; t.y = g.y; } t.a = g.a; }
      S.box = 0; S.col = 0;
      run([st(f, captions.arr(), { dur: 1, wait: 400 }), ...stagesTo('comb', 'arr')]);
    }
  }

  function setK(k) {
    S.k = k;
    $('kv').textContent = k;
    tiles = new Map();
    A = null;
    snap();
    for (const t of tiles.values()) { t.ta = t.a; t.a = 0; }
    const f = finalStage();
    run([{ ...f, dur: 350 }]);
    readout();
  }

  document.querySelectorAll('#modes .chip').forEach(b => (b.onclick = () => (b.dataset.m === S.mode ? replay() : setMode(b.dataset.m))));
  $('k').value = S.k;
  $('k').addEventListener('input', e => setK(+e.target.value));
  $('play').onclick = replay;
  document.querySelectorAll('#modes .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === S.mode));
  setK(S.k);
  const fig = canvas.parentElement;
  fig.scrollLeft = (fig.scrollWidth - fig.clientWidth) / 2;
})();
