/* OFFBEAT Lineup Data R52 — shared, data-only weekly snapshot builder.
   Does not touch the DOM or modify any ranking JSON. Neither absence from
   a partial ranking nor a missing broadcast detail is a drop/no-air event. */
(function(global){
'use strict';
const key=v=>String(v??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const safeNumber=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const safeWeek=v=>{const m=String(v??'').match(/\b(?:week\s*)?0*(\d{1,2})\b/i);return m?Number(m[1]):null;};
const bcastSchema='animeb-broadcast-status-v1';
function compileSeason(master,weeklyByWeek){
 if(!master||!Array.isArray(master.items))throw Error('Lineup master.items is required');
 const masterByKv=new Map(),titleByKey=new Map(),warnings=[];
 for(const item of master.items){
  const kv=String(item?.kv||'').trim();
  if(!kv||masterByKv.has(kv))throw Error('Missing or duplicate lineup kv: '+kv);
  masterByKv.set(kv,item);
  for(const text of [item.title,item.jpTitle]){
   const k=key(text);if(!k)continue;
   if(titleByKey.has(k)&&titleByKey.get(k)!==kv)warnings.push('Ambiguous lineup title: '+text);
   else titleByKey.set(k,kv);
  }
 }
 const seasonName=master.seasonYear&&master.season?String(master.seasonYear)+' '+String(master.season).replace(/^./,s=>s.toUpperCase()):null;
 const byWeek=new Map();
 for(const [number,raw] of Object.entries(weeklyByWeek||{})){
  const week=Number(number);
  if(!Number.isInteger(week)||week<1||week>12){warnings.push('Skipped invalid week: '+number);continue;}
  if(!raw?.meta||!Array.isArray(raw.entries)){warnings.push('Invalid weekly JSON at Week '+week);continue;}
  const m=safeWeek(raw.meta.week);
  if(m!==week){warnings.push('Week label mismatch at Week '+week);continue;}
  if(seasonName && key(raw.meta.season)!==key(seasonName)){
   warnings.push('Season label mismatch at Week '+week);continue;
  }
  byWeek.set(week,raw);
 }
 const orderedWeeks=[...byWeek.keys()].sort((a,b)=>a-b);
 const droppedSince=new Map();const histories=Object.fromEntries([...masterByKv].map(([kv,item])=>[kv,{kv,title:item.title,jpTitle:item.jpTitle||'',weeks:[]} ]));
 const snapshots=[];
 function resolve(row,week,field){
  const kv=String(row?.kv||'').trim();
  if(kv&&masterByKv.has(kv))return kv;
  const named=titleByKey.get(key(row?.title||row?.jpTitle));
  if(named)return named;
  warnings.push('Week '+week+' unrecognized '+field+': '+(row?.title||kv||'(empty)'));
  return null;
 }
 for(const week of orderedWeeks){
  const raw=byWeek.get(week),meta=raw.meta,status=meta.status||{},ref=meta.weekly_ranking_reference?.entries;
  const complete=Array.isArray(ref);
  const rankRows=complete?ref:raw.entries.filter(e=>typeof e.rank==='number');
  const rating=new Map(),broadcast=new Map(),decisions=new Map();
  for(const r of rankRows){const kv=resolve(r,week,'ranking');if(kv && !rating.has(kv))rating.set(kv,r);}
  for(const kv of rating.keys()) if(droppedSince.has(kv) && droppedSince.get(kv)<week) droppedSince.delete(kv);
  for(const d of meta.drop_decisions||[]){const kv=resolve(d,week,'drop_decisions');if(kv){
    decisions.set(kv,d);if(!droppedSince.has(kv))droppedSince.set(kv,week);
  }}
  const bcast=meta.broadcast_status;
  if(bcast?.schema===bcastSchema&&Array.isArray(bcast.items)){
    for(const entry of bcast.items){const kv=resolve(entry,week,'broadcast_status');if(kv)broadcast.set(kv,entry);}
  }else if(bcast)warnings.push('Week '+week+' unsupported broadcast_status schema');
  const notedNoAir=[...broadcast.values()].filter(v=>v.status==='no_air').length;
  if(Number(status.noAir)>notedNoAir){
    warnings.push('Week '+week+': noAir='+status.noAir+' but only '+notedNoAir+' title-specific NO AIR records; do not infer identities');
  }
  const notedHalted=[...broadcast.values()].filter(v=>v.status==='season_halted').length;
  if(Number(status.seasonHalted)>notedHalted){
    warnings.push('Week '+week+': seasonHalted='+status.seasonHalted+' but only '+notedHalted+' title-specific halted records');
  }
  if(Number.isInteger(status.ratedThisWeek)&&complete&&status.ratedThisWeek!==ref.length)
    warnings.push('Week '+week+': ratedThisWeek '+status.ratedThisWeek+' != reference '+ref.length);
  const records={};
  for(const [kv,item] of masterByKv){
    const r=rating.get(kv),d=decisions.get(kv),b=broadcast.get(kv);
    const current={week,kv,rank:safeNumber(r?.rank),wrp_score:safeNumber(r?.wrp_score),score:safeNumber(r?.score),episode:r?.episode??null,
      participantCount:complete?ref.length:null,
      rankingCoverage:complete?'full_reference':'partial_entries',
      rankingState:r?'rated':(complete?'not_ranked':'unknown'),
      droppedAfterWeek:droppedSince.get(kv)??null,
      dropDecidedThisWeek:!!d,
      dropMode:d?.mode||null,
      broadcast:b?{status:b.status,resume:b.resume||'unknown',resume_date:b.resume_date||'',note:{en:b.note?.en||'',ja:b.note?.ja||''}}:null};
    records[kv]=current;histories[kv].weeks.push(current);
  }
  snapshots.push({week,status,records,hasFullRankingReference:complete});
 }
 return {season:seasonName,keys:[...masterByKv.keys()],weeks:orderedWeeks,snapshots,histories,warnings};
}
function pathFor(year,season,week){const sea=String(season).toLowerCase(),w=String(week).padStart(2,'0');return `ranking/${year}/${sea}/week${w}/ranking-week${w}-${sea}${year}.json`;}
async function loadPublishedSeason({baseUrl=document.baseURI,masterUrl=null,year=2026,season='Fall',fetchImpl=fetch}={}){
 masterUrl=masterUrl||`assets/data/offbeat-season-${year}-${String(season).toLowerCase()}.json`;
 const fetchJSON=async path=>{const response=await fetchImpl(new URL(path,baseUrl),{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status+': '+path);return response.json();};
 const [master,index]=await Promise.all([fetchJSON(masterUrl),fetchJSON('weekly-rankings.json')]);
 const recorded=index?.[String(year)]?.[season]?.weeks||[];const numbers=[...new Set(recorded.map(safeWeek).filter(n=>Number.isInteger(n)&&n>=1&&n<=12))].sort((a,b)=>a-b);
 const load=await Promise.all(numbers.map(async week=>{try{return [week,await fetchJSON(pathFor(year,season,week)),null];}catch(error){return [week,null,String(error)];}}));
 const missing=load.filter(([,v])=>!v).map(([week,,why])=>`Week ${week}: ${why}`);
 const compiled=compileSeason(master,Object.fromEntries(load.filter(([,v])=>v).map(([w,v])=>[w,v])));
 return {...compiled,warnings:[...compiled.warnings,...missing],missingWeeks:missing};
}
// Main-season weekly WRP only; no PRELIM, no zero for absent weeks.
const groups=['leading','contenders','chasing','struggling','lower','unrated','dropped','halted'];
const tags=['in-form','rising','cooling','consistent','volatile','breakthrough','winner'];
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
function analyze(history,week){
 const records=(history?.weeks||[]).filter(r=>r.week<=week).sort((a,b)=>a.week-b.week);
 const rated=records.filter(r=>Number.isFinite(r.wrp_score)&&r.rank!=null);
 const values=rated.map(r=>r.wrp_score*10), n=values.length;
 const mean=avg(values), recent=n>=2?avg(values.slice(-2)):null;
 const previous=n>=4?avg(values.slice(-4,-2)):null;
 const change=previous==null?null:recent-previous;
 const sd=n>=4?Math.sqrt(avg(values.map(x=>(x-mean)**2))):null;
 const ranked=rated.map(r=>r.rank), current=records.find(r=>r.week===week);
 const wins=ranked.filter(r=>r===1).length, top3=ranked.filter(r=>r<=3).length;
 const fraction=r=>Number.isFinite(r.participantCount)&&r.participantCount>1?(r.participantCount-r.rank)/(r.participantCount-1):null;
 const recentRank=rated.slice(-2).map(fraction), priorRank=rated.slice(-4,-2).map(fraction);
 const comparison=recentRank.length===2&&priorRank.length===2&&[...recentRank,...priorRank].every(Number.isFinite)?avg(recentRank)-avg(priorRank):null;
 const scoreGroup=mean==null?'unrated':mean>=85-1e-9?'leading':mean>=80-1e-9?'contenders':mean>=74-1e-9?'chasing':mean>=70-1e-9?'struggling':'lower';
 const group=current?.droppedAfterWeek!=null&&current.droppedAfterWeek<=week?'dropped':current?.broadcast?.status==='season_halted'?'halted':scoreGroup;
 const features=[];
 // Stale results remain visible in the history but are not described as current form.
 const fresh=n>=2&&week-rated.at(-1).week<=1;
 if(fresh&&recent>=85-1e-9)features.push('in-form');
 if(fresh&&change!=null&&change>=5-1e-9)features.push('rising');
 if(fresh&&change!=null&&change<=-5+1e-9)features.push('cooling');
 if(sd!=null&&sd<=3)features.push('consistent');
 if(sd!=null&&sd>=8)features.push('volatile');
 if(fresh&&n>=4&&week>=4&&mean>=70&&mean<80&&top3===0&&recent<85&&change<5)features.push('breakthrough');
 if(wins)features.push('winner');
 return {records,rated,n,mean,recent,previous,change,sd,wins,top3,best:n?Math.min(...ranked):null,group,scoreGroup,features,current,comparison};
}
global.OFFBEAT_LINEUP_DATA_R52=Object.freeze({compileSeason,loadPublishedSeason,pathFor,analyze,groups,tags});
})(window);
