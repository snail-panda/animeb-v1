/* OFFBEAT R12 repair 6 — Week Peek content only.
   Do not bind clicks to the green WEEK PEEK marker or modify timeline actions.
   The original r12 renderPeek() remains the sole source of weekly data and state. */
(()=>{'use strict';
 const basePanel=()=>document.getElementById('obLivePeekR1');
 const getJa=()=>document.querySelector('.anime09')?.getAttribute('data-ob-live-lang')==='ja';
 let observed=null, sequence=0;
 function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
 function readWeek(panel){
   const hdr=panel.querySelector('.ob-live-peek-head .ob-live-kicker')?.textContent||'';
   const match=hdr.match(/(?:WEEK PEEK[^\d]*)(\d{1,2})/i);return match?Number(match[1]):null;
 }
 function buildTop3(panel,token){
   const top=panel.querySelector('.ob-live-top3');
   const grid=top?.querySelector('.ob-live-top3-grid');
   if(!grid)return;
   const orig=Array.from(grid.querySelectorAll('.ob-live-top3-item')).slice(0,3);
   if(!orig.length)return;
   const ranks=orig.map((item,index)=>({
     rank:index+1, title:item.querySelector('.ob-live-top3-title')?.textContent?.trim()||'',
     img:item.querySelector('img')?.getAttribute('src')||'',
     alt:item.querySelector('img')?.getAttribute('alt')||''
   }));
   const showcase=node('div','ob-r12-peek6-showcase');
   const podium=node('div','ob-r12-peek6-podium');
   podium.setAttribute('aria-hidden','true');
   const byRank=new Map(ranks.map(x=>[x.rank,x]));
   for(const rank of [2,1,3]){
     const x=byRank.get(rank);if(!x)continue;
     const stand=node('div','ob-r12-peek6-stand '+(rank===1?'is-first':rank===3?'is-third':'is-second'));
     stand.append(node('small','',getJa()?`${rank}位`:`No. ${rank}`));
     if(x.img){const img=node('img');img.src=x.img;img.alt='';img.loading='lazy';img.addEventListener('error',()=>img.remove());stand.append(img);}
     podium.append(stand);
   }
   const list=node('div','ob-r12-peek6-list');
   for(const x of ranks){
     const row=node('div','ob-r12-peek6-row');
     row.append(node('span','ob-r12-peek6-rank',String(x.rank).padStart(2,'0')));
     row.append(node('span','ob-r12-peek6-name',x.title));
     const point=node('span','ob-r12-peek6-points');point.dataset.rank=String(x.rank);
     row.append(point);list.append(row);
   }
   showcase.append(podium,list);grid.replaceWith(showcase);
   // The ranking reference is the same weekly JSON already used by renderPeek.
   // Enrichment is optional: never invent a score if its source is missing.
   const firstImg=ranks.find(x=>x.img)?.img||'';
   const pathMatch=firstImg.match(/images\/key-visuals\/(\d{4})\/(winter|spring|summer|fall)\//i);
   const w=readWeek(panel);
   if(!pathMatch||w===null)return;
   const year=pathMatch[1], season=pathMatch[2].toLowerCase();
   const week=String(w).padStart(2,'0');
   let url;try{url=new URL(`ranking/${year}/${season}/week${week}/ranking-week${week}-${season}${year}.json`,document.baseURI)}catch{return;}
   fetch(url).then(r=>r.ok?r.json():null).then(data=>{
     if(token!==sequence||!showcase.isConnected||!data)return;
     const entries=data?.meta?.weekly_ranking_reference?.entries;
     if(!Array.isArray(entries))return;
     for(const x of ranks){
       const info=entries.find(e=>Number(e.rank)===x.rank);
       const value=Number(info?.wrp_score);
       const dest=list.querySelector(`.ob-r12-peek6-points[data-rank="${x.rank}"]`);
       if(!dest||info?.wrp_score==null||!Number.isFinite(value))continue;
       const b=node('b','',value.toFixed(2));
       dest.append(node('span','', 'WRP '),b);
     }
   }).catch(()=>{});
 }
 function enhance(){
   const panel=basePanel();if(!panel||panel.hidden)return;
   const head=panel.querySelector('.ob-live-peek-head');
   if(!head||head.dataset.obR12Peek6==='ready')return;
   const context=panel.querySelector('.ob-live-peek-context');
   const stage=context?.querySelector('.ob-live-peek-stage');
   if(stage){stage.classList.add('ob-r12-peek6-stage');head.insertBefore(stage,head.querySelector('.ob-live-close'));}
   if(context){
     const hasEditorial=!!context.querySelector('.ob-live-peek-intro')?.textContent?.trim();
     context.classList.toggle('ob-r12-peek6-no-editorial',!hasEditorial);
     context.classList.toggle('ob-r12-peek6-has-editorial',hasEditorial);
   }
   const token=++sequence;
   buildTop3(panel,token);
   head.dataset.obR12Peek6='ready';
 }
 function attach(){
   const panel=basePanel();if(!panel||observed===panel)return false;
   observed=panel;
   const observer=new MutationObserver(records=>{
     if(records.some(r=>r.target===panel))enhance();
   });
   observer.observe(panel,{childList:true});
   enhance();return true;
 }
 function init(){
   if(attach())return;
   const search=new MutationObserver(()=>{if(attach())search.disconnect();});
   search.observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
