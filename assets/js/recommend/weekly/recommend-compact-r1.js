/* OFFBEAT Recommendations & Enjoyment | Compact view R3
   Presentation-only: reuse existing, JSON-rendered cards so Season Performance image
   clicks, original reviews, and More Details remain intact in both modes.
   Scope: recommendations pages only. */
(() => {
  'use strict';
  if (!/\/features\/recommend\/\d{4}\/(?:winter|spring|summer|fall)\/week\d{2}\//i.test(location.pathname)) return;
  const isJA = /^ja/i.test(document.documentElement.lang || '');
  const t = (en, ja) => isJA ? ja : en;
  const STORAGE_KEY = 'offbeat-recommend-compact-view-r1';
  const $ = (selector, base = document) => base.querySelector(selector);
  const $$ = (selector, base = document) => [...base.querySelectorAll(selector)];
  let toolbar, detailedBtn, compactBtn;
  let refreshQueued = false;

  function save(value) {
    try { localStorage.setItem(STORAGE_KEY, value ? 'compact' : 'detailed'); } catch (_) {}
  }
  function read() {
    try { return localStorage.getItem(STORAGE_KEY) === 'compact'; } catch (_) { return false; }
  }
  function changeMode(compact, persist = true) {
    document.body.classList.toggle('ob-cv-enabled', compact);
    detailedBtn.setAttribute('aria-pressed', String(!compact));
    compactBtn.setAttribute('aria-pressed', String(compact));
    if (persist) save(compact);
  }
  function makeButton(cls, label, title) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = cls;
    button.textContent = label;
    if (title) button.setAttribute('aria-label', title);
    return button;
  }
  function makeToolbar() {
    const firstSection = $('.section');
    if (!firstSection || $('#ob-cv-toolbar')) return false;
    // Use ASIDE, not DIV. Existing Recommendations renderer relies on
    // `.section:nth-of-type(N)` (DIV siblings); an extra DIV silently breaks it.
    toolbar = document.createElement('aside');
    toolbar.id = 'ob-cv-toolbar';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', t('Ranking display mode', 'ランキング表示モード'));
    const lead = document.createElement('div');
    lead.className = 'ob-cv-lead';
    lead.innerHTML = `<span class="ob-cv-eyebrow">${t('VIEW MODE','表示モード')}</span>`;
    const actions = document.createElement('div');
    actions.className = 'ob-cv-actions';
    detailedBtn = makeButton('ob-cv-mode', t('Detailed','詳細表示'));
    compactBtn = makeButton('ob-cv-mode', t('Compact','コンパクト'));
    detailedBtn.addEventListener('click', () => changeMode(false));
    compactBtn.addEventListener('click', () => changeMode(true));
    actions.append(detailedBtn, compactBtn);
    toolbar.append(lead, actions);
    firstSection.before(toolbar);
    // Follow the existing sticky language nav, without obscuring it.
    const nav = $('.lang-switch');
    const syncTop = () => toolbar.style.setProperty('--ob-cv-sticky-top',
      `${nav ? Math.ceil(nav.getBoundingClientRect().height) + 4 : 4}px`);
    syncTop();
    window.addEventListener('resize', syncTop, {passive:true});
    if (nav && typeof ResizeObserver !== 'undefined') new ResizeObserver(syncTop).observe(nav);
    changeMode(read(), false);
    return true;
  }
  function makeRankBadge() {
    const span = document.createElement('span');
    span.className = 'ob-cv-rank';
    span.setAttribute('aria-hidden','true');
    return span;
  }
  function openCardDetails(card) {
    changeMode(false);
    requestAnimationFrame(() => {
      card.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }
  function ensureControls(card, kind, rank) {
    const main = $(kind === 'rec' ? '.animeb-recommend-main' : '.animeb-enjoyment-main', card);
    if (!main) return;
    let badge = $('.ob-cv-rank', main);
    if (!badge) {
      badge = makeRankBadge();
      main.prepend(badge);
    }
    const rankText = String(rank).padStart(2,'0');
    if (badge.textContent !== rankText) badge.textContent = rankText;
    if (!$('.ob-cv-open', main)) {
      const button = makeButton('ob-cv-open', '', t('Open full details for this title', 'この作品の詳細表示に戻る'));
      const word = document.createElement('span');
      word.className = 'ob-cv-open-text';
      word.textContent = t('Details','詳細');
      const arrow = document.createElement('span');
      arrow.className = 'ob-cv-open-arrow';
      arrow.setAttribute('aria-hidden','true');
      arrow.textContent = '›';
      button.append(word, arrow);
      button.addEventListener('click', () => openCardDetails(card));
      main.append(button);
    }
  }
  // PC: 01-05 down the left / 06-10 down the right, then 11-15 / 16-20.
  // Physically group in DOM rank order so keyboard/screen-reader order stays logical.
  // In Detailed/mobile modes wrappers have display:contents and change no layout.
  function groupEnjoyment(section, cards) {
    if (!section || !cards.length) return;
    const oldGroups = $$('.ob-cv-ten-block', section);
    if (oldGroups.length && cards.every(card => !!card.closest('.ob-cv-ten-block')) &&
        oldGroups.reduce((n, block) => n + $$('.animeb-enjoyment-card', block).length, 0) === cards.length) return;
    // A future data refresh should not leave stale wrappers or reorder titles.
    oldGroups.forEach(block => {
      block.before(...$$('.animeb-enjoyment-card', block));
      block.remove();
    });
    const marker = document.createComment('Enjoyment ranking start');
    cards[0].before(marker);
    const result = document.createDocumentFragment();
    for (let start = 0; start < cards.length; start += 10) {
      const block = document.createElement('div');
      block.className = 'ob-cv-ten-block';
      const left = document.createElement('div');
      const right = document.createElement('div');
      left.className = right.className = 'ob-cv-ten-half';
      // Small reading guide for desktop columns; hidden in mobile/detailed modes.
      const heading = document.createElement('h3');
      heading.className = 'ob-cv-ten-title';
      const end = Math.min(start + 10, cards.length);
      const rankRange = `${String(start + 1).padStart(2, '0')}–${String(end).padStart(2, '0')}`;
      heading.textContent = t(`Ranks ${rankRange}`, `${rankRange}位`);
      block.append(heading);
      cards.slice(start, start + 5).forEach(card => left.append(card));
      cards.slice(start + 5, start + 10).forEach(card => right.append(card));
      block.append(left, right);
      result.append(block);
    }
    marker.replaceWith(result);
  }
  function update() {
    if (!toolbar && !makeToolbar()) return;
    const rec = $$('.animeb-info-card');
    const enj = $$('.animeb-enjoyment-card');
    rec.forEach((card, idx) => ensureControls(card, 'rec', idx + 1));
    enj.forEach((card, idx) => {
      const node = $('.animeb-rank', card);
      const parsed = parseInt(node?.textContent || '', 10);
      ensureControls(card, 'enj', Number.isFinite(parsed) ? parsed : idx + 1);
    });
    const sectionRec = rec[0]?.closest('.section') || $('.section');
    const sectionEnjoy = enj[0]?.closest('.section') || $$('.section').find(s=>/enjoyment|エンジョイメント|楽し/.test(s.querySelector('h1,h2')?.textContent||''));
    if (sectionRec && !sectionRec.id) sectionRec.id = 'ob-cv-recommend';
    if (sectionEnjoy && !sectionEnjoy.id) sectionEnjoy.id = 'ob-cv-enjoyment';
    groupEnjoyment(sectionEnjoy, enj);
  }
  function scheduleUpdate() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => { refreshQueued = false; update(); });
  }
  function init() {
    if (!makeToolbar()) return;
    update();
    // Card data is loaded asynchronously by the existing recommendations.js.
    // Only observe insertions, not text or attributes; controls are idempotent.
    new MutationObserver(scheduleUpdate).observe(document.body, {childList:true,subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
