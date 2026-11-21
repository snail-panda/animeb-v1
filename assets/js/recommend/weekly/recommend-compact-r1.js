/* OFFBEAT Recommendations & Enjoyment | Compact view R1
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
  let toolbar, countRec, countEnjoy, detailedBtn, compactBtn;
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
    toolbar = document.createElement('div');
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
    const anchors = document.createElement('div');
    anchors.className = 'ob-cv-anchors';
    const recLink = document.createElement('a');
    recLink.href = '#ob-cv-recommend';
    countRec = document.createElement('span');
    countRec.textContent = t('Recommendations', 'おすすめ');
    recLink.append(countRec);
    const enjoyLink = document.createElement('a');
    enjoyLink.href = '#ob-cv-enjoyment';
    countEnjoy = document.createElement('span');
    countEnjoy.textContent = t('Enjoyment', 'エンジョイメント');
    enjoyLink.append(countEnjoy);
    anchors.append(recLink, enjoyLink);
    toolbar.append(lead, actions, anchors);
    firstSection.before(toolbar);
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
    // If existing page markup supplied its own IDs, preserve them and use those anchors.
    if (sectionRec && sectionRec.id && $('#ob-cv-toolbar .ob-cv-anchors a:first-child')?.getAttribute('href') !== '#'+sectionRec.id) {
      $('#ob-cv-toolbar .ob-cv-anchors a:first-child').href = '#'+sectionRec.id;
    }
    if (sectionEnjoy && sectionEnjoy.id && $('#ob-cv-toolbar .ob-cv-anchors a:last-child')?.getAttribute('href') !== '#'+sectionEnjoy.id) {
      $('#ob-cv-toolbar .ob-cv-anchors a:last-child').href = '#'+sectionEnjoy.id;
    }
    const recLabel = t('Recommendations', 'おすすめ');
    const enjLabel = t('Enjoyment', 'エンジョイメント');
    const newRec = rec.length ? `${recLabel} · ${rec.length}` : recLabel;
    const newEnjoy = enj.length ? `${enjLabel} · ${enj.length}` : enjLabel;
    if (countRec && countRec.textContent !== newRec) countRec.textContent = newRec;
    if (countEnjoy && countEnjoy.textContent !== newEnjoy) countEnjoy.textContent = newEnjoy;
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
