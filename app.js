(() => {
  const q = document.getElementById('q');
  if (!q) return; // About and Team pages have no catalogue grid
  const cards = [...document.querySelectorAll('.card')];
  const chips = [...document.querySelectorAll('.chip')];
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');
  let genre = 'all';

  function setGenre(g) {
    genre = g;
    chips.forEach(c => {
      const on = c.dataset.genre === g;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on);
    });
  }
  function apply() {
    const term = q.value.trim().toLowerCase();
    let n = 0;
    for (const c of cards) {
      const ok = (genre === 'all' || c.dataset.genre === genre) && (!term || c.dataset.search.includes(term));
      c.hidden = !ok;
      if (ok) n++;
    }
    count.textContent = `Showing ${n} of ${cards.length} apps`;
    empty.hidden = n !== 0;
  }

  chips.forEach(ch => ch.addEventListener('click', () => { setGenre(ch.dataset.genre); apply(); }));
  q.addEventListener('input', apply);
  document.getElementById('reset').addEventListener('click', () => { q.value = ''; setGenre('all'); apply(); q.focus(); });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
    if (e.key === 'Escape' && document.activeElement === q) { q.value = ''; apply(); }
  });
  cards.forEach((c, i) => c.style.animationDelay = `${Math.min(i, 12) * 40}ms`);
  apply();

  /* Floating hero icons: jump to the app's card in Every app and highlight it */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toolbar = document.querySelector('.toolbar');
  const nav = document.querySelector('.nav');
  function jumpOffset() {
    // Space taken by the sticky nav and the sticky search/filter bar, plus breathing room
    let top = nav ? nav.offsetHeight : 0;
    if (toolbar) {
      const st = parseFloat(getComputedStyle(toolbar).top);
      top = (isNaN(st) ? top : st) + toolbar.offsetHeight;
    }
    return Math.round(top + 16);
  }
  function setOffsetVar() { document.documentElement.style.setProperty('--jump-offset', jumpOffset() + 'px'); }
  setOffsetVar();
  window.addEventListener('resize', setOffsetVar);
  let flashTimer = null;
  function flash(card) {
    cards.forEach(c => c.classList.remove('flash'));
    void card.offsetWidth;
    card.classList.add('flash');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => card.classList.remove('flash'), 1900);
  }
  // Content above the grid (e.g. the carousel changing height) can shift while a smooth scroll runs,
  // so once scrolling stops, nudge the card back to its intended spot.
  let settleTimer = null;
  function settle(card, smooth) {
    clearInterval(settleTimer);
    let last = -1, still = 0, fixes = 0, ticks = 0;
    settleTimer = setInterval(() => {
      const y = window.pageYOffset;
      still = Math.abs(y - last) < 1 ? still + 1 : 0; last = y;
      if (++ticks > 40) return clearInterval(settleTimer);
      if (still < 2) return;
      const delta = card.getBoundingClientRect().top - jumpOffset();
      if (Math.abs(delta) <= 4 || fixes >= 3) return clearInterval(settleTimer);
      fixes++; still = 0;
      try { window.scrollBy({ top: delta, behavior: smooth ? 'smooth' : 'auto' }); } catch (_) { window.scrollBy(0, delta); }
    }, 100);
  }
  ['wheel', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, () => clearInterval(settleTimer), { passive: true }));
  function jumpTo(id) {
    const card = document.getElementById(id);
    if (!card || !card.classList.contains('card')) return false;
    if (card.hidden) { q.value = ''; setGenre('all'); apply(); }
    setOffsetVar();
    const smooth = !reduceMotion.matches;
    const y = card.getBoundingClientRect().top + window.pageYOffset - jumpOffset();
    try { window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' }); } catch (_) { window.scrollTo(0, Math.max(0, y)); }
    try { card.focus({ preventScroll: true }); } catch (_) {}
    // Start the glow once the scroll has (roughly) arrived
    const dist = Math.abs(card.getBoundingClientRect().top - jumpOffset());
    setTimeout(() => flash(card), smooth ? Math.min(900, 250 + dist / 4) : 0);
    settle(card, smooth);
    return true;
  }
  document.querySelectorAll('a.tile[data-target]').forEach(t => t.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    if (jumpTo(t.dataset.target)) e.preventDefault();
  }));
  if (/^#app-/.test(location.hash)) {
    const id = decodeURIComponent(location.hash.slice(1));
    window.addEventListener('load', () => jumpTo(id));
  }
})();

/* Featured collections carousel */
(() => {
  const root = document.querySelector('.carousel');
  if (!root) return;
  const track = root.querySelector('.car-track');
  const viewport = root.querySelector('.car-viewport');
  const slides = [...root.querySelectorAll('.slide')];
  const pills = [...root.querySelectorAll('.pill-btn')];
  const pauseBtn = root.querySelector('#car-pause');
  const DUR = 6500;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let i = 0, playing = !reduce.matches, timer = null, start = 0, remaining = DUR;
  const holds = new Set();
  const hasInert = 'inert' in HTMLElement.prototype;
  const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]';
  root.classList.add('js');
  function setInactive(s, off) {
    if (off) { s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true'); }
    else { s.removeAttribute('inert'); s.removeAttribute('aria-hidden'); }
    if (!hasInert) {
      // Safari < 15.5: emulate inert by taking hidden slides' controls out of the tab order
      s.querySelectorAll(FOCUSABLE).forEach(el => {
        if (off) { if (!el.hasAttribute('data-tab')) el.setAttribute('data-tab', el.getAttribute('tabindex') || ''); el.setAttribute('tabindex', '-1'); }
        else if (el.hasAttribute('data-tab')) { const t = el.getAttribute('data-tab'); t ? el.setAttribute('tabindex', t) : el.removeAttribute('tabindex'); el.removeAttribute('data-tab'); }
      });
    }
  }
  root.style.setProperty('--dur', DUR + 'ms');

  function setHeight() { viewport.style.height = slides[i].offsetHeight + 'px'; }
  function restartBar() {
    const p = pills[i]; p.classList.remove('active'); void p.offsetWidth; p.classList.add('active');
  }
  function go(n, manual) {
    i = (n + slides.length) % slides.length;
    const tf = 'translateX(' + (-100 * i) + '%)';
    track.style.webkitTransform = tf;
    track.style.transform = tf;
    slides.forEach((s, k) => setInactive(s, k !== i));
    pills.forEach((p, k) => {
      p.classList.toggle('active', k === i);
      k === i ? p.setAttribute('aria-current', 'true') : p.removeAttribute('aria-current');
    });
    const bar = pills[i].parentElement, p = pills[i];
    if (bar.scrollWidth > bar.clientWidth) {
      const left = bar.scrollLeft + p.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - p.offsetWidth) / 2;
      try { bar.scrollTo({ left, behavior: reduce.matches ? 'auto' : 'smooth' }); } catch (_) { bar.scrollLeft = left; }
    }
    track.setAttribute('aria-live', manual ? 'polite' : 'off');
    restartBar();
    setHeight();
    remaining = DUR; schedule();
  }
  function clear() { clearTimeout(timer); timer = null; }
  function schedule() {
    clear();
    if (!playing || holds.size) return;
    start = performance.now();
    timer = setTimeout(() => go(i + 1, false), remaining);
  }
  function hold(reason, on) {
    const was = holds.size;
    if (on) holds.add(reason); else holds.delete(reason);
    if (!was && holds.size && timer) { remaining = Math.max(0, remaining - (performance.now() - start)); clear(); }
    if (was && !holds.size) schedule();
    root.classList.toggle('hold', holds.size > 0);
  }
  function setPlaying(p) {
    playing = p;
    root.classList.toggle('playing', p);
    pauseBtn.setAttribute('aria-label', p ? 'Pause automatic rotation' : 'Start automatic rotation');
    pauseBtn.setAttribute('aria-pressed', String(!p));
    if (p) { remaining = DUR; restartBar(); schedule(); } else clear();
  }

  root.querySelector('#car-prev').addEventListener('click', () => go(i - 1, true));
  root.querySelector('#car-next').addEventListener('click', () => go(i + 1, true));
  pills.forEach((p, k) => p.addEventListener('click', () => go(k, true)));
  pauseBtn.addEventListener('click', () => setPlaying(!playing));

  root.addEventListener('mouseenter', () => hold('hover', true));
  root.addEventListener('mouseleave', () => hold('hover', false));
  // Pause for keyboard focus only; a mouse click focuses buttons in some browsers and would pause forever
  const kbdFocus = el => { try { return el.matches(':focus-visible'); } catch (_) { return true; } };
  root.addEventListener('focusin', e => hold('focus', kbdFocus(e.target)));
  root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) hold('focus', false); });
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
  const onReduce = e => { if (e.matches) setPlaying(false); };
  if (reduce.addEventListener) reduce.addEventListener('change', onReduce);
  else if (reduce.addListener) reduce.addListener(onReduce); // Safari < 14

  root.addEventListener('keydown', e => {
    if (e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1, true); }
  });

  let sx = 0, sy = 0, tracking = false;
  viewport.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; tracking = true; hold('touch', true); }, { passive: true });
  viewport.addEventListener('touchend', e => {
    hold('touch', false);
    if (!tracking) return; tracking = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) go(i + (dx < 0 ? 1 : -1), true);
  }, { passive: true });
  viewport.addEventListener('touchcancel', () => { tracking = false; hold('touch', false); });

  window.addEventListener('resize', setHeight);
  window.addEventListener('load', setHeight);
  if ('ResizeObserver' in window) new ResizeObserver(setHeight).observe(slides[0]);
  setPlaying(playing);
  go(0, false);
})();

/* Hero stats: count up quickly from 0 once they scroll into view (final values are already in the HTML) */
(() => {
  const els = [...document.querySelectorAll('.stats .count-up')];
  if (!els.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('requestAnimationFrame' in window)) return;
  const DUR = 1300;
  const items = els.map(el => {
    const m = el.textContent.trim().match(/^(\d+(?:\.\d+)?)(.*)$/);
    return m && { el, to: parseFloat(m[1]), dp: (m[1].split('.')[1] || '').length, suffix: m[2], final: el.textContent };
  }).filter(Boolean);
  const ease = t => 1 - Math.pow(1 - t, 3);
  function run() {
    // Lock each number's width to its final value so neighbours don't shift while counting
    items.forEach(it => { it.el.style.minWidth = it.el.getBoundingClientRect().width + 'px'; it.el.textContent = '0' + it.suffix; });
    const t0 = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - t0) / DUR), k = ease(t);
      items.forEach(it => { it.el.textContent = (t >= 1 ? it.final : (it.to * k).toFixed(it.dp) + it.suffix); });
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  const box = document.querySelector('.stats');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); run(); }
    }, { threshold: 0.4 });
    io.observe(box);
  } else run();
})();

/* Floating hero icons: drag, fling and bounce for fun. A quick tap still jumps to the app's card. */
(() => {
  const collage = document.querySelector('.collage');
  const hero = document.querySelector('.hero');
  if (!collage || !hero || !window.PointerEvent || !window.requestAnimationFrame) return;
  const grid = hero.querySelector('.hero-grid') || hero;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAP_MOVE = 6, TAP_TIME = 250, IDLE_MS = 2600, MAX_V = 3.2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tiles = [...collage.querySelectorAll('a.tile')].map(el => {
    el.setAttribute('draggable', 'false');
    const img = el.querySelector('img'); if (img) img.setAttribute('draggable', 'false');
    return { el, mode: 'idle', x: 0, y: 0, vx: 0, vy: 0, tilt: 0, s: 1, sq: 0, sqAxis: 'x', restAt: 0, base: null };
  });
  let raf = 0, last = 0, suppressUntil = 0, drag = null, bounds = null;

  function baseAngle(t) {
    if (t.base != null) return t.base;
    const m = getComputedStyle(t.el).transform;
    const v = m && m !== 'none' ? m.match(/matrix\(([^)]+)\)/) : null;
    if (v) { const [a, b] = v[1].split(',').map(parseFloat); t.base = Math.atan2(b, a) * 180 / Math.PI; } else t.base = 0;
    return t.base;
  }
  function measure() {
    // Everything is relative to the collage box; bounds are the hero (vertically) by the content column (horizontally)
    const c = collage.getBoundingClientRect(), h = hero.getBoundingClientRect(), g = grid.getBoundingClientRect();
    bounds = { l: Math.min(g.left, c.left) - c.left, r: Math.max(g.right, c.right) - c.left, t: h.top - c.top + 8, b: h.bottom - c.top - 8 };
    tiles.forEach(t => {
      t.w = t.el.offsetWidth; t.r = t.w * 0.46;
      t.hx = t.el.offsetLeft + t.w / 2; t.hy = t.el.offsetTop + t.el.offsetHeight / 2;
      t.visible = !!t.el.offsetParent;
    });
  }
  function floatOffset(el) {
    // Current CSS float offset, so stopping the animation doesn't make the icon jump
    const tr = getComputedStyle(el).translate;
    if (!tr || tr === 'none') return [0, 0];
    const p = tr.split(/\s+/).map(parseFloat);
    return [p[0] || 0, p[1] || 0];
  }
  function wake(t) {
    if (t.mode !== 'idle') return;
    baseAngle(t);
    const [fx, fy] = floatOffset(t.el);
    t.x = fx; t.y = fy; t.vx = t.vy = 0; t.tilt = 0; t.s = 1; t.sq = 0;
    t.el.classList.add('is-live');
    render(t);
  }
  function sleep(t) {
    t.mode = 'idle'; t.x = t.y = t.vx = t.vy = 0;
    t.el.classList.remove('is-live', 'is-grabbed');
    t.el.style.transform = '';
    t.el.style.animationDelay = '0s'; // restart the float from its home position: no jump
  }
  function render(t) {
    const sx = t.sqAxis === 'x' ? 1 - t.sq : 1 + t.sq, sy = t.sqAxis === 'x' ? 1 + t.sq : 1 - t.sq;
    t.el.style.transform = `translate3d(${t.x.toFixed(2)}px,${t.y.toFixed(2)}px,0) rotate(${(t.base + t.tilt).toFixed(2)}deg) scale(${(t.s * sx).toFixed(3)},${(t.s * sy).toFixed(3)})`;
  }
  function walls(t) {
    if (!bounds) return;
    const cx = t.hx + t.x, cy = t.hy + t.y, r = t.w / 2;
    const minX = bounds.l + r, maxX = bounds.r - r, minY = bounds.t + r, maxY = bounds.b - r;
    if (cx < minX || cx > maxX) {
      t.x = clamp(cx, minX, maxX) - t.hx;
      if (t.mode === 'fling') { const sp = Math.abs(t.vx); t.vx = -t.vx * 0.6; t.sq = Math.min(0.16, sp * 0.07); t.sqAxis = 'x'; }
    }
    if (cy < minY || cy > maxY) {
      t.y = clamp(cy, minY, maxY) - t.hy;
      if (t.mode === 'fling') { const sp = Math.abs(t.vy); t.vy = -t.vy * 0.6; t.sq = Math.min(0.16, sp * 0.07); t.sqAxis = 'y'; }
    }
  }
  function collide() {
    if (reduce.matches) return;
    for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) {
      const a = tiles[i], b = tiles[j];
      if (!a.visible || !b.visible) continue;
      const aOn = a.mode === 'drag' || a.mode === 'fling', bOn = b.mode === 'drag' || b.mode === 'fling';
      if (!aOn && !bOn) continue;
      let dx = (b.hx + b.x) - (a.hx + a.x), dy = (b.hy + b.y) - (a.hy + a.y);
      const min = a.r + b.r, d = Math.hypot(dx, dy) || 0.01;
      if (d >= min) continue;
      const nx = dx / d, ny = dy / d, over = min - d;
      [a, b].forEach(t => { if (t.mode === 'idle' || t.mode === 'rest' || t.mode === 'return') { wake(t); t.mode = 'fling'; } });
      const aFixed = a.mode === 'drag', bFixed = b.mode === 'drag';
      if (aFixed && bFixed) continue;
      const wa = aFixed ? 0 : bFixed ? 1 : 0.5, wb = 1 - wa;
      a.x -= nx * over * wa; a.y -= ny * over * wa; b.x += nx * over * wb; b.y += ny * over * wb;
      const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rel < 0) {
        const imp = -(1 + 0.5) * rel;
        if (!aFixed) { a.vx -= nx * imp * wa; a.vy -= ny * imp * wa; }
        if (!bFixed) { b.vx += nx * imp * wb; b.vy += ny * imp * wb; }
      }
    }
  }
  function step(now) {
    const dt = Math.min(34, now - (last || now)); last = now;
    let busy = false;
    for (const t of tiles) {
      if (t.mode === 'idle') continue;
      busy = true;
      const lift = t.mode === 'drag' ? 1.1 : 1;
      t.s += (lift - t.s) * Math.min(1, dt / 90);
      if (t.mode === 'fling') {
        const f = Math.pow(0.9935, dt);
        t.vx *= f; t.vy *= f;
        t.x += t.vx * dt; t.y += t.vy * dt;
        walls(t);
        if (Math.hypot(t.vx, t.vy) < 0.03) { t.mode = 'rest'; t.restAt = now; t.vx = t.vy = 0; }
      } else if (t.mode === 'rest') {
        if (now - t.restAt > IDLE_MS && !(drag && drag.t === t)) t.mode = 'return';
      } else if (t.mode === 'return') {
        if (reduce.matches) {
          const k = 1 - Math.pow(0.992, dt);
          t.x -= t.x * k; t.y -= t.y * k;
          if (Math.hypot(t.x, t.y) < 0.6) { sleep(t); continue; }
        } else {
          // Gentle spring home with a touch of overshoot
          const w = 0.011, z = 0.62;
          t.vx += (-w * w * t.x - 2 * z * w * t.vx) * dt; t.vy += (-w * w * t.y - 2 * z * w * t.vy) * dt;
          t.x += t.vx * dt; t.y += t.vy * dt;
          if (Math.hypot(t.x, t.y) < 0.5 && Math.hypot(t.vx, t.vy) < 0.01) { sleep(t); continue; }
        }
      }
      const targetTilt = reduce.matches || t.mode === 'return' ? 0 : clamp(t.vx * 9, -14, 14);
      t.tilt += (targetTilt - t.tilt) * Math.min(1, dt / 110);
      t.sq *= Math.pow(0.986, dt);
    }
    collide();
    tiles.forEach(t => { if (t.mode !== 'idle') render(t); });
    raf = busy ? requestAnimationFrame(step) : 0;
    if (!busy) last = 0;
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(step); } }

  tiles.forEach(t => {
    const el = t.el;
    el.addEventListener('dragstart', e => e.preventDefault());
    el.addEventListener('pointerdown', e => {
      if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      measure();
      drag = { t, id: e.pointerId, sx: e.clientX, sy: e.clientY, t0: performance.now(), active: false, ox: 0, oy: 0, samples: [] };
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      drag.hold = setTimeout(() => { if (drag && drag.t === t && !drag.active) begin(); }, TAP_TIME);
    });
    function begin() {
      drag.active = true;
      clearTimeout(drag.hold);
      wake(t);
      t.mode = 'drag'; t.vx = t.vy = 0;
      t.el.classList.add('is-grabbed');
      drag.ox = t.x - (drag.lx != null ? drag.lx - drag.sx : 0); drag.oy = t.y - (drag.ly != null ? drag.ly - drag.sy : 0);
      kick();
    }
    el.addEventListener('pointermove', e => {
      if (!drag || drag.t !== t || e.pointerId !== drag.id) return;
      drag.lx = e.clientX; drag.ly = e.clientY;
      const now = performance.now();
      if (!drag.active && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > TAP_MOVE) begin();
      if (!drag.active) return;
      e.preventDefault();
      t.x = drag.ox + (e.clientX - drag.sx); t.y = drag.oy + (e.clientY - drag.sy);
      walls(t);
      drag.samples.push([now, e.clientX, e.clientY]);
      while (drag.samples.length > 2 && now - drag.samples[0][0] > 90) drag.samples.shift();
      const s0 = drag.samples[0], dtS = now - s0[0];
      if (dtS > 0) { t.vx = (e.clientX - s0[1]) / dtS; t.vy = (e.clientY - s0[2]) / dtS; }
    });
    function end(e, cancelled) {
      if (!drag || drag.t !== t || e.pointerId !== drag.id) return;
      clearTimeout(drag.hold);
      const tap = !drag.active && !cancelled && performance.now() - drag.t0 < TAP_TIME;
      if (!tap) suppressUntil = performance.now() + 500;
      if (drag.active) {
        t.el.classList.remove('is-grabbed');
        const s0 = drag.samples[0];
        const stale = !s0 || performance.now() - drag.samples[drag.samples.length - 1][0] > 80;
        if (reduce.matches || stale) { t.vx = t.vy = 0; t.mode = 'rest'; t.restAt = performance.now(); }
        else {
          const sp = Math.hypot(t.vx, t.vy);
          if (sp > MAX_V) { t.vx *= MAX_V / sp; t.vy *= MAX_V / sp; }
          t.mode = 'fling';
        }
        kick();
      }
      try { t.el.releasePointerCapture(e.pointerId); } catch (_) {}
      drag = null;
    }
    el.addEventListener('pointerup', e => end(e, false));
    el.addEventListener('pointercancel', e => end(e, true));
    el.addEventListener('lostpointercapture', e => { if (drag && drag.t === t && e.pointerId === drag.id) end(e, false); });
  });
  // A drag (or a long press) must not also follow the link; runs before the jump-to-card handler
  document.addEventListener('click', e => {
    if (performance.now() < suppressUntil && e.target.closest && e.target.closest('a.tile')) {
      e.preventDefault(); e.stopImmediatePropagation(); suppressUntil = 0;
    }
  }, true);
  window.addEventListener('resize', () => { tiles.forEach(t => { if (t.mode !== 'idle' && t.mode !== 'drag') sleep(t); }); });
  // Test/debug hook
  window.__tiles = { state: () => tiles.map(t => ({ mode: t.mode, x: Math.round(t.x), y: Math.round(t.y) })) };
})();

/* Phone menu: one button in the header opens a panel with Apps, About, Team and the App Store link */
(() => {
  const nav = document.querySelector('header.nav');
  const btn = nav && nav.querySelector('.menu-btn');
  const panel = btn && document.getElementById(btn.getAttribute('aria-controls'));
  if (!panel) return;
  let open = false, y0 = 0;
  const items = () => [...panel.querySelectorAll('a')];
  function set(o, focusBtn) {
    if (o === open) return;
    open = o;
    nav.classList.toggle('menu-open', o);
    btn.setAttribute('aria-expanded', String(o));
    btn.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
    if (o) y0 = window.pageYOffset;
    if (!o && focusBtn) btn.focus();
  }
  btn.addEventListener('click', e => {
    const was = open;
    set(!open);
    if (!was && e.detail === 0) { const f = items()[0]; if (f) f.focus(); } // opened from the keyboard
  });
  panel.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('pointerdown', e => { if (open && !panel.contains(e.target) && !btn.contains(e.target)) set(false); }, true);
  document.addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); set(false, true); return; }
    if (e.key === 'Tab') {
      const list = [btn, ...items()], i = list.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); list[list.length - 1].focus(); }
      else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus(); }
    }
  });
  window.addEventListener('scroll', () => { if (open && Math.abs(window.pageYOffset - y0) > 12) set(false); }, { passive: true });
  const mq = window.matchMedia('(max-width: 720px)');
  const onMq = () => { if (!mq.matches) set(false); };
  if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
})();

/* Team: leadership flip cards (drag/swipe horizontally, tap, or Enter/Space).
   Motion is driven from JS (spring) and the visible face is chosen from the angle, so it stays correct
   even where a browser flattens 3D or ignores backface-visibility. */
(() => {
  const cards = [...document.querySelectorAll('.flip')];
  if (!cards.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  cards.forEach(card => {
    const inner = card.querySelector('.flip-inner');
    const front = card.querySelector('.front'), back = card.querySelector('.back');
    let angle = 0, target = 0, vel = 0, tiltX = 0, tiltY = 0, tX = 0, tY = 0, drag = null, suppressClick = false, raf = 0, last = 0;
    const faceOf = a => (((Math.round(a / 180) % 2) + 2) % 2) === 1;
    function paint() {
      const norm = ((angle % 360) + 360) % 360, showBack = norm > 90 && norm < 270;
      front.style.visibility = showBack ? 'hidden' : 'visible';
      back.style.visibility = showBack ? 'visible' : 'hidden';
      inner.style.transform = reduce.matches ? '' : `rotateX(${tiltX.toFixed(2)}deg) rotateY(${(angle + tiltY).toFixed(2)}deg)`;
    }
    function sync() {
      const f = faceOf(target);
      card.classList.toggle('is-flipped', f);
      front.setAttribute('aria-hidden', String(f));
      back.setAttribute('aria-hidden', String(!f));
      card.setAttribute('aria-label', `Flip ${card.dataset.name}’s card` + (f ? ' back to the profile' : ''));
    }
    function step(now) {
      const dt = Math.min(32, now - (last || now)); last = now;
      if (!drag || !drag.on) {
        const w = 0.0125, z = 0.5; // springy, slight overshoot
        vel += (w * w * (target - angle) - 2 * z * w * vel) * dt;
        angle += vel * dt;
      }
      tiltX += (tX - tiltX) * Math.min(1, dt / 120); tiltY += (tY - tiltY) * Math.min(1, dt / 120);
      paint();
      const busy = (drag && drag.on) || Math.abs(target - angle) > 0.08 || Math.abs(vel) > 0.002 || Math.abs(tX - tiltX) > 0.02 || Math.abs(tY - tiltY) > 0.02;
      if (busy) raf = requestAnimationFrame(step); else { if (!(drag && drag.on)) { angle = target; vel = 0; } paint(); raf = 0; last = 0; }
    }
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(step); } };
    function settle(t) {
      const was = faceOf(target);
      target = t; sync();
      if (reduce.matches) {
        angle = target; vel = 0; paint();
        const shown = faceOf(target) ? back : front;
        if (was !== faceOf(target) && shown.animate) shown.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      } else kick();
    }
    const flip = dir => settle((Math.round(target / 180) + (dir || 1)) * 180);
    function setRM() { card.classList.toggle('rm', reduce.matches); angle = target; vel = 0; tX = tY = tiltX = tiltY = 0; paint(); }
    setRM(); sync();
    if (reduce.addEventListener) reduce.addEventListener('change', setRM); else if (reduce.addListener) reduce.addListener(setRM);

    card.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, base: angle, on: false, w: card.offsetWidth, samples: [[performance.now(), e.clientX]] };
    });
    card.addEventListener('pointermove', e => {
      if (drag && drag.id === e.pointerId) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.on) {
          if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            drag.on = true; drag.base = angle; drag.x = e.clientX - Math.sign(dx) * 8; vel = 0; tX = tY = 0;
            card.classList.add('dragging');
            try { card.setPointerCapture(e.pointerId); } catch (_) {}
            kick();
          } else if (Math.abs(dy) > 10) { drag = null; return; } // vertical: leave it to page scrolling
          else return;
        }
        e.preventDefault();
        const now = performance.now();
        drag.samples.push([now, e.clientX]);
        while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
        if (!reduce.matches) angle = drag.base + (e.clientX - drag.x) * (180 / Math.max(240, drag.w * 0.85));
        return;
      }
      if (e.pointerType === 'mouse' && !reduce.matches) { // desktop hover: gentle tilt and sheen
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        tY = (px - .5) * 6; tX = (.5 - py) * 5;
        card.style.setProperty('--mx', (faceOf(target) ? 100 - px * 100 : px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        kick();
      }
    });
    card.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !drag) { tX = tY = 0; kick(); } });
    function end(e, cancelled) {
      if (!drag || drag.id !== e.pointerId) return;
      const d = drag; drag = null;
      card.classList.remove('dragging');
      try { card.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!d.on) return; // a tap: the click handler flips
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 400);
      const dx = e.clientX - d.x, s0 = d.samples[0], dt = performance.now() - s0[0];
      const v = dt > 0 ? (e.clientX - s0[1]) / dt : 0;
      if (cancelled) return settle(Math.round(d.base / 180) * 180);
      if (reduce.matches) return Math.abs(dx) > 40 ? flip(dx > 0 ? 1 : -1) : settle(target);
      if (Math.abs(v) > 0.45) { vel = v * 0.25; return settle((v > 0 ? Math.floor(angle / 180) + 1 : Math.ceil(angle / 180) - 1) * 180); } // fast flick
      settle(Math.round(angle / 180) * 180); // nearest face
    }
    card.addEventListener('pointerup', e => end(e, false));
    card.addEventListener('pointercancel', e => end(e, true));
    card.addEventListener('click', e => {
      if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
      flip(1);
    });
    card.addEventListener('keydown', e => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowRight') { e.preventDefault(); flip(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); flip(-1); }
    });
    card.addEventListener('dragstart', e => e.preventDefault());
  });
})();

/* ===== Workflow page: rotating headline, scroll-driven journey, who-does-what mixer, reveals ===== */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Rotating headline
  const pairs = [...document.querySelectorAll('.rot-pairs .pair')];
  if (pairs.length > 1) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      const cur = pairs[i]; i = (i + 1) % pairs.length; const nxt = pairs[i];
      cur.classList.remove('is-on'); cur.classList.add('is-out');
      nxt.classList.remove('is-out'); nxt.classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-out'), 650);
    }, reduce.matches ? 4200 : 2800);
  }

  // Scroll reveals
  const rv = [...document.querySelectorAll('.rv')];
  if (rv.length) {
    if (reduce.matches || !('IntersectionObserver' in window)) rv.forEach(e => e.classList.add('in'));
    else {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0 });
      rv.forEach(e => io.observe(e));
      // Safety net: anything already above the fold (fast flings, WebKit skipping an IO tick) is revealed too
      let pend = false;
      const sweep = () => { pend = false; const vh = window.innerHeight; rv.forEach(e => { if (!e.classList.contains('in') && e.getBoundingClientRect().top < vh * 0.94) { e.classList.add('in'); io.unobserve(e); } }); };
      window.addEventListener('scroll', () => { if (!pend) { pend = true; setTimeout(sweep, 120); } }, { passive: true });
    }
  }

  // Journey: a gem travels along the path (desktop) or down the rail (phone) as you scroll
  const pipe = document.querySelector('[data-pipe]');
  if (pipe) {
    const path = pipe.querySelector('.pipe-fg');
    const gem = pipe.querySelector('.pipe-gem');
    const nodes = [...pipe.querySelectorAll('.pipe-node')];
    const stages = [...pipe.querySelectorAll('.stage')];
    const rail = pipe.querySelector('.rail');
    const len = path ? path.getTotalLength() : 0;
    if (path) { path.style.strokeDasharray = len + ' ' + len; }
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = pipe.getBoundingClientRect(), vh = window.innerHeight || 800;
      const vertical = rail && getComputedStyle(rail).display !== 'none';
      let p;
      if (reduce.matches) p = 1;
      else if (vertical) { const rr = rail.getBoundingClientRect(); p = (vh * 0.62 - rr.top) / Math.max(1, rr.height); }
      else { const track = pipe.querySelector('.pipe-track').getBoundingClientRect(); p = (vh * 0.88 - track.top) / Math.max(1, r.bottom - track.top - vh * 0.12); }
      if (window.scrollY + vh >= document.documentElement.scrollHeight - 4) p = 1;
      p = Math.max(0, Math.min(1, p));
      pipe.style.setProperty('--p', p.toFixed(4));
      if (!vertical && path && gem) {
        path.style.strokeDashoffset = (len * (1 - p)).toFixed(2);
        const pt = path.getPointAtLength(len * p);
        gem.style.left = (pt.x / 10) + '%';
        gem.style.top = (pt.y / 1.2) + '%';
        nodes.forEach((n, i) => n.classList.toggle('lit', p >= i / 3 - 0.001));
        stages.forEach((s, i) => s.classList.toggle('lit', p >= i / 3 - 0.001));
      } else if (vertical) {
        const rr = rail.getBoundingClientRect(), y = rr.top + p * rr.height;
        stages.forEach(s => { const d = s.querySelector('.stage-dot').getBoundingClientRect(); s.classList.toggle('lit', y >= d.top + d.height / 2 - 2); });
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  // Who does what: slider + tabs
  const mix = document.querySelector('[data-mix]');
  if (mix) {
    const range = mix.querySelector('.mix-range');
    const tabs = [...mix.querySelectorAll('[role="tab"]')];
    const panels = [...mix.querySelectorAll('.mix-panel')];
    const show = (i, focus) => {
      i = Math.max(0, Math.min(panels.length - 1, i));
      panels.forEach((p, k) => { p.classList.toggle('on', k === i); p.hidden = k !== i; });
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
      if (+range.value !== i) range.value = i;
      range.setAttribute('aria-valuetext', tabs[i].textContent);
      if (focus) tabs[i].focus();
    };
    range.addEventListener('input', () => show(+range.value));
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => show(k));
      t.addEventListener('keydown', e => {
        const m = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (m) { e.preventDefault(); show((k + m + tabs.length) % tabs.length, true); }
        else if (e.key === 'Home') { e.preventDefault(); show(0, true); }
        else if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
      });
    });
    show(0);
  }
})();
