/* OFFBEAT Week Peek guide (R12). Content-only: preserves approved R11 UI. */
(() => {
  'use strict';
  const root = document.querySelector('#anime-top .n-season');
  const heading = root?.querySelector('.n-season-heading');
  const nav = root?.querySelector('.n-weeks');
  if (!root || !heading || !nav || root.querySelector('.ob-week-peek-guide')) return;

  const guide = document.createElement('p');
  guide.className = 'ob-week-peek-guide';
  guide.setAttribute('role', 'note');
  const mark = document.createElement('span');
  mark.className = 'ob-week-peek-guide-mark';
  mark.textContent = '↗';
  mark.setAttribute('aria-hidden', 'true');
  const words = document.createElement('span');
  guide.append(mark, words);
  heading.insertAdjacentElement('afterend', guide);

  const currentLanguage = () => {
    try { return localStorage.getItem('animeb-weekly-lang') === 'ja' ? 'ja' : 'en'; }
    catch (_) { return 'en'; }
  };
  let last = null;
  const refresh = () => {
    const lang = currentLanguage();
    if (lang === last) return;
    last = lang;
    guide.lang = lang;
    if (lang === 'ja') {
      words.textContent = '週間タイムラインの公開済みの週に触れると、その週のランキングの縮小版を表示できます。';
    } else {
      words.textContent = 'Hover over or tap a published week on the timeline to preview its weekly ranking.';
    }
  };
  refresh();
  // The R11 language control writes the same localStorage key on click.
  // Update after its own event handler, without changing that handler.
  document.addEventListener('click', e => {
    if (e.target.closest('.ob-week-peek-language')) queueMicrotask(refresh);
  });
  window.addEventListener('storage', e => { if (e.key === 'animeb-weekly-lang') refresh(); });
})();
