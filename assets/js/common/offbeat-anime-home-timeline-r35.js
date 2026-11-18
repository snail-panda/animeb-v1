/* OFFBEAT R35 — composition adjustment atop published-aware R34.
   No duplicate data fetches or invented URLs. Existing R12 Week Peek button is
   relocated with its original click handler intact. */
(()=>{'use strict';
  const root=document.querySelector('#anime-top.anime09');if(!root)return;
  const $=(q,ctx=root)=>ctx?.querySelector(q);
  const mk=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
  const jp=()=>root.dataset.obLiveLang==='ja'||(!root.dataset.obLiveLang&&(()=>{try{return localStorage.getItem('animeb-weekly-lang')==='ja';}catch{return false;}})());
  const text=(en,ja)=>jp()?ja:en;
  function heading(){
    const target=$('#obLiveRoundIntroR3>span:first-child');
    if(!target)return;
    // Original bilingual data attributes would flatten the new typographic
    // hierarchy when R12 performs its own language refresh. Replace those
    // attributes only on this one node, while retaining the node in place.
    delete target.dataset.obLiveEn;delete target.dataset.obLiveJa;
    if(!target.classList.contains('ob-r35-round-leading')){
      target.classList.add('ob-r35-round-leading');
      target.replaceChildren(mk('b','ob-r35-round-name'),mk('span','ob-r35-round-hint'));
    }
    const a=$('.ob-r35-round-name',target),b=$('.ob-r35-round-hint',target);
    const t1=text('THE TWELVE-WEEK JOURNEY / TIMELINE','12週間の旅 / タイムライン');
    const t2=matchMedia('(hover: none), (pointer: coarse)').matches
      ? text('Tap a week for a ranking snapshot','週をタップしてランキング抜粋を見る')
      : text('Hover for a ranking snapshot · Click for Week Peek','ホバーでランキング抜粋・クリックでWEEK PEEK');
    if(a.textContent!==t1)a.textContent=t1;
    if(b.textContent!==t2)b.textContent=t2;
  }
  function align(){
    const dash=$('.n-season-dashboard'),nav=$('.n-weeks',dash),phase=$('#obLivePhasesR1',dash);
    if(!dash||!nav||!phase||nav.children.length!==13)return;
    if(window.matchMedia('(max-width:690px)').matches){
      dash.style.removeProperty('--ob-r35-phase-offset');return;
    }
    const inset=Math.max(0,nav.children[1].getBoundingClientRect().left-nav.getBoundingClientRect().left);
    dash.style.setProperty('--ob-r35-phase-offset',`${inset.toFixed(2)}px`);
  }
  const stages=[
    {id:'prelim',label:['PRELIMINARY · W00','予選 · W00'],pieces:[['Ranking','予選ランキング','ranking']]},
    {id:'opening',label:['FIRST IMPRESSIONS · W01','ファーストインプレッション · W01'],pieces:[['Tier List','ティアリスト','tier']]},
    {id:'middle',label:['MIDSEASON · W06','ミッドシーズン · W06'],pieces:[['Tier List','ティアリスト','tier'],['Recommendations','おすすめ','recommendation']]},
    {id:'final',label:['FINAL · W12','ファイナル · W12'],pieces:[['Tier List','ティアリスト','tier'],['Recommendations','おすすめ','recommendation']]}
  ];
  const accents={prelim:'#9c879c',opening:'#729380',middle:'#bd8556',final:'#c0a774'};
  function urlOf(src,type){
    const anchors=[...src.querySelectorAll('a[href]')];
    return anchors.find(a=>{
      try{
        const u=new URL(a.href,location.href);
        if(u.origin!==new URL(document.baseURI).origin)return false;
        const path=u.pathname;
        return type==='ranking'?/\/ranking\/\d{4}\/\w+\/week00\//.test(path):
               type==='tier'?/\/tierlist\/\d{4}\/\w+\/week\d{2}\//.test(path):
               /\/features\/recommend\/\d{4}\/\w+\/week\d{2}\//.test(path);
      }catch{return false;}
    })?.href||null;
  }
  let lastSignature='';
  function checkpoints(){
    const dash=$('.n-season-dashboard'),from=$('#obR34Checkpoints',dash);
    const foot=$('#obLivePhaseFootR3',dash),button=$('#obLivePeekToggleR3',dash);
    if(!dash||!from||!foot||!button)return; // R34 remains the fallback.
    const signature=from.innerHTML+'/'+(jp()?'jp':'en');
    const previous=$('#obR35Checkpoints',dash);
    if(signature!==lastSignature||!previous){
      const row=previous||mk('section','ob-r35-checkpoints');
      row.id='obR35Checkpoints';
      row.setAttribute('aria-label',text('Season checkpoints','シーズンの節目'));
      const title=mk('span','ob-r35-checkpoints-heading',text('SEASON CHECKPOINTS','シーズンの節目'));
      const items=[title];
      for(const stage of stages){
        const src=$('.ob-r34-cp-'+stage.id,from);
        if(!src) return; // leave R34 visible rather than build partial navigation
        const links=stage.pieces.map(([en,ja,type])=>({en,ja,type,url:urlOf(src,type)}));
        const published=links.some(p=>p.url);
        const col=mk('div','ob-r35-checkpoint'+(published?'':' ob-r35-unpublished'));
        col.style.setProperty('--ob-r35-accent',accents[stage.id]);
        col.append(mk('span','ob-r35-cp-label',text(stage.label[0],stage.label[1])));
        const details=mk('span','ob-r35-cp-links');
        links.forEach((piece,i)=>{
          if(i)details.append(mk('span','ob-r35-separator','·'));
          const el=mk(piece.url?'a':'span',piece.url?'':'ob-r35-pending',text(piece.en,piece.ja));
          if(piece.url)el.href=piece.url;
          details.append(el);
        });
        col.append(details);items.push(col);
      }
      row.replaceChildren(...items);
      if(!previous)from.after(row);
      dash.classList.add('ob-r35-ready');
      lastSignature=signature;
    }
    let peek=$('#obR35PeekRow',dash);
    if(!peek){peek=mk('div','ob-r35-peek-row');peek.id='obR35PeekRow';}
    const row=$('#obR35Checkpoints',dash);
    if(row?.nextElementSibling!==peek)row?.after(peek);
    if(button.parentElement!==peek)peek.append(button);
    let help=$('.ob-r93c-peek-help',peek);
    const touch=matchMedia('(hover: none), (pointer: coarse)').matches;
    if(touch){
      if(!help){help=mk('small','ob-r93c-peek-help');button.after(help);}
      const hint=text('Week Peek opens the week selected on the timeline.','タイムラインで選んだ週のWEEK PEEKを開きます。');
      if(help.textContent!==hint)help.textContent=hint;
    }else if(help)help.remove();
    // R59: on phones, place the existing MILESTONES legend above the existing
    // Week Peek button. Restore its original parent on desktop; no clones.
    const legend=$('.ob-live-stage-legend',dash);
    if(legend){
      const onPhone=window.matchMedia('(max-width:690px)').matches;
      if(onPhone && legend.parentElement!==peek) peek.insertBefore(legend,button);
      else if(!onPhone && legend.parentElement!==foot) foot.append(legend);
    }
  }
  let scheduled=false,sourceObserver=null;
  function run(){
    scheduled=false;const dash=$('.n-season-dashboard');if(dash)dash.classList.add('ob-r35-timeline');
    heading();align();checkpoints();
    const src=$('#obR34Checkpoints');
    if(src&&!sourceObserver){sourceObserver=new MutationObserver(schedule);sourceObserver.observe(src,{childList:true});}
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(run);}
  function init(){
    let attempt=0;
    const timer=setInterval(()=>{
      if($('#obLiveRoundIntroR3')&&$('#obLivePhaseFootR3')){
        clearInterval(timer);run();
        const dash=$('.n-season-dashboard');
        if(dash)new MutationObserver(schedule).observe(dash,{childList:true});
        const nav=$('.n-season-dashboard .n-weeks');
        if(nav)new ResizeObserver(schedule).observe(nav);
        new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['data-ob-live-lang']});
        document.addEventListener('click',e=>{
          if(e.target instanceof Element&&e.target.closest('[data-peek-lang],#obLangToggle,.ob-language-toggle'))setTimeout(schedule,250);
        },true);
        window.addEventListener('resize',schedule,{passive:true});
        window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang')schedule();});
      }else if(++attempt>=75)clearInterval(timer);
    },120);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
