/* OFFBEAT Season Experience R3 — published Current Season content.
   First-34 2026 Fall master snapshot is data; featured picks are illustrative.
   Independent of R11 Week Peek and R15 cue. */
(() => {
'use strict';
const root=document.getElementById('obSeasonExperienceR3');
if(!root) return;
const featureGrid=document.getElementById('obFeaturedGridR3');
const featureSection=featureGrid.closest('.ob-study-section');
if(featureSection) featureSection.hidden=true; // Avoid flashing R3 example picks before the weekly selection loads.
let featuredSource=null;
const lineupGrid=document.getElementById('obLineupGridR3');
const featureToggle=document.getElementById('obFeaturedExpandR3');
const lineupToggle=document.getElementById('obLineupExpandR3');
const lineupCount=document.getElementById('obLineupCountR3');
const introTitle=document.getElementById('obHowTitleR3');
const introLead=document.getElementById('obHowLeadR3');
const howDetail=document.getElementById('obHowDetailsR3');
const more=document.getElementById('obHowMoreR3');
const howParas=[...root.querySelectorAll('[data-ob-how-paragraph]')];
const featureKicker=document.getElementById('obFeaturedKickerR3');
const featureTitle=document.getElementById('obFeaturedTitleR3');
const featureSub=document.getElementById('obFeaturedSubR3');
const featureNotice=document.getElementById('obFeaturedNoticeR3');
const featureHint=document.getElementById('obFeatureActionHintR4');
const lineupHint=document.getElementById('obLineupActionHintR4');
const lineupKicker=document.getElementById('obLineupKickerR3');
const lineupTitle=document.getElementById('obLineupTitleR3');
const lineupNote=document.getElementById('obLineupNoteR3');
const overlay=document.getElementById('obSeasonOverlayR3');
const modalArt=document.getElementById('obSeasonModalArtR3');
const modalTitle=document.getElementById('obSeasonModalTitleR3');
const modalEye=document.getElementById('obSeasonModalEyeR3');
const modalFacts=document.getElementById('obSeasonModalFactsR3');
const modalSynopsis=document.getElementById('obSeasonModalSynopsisR3');
const modalNote=document.getElementById('obSeasonModalFeaturedNoteR3');
const modalNoteLabel=document.getElementById('obSeasonModalNoteLabelR3');
const closeButton=document.getElementById('obSeasonCloseR3');
const intro = {
 en: {
  title:'HOW THE SEASON UNFOLDS',
  lead:"Each anime season kicks off with a preliminary round, narrowing the field before the main season begins. This fall, 34 titles made the opening lineup. From there, it's 12 weeks of weekly rankings—12 rounds, each with its own surprises, rises, and falls.",
  more:'MORE ABOUT THE SEASON',
  paragraphs:[
   "Every week is a new round, and the playing field never stays quite the same. Each title is evaluated on its own merits and in relation to the competition that week. A strong performance doesn't necessarily guarantee a higher score or ranking, and yesterday's frontrunner could find itself struggling to keep up.",
   "Some titles emerge as unexpected contenders, others steal the spotlight for a week, and some never make it to the finish line. Whether it's a sudden drop in quality, a change of direction, or an unexpected production delay, there's no telling how the lineup will evolve.",
   "At the same time, each series is building toward an ending of its own. Once the 12 weeks are over, the final ranking offers another perspective, combining the weekly results with a look at each series as a whole—its consistency, overall quality, and lasting impression.",
   "Sometimes that perspective lines up with the highs and lows we experienced week by week. Sometimes it tells a different story. And perhaps that's part of the fun—discovering just how differently we can experience the very same anime. Maybe, in the end, the journey reveals something about us, too—not just about the anime we've watched."
  ]
 },
 ja: {
  title:'シーズンの進み方',
  lead:'アニメの各シーズンは予選（プレリム）ラウンドから始まり、ここでまず作品の選考・絞り込みが行われ、本戦出場作品の顔ぶれが揃います。今期の本選スタート時のラインナップは34作品。ここから12週間、全12ラウンドの週間ランキングが始まります。毎週、予想外の展開や順位の浮き沈みや本戦からの脱落など、多くの波乱や興奮、感動が待っているのです。',
  more:'シーズンについてもっと読む',
  paragraphs:[
   '毎週が新たなラウンド。戦う舞台も、まったく同じままではありません。各作品は、その作品ならではの出来と、その週のほかの作品との比較の両方から評価されます。いい出来だったからといって、必ずしも高得点や上位が約束されるわけではありません。先週のトップランナーが、今週はおおいに苦戦することだってあるのです。',
   'ノーマークだった伏兵的な作品が思わぬパフォーマンスをみせ、ある週だけ注目をさらったり、さらには金星まであげることもあれば、一方で期待の有望株が最後までたどり着けず消え去る…なんてこともあり得るのです。突発的なクオリティの低下、予想外の方向転換、放送の延期……といったことは、予算や、製作委員会システム、業界の抱える闇や大人の諸事情、その他諸々を含めた条件が重なった、いわゆる「万策が尽きた」状況などによりいつでも引き起こされる可能性があるのです。よって、シーズン中にラインナップがどう変わっていくのかは、誰にもわかりはしないのです。',
   '同時に、それぞれの作品は、それぞれの結末（エンディング）へと向かって進んでいきます。12週間を終えた時に到達する、”最終（総合）ランキング”はまた別の視点を与えてくれます。週ごとの結果を積み重ねるだけでなく、一つの作品全体として見たときの一貫性、総合的な出来、そして心に残る印象なども含めて振り返る機会が与えられるともいえるのです。',
   'その見方が、毎週感じてきた浮き沈みと一致することもあれば、まったく違う物語を見せてくれることもあります。きっとそれもアニメを視聴するという行為の持つ楽しさの一つに違いありません。同じアニメを、こんなにも違った角度から体験できるのですから。そして最終的に、それは私たちが見てきた作品だけでなく、それを見てきた自分自身についても、何かが見えてくるということなのかもしれません。'
  ]
 }
};
const label={
 en:{featuredKicker:'IN FOCUS THIS SEASON',featured:'Featured Titles',sub:'A changing editorial selection',notice:'Sample selection for now · Weekly featured picks will be updated here.',lineupKicker:'THE SEASON POOL',lineup:"This Season’s Lineup",count:n=>`Opening lineup · ${n} titles`,lineupNote:'The opening main-season lineup, including titles not yet aired or later dropped.',featureAll:'VIEW ALL 8 FEATURED TITLES',lineupAll:'VIEW ALL 34 TITLES',less:'SHOW LESS',missing:'Synopsis not available.',eye:'2026 FALL · MAIN-SEASON LINEUP',featuredNote:'WHY FEATURED'},
 ja:{featuredKicker:'今シーズンの注目',featured:'注目作品 / Featured Titles',sub:'週ごとに変わる編集セレクション',notice:'現在の選出は仮のものです。今後、週ごとの注目作品に更新します。',lineupKicker:'本選出場作品',lineup:'今期の顔ぶれ / This Season’s Lineup',count:n=>`本選開始時のラインナップ · ${n}作品`,lineupNote:'本選開始時の全作品。未放送や、途中で評価対象から外れた作品も含みます。',featureAll:'注目作品をすべて見る',lineupAll:'全34作品を見る',less:'閉じる',missing:'あらすじデータなし。',eye:'2026年秋 · 本選出場作品',featuredNote:'注目の理由'}
};
const genresJa={Action:'アクション',Adventure:'冒険',Comedy:'コメディ',Drama:'ドラマ',Fantasy:'ファンタジー',Horror:'ホラー',Romance:'恋愛','Slice of Life':'日常',Sports:'スポーツ',Psychological:'心理',Mystery:'ミステリー','Sci-Fi':'SF',Supernatural:'超常現象',Thriller:'スリラー',Historical:'歴史',Music:'音楽',School:'学園',Mecha:'ロボット'};
let locale='en',data=null,selected=null,wasFocused=null;
function savedLang(){try{return localStorage.getItem('animeb-weekly-lang')==='ja'?'ja':'en';}catch(_){return 'en';}}
function langTitle(v){return (locale==='ja'?(v.jpTitle||v.title):(v.title||v.jpTitle))||'(Untitled)';}
function studio(v){return (locale==='ja'?(v.studiosJa||v.studios):(v.studios||v.studiosJa))||'—';}
function node(tag,cl,txt){const n=document.createElement(tag);if(cl)n.className=cl;if(txt!==undefined)n.textContent=txt;return n;}
function imgPath(v){return /^[a-z0-9_-]+$/i.test(v.kv)?new URL('images/key-visuals/2026/fall/'+v.kv+'.webp',document.baseURI).href:'';}
function artwork(v){const wrap=node('span','ob-season-image');const im=node('img');im.src=imgPath(v);im.alt=langTitle(v);im.loading='lazy';im.onerror=()=>{im.hidden=true;wrap.classList.add('is-missing');wrap.append(node('span','ob-season-image-fallback','KEY VISUAL'));};wrap.append(im);return wrap;}
function slug(g){return g.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function tags(v){const row=node('span','ob-season-genres');for(const g of (v.genres||[]).slice(0,4)){const s=node('span','ob-season-genre ob-genre-'+slug(g),locale==='ja'?(genresJa[g]||g):g);row.append(s);}return row;}
function featuredNote(v){const n=data.featuredNotes && data.featuredNotes[v.kv]; if(typeof n==='string')return n.trim();if(n && typeof n==='object') return String(n[locale]||'').trim();return '';}
function selectionCaption(){
 if(!featuredSource)return label[locale].notice;
 const w=featuredSource.week;
 const iso=featuredSource.date;
 let when='';
 if(/^\d{4}-\d{2}-\d{2}$/.test(iso)){
   const [y,m,d]=iso.split('-').map(Number);
   const date=new Date(Date.UTC(y,m-1,d));
   if(date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d){
     when=locale==='ja'?`${y}年${m}月${d}日`:date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
   }
 }
 return locale==='ja'?`選出：Week ${w} · 最終更新：${when||'—'}`:`Selection: Week ${w} · Updated ${when||'—'}`;
}
function setPublishedFeatured(weekly,week){
 const featured=weekly?.meta?.featured_titles;
 if(!featured || featured.schema!=='animeb-featured-titles-v1' || !Array.isArray(featured.items))throw Error('Unsupported featured_titles schema');
 if(weekly?.meta?.season!=='2026 Fall' || Number(String(weekly.meta.week).replace(/[^0-9]/g,''))!==week)throw Error('Week/season mismatch');
 if(featured.items.length>40)throw Error('Featured list unexpectedly long');
 const reference=new Set(data.items.map(v=>v.kv));
 const keys=[];const notes={};
 for(const pick of featured.items){
   const kv=String(pick?.kv||'');
   if(!reference.has(kv)||keys.includes(kv))throw Error('Unknown or duplicate featured key: '+kv);
   const masterTitle=data.items.find(v=>v.kv===kv).title;
   if(pick.title && pick.title!==masterTitle)throw Error('Featured title mismatch: '+kv);
   keys.push(kv);
   notes[kv]={en:String(pick.note?.en||''),ja:String(pick.note?.ja||'')};
 }
 data.featured=keys;
 data.featuredNotes=notes;
 const updateWeek=Number(String(featured.last_updated_week||'').replace(/[^0-9]/g,''));
 featuredSource={week:Number.isInteger(updateWeek)&&updateWeek>=1&&updateWeek<=week?String(updateWeek).padStart(2,'0'):String(week).padStart(2,'0'),date:String(featured.last_updated_on||'')};
}
async function loadPublishedFeatured(){
 let weeks=[4]; // Fallback only if the publication index is temporarily unavailable.
 try{
   const response=await fetch(new URL('weekly-rankings.json',document.baseURI),{cache:'no-store'});
   if(!response.ok)throw Error('Publication index HTTP '+response.status);
   const index=await response.json();
   const list=index?.['2026']?.Fall?.weeks;
   if(!Array.isArray(list))throw Error('No 2026 Fall index');
   weeks=[...new Set(list.map(v=>Number(String(v).match(/week\s*(\d+)/i)?.[1]||0)).filter(v=>v>=1&&v<=12))].sort((a,b)=>b-a);
 }catch(err){console.warn('OFFBEAT Featured: publication index unavailable, trying Week 04.',err);}
 for(const week of weeks){
   const folder='week'+String(week).padStart(2,'0');
   const path=`ranking/2026/fall/${folder}/ranking-${folder}-fall2026.json`;
   try{
     const response=await fetch(new URL(path,document.baseURI),{cache:'no-store'});
     if(!response.ok)continue;
     const weekly=await response.json();
     if(!Object.prototype.hasOwnProperty.call(weekly.meta||{},'featured_titles'))continue; // Inherited from previous editorial week.
     setPublishedFeatured(weekly,week);return;
   }catch(err){console.warn('OFFBEAT Featured: skipping invalid weekly data for '+folder,err);}
 }
 console.warn('OFFBEAT Featured: no published selection available; retaining R3 sample picks.');
}

function openModal(v){selected=v;wasFocused=document.activeElement;updateModal();overlay.hidden=false;document.body.classList.add('ob-season-modal-open');closeButton.focus();}
function updateModal(){if(!selected)return;overlay.lang=locale;const v=selected;modalArt.src=imgPath(v);modalArt.alt=langTitle(v);modalArt.onerror=()=>{modalArt.hidden=true;};modalArt.onload=()=>{modalArt.hidden=false;};modalTitle.textContent=langTitle(v);modalEye.textContent=label[locale].eye;modalFacts.replaceChildren(node('span','',studio(v)),tags(v));modalSynopsis.textContent=(locale==='ja'?(v.synopsisJa||v.synopsis):(v.synopsis||v.synopsisJa))||label[locale].missing;const note=featuredNote(v);modalNote.hidden=!note;modalNoteLabel.textContent=label[locale].featuredNote;modalNote.querySelector('p').textContent=note;}
function closeModal(){overlay.hidden=true;document.body.classList.remove('ob-season-modal-open');selected=null;if(wasFocused && wasFocused.isConnected)wasFocused.focus();}
closeButton.addEventListener('click',closeModal);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal();});
document.addEventListener('keydown',e=>{if(overlay.hidden)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const controls=[...overlay.querySelectorAll('button:not([hidden])')];if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}});
function expandCaption(button,expanded,kind){
 if(expanded){button.textContent=locale==='en'?'Show less':label[locale].less;return;}
 const featured=kind==='featured';const n=featured?data.featured.length:data.initialSeasonPool;
 const parts=locale==='ja'?(featured?['注目','作品をすべて見る']:['全','作品を見る']):(featured?['View all ',' featured titles']:['View all ',' titles']);
 button.replaceChildren(document.createTextNode(parts[0]),node('strong','ob-r4-accent-number',String(n)),document.createTextNode(parts[1]));
}
function lineupCountCaption(n){
 const desc=node('span','ob-r4-count-desc',locale==='ja'?'本選開始時のラインナップ':'Opening lineup');
 const figure=node('span','ob-r4-count-figure');
 figure.append(node('strong','ob-r4-accent-number',String(n)),node('span','ob-r4-count-unit',locale==='ja'?'作品':'titles'));
 lineupCount.replaceChildren(desc,figure);
}
function actionHint(kind){
 const isPointer=window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
 if(locale==='ja')return (isPointer?'クリック':'タップ')+'すると詳細が見られます。';
 return (isPointer?'Click':'Tap')+(kind==='featured'?' a title':' a poster')+' for details.';
}
function toggle(grid,button){const expanded=!grid.classList.contains('is-expanded');grid.classList.toggle('is-expanded',expanded);button.setAttribute('aria-expanded',String(expanded));expandCaption(button,expanded,grid===featureGrid?'featured':'lineup');}
featureToggle.addEventListener('click',()=>toggle(featureGrid,featureToggle));
lineupToggle.addEventListener('click',()=>toggle(lineupGrid,lineupToggle));
function refresh(requested){locale=requested==='ja'?'ja':'en';root.lang=locale;introTitle.textContent=intro[locale].title;introLead.textContent=intro[locale].lead;more.textContent=intro[locale].more;howParas.forEach((p,i)=>{p.textContent=intro[locale].paragraphs[i]||'';});
 featureKicker.textContent=label[locale].featuredKicker;featureTitle.textContent=label[locale].featured;featureSub.textContent=label[locale].sub;featureNotice.textContent=selectionCaption();
 featureHint.textContent=actionHint('featured');lineupHint.textContent=actionHint('lineup');
 lineupKicker.textContent=label[locale].lineupKicker;lineupTitle.textContent=label[locale].lineup;
 if(!data)return;
 lineupCountCaption(data.initialSeasonPool);lineupNote.textContent=label[locale].lineupNote;
 const feOpen=featureGrid.classList.contains('is-expanded'),liOpen=lineupGrid.classList.contains('is-expanded');
 featureGrid.replaceChildren();
 for(const k of data.featured){const v=data.items.find(x=>x.kv===k);if(!v)continue;const b=node('button','ob-featured');b.type='button';b.setAttribute('aria-label',langTitle(v));const info=node('span','ob-featured-copy');info.append(node('strong','ob-featured-title',langTitle(v)),node('span','ob-featured-studio',studio(v)),tags(v));const note=featuredNote(v);if(note){const clip=node('span','ob-r5-featured-note',note);clip.title=note;info.append(clip);}b.append(artwork(v),info);b.addEventListener('click',()=>openModal(v));featureGrid.append(b);}
 lineupGrid.replaceChildren();
 for(const v of data.items){const b=node('button','ob-lineup-item');b.type='button';b.setAttribute('aria-label',langTitle(v));b.title=langTitle(v);b.append(artwork(v));b.addEventListener('click',()=>openModal(v));lineupGrid.append(b);}
 featureGrid.classList.toggle('is-expanded',feOpen);lineupGrid.classList.toggle('is-expanded',liOpen);
 expandCaption(featureToggle,feOpen,'featured');expandCaption(lineupToggle,liOpen,'lineup');featureToggle.hidden=data.featured.length<=4;
 if(selected)updateModal();
}
refresh(savedLang());
// R11 language buttons stop propagation: capture the selection before the mast handler.
// R3 renders explicitly from the clicked language; no competing guessed toggle state.
document.addEventListener('click',e=>{
 const hit=e.target instanceof Element && e.target.closest('.ob-week-peek-language button[data-peek-lang]');
 if(!hit)return;const chosen=hit.getAttribute('data-peek-lang');if(chosen!=='en'&&chosen!=='ja')return;
 setTimeout(()=>refresh(chosen),0);
},true);
window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang')refresh(savedLang());});
window.addEventListener('pageshow',()=>refresh(savedLang()));
fetch(new URL('assets/data/offbeat-season-2026-fall.json?v=3',document.baseURI),{cache:'no-store'})
 .then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
 .then(async d=>{if(!Array.isArray(d.items)||d.items.length!==34||d.initialSeasonPool!==34||new Set(d.items.map(v=>v.kv)).size!==34)throw new Error('Season master lineup mismatch');data=d;await loadPublishedFeatured();if(featureSection)featureSection.hidden=data.featured.length===0;refresh(savedLang());})
 .catch(err=>{console.error('OFFBEAT Season Experience:',err);lineupCount.textContent=locale==='ja'?'作品データを読み込めませんでした':'Unable to load lineup';});
})();
