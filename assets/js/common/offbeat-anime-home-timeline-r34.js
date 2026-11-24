/* OFFBEAT R34 — live timeline hierarchy, four Season Checkpoints, About S.O.W. map.
   Keeps R12 timeline/events, R12 published-checkpoint data, R29/R32 editorial,
   and R33 UP NEXT intact. The existing checkpoint row is preserved in the DOM.
   Only links to verified published articles in posts-index.json are created. */
(() => {
  'use strict';
  const root = document.querySelector('#anime-top.anime09');
  if (!root) return;
  const $ = (sel,within=root) => within?.querySelector(sel);
  const mk = (tag,cls,value) => {
    const x=document.createElement(tag);
    if (cls) x.className=cls;
    if (value!==undefined) x.textContent=String(value);
    return x;
  };
  const ja = () => {
    if(root.dataset.obLiveLang) return root.dataset.obLiveLang==='ja';
    try {return localStorage.getItem('animeb-weekly-lang')==='ja';}catch{return false;}
  };
  const tr = (en,jp) => ja()?jp:en;
  const names=[
    {id:'prelim',en:'PRELIMINARY',jp:'予選',week:0,types:['ranking']},
    {id:'opening',en:'FIRST IMPRESSIONS',jp:'ファーストインプレッション',week:1,types:['tier']},
    {id:'middle',en:'MIDSEASON',jp:'ミッドシーズン',week:6,types:['tier','recommendation']},
    {id:'final',en:'FINAL',jp:'ファイナル',week:12,types:['tier','recommendation']}
  ];
  const base=new URL('.',document.baseURI);
  function safePath(path){
    if(typeof path!=='string')return null;
    try {
      const url=new URL(path,base);
      if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return null;
      if(!/\/(ranking|tierlist|features\/recommend)\/\d{4}\/(fall|winter|spring|summer)\/week\d{2}\//i.test(url.pathname))return null;
      return url.href;
    }catch{return null;}
  }
  function season(){
    const y=Number($('.n-season-name h2 b')?.textContent?.trim());
    const label=($('.n-season-name h2 em')?.textContent||'').trim().toLowerCase();
    const seasonMap={fall:'fall','秋':'fall',spring:'spring','春':'spring',summer:'summer','夏':'summer',winter:'winter','冬':'winter'};
    const s=seasonMap[label];
    if(!Number.isInteger(y)||y<2000||y>2100||!s)return null;
    return {y,s};
  }
  function currentWeek(nav){
    const cells=[...nav.children];
    const now=cells.findIndex(x=>x.classList.contains('n-now'));
    if(now>=0)return now;
    const v=Number($('.n-season-progress .n-progress-count')?.textContent?.match(/\d+/)?.[0]);
    return Number.isInteger(v)&&v>=0&&v<=12?v:0;
  }
  function setClass(el,name,on){if(el.classList.contains(name)!==on)el.classList.toggle(name,on);}
  function applyTimeline(){
    const nav=$('.n-season-dashboard .n-weeks');
    const dashboard=$('.n-season-dashboard');
    if(!dashboard||!nav||nav.children.length!==13)return;
    const current=currentWeek(nav);
    dashboard.classList.add('ob-r34-timeline');
    [...nav.children].forEach((node,week)=>{
      const past=week<current,active=week===current,upcoming=week>current;
      setClass(node,'ob-r34-past',past);
      setClass(node,'ob-r34-current',active);
      setClass(node,'ob-r34-future',upcoming);
      // Give W06 special emphasis only when next, and W12 once Climax begins.
      setClass(node,'ob-r34-imminent',(week===6&&current===5)||(week===12&&current===11));
    });
    const phase=$('#obLivePhasesR1');
    if(phase&&phase.children.length===4){
      const active=current<=3?0:current<=7?1:current<=10?2:3;
      [...phase.children].forEach((x,i)=>{
        setClass(x,'ob-r34-phase-past',current>0&&i<active);
        setClass(x,'ob-r34-phase-current',current>0&&i===active);
        setClass(x,'ob-r34-phase-future',current===0||i>active);
      });
    }
  }
  let published=null;
  function entries(y,s){
    const map=new Map();
    for(const p of published||[]){
      if(!p||p.status!=='published'||Number(p.year)!==y||p.season!==s)continue;
      const week=Number(p.week),type=p.type;
      const stage=names.find(x=>x.week===week&&x.types.includes(type));
      if(!stage)continue;
      const url=safePath(p.url);
      if(!url)continue;
      // Use a single canonical first match. Never invent a future URL.
      const key=stage.id+':'+type;
      if(!map.has(key))map.set(key,url);
    }
    return map;
  }
  let lastKey='';
  function checkpoints(){
    if(!published)return;
    const dashboard=$('.n-season-dashboard'),legacy=$('.n-checkpoints',dashboard);
    const s=season();
    if(!dashboard||!legacy||!s)return;
    const links=entries(s.y,s.s),lang=ja()?'ja':'en';
    const key=`${s.y}/${s.s}/${lang}/`+[...links.entries()].map(v=>v.join('=')).join('/');
    const current=$('#obR34Checkpoints',dashboard);
    if(current&&lastKey===key)return;
    const section=current||mk('section','ob-r34-checkpoints');
    section.id='obR34Checkpoints';
    section.setAttribute('aria-label',tr('Season checkpoints','シーズンの節目'));
    const head=mk('span','ob-r34-checkpoints-title',tr('SEASON CHECKPOINTS','シーズンのチェックポイント'));
    const grid=mk('div','ob-r34-checkpoints-grid');
    for(const stage of names){
      const isPublished=stage.types.some(t=>links.has(stage.id+':'+t));
      const wrapper=mk('div','ob-r34-checkpoint ob-r34-cp-'+stage.id+(isPublished?' ob-r34-cp-published':' ob-r34-cp-future'));
      const primary=links.get(stage.id+':tier')||links.get(stage.id+':ranking')||links.get(stage.id+':recommendation');
      const main=mk(primary?'a':'span','ob-r34-cp-main');
      if(primary){main.href=primary;main.setAttribute('aria-label',tr(stage.en,stage.jp)+' · W'+String(stage.week).padStart(2,'0'));}
      else main.setAttribute('aria-label',tr('Upcoming: ','未公開：')+tr(stage.en,stage.jp));
      main.append(mk('span','',tr(stage.en,stage.jp)),mk('span','ob-r34-cp-week','· W'+String(stage.week).padStart(2,'0')));
      wrapper.append(main);
      // Midseason/Final can have two distinct published pieces: keep both reachable
      // without turning the four checkpoint categories into six bright headings.
      if(links.has(stage.id+':tier')&&links.has(stage.id+':recommendation')){
        const extra=mk('a','ob-r34-cp-extra',tr('+ RECS','＋おすすめ'));
        extra.href=links.get(stage.id+':recommendation');
        extra.setAttribute('aria-label',tr('Open recommendations','おすすめ記事を開く')+' · W'+String(stage.week).padStart(2,'0'));
        wrapper.append(extra);
      }
      grid.append(wrapper);
    }
    section.replaceChildren(head,grid);
    if(!current)legacy.after(section);
    dashboard.classList.add('ob-r34-has-checkpoints');
    lastKey=key;
  }
  function about(){
    // R50: Put the timeless season map in the ABOUT S.O.W. FAQ, NOT in the
    // "What is S.O.W.?" reading modal. R34 retains ownership of map contents.
    const guide=$('#obLiveGuideR5');
    if(!guide)return;
    let details=document.getElementById('obR34SeasonMap');
    const priorOpen=!!details?.open;
    if(!details){
      details=mk('details','ob-r34-map-details');details.id='obR34SeasonMap';
    }
    const how=$('#obLiveHowWrapR4',guide);
    if(details.parentElement!==guide){
      if(how)how.after(details);
      else guide.append(details);
    }
    const summary=mk('summary');
    summary.append(mk('span','',tr('The Season at a Glance / Periods & Checkpoints','シーズンの構成 / 期間とチェックポイント')));
    const content=mk('div','ob-r34-map-contents');
    content.append(mk('p','ob-r34-map-explain',tr(
      'OFFBEAT begins with a preliminary selection, then follows twelve weekly rounds. The four stages below are a way of reading that journey—not a fixed rule for how anime broadcasts work.',
      'OFFBEATでは予選で作品を選び、続く12週間を毎週のラウンドとして追いかけます。下の4つの期間区分は、その流れを見るための目安であり、アニメ放送全般に共通する決まりではありません。')));
    content.append(mk('p','ob-r34-map-intro',tr('An overview of the season — not live standings','シーズン全体の構成図（現在の順位ではありません）')));
    const weeks=mk('div','ob-r34-map-weeks');
    weeks.setAttribute('role','img');
    weeks.setAttribute('aria-label',tr('Preliminary W00, Opening weeks 1–3, Middle weeks 4–7 with Midseason W06, Late weeks 8–10, Climax weeks 11–12 with Final W12','予選第00週、序盤第1〜3週、中盤第4〜7週（中間第6週）、後半第8〜10週、クライマックス第11〜12週（最終第12週）'));
    for(let w=0;w<=12;w++){
      const cls=w===0?'is-prelim':w<=3?'is-opening':w<=7?'is-middle':w<=10?'is-late':'is-climax';
      const tile=mk('span','ob-r34-map-week '+cls+(w===6?' is-midpoint':w===12?' is-final':''));
      if(w===0){tile.append(mk('small','',tr('PRE','予選')),mk('b','','00'));}
      else if(w===6||w===12){tile.append(mk('small','',w===6?tr('MID','中間'):tr('FINAL','最終')),mk('b','',`W${String(w).padStart(2,'0')}`));}
      else tile.textContent=`W${String(w).padStart(2,'0')}`;
      weeks.append(tile);
    }
    const phases=mk('div','ob-r34-map-phases');
    [
      ['prelim',tr('PRE','予選'),'W00'],
      ['opening',tr('OPENING','序盤'),'W01–03'],
      ['middle',tr('MIDDLE','中盤'),'W04–07'],
      ['late',tr('LATE','後半'),'W08–10'],
      ['climax',tr('CLIMAX','クライマックス'),'W11–12']
    ].forEach(([id,name,range])=>{
      const stage=mk('span','ob-r34-map-phase is-'+id);
      stage.append(mk('b','',name),mk('small','',range));phases.append(stage);
    });
    const points=mk('div','ob-r34-map-milestones');
    for(const stage of names){
      points.append(mk('span','ob-r34-map-milestone is-'+stage.id,tr(stage.en,stage.jp)+' · W'+String(stage.week).padStart(2,'0')));
    }
    content.append(weeks,phases,points);
    details.replaceChildren(summary,content);
    details.open=priorOpen;
  }
  let pending=false;
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;applyTimeline();checkpoints();});}
  async function init(){
    // Do not give up after 5 seconds: the manifest can finish much later on slow links.
    // Observe actual DOM readiness rather than keeping a polling timer running.
    await new Promise(resolve=>{
      const ready=()=>$('.n-season-dashboard .n-weeks')?.children.length===13&&$('#obLivePhasesR1');
      if(ready())return resolve();
      const watch=new MutationObserver(()=>{
        if(ready()){watch.disconnect();resolve();}
      });
      watch.observe(root,{childList:true,subtree:true});
    });
    applyTimeline();about();
    const nav=$('.n-season-dashboard .n-weeks');
    if(nav)new MutationObserver(schedule).observe(nav,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-current']});
    const year=$('.n-season-name');
    if(year)new MutationObserver(schedule).observe(year,{childList:true,subtree:true,characterData:true});
    // If this script starts after the phase band, its active-phase classes may
    // be changed by the original R12 script on season navigation.
    const phase=$('#obLivePhasesR1');
    if(phase)new MutationObserver(schedule).observe(phase,{attributes:true,subtree:true,attributeFilter:['class']});
    new MutationObserver(()=>{about();schedule();}).observe(root,{attributes:true,attributeFilter:['data-ob-live-lang']});
    window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang'){about();schedule();}});
    document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('[data-peek-lang],#obLangToggle,.ob-language-toggle'))setTimeout(()=>{about();schedule();},220);},true);
    try {
      const r=await fetch(new URL('posts-index.json',document.baseURI),{cache:'no-store'});
      if(!r.ok)throw Error('posts-index '+r.status);
      const data=await r.json();
      if(!Array.isArray(data.posts))throw Error('posts-index missing posts array');
      published=data.posts;checkpoints();
      console.info('OFFBEAT R34: live timeline and 4 published-aware checkpoints active.');
    }catch(err){
      console.warn('OFFBEAT R34: checkpoints left in original R12 presentation because the published index is unavailable.',err);
    }
  }
  // Begin after DOM parsing, not after all page images have loaded.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
