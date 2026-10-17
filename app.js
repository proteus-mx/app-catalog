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
