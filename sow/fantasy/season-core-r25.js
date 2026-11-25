/* S.O.W. Fantasy — twelve-round season core, R2.5. Pure computations; no DOM or localStorage. */
(function(global){'use strict';
 function normalizePublishedWeek(raw,expectedWeek){
  if(!raw||!raw.meta||!raw.meta.weekly_ranking_reference||!Array.isArray(raw.meta.weekly_ranking_reference.entries))throw Error('Missing full ranking reference');
  const match=String(raw.meta.week||'').match(/\d+/),wk=match?Number(match[0]):NaN;
  if(wk!==expectedWeek)throw Error('Wrong ranking week');
  const input=raw.meta.weekly_ranking_reference.entries;
  const declared=Number(raw.meta.status?.ratedThisWeek??input.length);
  if(!Number.isInteger(declared)||declared<1||input.length!==declared)throw Error('Incomplete weekly ranking reference');
  const seen=new Set();
  const entries=input.map(e=>{
   const r=Number(e.rank),wrp=Number(e.wrp_score),id=String(e.kv||'');
   if(!id||!Number.isInteger(r)||r<1||r>declared||!Number.isFinite(wrp)||seen.has(id))throw Error('Invalid ranking entry');
   seen.add(id);return {id,title:e.title||id,ja:e.jpTitle||e.title||id,r,wrp};
  }).sort((a,b)=>a.r-b.r);
  for(let i=0;i<entries.length;i++)if(entries[i].r!==i+1)throw Error('Non-consecutive ranking');
  const drops=[];
  if(raw.meta.drop_decisions!=null){
   if(!Array.isArray(raw.meta.drop_decisions))throw Error('Invalid drop decisions');
   for(const d of raw.meta.drop_decisions){
    if(typeof d.kv!=='string'||!d.kv||!/^[-_a-zA-Z0-9]+$/.test(d.kv))throw Error('Malformed dropped title id');
    drops.push(d.kv);
   }
  }
  const dropCount=Number(raw.meta.status?.decidedToDropThisWeek??0)+Number(raw.meta.status?.droppedThisWeekUnrated??0);
  if(dropCount>0&&drops.length===0)throw Error('Drop metadata missing while season status reports dropped titles');
  return {week:{w:expectedWeek,n:declared,entries},drops};
 }
 function situation(id,week,map,context){
  const decision=context.drops[id];
  if(decision!==undefined&&week>=decision+2)return {kind:'dropped',label:'対象外',decision};
  if(map.has(id))return {kind:'rated',label:'評価あり'};
  if(decision!==undefined&&week>decision)return {kind:'dropped',label:'対象外',decision};
  const kind=context.statuses[id]?.[week];
  const words={upcoming:'放送開始前',noair:'放送休止',unrated:'採点記録なし（理由未確認）'};
  return {kind:kind||'unrated',label:words[kind]||words.unrated};
 }
 function candidate(team,group,week,map,used,context){
  const primary=team.picks[group],backups=(team.backups?.[group]||[]).filter(Boolean);
  const decision=context.drops[primary],dropped=decision!==undefined&&week>decision;
  const restored=decision!==undefined&&week===decision+1&&map.has(primary);
  const locked=decision!==undefined&&week>=decision+2;
  if(!used.has(primary)&&map.has(primary)&&!locked){
   return {id:primary,mode:restored?'restored':'starter',status:{kind:'rated',label:'評価あり'}};
  }
  const status=situation(primary,week,map,context);
  if(!context.rules.subs)return {id:primary,mode:'inactive',status};
  let mode=null;
  if(locked)mode='promoted';
  else if(dropped&&week===decision+1)return {id:primary,mode:'grace',status:{kind:'drop_grace',label:'対象外直後の猶予週'}};
  else if(['upcoming','noair'].includes(status.kind))mode='substitute';
  if(!mode)return {id:primary,mode:'inactive',status};
  for(let i=0;i<backups.length;i++){
   const id=backups[i];if(used.has(id))continue;
   const st=situation(id,week,map,context);
   if(st.kind==='rated'&&(context.drops[id]===undefined||week<=context.drops[id])){
    return {id,mode,status,order:i+1,primary};
   }
  }
  return {id:primary,mode:'inactive',status,needed:mode};
 }
 function base(r,wrp,n,o){
  const pct=n>1?Math.max(0,Math.min(1,(n-r)/(n-1))):1;
  const w=wrp*o.wrp,rank=o.rank*pct,field=o.field*n/34*pct;
  return {w,rank,field,sum:w+rank+field};
 }
 function upset(r,o){return r===1?o.d1:r<=3?o.d3:r<=5?o.d5:r<=10?o.d10:1;}
 function score(team,week,context){
  if(!week||!Number.isInteger(week.w)||!Array.isArray(week.entries))throw Error('Missing published round');
  const o=context.options,map=new Map(week.entries.map(e=>[e.id,e]));
  let total=0;const pieces={},used=new Set();
  for(const group of 'ABCD'){
   const pick=candidate(team,group,week.w,map,used,context);
   let e=map.get(pick.id);if(pick.mode==='grace')e=undefined;
   if(e)used.add(pick.id);
   const parts=e?base(e.r,e.wrp,week.n,o):null;
   const multipliers={group:o[group],captain:(team.captain===group&&!['substitute','promoted'].includes(pick.mode)?o.captain:1),upset:(e&&group==='D'?upset(e.r,o):1)};
   const pts=parts?parts.sum*multipliers.group*multipliers.captain*multipliers.upset:(pick.mode==='grace'&&context.rules.subs?context.rules.grace:0);
   pieces[group]={e,pts,id:pick.id,primary:team.picks[group],mode:pick.mode,order:pick.order||null,needed:pick.needed||null,status:pick.status,parts,multipliers};total+=pts;
  }
  const highest=Math.max(...'ABC'.split('').map(g=>pieces[g].e?.r??Infinity));
  const bonusType=highest<=3?'TOP 3':highest<=5?'TOP 5':highest<=10?'TOP 10':null;
  const bonus=highest<=3?o.t3:highest<=5?o.t5:highest<=10?o.t10:0;
  return {w:week.w,total:total+bonus,bonus,bonusType,pieces};
 }
 global.SOWFantasyCoreR25=Object.freeze({score,normalizePublishedWeek,situation});
})(window);
