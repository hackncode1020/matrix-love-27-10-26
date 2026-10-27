/* Matrix Love 💚 — Hacker's way to say I love you
   Made by @hack.n.code · plain HTML/CSS/JS canvas, no libraries
   URL params: ?name=Someone  → shows "For Someone" under the heart
               ?msg=I MISS YOU → custom message (default I LOVE YOU)        */
(() => {
const qs = new URLSearchParams(location.search);
const CAP = qs.get('capture') === '1';                 // frame-by-frame mode (for recording)
const clean = (s, n) => (s || '').replace(/[<>]/g, '').trim().slice(0, n);
const NAME = clean(qs.get('name'), 20);
const MSG = (clean(qs.get('msg'), 14) || 'I LOVE YOU').toUpperCase();

const GLYPHS = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリギジビピウゥクスツヌフムユュルグズブプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロヲゴゾドボポッン0123456789<>{}=+*#$%';
const HEARTS = '♥♡❤';
const SCR = 'ABCDEFGHJKLMNPQRSTUVXYZ0123456789#$%&@';
const GREEN = [57, 255, 138], PINK = [255, 72, 156];
const HEAD_G = [215, 255, 228], HEAD_P = [255, 222, 238];

// timeline (seconds)
const BOOT0 = 0.25, TG0 = 2.0, TT0 = 4.3, TUI = 5.6;

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const G = document.createElement('canvas'), g = G.getContext('2d');      // glow layer
const B1 = document.createElement('canvas'), b1 = B1.getContext('2d');   // bloom fallback
const B2 = document.createElement('canvas'), b2 = B2.getContext('2d');
const HAS_FILTER = typeof ctx.filter === 'string' && (() => { try { ctx.filter = 'blur(1px)'; const ok = ctx.filter === 'blur(1px)'; ctx.filter = 'none'; return ok; } catch (e) { return false; } })();

const $ = id => document.getElementById(id);
const shareBtn = $('share'), boot = $('boot'), forline = $('forline'), hint = $('hint'), btns = $('btns'), foot = $('foot'), under = $('under');
forline.textContent = NAME ? 'For ' + NAME : 'For you';

// ---------- deterministic randomness ----------
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(a, b, c) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0); }
const ease = u => u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u);
const easeIO = u => u < 0 ? 0 : u > 1 ? 1 : (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;

// ---------- layout ----------
let W, H, DPR, fs, cols, rows, drops, heart, parts, burst;
function layout() {
  W = innerWidth; H = innerHeight;
  DPR = CAP ? (window.devicePixelRatio || 1) : Math.min(window.devicePixelRatio || 1, 2);
  for (const c of [cv, G]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
  B1.width = Math.ceil(cv.width / 4); B1.height = Math.ceil(cv.height / 4);
  B2.width = Math.ceil(cv.width / 8); B2.height = Math.ceil(cv.height / 8);
  fs = Math.max(13, Math.min(20, Math.round(W / 30)));
  cols = Math.ceil(W / fs); rows = Math.ceil(H / fs) + 1;
  const R = rng(7);
  drops = [];
  for (let i = 0; i < cols; i++) for (let k = 0; k < 2; k++) {
    const L = 8 + R() * 16, P = rows + L + R() * rows * 0.9;
    drops.push({ i, v: 4.5 + R() * 7, L, P, ph: R() * P });
  }
  // heart geometry
  const s = Math.min(W * 0.86 / 2.28, H * 0.39 / 2.2);
  const cx = W / 2, cy = H * 0.48;
  const sp = fs * 0.84;
  const inside = (x, y) => { const u = (x - cx) / s, v = -(y - cy) / s + 0.1; const a = u * u + v * v - 1; return a * a * a - u * u * v * v * v <= 0; };
  const pts = [];
  const nx = Math.ceil(1.25 * s / sp), ny = Math.ceil(1.3 * s / sp);
  for (let gy = -ny; gy <= ny; gy++) for (let gx = -nx; gx <= nx; gx++) {
    const x = cx + gx * sp, y = cy + gy * sp;
    if (!inside(x, y)) continue;
    const edge = !(inside(x + sp, y) && inside(x - sp, y) && inside(x, y + sp) && inside(x, y - sp));
    pts.push({ x, y, edge });
  }
  heart = { s, cx, cy, sp, top: cy - 1.1 * s, bottom: cy + 1.1 * s, textY: cy - 0.28 * s };
  const R2 = rng(42);
  const span = heart.bottom - heart.top;
  parts = pts.map((p, k) => {
    const fill = 1 - (p.y - heart.top) / span;              // 0 at the tip, 1 at the lobes
    const arr = TG0 + 0.35 + fill * 2.1 + R2() * 0.3;       // arrival time
    const v = H * (1.15 + R2() * 0.5);                      // fall speed px/s
    return { tx: p.x, ty: p.y, edge: p.edge, arr, v, ph: R2() * 6.28, id: k, d: Math.hypot(p.x - cx, p.y - cy) };
  });
  const R3 = rng(9);
  burst = Array.from({ length: 30 }, () => ({ a: R3() * Math.PI * 2, v: s * (1.2 + R3() * 2.2), r: 0.8 + R3() * 0.9, c: HEARTS[Math.floor(R3() * 2)] }));
  // fit message
  g.font = `800 100px "JetBrains Mono", ui-monospace, monospace`;
  const w100 = g.measureText(MSG).width || 600;
  heart.msgSize = Math.min(0.28 * s, (1.62 * s) / w100 * 100);
  // DOM
  under.style.top = (heart.bottom + H * 0.018) + 'px';
  btns.style.top = (H * 0.80) + 'px';
  foot.style.bottom = Math.max(18, H * 0.045) + 'px';
}

// ---------- state ----------
let taps = [];                      // tap times (seconds)
function colorAt(t) {               // 0 = green, 1 = pink
  let v = 0, target = 0, last = null;
  for (const ti of taps) {
    if (ti > t) break;
    if (last !== null) v = v + (target - v) * ease((ti - last) / 0.9);
    target = 1 - target; last = ti;
  }
  if (last !== null) v = v + (target - v) * ease((t - last) / 0.9);
  return v;
}
function lastTap(t) { let l = null; for (const ti of taps) if (ti <= t) l = ti; return l; }

// ---------- draw ----------
function glyph(i, j, t, rate) { return GLYPHS[hash(i, j, Math.floor(t * rate + (hash(j, i, 3) % 97) / 9.7)) % GLYPHS.length]; }

function render(t) {
  const pk = colorAt(t), lt = lastTap(t);
  const col = mix(GREEN, PINK, pk), head = mix(HEAD_G, HEAD_P, pk);
  const form = ease((t - TG0) / 2.6);              // heart formation progress
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  g.clearRect(0, 0, W, H);

  // --- code rain ---
  const rainA = 1 - 0.55 * form;
  ctx.font = `500 ${fs}px "Noto Sans Mono CJK JP","Hiragino Kaku Gothic ProN","MS Gothic","JetBrains Mono",monospace`;
  g.font = ctx.font;
  ctx.textAlign = g.textAlign = 'center'; ctx.textBaseline = g.textBaseline = 'middle';
  const hcx = heart.cx, hcy = heart.cy, hs = heart.s;
  for (const d of drops) {
    const hr = ((d.ph + d.v * t) % d.P) - d.L * 0.3;   // head row (continuous)
    const x = d.i * fs + fs / 2;
    const r0 = Math.max(0, Math.floor(hr - d.L)), r1 = Math.min(rows - 1, Math.ceil(hr));
    for (let r = r0; r <= r1; r++) {
      const dd = hr - r; if (dd < -1 || dd > d.L) continue;
      let b = dd < 0 ? 1 + dd : Math.pow(1 - dd / d.L, 1.5);
      const y = r * fs + fs / 2;
      // keep the heart area calm once it forms
      const ex = (x - hcx) / (hs * 1.35), ey = (y - hcy) / (hs * 1.35);
      const near = Math.max(0, 1 - (ex * ex + ey * ey));
      b *= rainA * (1 - 0.85 * near * form);
      if (b < 0.03) continue;
      let ch = glyph(d.i, r, t, 3 + (hash(d.i, r, 1) % 5));
      if (pk > 0.3 && hash(d.i, r, 77) % 9 === 0) ch = HEARTS[hash(d.i, r, 5) % 2];
      if (dd < 1.2) { g.fillStyle = rgba(head, Math.min(1, b)); g.fillText(ch, x, y); }
      else { ctx.fillStyle = rgba(col, b * 0.9); ctx.fillText(ch, x, y); }
    }
  }

  // --- heart ---
  let sc = 1 + 0.022 * Math.sin(t * 2 * Math.PI / 2.6) * form;
  if (lt !== null) {
    const dt = t - lt;
    sc += dt < 0.1 ? -0.07 * dt / 0.1 : 0.2 * Math.exp(-(dt - 0.1) * 4.2) * Math.cos((dt - 0.1) * 10) - 0.07 * Math.exp(-(dt - 0.1) * 30);
    if (pk > 0.5) { const bp = ((t - lt) % 1.15); sc += 0.045 * Math.exp(-bp * 14) * (bp > 0 ? 1 : 0) + 0.03 * Math.exp(-Math.max(0, bp - 0.22) * 14) * (bp > 0.22 ? 1 : 0); }
  }
  const textOn = ease((t - TT0) / 0.35);
  const form2 = form;
  const tH = heart.msgSize, tY = heart.textY;
  g.font = `700 ${heart.sp * 0.92}px "Noto Sans Mono CJK JP","JetBrains Mono",monospace`;
  for (const p of parts) {
    let x, y, b, flying = false;
    const tx = hcx + (p.tx - hcx) * sc, ty = hcy + (p.ty - hcy) * sc;
    const u = (t - p.arr);
    if (u < 0) {                                  // falling down its column like a rain drop
      y = ty + u * p.v; x = tx;
      if (y < -heart.sp * 6) continue;
      b = 1; flying = true;
    } else {
      x = tx; y = ty;
      const sh = 0.5 + 0.5 * Math.sin(t * 2.3 - p.d * 0.045 + p.ph * 0.3);
      b = p.edge ? 0.9 + 0.1 * sh : 0.32 + 0.38 * sh;
      b = Math.min(1, b + 0.7 * (1 - ease(u * 2.2)));   // flash on landing
    }
    // dim cells behind the message
    if (!flying) {
      const dy = Math.abs(y - tY) / (tH * 0.95);
      if (dy < 1) b *= 1 - 0.8 * textOn * (1 - dy * dy);
    }
    let ch = GLYPHS[hash(p.id, 11, Math.floor(t * (flying ? 9 : 1.4) + p.ph)) % GLYPHS.length];
    if (pk > 0.4 && p.edge && hash(p.id, 3, 1) % 3 === 0) ch = '♥';
    const c = flying ? head : (p.edge ? mix(col, head, 0.35) : col);
    g.fillStyle = rgba(c, b);
    if (flying) {                                // rain trail above the falling glyph
      for (let k = 1; k <= 5; k++) {
        g.fillStyle = rgba(col, 0.62 * Math.pow(0.7, k));
        g.fillText(GLYPHS[hash(p.id, k, Math.floor(t * 6)) % GLYPHS.length], x, y - k * heart.sp * 1.15);
      }
      g.fillStyle = rgba(c, b);
    }
    g.fillText(ch, x, y);
  }

  // shock rings + burst on tap
  if (lt !== null) {
    const dt = t - lt;
    for (const off of [0, 0.18]) {
      const q = dt - off; if (q < 0 || q > 1.2) continue;
      const k = 1 + q * 1.6, a = Math.pow(1 - q / 1.2, 1.6);
      heartPath(g, hcx, hcy, hs * k);
      g.lineWidth = Math.max(2, hs * 0.03 * (1 - q / 1.2)); g.strokeStyle = rgba(mix(col, head, 0.4), a); g.stroke();
    }
    if (dt < 1.8) {
      g.font = `700 ${fs * 1.3}px sans-serif`;
      for (const p of burst) {
        const q = dt * p.r, dist = p.v * (1 - Math.exp(-q * 2.2));
        const x = hcx + Math.cos(p.a) * dist, y = hcy - hs * 0.1 + Math.sin(p.a) * dist + 80 * q * q;
        g.fillStyle = rgba(mix(col, head, 0.3), Math.max(0, 1 - dt / 1.8)); g.fillText(p.c, x, y);
      }
    }
  }

  // message
  if (textOn > 0) {
    g.font = `800 ${tH}px "JetBrains Mono", ui-monospace, monospace`;
    const n = MSG.length, wFull = g.measureText(MSG).width, cw = wFull / n;
    let x0 = hcx - wFull / 2 + cw / 2;
    for (let k = 0; k < n; k++) {
      const lock = TT0 + 0.25 + k * 0.11;
      let ch = MSG[k];
      if (ch !== ' ' && t < lock) ch = SCR[hash(k, 99, Math.floor(t * 16)) % SCR.length];
      const flick = t < lock ? 0.7 : 1;
      g.fillStyle = rgba(mix(head, [255, 255, 255], 0.5), textOn * flick);
      const yy = hcy + (tY - hcy) * sc;
      g.save(); g.translate(hcx + (x0 + k * cw - hcx) * sc, yy); g.scale(sc, sc); g.fillText(ch, 0, 0); g.restore();
    }
  }

  // --- compose with bloom ---
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  if (HAS_FILTER) {
    ctx.globalAlpha = 0.9; ctx.filter = `blur(${14 * DPR}px)`; ctx.drawImage(G, 0, 0);
    ctx.globalAlpha = 0.8; ctx.filter = `blur(${4 * DPR}px)`; ctx.drawImage(G, 0, 0);
    ctx.filter = 'none';
  } else {
    b1.clearRect(0, 0, B1.width, B1.height); b1.drawImage(G, 0, 0, B1.width, B1.height);
    b2.clearRect(0, 0, B2.width, B2.height); b2.drawImage(B1, 0, 0, B2.width, B2.height);
    ctx.globalAlpha = 0.9; ctx.drawImage(B2, 0, 0, cv.width, cv.height);
    ctx.globalAlpha = 0.7; ctx.drawImage(B1, 0, 0, cv.width, cv.height);
  }
  ctx.globalAlpha = 1; ctx.drawImage(G, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  // vignette
  const vg = ctx.createRadialGradient(cv.width / 2, cv.height * 0.47, cv.width * 0.3, cv.width / 2, cv.height / 2, cv.height * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, cv.width, cv.height);

  ui(t, pk, lt);
}

function heartPath(c, cx, cy, s) {
  c.beginPath();
  for (let i = 0; i <= 120; i++) {
    const a = i / 120 * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(a), 3), y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    const px = cx + x / 16 * s * 1.08, py = cy - (y / 16) * s * 1.08 - s * 0.12;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
}

// ---------- DOM ui driven by time ----------
const L1 = '> decrypting message...', L2 = '> access granted ♥';
let lastBoot = '';
function ui(t, pk, lt) {
  let s = '';
  const n1 = Math.floor(Math.max(0, t - BOOT0) / 0.04), n2 = Math.floor(Math.max(0, t - 1.25) / 0.04);
  s = L1.slice(0, n1);
  if (t > 1.25) s += '\n' + L2.slice(0, n2);
  if (t < 1.25 && Math.floor(t * 3) % 2 === 0) s += '█';
  if (s !== lastBoot) { boot.textContent = s; lastBoot = s; }
  boot.style.opacity = (1 - ease((t - 2.1) / 0.4)).toFixed(3);
  boot.style.display = t > 2.6 ? 'none' : '';
  forline.style.opacity = ease((t - TUI) / 0.5).toFixed(3);
  const hOn = ease((t - TUI - 0.7) / 0.4) * (lt === null ? (0.75 + 0.25 * Math.cos(t * 4)) : 0);
  hint.style.opacity = hOn.toFixed(3);
  const bo = ease((t - TUI - 0.3) / 0.5);
  btns.style.opacity = bo.toFixed(3); btns.style.pointerEvents = bo > 0.5 ? 'auto' : 'none';
  foot.style.opacity = (0.9 * bo).toFixed(3);
  document.body.classList.toggle('pink', pk > 0.5);
  const sl = pk > 0.5 ? 'Share 💖' : 'Share 💚'; if (shareBtn.textContent !== sl) shareBtn.textContent = sl;
  const c = mix(GREEN, PINK, pk);
  document.documentElement.style.setProperty('--g', `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`);
}

// ---------- live loop / capture API ----------
let start = performance.now();
const now = () => (performance.now() - start) / 1000;
layout();
window.__render = (t, tapList) => { taps = (tapList || []).slice().sort((a, b) => a - b); render(t); };
window.__layout = layout;
window.__heart = () => ({ ...heart, W, H });
if (!CAP) {
  addEventListener('resize', layout);
  cv.addEventListener('pointerdown', () => {
    const t = now();
    if (t < TT0) { start -= (TT0 + 1.5 - t) * 1000; taps.push(TT0 + 1.5); return; } // impatient tap → jump to heart
    taps.push(t); if (navigator.vibrate) navigator.vibrate(40);
  });
  const loop = () => { render(now()); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { layout(); if (CAP) render(0); window.__ready = true; });

// ---------- share / make yours ----------
const toast = m => { const el = $('toast'); el.textContent = m; el.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(() => el.style.opacity = 0, 1800); };
async function shareUrl(url) {
  const data = { title: 'Matrix Love 💚', text: 'I sent you a secret message in hacker language 💚 Tap to decrypt:', url };
  try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('Link copied 💚'); } catch (e) { prompt('Copy this link:', url); }
}
$('share').onclick = () => shareUrl(location.href);
$('make').onclick = () => { $('sheet').classList.remove('hidden'); $('inName').focus(); };
$('close').onclick = () => $('sheet').classList.add('hidden');
$('getLink').onclick = () => {
  const p = new URLSearchParams(); const n = $('inName').value.trim(), m = $('inMsg').value.trim();
  if (n) p.set('name', n); if (m) p.set('msg', m);
  const url = location.origin + location.pathname + (p.toString() ? '?' + p : '');
  $('out').textContent = url; shareUrl(url);
};
})();
