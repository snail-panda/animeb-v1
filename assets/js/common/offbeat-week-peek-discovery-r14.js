/* OFFBEAT Week Peek R14: discoverability cue between Journey and Current Season.
   Uses R11 language preference and does not alter the weekly timeline or Week Peek itself. */
(() => {
  'use strict';
  const anime = document.getElementById('anime-top');
  const season = anime && anime.querySelector('.n-season.n-season-12.n-season-13');
  const journey = anime && anime.querySelector('.n-mast.n-mast-14');
  if (!anime || !season || !journey || season.previousElementSibling !== journey ||
      anime.querySelector('.ob-week-peek-discovery-r14')) return;

  const cue = document.createElement('div');
  cue.className = 'ob-week-peek-discovery-r14';
  cue.setAttribute('role', 'note');
  const tag = document.createElement('span');
  tag.className = 'ob-week-peek-discovery-tag';
  tag.textContent = 'WEEK PEEK';
  tag.lang = 'en';
  const copy = document.createElement('span');
  copy.className = 'ob-week-peek-discovery-copy';
  cue.append(tag, copy);
  season.before(cue);

  const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lang = () => {
    try { return localStorage.getItem('animeb-weekly-lang') === 'ja' ? 'ja' : 'en'; }
    catch (_) { return 'en'; }
  };
  function refresh() {
    const japanese = lang() === 'ja';
    cue.lang = japanese ? 'ja' : 'en';
    copy.textContent = japanese
      ? (finePointer()
        ? '公開済みの週にカーソルを合わせると、ランキングと見どころのダイジェストが見られます。'
        : '公開済みの週をタップすると、ランキングと見どころのダイジェストが見られます。')
      : (finePointer()
        ? 'Hover over a published week for a snapshot of its ranking & highlights.'
        : 'Tap a published week for a snapshot of its ranking & highlights.');
  }
  refresh();
  // R11 changes the same preference in its button click handler; react after it runs.
  document.addEventListener('click', e => {
    if (e.target.closest('.ob-week-peek-language button')) queueMicrotask(refresh);
  });
  window.addEventListener('storage', e => {
    if (e.key === 'animeb-weekly-lang') refresh();
  });
  window.addEventListener('resize', refresh);
})();
