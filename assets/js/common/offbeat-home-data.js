/* OFFBEAT production: reads published articles from the preserved legacy index,
   and current weekly availability from weekly-rankings.json. No invented posts. */
(() => {
 'use strict';
  // Post Index v4.3: structured ledger; old HTML no longer required for publishing.
  // Unknown/special routes stay preserved in the ledger but are not yet drawn in Anime Archive.
  function fromPostIndex(data){
    if(data?.schemaVersion!==1||!Array.isArray(data.posts))throw Error('invalid post index schema');
    const list=[];
    for(const e of data.posts){
      const p=readPath(e.url||'');if(!p)continue;
      const rawImg=String(e.image?.src||'');let image='';
      if(rawImg){try{const u=new URL(rawImg,base);if(u.origin===base.origin&&u.pathname.startsWith(base.pathname))image=u.href;}catch{}}
      const title=String(e.title?.display||'');
      const intro=String(e.intro?.en||e.intro?.ja||'');
      const entry=create(p,{title,date:String(e.published?.iso||''),image,intro});
      entry.period=String(e.period?.display||'');
      entry.episodes=String(e.episodes?.display||'');
      entry.tags=Array.isArray(e.tags)?e.tags.filter(x=>typeof x==='string'):[];
      // OFFBEAT Post Index finish R2d: keep Top N and Final when rendering ranking cards.
      if(p.kind==='ranking'){
        const n=Number(e.topN), top=Number.isInteger(n)&&n>0?`Top ${n} `:'';
        const historical=String(e.title?.display||'');
        const isFinal=/\bfinal\b/i.test(historical);
        entry.title=p.week==='00'
          ? `${p.year} ${nice(p.season)} — ${top}Preliminary Ranking, Week 00`
          : `${p.year} ${nice(p.season)} — ${top}Weekly Anime ${isFinal?'Final ':''}Ranking, Week ${p.week}`;
      }
      list.push(entry);
    }
    return list;
  }
 const base=new URL('./',document.baseURI);
 const order={winter:0,spring:1,summer:2,fall:3};
 const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 const fmt=n=>String(n).padStart(2,'0');
 const nice=s=>s[0].toUpperCase()+s.slice(1);
 const allowed=/^(ranking|tierlist|features\/recommend)\/(\d{4})\/(winter|spring|summer|fall)\/week(\d{2})\/(?:index|tierlist)\.html$/i;
 function readPath(href){try{const u=new URL(href,base);if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname))return null;const rel=u.pathname.slice(base.pathname.length),m=rel.match(allowed);return m?{rel,kind:m[1],year:m[2],season:m[3].toLowerCase(),week:m[4]}:null;}catch{return null;}}
 const type=p=>p.kind==='ranking'?'ranking':p.kind==='tierlist'?'tier':'recommendation';
 const key=p=>Number(p.year)*1000+order[p.season]*100+Number(p.week);
 const dateOf=s=>{const n=Date.parse(s||'');return Number.isFinite(n)?new Date(n).toISOString().slice(0,10):''};
 function create(p,info={}){return {...p,category:'ANIME',type:type(p),url:new URL(p.rel,base).href,title:p.kind==='ranking'?`${p.year} ${nice(p.season)} — ${p.week==='00'?'Preliminary Ranking, Week 00':'Weekly Anime Ranking, Week '+p.week}`:(info.title||`${p.year} ${nice(p.season)} — ${type(p)==='tier'?'Tier List':'Recommendations'}`),date:info.date||'',image:info.image||'',intro:info.intro||'',excerpt:info.intro||'',originalTitle:info.title||''};}
 function fromLegacy(html){const doc=new DOMParser().parseFromString(html,'text/html'),list=[];doc.querySelectorAll('.post-card').forEach(card=>{
   const a=card.querySelector('a.read-more[href]')||card.querySelector('.post-image-mumu a[href]'),p=a&&readPath(a.getAttribute('href'));if(!p)return;
   const img=card.querySelector('img');let image='';if(img){try{const u=new URL(img.getAttribute('src'),base);if(u.origin===base.origin)image=u.href;}catch{}}
   list.push(create(p,{title:card.querySelector('.post-title')?.textContent.trim()||'',date:dateOf(card.querySelector('.post-date')?.textContent),image,intro:card.querySelector('.post-excerpt')?.textContent.trim()||''}));
 });return list;}
 function fromManifest(data){const list=[];for(const [year,seasons] of Object.entries(data||{})){if(!/^\d{4}$/.test(year))continue;for(const [season,spec] of Object.entries(seasons||{})){const s=season.toLowerCase();if(!(s in order))continue;for(const label of spec?.weeks||[]){const m=String(label).match(/^Week\s+(\d{2})$/i);if(!m)continue;const p=readPath(`ranking/${year}/${s}/week${m[1]}/index.html`);if(p)list.push(create(p));}}}return list;}
 function updateMenu(){const sel=document.getElementById('archiveSeason');if(!sel)return;const unique=[...new Set(Object.keys(archiveEntries).map(k=>k.split('|').slice(1,3).join('|')))].sort((a,b)=>{const A=a.split('|'),B=b.split('|');return Number(B[0])-Number(A[0])||order[B[1]]-order[A[1]];});const old=sel.value;sel.replaceChildren(...unique.map(v=>{const opt=document.createElement('option');opt.value=v;const p=v.split('|');opt.textContent=p[0]+' '+nice(p[1]);return opt;}));if(unique.includes(old))sel.value=old;document.getElementById('archiveType')?.dispatchEvent(new Event('change'));}
 function updateSeason(items){const rank=items.filter(p=>p.type==='ranking'&&p.week!=='00').sort((a,b)=>key(b)-key(a));const latest=rank[0];if(!latest)return;
   window.OFFBEAT_LATEST_URL=latest.url;const label=`${latest.year} ${nice(latest.season)}`,num=Number(latest.week);
   const sec=document.querySelector('#anime-top .n-season');if(sec){sec.setAttribute('aria-label',`Current anime season — ${label}, Week ${latest.week} of 12`);
     const set=(selector,value)=>{const e=sec.querySelector(selector);if(e)e.textContent=value;};
     set('.n-season-name h2 b',latest.year);set('.n-season-name h2 em',nice(latest.season));set('.n-season-sub-detail',`${latest.year} ${latest.season.toUpperCase()} · WEEK ${latest.week} OF 12`);set('.n-note-stage',`${Math.max(0,12-num)} WEEKS TO GO`);
     const now=sec.querySelector('.n-season-now-mark');if(now)now.lastChild.textContent=` NOW · WEEK ${latest.week}`;
     const progress=sec.querySelector('.n-progress-count');if(progress)progress.innerHTML=`${latest.week} <small>/ 12</small>`;
     const bar=sec.querySelector('.n-progress-track i');if(bar)bar.style.width=Math.min(100,num/12*100)+'%';
     const strip=sec.querySelector('.n-weeks');if(strip){strip.replaceChildren();for(let n=0;n<=12;n++){const w=fmt(n),href=`ranking/${latest.year}/${latest.season}/week${w}/index.html`,valid=items.some(p=>p.rel===href);const node=document.createElement(valid?'a':'span');if(valid)node.href=new URL(href,base).href;else node.classList.add('n-unreleased');if(n===0)node.classList.add('n-prelim');if(n===6)node.classList.add('n-milestone','n-milestone-mid');if(n===12)node.classList.add('n-milestone','n-milestone-final');if(n===num){node.classList.add('n-now');node.setAttribute('aria-current','step');node.setAttribute('aria-label','Current week '+w);}const txt=document.createElement('span');txt.textContent=n===0?'PRELIM':'W';const b=document.createElement('b');b.textContent=w;node.append(txt,b);strip.append(node);}}}
   const focus=document.querySelector('#anime-top .n-latest');if(focus){const head=focus.querySelector('.n-block-top>span');if(head)head.textContent=(latest.date?displayDate(latest.date)+' · ':'')+`WEEK ${latest.week}`;const card=focus.querySelector('a.n-rank-card');if(card){card.href=latest.url;card.setAttribute('aria-label',`${label}, Week ${latest.week} — Anime Ranking`);}const img=focus.querySelector('.n-rank-art img');if(img){if(latest.image){img.src=latest.image;img.alt=label+' ranking visual';}else{img.removeAttribute('src');img.alt='';}}const number=focus.querySelector('.n-rank-issue b');if(number)number.textContent=latest.week;const open=focus.querySelector('.n-rank-open span');if(open)open.textContent='VIEW WEEK '+latest.week;const over=focus.querySelector('.n-rank-overline');if(over)over.textContent=`${latest.year} ${latest.season.toUpperCase()} / WEEKLY RANKING`;const period=focus.querySelector('.n-rank-period');if(period){const m=latest.originalTitle.match(/\(([^)]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]*)\)/i);period.textContent=m?m[1].toUpperCase():'';}}
   const fixLinks=()=>{document.querySelectorAll('#greenNav a').forEach(a=>{if(a.textContent.trim()==='RANKING')a.href=latest.url;});};fixLinks();window.addEventListener('hashchange',()=>requestAnimationFrame(fixLinks));
   document.querySelectorAll('.n-contents a').forEach(a=>{if(a.getAttribute('href')?.includes('/ranking/2026/fall/week03/'))a.href=latest.url;});
 }
 function render(){renderRecent('#recentPosts',posts.slice(0,5));if(typeof nRenderRecent==='function')nRenderRecent();if(typeof renderAnime==='function')renderAnime(document.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter||'all');updateMenu();}
 async function load(){const results=await Promise.allSettled([
    fetch(new URL('posts-index.json',base),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('post index '+r.status);return r.json()}),
    fetch(new URL('weekly-rankings.json',base),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('manifest '+r.status);return r.json()})
 ]);
 const indexed=results[0].status==='fulfilled'?fromPostIndex(results[0].value):[],manifest=results[1].status==='fulfilled'?fromManifest(results[1].value):[];
 const map=new Map();for(const p of manifest)map.set(p.rel,p);for(const p of indexed)map.set(p.rel,{...map.get(p.rel),...p});const items=[...map.values()];
 if(!items.length){for(const selector of ['#recentPosts','#animeRecentPosts','#animeArchive']){const node=document.querySelector(selector);if(node)node.textContent='Published posts are temporarily unavailable.';}return;}
 items.sort((a,b)=>{if(!a.date||!b.date)return key(b)-key(a);return Date.parse(b.date)-Date.parse(a.date)||key(b)-key(a);});posts.splice(0,posts.length,...items);
 for(const name of Object.keys(archiveEntries))delete archiveEntries[name];for(const p of items)archiveEntries[[p.type,p.year,p.season,p.week].join('|')]=p.url;
 updateSeason(items);render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
