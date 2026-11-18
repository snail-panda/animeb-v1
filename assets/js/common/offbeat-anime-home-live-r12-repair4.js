/* OFFBEAT R12 targeted repair 4. Remains outside the original JS.
   Fixes return-button reparenting by earlier scripts; makes checkpoint labels
   show only links confirmed in posts-index.json (canonical published ledger). */
(()=>{'use strict';
 const root=()=>document.querySelector('.anime09.ob-live-r12');
 const main=()=>root()?.querySelector('.n-season-13');
 const jp=()=>{
   try{return localStorage.getItem('animeb-weekly-lang')==='ja'||document.getElementById('anime-top')?.lang==='ja'}catch{return false}
 };
 const local=(en,ja)=>jp()?ja:en;
 let checkpointPosts=null;
 let checkpointRequestStarted=false;
 let pending=false;
 const checkDock=()=>{
   const sec=main();if(!sec)return;
   const row=sec.querySelector('.n-season-header .ob-r12-archive-actions');
   const chooser=sec.querySelector('.n-season-header .n-season-chooser');
   const back=sec.querySelector('.n-season-header .ob-r16-back');
   const overview=sec.querySelector('.n-season-header .ob-r16-overview');
   if(!row||!back||!overview||!chooser)return;
   // R12 refresh previously moved Back to Current into the chooser again,
   // which brought back a third row and a vertical jump on archived seasons.
   if(back.parentElement!==row)row.insertBefore(back,overview);
   if(overview.parentElement!==row)row.append(overview);
 };
 const decorateLegend=()=>{
   const legend=root()?.querySelector('.ob-live-stage-legend');
   if(legend)legend.dataset.milestoneCaption=local('MILESTONES','節目');
 };
 const published=(posts,year,season,week,type)=>posts.find(x=>
   x && x.status==='published' && x.url && String(x.year)===year &&
   String(x.season||'').toLowerCase()===season &&
   Number(x.week)===week && x.type===type &&
   // Only paths in the canonical internal published index. No invented pages.
   /^(?:tierlist|features\/recommend)\/\d{4}\/(?:winter|spring|summer|fall)\/week\d{2}\//i.test(String(x.url))
 );
 const renderCheckpoints=()=>{
   const sec=main(),cp=sec?.querySelector('.n-checkpoints');
   if(!cp||!checkpointPosts)return;
   const yy=sec.querySelector('.n-season-name h2 b')?.textContent?.trim();
   const season=sec.querySelector('.n-season-name h2 em')?.textContent?.trim().toLowerCase();
   if(!/^\d{4}$/.test(yy||'')||!['fall','summer','winter','spring'].includes(season))return;
   const lang=jp()?'ja':'en';
   const key=`${yy}/${season}/${lang}`;
   if(cp.dataset.obR12CheckpointKey===key)return;
   const entries=[];
   const h=document.createElement('span');h.textContent=local('SEASON CHECKPOINTS','シーズンの節目');entries.push(h);
   const add=(label,link,pending=false)=>{
     const el=document.createElement(link?'a':'span');
     el.className='ob-r12-checkpoint-entry'+(pending?' ob-r12-checkpoint-pending':'');
     el.textContent=label;
     if(link)el.href=link;
     entries.push(el);
   };
   const posts=checkpointPosts;
   for(const wk of [1,6,12]){
     const tier=published(posts,yy,season,wk,'tier');
     const rec=published(posts,yy,season,wk,'recommendation');
     const week='W'+String(wk).padStart(2,'0');
     if(wk===1){
       if(tier)add(local(`First Impressions Tier List · ${week}`,`初回印象ティアリスト · ${week}`),tier.url);
       else add(local(`First Impressions · ${week} (upcoming)`,`初回印象 · ${week}（未公開）`),null,true);
     }else{
       const phase=wk===6?local('Midseason','中間'):local('Final','最終');
       if(tier)add(`${phase} · ${local('Tier List','ティアリスト')} ${week}`,tier.url);
       if(rec)add(`${phase} · ${local('Recommendations','おすすめ')} ${week}`,rec.url);
       if(!tier&&!rec)add(`${phase} · ${week} ${local('(upcoming)','（未公開）')}`,null,true);
     }
   }
   const note=document.createElement('small');note.className='ob-r12-checkpoint-note';
   note.textContent=local('Published features are linked; future ones are guides.','公開済みの特集のみリンク。未公開の節目は目安です。');
   entries.push(note);cp.replaceChildren(...entries);cp.dataset.obR12CheckpointKey=key;
 };
 const run=()=>{pending=false;checkDock();decorateLegend();renderCheckpoints();};
 const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(run);};
 const begin=()=>{
   const sec=main();if(!sec){new MutationObserver((_,ob)=>{if(main()){ob.disconnect();begin();}})
     .observe(document.documentElement,{childList:true,subtree:true});return;}
   schedule();
   const chooser=sec.querySelector('.n-season-chooser');
   if(chooser){
     new MutationObserver(()=>{
       const back=sec.querySelector('.n-season-header .ob-r16-back');
       const row=sec.querySelector('.ob-r12-archive-actions');
       if(back&&row&&back.parentElement!==row)schedule();
     }).observe(chooser,{childList:true,subtree:true});
   }
   const seasonName=sec.querySelector('.n-season-name');
   if(seasonName)new MutationObserver(schedule).observe(seasonName,{childList:true,subtree:true,characterData:true});
   document.addEventListener('click',e=>{if(e.target.closest('[data-peek-lang], #obLangToggle, .ob-language-toggle'))setTimeout(()=>{
     const cp=sec.querySelector('.n-checkpoints');if(cp)delete cp.dataset.obR12CheckpointKey;schedule();
   },180);},true);
   window.addEventListener('storage',()=>{const cp=sec.querySelector('.n-checkpoints');if(cp)delete cp.dataset.obR12CheckpointKey;schedule();});
   if(!checkpointRequestStarted){checkpointRequestStarted=true;
     fetch('posts-index.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{
       if(Array.isArray(d?.posts)){checkpointPosts=d.posts;schedule();}
     }).catch(()=>{/* keep the existing checkpoint row if the ledger cannot load */});
   }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});
 else begin();
})();
