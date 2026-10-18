(() => {
  const q = document.getElementById('q');
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
