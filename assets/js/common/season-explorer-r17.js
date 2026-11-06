/* OFFBEAT R17 — historical-season enrichment and Archive WEEK facet.
 * A read-only enhancement to R16, not a replacement for the live current-season dashboard.
 * Published rankings are evidence of appearances, NOT proof of the original season pool.
 */
(() => {
  'use strict';
  const base = new URL('./', document.baseURI);
  const capitalize = text => text.slice(0,1).toUpperCase() + text.slice(1);
  const pad = n => String(n).padStart(2,'0');
  const make = (tag, cls, value) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (value !== undefined) n.textContent = String(value);
    return n;
  };
  const labels = {
    en:{snapshot:'SEASON SNAPSHOT', intro:'Browse the published weekly record. The opening pool may differ from the titles that appear in rankings.',
      checkpoints:'SEASON CHECKPOINTS', first:'First Impressions', middle:'Midseason', final:'Final',
      master:'SEASON LINEUP', masterNote:'Opening pool explicitly defined in the season file.',
      recorded:'TITLES APPEARING IN WEEKLY RANKINGS', recordedNote:'A reconstructed list of titles appearing in published weekly ranking entries. It is NOT a verified opening lineup; shows that never ranked may be absent.',
      preliminary:'ELIMINATED IN PRELIM', prelimNote:'Explicitly marked eliminated in the Preliminary Round record. These are not part of the opening main-season lineup.',
      preload:'Explore titles recorded this season', loading:'Reading published weekly records…',
      failed:'Some weekly records could not be read; this list is incomplete.', noEntries:'No usable title data was found in these published records.',
      details:'Title details', close:'Close', seen:'First ranked', noMaster:'An editorial season master has not been added yet. Weekly records remain available.',
      generic:'Each season begins with the selection process and unfolds through its weekly rankings. Historic season statistics may follow older counting rules.',
      notInitial:'A verified opening lineup has not been supplied; these are the titles recorded in the available master.',
      fromMaster:'Recorded in the season master', description:'ABOUT THE SEASON', titles:'titles',
      artMissing:'Poster unavailable'},
    ja:{snapshot:'シーズンの記録',intro:'公開済みの週間ランキングを辿れます。本戦開始時の顔ぶれと、週別ランキングに登場した作品は必ずしも一致しません。',
      checkpoints:'シーズンのチェックポイント',first:'ファーストインプレッション',middle:'ミッドシーズン',final:'シーズンファイナル',
      master:'本戦開始時のラインナップ',masterNote:'シーズン用ファイルに指定された本戦開始時の作品一覧です。',
      recorded:'週間ランキングに登場した作品',recordedNote:'公開済みの各週のランキングに登場した作品から復元しています。正確な初期ラインナップではなく、一度もランクインしなかった作品は含まれない場合があります。',
      preliminary:'予選ラウンドで選考外となった作品',prelimNote:'Prelimのデータに選考外と明記された作品です。本戦の初期ラインナップには含めていません。',
      preload:'週間記録から作品一覧を表示',loading:'公開済みの週間記録を読み込み中…',
      failed:'取得できなかった週があります。作品一覧は不完全です。', noEntries:'公開済みの記録から作品一覧を復元できませんでした。',
      details:'作品情報',close:'閉じる',seen:'最初に登場した週',noMaster:'このシーズンの編集用マスターはまだ登録されていません。週間ランキングは閲覧できます。',
      generic:'各シーズンは作品の選考から始まり、毎週のランキングを重ねて進みます。過去シーズンの視聴状況には、現在と異なる集計方法が使われている場合があります。',
      notInitial:'初期ラインナップの確定情報がないため、マスターに記録された作品として表示しています。',
      fromMaster:'作品マスターの登録作品',description:'シーズンの進み方',titles:'作品',
      artMissing:'画像なし'}
  };
  const locale = () => { try{return localStorage.getItem('animeb-weekly-lang')==='ja'?'ja':'en';}catch{return 'en';}};
  const statusOf = entry => String(entry?.finalDecision ?? entry?.final_decision ?? entry?.fields?.final_decision ?? entry?.fields?.finalDecision ?? '').trim().toUpperCase();
  const titleOf = e => String(e?.title ?? e?.info?.title ?? e?.fields?.title ?? '').trim();
  const jpOf = e => String(e?.jpTitle ?? e?.info?.jpTitle ?? e?.fields?.jp_title ?? '').trim();
  const kvOf = e => String(e?.kv ?? e?.id ?? e?.info?.image_id ?? e?.fields?.id ?? '').trim();
  const normalize = s => String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
  const imageOf = (season,entry) => {
    const kv=kvOf(entry);
    return /^[\w-]+$/.test(kv) ? new URL(`images/key-visuals/${season.year}/${season.season}/${kv}.webp`,base).href : '';
  };
  const masterCache=new Map();
  const fetchJSON=async path => {
    const response = await fetch(new URL(path,base));
    if (!response.ok) return null;
    return response.json();
  };
  async function masterFor(season){
    const key=`${season.year}-${season.season}`;
    if (!masterCache.has(key)){
      masterCache.set(key,(async()=>{
        for (const path of [
          `assets/data/offbeat-season-${key}.json`,
          `assets/data/anime-master-${key}.json`,
          `assets/data/ranking/weekly/anime-master-${key}.json`
        ]){
          try {
            const d=await fetchJSON(path);
            if(d && (Array.isArray(d.items)||Array.isArray(d.entries)))return d;
          }catch(_){}
        }
        return null;
      })());
    }
    return masterCache.get(key);
  }
  // Resolve a season file without relying on inaccurate legacy Watching/Total counters.
  function masterItems(data){
    const src = Array.isArray(data.items) ? data.items : (Array.isArray(data.entries) ? data.entries : []);
    let slots;
    if(Array.isArray(data.mainSeason)){
      const selected=new Set(data.mainSeason.map(normalize));
      slots=src.filter(e => selected.has(normalize(titleOf(e))) || selected.has(normalize(kvOf(e))));
      return {items:slots,verified:true,excluded:[]};
    }
    const count=Number(data.initialSeasonPool ?? data.meta?.initialSeasonPool);
    const hasCount=Number.isInteger(count)&&count>0&&count<=34;
    const decisions=src.slice(0,34).some(e => statusOf(e)!=='');
    if(decisions){
      slots=src.slice(0,34);
      const eligible=slots.filter(e=>statusOf(e)!=='NA' && e.mainSeason!==false && e.isMainSeason!==false);
      return {items:eligible,verified:hasCount && eligible.length===count,excluded:slots.filter(e=>statusOf(e)==='NA')};
    }
    if(hasCount){return {items:src.slice(0,count),verified:true,excluded:[]};}
    // An All Reference Data master may contain many nonparticipants; never call it Initial Pool.
    return {items:src.length<=34?src:[],verified:false,excluded:[]};
  }
  function firstAppearance(season,n){return new URL(`ranking/${season.year}/${season.season}/week${pad(n)}/index.html`,base).href;}
  const weeksCache=new Map();
  async function fromWeekly(season,update){
    const key=`${season.year}-${season.season}`;
    if (!weeksCache.has(key)) {
      weeksCache.set(key,(async()=>{
        const nums=[...season.weeks].sort((a,b)=>a-b);
        const union=new Map(),eliminated=new Map();
        let unavailable=0;let cursor=0;
        // Limit concurrency to three for iPhone; do not fetch the whole season until requested.
        async function worker(){
          while(cursor<nums.length){
            const n=nums[cursor++];
            const path=`ranking/${season.year}/${season.season}/week${pad(n)}/ranking-week${pad(n)}-${season.season}${season.year}.json`;
            try {
              let data=await fetchJSON(path);
              // Very old exports sometimes omit zero-padding in the JSON filename.
              if(!data && n<10){
                data=await fetchJSON(`ranking/${season.year}/${season.season}/week${pad(n)}/ranking-week${n}-${season.season}${season.year}.json`);
              }
              if(!data){unavailable++; continue;}
              const sorted=Array.isArray(data.entries)?data.entries:[];
              // Use actual ranked weekly records. Prelim participants are handled separately.
              if(n>0){
                for(const e of sorted){
                  const rank=Number(e?.rank);
                  if(!Number.isInteger(rank)||rank<1||!titleOf(e))continue;
                  const k=normalize(titleOf(e));
                  if(!union.has(k))union.set(k,{...e,firstWeek:n});
                  else if(!kvOf(union.get(k))&&kvOf(e)) union.get(k).kv=kvOf(e);
                }
              }
              if(n===0){
                const eliminatedEntries=data.meta?.prelim_selection?.eliminated_entries;
                if(Array.isArray(eliminatedEntries)){
                  const prelimByTitle=new Map(sorted.filter(e=>titleOf(e)).map(e=>[normalize(titleOf(e)),e]));
                  for(const e of eliminatedEntries){
                    if(!titleOf(e))continue;
                    const k=normalize(titleOf(e));
                    eliminated.set(k,{...(prelimByTitle.get(k)||{}),...e});
                  }
                }
              }
            }catch(_){unavailable++;}
            if(typeof update==='function') update(nums.length, cursor);
          }
        }
        await Promise.all(Array.from({length:Math.min(3,nums.length)},()=>worker()));
        return {entries:[...union.values()],eliminated:[...eliminated.values()],unavailable};
      })());
    }
    return weeksCache.get(key);
  }
  const panelToken=new WeakMap();
  function drawGrid(target,season,entries,lang,opts={}){
    const grid=make('div','ob-r17-grid');
    const w=labels[lang];
    for(const item of entries.slice(0,120)){
      const btn=make('button','ob-r17-title');btn.type='button';
      const thumb=make('span','ob-r17-thumb');
      const url=imageOf(season,item);
      if(url){const img=make('img','');img.src=url;img.alt='';img.loading='lazy';img.onerror=()=>{img.remove();thumb.classList.add('ob-r17-empty');thumb.textContent=w.artMissing;};thumb.append(img);}
      else {thumb.classList.add('ob-r17-empty');thumb.textContent=w.artMissing;}
      const title= lang==='ja'?jpOf(item)||titleOf(item):titleOf(item)||jpOf(item);
      btn.append(thumb,make('span','ob-r17-title-name',title||'—'));
      if(opts.eliminated)btn.classList.add('ob-r17-eliminated');
      btn.setAttribute('aria-label',title||'—');
      btn.addEventListener('click',()=>showInfo(target,season,item,lang));
      grid.append(btn);
    }
    target.append(grid);
  }
  function showInfo(panel,season,item,lang){
    panel.querySelector('.ob-r17-dialog')?.remove();
    const w=labels[lang];
    const dialog=make('div','ob-r17-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','false');dialog.setAttribute('aria-label',w.details);
    const title=lang==='ja'?jpOf(item)||titleOf(item):titleOf(item)||jpOf(item);
    const head=make('div','ob-r17-dialog-head');head.append(make('strong','',title));
    const close=make('button','',w.close);close.type='button';close.addEventListener('click',()=>{dialog.remove();});head.append(close);
    dialog.append(head);
    const studio=String(item.studios||item.info?.studios||item.info?.production_studio||item.fields?.production_studio||'');
    if(studio)dialog.append(make('p','',studio));
    if(Number.isInteger(item.firstWeek)){
      const link=make('a','ob-r17-first',`${w.seen}: ${pad(item.firstWeek)}`);
      link.href=firstAppearance(season,item.firstWeek);dialog.append(link);
    }
    panel.append(dialog);close.focus({preventScroll:true});
  }
  async function renderHistory({season,panel,active}){
    const id=Symbol();panelToken.set(panel,id);
    const isFresh=()=>panelToken.get(panel)===id && active();
    const lang=locale(), w=labels[lang];
    const title=make('h3','',w.snapshot);
    const intro=make('p','ob-r17-intro',w.intro);
    const checkpoints=make('section','ob-r17-checkpoints');
    const postsArray=typeof posts!=='undefined'&&Array.isArray(posts)?posts:[];
    const seasonal=postsArray.filter(p=>String(p.year)===String(season.year)&&String(p.season).toLowerCase()===season.season&&p.type==='tier');
    if(seasonal.length){
      checkpoints.append(make('h4','',w.checkpoints));
      const row=make('div','ob-r17-links');
      const check=[['01',w.first],['06',w.middle],['12',w.final]];
      for(const [week,label] of check){
        const found=seasonal.find(x=>x.week===week);
        if(found){const link=make('a','',`${label} · W${week}`);link.href=found.url;row.append(link);}
      }
      if(row.children.length)checkpoints.append(row);
      else checkpoints.replaceChildren();
    }
    const how=make('details','ob-r17-how');
    how.append(make('summary','',w.description),make('p','',w.generic));
    const body=make('div','ob-r17-body');
    panel.replaceChildren(title,intro,checkpoints,how,body);
    const master=await masterFor(season);
    if(!isFresh())return;
    const m=master?masterItems(master):null;
    if(m && m.items.length){
      const box=make('section','ob-r17-lineup');
      const heading=make('h4','',m.verified?`${w.master} · ${m.items.length} ${w.titles}`:`${w.fromMaster} · ${m.items.length} ${w.titles}`);
      box.append(heading,make('p','',m.verified?w.masterNote:w.notInitial));
      drawGrid(box,season,m.items,lang);
      const explicit=Array.isArray(master.prelimEliminated)?master.prelimEliminated:[];
      if(explicit.length){box.append(make('h4','ob-r17-outcome',`${w.preliminary} · ${explicit.length}`),make('p','',w.prelimNote));drawGrid(box,season,explicit,lang,{eliminated:true});}
      body.append(box);
      return;
    }
    body.append(make('p','ob-r17-nomaster',w.noMaster));
    const btn=make('button','ob-r17-load',w.preload);btn.type='button';body.append(btn);
    btn.addEventListener('click',async()=>{
      btn.disabled=true;btn.textContent=w.loading;
      const status=make('p','ob-r17-status','');body.append(status);
      const result=await fromWeekly(season,()=>{if(isFresh()) status.textContent=w.loading;});
      if(!isFresh())return;
      btn.remove();status.remove();
      if(result.entries.length){
        const block=make('section','ob-r17-lineup');
        block.append(make('h4','',`${w.recorded} · ${result.entries.length} ${w.titles}`),make('p','',w.recordedNote));
        drawGrid(block,season,result.entries,lang);body.append(block);
      }else body.append(make('p','',w.noEntries));
      if(result.eliminated.length){
        const block=make('section','ob-r17-lineup');
        block.append(make('h4','ob-r17-outcome',`${w.preliminary} · ${result.eliminated.length}`),make('p','',w.prelimNote));
        drawGrid(block,season,result.eliminated,lang,{eliminated:true});body.append(block);
      }
      if(result.unavailable){body.append(make('p','ob-r17-warning',`${w.failed} (${result.unavailable})`));}
    },{once:true});
  }
  // R16's internal archive renderer delegates to this when installed.
  window.OFFBEAT_R17={renderHistory};
  function enhanceArchive(){
    const holder=document.querySelector('.anime09 .n-index-filters');
    if(!holder||document.getElementById('offbeatArchiveWeekFilter')||typeof window.renderAnime!=='function')return;
    const label=make('label','ob-r17-week-label','WEEK ');
    const select=make('select','');select.id='offbeatArchiveWeekFilter';
    select.setAttribute('aria-label','Archive week / アーカイブの週');
    select.append(new Option('ALL WEEKS','all'));
    for(let n=0;n<=12;n++)select.append(new Option(n===0?'PRELIM / 00':`WEEK ${pad(n)}`,pad(n)));
    label.append(select);holder.append(label);
    // Rendering is left to the existing Post Index and card creator; R17 hides only
    // nonmatching article rows and empty month groups after that native rendering.
    const renderOriginal=window.renderAnime;
    window.renderAnime=function(...args){
      const returned=renderOriginal.apply(this,args);
      const value=select.value;
      if(value==='all')return returned;
      const archive=document.getElementById('animeArchive');if(!archive)return returned;
      let matches=0;
      for(const group of archive.querySelectorAll('.cards')){
        let count=0;
        for(const card of group.querySelectorAll('.n-archive-row')){
          const href=card.querySelector('a.thumb[href]')?.getAttribute('href')||'';
          const matched=/\/week(\d{2})\//i.exec(href);
          const visible=Boolean(matched&&matched[1]===value);
          card.hidden=!visible;
          if(visible){count++;matches++;}
        }
        group.hidden=count===0;
        const month=group.previousElementSibling;
        if(month?.classList.contains('archive-title'))month.hidden=count===0;
      }
      if(!matches){
        const p=make('p','ob-r17-empty',locale()==='ja'?'該当する公開済みの記事はありません。':'No published posts match this week.');
        archive.append(p);
      }
      return returned;
    };
    select.addEventListener('change',()=>{
      const current=document.querySelector('.anime09 [data-filter][aria-pressed="true"]')?.dataset.filter||'all';
      window.renderAnime(current);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceArchive,{once:true});
  else enhanceArchive();
})();
