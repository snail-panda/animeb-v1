/* OFFBEAT Anime Home Week Peek R16 — focused visual trial, additive.
 * Uses published weekly ranking JSON; Fall 2026 W05 is optionally enriched with
 * an editorial-only sidecar; all comparison numbers come from official weekly JSON.
 * No timeline or green-marker handlers; no alteration of existing site assets. */
(()=>{'use strict';
 const ROOT=document.querySelector('#anime-top.anime09');
 if(!ROOT || window.__obWeekPeekR16)return;
 window.__obWeekPeekR16=true;
 const BASE=new URL('./',document.baseURI), CACHE=new Map();
 const CSS_READY='ob-wp13-ready';
 const $=(selector,node=ROOT)=>node.querySelector(selector);
 const mk=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;};
 const tr=(ja,en)=>isJa()?ja:en;
 const isJa=()=>{try{return localStorage.getItem('animeb-weekly-lang')==='ja';}catch{return false;}};
 const n=v=>(v===null||v===undefined||v===''||!Number.isFinite(Number(v)))?null:Number(v);
 const f=v=>v===null?'—':Number(v).toFixed(2);
 const pad=v=>String(v).padStart(2,'0');
 const sum=a=>a.reduce((x,y)=>x+y,0);
 const avg=a=>a.length?sum(a)/a.length:null;
 const change=(a,b)=>a===null||b===null?null:a-b;
 const esc=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^a-z\d\p{L}]/gu,'');
 const round=v=>Number.isFinite(v)?Math.round(v*100)/100:null;
 function safeFetch(url){const key=String(url);if(!CACHE.has(key))CACHE.set(key,fetch(url).then(r=>{if(!r.ok)throw Error('status '+r.status);return r.json();}).catch(e=>{CACHE.delete(key);throw e;}));return CACHE.get(key);}
 function sourcePath(s){const y=s.year,se=s.season,w=pad(s.week);return new URL(`ranking/${y}/${se}/week${w}/ranking-week${w}-${se}${y}.json`,BASE);}
 function selection(panel){
  const header=panel.querySelector('.ob-live-peek-head .ob-live-kicker')?.textContent||'';
  const m=header.match(/WEEK\s*PEEK\s*[·-]\s*(\d{1,2})/i);if(!m)return null;
  const week=+m[1];if(!week||week>12)return null;
  const a=$('.n-weeks a[data-ob-live-selected="true"]');
  const href=a?.getAttribute('href')||a?.href||'';
  const ref=href.match(/ranking\/(\d{4})\/(winter|spring|summer|fall)\/week(\d{2})/i);
  if(ref&&+ref[3]===week)return {year:+ref[1],season:ref[2].toLowerCase(),week};
  const title=$('.n-season-name h2');const raw=title?.querySelector('em')?.textContent.trim().toLowerCase();
  const yr=+(title?.querySelector('b')?.textContent||0);
  const dict={冬:'winter',春:'spring',夏:'summer',秋:'fall'};
  const season=dict[raw]||raw;
  if(yr>=2020 && ['winter','spring','summer','fall'].includes(season))return {year:yr,season,week};
  return null;
 }
 function rankRows(data){
  const ref=data?.meta?.weekly_ranking_reference?.entries;
  if(!Array.isArray(ref))return [];
  return ref.map(x=>({rank:n(x.rank),title:String(x.title||''),ja:String(x.jpTitle||x.title||''),wrp:n(x.wrp_score),rounded:n(x.score),prevRank:n(x.prev_rank),prevWrp:null,episode:String(x.episode||''),kv:String(x.kv||'')}))
   .filter(x=>Number.isInteger(x.rank)&&x.rank>0&&x.wrp!==null).sort((a,b)=>a.rank-b.rank);
 }
 function editorialFor(side,sel,rows,priorRows,noAir){
  const scope=side?.scope;
  if(side?.schema!=='offbeat-week-peek-editorial-v1'||scope?.year!==sel.year||scope?.season!==sel.season||scope?.week!==sel.week)return null;
  const currentKeys=new Set(rows.map(r=>r.kv));
  const priorKeys=new Map(priorRows.map(r=>[r.kv,r]));
  const ids=Array.isArray(side.absences)?side.absences.map(a=>a.kv):[];
  const known=ids.length===noAir&&new Set(ids).size===ids.length&&ids.every(k=>k&&!currentKeys.has(k)&&priorKeys.has(k))
    ?ids.map(k=>{const r=priorKeys.get(k);return {title:r.title,ja:r.ja,prevRank:r.rank};}):null;
  const h=side.editableHeadlines;
  return {editableHeadlines:(typeof h?.en==='string'&&h.en.trim()&&typeof h?.ja==='string'&&h.ja.trim())?h:null,absences:known};
 }
 async function dataFor(sel){
  const [week,previous]=await Promise.all([safeFetch(sourcePath(sel)), sel.week>1?safeFetch(sourcePath({...sel,week:sel.week-1})).catch(()=>null):Promise.resolve(null)]);
  const rows=rankRows(week),priorRows=rankRows(previous);
  if(!rows.length)throw Error('No published ranking reference rows');
  const byKV=new Map(priorRows.filter(x=>x.kv).map(x=>[x.kv,x]));
  const byTitle=new Map(priorRows.map(x=>[esc(x.title),x]));
  rows.forEach(row=>{const old=(row.kv&&byKV.get(row.kv))||byTitle.get(esc(row.title));if(priorRows.length)row.prevRank=null;if(old){row.prevRank=old.rank;row.prevWrp=old.wrp;}});
  let side=null;
  if(sel.year===2026&&sel.season==='fall'&&sel.week===5){
   try{const candidate=await safeFetch(new URL('assets/data/offbeat-weekpeek-2026-fall-w05-preview.json?v=93k',BASE));side=editorialFor(candidate,sel,rows,priorRows,n(week?.meta?.status?.noAir));}catch(_){}
  }
  return {week,previous,rows,priorRows,side};
 }
 function distCounts(list){const bins=new Map();list.forEach(r=>{const v=r.rounded;if(v!==null&&Number.isInteger(v))bins.set(v,(bins.get(v)||0)+1);});return [...bins].sort((a,b)=>b[0]-a[0]);}
 function paragraph(cls,text){return mk('p',cls,text);}
 function componentLabel(str){return mk('small','ob-wp13-label',str);}
 function wrap(tag,cls,...children){const x=mk(tag,cls);children.filter(Boolean).forEach(y=>x.append(y));return x;}
 function statusItem(name,value,featured,absent=false){const el=mk('div','ob-wp13-status-item'+(featured?' is-featured':'')+(absent?' ob-wp15-absence-stat':''));el.append(mk('span','',name),mk('strong','',value===null?'—':value));return el;}
 function deltaIcon(value){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 18 18');svg.setAttribute('aria-hidden','true');svg.classList.add('ob-wp13-arrow');
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',value>0?'M3 14L13.7 3.3 M7 3.3H13.7V10':'M3 4L13.7 14.7 M7 14.7H13.7V8');p.setAttribute('stroke','currentColor');p.setAttribute('stroke-width','2.1');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');p.setAttribute('fill','none');svg.append(p);return svg;
 }
 function shiftValue(value){if(value===null)return '—';return (value>0?'+':'')+f(value);}
 function metric(title,value,delta,previous,note,mode='score'){
  const item=mk('section','ob-wp13-metric');item.append(componentLabel(title));
  const figure=mk('div','ob-wp14-metric-figure');figure.append(mk('span','ob-wp14-avg-prefix',mode==='score'?tr('平均WRP','AVG WRP'):tr('平均点差','GAP')),mk('strong','ob-wp14-avg-number',f(value)));
  if(delta!==null){const isUp=delta>0.004, isDown=delta<-.004;
   const badge=mk('span','ob-wp14-metric-delta '+(mode==='gap'?'is-neutral':isUp?'is-up':isDown?'is-down':'is-flat'));
   if(mode==='score'&&(isUp||isDown))badge.append(mk('span','ob-wp14-tiny-arrow',isUp?'↗':'↘'));
   badge.append(mk('b','',shiftValue(delta)));
   if(mode==='gap')badge.append(mk('small','',delta>0?tr('拡大','wider'):tr('縮小','narrower')));
   figure.append(badge);
  }
  item.append(figure);
  if(previous!==null)item.append(paragraph('ob-wp14-prior',tr('前週','Last week')+` ${f(previous)} → ${f(value)}`));
  if(note)item.append(paragraph('ob-wp14-metric-note',note));
  return item;
 }
 function bandBar(rows,label){
  const total=rows.length,mean=avg(rows.map(r=>r.wrp));
  const counts=distCounts(rows);const outer=mk('section','ob-wp13-dist');
  const title=wrap('div','ob-wp14-dist-heading',wrap('div','ob-wp14-dist-name',mk('strong','',label),mk('small','',tr(`${total}作品`,`${total} titles`))),wrap('div','ob-wp14-dist-average',mk('span','',tr('平均WRP','AVG WRP')),mk('strong','',f(mean))));
  outer.append(title);
  const bar=mk('div','ob-wp14-bar');bar.setAttribute('role','img');bar.setAttribute('aria-label',counts.map(([score,count])=>tr(`${score}点${count}作品`,`${score} points: ${count} titles`)).join(', '));
  const countsBelow=mk('div','ob-wp14-bar-counts');
  for(const [score,count] of counts){
   const color=`var(--ob-wp13-score-${Math.min(11,Math.max(0,score))})`;
   const seg=mk('div','ob-wp14-bar-part');seg.style.flexGrow=String(count);seg.style.setProperty('--ob14-bin-color',color);
   seg.title=tr(`${score}点：${count}作品`,`${score} points: ${count} titles`);
   seg.append(mk('b','',String(score)));bar.append(seg);
   const below=mk('span','ob-wp14-bar-count');below.style.flexGrow=String(count);below.title=seg.title;
   below.textContent=tr(`${count}作品`,`${count} ${count===1?'title':'titles'}`);countsBelow.append(below);
  }
  outer.append(bar,countsBelow);
  const major=label.toLowerCase().includes('top 10')&& !label.toLowerCase().includes('beyond') && !label.includes('圏外');
  const eight=rows.filter(x=>x.rounded===8).length;
  const low=rows.filter(x=>x.rounded!==null&&x.rounded<=6).length;
  const bottom=rows.filter(x=>x.rounded!==null&&x.rounded<=2).length;
  const note=mk('p','ob-wp14-bar-story');
  if(major && eight>=Math.ceil(total*.5)){
   note.append(mk('strong','',tr(`${total}作品中${eight}作品が8点。`,`${eight} of ${total} titles scored 8.`)),document.createTextNode(tr('突出した高得点は限られました。','Only a few reached 9 or higher.')));
  }else if(!major && low>=Math.ceil(total*.55)){
   note.append(mk('strong','',tr(`${total}作品中${low}作品が6点以下。`,`${low} of ${total} scored 6 or below.`)),document.createTextNode(bottom?tr(` うち${bottom}作品は1〜2点。`,` ${bottom} received only 1 or 2 points.`):''));
  }else{
   note.textContent=tr(`全${total}作品のエピソード評価点の分布。`,`The episode-rating distribution across ${total} titles.`);
  }
  outer.append(note);
  return outer;
 }
 function img(sel,row){if(!/^[a-z0-9_-]+$/i.test(row.kv))return null;const image=mk('img');image.loading='lazy';image.alt='';image.src=new URL(`images/key-visuals/${sel.year}/${sel.season}/${row.kv}.webp`,BASE).href;image.addEventListener('error',()=>image.remove());return image;}
 function stage(sel){const w=sel.week;const stages=[['OPENING','序盤','01–03'],['MIDDLE','中盤','04–07'],['LATE','終盤','08–10'],['CLIMAX','クライマックス','11–12']];return stages[w<=3?0:w<=7?1:w<=10?2:3];}
 function make(sel,data,originalClose){
  const ja=isJa(),{week,rows,priorRows,side}=data;
  const current=sel.week,top10=rows.slice(0,10),rest=rows.slice(10);
  const meanTop=avg(top10.map(r=>r.wrp)),meanAll=avg(rows.map(r=>r.wrp)),meanRest=avg(rest.map(r=>r.wrp));
  const prevTop=priorRows.length?avg(priorRows.slice(0,10).map(r=>r.wrp)):null;
  const prevAll=priorRows.length?avg(priorRows.map(r=>r.wrp)):null;
  const topDelta=change(meanTop,prevTop),allDelta=change(meanAll,prevAll),gap=change(meanTop,meanAll),gapPrior=change(prevTop,prevAll),gapDelta=change(gap,gapPrior);
  const comparable=rows.filter(r=>r.prevRank!==null && r.prevWrp!==null),rich=comparable.length>=Math.max(3,rows.length*.6);
  const upRank=comparable.filter(r=>r.prevRank>r.rank).length,downRank=comparable.filter(r=>r.prevRank<r.rank).length,flatRank=comparable.filter(r=>r.prevRank===r.rank).length;
  const upWRP=comparable.filter(r=>r.wrp>r.prevWrp+.001).length,downWRP=comparable.filter(r=>r.wrp<r.prevWrp-.001).length;
  const paradox=comparable.filter(r=>r.prevRank>r.rank && r.wrp<r.prevWrp-.001).length;
  const rising=comparable.filter(r=>r.prevRank>r.rank).sort((a,b)=>(b.prevRank-b.rank)-(a.prevRank-a.rank));
  const st=week?.meta?.status||{},active=n(st.currentLineup),noAir=n(st.noAir);
  const root=mk('div','ob-wp13 ob-wp14 ob-wp15 ob-wp16');root.lang=ja?'ja':'en';
  root.append(mk('span','ob-wp13-screenreader',tr('ウィークピークの詳細','Week Peek details')));
  const banner=wrap('div','ob-wp14-banner',mk('span','',tr('現在のシーズン／12週間の軌跡','CURRENT SEASON / THE TWELVE-WEEK JOURNEY')),mk('span','',`${pad(current)} · ${sel.year} ${sel.season.toUpperCase()}`));root.append(banner);
  const head=mk('header','ob-wp13-head');
  const title=wrap('div','ob-wp13-title',mk('strong','',`WEEK PEEK`),mk('b','ob-wp14-week',pad(current)),mk('span','ob-wp13-current',current===latestVisible(sel)?tr('最新週','CURRENT ROUND'):tr('公開済み','PUBLISHED ROUND')));
  const [eng,jap,range]=stage(sel);
  const phase=wrap('div','ob-wp13-stage',mk('span','',tr('シーズンの段階','SEASON STAGE')),mk('b','',ja?jap:eng),mk('small','',tr(`第${range}週`,`· WEEKS ${range}`)));
  const headside=wrap('div','ob-wp13-headside',phase,originalClose);head.append(title,headside);root.append(head);
  const stats=mk('div','ob-wp13-status');
  stats.append(statusItem(tr('現行ラインアップ','Active lineup'),active),statusItem(tr('今週の放送休止','Did not air'),noAir,false,true),statusItem(tr('採点・順位付け','Scored & ranked'),rows.length,true));root.append(stats);
  // Editorial headline is editable in the editorial sidecar, otherwise derived conservatively.
  const twoMoves=rising.length>=2 && rising[0].rank<=3 && rising[1].rank<=3;
  const split=topDelta!==null&&allDelta!==null&&topDelta>0.005&&allDelta<-.005;
  const useEditorial=!!side?.editableHeadlines&&twoMoves&&split;
  let headline=useEditorial?(ja?side.editableHeadlines.ja:side.editableHeadlines.en):split?tr('上位は持ち直した。それでも全体は低迷。','A lift at the top. A tougher week underneath.'):twoMoves?tr('上位で大きな逆転劇。','A shake-up at the top.'):tr(`第${pad(current)}週、何が起きた？`,`What happened in Week ${pad(current)}?`);
  let summary='';
  if(twoMoves){const a=rising[0],b=rising[1];summary=ja?`前週${a.prevRank}位から${a.rank}位、${b.prevRank}位から${b.rank}位へ。上位2作品が大躍進。`:`Two major climbs reshaped the top: No. ${a.prevRank} reached No. ${a.rank}, while No. ${b.prevRank} rose to No. ${b.rank}. `;}
  if(split)summary+=tr('一方、上位10作品のWRP平均は小幅上昇にとどまり、全作品の平均は低下しました。','Yet the Top 10 average edged up only slightly, while the average across all ranked titles fell.');
  if(!summary)summary=tr('順位と得点をあわせて、この週の動きを読み解きます。','A closer look at how the standings and scores changed this round.');
  const hero=mk('section','ob-wp13-hero');const editorial=mk('div','ob-wp13-editorial');
  const headlineEl=mk('h3');
  // Preserve the deliberate two-line news-style headline used in Concept 08.
  if(useEditorial && sel.year===2026 && sel.season==='fall' && current===5){
   const parts=ja?headline.split(/(?<=。)/).filter(Boolean):headline.split(/(?<=\.)\s+(?=A rough)/).filter(Boolean);
   parts.forEach(part=>headlineEl.append(mk('span','ob-wp14-headline-line',part)));
  }else{headlineEl.textContent=headline;}
  const dek=paragraph('ob-wp13-dek',summary);
  // W05 editorial conclusion is a sample written from verified numbers; all other weeks keep the source-derived copy.
  if(useEditorial && sel.year===2026 && sel.season==='fall' && current===5 && rising[0].rank<=2 && rising[1].rank<=2 && downWRP>comparable.length/2 && noAir===2 && side.absences?.length===2 && side.absences.every(a=>a.prevRank<=10)){
   dek.replaceChildren();
   if(ja){dek.append(document.createTextNode('上位2作品の大躍進で順位が大きく入れ替わりました。前週TOP 10の2作品が放送休止となった一方、全体の評価は下向き。 '),mk('strong','', '順位は大きく変わっても、作品全体の出来が良くなったわけではありません。'));}
   else{dek.append(document.createTextNode('Two major comebacks reshaped the top two places, but most titles scored lower than last week. With two previous Top 10 entries off the air, '),mk('strong','','the standings changed more than the performances did.'));}
  }
  editorial.append(componentLabel(tr('今週のストーリー','THE STORY OF THIS ROUND')),headlineEl,dek);
  const contrast=mk('div','ob-wp13-contrast');
  if(rich){
   const contrastTag=componentLabel(tr('順位と評価点','RANKS VS SCORES'));contrastTag.classList.add('ob-wp15-contrast-tag');
   contrast.append(contrastTag,componentLabel(tr('今週、数字が語る対照','THE WEEK’S CENTRAL CONTRAST')));
   const rankline=wrap('div','ob-wp14-contrast-comparison',wrap('div','ob-wp14-contrast-fact',mk('strong','is-positive',String(upRank)),mk('span','',tr('作品が順位上昇','rose in rank')),mk('em','ob-wp15-but',tr('しかし','but'))),wrap('div','ob-wp14-contrast-fact',mk('strong','is-negative',String(downWRP)),mk('span','',tr('作品はWRPが低下','scored lower WRP'))));
   contrast.append(rankline);
   const c=paradox?tr(`しかも${paradox}作品は、WRPが下がっても順位が上昇。順位と評価点は別の動きです。`,`${paradox} titles moved up the standings even though their WRP fell. Rank movement and score movement tell different stories.`):tr('順位の上下と評価点の上下は、同じものではありません。','Rank movements and ratings do not always tell the same story.');
   contrast.append(paragraph('',c));
  }else{contrast.append(componentLabel(tr('今週の集計','THIS WEEK’S STANDINGS')),wrap('div','ob-wp14-contrast-fact',mk('strong','',String(rows.length)),mk('span','',tr('作品を採点・順位付け','ranked titles'))),paragraph('',tr('前週との個別比較は、利用可能なデータの範囲で示します。','Week-on-week comparisons appear only when supported by published data.')));}
  hero.append(editorial,contrast);root.append(hero);
  const heading=wrap('div','ob-wp13-section-label',mk('strong','',tr('平均点から見る今週の実情','HOW THE WEEK ACTUALLY SCORED')),mk('small','',tr('WRP平均・前週との比較','WRP averages · previous-week comparison')));root.append(heading);
  const topNote=topDelta===null?'':topDelta>0?tr('やや改善。ただし上位10作品の平均は9.0に届かず。','A slight recovery, but still below 9.0 for the leaders.'):tr('上位の平均も前週より低下。','Even the top group slipped.');
  const allNote=allDelta===null?'':allDelta<0?tr('上位が持ち直しても、全体ではさらに低下。','The overall field declined, even as the leaders edged up.'):tr('全体の評価も前週より上向き。','The overall field improved this round.');
  const gapNote=gapDelta===null?'':gapDelta>0?tr('差の拡大は好調の証ではありません。','A wider gap is not a higher quality score.'):tr('上位と全体の差は前週より縮小。','The gap narrowed this round.');
  const metrics=mk('div','ob-wp13-metrics');
  const gapMetric=metric(tr('上位10作品と全体の差','TOP 10 VS ALL RANKED · GAP'),gap,gapDelta,gapPrior,gapNote,'gap');
  // This is a definition of the 1.22 "Top 10 vs ALL ranked" gap, not a
  // footnote about either of the two score-distribution bars below.
  if(rows.length>10){
   const gapDefinition=tr(`注：この差はTOP 10の平均WRPと、TOP 10を含む全${rows.length}作品の平均WRPとの差です。`,`Note: This is the difference between the Top 10 average WRP and the average of all ${rows.length} ranked titles, including the Top 10.`);
   gapMetric.append(paragraph('ob-wp72-gap-definition',gapDefinition));
  }
  metrics.append(metric(tr('上位10作品の平均WRP','TOP 10 · AVERAGE WRP'),meanTop,topDelta,prevTop,topNote),metric(tr(`全${rows.length}作品の平均WRP`,`ALL ${rows.length} RANKED · AVERAGE WRP`),meanAll,allDelta,prevAll,allNote),gapMetric);
  root.append(metrics);
  if(rich){
   const ins=mk('div','ob-wp13-insights');const a=mk('section','ob-wp13-insight ob-wp14-insight-moves');
   const kicker=wrap('div','ob-wp14-insight-kicker',componentLabel(tr('大きな順位変動','BIGGEST MOVES')),mk('small','',tr('上位の入れ替わり','TOP OF THE BOARD')));a.append(kicker);
   a.append(mk('h4','ob-wp14-insight-title',tr('目を引く2作品の急浮上。','Two climbs worth noticing.')));
   a.append(paragraph('ob-wp14-insight-sub',tr('順位だけでなく得点も大きく伸ばした作品。','The scores rose sharply, too—not just the rankings.')));
   const moves=mk('div','ob-wp14-move-list');
   rising.slice(0,2).forEach(r=>{
    const card=mk('div','ob-wp14-move-card');
    card.append(wrap('div','ob-wp14-move-line',mk('strong','',`${r.prevRank} → ${r.rank}`),mk('small','',tr(`${r.prevRank-r.rank}位上昇`,`+${r.prevRank-r.rank} places`))));
    card.append(paragraph('ob-wp14-move-name',ja?r.ja:r.title));
    if(r.prevWrp!==null)card.append(paragraph('ob-wp14-move-wrp',`WRP ${f(r.prevWrp)} → ${f(r.wrp)} (${shiftValue(r.wrp-r.prevWrp)})`));moves.append(card);
   });a.append(moves);
   const b=mk('section','ob-wp13-insight ob-wp14-insight-counter');b.append(componentLabel(tr('数字の裏にあるもう一つの動き','THE HIDDEN COUNTERSTORY')));
   b.append(mk('h4','ob-wp14-insight-title',tr('順位上昇 ≠ 評価向上','Moving up ≠ improving.')));
   b.append(paragraph('ob-wp14-insight-sub',tr('順位は他作品の動きにも左右されます。','Rank changes depend on who else competed.')));
   const tallies=mk('div','ob-wp14-count-pair');
   tallies.append(wrap('div','',wrap('div','ob-wp14-tally',mk('strong','is-positive',String(upRank)),mk('span','',tr('順位上昇','up')),mk('b','is-negative',String(downRank)),mk('span','',tr('順位下降','down'))),mk('small','',tr(`順位変動（変化なし${flatRank}）`,`Rank movements · ${flatRank} unchanged`))));
   tallies.append(wrap('div','',wrap('div','ob-wp14-tally',mk('strong','is-positive',String(upWRP)),mk('span','',tr('WRP上昇','higher')),mk('b','is-negative',String(downWRP)),mk('span','',tr('WRP低下','lower'))),mk('small','',tr('WRPの前週比','WRP changes from last week'))));b.append(tallies);
   if(paradox)b.append(paragraph('ob-wp14-paradox',tr(`${paradox}作品は、WRPが下がったのに順位が上昇。`,`${paradox} titles climbed the rankings despite earning lower WRP.`)));
   ins.append(a,b);root.append(ins);
  }
  if(rows.length>10){
   const label=wrap('div','ob-wp13-section-label ob-wp14-scores-label',mk('strong','',tr('得点分布が示す上位と圏外の差','Where the scores separate')),mk('small','',tr('各話のざっくり評価点 · WRPとは別指標','Rounded episode ratings · different from WRP')));root.append(label);
   root.append(wrap('div','ob-wp13-dists',bandBar(top10,tr('上位10作品','WITHIN THE TOP 10')),bandBar(rest,tr('TOP 10圏外','BEYOND THE TOP 10'))));
   // The gap compares the TWO distinct groups' WRP averages (not rounded
   // episode-rating bins above). Show it as one conclusion beneath BOTH bands.
   const directGap=change(meanTop,meanRest);
   const comparison=mk('section','ob-wp14-dist-summary ob-wp72-dist-comparison ob-wp73-comparison');
   comparison.append(
     mk('strong','ob-wp73-comp-label',tr(`TOP 10と11〜${rows.length}位の比較`,`TOP 10 VS POSITIONS 11–${rows.length}`)),
     wrap('div','ob-wp73-comp-value',
       mk('strong','',f(directGap)),
       mk('span','',tr('平均WRPの差','WRP APART'))),
     paragraph('ob-wp73-comp-detail',tr(`平均WRP：TOP 10は${f(meanTop)}、11〜${rows.length}位は${f(meanRest)}。`,`Average WRP: ${f(meanTop)} (Top 10) vs ${f(meanRest)} (positions 11–${rows.length}).`))
   );
   root.append(comparison);
  }
  if(noAir!==null&&noAir>0){
   const row=mk('div','ob-wp14-news-row');const absent=mk('section','ob-wp13-absence');absent.append(componentLabel(tr('今週の放送休止','THIS WEEK’S ABSENCES')));
   const known=Array.isArray(side?.absences)&&side.absences.length===noAir?side.absences:null;
   if(known){const topPrev=known.filter(a=>a.prevRank<=10).length;
    absent.append(mk('h4','',topPrev===known.length?tr(`前週Top 10の${noAir}作品が休止。`,`${noAir} Top 10 regulars sat out.`):tr(`${noAir}作品が今週はお休み。`,`${noAir} titles sat out this week.`)));
    absent.append(paragraph('',tr('今週の新エピソードがなく、評価対象から除外。ラインアップから脱落したわけではありません。','Neither had a new episode this week. They were not scored, but they have not been dropped from the lineup.')));
    const entries=mk('div','ob-wp13-absences');known.forEach(x=>entries.append(wrap('span','ob-wp13-absence-title',mk('b','ob-wp15-absence-name',ja?x.ja:x.title),mk('small','',tr(`前週${x.prevRank}位・今週放送なし`,`Last week No. ${x.prevRank} · no episode`)))));absent.append(entries);
   }else{absent.append(mk('h4','',tr(`${noAir}作品は放送休止。`,`${noAir} titles did not air.`)),paragraph('',tr('今週のランキング対象からは外れますが、今シーズンの候補作品としては継続します。','They are excluded from this week’s standings, not removed from the season lineup.')));}
   const low=mk('section','ob-wp14-low');low.append(componentLabel(tr('トップ10圏外で起きたこと','BENEATH THE TOP TEN')),mk('h4','',tr('下位の評価はさらに厳しい。','The lowest scores tell a harsher story.')));
   const neutralDrop=rows.filter(r=>r.prevRank===r.rank&&r.prevWrp!==null&&r.wrp-r.prevWrp<-2).sort((a,b)=>a.wrp-a.prevWrp-(b.wrp-b.prevWrp))[0];
   if(neutralDrop){low.append(paragraph('',ja?`${neutralDrop.rank}位の${neutralDrop.ja}は順位を維持したままWRP ${f(neutralDrop.prevWrp)} → ${f(neutralDrop.wrp)}。評価は${f(neutralDrop.prevWrp-neutralDrop.wrp)}も低下。`:`No. ${neutralDrop.rank} held the same rank, yet its WRP plunged from ${f(neutralDrop.prevWrp)} to ${f(neutralDrop.wrp)}—a ${f(neutralDrop.prevWrp-neutralDrop.wrp)}-point fall.`));
    low.append(paragraph('ob-wp14-paradox',tr('順位が安定していても、評価が安定しているとは限りません。','A stable rank can conceal a dramatic drop in the score.')));
   }else{low.append(paragraph('',tr(`TOP 10圏外${rest.length}作品のWRP平均は${f(meanRest)}。`,`The ${rest.length} titles beyond the Top 10 averaged just ${f(meanRest)} WRP.`)));}
   row.append(absent,low);root.append(row);
  }
  // Personal enjoyment is not the same as a title’s rating; keep the yellow face visible.
  const s=n(week?.meta?.presentation?.satisfaction?.value10);
  if(s!==null&&s>=0&&s<=199.8){const enjoyment=mk('div','ob-wp14-enjoy');
   const label=wrap('div','',componentLabel(tr('週間満足度・個人的な実感','WEEKLY ENJOYMENT · EDITORIAL')),paragraph('',tr('個々の作品の採点とは別の、今週全体への満足度。','Personal enjoyment is separate from each title’s score.')));
   const displayScale=[5,10].includes(week?.meta?.presentation?.satisfaction?.displayScale)?week.meta.presentation.satisfaction.displayScale:5;
   const total=s*displayScale/10;const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 38 38');icon.setAttribute('aria-hidden','true');icon.classList.add('ob-wp14-face');
   const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx','19');c.setAttribute('cy','19');c.setAttribute('r','16');c.setAttribute('fill','#efcc57');c.setAttribute('stroke','#a58b39');c.setAttribute('stroke-width','1.6');icon.append(c);
   const e=document.createElementNS('http://www.w3.org/2000/svg','path');e.setAttribute('d','M12 15h2m10 0h2');e.setAttribute('fill','none');e.setAttribute('stroke','#604c32');e.setAttribute('stroke-width','2.1');e.setAttribute('stroke-linecap','round');icon.append(e);
   const mouth=document.createElementNS('http://www.w3.org/2000/svg','path');mouth.setAttribute('d',s>=7?'M12 23 Q19 29 26 23':s<=3.6?'M12 27 Q19 20 26 27':'M12 25H26');mouth.setAttribute('fill','none');mouth.setAttribute('stroke','#604c32');mouth.setAttribute('stroke-width','2.3');mouth.setAttribute('stroke-linecap','round');icon.append(mouth);
   const optionalFeeling=ja?week?.meta?.presentation?.satisfaction?.editorialLabelJa:week?.meta?.presentation?.satisfaction?.editorialLabelEn;
   const feeling=(typeof optionalFeeling==='string'&&optionalFeeling.trim())?optionalFeeling.trim():'';
   const faceStack=wrap('div','ob-wp16-face-stack',icon);
   if(feeling)faceStack.append(mk('span','ob-wp16-mood',feeling));
   const val=wrap('div','ob-wp14-enjoy-value',faceStack,mk('strong','',total.toFixed(1)),mk('small','',''));val.lastChild.textContent='/'+displayScale;enjoyment.append(label,val);root.append(enjoyment);
  }
  const bottom=mk('section','ob-wp13-end');
  const topBlock=mk('div','ob-wp13-mini-top3');topBlock.append(componentLabel(tr('今週の表彰台・ひと目で','THIS ROUND’S PODIUM · QUICK LOOK')),mk('h4','',tr('続きは、週間ランキングで。','A glimpse, not the full ranking.')));
  const stands=mk('div','ob-wp13-stands');
  const trip=rows.slice(0,3);const order=trip.length===3?[trip[1],trip[0],trip[2]]:trip;
  order.forEach(r=>{const item=mk('div','ob-wp13-stand'+(r.rank===1?' is-winner':'')+' ob-wp16-rank-'+r.rank);item.append(mk('b','',tr(`第${r.rank}位`,`No. ${r.rank}`)));const im=img(sel,r);if(im)item.append(im);const fullTitle=ja?r.ja:r.title;
   const cardTitle=mk('span','ob-wp15-podium-title',fullTitle);cardTitle.title=fullTitle;cardTitle.setAttribute('aria-label',fullTitle);
   cardTitle.setAttribute('tabindex','0');cardTitle.setAttribute('role','button');cardTitle.setAttribute('aria-expanded','false');
   const toggle=()=>{const next=cardTitle.getAttribute('aria-expanded')!=='true';cardTitle.setAttribute('aria-expanded',String(next));cardTitle.classList.toggle('is-full-title',next);};
   cardTitle.addEventListener('click',toggle);cardTitle.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
   item.append(cardTitle);if(r.wrp!==null)item.append(mk('small','',`WRP ${f(r.wrp)}`));stands.append(item);});
  topBlock.append(stands,paragraph('ob-wp14-podium-note',tr('上位3作品をざっと紹介。Top 10の全順位とレビューは週間ランキングで。','The top three at a glance. Explore the published Top 10 and episode reviews in the full ranking.')));
  const cta=mk('div','ob-wp13-cta');cta.append(componentLabel(tr('フルランキングで何を見る？','WHY OPEN THE FULL RANKING?')),mk('h4','',tr('数字だけではわからないこと。',"See what the numbers can't tell you.")),paragraph('',tr('なぜ順位が大きく変化したのか。注目作は今週どうだったのか。全体の順位と各話レビューで確かめてみてください。',`Why did a title rise from ${rising.length?rising[0].prevRank:'a lower place'} to No. ${rising.length?rising[0].rank:'1'}? How did your favorites fare? Follow the standings and episode reviews—not just the headlines.`)));
  const reasons=mk('div','ob-wp14-reasons');[[tr('TOP 10の全順位と評価点','The full published Top 10 and their scores')],[tr('各作品のレビュー・評価理由','Episode reviews and the reasons behind each score')],[tr('今週の総評・注目作・視聴メモ','Weekly editorial, highlights and viewing notes')]].forEach((t,i)=>reasons.append(wrap('div','ob-wp14-reason',mk('b','',pad(i+1)),mk('span','',t[0]))));cta.append(reasons);
  bottom.append(topBlock,cta);root.append(bottom);
  const final=mk('section','ob-wp14-final');const words=wrap('div','',mk('h4','',tr('この週の物語は、ここで終わらない。',"There’s more behind this week’s standings.")),paragraph('',tr('Week Peekは入口。週間Top 10と各作品のレビューには、さらに詳しい情報がある。','The Week Peek is a starting point. See the published Top 10 and their episode reviews in full.')));
  const a=mk('a','ob-wp13-read',tr(`第${pad(current)}週の全ランキングへ`,`EXPLORE THE FULL WEEK ${pad(current)} RANKING ↗`));a.href=new URL(`ranking/${sel.year}/${sel.season}/week${pad(current)}/index.html`,BASE).href;
  final.append(words,a);root.append(final);
  const notes=mk('details','ob-wp13-notes');notes.append(mk('summary','',tr('数値の見方・出典','DATA NOTES & DEFINITIONS')));
  notes.append(paragraph('',tr('WRPは週間ランキングポイント。棒グラフは別指標のエピソード評価点を表します。上位10作品と全作品の平均差は、上位10作品と11位以下だけの差とは異なります。','WRP refers to weekly ranking points. Segmented bars show rounded episode ratings, a separate measure. The Top 10 vs all-title gap differs from the Top 10 vs places 11 and below.')));
  notes.append(paragraph('',tr('放送休止はその週の採点からのみ除外し、シーズンの脱落とは区別しています。','A title that did not air is excluded from that week’s scores, not dropped from the season.')));
  notes.append(paragraph('',side?tr('順位・WRPは正式な週間JSONから算出。第05週の編集見出しと放送休止作品の識別情報のみ補足データを使用します。','Ranks and WRP are derived from official weekly JSON. Only the W05 editorial headline and confirmed absence identities use supplemental data.'):tr('過去週との比較は利用可能な週間JSONによります。不明な情報は推測しません。','Earlier-week comparisons depend on available published weekly JSON. Missing values are not invented.')));
  root.append(notes);return root;
 }
 function latestVisible(sel){
  const nodes=[...ROOT.querySelectorAll('.n-weeks a')];const current=nodes.map(a=>{const m=(a.href||'').match(/ranking\/(\d{4})\/(winter|spring|summer|fall)\/week(\d{2})/i);return m&&+m[1]===sel.year&&m[2]===sel.season?+m[3]:null;}).filter(x=>x!==null&&x>0);
  return current.length?Math.max(...current):sel.week;
 }
 let observer=null,sequence=0,updating=false;
 async function upgrade(panel){
  const baseHead=panel.querySelector('.ob-live-peek-head');if(!baseHead||!panel.querySelector('.ob-live-go-row-r8'))return;
  const sel=selection(panel);if(!sel)return;
  const ticket=++sequence;
  const close=baseHead.querySelector('.ob-live-close');if(!close)return;
  const headRef=baseHead;
  try{
   const payload=await dataFor(sel);
   // Do not replace a different week or a closed panel after an asynchronous fetch.
   if(ticket!==sequence || panel.hidden || !headRef.isConnected)return;
   const ui=make(sel,payload,close);
   if(ticket!==sequence || panel.hidden || !headRef.isConnected)return;
   updating=true;panel.replaceChildren(ui);panel.classList.add(CSS_READY);updating=false;
  }catch(error){console.warn('OFFBEAT Week Peek R15: keeping original Week Peek; data unavailable.',error);}
 }
 function connect(panel){
  if(observer)observer.disconnect();
  observer=new MutationObserver(records=>{
   if(updating||panel.hidden)return;
   if(records.some(r=>r.target===panel && panel.querySelector('.ob-live-peek-head')))queueMicrotask(()=>upgrade(panel));
  });observer.observe(panel,{childList:true});
  if(!panel.hidden)upgrade(panel);
 }
 function start(){
  const panel=$('#obLivePeekR1');if(panel){connect(panel);return;}
  const o=new MutationObserver(()=>{const p=$('#obLivePeekR1');if(p){o.disconnect();connect(p);}});o.observe(ROOT,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
