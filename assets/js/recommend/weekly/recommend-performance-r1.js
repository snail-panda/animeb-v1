/* OFFBEAT Recommendations & Enjoyment — Season Performance R3 (R2 visual refinement).
   Read-only and edition-scoped. Existing More Details and ranking data stay untouched. */
(() => {
  'use strict';
  if (!/\/features\/recommend\/\d{4}\/(winter|spring|summer|fall)\/week\d{2}\//i.test(location.pathname)) return;
  const match = location.pathname.match(/\/features\/recommend\/(\d{4})\/(winter|spring|summer|fall)\/week(\d{2})\//i);
  const [, year, season, weekText] = match;
  const lastWeek = Number(weekText);
  const ja = /^ja/i.test(document.documentElement.lang || '');
  const t = (en, jp) => ja ? jp : en;
  const root = '/animeb-v1/';
  const base = `${root}features/recommend/${year}/${season}/week${weekText}/`;
  const fmtWeek = w => String(w).padStart(2, '0');
  const norm = v => String(v ?? '').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
  const num = n => typeof n === 'number' && Number.isFinite(n);
  const create = (tag, cls = '', value) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value !== undefined) el.textContent = value;
    return el;
  };
  const requestJSON = async url => {
    const response = await fetch(url, {cache:'no-store'});
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    return response.json();
  };
  const selectedEditions = [1,6,12].filter(w => w <= lastWeek);
  let dataPromise = null, dialog = null, content = null, priorFocus = null, requestID = 0;

  const identity = entry => ({
    kv: String(entry.kv || '').trim(),
    title: String(entry.title || '').trim(),
    jpTitle: String(entry.jpTitle || '').trim(),
  });
  function sameTitle(a, b) {return !!a && !!b && norm(a) === norm(b);}
  function sameItem(a, b) {
    if (a.kv && b.kv && a.kv === b.kv) return true;
    if (a.kv && b.kv && a.kv !== b.kv) return false;
    return sameTitle(a.title,b.title) || sameTitle(a.jpTitle,b.jpTitle);
  }
  function tierFor(json, title) {
    if (!json) return null;
    const candidates = [];
    for (const [tier, entries] of Object.entries(json.tierEntries || {})) {
      if (!Array.isArray(entries)) continue;
      entries.forEach((row, index) => {
        if (sameItem(identity({kv:row.imageId,title:row.title,jpTitle:row.jpTitle}), title))
          candidates.push({tier, position:num(row.position) ? row.position : index+1});
      });
    }
    if (!candidates.length) {
      for (const [tier, titles] of Object.entries(json.tiers || {})) {
        if (!Array.isArray(titles)) continue;
        titles.forEach((name,index) => {if (sameTitle(name,title.title)) candidates.push({tier,position:index+1});});
      }
    }
    return candidates.length === 1 ? candidates[0] : null;
  }
  async function loadSeason() {
    const [rec, enjoyment, index, editions, engine] = await Promise.all([
      requestJSON(`${base}recommend-${year}-${season}-week${weekText}.json`),
      requestJSON(`${base}enjoyment-ranking-${year}-${season}-week${weekText}.json`),
      requestJSON(`${root}weekly-rankings.json`),
      Promise.all(selectedEditions.map(async w => {
        try {return [w, await requestJSON(`${root}tierlist/${year}/${season}/week${fmtWeek(w)}/tierlist-${year}-${season}-week${fmtWeek(w)}.json`)];}
        catch(err) {console.warn('[Season Performance] Tier edition unavailable', w, err);return [w,null];}
      })),
      (async()=>{
        if (window.OFFBEAT_LINEUP_DATA_R52) return window.OFFBEAT_LINEUP_DATA_R52;
        await new Promise((resolve,reject) => {
          const s = create('script');s.src=`${root}assets/js/common/offbeat-lineup-data-r52.js`;
          s.onload=resolve;s.onerror=()=>reject(new Error('Season performance data engine could not load'));
          document.head.append(s);
        });
        return window.OFFBEAT_LINEUP_DATA_R52;
      })()
    ]);
    if (!engine || typeof engine.compileSeason !== 'function') throw new Error('Season performance data engine unavailable');
    const all = [];
    for (const e of [...(rec.entries || []),...(enjoyment.enjoymentRanking || [])]) {
      if (e && e.title) all.push(identity(e));
    }
    for (const [,json] of editions) for (const list of Object.values(json?.tierEntries || {})) {
      if (!Array.isArray(list)) continue;
      for (const e of list) if (e?.title) all.push(identity({kv:e.imageId,title:e.title,jpTitle:e.jpTitle}));
    }
    const unique = new Map();
    for (const e of all) if (e.kv && !unique.has(e.kv)) unique.set(e.kv,e);
    const list = index?.[year]?.[season[0].toUpperCase()+season.slice(1)]?.weeks || [];
    const weeks = [...new Set(list.map(v => Number(String(v).match(/\d{1,2}/)?.[0])))].filter(w=>w>=1&&w<=lastWeek).sort((a,b)=>a-b);
    const fetched = await Promise.all(weeks.map(async w => {
      try {return [w, await requestJSON(root+engine.pathFor(year,season,w))];}
      catch(err) {console.warn('[Season Performance] Weekly ranking unavailable',w,err);return [w,null];}
    }));
    const available = Object.fromEntries(fetched.filter(([,data])=>data&&Array.isArray(data.entries)));
    const compiled = engine.compileSeason({seasonYear:Number(year),season,items:[...unique.values()]},available);
    return {rec,enjoyment,editions,compiled,missing:fetched.filter(([,v])=>!v).map(([w])=>w)};
  }
  const getData = () => dataPromise ||= loadSeason().catch(err => {dataPromise=null;throw err;});

  function findSource(data, card) {
    const title = norm(card.querySelector('.title-en')?.textContent || '');
    const kv = card.querySelector('img.animeb-kv')?.getAttribute('src')?.match(/\/([^/?#]+)\.(?:webp|png|jpe?g)(?:\?|$)/i)?.[1] || '';
    const candidates = [...(data.rec.entries||[]),...(data.enjoyment.enjoymentRanking||[])];
    const byKv = kv ? candidates.filter(e => String(e.kv||'')===decodeURIComponent(kv)) : [];
    // An image ID is authoritative when unique. Otherwise use the rendered EN/JA title.
    if (byKv.length) return identity(byKv[0]);
    const byTitle = candidates.filter(e => [e.title,e.jpTitle].some(name=>norm(name)===title));
    return byTitle.length ? identity(byTitle[0]) : null;
  }

  function createModal() {
    if (dialog) return;
    dialog = create('dialog','ob-rp-dialog');
    dialog.setAttribute('aria-label', t('Season Performance','シーズン成績'));
    const top = create('div','ob-rp-toolbar');
    top.append(create('span','ob-rp-kicker',t('SEASON PERFORMANCE','シーズン成績')));
    const close = create('button','ob-rp-close',t('Close ×','閉じる ×'));
    close.type='button';close.addEventListener('click',()=>dialog.close());top.append(close);
    content = create('div','ob-rp-content');
    dialog.append(top, content);
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>{requestID++;priorFocus?.focus?.({preventScroll:true});});
    document.body.append(dialog);
  }
  function infoRow(label, value, unit = '') {
    const row = create('div', 'ob-rp-metric');
    const figure = create('strong', 'ob-rp-metric-value', value);
    if (unit) figure.append(create('span', 'ob-rp-unit', unit));
    row.append(create('small', '', label), figure);
    return row;
  }
  function tierCard(week, tierInfo) {
    const tier = String(tierInfo?.tier || '').trim();
    const rated = /^(?:S{1,3}|[ABCD])$/i.test(tier);
    const kind = rated ? tier.toLowerCase() : /^(?:not yet aired|not aired yet|nya)$/i.test(tier) ? 'not-aired'
      : /^dropped$/i.test(tier) ? 'dropped' : 'neutral';
    const card = create('div', `ob-rp-tier-card ob-rp-tier-${kind}`);
    const meta = create('div', 'ob-rp-tier-meta');
    const stage = week === 1 ? t('FIRST IMPRESSION', '初回評価')
      : week === 6 ? t('MID-SEASON', '中間評価')
      : week === 12 ? t('SEASON FINALE', '最終評価') : t('CHECKPOINT', '評価時点');
    meta.append(create('span', 'ob-rp-tier-stage', stage), create('span', 'ob-rp-tier-week', `W${fmtWeek(week)}`));
    card.append(meta);
    const result = create('div', 'ob-rp-tier-result');
    if (!tierInfo) {
      result.append(create('span', 'ob-rp-tier-status', '—'));
    } else {
      const mark = create('div', 'ob-rp-tier-mark');
      const displayed = ja ? ({'not yet aired':'放送待ち','not aired yet':'放送待ち',dropped:'対象外'}[tier.toLowerCase()] || tier) : tier;
      mark.append(create('strong', rated ? 'ob-rp-tier-letter' : 'ob-rp-tier-status', displayed));
      if (rated) mark.append(create('span', 'ob-rp-tier-kind', t('Tier', 'ティア')));
      result.append(mark);
      if (num(tierInfo.position) && tierInfo.position > 0) {
        const pos = create('span', 'ob-rp-tier-position');
        pos.append(create('b', '', `#${tierInfo.position}`), create('small', '', rated ? t('in tier', 'ティア内') : t('in group', '区分内')));
        result.append(pos);
      }
    }
    card.append(result);
    return card;
  }
  function addSection(parent, en, jp) {const sec=create('section','ob-rp-section');sec.append(create('h3','',t(en,jp)));parent.append(sec);return sec;}
  function rankStatus(r) {
    if (r.rank != null) return t('Ranked','評価対象');
    const broadcast=r.broadcast?.status;
    if (broadcast==='no_air')return t('No Air','放送休止');
    if (broadcast==='season_halted')return t('Season Halted','今期放送中断');
    if (r.dropDecidedThisWeek) return t('Dropped this week','今週対象外決定');
    if (r.droppedAfterWeek!=null && r.droppedAfterWeek<=r.week) return t('Dropped','対象外');
    if (r.rankingState==='unknown') return t('Data incomplete','データ不足');
    return t('Not Ranked','順位なし');
  }
  function svgChart(records, field, caption, isRank) {
    const good = records.filter(r=>r.rank!=null && num(r[field]));
    if (!good.length) return null;
    const fig=create('figure','ob-rp-chart');fig.append(create('figcaption','',caption));
    const NS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 330 120');svg.setAttribute('role','img');
    svg.setAttribute('aria-label',caption+t(' (values also shown in the table)','（数値は表にも掲載）'));
    const put=(tag,attrs,txt)=>{const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));if(txt!=null)node.textContent=txt;svg.append(node);};
    const max=isRank?Math.max(2,...records.map(r=>r.participantCount||r.rank||0)):Math.max(10,Math.ceil(Math.max(...good.map(r=>r[field]))));
    const left=30,right=318,top=12,bottom=95;
    const xx=w=>left+(w-1)/Math.max(1,lastWeek-1)*(right-left);
    const yy=v=>isRank?top+(v-1)/Math.max(1,max-1)*(bottom-top):bottom-v/max*(bottom-top);
    for(const tick of (isRank?[1,Math.round((max+1)/2),max]:[0,max/2,max])) {
      put('line',{x1:left,y1:yy(tick),x2:right,y2:yy(tick),class:'ob-rp-grid'});
      put('text',{x:left-5,y:yy(tick)+3,'text-anchor':'end'},Number.isInteger(tick)?tick:tick.toFixed(1));
    }
    let prev=null;
    for(let w=1;w<=lastWeek;w++){
      const rec=records.find(r=>r.week===w);const x=xx(w);
      put('text',{x,y:112,'text-anchor':'middle'},fmtWeek(w));
      if(!rec || rec.rank==null || !num(rec[field])){prev=null;continue;}
      const y=yy(rec[field]);
      if(prev)put('line',{x1:prev[0],y1:prev[1],x2:x,y2:y,class:'ob-rp-line'});
      put('circle',{cx:x,cy:y,r:2.9,class:'ob-rp-dot'});
      prev=[x,y];
    }
    fig.append(svg);return fig;
  }
  function draw(data, entry, targetImg) {
    content.replaceChildren();
    const heading=create('div','ob-rp-heading');
    const img=create('img','ob-rp-thumbnail');
    img.src=targetImg.currentSrc||targetImg.src; img.alt='';img.decoding='async';
    img.addEventListener('error',()=>img.remove());
    const title=ja?(entry.jpTitle||entry.title):entry.title;
    const names=create('div','ob-rp-names');names.append(create('h2','',title));
    const alt=ja?entry.title:entry.jpTitle;
    if(alt && alt!==title)names.append(create('small','',alt));
    heading.append(img,names);content.append(heading);

    const tiers=addSection(content,'Tier History','Tierの変遷');
    const tierGrid=create('div','ob-rp-tier-grid');
    for(const [w,json] of data.editions){
      if (!json) continue;
      const row=tierFor(json,entry);
      // An absent title is not interpreted as Dropped or N/A.
      tierGrid.append(tierCard(w, row));
    }
    if(tierGrid.childElementCount)tiers.append(tierGrid);
    else tiers.append(create('p','ob-rp-muted',t('Tier history is unavailable.','Tier履歴を取得できません。')));

    const perf=addSection(content,'Weekly Ranking Performance','週間ランキング成績');
    const history=data.compiled?.histories?.[entry.kv] || Object.values(data.compiled?.histories||{}).find(h=>sameTitle(h.title,entry.title));
    const records=(history?.weeks || []).filter(r=>r.week<=lastWeek).sort((a,b)=>a.week-b.week);
    const rated=records.filter(r=>r.rank!=null);
    if(rated.length){
      const summary=create('div','ob-rp-summary');
      const best=Math.min(...rated.map(r=>r.rank));
      const scores=rated.map(r=>r.wrp_score).filter(num);
      summary.append(
        infoRow(t('Rated weeks','評価週数'), String(rated.length), t('weeks','週')),
        infoRow(t('Best rank','最高順位'), `#${best}`, t('', '位'))
      );
      if(scores.length)summary.append(infoRow(t('Average weekly WRP','週間WRP平均'),
        (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2), t('pts','点')));
      perf.append(summary);
      const charts=create('div','ob-rp-charts');
      for(const chart of [svgChart(records,'wrp_score',t('Weekly WRP','週間WRP'),false),svgChart(records,'rank',t('Weekly rank','週間順位'),true)]) if(chart)charts.append(chart);
      if(charts.childElementCount)perf.append(charts);
    }
    if(!records.length){perf.append(create('p','ob-rp-muted',t('No verified weekly ranking data available.','確認済みの週間ランキングデータがありません。')));return;}
    const table=create('table','ob-rp-table');
    const thead=create('thead'),hrow=create('tr');
    for(const label of [t('Week','週'),t('Rank / field','順位 / 評価数'),'WRP',t('Status','状態')]){const th=create('th','',label);th.scope='col';hrow.append(th);}thead.append(hrow);table.append(thead);
    const tbody=create('tbody');
    for(const r of records){
      const tr=create('tr'),link=create('a','',`W${fmtWeek(r.week)}`);
      link.href=`${root}ranking/${year}/${season}/week${fmtWeek(r.week)}/index.html${r.dropDecidedThisWeek?'#animeb-dropped-titles':''}`;
      const weekCell=create('td');weekCell.append(link);tr.append(weekCell);
      tr.append(create('td','ob-rp-rank',r.rank==null?'—':`#${r.rank}${r.participantCount?' / '+r.participantCount:''}`));
      tr.append(create('td','',num(r.wrp_score)?r.wrp_score.toFixed(2):'—'));
      tr.append(create('td',r.rank != null ? 'ob-rp-status-normal' : 'ob-rp-status-special',rankStatus(r)));
      tbody.append(tr);
    }
    table.append(tbody);const tableWrap=create('div','ob-rp-table-wrap');tableWrap.append(table);perf.append(tableWrap);
    perf.append(create('p','ob-rp-muted',t('Select a week to open its Weekly Ranking and reviews. Missing results are not treated as zero.','週を選ぶと、その週のランキングとレビューに移動します。未評価は0点として扱いません。')));
    if(data.missing.length)perf.append(create('p','ob-rp-muted',t('Some weekly files could not be loaded.','一部の週間ファイルを読み込めませんでした。')));
  }

  async function open(card,img) {
    createModal();priorFocus=img;
    const id=++requestID;
    content.replaceChildren(create('p','ob-rp-muted',t('Loading season performance…','シーズン成績を読み込み中…')));
    if(!dialog.open)dialog.showModal();
    dialog.querySelector('.ob-rp-close').focus();
    try {
      const data=await getData();
      if(id!==requestID||!dialog.open)return;
      const entry=findSource(data,card);
      if (!entry){content.replaceChildren(create('p','ob-rp-muted',t('This title could not be matched to the season data.','作品とシーズンデータを照合できませんでした。')));return;}
      draw(data,entry,img);
    }catch(err){
      if(id!==requestID||!dialog.open)return;
      console.warn('[Season Performance]',err);
      content.replaceChildren(create('p','ob-rp-muted',t('Season data could not be loaded. Please try again.','シーズンデータを読み込めません。もう一度お試しください。')));
    }
  }
  function bindImages(){
    document.querySelectorAll('.animeb-info-card img.animeb-kv, .animeb-enjoyment-card img.animeb-kv').forEach(img=>{
      if(img.dataset.obRpBound)return;
      img.dataset.obRpBound='1';img.tabIndex=0;img.setAttribute('role','button');
      img.setAttribute('aria-label',t('Show Season Performance: ','シーズン成績を表示: ')+(img.alt||''));
    });
  }
  document.addEventListener('click',event=>{
    const img=event.target.closest?.('.animeb-info-card img.animeb-kv, .animeb-enjoyment-card img.animeb-kv');
    if(img){event.preventDefault();open(img.closest('.animeb-info-card,.animeb-enjoyment-card'),img);}
  });
  document.addEventListener('keydown',event=>{
    const img=event.target.closest?.('.animeb-info-card img.animeb-kv, .animeb-enjoyment-card img.animeb-kv');
    if(img&&(event.key==='Enter'||event.key===' ')){event.preventDefault();open(img.closest('.animeb-info-card,.animeb-enjoyment-card'),img);}
  });
  function init(){bindImages();new MutationObserver(bindImages).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
