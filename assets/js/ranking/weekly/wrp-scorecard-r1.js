/* OFFBEAT / AnimeB Weekly Ranking — WRP Scorecard R4 (R1 entry event preserved)
   Presentation-only. Reads .entry._animebEntry, never modifies source data.
   Keeps Final Week's legacy WRP popup untouched. */
(function () {
  'use strict';
  if (window.__offbeatWRPScorecardR1) return;
  window.__offbeatWRPScorecardR1 = true;

  const E = (str) => String(str ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fields = [
    ['animation','Animation','アニメーション',1,'film'],
    ['script','Script','脚本',1,'book'],
    ['direction','Direction','演出',1,'clapper'],
    ['charm','Charm','魅力',1,'star'],
    ['overall','Overall Rating','総合評価',2,'crown']
  ];
  const sublabels = {
    animation:['Visual quality / Animation','映像表現・作画'],
    direction:['Structure / Pacing','構成・テンポ'],
    charm:['Appeal / Charisma','訴求力・個性']
  };
  const svg = {
    film: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.4" y="4.5" width="19.2" height="15" rx="1.3"/><path d="M7.3 4.5v15M16.7 4.5v15M2.4 9h4.9m-4.9 6h4.9m9.4-6h4.9m-4.9 6h4.9"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6C9 4 6 4 2 5v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1z"/><path d="M12 6v14"/></svg>',
    clapper: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9 2 5.7a1 1 0 0 1 .7-1.2l16.4-3.1a1 1 0 0 1 1.2.8l.5 3.4L3 9Z M7 3.8l3.3 3.4m2.9-5 3.3 3.4M3 13h18"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.4 7 .9-5.1 4.9 1.3 7-6.3-3.3-6.3 3.3 1.2-7-5-4.9 7-.9z"/></svg>',
    crown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 7 5.2 4L12 4l4.8 7L22 7l-2 12H4z"/><path d="M4 21h16"/></svg>',
    review: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6C9 4 6 4 2 5v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1z"/><path d="M12 6v14"/></svg>',
    laurel: '<svg viewBox="0 0 60 104" aria-hidden="true"><path d="M44 101 C13 88 6 57 15 35 C19 20 29 9 43 4" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"/><g fill="currentColor"><g transform="translate(29.6 18)"><path d="M0 0 C-5 -3 -15 -4 -18 -14 C-11 -17 -3 -12 0 0Z"/><path d="M0 0 C7 -3 12 -7 16 -16 C6 -15 1 -10 0 0Z"/></g><g transform="translate(25.1 29)"><path d="M0 0 C-5 -3 -15 -4 -18 -14 C-11 -17 -3 -12 0 0Z"/><path d="M0 0 C7 -3 12 -7 16 -16 C6 -15 1 -10 0 0Z"/></g><g transform="translate(22.4 40)"><path d="M0 0 C-5 -3 -15 -4 -18 -14 C-11 -17 -3 -12 0 0Z"/><path d="M0 0 C7 -3 12 -7 16 -16 C6 -15 1 -10 0 0Z"/></g><g transform="translate(21.5 51)"><path d="M0 0 C-5 -3 -15 -4 -18 -14 C-11 -17 -3 -12 0 0Z"/><path d="M0 0 C7 -3 12 -7 16 -16 C6 -15 1 -10 0 0Z"/></g><g transform="translate(22.5 62)"><path d="M0 0 C-5 -3 -15 -4 -18 -14 C-11 -17 -3 -12 0 0Z"/><path d="M0 0 C7 -3 12 -7 16 -16 C6 -15 1 -10 0 0Z"/></g><g transform="translate(25.3 73)"><path d="M0 0 C-5 -3 -15 -4 -18 -14 C-11 -17 -3 -12 0 0Z"/><path d="M0 0 C7 -3 12 -7 16 -16 C6 -15 1 -10 0 0Z"/></g><g transform="translate(29.9 84)"><path d="M0 0 C-5 -3 -15 -4 -18 -14 C-11 -17 -3 -12 0 0Z"/><path d="M0 0 C7 -3 12 -7 16 -16 C6 -15 1 -10 0 0Z"/></g><g transform="translate(36.4 95)"><path d="M0 0 C-5 -3 -15 -4 -18 -14 C-11 -17 -3 -12 0 0Z"/><path d="M0 0 C7 -3 12 -7 16 -16 C6 -15 1 -10 0 0Z"/></g></g></svg>'
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
          <span class="ob-wrp-r1-criterion"><span class="ob-wrp-r4-main">${E(ja?jp:en)}</span>${sublabels[key] ? `<small class="ob-wrp-r4-sub">${E(sublabels[key][ja?1:0])}</small>` : ''}</span>
          ${gauge(score,max,key==='overall')}
          <span class="ob-wrp-r1-numeric">${E(fmt(score))}<small> / ${fmt(max)}</small></span>
        </div>`;
    }).join('');
    return `<div class="ob-wrp-r1-header ob-wrp-r3-header">
      <div class="ob-wrp-r1-titlebox">
        ${rank ? `<div class="ob-wrp-r3-rank">RANK <strong>${rank}</strong></div>` : ''}
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
        <p>${str('<strong>WRP</strong>は、<strong>素点</strong>（通常<strong>5.00</strong>）と<strong>5つの評価要素</strong>（最大<strong>6.00</strong>）の合計です。','<strong>WRP</strong> combines a <strong>base score</strong> (usually <strong>5.00</strong>) with <strong>five evaluation components</strong> (up to <strong>6.00</strong> total).',ja)}</p>
        <p>${str('基本は<strong>10点満点</strong>を目安にしていますが、特に優れたエピソードは最大<strong>11点</strong>まで採点する場合があります。','The usual benchmark is <strong>10 points</strong>, but exceptional episodes may receive up to <strong>11</strong>.',ja)}</p>
        <p>${str('アニメ作品としての基準を満たしていないと判断した場合、<strong>素点を減らす</strong>ことがあります。','The <strong>base score may be reduced</strong> if an episode is judged to fall seriously short of the standards expected of an anime.',ja)}</p>
        <p>${str('評価要素のうち、<strong>総合評価</strong>は<strong>−2.00～＋2.00</strong>の範囲で加減します。','The <strong>Overall Rating</strong> component ranges from <strong>−2.00 to +2.00</strong>.',ja)}</p>
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
