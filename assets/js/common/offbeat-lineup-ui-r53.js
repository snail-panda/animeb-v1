/* OFFBEAT Anime Home R95 — main-season grouping and performance history.
 * Uses R52 published weekly snapshots and the existing R3 poster and modal DOM.
 * Genre owns the hidden attribute; performance filtering uses a separate class.
 */
(() => {
'use strict';
const engine=window.OFFBEAT_LINEUP_DATA_R52;
const grid=document.getElementById('obLineupGridR3');
if(!engine || !grid)return;
const parent=grid.parentElement;
const seasonalRoot=document.getElementById('obSeasonExperienceR3');
if(!parent||!seasonalRoot)return;
const KEY='offbeat-lineup-r95-2026-fall';
const state={order:'fixed',show:true,week:0,group:'all',form:'all'};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
 if(saved.order==='grouped')state.order='grouped';
 if(typeof saved.show==='boolean')state.show=saved.show;
 if(Number.isInteger(saved.week)&&saved.week>=1&&saved.week<=12)state.week=saved.week;
 if(engine.groups.includes(saved.group))state.group=saved.group;
 if(engine.tags.includes(saved.form))state.form=saved.form;
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
const groupNames={leading:['Leading Titles','トップランナー'],contenders:['Contenders','有力作品'],chasing:['Chasing Pack','追走集団'],struggling:['Struggling Titles','苦戦中'],lower:['Lower Tier','下位グループ'],unrated:['No Rating Recorded','評価記録なし'],dropped:['Dropped','ドロップ'],halted:['Season Halted','シーズン中断']};
const tagNames={'in-form':['In Form','好調'],rising:['Rising','上昇傾向'],cooling:['Cooling Down','下降傾向'],consistent:['Consistent','安定'],volatile:['Volatile','浮き沈みが大きい'],breakthrough:['Seeking a Breakthrough','突破口を模索中'],winner:['Weekly Winner','週間1位経験']};
function makeFilter(id){const wrap=document.createElement('label');wrap.className='ob-r53-week-wrap';const caption=document.createElement('span');caption.className='ob-r53-caption';const select=document.createElement('select');select.id=id;wrap.append(caption,select);return {wrap,caption,select};}
const groupFilter=makeFilter('obR95Group'),formFilter=makeFilter('obR95Form');
ui.append(weekWrap,orderWrap,viewWrap,groupFilter.wrap,formFilter.wrap);
const headings=new Map();
for(const group of engine.groups){const h=document.createElement('h4');h.className='ob-r95-group-head';headings.set(group,h);}
const empty=document.createElement('div');empty.className='ob-r95-no-results';empty.hidden=true;
const expand=document.getElementById('obLineupExpandR3');
const overlay=document.getElementById('obSeasonOverlayR3');
const panel=document.createElement('section');panel.className='ob-r95-performance';panel.hidden=true;overlay?.querySelector('.ob-season-dialog-r3')?.append(panel);
function node(tag,cl,text){const x=document.createElement(tag);if(cl)x.className=cl;if(text!=null)x.textContent=text;return x;}
function groupLabel(g){return l(groupNames[g]?.[1]||g,groupNames[g]?.[0]||g);}
function tagLabel(t){return l(tagNames[t]?.[1]||t,tagNames[t]?.[0]||t);}
function filterOptions(control,values,labels,caption,all,selected){control.caption.textContent=caption;control.select.setAttribute('aria-label',caption);const opts=[new Option(all,'all'),...values.map(v=>new Option(labels(v),v))];control.select.replaceChildren(...opts);control.select.value=selected;}
let stats=new Map();
function currentWeek(){return state.week||season?.weeks.at(-1)||0;}
function numeric(v,d=1){return v==null?'—':v.toFixed(d);}
function weekName(w){return 'W'+String(w).padStart(2,'0');}

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
 if(season){weekSelect.options[0].textContent=l('最新','Latest')+' · '+weekName(season.weeks.at(-1));}
 filterOptions(groupFilter,engine.groups,groupLabel,l('グループ','GROUP'),l('すべて','All groups'),state.group);
 filterOptions(formFilter,engine.tags,tagLabel,l('傾向・特徴','FORM'),l('すべて','All forms'),state.form);
}
function cardList(){return Array.from(grid.children).filter(v=>v.classList.contains('ob-lineup-item'));}
function effectiveRec(kv,snap){return snap?.records?.[kv]||null;}
function classFor(rec){
 if(!rec)return 'none';
 if(rec.droppedAfterWeek!=null && rec.droppedAfterWeek<=currentWeek())return 'dropped';
 if(rec.broadcast?.status==='season_halted')return 'halted';
 if(rec.broadcast?.status==='no_air')return 'no-air';
 if(Number.isFinite(rec.rank))return rec.rank<=10?'top10':'ranked';
 return 'unrated';
}
function orderKey(b){
 const k=b.dataset.obLineupKv||'',a=stats.get(k);
 return [engine.groups.indexOf(a?.group),-(a?.mean??-1),masterOrder.get(k)??999];
}
function matches(b){const a=stats.get(b.dataset.obLineupKv);return (state.group==='all'||a?.group===state.group)&&(state.form==='all'||a?.features.includes(state.form));}
function filteredView(){return state.order==='grouped'||state.group!=='all'||state.form!=='all';}
function updateGroupCounts(){
 const cards=cardList(), counts=new Map();let shown=0;
 for(const b of cards)if(!b.hidden&&!b.classList.contains('ob-r95-filtered')){const group=stats.get(b.dataset.obLineupKv)?.group;counts.set(group,(counts.get(group)||0)+1);shown++;}
 for(const [g,h] of headings){const n=counts.get(g)||0;h.hidden=!n;const name=groupLabel(g),range={leading:'85–100',contenders:'80–<85',chasing:'74–<80',struggling:'70–<74',lower:'<70'}[g],count=(range?range+' · ':'')+l(`${n}作品`,`${n} ${n===1?'title':'titles'}`);const label=node('span','',name),detail=node('span','ob-r95-group-count',count);if(h.textContent!==name+count)h.replaceChildren(label,detail);}
 empty.textContent=l('条件に一致する作品がありません。','No titles match these filters.');empty.hidden=shown!==0;
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
  b.title=base+' · W'+String(currentWeek()).padStart(2,'0')+' #'+rec.rank;
 }else b.title=base;
}
function updateInfo(snap){
 if(!snap){info.hidden=true;return;}
 const ranked=Object.values(snap.records).filter(x=>x.rank!=null).length;
 const drops=Object.values(snap.records).filter(x=>x.droppedAfterWeek!=null && x.droppedAfterWeek<=currentWeek()).length;
 const noAir=Number(snap.status?.noAir)||0;
 const known=Object.values(snap.records).filter(x=>x.broadcast?.status==='no_air').length;
 const unavailable=noAir>known;
 const text=l(`W${String(currentWeek()).padStart(2,'0')} · 評価記録 ${ranked}作品 · ドロップ決定済み ${drops}作品`,
             `W${String(currentWeek()).padStart(2,'0')} · ${ranked} ranked · ${drops} dropped (decisions included)`);
 let tail='';
 if(Number.isInteger(snap.status?.droppedTotal)&&snap.status.droppedTotal!==drops)tail+=l(` · 公式ドロップ累計 ${snap.status.droppedTotal}作品（確認済み ${drops}）`,` · ${snap.status.droppedTotal} total drops (${drops} identified)`);
 if(unavailable) tail+=l(` · 放送なし ${noAir}作品（作品別情報未登録）`,` · ${noAir} no-air titles (identities not yet registered)`);
 const mode=state.order==='grouped'||state.group!=='all'||state.form!=='all'?l(' · 本戦の平均WRPで分類（予選除外）',' · Groups by main-season average WRP (PRELIM excluded)'):'';
 if(season.missingWeeks?.length||season.weeks.filter(w=>w<=currentWeek()).length<currentWeek()||season.snapshots.some(s=>s.week<=currentWeek()&&!s.hasFullRankingReference))tail+=l(' · 一部の週のデータが不足しています',' · Some weekly data is incomplete');
 info.textContent=text+tail+mode;
 info.hidden=false;
}
function render(){
 positionControls();
 if(!season||busy)return;
 const snap=byWeek.get(currentWeek());
 if(!snap)return;
 const cards=cardList();
 if(cards.length!==masterOrder.size)return; // waiting for R3's asynchronous re-render
 busy=true;
 try{
  // Never derive card identity from its position: KV is added by R52.
  if(cards.some(b=>!masterOrder.has(b.dataset.obLineupKv)))throw Error('A poster is missing its master KV');
  stats=new Map(season.keys.map(k=>[k,engine.analyze(season.histories[k],currentWeek())]));
  const sorted=cards.slice().sort((a,b)=>{
   if(state.order==='fixed')return masterOrder.get(a.dataset.obLineupKv)-masterOrder.get(b.dataset.obLineupKv);
   const ak=orderKey(a),bk=orderKey(b);
   for(let i=0;i<ak.length;i++)if(ak[i]!==bk[i])return ak[i]-bk[i];
   return 0;
  });
  const expanded=filteredView();
  const desired=[];
  if(state.order==='grouped'){
   for(const g of engine.groups){const members=sorted.filter(b=>stats.get(b.dataset.obLineupKv)?.group===g);if(members.length)desired.push(headings.get(g),...members);}
  }else desired.push(...sorted);
  desired.push(empty);
  if(expanded&&!grid.classList.contains('is-expanded'))expand?.click();
  if(expand)expand.hidden=expanded;
  grid.classList.toggle('ob-r95-grouped',state.order==='grouped');
  const children=[...grid.children];
  if(desired.length!==children.length||desired.some((v,i)=>v!==children[i])){
   for(const h of headings.values())if(h.parentElement===grid&&!desired.includes(h))h.remove();
   grid.append(...desired);
  }
  for(const b of sorted){b.classList.toggle('ob-r95-filtered',!matches(b));applyCard(b,snap);}
  translate();updateInfo(snap);updateGroupCounts();renderPerformance();
 }catch(error){console.warn('OFFBEAT R53 lineup controls disabled to protect original layout:',error);ui.hidden=true;info.hidden=true;}
 finally{busy=false;}
}
function schedule(){if(renderQueued)return;renderQueued=true;queueMicrotask(()=>{renderQueued=false;render();});}
const observer=new MutationObserver(mutations=>{if(busy)return; if(mutations.some(m=>m.type==='childList'))schedule();});
observer.observe(grid,{childList:true});
const visibilityObserver=new MutationObserver(m=>{if(m.some(x=>x.target.classList.contains('ob-lineup-item')))updateGroupCounts();});
visibilityObserver.observe(grid,{subtree:true,attributes:true,attributeFilter:['hidden']});
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
groupFilter.select.addEventListener('change',()=>change(()=>state.group=groupFilter.select.value));
formFilter.select.addEventListener('change',()=>change(()=>state.form=formFilter.select.value));
if(overlay)new MutationObserver(()=>renderPerformance()).observe(overlay,{attributes:true,attributeFilter:['hidden','lang','data-ob-lineup-kv']});
function chart(a,kind){
 const score=kind==='score',label=score?l('週間WRP','Weekly WRP'):l('週間順位','Weekly rank');
 const box=node('div','ob-r95-chart');box.append(node('h5','',label));
 const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 320 126');svg.setAttribute('role','img');svg.setAttribute('aria-label',label);
 function draw(tag,attrs,text){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!=null)e.textContent=text;svg.append(e);return e;}
 const top=12,bottom=96,left=26,right=306, maxRank=Math.max(2,...a.records.map(r=>r.participantCount||r.rank||0));
 const x=w=>left+(right-left)*(w-1)/11;
 const y=v=>score?bottom-(bottom-top)*v/100:top+(bottom-top)*(v-1)/(maxRank-1);
 const ticks=score?[100,75,50,25,0]:[1,Math.round((maxRank+1)/2),maxRank];
 for(const t of [...new Set(ticks)]){draw('line',{x1:left,x2:right,y1:y(t),y2:y(t),class:'ob-r95-gridline'});draw('text',{x:left-5,y:y(t)+3,'text-anchor':'end',class:'ob-r95-chart-label'},t);}
 for(let w=1;w<=12;w++)draw('text',{x:x(w),y:110,'text-anchor':'middle',class:'ob-r95-chart-label'},String(w).padStart(2,'0'));
 let last=null;
 for(const r of a.records){const v=score?(Number.isFinite(r.wrp_score)?r.wrp_score*10:null):r.rank;if(v==null){last=null;continue;}const next={w:r.week,v};if(last&&last.w+1===next.w)draw('line',{x1:x(last.w),y1:y(last.v),x2:x(next.w),y2:y(next.v),class:'ob-r95-series'});const dot=draw('circle',{cx:x(next.w),cy:y(next.v),r:3,class:'ob-r95-point'});const title=document.createElementNS(NS,'title');title.textContent=weekName(r.week)+' · '+(score?numeric(v):'#'+v+(r.participantCount?' / '+r.participantCount:''));dot.append(title);last=next;}
 box.append(svg);return box;
}
function renderPerformance(){
 if(!overlay||overlay.hidden||!season)return;
 const a=stats.get(overlay.dataset.obLineupKv);if(!a){panel.hidden=true;return;}
 panel.replaceChildren();panel.hidden=false;
 const header=node('div','ob-r95-performance-head');header.append(node('h4','',l('今期の成績','Season Performance')),node('span','',l('本戦 W01〜','Main season W01–')+weekName(currentWeek())));panel.append(header);
 const summary=node('div','ob-r95-summary');
 for(const [name,value] of [[l('平均WRP','Average WRP'),numeric(a.mean,2)],[l('選択週順位','Selected week rank'),a.current?.rank==null?'—':'#'+a.current.rank+(a.current.participantCount?' / '+a.current.participantCount:'')],[l('最高順位','Best rank'),a.best==null?'—':'#'+a.best],[l('TOP 3入り','Top 3 finishes'),String(a.top3)],[l('直近2回','Last 2 WRP'),numeric(a.recent)],[l('直近の変化','Recent change'),a.change==null?'—':(a.change>0?'+':'')+numeric(a.change)]]){const metric=node('div','ob-r95-metric');metric.append(node('span','',name),node('strong','',value));summary.append(metric);}panel.append(summary);
 const badges=node('div','ob-r95-tags');badges.append(node('span','ob-r95-tag ob-r95-primary',groupLabel(a.group)));for(const t of a.features)badges.append(node('span','ob-r95-tag',tagLabel(t)));panel.append(badges);
 if(a.current?.rank==null&&a.current?.droppedAfterWeek==null&&!a.current?.broadcast)panel.append(node('div','ob-r95-detail-note',l('選択週の評価・個別の放送状況は未記録。過去の評価に基づく分類です。','Selected week has no rating or title-specific broadcast record. Group is based on earlier ratings.')));
 panel.append(node('div','ob-r95-detail-note',l(`${a.n}回評価 · WRPは100点換算 · 直近の変化：最近2回とその前2回の比較`,`${a.n} rated · WRP out of 100 · Recent change compares last 2 vs previous 2 ratings`)));
 if(a.comparison!=null)panel.append(node('div','ob-r95-detail-note',l('相対順位の変化：','Relative rank change: ')+(a.comparison>0?'+':'')+numeric(a.comparison*100)+' '+l('ポイント','pp')));
 if(a.n){const charts=node('div','ob-r95-charts');charts.append(chart(a,'score'),chart(a,'rank'));panel.append(charts);}
 const table=node('table','ob-r95-history');const thead=node('thead'),hr=node('tr');for(const name of [l('週','Week'),l('順位 / 評価数','Rank / field'),'WRP',l('状態','Status')])hr.append(node('th','',name));thead.append(hr);table.append(thead);const tbody=node('tbody');
 for(let w=1;w<=currentWeek();w++){const r=a.records.find(x=>x.week===w),tr=node('tr');const status=!r?l('データなし','Data missing'):r.dropDecidedThisWeek?l('ドロップ決定','Drop decided'):r.droppedAfterWeek!=null?l('ドロップ','Dropped'):r.broadcast?.status==='no_air'?l('放送なし','No air'):r.broadcast?.status==='season_halted'?l('中断','Halted'):r.rank!=null?l('評価済み','Rated'):l('評価記録なし','No rating recorded');for(const v of [weekName(w),r?.rank!=null?'#'+r.rank+(r.participantCount?' / '+r.participantCount:''):'—',numeric(r?.wrp_score==null?null:r.wrp_score*10),status])tr.append(node('td','',v));tbody.append(tr);}table.append(tbody);panel.append(table);
}

translate();
engine.loadPublishedSeason({year:2026,season:'Fall'}).then(result=>{
 if(!result.weeks?.length||result.keys.length!==34)throw Error('Incomplete published lineup data');
 season=result;byWeek=new Map(result.snapshots.map(s=>[s.week,s]));
 masterOrder=new Map(result.keys.map((k,i)=>[k,i]));
 if(state.week&&!byWeek.has(state.week))state.week=0;
 weekSelect.replaceChildren(new Option('Latest','0'),...result.weeks.map(w=>new Option('W'+String(w).padStart(2,'0'),String(w))));
 weekSelect.value=String(state.week);
 save();ui.hidden=false;render();
 if(result.warnings.length)console.warn('OFFBEAT R53 snapshot data warnings:',result.warnings);
}).catch(err=>{console.warn('OFFBEAT R53 disabled; original 34-poster lineup remains intact.',err);ui.hidden=true;info.hidden=true;});
})();
