/* OFFBEAT / AnimeB Weekly Ranking — WRP Scorecard R3 (R1 entry event preserved)
   Presentation-only. Reads .entry._animebEntry, never modifies source data.
   Keeps Final Week's legacy WRP popup untouched. */
(function () {
  'use strict';
  if (window.__offbeatWRPScorecardR1) return;
  window.__offbeatWRPScorecardR1 = true;

  const E = (str) => String(str ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fields = [
    ['animation','Animation','アニメーション',1,'camera'],
    ['script','Script','脚本',1,'book'],
    ['direction','Direction','演出',1,'chair'],
    ['charm','Charm','魅力',1,'star'],
    ['overall','Overall','総合評価',2,'crown']
  ];
  const svg = {
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/><circle cx="8" cy="6" r="2"/><circle cx="13" cy="6" r="2"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6C9 4 6 4 2 5v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1z"/><path d="M12 6v14"/></svg>',
    chair: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M5 7l3 11h8l3-11M3 20l18-15M21 20 3 5M4 21h16"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.4 7 .9-5.1 4.9 1.3 7-6.3-3.3-6.3 3.3 1.2-7-5-4.9 7-.9z"/></svg>',
    crown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 7 5.2 4L12 4l4.8 7L22 7l-2 12H4z"/><path d="M4 21h16"/></svg>',
    review: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6C9 4 6 4 2 5v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1z"/><path d="M12 6v14"/></svg>',
    laurel: '<svg viewBox="0 0 48 92" aria-hidden="true"><path d="M36 83C5 64 4 27 30 7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M30 8C15 10 18 2 28 0c10-1 12 4 2 8M23 17C9 18 10 9 18 8c9 0 12 6 5 9M16 28C3 27 5 17 13 18c9 2 9 10 3 10M14 39C1 34 4 25 12 29c9 5 8 12 2 10M17 51C2 45 8 36 16 42c8 7 7 12 1 9M23 62C7 59 14 49 22 56c7 6 6 10 1 6M30 72C16 70 19 62 29 64c10 3 8 9 1 8M36 81C24 85 25 76 33 75c9-1 10 4 3 6" fill="currentColor"/></svg>'
  };

  const str = (ja, en, isJa) => isJa ? ja : en;
  const fmt = (n) => (n !== null && n !== undefined && n !== '' && Number.isFinite(Number(n))) ? Number(n).toFixed(2) : '—';
  const numeric = (v) => (v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))) ? Number(v) : null;
  function currentLang() {
    try { return window.localStorage.getItem('animeb-weekly-lang') === 'ja'; }
    catch (_) { return false; }
  }
  function isNormal(entry) {
    return Boolean(entry && entry._animebEntry && entry._animebEntry.wrp_breakdown &&
      !entry._animebEntry.key_elements_breakdown && window.weekNum !== 12);
  }
  function detailNote(data, isJa) {
    const raw = data.wrp_comment ?? data.scoring_note ?? data.score_note ?? data.rating_note;
    if (!raw) return '';
    if (typeof raw === 'string') return raw.trim();
    if (typeof raw === 'object') return String(raw[isJa ? 'ja' : 'en'] ?? raw[isJa ? 'jp' : 'en'] ?? '').trim();
    return '';
  }
  function gauge(value, max, isOverall) {
    const ratio = Math.min(100, Math.max(0, Math.abs(value ?? 0) / max * 100));
    const neg = Number(value) < 0;
    const desc = isOverall ? ' (−2.00…+2.00)' : '';
    return `<span class="ob-wrp-r1-gauge${neg ? ' is-negative' : ''}" role="img" aria-label="${E(fmt(value) + ' / ' + fmt(max) + desc)}"><span class="ob-wrp-r1-gauge-fill" style="width:${ratio}%"></span></span>`;
  }
  function episodeText(data, entry, isJa) {
    const rawHead = entry._animebEpisodeHeadings || {};
    const primary = isJa ? (rawHead.ja || '') : (rawHead.en || '');
    const secondary = isJa ? (rawHead.en || '') : (rawHead.ja || '');
    const fallback = data.episode ? (isJa ? `第${data.episode}話` : `Episode #${data.episode}`) : '';
    return E(primary || secondary || fallback);
  }
  function content(entry) {
    const data = entry._animebEntry;
    const breakdown = data.wrp_breakdown || {};
    const ja = currentLang();
    const base = numeric(breakdown.base_score ?? breakdown.base);
    const parts = fields.map(([key]) => numeric(breakdown[key]));
    const valid = parts.every(v => v !== null);
    const sum = valid ? parts.reduce((a,b)=>a+b,0) : null;
    const total = numeric(data.wrp_score);
    const rawRank = data.rank;
    const rank = Number.isSafeInteger(Number(rawRank)) && Number(rawRank) > 0 ? Number(rawRank) : null;
    const note = detailNote(data, ja);
    const hasReview = Boolean(entry.querySelector('.review-tag:not([style*="display: none"])'));
    const rows = fields.map(([key,en,jp,max,icon],i) => {
      const score = parts[i];
      return `<div class="ob-wrp-r1-score-row">
          <span class="ob-wrp-r1-icon">${svg[icon]}</span>
          <span class="ob-wrp-r1-criterion">${E(ja?jp:en)}</span>
          ${gauge(score,max,key==='overall')}
          <span class="ob-wrp-r1-numeric">${E(fmt(score))}<small> / ${fmt(max)}</small></span>
        </div>`;
    }).join('');
    return `<div class="ob-wrp-r1-header ob-wrp-r3-header">
      <div class="ob-wrp-r1-titlebox">
        ${rank ? `<div class="ob-wrp-r3-rank">RANK ${rank}</div>` : ''}
        <h2>${E(ja ? (data.jpTitle||data.title||'') : (data.title||data.jpTitle||''))}</h2>
        <div class="ob-wrp-r1-subtitle">${E(ja ? (data.title||'') : (data.jpTitle||''))}</div>
        <div class="ob-wrp-r1-episode">${episodeText(data,entry,ja)}</div>
      </div>
      <button class="ob-wrp-r1-close" type="button" data-ob-wrp-close aria-label="${E(str('閉じる','Close',ja))}">×</button>
    </div>
    <div class="ob-wrp-r1-hero">
      <span class="ob-wrp-r1-laurel">${svg.laurel}</span>
      <div class="ob-wrp-r1-hero-name"><strong>WRP</strong><small>Weekly Ranking Point</small></div>
      <span class="ob-wrp-r1-divider" aria-hidden="true"></span>
      <div class="ob-wrp-r1-hero-score">${E(fmt(total))}<small>pt</small></div>
      <span class="ob-wrp-r1-laurel is-flipped">${svg.laurel}</span>
    </div>
    <div class="ob-wrp-r1-equation ob-wrp-r3-formula" aria-label="${E(str('素点と評価要素の合計','WRP calculation',ja))}">
      <span>${str('素点','Base',ja)} <strong>${fmt(base)}</strong></span>
      <b aria-hidden="true">+</b>
      <span>${str('評価要素','Evaluation',ja)} <strong>${fmt(sum)}</strong><small>${str('（5項目・最大6.00）','(5 items · max 6.00)',ja)}</small></span>
      <b aria-hidden="true">=</b>
      <span class="ob-wrp-r3-formula-total">WRP <strong>${fmt(total)}</strong></span>
    </div>
    <div class="ob-wrp-r1-items-heading"><strong>${str('評価要素の内訳','Evaluation breakdown',ja)}</strong><span>${str('各項目の配点：アニメ・脚本・演出・魅力 各1.00 ／ 総合評価 2.00','Maximum: Animation, Script, Direction, Charm 1.00 each; Overall 2.00',ja)}</span></div>
    <div class="ob-wrp-r1-items">${rows}</div>
    <p class="ob-wrp-r1-overall-note">${str('※ 総合評価：−2.00 ～ ＋2.00','* Overall range: −2.00 to +2.00',ja)}</p>
    ${note ? `<section class="ob-wrp-r1-comment"><h3>${str('採点について一言','A note on the score',ja)}</h3><p>${E(note).replace(/\n/g,'<br>')}</p></section>` : ''}
    ${hasReview ? `<div class="ob-wrp-r1-review-wrap"><button type="button" class="ob-wrp-r1-review" data-ob-wrp-review>${svg.review}<span>${str('レビューを読む','Read the review',ja)}</span></button></div>` : ''}
    <details class="ob-wrp-r1-method ob-wrp-r3-method">
      <summary>${str('WRPの採点について','About WRP scoring',ja)}<span class="ob-wrp-r3-chevron" aria-hidden="true"></span></summary>
      <div class="ob-wrp-r3-method-body">
        <p>${str('WRPは、素点（通常5.00）と評価要素（5項目・最大6.00）の合計です。','WRP combines a base score (usually 5.00) with five evaluation components (up to 6.00 total).',ja)}</p>
        <p>${str('基本は10点満点を目安にしていますが、特に優れたエピソードでは最大11点まで採点する場合があります。','The usual benchmark is 10 points, but exceptional episodes may receive up to 11.',ja)}</p>
        <p>${str('内容が著しく不十分な場合、素点を減らすことがあります。','The base score may be reduced for exceptionally weak episodes.',ja)}</p>
        <p>${str('評価要素のうち、総合評価は−2.00～＋2.00の範囲で加減します。','The Overall component ranges from −2.00 to +2.00.',ja)}</p>
      </div>
    </details>`;
  }

  let active = null;
  function close() {
    if (!active) return;
    const { overlay, oldBody, returnFocus } = active;
    active = null;
    overlay.remove();
    document.body.style.overflow = oldBody;
    if (returnFocus && typeof returnFocus.focus === 'function') {
      try { returnFocus.focus({preventScroll:true}); } catch (_) {}
    }
  }
  function open(entry) {
    if (!isNormal(entry)) return;
    close();
    const overlay=document.createElement('div');
    overlay.className='ob-wrp-r1-overlay';
    overlay.innerHTML=`<div class="ob-wrp-r1-panel" role="dialog" aria-modal="true" aria-label="WRP scoring details">${content(entry)}</div>`;
    const oldBody=document.body.style.overflow;
    active={overlay,oldBody,returnFocus:document.activeElement};
    document.body.appendChild(overlay);
    document.body.style.overflow='hidden';
    overlay.querySelector('.ob-wrp-r1-close')?.focus({preventScroll:true});
    overlay.addEventListener('click',event=>{
      if(event.target===overlay || event.target.closest('[data-ob-wrp-close]')){ event.stopPropagation();close();return; }
      if(event.target.closest('[data-ob-wrp-review]')){
        const button=entry.querySelector('.review-tag');
        event.stopPropagation();close();
        if(button && getComputedStyle(button).display!=='none')button.click();
      }
    });
  }
  document.addEventListener('keydown',event=>{
    if (active && event.key==='Escape') {event.stopPropagation(); close();return;}
    if (!active && (event.key==='Enter'||event.key===' ') && event.target.matches('.entry.ob-wrp-r1-enabled .wrp-score, .entry.ob-wrp-r1-enabled .bar-label')) {
      event.preventDefault();open(event.target.closest('.entry'));
    }
  },true);
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('.entry.ob-wrp-r1-enabled .wrp-score, .entry.ob-wrp-r1-enabled .bar-label');
    if (!trigger) return;
    const entry=trigger.closest('.entry');
    if (!isNormal(entry)) return;
    event.preventDefault();event.stopImmediatePropagation();open(entry);
  },true);
  function enhance(){
    document.querySelectorAll('.entry-list .entry').forEach(entry=>{
      if(!isNormal(entry) || entry.classList.contains('ob-wrp-r1-enabled'))return;
      entry.classList.add('ob-wrp-r1-enabled');
      for(const cls of ['.wrp-score','.bar-label']){
        const target=entry.querySelector(cls); if(!target) continue;
        target.setAttribute('role','button');target.tabIndex=0;
        target.setAttribute('aria-label',currentLang()?'WRPの採点詳細を開く':'Open WRP scoring details');
        target.setAttribute('title',currentLang()?'採点の内訳を見る':'View score breakdown');
      }
    });
  }
  const observer=new MutationObserver(enhance);
  function start(){
    const list=document.querySelector('.entry-list');
    if(list){observer.observe(list,{childList:true,subtree:true});enhance();return;}
    setTimeout(start,100);
  }
  start();
})();
