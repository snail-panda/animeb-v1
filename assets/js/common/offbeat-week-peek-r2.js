/* OFFBEAT Current Season: Week Peek R2. Read-only bilingual preview.
   Uses published ranking entries and verified key-visual paths. R1 remains on disk for rollback. */
(() => {
  'use strict';
  const nav = document.querySelector('#anime-top .n-season .n-weeks');
  const dashboard = document.querySelector('#anime-top .n-season .n-season-dashboard');
  if (!nav || !dashboard) return;
  if (dashboard.querySelector('.ob-week-peek')) return;

  const panel = document.createElement('aside');
  panel.className = 'ob-week-peek ob-week-peek-r2';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Weekly ranking preview');
  dashboard.append(panel);

  let opened = null;
  let hideTimer = null;
  let sequence = 0;
  let activeDetails = null, activeData = null;
  const cache = new Map();
  const base = new URL('./', document.baseURI);

  const tag = (name, className, value) => {
    const e = document.createElement(name);
    if (className) e.className = className;
    if (value !== undefined) e.textContent = value;
    return e;
  };
  const clearTimer = () => { if (hideTimer !== null) clearTimeout(hideTimer); hideTimer = null; };
  const close = () => {
    clearTimer();
    panel.hidden = true;
    opened = null;
    activeDetails = null; activeData = null;
    nav.querySelectorAll('.ob-week-peek-active').forEach(e => e.classList.remove('ob-week-peek-active'));
  };
  const scheduleClose = () => { clearTimer(); hideTimer = setTimeout(close, 360); };

  function details(a) {
    if (!a || a.tagName !== 'A') return null;
    const target = new URL(a.href, document.baseURI);
    if (target.origin !== base.origin) return null;
    const m = target.pathname.match(/\/ranking\/(\d{4})\/(winter|spring|summer|fall)\/week(\d{2})\/index\.html$/i);
    if (!m) return null;
    return { href: target.href, year: m[1], season: m[2].toLowerCase(), week: m[3] };
  }
  function pos(link) {
    const d = dashboard.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    const width = Math.min(440, Math.max(0, d.width - 24));
    const wanted = r.left + r.width / 2 - d.left - width / 2;
    const left = Math.max(12, Math.min(wanted, d.width - width - 12));
    panel.style.width = width + 'px';
    panel.style.left = left + 'px';
    panel.style.top = (n.bottom - d.top + 5) + 'px';
  }
  // Only a teaser. Never rewrite the published editorial text.
  const shortIntro = (raw, ja) => {
    const doc = new DOMParser().parseFromString(String(raw || ''), 'text/html');
    const plain = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    const limit = ja ? 115 : 180;
    if (plain.length <= limit) return plain;
    const part = plain.slice(0, limit);
    const cut = ja ? Math.max(part.lastIndexOf('。'),part.lastIndexOf('！'),part.lastIndexOf('？'))
                   : Math.max(part.lastIndexOf('. '),part.lastIndexOf('! '),part.lastIndexOf('? '));
    return (cut > limit * .52 ? part.slice(0, cut + 1) : part.trim()).trim() + '…';
  };
  const imageFor = (d, row) => {
    const kv = String(row?.kv || '').trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(kv)) return '';
    return new URL(`images/key-visuals/${d.year}/${d.season}/${kv}.webp`, base).href;
  };
  const poster = (d,row,ja) => {
    const src = imageFor(d,row);
    if (!src) return null;
    const img = tag('img','ob-week-peek-poster');
    img.src = src; img.loading = 'lazy'; img.decoding = 'async';
    img.alt = ja ? (row.jpTitle || row.title || '') : (row.title || row.jpTitle || '');
    img.addEventListener('error', () => { const li=img.closest('li'); img.remove(); if(li)li.classList.add('ob-week-peek-no-image'); });
    return img;
  };
  const titleFor = (row,ja) => String((ja ? row?.jpTitle || row?.title : row?.title || row?.jpTitle) || '').trim();
  const studioFor = (row,ja) => String((ja ? row?.studios_ja || row?.studios : row?.studios || row?.studios_ja) || '').trim();
  const scoreFor = row => {
    if (row?.score === null || row?.score === undefined || row?.score === '') return '';
    const value = Number(row.score);
    return Number.isFinite(value) ? String(value) : '';
  };
  // Automatic movement callout, *not* an editor's manually chosen Spotlight.
  function risingRow(data) {
    const ranks = data?.meta?.weekly_ranking_reference?.entries;
    if (!Array.isArray(ranks) || !Array.isArray(data?.entries)) return null;
    const found = ranks.filter(x => Number(x.rank)>3 && Number(x.prev_rank)>0 && Number(x.prev_rank)-Number(x.rank)>=3)
                       .sort((a,b) => (Number(b.prev_rank)-Number(b.rank))-(Number(a.prev_rank)-Number(a.rank)))[0];
    if (!found) return null;
    const full = data.entries.find(e => String(e.kv||'') === String(found.kv||'') && e.kv)
               || data.entries.find(e => String(e.title||'') === String(found.title||''));
    return {row: full || found, delta: Number(found.prev_rank) - Number(found.rank)};
  }
  // The bilingual mast control shares the exact preference used by Weekly Ranking.
  function ensureLanguageControl(){
    if (document.querySelector('.ob-week-peek-language')) return;
    const mast = document.querySelector('.site > .global');
    if (!mast) return;
    const controls = tag('div','ob-week-peek-language');
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label','Anime page language / 表示言語');
    [['en','EN'],['ja','日本語']].forEach(([code,label]) => {
      const btn = tag('button','',label);
      btn.type='button'; btn.dataset.peekLang=code;
      btn.addEventListener('click',(e) => {
        e.stopPropagation();
        try { localStorage.setItem('animeb-weekly-lang',code); } catch(_) {}
        refreshLang();
        if (opened && activeDetails && activeData && !panel.hidden) showBody(activeDetails,activeData);
      });
      controls.append(btn);
    });
    mast.append(controls);
    refreshLang();
  }
  function refreshLang(){
    const current = language();
    document.querySelectorAll('.ob-week-peek-language button').forEach(btn => {
      const on = btn.dataset.peekLang === current;
      btn.classList.toggle('selected',on);
      btn.setAttribute('aria-pressed',String(on));
    });
  }
  ensureLanguageControl();
  function language(data) {
    try { if (localStorage.getItem('animeb-weekly-lang') === 'ja') return 'ja'; } catch (_) {}
    return 'en';
  }
  async function fetchWeek(d) {
    const key = `${d.year}/${d.season}/${d.week}`;
    if (!cache.has(key)) {
      const path = `ranking/${d.year}/${d.season}/week${d.week}/ranking-week${d.week}-${d.season}${d.year}.json`;
      const req = fetch(new URL(path, base)).then(r => {
        if (!r.ok) throw Error('Ranking source returned ' + r.status);
        return r.json();
      }).catch(err => { cache.delete(key); throw err; });
      cache.set(key, req);
    }
    return cache.get(key);
  }
  function showBody(d,data) {
    activeDetails=d; activeData=data;
    const ja=language(data)==='ja';
    const entries=Array.isArray(data?.entries)
      ? data.entries.filter(x => Number.isInteger(Number(x.rank)) && Number(x.rank)>0 && (x.title||x.jpTitle))
          .sort((a,b)=> Number(a.rank)-Number(b.rank)).slice(0,3)
      : [];
    const header=tag('div','ob-week-peek-heading');
    const headText=tag('div');
    headText.append(tag('small','',`${d.year} ${d.season.toUpperCase()} / ${d.week==='00'?'PRELIM':'WEEK '+d.week}`),
      tag('strong','',d.week==='00'?(ja?'予選ランキング':'PRELIMINARY ROUND'):(ja?`第${Number(d.week)}週`:`WEEK ${d.week}`)));
    const x=tag('button','ob-week-peek-close','×');
    x.type='button';x.setAttribute('aria-label','Close preview / 閉じる');x.addEventListener('click',close);
    header.append(headText,x);
    const content=tag('div','ob-week-peek-content');
    content.append(tag('small','ob-week-peek-label',ja?'上位3作品':'TOP 3'));
    if(entries.length){
      const ol=tag('ol','ob-week-peek-top');
      for(const row of entries){
        const li=tag('li','ob-week-peek-rank');
        const rank=tag('b','ob-week-peek-number',String(row.rank).padStart(2,'0'));
        li.append(rank);
        const img=poster(d,row,ja);if(img)li.append(img);else li.classList.add('ob-week-peek-no-image');
        const texts=tag('div','ob-week-peek-rank-text');
        texts.append(tag('span','ob-week-peek-title',titleFor(row,ja)));
        const studio=studioFor(row,ja);
        if(studio)texts.append(tag('small','ob-week-peek-studio',studio));
        li.append(texts);
        const score=scoreFor(row);
        if(score){
          const badge=tag('div','ob-week-peek-score');
          badge.append(tag('b','',score),tag('small','',ja?'総合点':'SCORE'));
          badge.title=ja?'総合スコア':'Total score';
          li.append(badge);
        }
        ol.append(li);
      }
      content.append(ol);
    }else content.append(tag('p','ob-week-peek-muted',ja?'順位データがありません。':'Ranking entries are unavailable.'));
    const highlight=risingRow(data);
    if(highlight){
      const block=tag('section','ob-week-peek-rising');
      block.append(tag('small','ob-week-peek-label',ja?`SPOTLIGHT · 上昇幅 +${highlight.delta}`:`SPOTLIGHT · BIGGEST RISE +${highlight.delta}`));
      const inner=tag('div','ob-week-peek-rising-item');
      const pic=poster(d,highlight.row,ja);if(pic)inner.append(pic);
      const words=tag('div','ob-week-peek-rising-words');
      words.append(tag('strong','',titleFor(highlight.row,ja)));
      const studio=studioFor(highlight.row,ja);if(studio)words.append(tag('small','',studio));
      inner.append(words);block.append(inner);content.append(block);
    }
    const original=data?.meta?.weekly_intro;
    const excerpt=shortIntro(typeof original==='string'?original:(original?.[ja?'ja':'en']||original?.en||original?.ja),ja);
    if(excerpt){
      content.append(tag('small','ob-week-peek-label ob-week-peek-intro-label',ja?'この週のひと言':'THIS WEEK'));
      content.append(tag('p','ob-week-peek-excerpt',excerpt));
    }
    const go=tag('a','ob-week-peek-go');go.href=d.href;
    go.append(tag('span','',ja?'ランキング全文を見る':'VIEW FULL RANKING'));
    const mark=tag('span','ob-week-peek-go-mark');
    mark.setAttribute('aria-hidden','true');
    mark.innerHTML='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';
    go.append(mark);content.append(go);
    panel.replaceChildren(header,content);
    panel.setAttribute('lang',ja?'ja':'en');
    refreshLang();
  }
  async function openFor(link) {
    const d = details(link);
    if (!d) return;
    clearTimer();
    sequence += 1;
    const ownSequence = sequence;
    opened = link;
    nav.querySelectorAll('.ob-week-peek-active').forEach(e => e.classList.remove('ob-week-peek-active'));
    link.classList.add('ob-week-peek-active');
    pos(link);
    panel.hidden = false;
    const label = d.week === '00' ? 'PRELIM' : 'WEEK ' + d.week;
    panel.replaceChildren(tag('p', 'ob-week-peek-loading', 'Loading ' + label + '…'));
    try {
      const data = await fetchWeek(d);
      if (ownSequence !== sequence || opened !== link) return;
      showBody(d, data);
    } catch (err) {
      if (ownSequence !== sequence || opened !== link) return;
      panel.replaceChildren(tag('p', 'ob-week-peek-loading', 'Preview unavailable for this week.'));
    }
  }
  nav.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link || !nav.contains(link) || !details(link)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    openFor(link);
  });
  nav.addEventListener('pointerover', e => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const link = e.target.closest('a');
    if (link && nav.contains(link) && !link.contains(e.relatedTarget) && details(link)) openFor(link);
  });
  nav.addEventListener('pointerout', e => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const link = e.target.closest('a');
    if (link && !link.contains(e.relatedTarget) && !panel.contains(e.relatedTarget)) scheduleClose();
  });
  panel.addEventListener('pointerenter', clearTimer);
  panel.addEventListener('pointerleave', scheduleClose);
  document.addEventListener('click', e => {
    if (!panel.hidden && !panel.contains(e.target) && !nav.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (opened && !panel.hidden) pos(opened); });
  window.addEventListener('hashchange', close);
})();
