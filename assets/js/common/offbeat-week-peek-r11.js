/* OFFBEAT Current Season: Week Peek R11 — paired editorial titles, serif typography and studio details. Read-only bilingual preview.
   Uses published ranking entries and verified key-visual paths. R1 remains on disk for rollback. */
(() => {
  'use strict';
  const nav = document.querySelector('#anime-top .n-season .n-weeks');
  const dashboard = document.querySelector('#anime-top .n-season .n-season-dashboard');
  if (!nav || !dashboard) return;
  if (dashboard.querySelector('.ob-week-peek')) return;

  const panel = document.createElement('aside');
  panel.className = 'ob-week-peek ob-week-peek-r4 ob-week-peek-r5 ob-week-peek-r6 ob-week-peek-r7 ob-week-peek-r8 ob-week-peek-r9 ob-week-peek-r10 ob-week-peek-r11';
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
  const scheduleClose = () => { clearTimer(); hideTimer = setTimeout(close, 650); };

  function details(a) {
    if (!a || a.tagName !== 'A') return null;
    const target = new URL(a.href, document.baseURI);
    if (target.origin !== base.origin) return null;
    const m = target.pathname.match(/\/ranking\/(\d{4})\/(winter|spring|summer|fall)\/week(\d{2})\/index\.html$/i);
    if (!m) return null;
    return { href: target.href, year: m[1], season: m[2].toLowerCase(), week: m[3] };
  }
  // R93C: preserve the original mobile layout. Desktop placement uses the
  // visible header, viewport and the actual timeline/Week Peek button geometry.
  const desktop = () => matchMedia('(hover: hover) and (pointer: fine) and (min-width: 541px)').matches;
  function pos(link) {
    if(!link?.isConnected || !dashboard.isConnected) return;
    const d=dashboard.getBoundingClientRect(), n=nav.getBoundingClientRect(), r=link.getBoundingClientRect();
    if(!d.width)return;
    if(!desktop()){
      const width=Math.min(550,Math.max(0,d.width-18));
      const wanted=r.left+r.width/2-d.left-width/2;
      panel.style.width=width+'px';panel.style.left=Math.max(9,Math.min(wanted,d.width-width-9))+'px';
      panel.style.top=(n.bottom-d.top+5)+'px';panel.style.removeProperty('max-height');
      return;
    }
    const vw=document.documentElement.clientWidth, vh=window.innerHeight;
    const head=document.querySelector('#greenNav')?.getBoundingClientRect();
    const top=Math.max(10,head&&head.bottom>0&&head.top<vh?head.bottom+12:10);
    const bottom=vh-12, gap=6, minX=12, maxX=vw-12;
    if(bottom<=top)return;
    const scaleX=d.width/(dashboard.offsetWidth||d.width), scaleY=d.height/(dashboard.offsetHeight||d.height||1);
    // R93D: retain the original broad podium; do not squeeze it to fit a side slot.
    const width=Math.min(530*scaleX,d.width-18,maxX-minX);
    const btn=document.querySelector('#obLivePeekToggleR3')?.getBoundingClientRect();
    const clamp=(x,lo,hi)=>Math.max(lo,Math.min(x,Math.max(lo,hi)));
    const center=r.left+r.width/2-width/2;
    panel.style.width=(width/scaleX)+"px";
    const needed=Math.max(180*scaleY,(panel.scrollHeight+panel.offsetHeight-panel.clientHeight)*scaleY);
    const candidates=[];
    function add(x,y,h,w=width,side=false){
      if(w<width-.5||h<75||x<minX-.5||x+w>maxX+.5||y<top-.5||y+h>bottom+.5)return;
      const overlap=btn&&Math.min(x+w,btn.right)>Math.max(x,btn.left)&&Math.min(y+h,btn.bottom)>Math.max(y,btn.top);
      const hScore=Math.min(h,needed);
      const distance=Math.abs(x+w/2-(r.left+r.width/2));
      candidates.push({x,y,h,w,overlap:!!overlap,score:hScore-(overlap?180:0)-distance*.07+(side?0:10)});
    }
    // Above/below the chosen week when space permits; never cover its hit target.
    const x=clamp(center,minX,maxX-width);
    const under=Math.max(top,n.bottom+gap);
    add(x,under,bottom-under);
    const above=Math.min(bottom,n.top-gap);
    add(x,top,above-top);
    // On shallow desktop windows use the available vertical area beside the week.
    // Prefer a right-hand placement that also clears the external Week Peek button.
    const right=Math.max(minX,r.right+gap), left=Math.min(maxX,r.left-gap);
    const wR=Math.min(width,maxX-right), wL=Math.min(width,left-minX);
    add(right,top,bottom-top,wR,true);
    add(left-wL,top,bottom-top,wL,true);
    if(btn){
      const clear=Math.max(right,btn.right+gap);
      add(clear,top,bottom-top,Math.min(width,maxX-clear),true);
    }
    candidates.sort((a,b)=>b.score-a.score);
    const clearCandidates=candidates.filter(c=>!c.overlap&&c.h>=Math.min(360*scaleY,(bottom-top)*.8));
    // Extremely cramped viewports: use the larger of the non-overlapping
    // vertical strips. The panel stays internally scrollable, not under the mast.
    const strip=bottom-under>=above-top?{x,y:under,h:bottom-under,w:width}:{x,y:top,h:above-top,w:width};
    // If neither strip is usable on a narrow laptop, prefer a readable full-width
    // overlay within the visible viewport over a narrow, distorted podium.
    const fallback=strip.h>=Math.min(180*scaleY,bottom-top)?strip:{x,y:top,h:bottom-top,w:width};
    const c=clearCandidates[0]||candidates[0]||fallback;
    panel.style.width=(c.w/scaleX)+'px';panel.style.left=((c.x-d.left)/scaleX-dashboard.clientLeft)+'px';
    panel.style.top=((c.y-d.top)/scaleY-dashboard.clientTop)+'px';
    panel.style.maxHeight=(Math.max(40,c.h)/scaleY)+'px';
  }
  // Only a teaser. Never rewrite the published editorial text.
  const shortIntro = (raw, ja) => {
    const doc = new DOMParser().parseFromString(String(raw || ''), 'text/html');
    const plain = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    const desktopEnglish = !ja && window.matchMedia('(min-width: 541px)').matches;
    const limit = ja ? 85 : (desktopEnglish ? 380 : 145);
    if (plain.length <= limit) return plain;
    const part = plain.slice(0, limit);
    const cut = desktopEnglish ? -1 : (ja ? Math.max(part.lastIndexOf('。'),part.lastIndexOf('！'),part.lastIndexOf('？'))
                   : Math.max(part.lastIndexOf('. '),part.lastIndexOf('! '),part.lastIndexOf('? ')));
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
    img.addEventListener('error', () => { const fig=img.closest('figure'); if(fig) fig.classList.add('ob-week-peek-no-art'); img.remove(); });
    return img;
  };
  const titleFor = (row,ja) => String((ja ? row?.jpTitle || row?.title : row?.title || row?.jpTitle) || '').trim();
  const studioFor = (row,ja) => {
    const studio = String((ja ? row?.studios_ja || row?.studios : row?.studios || row?.studios_ja) || '').trim();
    // Official studio styling is lowercase 'feel.' in both languages.
    return /^feel\.?$/i.test(studio) ? 'feel.' : studio;
  };
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
    const isPrelim = d.week === '00';
    const header=tag('div','ob-week-peek-heading');
    const headText=tag('div');
    headText.append(
      tag('small','',ja
        ? `${d.year}年 ${({'winter':'冬','spring':'春','summer':'夏','fall':'秋'})[d.season]||d.season}アニメ  ·  ${isPrelim?'予選':`第${Number(d.week)}週`}`
        : `${d.year} ${d.season.toUpperCase()}  ·  ${isPrelim?'PRELIM':'WEEK '+d.week}`),
      tag('strong','',ja ? (isPrelim?'予選のトップ3':`今週のトップ3`) : (isPrelim?'Prelim Top 3':"This Week’s Top 3"))
    );
    const meta=tag('div','ob-r93c-snapshot-meta');
    const kind=tag('span','ob-r93c-snapshot-label');
    kind.append(tag('span','ob-r93e-snapshot-prefix',ja?'週間ランキング':'WEEKLY RANKING '),
      tag('span','ob-r93e-snapshot-word',ja?'抜粋':'SNAPSHOT'));
    const topGo=tag('a','ob-r93c-snapshot-top-go',ja?'フルランキングを見る':'VIEW FULL RANKING');
    topGo.href=d.href;meta.append(kind,topGo);
    headText.insertBefore(meta,headText.querySelector('strong'));
    const x=tag('button','ob-week-peek-close','×');
    x.type='button'; x.setAttribute('aria-label',ja?'プレビューを閉じる':'Close preview'); x.addEventListener('click',close);
    header.append(headText,x);
    const content=tag('div','ob-week-peek-content');
    const headlineSub=tag('div','ob-week-peek-editorial-sub',ja?'今週を彩る作品たち':'THE SEASON’S STANDOUTS');
    content.append(headlineSub);
    if(entries.length){
      const stage=tag('section','ob-week-peek-showcase');
      stage.setAttribute('aria-label',ja?'上位3作品':'Top three anime of the week');
      const podium=tag('div','ob-week-peek-podium');
      // 2 – 1 – 3: visual storytelling first; written standings remain below for clarity.
      for(const row of [entries[1],entries[0],entries[2]].filter(Boolean)){
        const place=Number(row.rank);
        const figure=tag('figure',`ob-week-peek-place ob-week-peek-place-${place}`);
        // Work and rank are paired, not sold as badge/sticker. On narrow
        // screens this heading sits above the key visual; on desktop below it.
        const caption=tag('figcaption','ob-week-peek-visual-caption');
        const rank=tag('span','ob-week-peek-visual-rank');
        rank.append(
          (() => { const label=tag('span','ob-week-peek-rank-desktop'); label.append(tag('span','ob-week-peek-rank-prefix','No.'),tag('span','ob-week-peek-rank-digit',String(place))); return label; })(),
          tag('span','ob-week-peek-rank-mobile',String(place).padStart(2,'0'))
        );
        const title=tag('span','ob-week-peek-visual-title',titleFor(row,ja));
        caption.append(rank,title);
        const captionStudio = studioFor(row,ja);
        if (captionStudio) caption.append(tag('small','ob-week-peek-visual-studio',captionStudio));
        caption.title=titleFor(row,ja);
        const art=tag('div','ob-week-peek-art');
        const img=poster(d,row,ja);
        if(img)art.append(img); else figure.classList.add('ob-week-peek-no-art');
        const plinth=tag('span','ob-week-peek-plinth');plinth.setAttribute('aria-hidden','true');
        const card=tag('div','ob-week-peek-visual-card');
        card.append(art,caption);
        figure.append(card,plinth);
        figure.title=titleFor(row,ja);
        podium.append(figure);
      }
      stage.append(podium);
      const ol=tag('ol','ob-week-peek-results');
      for(const row of entries){
        const li=tag('li','ob-week-peek-result');
        li.append(tag('b','ob-week-peek-result-num',String(row.rank).padStart(2,'0')));
        const textBox=tag('div','ob-week-peek-result-text');
        textBox.append(tag('span','ob-week-peek-result-title',titleFor(row,ja)));
        const studio=studioFor(row,ja);
        if(studio)textBox.append(tag('small','ob-week-peek-result-studio',studio));
        li.append(textBox);
        const score=scoreFor(row);
        if(score){
          const points=tag('span','ob-week-peek-result-points');
          points.append(
            tag('strong','ob-week-peek-score-number',score),
            tag('small','ob-week-peek-score-unit',ja?'点':'pt')
          );
          points.title=ja?'総合点':'Total score';
          li.append(points);
        }
        ol.append(li);
      }
      stage.append(ol);content.append(stage);
    }else content.append(tag('p','ob-week-peek-muted',ja?'順位データがありません。':'Ranking entries are unavailable.'));
    const highlight=risingRow(data);
    if(highlight){
      const block=tag('section','ob-week-peek-spotlight');
      const top=tag('div','ob-week-peek-spotlight-top');
      const spotlightTab=tag('span','ob-week-peek-spotlight-tab');
      // Simple vector star; not a system emoji.
      const star=document.createElementNS('http://www.w3.org/2000/svg','svg');
      star.setAttribute('viewBox','0 0 24 24');star.setAttribute('aria-hidden','true');
      star.innerHTML='<path d="M12 1.5 15.1 8.5 22.8 9.3 17 14.5 18.7 22 12 18.1 5.3 22 7 14.5 1.2 9.3 8.9 8.5Z"/>';
      spotlightTab.append(star,document.createTextNode(ja?'今週の注目 · SPOTLIGHT':'SPOTLIGHT · THIS WEEK'));
      top.append(spotlightTab);
      block.append(top);
      const inner=tag('div','ob-week-peek-spotlight-row');
      const img=poster(d,highlight.row,ja);
      if(img){img.classList.add('ob-week-peek-spotlight-poster');inner.append(img);}
      const text=tag('div','ob-week-peek-spotlight-text');
      text.append(tag('span','ob-week-peek-spotlight-name',titleFor(highlight.row,ja)));
      const spotlightStudio=studioFor(highlight.row,ja);
      if(spotlightStudio) text.append(tag('small','ob-week-peek-spotlight-studio',spotlightStudio));
      text.append(tag('span','ob-week-peek-movement',ja?`今週 ${highlight.delta} ランク上昇`:`UP ${highlight.delta} PLACES THIS WEEK`));
      inner.append(text);block.append(inner);content.append(block);
    }
    const original=data?.meta?.weekly_intro;
    const excerpt=shortIntro(typeof original==='string'?original:(original?.[ja?'ja':'en']||original?.en||original?.ja),ja);
    if(excerpt){
      const note=tag('section','ob-week-peek-weeknote');
      const flag=tag('span','ob-week-peek-noteflag',ja?'今週のひと言':'OVERVIEW');
      const quote=tag('p','ob-week-peek-excerpt',excerpt);
      note.append(flag,quote);content.append(note);
    }
    const go=tag('a','ob-week-peek-go');go.href=d.href;
    const goTitle=tag('span','ob-week-peek-go-title',ja?'ランキング全文を見る':'View full ranking');
    const goMeta=tag('span','ob-week-peek-go-meta',ja
      ? (isPrelim?'予選':`第${Number(d.week)}週 / 全12週`)
      : (isPrelim?'PRELIMINARY':`WEEK ${d.week} OF 12`));
    const footer=tag('div','ob-r93c-snapshot-footer');
    const actions=tag('div','ob-r93c-snapshot-actions');
    go.append(goTitle);actions.append(go);footer.append(goMeta,actions);content.append(footer);
    // R93: on touch, a visible action opens the full Week Peek for this same week.
    // W00 PRELIM remains Top 3 only; no unpublished detail is invented.
    if(!isPrelim && document.querySelector('#obLivePeekR1')){
      const detail=tag('button','ob-week-peek-open-detail',ja?`第${Number(d.week)}週のWEEK PEEKを開く`:`OPEN WEEK PEEK · W${d.week}`);
      detail.type='button';
      detail.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        const info={year:d.year,season:d.season,week:Number(d.week)};
        close();document.dispatchEvent(new CustomEvent('offbeat:open-week-peek',{detail:info}));
      });
      actions.classList.add('has-detail');actions.append(detail);
    }
    panel.replaceChildren(header,content);
    panel.setAttribute('lang',ja?'ja':'en');
    panel.scrollTop=0;
    if(opened&&!panel.hidden)pos(opened);
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
    panel.hidden = false;
    pos(link);
    panel.scrollTop=0;
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
  panel.addEventListener('pointerleave', () => {if(desktop())scheduleClose();});
  document.addEventListener('click', e => {
    if (!panel.hidden && !panel.contains(e.target) && !nav.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('offbeat:close-top3-snapshot',close);
  window.addEventListener('resize', () => { if (opened && !panel.hidden) pos(opened); });
  let positionFrame=0;
  window.addEventListener('scroll',()=>{
    if(!desktop()||!opened||panel.hidden||positionFrame)return;
    positionFrame=requestAnimationFrame(()=>{
      positionFrame=0;
      if(opened&&!panel.hidden){
        if(!opened.isConnected){close();return;}
        const r=opened.getBoundingClientRect();
        const mast=document.querySelector('#greenNav')?.getBoundingClientRect();
        if(r.bottom<=Math.max(0,mast?.bottom||0)||r.top>=innerHeight){close();return;}
        pos(opened);
      }
    });
  },{passive:true});
  window.addEventListener('hashchange', close);
})();
