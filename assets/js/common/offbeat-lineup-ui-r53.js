/* OFFBEAT Anime Home R53 — live 34-title lineup controls, no mock assignments.
 * Uses R52's published weekly snapshot service and the existing R3 poster DOM.
 * Does not touch the ranking JSON, genre filter or modal handlers.
 */
(() => {
'use strict';
const engine=window.OFFBEAT_LINEUP_DATA_R52;
const grid=document.getElementById('obLineupGridR3');
if(!engine || !grid)return;
const parent=grid.parentElement;
const seasonalRoot=document.getElementById('obSeasonExperienceR3');
if(!parent||!seasonalRoot)return;
const KEY='offbeat-lineup-r53-2026-fall';
const state={order:'fixed',show:true,week:0};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
 if(saved.order==='grouped')state.order='grouped';
 if(typeof saved.show==='boolean')state.show=saved.show;
 if(Number.isInteger(saved.week)&&saved.week>=1&&saved.week<=12)state.week=saved.week;
}catch(_){}
const ui=document.createElement('div');ui.className='ob-r53-controls';ui.id='obLineupControlsR53';ui.hidden=true;
const weekWrap=document.createElement('label');weekWrap.className='ob-r53-week-wrap';
const weekText=document.createElement('span');weekText.className='ob-r53-caption';
const weekSelect=document.createElement('select');weekSelect.id='obR53LineupWeek';weekSelect.setAttribute('aria-label','Lineup week');
weekWrap.append(weekText,weekSelect);
const orderWrap=document.createElement('div');orderWrap.className='ob-r53-control-group';
const orderText=document.createElement('span');orderText.className='ob-r53-caption';
const fixed=document.createElement('button');fixed.type='button';fixed.dataset.r53Order='fixed';
const grouped=document.createElement('button');grouped.type='button';grouped.dataset.r53Order='grouped';
orderWrap.append(orderText,fixed,grouped);
const viewWrap=document.createElement('div');viewWrap.className='ob-r53-control-group';
const viewText=document.createElement('span');viewText.className='ob-r53-caption';
const on=document.createElement('button');on.type='button';on.dataset.r53Show='true';
const off=document.createElement('button');off.type='button';off.dataset.r53Show='false';
viewWrap.append(viewText,on,off);
ui.append(weekWrap,orderWrap,viewWrap);
const info=document.createElement('p');info.className='ob-r53-readout';info.id='obLineupReadoutR53';info.hidden=true;
// Place controls under the existing genre bar (regardless of which script mounts first).
grid.before(ui);grid.after(info);
function positionControls(){
 const genre=document.getElementById('obLiveLineupExploreR4');
 if(genre&&genre.parentElement===parent&&genre.nextElementSibling!==ui)genre.after(ui);
}
new MutationObserver(positionControls).observe(parent,{childList:true});
positionControls();
function locale(){return seasonalRoot.lang==='ja'?'ja':'en';}
function l(ja,en){return locale()==='ja'?ja:en;}
let season=null,byWeek=new Map(),masterOrder=new Map(),busy=false,renderQueued=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}
function translate(){
 weekText.textContent=l('週','WEEK');orderText.textContent=l('並び順','ORDER');viewText.textContent=l('状態表示','STATUS');
 fixed.textContent=l('元の順','Fixed');grouped.textContent=l('グループ順','Grouped');
 on.textContent='ON';off.textContent='OFF';
 for(const [b,active] of [[fixed,state.order==='fixed'],[grouped,state.order==='grouped'],[on,state.show],[off,!state.show]]){
  b.setAttribute('aria-pressed',String(active));
 }
 weekSelect.setAttribute('aria-label',l('ラインナップの対象週','Lineup snapshot week'));
}
function cardList(){return Array.from(grid.children).filter(v=>v.classList.contains('ob-lineup-item'));}
function effectiveRec(kv,snap){return snap?.records?.[kv]||null;}
function classFor(rec){
 if(!rec)return 'none';
 if(rec.droppedAfterWeek!=null && rec.droppedAfterWeek<=state.week)return 'dropped';
 if(rec.broadcast?.status==='season_halted')return 'halted';
 if(rec.broadcast?.status==='no_air')return 'no-air';
 if(Number.isFinite(rec.rank))return rec.rank<=10?'top10':'ranked';
 return 'unrated';
}
function orderKey(b,snap){
 const k=b.dataset.obLineupKv||'',r=effectiveRec(k,snap),type=classFor(r);
 const classOrder={top10:0,ranked:1,unrated:2,'no-air':2,halted:2,none:2,dropped:3};
 const order=classOrder[type]??2;
 const rnk=Number.isFinite(r?.rank)?r.rank:999;
 return [order,rnk,masterOrder.get(k)??999];
}
function applyCard(b,snap){
 const kv=b.dataset.obLineupKv||'',rec=effectiveRec(kv,snap);
 b.classList.remove('ob-r53-top10','ob-r53-ranked','ob-r53-dropped','ob-r53-no-air','ob-r53-halted','ob-r53-status-off');
 b.querySelectorAll(':scope > .ob-r53-mark').forEach(n=>n.remove());
 const base=b.querySelector('img')?.alt||b.getAttribute('aria-label')||'';
 const type=classFor(rec);
 if(!state.show){b.classList.add('ob-r53-status-off');b.title=base;return;}
 if(type==='dropped'){
  b.classList.add('ob-r53-dropped');
  const mark=document.createElement('span');mark.className='ob-r53-mark ob-r53-x';mark.textContent='×';mark.setAttribute('aria-hidden','true');b.append(mark);
  b.title=`${base} · ${l('W'+String(rec.droppedAfterWeek).padStart(2,'0')+'にドロップを決定','Dropped after W'+String(rec.droppedAfterWeek).padStart(2,'0'))}`;
 }else if(type==='no-air'||type==='halted'){
  b.classList.add(type==='no-air'?'ob-r53-no-air':'ob-r53-halted');
  const mark=document.createElement('span');mark.className='ob-r53-mark ob-r53-flag';mark.textContent=type==='no-air'?'PAUSE':'HALT';mark.setAttribute('aria-hidden','true');b.append(mark);
  b.title=base+' · '+(type==='no-air'?l('今週放送なし','No air this week'):l('シーズン中断','Season halted'));
 }else if(type==='top10'||type==='ranked'){
  b.classList.add(type==='top10'?'ob-r53-top10':'ob-r53-ranked');
  const mark=document.createElement('span');mark.className='ob-r53-mark ob-r53-rank';const pound=document.createElement('span');pound.className='ob-r53-pound';pound.textContent='#';mark.append(pound,String(rec.rank));mark.setAttribute('aria-hidden','true');b.append(mark);
  b.title=base+' · W'+String(state.week).padStart(2,'0')+' #'+rec.rank;
 }else b.title=base;
}
function updateInfo(snap){
 if(!snap){info.hidden=true;return;}
 const ranked=Object.values(snap.records).filter(x=>x.rank!=null).length;
 const drops=Object.values(snap.records).filter(x=>x.droppedAfterWeek!=null && x.droppedAfterWeek<=state.week).length;
 const noAir=Number(snap.status?.noAir)||0;
 const known=Object.values(snap.records).filter(x=>x.broadcast?.status==='no_air').length;
 const unavailable=noAir>known;
 const text=l(`W${String(state.week).padStart(2,'0')} · 評価記録 ${ranked}作品 · ドロップ決定済み ${drops}作品`,
             `W${String(state.week).padStart(2,'0')} · ${ranked} ranked · ${drops} dropped (decisions included)`);
 let tail='';
 if(unavailable) tail=l(` · 放送なし ${noAir}作品（作品別情報未登録）`,` · ${noAir} no-air titles (identities not yet registered)`);
 const mode=state.order==='grouped'?l(' · その週の順位・視聴状況でグループ化（編集的Tier分けではありません）',' · Grouped by this week’s ranking/availability, not editorial tiers'):'';
 info.textContent=text+tail+mode;
 info.hidden=false;
}
function render(){
 positionControls();
 if(!season||busy)return;
 const snap=byWeek.get(state.week);
 if(!snap)return;
 const cards=cardList();
 if(cards.length!==masterOrder.size)return; // waiting for R3's asynchronous re-render
 busy=true;
 try{
  // Never derive card identity from its position: KV is added by R52.
  if(cards.some(b=>!masterOrder.has(b.dataset.obLineupKv)))throw Error('A poster is missing its master KV');
  const sorted=cards.slice().sort((a,b)=>{
   if(state.order==='fixed')return masterOrder.get(a.dataset.obLineupKv)-masterOrder.get(b.dataset.obLineupKv);
   const ak=orderKey(a,snap),bk=orderKey(b,snap);
   for(let i=0;i<ak.length;i++)if(ak[i]!==bk[i])return ak[i]-bk[i];
   return 0;
  });
  if(sorted.some((v,i)=>v!==cards[i]))grid.append(...sorted);
  for(const b of sorted)applyCard(b,snap);
  translate();updateInfo(snap);
 }catch(error){console.warn('OFFBEAT R53 lineup controls disabled to protect original layout:',error);ui.hidden=true;info.hidden=true;}
 finally{busy=false;}
}
function schedule(){if(renderQueued)return;renderQueued=true;queueMicrotask(()=>{renderQueued=false;render();});}
const observer=new MutationObserver(mutations=>{if(busy)return; if(mutations.some(m=>m.type==='childList'))schedule();});
observer.observe(grid,{childList:true});
const localeObserver=new MutationObserver(()=>schedule());
localeObserver.observe(seasonalRoot,{attributes:true,attributeFilter:['lang']});
function change(fn){fn();save();render();}
fixed.addEventListener('click',()=>change(()=>state.order='fixed'));
grouped.addEventListener('click',()=>change(()=>{
 state.order='grouped';
 // A grouped view should reveal all groups; existing Expand logic remains responsible.
 if(!grid.classList.contains('is-expanded'))document.getElementById('obLineupExpandR3')?.click();
}));
on.addEventListener('click',()=>change(()=>state.show=true));
off.addEventListener('click',()=>change(()=>state.show=false));
weekSelect.addEventListener('change',()=>change(()=>state.week=Number(weekSelect.value)));
translate();
engine.loadPublishedSeason({year:2026,season:'Fall'}).then(result=>{
 if(!result.weeks?.length||result.keys.length!==34)throw Error('Incomplete published lineup data');
 season=result;byWeek=new Map(result.snapshots.map(s=>[s.week,s]));
 masterOrder=new Map(result.keys.map((k,i)=>[k,i]));
 if(!byWeek.has(state.week))state.week=result.weeks.at(-1);
 weekSelect.replaceChildren(...result.weeks.map(w=>new Option('W'+String(w).padStart(2,'0'),String(w))));
 weekSelect.value=String(state.week);
 save();ui.hidden=false;render();
 if(result.warnings.length)console.warn('OFFBEAT R53 snapshot data warnings:',result.warnings);
}).catch(err=>{console.warn('OFFBEAT R53 disabled; original 34-poster lineup remains intact.',err);ui.hidden=true;info.hidden=true;});
})();
