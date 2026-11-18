/* OFFBEAT / R29: source-aligned This Week & This Season trial.
 * IMPORTANT: the live R12 renderer moves #animeLatest into #obLiveWeekSeasonR8.
 * R28 failed by treating it as a direct child of .n-focus and writing into
 * .n-contents, which the live CSS deliberately hides. R29 ONLY operates
 * inside the existing LIVE #animeLatest, keeps its published-ranking card,
 * its browse links and the original hidden #animeTier compatibility node.
 * No page/season data is altered, and all future editorial links require a
 * published entry in posts-index.json. Nothing fires on other pages.
 */
(() => {
 'use strict';
 const root=document.querySelector('#anime-top.anime09');
 if(!root)return;
 const $=(q,parent=root)=>parent.querySelector(q);
 const mk=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
 const seasons={fall:['Fall','秋'],winter:['Winter','冬'],spring:['Spring','春'],summer:['Summer','夏']};
 const groups={
   prelim:{week:'W00',key:['PRELIMINARY','予選'],stage:['SELECTION ROUND','予選'],label:['BEFORE THE SEASON · WEEK 00','シーズン開始前 · 第00週']},
   opening:{week:'W01',key:['FIRST IMPRESSIONS','ファーストインプレッション'],stage:['OPENING','序盤'],label:['SEASON PREMIERE · WEEK 01','シーズン開幕 · 第01週']},
   middle:{week:'W06',key:['MIDSEASON','ミッドシーズン'],stage:['MIDDLE','中盤'],label:['HALFWAY VERDICT · WEEK 06','折り返し評価 · 第06週']},
   final:{week:'W12',key:['FINAL','ファイナル'],stage:['CLIMAX','クライマックス'],label:['THE FINAL VERDICT · WEEK 12','最終評価 · 第12週']}
 };
 const str=(en,ja)=>isJa()?ja:en;
 const isJa=()=>{if(root.dataset.obLiveLang)return root.dataset.obLiveLang==='ja';try{return localStorage.getItem('animeb-weekly-lang')==='ja';}catch{return false;}};
 const cleanUrl=url=>{try{const u=new URL(url,document.baseURI);const base=new URL(document.baseURI);return u.origin===base.origin&&u.pathname.startsWith(new URL('.',base).pathname)?u.href:null;}catch{return null;}};
 const safePosts=posts=>posts.filter(x=>x && x.status==='published' && typeof x.url==='string' && cleanUrl(x.url));
 const numWeek=x=>Number(x?.week ?? -1);
 const order={winter:0,spring:1,summer:2,fall:3};
 let posts=[],current=null,els={};
 function category(p){
   const w=numWeek(p);
   if(w===0&&p.type==='ranking')return 'prelim';
   if(w===1&&p.type==='tier')return 'opening';
   if(w===6&&(p.type==='tier'||p.type==='recommendation'))return 'middle';
   if(w===12&&(p.type==='tier'||p.type==='recommendation'))return 'final';
   return null;
 }
 function editorial(p){
   const group=category(p);
   if(!group||!current||p.year!==current.year||p.season!==current.season)return null;
   return {group,kind:p.type,post:p};
 }
 function title(e){
   if(e.group==='prelim')return str('Preliminary Ranking','予選ランキング');
   if(e.kind==='recommendation')return str('Recommendations & Enjoyment Ranking','おすすめ作品・満足度ランキング');
   if(e.group==='opening')return str('First Impressions — Tier List','ファーストインプレッション — ティアリスト');
   if(e.group==='middle')return str('Midseason Tier List','ミッドシーズン・ティアリスト');
   return str('Final Tier List','最終ティアリスト');
 }
 function kicker(e){
   if(e.kind==='recommendation')return e.group==='middle'?str('HALFWAY PICKS · WEEK 06','中間おすすめ · 第06週'):str('SEASON-LONG PICKS · WEEK 12','シーズン総括 · 第12週');
   return str(...groups[e.group].label);
 }
 function setup(){
   const group=$('#obLiveWeekSeasonR8'),latest=$('#animeLatest'),card=$('#animeLatest>.n-rank-card');
   if(!group||!latest||!card||!group.contains(latest)||group.dataset.obR29)return false;
   // Never relocate #animeLatest (or insert a sibling using the wrong parent):
   // the live group is the actual owner after R12 has run.
   const oldHead=latest.querySelector(':scope>.n-block-top');
   if(!oldHead)return false;
   const leftHead=mk('div','ob-r29-lefthead');
   const lead=mk('div','ob-r29-kicker');
   lead.append(mk('b','',str('CURRENT ROUND','今週のランキング')),mk('span','',str('/ THE WEEKLY REPORT','/ 週間レポート')));
   const deck=mk('p','ob-r29-deck',str('The full Top 10, episode scores and reviews, weekly highlights—and much more.','トップ10全作品の評価・レビュー、今週のハイライトなど、さらに詳しい内容を掲載。'));
   leftHead.append(lead,oldHead,deck);
   latest.prepend(leftHead);
   const right=mk('aside','ob-r29-right');right.id='obR29Editorial';
   right.append(mk('div','ob-r29-kicker'),mk('div','ob-r29-titleline'),mk('p','ob-r29-deck'),mk('div','ob-r29-articlelist'),mk('div','ob-r29-footer'));
   latest.append(right);
   group.classList.add('ob-r29-section');latest.classList.add('ob-r29-ranking');root.classList.add('ob-r29-on');
   group.dataset.obR29='yes';els={group,latest,lead,deck,right};
   return true;
 }
 function applyEditorial(){
   if(!els.right||!current)return;
   const year=current.year,season=current.season;const ja=isJa();
   const r=els.right;
   const k=r.querySelector('.ob-r29-kicker');k.replaceChildren(mk('b','',str('SEASON EDITORIAL','シーズン特集')),mk('span','',str('/ BEYOND THE WEEKLY RANKING','/ 週間ランキングのその先へ')));
   const titleline=r.querySelector('.ob-r29-titleline');titleline.replaceChildren();
   const h=mk('h3');h.append(document.createTextNode(str('Also from ','こちらも ')),mk('strong','ob-r29-year',year),document.createTextNode(' '),mk('strong','ob-r29-season '+season,ja?seasons[season][1]:seasons[season][0]),mk('small','',str(' SEASON','シーズン')));
   const pub=safePosts(posts).map(editorial).filter(Boolean).sort((a,b)=>['prelim','opening','middle','final'].indexOf(a.group)-['prelim','opening','middle','final'].indexOf(b.group) || (a.kind==='tier'?-1:1));
   const count=mk('span','ob-r29-count');count.append(mk('b','',String(pub.length).padStart(2,'0')),document.createTextNode(str(' FEATURES',' 件の特集')));
   titleline.append(h,count);
   r.querySelector('.ob-r29-deck').textContent=str('Beyond the weekly standings: the season’s key editorial checkpoints.','週間ランキングだけではない、シーズンの節目となる特集。');
   const list=r.querySelector('.ob-r29-articlelist');list.replaceChildren();
   for(const name of ['prelim','opening','middle','final']){
     const items=pub.filter(x=>x.group===name);if(!items.length)continue;
     const meta=groups[name],section=mk('section','ob-r29-article-group ob-r29-'+name);
     const line=mk('div','ob-r29-group-label');line.append(mk('strong','',str(...meta.key)+' · '+meta.week),mk('span','',str(...meta.stage)));section.append(line);
     for(const item of items){
       const link=mk('a','ob-r29-article');link.href=cleanUrl(item.post.url);link.setAttribute('aria-label',title(item));
       const main=mk('span','ob-r29-article-main');main.append(mk('small','',kicker(item)),mk('strong','',title(item)));
       const action=mk('span','ob-r29-action');action.append(mk('span','',str('EXPLORE','記事へ')),mk('b','', '»'));
       link.append(main,action);section.append(link);
     }
     list.append(section);
   }
   const footer=r.querySelector('.ob-r29-footer');footer.replaceChildren(mk('span','',str('MORE THAN A WEEKLY RANKING','週間ランキングのその先へ')),mk('i'),mk('span','',ja?`${year}年${seasons[season][1]}`:`${seasons[season][0].toUpperCase()} ${year}`));
 }
 function refresh(){
   if(!els.group)return;
   const newHead=els.lead;newHead.replaceChildren(mk('b','',str('CURRENT ROUND','今週のランキング')),mk('span','',str('/ THE WEEKLY REPORT','/ 週間レポート')));
   els.deck.textContent=str('The full Top 10, episode scores and reviews, weekly highlights—and much more.','トップ10全作品の評価・レビュー、今週のハイライトなど、さらに詳しい内容を掲載。');
   applyEditorial();
 }
 function timelines(){
   const timeline=$('.n-season-dashboard .n-weeks');
   if(!timeline||timeline.children.length!==13)return;
   for(const [n,t] of [...timeline.children].entries()){
     const period=n===0?'prelim':n<=3?'opening':n<=7?'middle':n<=10?'late':'climax';
     t.classList.add('ob-r29-week','ob-r29-'+period);
   }
   const stages=$('#obLivePhasesR1');if(stages&&stages.children.length===4) {
     ['opening','middle','late','climax'].forEach((name,n)=>stages.children[n].classList.add('ob-r29-'+name));
   }
 }
 async function init(){
   // Real live script initializes asynchronously after window.load. Wait for
   // its real wrapper instead of guessing the original HTML parent.
   let group=null;for(let n=0;n<40;n++){
     group=$('#obLiveWeekSeasonR8');if(group&&$('#animeLatest>.n-rank-card'))break;
     await new Promise(r=>setTimeout(r,150));
   }
   if(!group){console.warn('R29 skipped: expected R12 wrapper not initialized');return;}
   try{
     const response=await fetch(new URL('posts-index.json',document.baseURI),{cache:'no-store'});
     if(!response.ok)throw Error('posts-index '+response.status);
     const manifest=await response.json();posts=manifest.posts||[];
     const ranks=safePosts(posts).filter(p=>p.type==='ranking'&&numWeek(p)>=1).sort((a,b)=>Number(b.year)-Number(a.year) || order[b.season]-order[a.season] || numWeek(b)-numWeek(a));
     if(!ranks.length)throw Error('No published ranking');
     const latest=ranks[0];current={year:latest.year,season:latest.season};
     if(!setup())throw Error('Expected R12 structure not present: not installed');
     timelines();refresh();
     // Existing i18n and live rerendering continue to own all primary content.
     // Only bilingual labels created by this addon are refreshed.
     new MutationObserver(()=>refresh()).observe(root,{attributes:true,attributeFilter:['data-ob-live-lang']});
     window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang')refresh();});
     // Rare timeline rebuild (other archive/season navigation); no reflow loop.
     const host=$('.n-season-dashboard');if(host)new MutationObserver(()=>{if(host.querySelectorAll('.n-weeks>.ob-r29-week').length!==13)timelines();}).observe(host,{childList:true,subtree:true});
     console.info('OFFBEAT R29 applied: '+ranks[0].url+'; editorial from published index.');
   }catch(err){console.error('OFFBEAT R29 safe stop:',err);}
 }
 if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
})();
