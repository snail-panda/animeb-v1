/* AnimeB R15: previous/next through the nearest PUBLISHED weekly ranking.
   weekly-rankings.json is the canonical list; the adjacent target is HEAD-checked.
   No season placeholders or changes to ranking, image or theme data. */
(() => {
  'use strict';
  const previous = document.querySelector('.nav-link.left a');
  const next = document.querySelector('.nav-link.right a');
  if (!previous || !next) return;

  const seasonOrder = { winter: 0, spring: 1, summer: 2, fall: 3 };
  const here = {
    year: Number(window.year),
    season: String(window.season || '').toLowerCase(),
    week: Number.parseInt(String(window.currentWeek || '').replace(/^week/i, ''), 10)
  };
  if (!Number.isInteger(here.year) || !(here.season in seasonOrder) || !Number.isInteger(here.week)) {
    console.warn('[AnimeB R15] Cannot identify the current weekly ranking.');
    return;
  }

  const root = new URL('../../../../', window.location.href);
  const labels = {
    en: { week: 'Week', ranking: 'Ranking', season: 'Season', previous: 'Previous', next: 'Next' },
    ja: { week: '\u9031', ranking: '\u30e9\u30f3\u30ad\u30f3\u30b0', season: '\u30b7\u30fc\u30ba\u30f3', previous: '\u524d\u306e', next: '\u6b21\u306e' }
  };
  function currentLanguage() {
    if (document.body?.dataset?.animebLang === 'ja') return 'ja';
    if (document.body?.dataset?.animebLang === 'en') return 'en';
    try { return localStorage.getItem('animeb-weekly-lang') === 'ja' ? 'ja' : 'en'; }
    catch (_) { return 'en'; }
  }
  function updateText() {
    const terms = labels[currentLanguage()];
    for (const [node, direction] of [[previous, 'previous'], [next, 'next']]) {
      const type = node.dataset.animebNavKind || 'week';
      const what = terms[type] || terms.week;
      const label = currentLanguage() === 'ja' ? `${terms[direction]}${what}` : `${terms[direction]} ${what}`;
      node.textContent = direction === 'previous' ? `\u00ab ${label}` : `${label} \u00bb`;
    }
  }
  // The existing language switch rewrites nav labels. Its body data-language
  // change is observed here, so the labels remain correct without modifying main.js.
  if (typeof MutationObserver === 'function') {
    new MutationObserver(updateText).observe(document.body, {
      attributes: true, attributeFilter: ['data-animeb-lang']
    });
  }
  function setTarget(node, direction, entry) {
    if (!entry) {
      node.removeAttribute('href');
      node.classList.add('disabled');
      node.setAttribute('aria-disabled', 'true');
      node.dataset.animebNavKind = 'week';
      node.title = direction === 'previous' ? 'No earlier published ranking' : 'No later published ranking';
    } else {
      node.href = entry.url;
      node.classList.remove('disabled');
      node.removeAttribute('aria-disabled');
      node.removeAttribute('title');
      node.dataset.animebNavKind = entry.season !== here.season || entry.year !== here.year
        ? 'season'
        : Math.abs(entry.week - here.week) === 1 ? 'week' : 'ranking';
    }
    updateText();
  }
  previous.addEventListener('click', event => {
    if (previous.classList.contains('disabled')) event.preventDefault();
  });
  next.addEventListener('click', event => {
    if (next.classList.contains('disabled')) event.preventDefault();
  });
  setTarget(previous, 'previous', null);
  setTarget(next, 'next', null);

  function rankKey(item) {
    return item.year * 10000 + seasonOrder[item.season] * 100 + item.week;
  }
  function collectPublished(data) {
    const unique = new Map();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
    for (const [yearText, seasons] of Object.entries(data)) {
      const y = Number(yearText);
      if (!Number.isInteger(y) || y < 2000 || y > 2200 || !seasons || typeof seasons !== 'object') continue;
      for (const [seasonText, value] of Object.entries(seasons)) {
        const s = seasonText.toLowerCase();
        if (!(s in seasonOrder) || !Array.isArray(value?.weeks)) continue;
        for (const rawWeek of value.weeks) {
          const match = /^\s*week\s*0*(\d{1,2})\s*$/i.exec(String(rawWeek));
          if (!match) continue;
          const w = Number(match[1]);
          if (!Number.isInteger(w) || w < 0 || w > 53) continue;
          const id = `${y}-${s}-${w}`;
          const directory = `ranking/${y}/${s}/week${String(w).padStart(2, '0')}/index.html`;
          unique.set(id, { year: y, season: s, week: w, url: new URL(directory, root).href });
        }
      }
    }
    return [...unique.values()].sort((a, b) => rankKey(a) - rankKey(b));
  }
  async function firstAccessible(items) {
    for (const item of items) {
      try {
        const response = await fetch(item.url, { method: 'HEAD', cache: 'no-store' });
        if (response.ok) return item;
      } catch (error) {
        console.warn('[AnimeB R15] Could not verify ranking:', item.url, error);
        // Unknown availability: never link to a page we cannot confirm.
      }
    }
    return null;
  }
  async function start() {
    try {
      const response = await fetch(new URL('weekly-rankings.json', root), { cache: 'no-store' });
      if (!response.ok) throw new Error(`Published ranking index HTTP ${response.status}`);
      const entries = collectPublished(await response.json());
      const key = rankKey(here);
      const older = entries.filter(item => rankKey(item) < key).reverse();
      const newer = entries.filter(item => rankKey(item) > key);
      const [olderEntry, newerEntry] = await Promise.all([
        firstAccessible(older), firstAccessible(newer)
      ]);
      setTarget(previous, 'previous', olderEntry);
      setTarget(next, 'next', newerEntry);
    } catch (error) {
      console.warn('[AnimeB R15] Published navigation unavailable; links remain disabled.', error);
    }
  }
  start();
})();
