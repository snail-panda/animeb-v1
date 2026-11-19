/* Tier List 用 html CSS JS Json 分離型 */

document.addEventListener("DOMContentLoaded", function() {
  

 // --- 🔧 正規化マッピングここに追加 ---
  const classMap = {
	"SSS": "sss",
    "SS": "ss",
    "S": "s",
    "A": "a",
    "B": "b",
    "C": "c",
    "D": "d",
    "Dropped": "dropped",
    "N/A": "na",
    "RecentlyDropped": "recently-dropped",
    // 追加（JSONのキーに合わせてどちらか一方を使う）
  "Never Watched": "neverwatched",
  // "NeverWatched": "neverwatched",
  };


// v11: Explicit opt-in metadata tokens in article snippets.
// Text nodes only: do not rewrite prose, HTML attributes, or existing dates.
// Available after JSON loads; no changes are made to legacy text unless a token exists.
let tierArticleMetadata = null;
function applyTierArticleMetadata(root) {
  if (!root || !tierArticleMetadata) return;
  const tokens = {
    "{{year}}": tierArticleMetadata.year,
    "{{season}}": tierArticleMetadata.season,
    "{{previousSeason}}": tierArticleMetadata.previousSeason,
    "{{previousYear}}": tierArticleMetadata.previousYear,
    "{{nextSeason}}": tierArticleMetadata.nextSeason,
    "{{nextYear}}": tierArticleMetadata.nextYear,
    "{{week}}": tierArticleMetadata.week,
    "{{weekNumber}}": tierArticleMetadata.weekNumber,
    "{{seasonDate}}": tierArticleMetadata.seasonDate,
    "{{publishedDate}}": tierArticleMetadata.publishedDate,
    "{{updatedDate}}": tierArticleMetadata.updatedDate
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (!/\{\{(?:year|season|previousSeason|previousYear|nextSeason|nextYear|week|weekNumber|seasonDate|publishedDate|updatedDate)\}\}/.test(node.nodeValue)) return;
    node.nodeValue = node.nodeValue.replace(/\{\{(?:year|season|previousSeason|previousYear|nextSeason|nextYear|week|weekNumber|seasonDate|publishedDate|updatedDate)\}\}/g, token => tokens[token] == null ? token : String(tokens[token]));
  });
}
function applyTierMetadataToArticles() {
  ["introText","contentText","conclusionText"].forEach(id => applyTierArticleMetadata(document.getElementById(id)));
}

// TL02: render individual title visuals from the same ordered Studio data.
// Keep the original PNG and legacy viewer if the extended data is absent/invalid.
function mountInteractiveTierBoard(data, year, season) {
  const png = document.getElementById('tierImage');
  const host = png && png.closest('.tierlist-image');
  const sections = document.getElementById('tierSections');
  if (!host || !sections || !data.tierEntries || host.classList.contains('has-live-tier-board')) return;
  const rows = [];
  const colors = {SSS:'#ff7777',SS:'#ff9b85',S:'#ffc080',A:'#ffdf80',B:'#ffff80',C:'#bfff80',D:'#80ff80',Dropped:'#80ffff',RecentlyDropped:'#80ffff','N/A':'#80bfff','Never Watched':'#d9d9d9'};
  const settings = Array.isArray(data.tierSettings) ? data.tierSettings : [];
  for (const [name, titles] of Object.entries(data.tiers || {})) {
    if (!Array.isArray(titles)) return;
    if (!titles.length) continue;
    const entries = data.tierEntries[name];
    if (!Array.isArray(entries) || entries.length !== titles.length || !entries.every((e,i)=>e && e.title === titles[i])) return;
    const color = settings.find(x=>x && x.label===name)?.color;
    rows.push({name,color:typeof color==='string' && /^#[0-9a-f]{6}$/i.test(color)?color:(colors[name]||'#d1c9ac'),entries});
  }
  if (!rows.length) return;
  const el = (tag,cls,text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; };
  const button = (text,cls) => { const n=el('button',cls,text); n.type='button'; return n; };
  const title = entry => tl(entry.title,entry.jpTitle||entry.title);
  const alternateTitle = entry => tierLang==='ja'?entry.title:entry.jpTitle;
  const imageUrl = entry => {
    const id=String(entry.imageId||'').replace(/\.(?:webp|png|jpe?g)$/i,'');
    if (!id || /[/\\\x00-\x1f]/.test(id) || id==='.' || id==='..') return null;
    return `../../../../images/key-visuals/${year}/${season}/${encodeURIComponent(id)}.webp`;
  };
  const addImage = (parent,entry,eager=false) => {
    const url=imageUrl(entry);
    const missing=()=>{parent.classList.add('live-tier-missing'); parent.replaceChildren(el('span','live-tier-missing-title',title(entry)));};
    if (!url) {missing();return;}
    const img=el('img'); img.alt=title(entry); img.decoding='async'; img.loading=eager?'eager':'lazy'; img.draggable=false;
    const candidates=[url,...(/\.webp$/i.test(url)?['jpg','png','jpeg'].map(ext=>url.replace(/\.webp$/i,'.'+ext)):[])];
    let attempt=0;img.addEventListener('error',()=>{if(++attempt<candidates.length)img.src=candidates[attempt];else missing();}); img.src=candidates[0]; parent.append(img);
  };
  const wrapper=el('div','live-tier-wrap');
  const controls=el('div','live-tier-controls');
  const open=button('Enlarge tier list','live-tier-action');
  const original=el('a','live-tier-png','PNG version'); original.href=png.src; original.target='_blank'; original.rel='noopener';
  controls.append(open,original);
  const hint=el('p','live-tier-hint','Hover or focus a visual for its title. Select a visual to open the enlarged view.');
  const tooltip=el('div','live-tier-tooltip');tooltip.hidden=true;tooltip.setAttribute('aria-hidden','true');document.body.append(tooltip);
  function hideTip(){tooltip.hidden=true;}
  function showTip(card,entry,event){
    const alt=alternateTitle(entry);tooltip.replaceChildren(el('strong','live-tier-tooltip-main',title(entry)));if(alt&&alt!==title(entry))tooltip.append(el('small','live-tier-tooltip-alt',alt));tooltip.hidden=false;
    const r=card.getBoundingClientRect(); const x=event?.clientX??r.left;const y=event?.clientY??r.bottom;
    tooltip.style.left=Math.max(6,Math.min(x+10,innerWidth-tooltip.offsetWidth-6))+'px';
    tooltip.style.top=Math.max(6,Math.min(y+12,innerHeight-tooltip.offsetHeight-6))+'px';
  }
  const dialog=el('dialog','live-tier-dialog');dialog.setAttribute('aria-label','Enlarged tier list');
  const toolbar=el('div','live-tier-toolbar');
  const minus=button('−','live-tier-action');minus.setAttribute('aria-label','Zoom out');
  const zoomLabel=el('span','live-tier-zoom-label','100%');
  const plus=button('+','live-tier-action');plus.setAttribute('aria-label','Zoom in');
  const close=button('Close ×','live-tier-action');
  toolbar.append(minus,zoomLabel,plus,close);
  const status=el('div','live-tier-selection','Select any visual to view the poster and title.');status.setAttribute('aria-live','polite');
  const scroll=el('div','live-tier-scroll');
  const preview=el('div','live-tier-preview');preview.hidden=true;
  const back=button('Back to tier list','live-tier-action');
  const poster=el('div','live-tier-poster');const posterTitle=el('h2','live-tier-poster-title');const posterTier=el('p','live-tier-poster-tier');
  preview.append(back,posterTitle,posterTier,poster);
  dialog.append(toolbar,status,scroll,preview);document.body.append(dialog);
  let active=null,zoom=100,oldOverflow='',returnFocus=null,viewerBoard=null,mainBoard=null,detailEntry=null,detailTier=null;
  const localized=[];
  function bindText(node,fn,attr){localized.push(()=>{if(attr)node.setAttribute(attr,fn());else node.textContent=fn();});}
  bindText(open,()=>tl('Enlarge tier list','ティアリストを拡大'));bindText(original,()=>tl('PNG version','PNG版'));
  bindText(hint,()=>tl('Hover over a visual for its title. Click the board to enlarge.','画像にカーソルを合わせると作品名を表示。表をタップ・クリックすると拡大します。'));
  bindText(dialog,()=>tl('Enlarged tier list','拡大ティアリスト'),'aria-label');bindText(minus,()=>tl('Zoom out','縮小'),'aria-label');bindText(plus,()=>tl('Zoom in','拡大'),'aria-label');
  bindText(close,()=>tl('Close ×','閉じる ×'));bindText(back,()=>tl('Back to tier list','ティアリストに戻る'));
  const promptText=()=>tl('Select any visual to see title details.','作品画像を選ぶと詳細を表示します。');

  function clearActive(){if(active)active.classList.remove('is-selected');active=null;}
  const altHeading=el('p','live-tier-alt-title');posterTitle.after(altHeading);
  const detailBody=el('div','live-tier-detail-body');poster.after(detailBody);
  const weekNumber=Number(location.pathname.match(/week(\d{2})\//)?.[1]);
  const weekText=w=>String(w).padStart(2,'0');
  const baselineWeek=String(data.analysis?.baseline||'').match(/\bW(?:eek\s*)?(\d{1,2})\b/i)?.[1];
  const baseWeek=baselineWeek?Number(baselineWeek):null;
  function renderDetailHeading(){posterTitle.textContent=title(detailEntry);altHeading.textContent=alternateTitle(detailEntry)||'';altHeading.hidden=!altHeading.textContent||altHeading.textContent===posterTitle.textContent;posterTier.textContent=tl(`Tier ${tierLabel(detailTier)} · #${detailEntry.position||rows.find(r=>r.name===detailTier).entries.indexOf(detailEntry)+1}`,`Tier ${tierLabel(detailTier)} · ${detailEntry.position||1}番目`);}
  const findEntry=(list,entry,idFn,titleFn)=>{
    const id=String(entry.imageId||'');const sameId=id?list.filter(x=>String(idFn(x)||'')===id):[];
    if(sameId.length===1)return sameId[0];if(sameId.length>1)return null;
    const sameTitle=list.filter(x=>titleFn(x)===entry.title);return sameTitle.length===1?sameTitle[0]:null;
  };
  const root='../../../../';let detailDataPromise=null,detailRequest=0;
  const readJSON=async path=>{const r=await fetch(root+path);if(!r.ok)throw Error(path);return r.json();};
  async function loadDetailData(){
    if(detailDataPromise)return detailDataPromise;
    detailDataPromise=(async()=>{
      const key=`${year}-${season}`;
      let master=null;
      for(const path of [`master/${year}/${season}/anime-master-${key}.json`,`master/${year}/${season}/anime_master-${key}.json`,`assets/data/offbeat-season-${key}.json`,`assets/data/anime-master-${key}.json`,`assets/data/ranking/weekly/anime-master-${key}.json`]){
        try{const d=await readJSON(path);if(Array.isArray(d.entries)||Array.isArray(d.items)){master=d;break;}}catch(_){}
      }
      let weekly={},expected=[];
      try{const index=await readJSON('weekly-rankings.json');const list=index?.[year]?.[season[0].toUpperCase()+season.slice(1)]?.weeks||[];expected=[...new Set(list.map(x=>Number(String(x).match(/\d{1,2}/)?.[0])).filter(w=>Number.isInteger(w)&&w>=1&&w<=weekNumber))].sort((a,b)=>a-b);}catch(_){}
      let engine=window.OFFBEAT_LINEUP_DATA_R52;
      if(!engine){try{await new Promise((resolve,reject)=>{const script=el('script');script.src=root+'assets/js/common/offbeat-lineup-data-r52.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});engine=window.OFFBEAT_LINEUP_DATA_R52;}catch(_){}}
      if(engine&&expected.length){await Promise.all(expected.map(async w=>{try{weekly[w]=await readJSON(engine.pathFor(year,season,w));}catch(_){}}));}
      const infos=(master?.entries||master?.items||[]).map(x=>x.info||x);
      // Reuse the Anime Home engine, with the broader Tier List catalog. Only
      // editions up to this article's week are ever loaded.
      let compiled=null;
      if(engine&&Object.keys(weekly).length){try{
        const unique=new Map(),duplicates=new Set();for(const row of rows)for(const e of row.entries){const kv=String(e.imageId||'');if(!kv)continue;if(unique.has(kv))duplicates.add(kv);else unique.set(kv,{kv,title:e.title,jpTitle:e.jpTitle||''});}for(const kv of duplicates)unique.delete(kv);
        compiled=engine.compileSeason({seasonYear:Number(year),season,items:[...unique.values()]},weekly);
      }catch(e){console.warn('Tier performance unavailable',e);}}
      return {infos,compiled,engine,weekly,expected};
    })();return detailDataPromise;
  }
  function detailLine(label,value){const box=el('div','live-tier-detail-metric');box.append(el('small',null,label),el('strong',null,value));return box;}
  function detailGrid(parent,values){const grid=el('div','live-tier-detail-grid');values.forEach(([k,v])=>grid.append(detailLine(k,v)));parent.append(grid);}
  const formatRank=r=>r?.rank==null?'—':`#${r.rank}${r.participantCount?' / '+r.participantCount:''}`;
  const fmt=v=>Number.isFinite(v)?v.toFixed(2):'—';
  async function renderTitleDetails(entry,tier){
    const request=++detailRequest;detailBody.replaceChildren();
    const section=el('section','live-tier-detail-section');section.append(el('h3',null,tl('Tier history','Tierの変遷')));
    const movement=[...(data.analysis?.changes?.promotions||[]),...(data.analysis?.changes?.demotions||[])];const moved=findEntry(movement,entry,x=>x.imageId,x=>x.title);
    const former=entry.previousTier==null?'—':`${tierLabel(entry.previousTier)}${entry.previousPosition?' · #'+entry.previousPosition:''}`;
    const change=Number.isFinite(moved?.steps)?`${moved.steps>0?'+':''}${moved.steps} ${tl('tiers','段階')}`:entry.previousTier==null?tl('No previous tier','前回なし'):entry.previousTier===tier?tl('Same tier','変化なし'):`${tierLabel(entry.previousTier)} → ${tierLabel(tier)}`;
    detailGrid(section,[[tl(`Previous tier${baseWeek?' · W'+weekText(baseWeek):''}${baseWeek===1?' (First Impressions)':''}`,`前回のTier${baseWeek?' · W'+weekText(baseWeek):''}${baseWeek===1?'（初回印象）':''}`),former],[tl(`Current tier · W${weekText(weekNumber)}`,`今回のTier · W${weekText(weekNumber)}`),`${tierLabel(tier)} · #${entry.position||1}`],[tl('Tier change','Tierの変化'),change]]);
    detailBody.append(section);
    const loading=el('p','live-tier-detail-note',tl('Loading title information and weekly results…','作品情報・週間成績を読み込み中…'));detailBody.append(loading);
    let d;try{d=await loadDetailData();}catch(_){d=null;}
    if(request!==detailRequest||detailEntry!==entry||preview.hidden||!dialog.open)return;
    loading.remove();if(!d){detailBody.append(el('p','live-tier-detail-note',tl('Additional information is unavailable.','追加情報を表示できません。')));return;}
    const info=findEntry(d.infos,entry,x=>x.image_id||x.kv,x=>x.title)||Object.values(d.weekly).reverse().map(raw=>findEntry(raw.entries||[],entry,x=>x.kv,x=>x.title)).find(Boolean);
    if(info){const information=el('section','live-tier-detail-section');information.append(el('h3',null,tl('About the title','作品情報')));
      const studio=tl(info.studios,info.studios_ja||info.studiosJa||info.studios),rawGenre=info.genre||info.genres||'';const genreList=Array.isArray(rawGenre)?rawGenre:String(rawGenre).split('|');const genre=genreList.map(g=>tl(g,({Action:'アクション',Adventure:'冒険',Comedy:'コメディ',Drama:'ドラマ',Fantasy:'ファンタジー',Romance:'恋愛','Slice of Life':'日常',Sports:'スポーツ',Mystery:'ミステリー',Horror:'ホラー','Sci-Fi':'SF',Supernatural:'超自然',Suspense:'サスペンス',Ecchi:'お色気'}[g]||g))).join(' / ');
      if(studio)information.append(el('p','live-tier-detail-meta',studio));if(genre)information.append(el('p','live-tier-detail-meta',genre));
      const synopsis=tl(info.synopsis,info.synopsis_ja||info.synopsisJa||info.synopsis);if(synopsis)information.append(el('p','live-tier-detail-synopsis',synopsis));detailBody.append(information);
    }
    const perf=el('section','live-tier-detail-section');perf.append(el('h3',null,tl('Weekly ranking performance','週間ランキング成績')));
    const hist=d.compiled?.histories?.[entry.imageId];
    const a=hist&&d.engine?.analyze?.(hist,weekNumber);
    if(a&&a.n){
      const records=a.records;const prior=baseWeek?records.find(r=>r.week===baseWeek):null;const current=records.find(r=>r.week===weekNumber);
      const summary=[];if(baseWeek)summary.push([tl(`Week ${weekText(baseWeek)} rank / WRP`,`第${weekText(baseWeek)}週 順位 / WRP`),`${formatRank(prior)} · ${fmt(prior?.wrp_score)}`]);
      summary.push([tl(`Week ${weekText(weekNumber)} rank / WRP`,`第${weekText(weekNumber)}週 順位 / WRP`),`${formatRank(current)} · ${fmt(current?.wrp_score)}`],[tl('Average WRP','平均WRP'),fmt(a.mean/10)],[tl('Best rank','最高順位'),a.best==null?'—':'#'+a.best]);detailGrid(perf,summary);
      perf.append(el('p','live-tier-detail-note',tl('WRP = Weekly Ranking Points, on the usual weekly scale. Tier placement is a separate assessment.','WRP＝週間ランキングポイント（通常の週間評価尺度）。Tier評価とは別の指標です。')));
      const table=el('table','live-tier-detail-history');const head=el('thead'),tr=el('tr');for(const txt of [tl('Week','週'),tl('Rank / field','順位 / 評価数'),'WRP',tl('Status','状態')]){const th=el('th',null,txt);th.scope='col';tr.append(th);}head.append(tr);table.append(head);const tbody=el('tbody');
      for(let w=1;w<=weekNumber;w++){const rec=records.find(r=>r.week===w),line=el('tr');const state=!rec?tl('Data unavailable','データなし'):rec.dropDecidedThisWeek?tl('Drop decided','ドロップ決定'):rec.rank!=null?tl('Rated','評価済み'):rec.droppedAfterWeek!=null?tl('Dropped','ドロップ'):rec.broadcast?.status==='no_air'?tl('No air','放送なし'):rec.broadcast?.status==='season_halted'?tl('Halted','放送中断'):rec.rankingCoverage==='full_reference'?tl('Not ranked','順位なし'):tl('Unconfirmed','未確認');line.append(el('td',null,'W'+weekText(w)),el('td',null,formatRank(rec)),el('td',null,fmt(rec?.wrp_score)),el('td',null,state));tbody.append(line);}table.append(tbody);perf.append(table);
    }else perf.append(el('p','live-tier-detail-note',tl('No verified weekly ranking results for this title in the available data.','取得できたデータには、この作品の確認済み週間ランキング成績がありません。')));
    if(!d.compiled||d.expected.some(w=>!d.compiled.weeks.includes(w)))perf.append(el('p','live-tier-detail-note',tl('Some weekly data may be unavailable; no missing ratings are treated as zero.','一部の週間データを取得できていない可能性があります。欠損評価は0点として扱いません。')));
    if(d.compiled?.weeks.includes(weekNumber)){const link=el('a','live-tier-detail-ranking',tl(`View Week ${weekText(weekNumber)} Weekly Ranking`,`第${weekText(weekNumber)}週 ウィークリーランキングを見る`));link.href=root+`ranking/${year}/${season}/week${weekText(weekNumber)}/index.html`;perf.append(link);}
    detailBody.append(perf);
  }
  function showPoster(entry,tier,card){
    clearActive();active=card;active?.classList.add('is-selected');
    detailEntry=entry;detailTier=tier;renderDetailHeading();
    poster.classList.remove('live-tier-missing');poster.replaceChildren();addImage(poster,entry,true);
    hideTip();scroll.hidden=true;preview.hidden=false;status.textContent=title(entry);minus.disabled=plus.disabled=true;renderTitleDetails(entry,tier);back.focus();
  }
  function returnToBoard(){detailEntry=null;detailTier=null;preview.hidden=true;scroll.hidden=false;minus.disabled=plus.disabled=false;status.textContent=promptText();if(active){active.focus({preventScroll:true});active.scrollIntoView({block:'nearest',inline:'nearest'});}else close.focus();}
  function buildBoard(inViewer){
    const board=el('div','live-tier-board');bindText(board,()=>tl('Tier list','ティアリスト'),'aria-label');
    if(!inViewer)board.addEventListener('click',event=>{if(!event.target.closest('.live-tier-card'))openViewer();});
    rows.forEach(row=>{
      const line=el('div','live-tier-row');const tag=el('div','live-tier-label',tierLabel(row.name));tag.style.backgroundColor=row.color;bindText(tag,()=>tierLabel(row.name));
      const cards=el('div','live-tier-cards');
      row.entries.forEach((entry,index)=>{
        const card=button(null,'live-tier-card');card.dataset.tier=row.name;card.dataset.position=String(index+1);
        bindText(card,()=>`${title(entry)} — ${tierLabel(row.name)}, ${index+1}`,'aria-label');
        addImage(card,entry,inViewer);card.addEventListener('click',()=>inViewer?showPoster(entry,row.name,card):openViewer(row.name,index+1));
        const tip=e=>{if(inViewer)status.textContent=`${tierLabel(row.name)} · ${title(entry)}`;if(e.pointerType!=='touch')showTip(card,entry,e.type==='focus'?null:e);};
        card.addEventListener('pointerenter',tip);card.addEventListener('pointermove',tip);card.addEventListener('pointerleave',hideTip);card.addEventListener('focus',tip);card.addEventListener('blur',hideTip);
        const img=card.querySelector('img');if(img)bindText(img,()=>title(entry),'alt');
        cards.append(card);
      });line.append(tag,cards);board.append(line);
    });return board;
  }
  function setZoom(value){zoom=Math.max(75,Math.min(300,value));zoomLabel.textContent=zoom+'%';if(viewerBoard)viewerBoard.style.width=Math.round(Math.max(820,scroll.clientWidth)*zoom/100)+'px';}
  function openViewer(tier,position){
    hideTip();if(dialog.open)return;
    returnFocus=document.activeElement;oldOverflow=document.body.style.overflow;
    if(!viewerBoard){viewerBoard=buildBoard(true);scroll.append(viewerBoard);}
    clearActive();detailEntry=null;detailTier=null;preview.hidden=true;scroll.hidden=false;minus.disabled=plus.disabled=false;dialog.append(tooltip);dialog.showModal();document.body.style.overflow='hidden';localized.forEach(fn=>fn());
    setZoom(100);scroll.scrollTop=scroll.scrollLeft=0;status.textContent=promptText();
    if(tier!=null){const target=Array.from(viewerBoard.querySelectorAll('.live-tier-card')).find(c=>c.dataset.tier===tier&&c.dataset.position===String(position));if(target){active=target;target.classList.add('is-selected');target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest'});}}else close.focus();
  }
  open.addEventListener('click',()=>openViewer());close.addEventListener('click',()=>dialog.close());back.addEventListener('click',returnToBoard);
  minus.addEventListener('click',()=>setZoom(zoom-25));plus.addEventListener('click',()=>setZoom(zoom+25));
  dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;hideTip();document.body.append(tooltip);detailEntry=null;detailTier=null;returnFocus?.focus({preventScroll:true});hideTip();});
  window.addEventListener('resize',()=>{hideTip();if(dialog.open&&!scroll.hidden)setZoom(zoom);});
  window.addEventListener('scroll',hideTip,{passive:true});
  mainBoard=buildBoard(false);wrapper.append(mainBoard,controls,hint);png.insertAdjacentElement('afterend',wrapper);
  // The original side list remains collapsible; each entry opens the matching visual.
  Array.from(sections.querySelectorAll('.tier-section')).forEach(section=>{
    const name=section.querySelector('.toggle-button')?.textContent;const row=rows.find(r=>r.name===name);if(!row)return;
    const toggle=section.querySelector('.toggle-button');bindText(toggle,()=>tierLabel(name));
    Array.from(section.querySelectorAll('li')).forEach((li,i)=>{const entry=row.entries[i];if(!entry||li.textContent!==entry.title)return;const link=button(title(entry),'live-tier-title-link');bindText(link,()=>title(entry));
      const target=Array.from(mainBoard.querySelectorAll('.live-tier-card')).find(c=>c.dataset.tier===name&&c.dataset.position===String(i+1));
      const highlight=on=>{target?.classList.toggle('is-linked',on);mainBoard.classList.toggle('has-linked',on);};
      link.addEventListener('pointerenter',()=>highlight(true));link.addEventListener('pointerleave',()=>highlight(false));link.addEventListener('focus',()=>highlight(true));link.addEventListener('blur',()=>highlight(false));
      link.addEventListener('click',()=>{highlight(false);openViewer(name,i+1);showPoster(entry,name,active);});li.replaceChildren(link);});
  });
  host.classList.add('has-live-tier-board');png.hidden=true;
  function syncBoard(){localized.forEach(fn=>fn());for(const board of [mainBoard,viewerBoard])if(board)board.querySelectorAll('.live-tier-card.live-tier-missing').forEach(card=>{const entry=rows.find(r=>r.name===card.dataset.tier)?.entries[Number(card.dataset.position)-1];const span=card.querySelector('.live-tier-missing-title');if(entry&&span)span.textContent=title(entry);});hideTip();if(detailEntry){renderDetailHeading();status.textContent=title(detailEntry);renderTitleDetails(detailEntry,detailTier);}else status.textContent=promptText();}
  syncBoard();return syncBoard;
}

// Structured editorial, opt-in per article. Legacy prose is never replaced unless
// the page explicitly requests auto mode. All copy is derived from this edition.
const autoEditorial = document.body.dataset.tierEditorial === "auto";
const tierLanguageKey = 'animeb-weekly-lang';
let tierLang = 'en';
if(autoEditorial){try{tierLang=localStorage.getItem(tierLanguageKey)==='ja'?'ja':'en';}catch(_){} }
const tl = (en,ja) => tierLang==='ja'?ja:en;
const tierLabel = name => tl(name,({Dropped:'ドロップ',RecentlyDropped:'新規ドロップ','Never Watched':'未視聴','N/A':'対象外'}[name]||name));
function tierVersionJa(version,week){
 const ep=String(version||'').match(/Episodes?\s+(\d+(?:\s*[–—-]\s*\d+)?)/i);
 const name=({'week01':'初回印象','week06':'中間評価','week12':'最終評価'})[week];
 return name?`${name} ティアリスト${ep?' — 第'+ep[1]+'話':''}`:String(version||'Tier List');
}
function installTierLanguage(update){
 const group=document.createElement('div');group.className='tier-page-language';group.setAttribute('role','group');group.setAttribute('aria-label','Language / 言語');
 for(const [lang,label] of [['en','EN'],['ja','日本語']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.lang=lang;b.addEventListener('click',()=>apply(lang,true));group.append(b);}
 function apply(lang,save){tierLang=lang==='ja'?'ja':'en';if(save){try{localStorage.setItem(tierLanguageKey,tierLang);}catch(_){}}document.documentElement.lang=tierLang;group.querySelectorAll('button').forEach(b=>{b.classList.toggle('selected',b.dataset.lang===tierLang);b.setAttribute('aria-pressed',String(b.dataset.lang===tierLang));});update();document.dispatchEvent(new CustomEvent('offbeat:tier-editorial-language',{detail:tierLang}));}
 const mast=document.getElementById('offbeat-global-header');
 const put=()=>{const tools=mast?.querySelector('.offbeat-header-tools');if(tools){tools.prepend(group);return true;}return false;};
 if(!put()){const target=document.querySelector('.post-header');if(target)target.prepend(group);if(mast){const obs=new MutationObserver(()=>{if(put())obs.disconnect();});obs.observe(mast,{childList:true,subtree:true});}}
 window.addEventListener('storage',e=>{if(e.key===tierLanguageKey)apply(e.newValue,false);});apply(tierLang,false);
}

function renderTierEditorial(data, meta, lang = "en") {
  const ja = lang === "ja";
  const tr = (en, jp) => ja ? jp : en;
  const a = data.analysis, n = a?.counts;
  const intro = document.getElementById("introText"), content = document.getElementById("contentText"), conclusion = document.getElementById("conclusionText");
  if (!intro || !content || !conclusion) return;
  const make = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text != null) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const para = (root, text) => root.append(make("p", text));
  const heading = (root, text) => root.append(make("h3", text, "tier-editorial-subheading"));
  [intro, content, conclusion].forEach(el => el.replaceChildren());
  // Fail closed rather than displaying a previous season's copied text.
  if (!meta || !n || !Array.isArray(a.distribution) || !a.changes ||
      ![n.totalTitles,n.ratedTitles,n.totalDropped,n.unrated].every(x => Number.isInteger(x) && x >= 0) ||
      n.ratedTitles + n.totalDropped + n.unrated !== n.totalTitles) {
    para(intro, tr("This edition's analysis is currently unavailable. The tier list below remains available.", "この回の分析データは現在表示できません。ティアリストは下からご覧いただけます。"));
    return;
  }
  const seasonJa = {Winter:"冬",Spring:"春",Summer:"夏",Fall:"秋"}[meta.season] || meta.season;
  const season = tr(`${meta.season} ${meta.year}`, `${meta.year}年${seasonJa}`);
  const week = String(meta.weekNumber).padStart(2,"0");
  const stage = week === "01" ? tr("first impressions", "初回の印象") : week === "06" ? tr("midseason", "中間時点") : week === "12" ? tr("season finale", "最終時点") : tr(`Week ${week}`, `第${Number(week)}週`);
  const episode = String(data.version || "").match(/Episodes?\s+([0-9]+(?:\s*[–—-]\s*[0-9]+)?)/i);
  const episodeLabel = episode ? tr(` (around episode${/[–—-]/.test(episode[1])?"s":""} ${episode[1]})`, `（第${episode[1]}話前後）`) : "";
  const baseline = a.hasBaseline === true && Number.isInteger(n.previousRated) && Number.isInteger(n.previousTotal);
  const baselineText = String(a.baseline || "");
  const baselineWeek = baselineText.match(/\bW(?:eek\s*)?(\d{1,2})\b/i);
  const previous = baselineWeek ? tr(`Week ${baselineWeek[1].padStart(2,"0")}`, `第${Number(baselineWeek[1])}週`) : tr("the previous edition", "前回");
  const change = (key) => Array.isArray(a.changes[key]) ? a.changes[key] : [];
  const num = (key) => change(key).length;
  const custom = data.editorial?.[lang];
  const addCustom = (root, key) => {
    if (typeof custom?.[key] === "string" && custom[key].trim()) custom[key].trim().split(/\n\s*\n/).forEach(t => para(root,t));
  };
  para(intro, tr(`Here is the ${season} anime tier list at ${stage}${episodeLabel}. Week ${week} includes ${n.totalTitles} titles: ${n.ratedTitles} in the rated tiers, ${n.totalDropped} marked as Dropped, and ${n.unrated} outside the rated tiers (neither rated nor dropped).`, `${season}アニメの${stage}${episodeLabel}のティアリストです。第${Number(week)}週では全${n.totalTitles}作品を掲載し、評価対象は${n.ratedTitles}作品、ドロップは${n.totalDropped}作品、それ以外の評価対象外は${n.unrated}作品です。`));
  if (baseline) {
    para(intro, tr(`Compared with ${previous}, ${num("promotions")} titles moved up a rated tier and ${num("demotions")} moved down. ${num("newlyDropped")} titles moved into a Dropped category.`, `${previous}との比較では、評価Tier内の昇格が${num("promotions")}作品、降格が${num("demotions")}作品、新たにドロップ区分へ移った作品が${num("newlyDropped")}作品です。`));
  }
  addCustom(intro,"intro");
  const note = make("aside", null, "tier-auto-note");
  note.append(make("strong", tr("A note on the tier list", "ティアリストについて")));
  const noteEn = "The tier list is a separate assessment from the Weekly Ranking. Titles excluded from the Weekly Ranking may still be evaluated here. A change to Dropped refers to this tier list, not necessarily to the date a title left the Weekly Ranking.";
  const noteJa = "ティアリストはウィークリーランキングとは別の評価です。週間ランキングの対象外となった作品でも、ここでは評価される場合があります。ドロップへの移動はティアリスト上の変化であり、週間ランキングから外れた時期と必ずしも一致しません。";
  para(note,tr(noteEn,noteJa));
  intro.append(note);
  heading(content, week === "06" ? tr("Midseason at a Glance", "中間時点の評価状況") : tr("The Lineup at a Glance", "評価状況"));
  const stats = make("div",null,"tier-auto-stats");
  const stat = (label,value,sub) => {const card=make("div",null,"tier-auto-stat");card.append(make("span",label),make("strong",String(value)));if(sub)card.append(make("small",sub));stats.append(card);};
  const signed=x=>x>0?`+${x}`:String(x);
  stat(tr("Titles listed","全掲載作品"),n.totalTitles,baseline?`${previous}: ${n.previousTotal}`:null);
  stat(tr("Rated titles","評価対象"),n.ratedTitles,baseline?`${previous}: ${n.previousRated} (${signed(n.ratedTitles-n.previousRated)})`:null);
  stat(tr("Dropped","ドロップ"),n.totalDropped,baseline?`${tr("Newly dropped","新規ドロップ")}: ${num("newlyDropped")}`:null);
  stat(tr("N/A / Other","その他の対象外"),n.unrated,null);
  content.append(stats);
  heading(content,tr("Tier Distribution","Tier別作品数"));
  const table=make("table",null,"tier-auto-table"), thead=make("thead"), hrow=make("tr"), tbody=make("tbody");
  const th=(text)=>{const el=make("th",text);el.scope="col";return el;};
  ["Tier",...(baseline?[previous]:[]),tr(`Week ${week}`,`第${Number(week)}週`),...(baseline?[tr("Change","増減")]:[])].forEach(t=>hrow.append(th(t)));thead.append(hrow);
  const tierName = t => ja ? ({Dropped:"ドロップ",RecentlyDropped:"新規ドロップ", "Never Watched":"未視聴", "N/A":"対象外"}[t] || t) : t;
  a.distribution.filter(x=>x && Number.isInteger(x.current) && x.current>=0 && (x.current || (baseline && x.previous))).forEach(x=>{
    const row=make("tr"), name=make("th",tierName(x.tier));name.scope="row";row.append(name);
    if(baseline)row.append(make("td",Number.isInteger(x.previous)?String(x.previous):"—"));
    row.append(make("td",String(x.current)));
    if(baseline)row.append(make("td",Number.isInteger(x.previous)?signed(x.current-x.previous):"—"));tbody.append(row);
  });table.append(thead,tbody);content.append(table);
  if (baseline) {
    const names = r=>ja?(r.jpTitle||r.title):r.title;
    const movement = (key, title, biggest) => {
      const rows=change(key);if(!rows.length)return;
      heading(content,`${title} · ${rows.length}`);
      const list=make("ul",null,"tier-auto-movers");
      const max=biggest?Math.max(...rows.map(r=>Math.abs(Number(r.steps)||0))):0;
      rows.slice().sort((x,y)=>biggest?Math.abs(Number(y.steps)||0)-Math.abs(Number(x.steps)||0):0).forEach(r=>{
        const li=make("li"), label=make("span",names(r)||"", "tier-auto-mover-title"), transition=make("span",`${r.from==null?"—":tierName(r.from)} → ${r.to==null?"—":tierName(r.to)}`,"tier-auto-transition");
        li.append(label,transition);
        if(biggest && max && Math.abs(Number(r.steps)||0)===max)li.append(make("small",tr(`${max} tier${max===1?"":"s"}`,`${max}段階`),"tier-auto-step"));
        list.append(li);
      });content.append(list);
    };
    movement("promotions",tr("Promotions","昇格"),true);
    movement("demotions",tr("Demotions","降格"),true);
    movement("newlyDropped",tr("Newly Dropped","新規ドロップ"));
    movement("backOnList",tr("Back in the Rated Tiers","評価Tierへ復帰・移行"));
    movement("newEntries",tr("New Entries","新規掲載"));
    movement("removed",tr("No Longer Listed","掲載から除外"));
    // Other state transitions are not repeated under the drop/return sections.
    const identity=r=>JSON.stringify([r.imageId,r.title,r.from,r.to]);
    const already=new Set([...change("newlyDropped"),...change("backOnList")].map(identity));
    const other=change("statusChanges").filter(r=>!already.has(identity(r)));
    if(other.length){heading(content,tr("Other Status Changes","その他の状態変化"));const list=make("ul",null,"tier-auto-movers");other.forEach(r=>list.append(make("li",`${names(r)}: ${tierName(r.from)} → ${tierName(r.to)}`)));content.append(list);}
    para(content,tr(`${num("unchanged")} titles remained in the same tier or status. This comparison does not count changes in ordering within a tier as promotions or demotions.`, `${num("unchanged")}作品は同じTier・状態を維持しました。同じTier内での並び順の変化は昇格・降格には含めていません。`));
  }
  if(typeof custom?.content === "string" && custom.content.trim()){heading(content,tr("Editorial Notes","補足・感想"));addCustom(content,"content");}
  heading(conclusion,tr("Final Thoughts","まとめ"));
  const ratedChange = baseline ? n.ratedTitles - n.previousRated : 0;
  if(baseline && ratedChange !== 0) para(conclusion,tr(`The rated lineup ${ratedChange<0?"narrowed":"expanded"} from ${n.previousRated} to ${n.ratedTitles} titles since ${previous}. This is a snapshot of the tier list at Week ${week}, separate from the weekly scores.`, `${previous}から評価対象作品は${n.previousRated}作品から${n.ratedTitles}作品に${ratedChange<0?"減少":"増加"}しました。週間評価点とは別に、第${Number(week)}週時点の位置づけを示したものです。`));
  else para(conclusion,tr(`This edition records ${n.ratedTitles} rated titles at Week ${week}.`, `第${Number(week)}週時点の評価対象は${n.ratedTitles}作品です。`));
  addCustom(conclusion,"conclusion");
  if(week==="01")para(conclusion,tr("The next regular tier list is the midseason update (Week 06).","次回の定期ティアリストは中間評価（第6週）です。"));
  if(week==="06")para(conclusion,tr("The next regular tier list is the season-final edition (Week 12).","次回の定期ティアリストは最終評価（第12週）です。"));
  const link=make("a",tr(`Week ${week} Weekly Ranking`,`第${Number(week)}週 ウィークリーランキング`));
  link.href=`../../../../ranking/${meta.year}/${meta.season.toLowerCase()}/week${week}/index.html`;
  const p=make("p",tr("For weekly scores and individual reviews, see the ","週間評価点や各作品のレビューは、"));p.append(link,document.createTextNode(tr(".","をご覧ください。")));conclusion.append(p);
}

if (!autoEditorial) {
// ✅ intro.html 読み込み
  fetch("intro.html")
    .then(res => res.ok ? res.text() : null)
    .then(html => {
      const target = document.getElementById("introText");
      if (html) {
        target.innerHTML = html;
        applyTierArticleMetadata(target);
      }
    });


 // ✅ content.html 読み込み
  fetch("content.html")
    .then(res => res.ok ? res.text() : null)
    .then(html => {
      const target = document.getElementById("contentText");
      if (html) {
        target.innerHTML = html;
        applyTierArticleMetadata(target);
      }
    });

// ✅ conclusion.html 読み込み
  fetch("conclusion.html")
    .then(res => res.ok ? res.text() : null)
    .then(html => {
      const target = document.getElementById("conclusionText");
      if (html) {
        target.innerHTML = html;
        applyTierArticleMetadata(target);
      }
    });


}

  // ========== Tier Guide ロード ==========
   // Tier Guide（週別自動読み込みに変更）まず詳細版

  function getWeekFolder() {
  // 1. もしグローバル変数があればそれを使う
  if (window.weekFolder) {
    return window.weekFolder;
  }

  // 2. なければURLからweekXXを抽出
  const match = window.location.pathname.match(/(week\d{2})/);
  return match ? match[1] : null;
}


  function loadTierGuide() {
  const week = getWeekFolder();
  console.log("Detected week folder:", week); // デバッグ用
  if (!week) {
    console.error("Week folder could not be determined.");
    return;
  }

  const tierGuidePath = `../../../../assets/js/tierlist/weekly/tierguide-${week}.js`;
  console.log("Loading tier guide from:", tierGuidePath); // デバッグ用

  const script = document.createElement("script");
  script.src = tierGuidePath;
  script.onload = function() {
    console.log("Tier guide script loaded");
    if (typeof tierGuideData !== "undefined") {
      console.log("tierGuideData found:", tierGuideData);
      const box = document.getElementById("tierGuide");
      if (box) box.innerHTML = tierGuideData.tierGuide;

      const disclaimerBox = document.getElementById("disclaimer");
      if (disclaimerBox) disclaimerBox.innerHTML = tierGuideData.disclaimer;

      const guideEnglish = box?.innerHTML;
      const disclaimerEnglish = disclaimerBox?.innerHTML;
      // 以下は簡易版生成とトグル（省略せずそのまま）
      const simpleList = document.createElement("ul");
      simpleList.className = "criteria-simple";
      document.querySelectorAll(".criteria-list li").forEach(li => {
        const simpleLi = document.createElement("li");
        const span = li.querySelector("span");
        if (span) {
          simpleLi.textContent = span.textContent;
          simpleList.appendChild(simpleLi);
        }
      });
      // 最初はcriteria-list(詳細版)を非表示
      document.querySelector(".criteria-list").classList.add("hidden");
      // 最初は簡易版だけ見せる
      document.getElementById("tierGuide").appendChild(simpleList);

      //🔽 ここに追記 トグルボタン show details button and function added
      const toggleButton = document.createElement('button');
      toggleButton.id = "toggleTierGuide";
      toggleButton.textContent = "Show details";
      toggleButton.classList.add("tier-guide-toggle");
      document.getElementById("tierGuide").appendChild(toggleButton);

      function updateGuideLanguage(){
        if(!autoEditorial||!box||!disclaimerBox)return;
        const detailed=box.querySelector('.criteria-list');if(!detailed)return;
        const english=document.createElement('div');english.innerHTML=guideEnglish||'';
        const enList=english.querySelector('.criteria-list');
        const isOpen=!detailed.classList.contains('hidden');
        const midJa=[
          ['🔴 SS – 至高','最高峰。絶対に見てほしい作品。'],
          ['🟠 S – 素晴らしい','完成度が高く、勢いも十分。神がかり的な輝きにはあと一歩。おすすめはこのTierから。'],
          ['🟡 A – 良作','堅実で、まだ興味を引く作品。十分楽しめるが、少し失速してきた、あるいは逆に持ち直してきた作品も。'],
          ['⚪ B – まずまず','必見ではないが、普通に視聴できる。気軽に見るには十分。見逃しても大きな損はない。'],
          ['🟢 C – 不出来／ひどい','うまくかみ合わない部分が多い。ただ、いくつかの要素がうまくまとまれば、わずかな希望は残る。'],
          ['🔻 D – 駄作','視聴時間を正当化するのも難しいほどの駄作。しかし、ひどさゆえに楽しめることもあり、奇妙な魅力が瞬間的に光る。崩れかけていても、不思議とシーズン全体を形作る一部ではある。'],
          ['🔵 ドロップ／再視聴の可能性','ひとまず視聴を中止。再挑戦の機会を与える作品もあるかもしれない。'],
          ['⚫ N/A – 対象外','判断済み。評価の圏外。']
        ];
        const localGuide=tierLang==='ja'&&week==='week06'&&enList?.children.length===midJa.length;
        if(enList)detailed.replaceChildren(...Array.from(enList.children).map(n=>n.cloneNode(true)));
        if(localGuide)Array.from(detailed.children).forEach((li,i)=>{const span=li.querySelector('span');if(span){span.textContent=midJa[i][0];li.replaceChildren(span,document.createTextNode(' '+midJa[i][1]));}});
        const h=box.querySelector('.criteria-title');if(h)h.textContent=tl('Tier Guide',localGuide?'Tierの評価基準':'Tierの評価基準（英語）');
        simpleList.replaceChildren(...Array.from(detailed.children).map(li=>{const n=document.createElement('li');n.textContent=li.querySelector('span')?.textContent||li.textContent;return n;}));
        detailed.classList.toggle('hidden',!isOpen);simpleList.classList.toggle('hidden',isOpen);
        toggleButton.textContent=isOpen?tl('Hide details','詳細を閉じる'):tl('Show details','詳細を表示');
        disclaimerBox.innerHTML=disclaimerEnglish||'';
        if(tierLang==='ja'){
          const title=document.createElement('div');title.className='disclaimer-title';title.textContent='※ N/A（対象外）について';
          disclaimerBox.replaceChildren(title,document.createTextNode('N/Aの多くは、初回から数話の間、あるいは視聴途中で視聴をやめたり、対象から外したりした作品です。数分しか見ていないもの、ひと目で対象外にしたもの、そもそも見ていないものもあります。すべてがひどい作品というわけではありません。単に好みに合わない、あるいは週間ランキングの形式や雰囲気に合わないものが多いのです。良作や楽しめる作品でも当てはまる場合があります。とはいえ、本当にひどい作品もいくつかありました。'));
        }
      }
      if(autoEditorial){document.addEventListener('offbeat:tier-editorial-language',updateGuideLanguage);updateGuideLanguage();}
      // ボタンクリックで切替
      toggleButton.addEventListener("click", function() {
        const detailed = document.querySelector(".criteria-list");
        const simple = document.querySelector(".criteria-simple");
        if (detailed.classList.contains("hidden")) {
          // 詳細版を出す→簡易版を隠す
          detailed.classList.remove("hidden");
          simple.classList.add("hidden");
          toggleButton.textContent = autoEditorial?tl("Hide details","詳細を閉じる"):"Hide details";
        } else {
          // 簡易版に戻す
          detailed.classList.add("hidden");
          simple.classList.remove("hidden");
          toggleButton.textContent = autoEditorial?tl("Show details","詳細を表示"):"Show details";
        }
      });
    } else {
      console.error("tierGuideData is undefined!");
    }
  };
  document.body.appendChild(script);
}


loadTierGuide();
setTierImage();
loadTiersFromJSON();

// ========== Tier Image ロード ==========

function setTierImage() {
  const pathParts = window.location.pathname.split("/");
  const year = pathParts[pathParts.indexOf("tierlist")+1];   // "2025"
  const season = pathParts[pathParts.indexOf("tierlist")+2]; // "summer"
  const week = pathParts[pathParts.indexOf("tierlist")+3];   // "week06"

  // ファイル名例: tierlist-2025-summer-week06.png
  const imgPath = `../../../../images/tier-lists/${year}/${season}/${week}/tierlist-${year}-${season}-${week}.png`;

  console.log("Tier image path:", imgPath);
  document.getElementById("tierImage").src = imgPath;
}


  // Titles by Tier をJSONからロードし、Season Title/Dateも設定
  function loadTiersFromJSON() {
  const pathParts = window.location.pathname.split("/");
  const year = pathParts[pathParts.indexOf("tierlist")+1];   // "2025"
  const season = pathParts[pathParts.indexOf("tierlist")+2]; // "summer"
  const week = pathParts[pathParts.indexOf("tierlist")+3];   // "week06"

   // JSONファイル名はシンプルに：tierlist-${year}-${season}-${week}.json
  const jsonPath = `tierlist-${year}-${season}-${week}.json`;

  console.log("Loading tiers JSON from:", jsonPath);

  fetch(jsonPath)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${jsonPath}`);
      return res.json();
    })
    .then(jsonData => {

     /* ============================
         1. Season Title と Season Date を設定
         ============================ */
      // JSONには "season" と "version" が別々にあるので、結合して seasonTitle にする
      const fullSeasonTitle = `${jsonData.season} ${jsonData.version}`;
      const heading = document.getElementById("seasonTitle");
      heading.textContent = "";
      const match = fullSeasonTitle.match(/^(\d{4})\s+(Spring|Summer|Fall|Winter)(.*)$/i);
      if (match) {
        heading.append(document.createTextNode(match[1]+" "));
        const seasonSpan = document.createElement("span");
        seasonSpan.className = "season-highlight " + match[2].toLowerCase();
        seasonSpan.textContent = match[2];
        heading.append(seasonSpan,document.createTextNode(match[3]));
      } else heading.textContent=fullSeasonTitle;
      // Common editorial header: use each page's JSON without modifying article HTML.
      // Refuse to apply the theme if JSON season disagrees with the URL folder.
      const urlSeason = String(season || "").toLowerCase();
      const jsonSeason = match ? match[2].toLowerCase() : "";
      const jsonYear = match ? match[1] : "";
      const validPage = Boolean(match && jsonSeason === urlSeason && jsonYear === String(year));
      if (validPage) {
        // Keep the browser-tab title in sync with the validated article JSON.
        if (String(jsonData.version || "").trim()) document.title = fullSeasonTitle.trim();
        // Reuse the year-aware season navigation rules (Winter <-> Fall rollover).
        const currentSeason = jsonSeason.charAt(0).toUpperCase() + jsonSeason.slice(1);
        const previous = typeof getPrevSeason === "function" ? getPrevSeason(year, currentSeason) : null;
        const next = typeof getNextSeason === "function" ? getNextSeason(year, currentSeason) : null;
        if (!previous || !next) console.warn("Previous/next season metadata unavailable: tierlist-nav.js was not loaded");
        tierArticleMetadata = {
          year: String(year),
          season: currentSeason,
          previousSeason: previous?.season ?? null,
          previousYear: previous?.year ?? null,
          nextSeason: next?.season ?? null,
          nextYear: next?.year ?? null,
          week: String(week),
          weekNumber: String(Number(String(week).replace(/^week/i, ""))),
          seasonDate: jsonData.seasonDate ?? null,
          publishedDate: jsonData.publishedDate ?? null,
          updatedDate: jsonData.updatedDate ?? null
        };
        applyTierMetadataToArticles();
        const body = document.body;
        ["fall-hero-v27", "fall-hero-v28", "fall-hero-v29", "fall-hero-v30", "fall-hero-v31", "fall-hero-v32"].forEach(cls => body.classList.add(cls));
        body.classList.add("tierlist-editorial-common", "tierlist-theme-" + jsonSeason);
        const header = heading.closest(".post-header");
        if (header && !header.querySelector(".fall-hero-eyebrow")) {
          const eyebrow = document.createElement("div");
          eyebrow.className = "fall-hero-eyebrow";
          const brand = document.createElement("span");
          brand.textContent = "OFFBEAT";
          const slash = document.createElement("span");
          slash.className = "fall-hero-slash";
          slash.textContent = " / ";
          const tier = document.createElement("span");
          tier.className = "fall-hero-eyebrow-tier";
          tier.textContent = "TIER LIST";
          eyebrow.append(brand, slash, tier);
          header.insertBefore(eyebrow, heading);
        }
        heading.textContent = "";
        const yearEl = document.createElement("span");
        yearEl.className = "fall-hero-year";
        yearEl.textContent = jsonYear;
        const seasonEl = document.createElement("span");
        seasonEl.className = "fall-hero-season";
        seasonEl.textContent = jsonSeason.toUpperCase();
        const left = document.createElement("span");
        left.className = "fall-hero-left";
        left.append(yearEl, seasonEl);
        const right = document.createElement("span");
        right.className = "fall-hero-right";
        const lines = document.createElement("span");
        lines.className = "fall-hero-lines";
        // Split the supplied title only at the Tier List phrase and episode suffix.
        // No hard-coded Premiere, Mid-Season, Finale or episode number.
        const versionText = String(jsonData.version || "").trim();
        const suffixMatch = versionText.match(/\s*[–—-]\s*(Episodes?\s+.+)$/i);
        const episodeText = suffixMatch ? suffixMatch[1].trim() : "";
        const mainText = suffixMatch ? versionText.slice(0, suffixMatch.index).trim() : versionText;
        const tierMatch = mainText.match(/\bTier\s+List\b/i);
        const lead = tierMatch ? mainText.slice(0, tierMatch.index).trim() : mainText;
        const tail = tierMatch ? mainText.slice(tierMatch.index).trim() : "";
        // Keep the Premiere article's approved line breaks without altering its words.
        const parts = /Anime Season Premiere\s*\/\s*First impressions?/i.test(lead)
          ? lead.replace(/^(Anime Season)\s+(Premiere\s*\/)\s+(First impressions?)$/i, "$1|$2|$3").split("|")
          : [lead];
        parts.forEach(part => {
          const line = document.createElement("span");
          line.textContent = part;
          lines.appendChild(line);
        });
        if (tail) {
          const tierLine = document.createElement("span");
          tierLine.className = "fall-hero-tier";
          tierLine.textContent = tail;
          lines.appendChild(tierLine);
        }
        right.appendChild(lines);
        if (episodeText) {
          const episode = document.createElement("span");
          episode.className = "fall-hero-episode";
          episode.textContent = "— " + episodeText;
          right.appendChild(episode);
        }
        heading.append(left, right);

        // v4: fit the rendered season word to its actual column width.
        // This is independent of viewport size, so split-screen desktop widths
        // and phone orientations cannot cause a word to cross the divider.
        const fitSeason = () => {
          seasonEl.style.fontSize = "";
          const available = left.getBoundingClientRect().width;
          const actual = seasonEl.getBoundingClientRect().width;
          if (!available || !actual) return;
          if (actual > available - 2) {
            const initial = parseFloat(getComputedStyle(seasonEl).fontSize);
            seasonEl.style.fontSize = Math.max(12, initial * (available - 3) / actual * .985) + "px";
          }
        };
        let fitQueued = false;
        const queueFit = () => {
          if (fitQueued) return;
          fitQueued = true;
          requestAnimationFrame(() => { fitQueued = false; fitSeason(); });
        };
        queueFit();
        window.addEventListener("resize", queueFit, {passive:true});
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueFit);
        if (typeof ResizeObserver !== "undefined") {
          new ResizeObserver(queueFit).observe(left);
        }
      } else {
        console.warn("Editorial header skipped: JSON season/year differs from page URL", jsonData.season, year, season);
      }
      if (autoEditorial) {
        renderTierEditorial(jsonData, validPage ? tierArticleMetadata : null, tierLang);
        // Future shared language switch can invoke this without re-fetching JSON.
        document.addEventListener("offbeat:tier-editorial-language", event => {
          renderTierEditorial(jsonData, validPage ? tierArticleMetadata : null, event.detail === "ja" ? "ja" : "en");
        });
      }
      // v26 editorial image heading, restored for every seasonal week.
      // Earlier weekly HTML pages lack the caption node that Fall Week 01 has.
      const imageColumn = document.querySelector(".tierlist-image");
      let caption = imageColumn && imageColumn.querySelector(".tier-image-caption");
      if (imageColumn && !caption) {
        caption = document.createElement("div");
        caption.className = "tier-image-caption";
        caption.setAttribute("aria-label", "Tier list caption");
        imageColumn.insertBefore(caption, imageColumn.firstChild);
      }
      if (caption) {
        // Preserve v26's seasonal caption hierarchy, but use each page's
        // actual version (Mid-Season, Finale, Premiere) rather than a
        // hard-coded First Impression / Episode 1 label.
        const seasonLabel = match ? match[1] + " " + match[2] : String(jsonData.season || "");
        caption.textContent = seasonLabel + " Anime — " + String(jsonData.version || "Tier List").trim();
      }
      // Legacy JSON uses `date`, newer JSON uses `seasonDate`.
      const dateNode = document.getElementById("seasonDate");
      if (dateNode) dateNode.textContent = jsonData.seasonDate || jsonData.date || "";

    /* ============================
         2. Titles by Tier の生成
         ============================ */

      if (!jsonData.tiers) {
        console.error("No 'tiers' key found in JSON");
        return;
      }

      const tierSections = document.getElementById("tierSections");
      tierSections.innerHTML = ""; // 初期化

      for (const [tierName, titles] of Object.entries(jsonData.tiers)) {
        // 完全に空配列の場合だけスキップ
  if (!titles || (titles.length === 1 && titles[0].trim() === "")) {
    continue;
  }

        const section = document.createElement("div");
        section.className = "tier-section";

      // マッピング適用（classMapは外部スコープで定義されている想定）
        const normalizedClass = classMap[tierName.trim()] || tierName.trim().toLowerCase();

        const button = document.createElement("button");
        button.className = `toggle-button ${normalizedClass}-button`;
        button.textContent = tierName;
        button.addEventListener("click", function() {
          list.classList.toggle("hidden");
        });

        const list = document.createElement("ul");
        list.className = "tier-list hidden";

        if (titles.length === 1 && titles[0].toLowerCase() === "no entry") {
    // No entry でもボタンは作成、クリック時に表示
    const noEntryDiv = document.createElement("div");
  noEntryDiv.textContent = "No entry";
  noEntryDiv.className = "no-entry-text hidden"; // 初期状態で非表示

  section.appendChild(button);
  section.appendChild(noEntryDiv);
  tierSections.appendChild(section);

  // ボタンクリックで表示切替
  button.addEventListener("click", function() {
    noEntryDiv.classList.toggle("hidden");
  });

  continue;
  } else {

    // 通常のリスト表示

        titles.forEach(title => {
          const li = document.createElement("li");
          li.textContent = title;
          list.appendChild(li);
        });

        section.appendChild(button);
        section.appendChild(list);
  }  
        tierSections.appendChild(section);
      }
      if (autoEditorial && validPage) {
        const syncBoard = mountInteractiveTierBoard(jsonData, year, season);
        const originalHeading = heading.cloneNode(true);
        const enCaption=caption?.textContent||'';
        const rawDate=dateNode?.textContent||'';
        installTierLanguage(()=>{
          const ja=tierLang==='ja';
          // Keep approved hero hierarchy and season fitting in place, only replace text.
          const right=heading.querySelector('.fall-hero-right'),enRight=originalHeading.querySelector('.fall-hero-right');
          if(right&&enRight){right.replaceChildren(...Array.from(enRight.childNodes).map(n=>n.cloneNode(true)));if(ja){const ver=tierVersionJa(jsonData.version,week).split(' — ');const lines=right.querySelector('.fall-hero-lines');if(lines){const lead=document.createElement('span');lead.textContent=ver[0].replace(/ ティアリスト$/,'');const tier=document.createElement('span');tier.className='fall-hero-tier';tier.textContent='ティアリスト';lines.replaceChildren(lead,tier);}const episode=right.querySelector('.fall-hero-episode');if(episode&&ver[1])episode.textContent='— '+ver[1];}}
          const seasonName=({winter:'冬',spring:'春',summer:'夏',fall:'秋'})[season]||season;
          if(caption)caption.textContent=ja?`${year}年${seasonName}アニメ — ${tierVersionJa(jsonData.version,week)}`:enCaption;
          document.title=ja?`${year}年${seasonName} ${tierVersionJa(jsonData.version,week)}`:fullSeasonTitle;
          if(dateNode){const date=new Date(rawDate);dateNode.textContent=ja&&!isNaN(date)?new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric'}).format(date):rawDate;}
          const label=(sel,en,jp)=>{const node=document.querySelector(sel);if(node)node.textContent=tl(en,jp);};
          label('.nav-left','« Previous Tierlist','« 前のティアリスト');label('.nav-center','Anime Top','アニメトップ');label('.nav-right','Next Tierlist »','次のティアリスト »');
          label('.tierlist-titles-header','Titles by Tier (Tap / Click):','Tier別作品一覧（タップ／クリック）');
          label('.fall-hero-eyebrow-tier','TIER LIST','ティアリスト');
          syncBoard?.();window.dispatchEvent(new Event('resize'));
        });
      }
    })
    .catch(err => {
      console.error(err);
    });
}
});
// v23: accessible click-to-zoom image viewer (desktop and touch).
document.addEventListener("DOMContentLoaded",()=>{
 const img=document.getElementById("tierImage");if(!img)return;
 const viewer=document.createElement("div");viewer.className="tier-image-viewer";viewer.setAttribute("role","dialog");viewer.setAttribute("aria-label","Enlarged tier list image");viewer.setAttribute("aria-modal","true");
 viewer.innerHTML='<div class="tier-image-toolbar"><button type="button" data-action="minus" aria-label="Zoom out">−</button><span>Tier List · Zoom & pan</span><button type="button" data-action="plus" aria-label="Zoom in">+</button><button type="button" data-action="close">Close ×</button></div><div class="tier-image-scroll"><img alt="Enlarged tier list"></div>';
 document.body.append(viewer);const enlarged=viewer.querySelector("img"),scroll=viewer.querySelector(".tier-image-scroll");let zoom=window.innerWidth<=480?280:170;
 function setZoom(){enlarged.style.width=zoom+"%";}
 function close(){if(!viewer.classList.contains("is-open"))return;viewer.classList.remove("is-open");document.body.style.overflow="";}
 const isTouchLayout=()=>matchMedia("(hover:none), (pointer:coarse)").matches;
 function alignTierHeadings(){const caption=document.querySelector(".tier-image-caption"),header=document.querySelector(".tierlist-titles-header");if(!caption||!header)return;caption.style.minHeight="";header.style.minHeight="";const height=Math.max(caption.getBoundingClientRect().height,header.getBoundingClientRect().height);caption.style.minHeight=height+"px";header.style.minHeight=height+"px";}
 requestAnimationFrame(alignTierHeadings);window.addEventListener("resize",alignTierHeadings);
 // JSON is loaded asynchronously. Re-align once its missing caption is inserted.
 const imageColumnForHeading = document.querySelector(".tierlist-image");
 if (imageColumnForHeading && typeof MutationObserver !== "undefined") {
   const headingObserver = new MutationObserver(() => {
     if (imageColumnForHeading.querySelector(".tier-image-caption")) {
       headingObserver.disconnect();
       requestAnimationFrame(alignTierHeadings);
       if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignTierHeadings);
     }
   });
   if (!imageColumnForHeading.querySelector(".tier-image-caption")) {
     headingObserver.observe(imageColumnForHeading,{childList:true});
   } else if (document.fonts && document.fonts.ready) {
     document.fonts.ready.then(alignTierHeadings);
   }
 }
 const hint=document.createElement("p");
 hint.className="tier-image-touch-hint";
 hint.textContent=isTouchLayout()?"Tap to enlarge · Tap again for full-screen view":"Hover to enlarge · Click for full-screen zoom & pan";
 img.insertAdjacentElement("afterend",hint);

 function openViewer(){img.classList.remove("mobile-preview-zoom");enlarged.src=img.currentSrc||img.src;zoom=window.innerWidth<=480?280:170;setZoom();viewer.classList.add("is-open");document.body.style.overflow="hidden";scroll.scrollTop=0;scroll.scrollLeft=0;}
 img.addEventListener("click",()=>{if(isTouchLayout()&&!img.classList.contains("mobile-preview-zoom")){img.classList.add("mobile-preview-zoom");return;}openViewer();});
 document.addEventListener("click",e=>{if(!img.contains(e.target)&&!viewer.contains(e.target))img.classList.remove("mobile-preview-zoom");});
 viewer.addEventListener("click",e=>{const action=e.target?.dataset?.action;if(action==="close")close();else if(action==="plus"){zoom=Math.min(600,zoom+35);setZoom();}else if(action==="minus"){zoom=Math.max(100,zoom-35);setZoom();}else if(e.target===viewer)close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 if(matchMedia("(hover:hover) and (pointer:fine)").matches){img.addEventListener("mouseenter",()=>{const r=img.getBoundingClientRect();img.style.transformOrigin=window.innerWidth-r.right < r.width*.8?"right center":"left center";});}
});
