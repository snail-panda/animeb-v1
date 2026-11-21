/* OFFBEAT Weekly Ranking Compact View R1 (2026-11-21)
   Self-contained view: the original ranking DOM, JSON, popups and Theme Studio are untouched.
   Uses _animebEntry on original cards; never replaces, moves or mutates original .entry cards.
*/
(() => {
  'use strict';
  const anchor = document.querySelector('.table-header-mount');
  const original = document.querySelector('.entry-list');
  if (!anchor || !original || document.getElementById('animeb-weekly-compact-switch')) return;

  const STORAGE_KEY = 'offbeat-weekly-compact-view-v1';
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const ja = () => document.body.dataset.animebLang === 'ja';
  const label = (en, jp) => ja() ? jp : en;
  const stored = (() => { try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; } })();
  let mode = stored === 'compact' ? 'compact' : 'detailed';
  let ready = false;
  let reference = new Map();
  let pending = false;

  const toolbar = el('div', 'awc-switch');
  toolbar.id = 'animeb-weekly-compact-switch';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Ranking view mode / 表示モード');
  const legend = el('span', 'awc-switch-label');
  const choices = el('div', 'awc-switch-choices');
  const detailed = el('button', 'awc-switch-button', 'Detailed');
  const compact = el('button', 'awc-switch-button', 'Compact');
  for (const button of [detailed, compact]) button.type = 'button';
  choices.append(detailed, compact);
  toolbar.append(legend, choices);
  toolbar.hidden = true; // Do not show controls until the source data renders successfully.

  const compactList = el('section', 'awc-list');
  compactList.id = 'animeb-weekly-compact-list';
  compactList.setAttribute('aria-label', 'Weekly ranking compact list / 週間ランキング一覧');
  compactList.hidden = true;
  anchor.before(toolbar);
  original.before(compactList);

  const setMode = next => {
    mode = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
    updateMode();
  };
  detailed.addEventListener('click', () => setMode('detailed'));
  compact.addEventListener('click', () => setMode('compact'));

  function updateMode() {
    const active = ready && mode === 'compact';
    document.body.classList.toggle('animeb-weekly-compact-mode', active);
    compactList.hidden = !active;
    for (const [button, current] of [[detailed, 'detailed'], [compact, 'compact']]) {
      const selected = mode === current;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    legend.textContent = label('VIEW MODE', '表示モード');
    detailed.textContent = label('Detailed', '詳細');
    compact.textContent = label('Compact', '一覧');
    toolbar.hidden = !ready;
  }

  // A prior-rank number is available on some weeks only. Never invent a numerical delta.
  // When provided by the weekly_ranking_reference, it is the canonical previous rank.
  function lookupReference(entry) {
    const kv = String(entry.kv || '').trim().toLowerCase();
    const title = String(entry.title || '').trim().toLowerCase();
    return reference.get('kv:' + kv) || reference.get('title:' + title) || null;
  }
  function trendParts(entry) {
    const key = String(entry.trend || '').trim().toLowerCase();
    const match = lookupReference(entry);
    const prev = entry.prev_rank ?? match?.prev_rank;
    const curr = Number(entry.rank);
    const validDelta = Number.isFinite(Number(prev)) && prev !== null && prev !== '' &&
      Number.isSafeInteger(curr) && curr > 0 && Number(prev) > 0;
    const delta = validDelta ? Number(prev) - curr : null;
    if (key === 'up') {
      const amount = delta !== null && delta > 0 ? '+' + delta : '';
      return {cls:'up', icon:'▲', en:'UP' + (amount ? ' ' + amount : ''), jp:'上昇' + (amount ? ' ' + amount : ''), delta};
    }
    if (key === 'down') {
      const amount = delta !== null && delta < 0 ? String(delta).replace('-', '−') : '';
      return {cls:'down', icon:'▼', en:'DOWN' + (amount ? ' ' + amount : ''), jp:'下降' + (amount ? ' ' + amount : ''), delta};
    }
    if (['stay','same','flat','nochange','no change'].includes(key)) {
      return {cls:'stay',icon:'●',en:'STAY',jp:'維持',delta:0};
    }
    if (['new','debut'].includes(key)) return {cls:'new',icon:'✦',en:'NEW',jp:'初登場',delta:null};
    if (['re','reentry','re-entry','back'].includes(key)) return {cls:'new',icon:'↺',en:'RE-ENTRY',jp:'復帰',delta:null};
    return {cls:'unknown',icon:'—',en:key ? key.toUpperCase() : '—',jp:key ? key.toUpperCase() : '—',delta:null};
  }
  const episode = raw => {
    const value = String(raw ?? '').trim().replace(/^ep(?:isode)?\.?\s*#?\s*/i, '');
    return value ? 'Ep. ' + value : '—';
  };
  const points = num => {
    if (num === undefined || num === null || num === '') return '—';
    const value = Number(num);
    return Number.isFinite(value) ? value.toFixed(2) : String(num);
  };
  const total = num => num === undefined || num === null || num === '' ? '—' : String(num);

  function makeRow(source, index) {
    const data = source._animebEntry;
    const row = el('div', 'awc-row');
    row.dataset.rank = String(data.rank ?? (index + 1));
    const rank = el('div', 'awc-rank');
    const rankNum = el('strong', 'awc-rank-number', typeof data.rank === 'number' ? String(data.rank).padStart(2,'0') : String(data.rank ?? '—'));
    const move = trendParts(data);
    const trend = el('span', 'awc-trend awc-trend-' + move.cls, ja() ? move.jp : move.en);
    trend.setAttribute('aria-label', ja() ? move.jp : move.en);
    if (move.icon !== '—') {
      const icon = el('span', 'awc-trend-icon', move.icon);
      icon.setAttribute('aria-hidden','true');
      trend.prepend(icon);
    }
    rank.append(rankNum,trend);
    if (typeof data.rank === 'number' && data.rank >= 1 && data.rank <= 3) rank.classList.add('awc-top-' + data.rank);

    const poster = el('div','awc-poster');
    const existingPoster = source.querySelector('.kv-thumb > img');
    const src = existingPoster?.getAttribute('src');
    if (src) {
      const img = el('img', 'awc-poster-image');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      poster.append(img);
    } else poster.classList.add('awc-missing-poster');

    const names = el('div','awc-titles');
    const primary = ja() ? (data.jpTitle || data.title || '') : (data.title || data.jpTitle || '');
    const secondary = ja() ? data.title : data.jpTitle;
    names.append(el('div','awc-title',primary));
    if (secondary && secondary !== primary) names.append(el('div','awc-subtitle',secondary));

    const meta = el('div','awc-stats');
    const ep = el('span','awc-episode',episode(data.episode));
    const wrp = el('span','awc-metric awc-wrp');
    wrp.append(el('span','awc-metric-caption', String(document.body.dataset.animebFinalWeek) === 'true' ? 'F-WRP' : 'WRP'),el('strong','awc-metric-value',points(data.wrp_score)));
    const rating = el('span','awc-metric awc-total');
    rating.append(el('span','awc-metric-caption',label('TOTAL','総合')),el('strong','awc-metric-value',total(data.score ?? data.overall_rating)));
    meta.append(ep,wrp,rating);

    const originalReview = source.querySelector('.review-tag');
    const hasReview = !!originalReview?.dataset.reviewEn?.trim() || !!originalReview?.dataset.reviewJp?.trim();
    const review = el('button','awc-review',label('Review','レビュー'));
    review.type = 'button';
    review.disabled = !hasReview;
    review.title = hasReview ? label('Open the original bilingual review','既存のレビューを開く') : label('No review','レビューなし');
    if (hasReview) review.addEventListener('click', ev => {
      ev.stopPropagation();
      // Delegates to the already-bound original review handler so the same EN/JP popup opens.
      // The existing popup is fixed and viewport-centered; the hidden original tag's position is irrelevant.
      originalReview.click();
    });
    meta.append(review);
    row.append(rank,poster,names,meta);
    return row;
  }

  function makeHead() {
    const head = el('div','awc-head');
    head.append(
      el('span','awc-head-rank',label('RANK / Δ','順位 / 変動')),
      el('span','awc-head-title',label('TITLE','作品名')),
      el('span','awc-head-episode',label('EP.','話数')),
      el('span','awc-head-wrp',String(document.body.dataset.animebFinalWeek) === 'true' ? 'F-WRP' : 'WRP'),
      el('span','awc-head-score',label('TOTAL','総合')),
      el('span','awc-head-review',label('REVIEW','レビュー'))
    );
    return head;
  }
  function draw() {
    const sources = [...original.children].filter(n => n.classList?.contains('entry') && n._animebEntry);
    if (!sources.length) return;
    const container = document.createDocumentFragment();
    container.append(makeHead());
    sources.forEach((source,i) => container.append(makeRow(source,i)));
    compactList.replaceChildren(container);
    ready = true;
    updateMode();
  }
  function scheduleDraw() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; draw(); });
  }
  new MutationObserver(scheduleDraw).observe(original, {childList: true});
  new MutationObserver(scheduleDraw).observe(document.body, {attributes:true,attributeFilter:['data-animeb-lang','data-animeb-final-week']});
  if ([...original.children].some(n => n._animebEntry)) scheduleDraw();

  // Optional reference metadata is fetched after the ranking is ready. Works without it too.
  const path = `ranking-${window.currentWeek}-${window.season}${window.year}.json`;
  if (window.currentWeek && window.season && window.year) {
    fetch(path).then(r => { if (!r.ok) throw new Error('no reference'); return r.json(); }).then(data => {
      const items = data?.meta?.weekly_ranking_reference?.entries;
      if (!Array.isArray(items)) return;
      const index = new Map();
      items.forEach(item => {
        if (item.kv) index.set('kv:' + String(item.kv).toLowerCase(),item);
        if (item.title) index.set('title:' + String(item.title).trim().toLowerCase(),item);
      });
      reference = index;
      scheduleDraw();
    }).catch(() => {});
  }
})();
