/* OFFBEAT Anime Home Live R1 — additive, read-only integration.
   Current page markup, historical explorer, original Week Peek and archives remain intact.
   Ranking data is read from the published manifest and published weekly JSON ONLY.
   No invented averages, standings, editor-written headlines, or future results. */
(() => {
  'use strict';
  const root=document.querySelector('#anime-top.anime09');
  if(!root || root.dataset.obLiveR5) return;
  const base=new URL('./',document.baseURI);
  const manifestPath=new URL('weekly-rankings.json',base);
  const $=(selector,context=root)=>context.querySelector(selector);
  const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;};
  const lang=()=>{try{return localStorage.getItem('animeb-weekly-lang')==='ja'?'ja':'en';}catch{return 'en';}};
  const fmt=n=>String(n).padStart(2,'0');
  const num=v=>(v===null||v===undefined||v===''||!Number.isFinite(Number(v)))?null:Number(v);
  const avg=arr=>{const xs=arr.map(num).filter(x=>x!==null);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;};
  const nfmt=v=>v===null?'—':v.toFixed(2);
  const seasons={winter:'冬',spring:'春',summer:'夏',fall:'秋'};
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const escURL=(url)=>{try{const u=new URL(url,base);return u.origin===base.origin && u.pathname.startsWith(base.pathname)?u.href:null;}catch{return null;}};
  const i=(ja,en)=>lang()==='ja'?ja:en;
  const bilingual=(node,ja,en)=>{node.dataset.obLiveJa=ja;node.dataset.obLiveEn=en;node.textContent=i(ja,en);return node;};
  // Keep the period secondary without changing the post text or treating a
  // title's own parentheses (e.g. a release year) as a ranking period.
  function recentUpdateTitle(item,kind){
    const ja=String(item.title?.ja||item.title?.display||'投稿');
    const en=String(item.title?.en||item.title?.display||'Post');
    const title=el('span','ob-live-update-title');
    const period=kind==='ranking'?String(item.period?.display||'').trim():'';
    if(!period)return bilingual(title,ja,en);
    const split=value=>{
      for(const suffix of [`(${period})`,`（${period}）`]){
        if(value.endsWith(suffix)&&value.length>suffix.length){
          return [value.slice(0,-suffix.length),suffix];
        }
      }
      return [value,''];
    };
    const [jaMain,jaPeriod]=split(ja),[enMain,enPeriod]=split(en);
    if(!jaPeriod&&!enPeriod)return bilingual(title,ja,en);
    title.append(bilingual(el('span','ob-live-update-title-main'),jaMain,enMain),
      bilingual(el('span','ob-live-update-period'),jaPeriod,enPeriod));
    return title;
  }
  function relabel(){
    document.querySelectorAll('#anime-top [data-ob-live-ja][data-ob-live-en], #obLiveNavR2 [data-ob-live-ja][data-ob-live-en]').forEach(node=>node.textContent=i(node.dataset.obLiveJa,node.dataset.obLiveEn));
    document.querySelectorAll('#anime-top [data-ob-live-date]').forEach(node=>{node.textContent=displayPostDate(node.dataset.obLiveDate);});
    refreshGenreOptions();
  }
  function displayPostDate(iso){
    const day=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||''));
    if(!day)return String(iso||'');
    const [year,month,date]=day.slice(1).map(Number);
    return i(`${year}年${month}月${date}日`,`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month-1]} ${date}, ${year}`);
  }
  const genreLabels={
    'アクション':'Action','アドベンチャー':'Adventure','冒険':'Adventure',
    'ファンタジー':'Fantasy','異世界':'Isekai','異世界ファンタジー':'Isekai Fantasy',
    '恋愛':'Romance','ラブコメ':'Romantic Comedy','恋愛コメディ':'Romantic Comedy','ロマンス':'Romance',
    'コメディ':'Comedy','ギャグ':'Comedy','日常':'Slice of Life','日常系':'Slice of Life',
    'ドラマ':'Drama','ヒューマンドラマ':'Human Drama','青春':'Coming-of-age',
    '学園':'School','学園もの':'School','スポーツ':'Sports','音楽':'Music','アイドル':'Idol',
    'SF':'Sci-Fi','ＳＦ':'Sci-Fi','サイエンスフィクション':'Sci-Fi','ミステリー':'Mystery',
    'サスペンス':'Suspense','ホラー':'Horror','スリラー':'Thriller','推理':'Mystery',
    '歴史':'Historical','時代劇':'Period Drama','転生':'Reincarnation',
    '魔法':'Magic','魔法少女':'Magical Girl','お仕事':'Workplace','職業':'Workplace',
    'グルメ':'Food','料理':'Cooking','ロボット':'Robots','メカ':'Mecha',
    'バトル':'Battle','戦記':'War','戦争':'War','軍事':'Military',
    '政治':'Political','ファミリー':'Family','子供向け':'Family','キッズ':'Kids',
    'オリジナル':'Original','心理':'Psychological','サバイバル':'Survival',
    'ダークファンタジー':'Dark Fantasy','スーパーナチュラル':'Supernatural',
    '超常現象':'Supernatural','社会派':'Social Drama','群像劇':'Ensemble Drama',
    '百合':'Girls’ Love','BL':'Boys’ Love','ボーイズラブ':'Boys’ Love',
    'スポーツ・青春':'Sports / Coming-of-age'
  };
  function translateGenre(value){
    const raw=String(value||'').trim();
    if(lang()==='ja')return raw;
    if(genreLabels[raw])return genreLabels[raw];
    if(!/[ぁ-んァ-ヶ一-龯]/.test(raw))return raw;
    return null; // Never pretend an untranslated label is English.
  }
  function refreshGenreOptions(){
    const select=document.querySelector('#obLiveGenreR4');if(!select||!lineupMaster)return;
    const picked=select.value;select.replaceChildren(new Option(i('すべてのジャンル','All genres'),'all'));
    const all=[...new Set(lineupMaster.items.flatMap(v=>Array.isArray(v.genres)?v.genres:[]))];
    for(const raw of all.sort()){const label=translateGenre(raw);if(label!==null)select.append(new Option(label,raw));}
    select.value=[...select.options].some(o=>o.value===picked)?picked:'all';
    lineupFilter=select.value;
  }
  const weekly=new Map();let manifest=null,active=null,lastKey='',sequence=0;
  const anchor=()=>$('#animeLatest');
  const anchorToYearSeason=(a)=>{
    if(!a)return null;
    try{
      const u=new URL(a.href,base); if(u.origin!==base.origin)return null;
      const m=u.pathname.match(/\/ranking\/(\d{4})\/(winter|spring|summer|fall)\/week(\d{2})\/index\.html$/i);
      return m?{year:m[1],season:m[2].toLowerCase(),week:Number(m[3]),href:u.href}:null;
    }catch{return null;}
  };
  const weekHref=(s,n)=>new URL(`ranking/${s.year}/${s.season}/week${fmt(n)}/index.html`,base).href;
  function specOf(year,season){
    const yr=manifest?.[year], entry=yr&&Object.entries(yr).find(([k])=>k.toLowerCase()===season);
    const weeks=new Set();
    for(const label of (entry?.[1]?.weeks||[])){
      const m=/^Week\s+(\d{2})$/i.exec(label);if(m&&+m[1]<=12)weeks.add(+m[1]);
    }
    return {year,season,weeks,latest:Math.max(0,...[...weeks].filter(x=>x>0))};
  }
  function selectedSeason(){
    const h=$('.n-season-name h2');const raw=h?.querySelector('em')?.textContent.trim().toLowerCase();
    const season=Object.keys(seasons).find(key=>raw===key||raw===seasons[key]);
    const year=h?.querySelector('b')?.textContent.trim();
    if(!/^\d{4}$/.test(year||'') || !season)return null;
    return specOf(year,season);
  }
  function fetchWeek(s,n){
    if(!s.weeks.has(n))return Promise.resolve(null);
    const key=`${s.year}/${s.season}/${fmt(n)}`;
    if(!weekly.has(key)){
      const path=`ranking/${s.year}/${s.season}/week${fmt(n)}/ranking-week${fmt(n)}-${s.season}${s.year}.json`;
      const p=fetch(new URL(path,base)).then(r=>{if(!r.ok)throw Error('Ranking JSON '+r.status);return r.json();})
        .catch(err=>{weekly.delete(key);throw err;});weekly.set(key,p);
    }
    return weekly.get(key);
  }
  function reference(data){
    const source=data?.meta?.weekly_ranking_reference?.entries;
    return (Array.isArray(source)?source:[]).filter(e=>Number.isInteger(num(e.rank)) && num(e.rank)>0)
      .sort((a,b)=>num(a.rank)-num(b.rank));
  }
  function titleOf(e){return String((lang()==='ja'?e?.jpTitle||e?.title:e?.title||e?.jpTitle)||'');}
  function imageOf(s,e){const kv=String(e?.kv||'');return /^[a-z\d_-]+$/i.test(kv)?new URL(`images/key-visuals/${s.year}/${s.season}/${kv}.webp`,base).href:'';}
  function textIntro(data){
    const raw=data?.meta?.weekly_intro;
    const input=typeof raw==='string'?raw:String((lang()==='ja'?raw?.ja||raw?.jp:raw?.en)||'');
    if(!input)return '';
    const dom=new DOMParser().parseFromString(input,'text/html');
    return (dom.body.textContent||'').replace(/\s+/g,' ').trim();
  }
  function snippet(s,limit){if(s.length<=limit)return s;const head=s.slice(0,limit), mark=lang()==='ja'?Math.max(head.lastIndexOf('。'),head.lastIndexOf('！')):Math.max(head.lastIndexOf('. '),head.lastIndexOf('! '));return (mark>limit*.50?head.slice(0,mark+1):head.trim())+'…';}
  function scoreInfo(data){
    const rows=reference(data).filter(r=>num(r.wrp_score)!==null),top=rows.filter(r=>num(r.rank)<=10);
    const rated=num(data?.meta?.status?.ratedThisWeek), explicit=data?.meta?.home_pulse;
    const confirmed=num(explicit?.all_rated_wrp_average);
    const status=data?.meta?.status||{};
    return {listed:avg(rows.map(r=>r.wrp_score)),listedN:rows.length,top:avg(top.map(r=>r.wrp_score)),topN:top.length,
      full:confirmed,fullN:confirmed===null?null:(num(explicit?.all_rated_count)||rated), rated,
      active:num(status.currentLineup), noAir:num(status.noAir)||0,
      satisfaction:num(data?.meta?.presentation?.satisfaction?.value10),
       satisfactionScale:data?.meta?.presentation?.satisfaction?.displayScale===10?10:5};
  }
  function scoreText(label,value,count,full,delta,previousValue,kind='average'){
    const box=el('div','ob-live-metric');box.append(el('small','',label));
    const big=el('div','ob-live-metric-line');big.append(el('strong','',nfmt(value)));
    if(count!==null)big.append(el('span','ob-live-metric-denom',` / ${count} ${i('作品','titles')}`));
    box.append(big);
    if(delta!==undefined){
      const change=el('span','ob-live-metric-delta');
      if(delta!==null){
        const magnitude=el('b','ob-live-delta-value',`${delta>0?'+':''}${delta.toFixed(2)}`);
        magnitude.classList.add(kind==='gap'?'is-neutral':delta>0?'is-up':delta<0?'is-down':'is-flat');
        if(kind==='gap')change.append(el('span','ob-live-gap-change-r10',i(delta>0?'差が拡大':delta<0?'差が縮小':'差は変わらず',delta>0?'Gap widened':delta<0?'Gap narrowed':'Gap unchanged')));
        change.append(magnitude,document.createTextNode(i(' · 前週比',' vs previous week')));
        if(num(previousValue)!==null)change.append(el('span','ob-live-metric-prior-r9',i(`（${nfmt(previousValue)}）`,` (${nfmt(previousValue)})`)));
      }else change.textContent=i('前週との比較なし','No previous-week comparison');
      box.append(change);
    }
    if(full)box.classList.add('ob-live-metric-prominent');return box;
  }
    function safeLink(href,text,cls=''){
    const a=el('a',cls,text);a.href=href;return a;
  }
  // One navigational bar only. Reuse the actual global green bar on Anime view.
  // Existing original navigation remains untouched in DOM for older event hooks.
  let obNav=null;
  function dockNav(){
    const header=document.getElementById('greenNav');
    if(!header||!obNav||!root.classList.contains('current'))return;
    if(!header.contains(obNav))header.replaceChildren(obNav);
  }
  function buildNav(){
    const old=$('.n-jump-nav');if(!old||$('#obLiveNavR2'))return;
    const nav=el('nav','ob-live-nav');nav.id='obLiveNavR2';nav.setAttribute('aria-label','Anime Home navigation');
    const options=[
      [['アニメ / シーズン','ANIME / SEASONS'],[['今のシーズン','Current Season','#obLiveSeasonR1'],['今期の顔ぶれ','This Season’s Lineup','#obSeasonExperienceR3'],['過去のシーズン','Past Seasons','#animeArticles'],['S.O.W.とは','About S.O.W.','#obSowAboutOpenR1']]],
      [['ランキング','RANKINGS'],[['最新週間ランキング','Latest Weekly Ranking','#animeLatest'],['ティアリスト','Tier Lists','#animeArticles'],['おすすめ','Recommendations','#animeArticles']]],
      [['読む・探す','EXPLORE'],[['投稿アーカイブ','Post Archive','#animeArticles'],['ノート','Notes','#animeMoment'],['最近の更新','Latest Updates','#obLiveUpdatesR2']]]
    ];
    options.forEach(([names,items],si)=>{
      const details=el('details','ob-live-nav-group');details.append(bilingual(el('summary'),...names));
      const dropdown=el('div','ob-live-nav-menu');
      items.forEach(([ja,en,href],j)=>{
        const link=bilingual(safeLink(href),ja,en);
        link.dataset.obLiveJa=ja;
        if(si===0&&j===3)link.addEventListener('click',e=>{e.preventDefault();$('#obSowAboutOpenR1')?.click();});
        if(si===1&&j>0)link.addEventListener('click',()=>{const filter=j===1?'tier':'recommendation';root.querySelector(`.n-archive-filters [data-filter="${filter}"]`)?.click();});
        link.addEventListener('click',e=>{if(href.startsWith('#')&&!['#animeArticles','#animeLatest','#animeMoment'].includes(href)){e.preventDefault();document.querySelector(href)?.scrollIntoView({behavior:'smooth',block:'start'});}details.open=false;});
        dropdown.append(link);
      });details.append(dropdown);nav.append(details);
    });
    document.addEventListener('click',e=>{if(!nav.contains(e.target))nav.querySelectorAll('details[open]').forEach(d=>d.open=false);});
    old.before(nav);obNav=nav;
    // The existing view switcher replaces #greenNav children on each navigation.
    // Re-dock only when the Anime view is active. Other views retain the original bar.
    const hdr=document.getElementById('greenNav');
    if(hdr)new MutationObserver(()=>{if(root.classList.contains('current')&&!hdr.contains(nav))dockNav();}).observe(hdr,{childList:true});
    dockNav();
    const updates=el('div','ob-live-updates-strip');updates.id='obLiveUpdatesR2';
    const newest=el('span','ob-live-updates-label');bilingual(newest,'新着','NEW');
    const ticker=el('span','ob-live-updates-text');ticker.textContent=i('最新の投稿を確認','Latest published ranking and season updates');
    const more=bilingual(el('button','ob-live-updates-cta'),'最近の更新を見る ＋','RECENT UPDATES ＋');
    more.type='button';more.setAttribute('aria-controls','obLiveUpdatesListR4');more.setAttribute('aria-expanded','false');
    const feed=el('div','ob-live-updates-list');feed.id='obLiveUpdatesListR4';feed.hidden=true;
    const toggleUpdates=(state)=>{feed.hidden=!state;more.setAttribute('aria-expanded',String(state));more.textContent=i(state?'最近の更新を閉じる −':'最近の更新を見る ＋',state?'CLOSE UPDATES −':'RECENT UPDATES ＋');};
    more.addEventListener('click',()=>toggleUpdates(feed.hidden));
    document.addEventListener('click',e=>{if(!updates.contains(e.target))toggleUpdates(false);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!feed.hidden){toggleUpdates(false);more.focus();}});
    const updatesHeader=el('div','ob-live-updates-header');updatesHeader.append(newest,ticker,more);updates.append(updatesHeader,feed);old.after(updates);
    feed.append(el('p','ob-live-muted',i('更新情報を読み込み中…','Loading recent updates…')));
    fetch(new URL('posts-index.json',base)).then(r=>r.ok?r.json():null).then(d=>{
      if(!d)return;
      const posts=(d.posts||[]).filter(x=>x.status==='published'&&x.url&&x.published?.iso)
         .sort((a,b)=>String(b.published.iso).localeCompare(String(a.published.iso)));
      if(!posts.length)return;
      // Newest post link is contextual, while 'recent updates' always goes to the full archive.
      const p=posts[0],postHref=escURL(p.url);
      ticker.textContent=String(p.title?.display||p.title?.en||i('新しい投稿','New post'));
      if(postHref){ticker.replaceWith(safeLink(postHref,ticker.textContent,'ob-live-updates-text'));}
      feed.replaceChildren();
      posts.slice(0,5).forEach(item=>{
        const href=escURL(item.url);if(!href)return;
        const row=safeLink(href,'','ob-live-update-link');
        const date=String(item.published.iso||'');
        const kind=String(item.type||'post').toLowerCase();
        const names={ranking:['ランキング','RANKING'],tier:['Tier List','TIER LIST'],note:['ノート','NOTE'],recommendation:['おすすめ','RECOMMENDATION']};
        const cat=names[kind]||['投稿','POST'];
        const meta=el('span','ob-live-update-meta');
        const dateNode=el('small','ob-live-update-date',displayPostDate(date));dateNode.dataset.obLiveDate=date;
        meta.append(dateNode,bilingual(el('small','ob-live-update-kind'),...cat));
        const title=recentUpdateTitle(item,kind);
        row.append(meta,title);feed.append(row);
      });
      if(!feed.children.length)feed.append(el('p','ob-live-muted',i('公開済みの更新はありません','No published updates')));
    }).catch(()=>{feed.replaceChildren(el('p','ob-live-muted',i('更新を取得できません','Updates unavailable')));});
    root.classList.add('ob-live-enhanced','ob-live-r5');
  }
    const phaseNames=()=>lang()==='ja'?['序盤','中盤','終盤','クライマックス']:['OPENING','MIDDLE','LATE','CLIMAX'];
  function buildFrames(){
    const sec=$('.n-season');if(!sec)return;
    sec.id='obLiveSeasonR1';
    // Recompose only the EXISTING S.O.W. elements; preserve the actual R37 SVG
    // and the existing About dialog button/handler. No asset paths are changed.
    const lockup=sec.querySelector(':scope > .ob-sow-lockup-r26');
    const about=sec.querySelector(':scope > .ob-sow-about-entry-r1');
    if(lockup&&about&&!sec.querySelector('.ob-live-sow-strip')){
      const strip=el('div','ob-live-sow-strip');
      sec.insertBefore(strip,lockup);strip.append(lockup,about);
      about.prepend(bilingual(el('strong','ob-live-sow-links-title'),'SEASONS OF THE WATCH','SEASONS OF THE WATCH'));
      const howLink=bilingual(el('a','ob-live-sow-how'),'12週間の楽しみ方','How it works');
      howLink.href='#obLiveGuideR5';howLink.addEventListener('click',e=>{
        e.preventDefault();const target=$('#obLiveGuideR5');target?.scrollIntoView({behavior:'smooth',block:'start'});
      });about.append(howLink);
    }
    const chooser=sec.querySelector('.n-season-chooser');
    const backToCurrent=chooser?.querySelector('.ob-r16-back');
    const seasonTabs=chooser?.querySelector('.n-season-tabs');
    if(backToCurrent && seasonTabs && backToCurrent.parentElement!==chooser){
      seasonTabs.after(backToCurrent);
    }
    const seasonHeader=sec.querySelector('.n-season-header');
    const seasonName=seasonHeader?.querySelector('.n-season-name');
    const seasonHeading=seasonHeader?.querySelector('.n-season-heading');
    if(seasonName&&seasonHeading&&!$('#obLiveCurrentMarkerR3')){
      const label=seasonName.querySelector('small');
      if(label)bilingual(label,'今シーズン / Seasons of the Watch','CURRENT SEASON / SEASONS OF THE WATCH');
      const marker=el('div','ob-live-current-marker');marker.id='obLiveCurrentMarkerR3';
      marker.append(el('strong','ob-live-current-number'),el('small','ob-live-current-remaining'));
      seasonName.after(marker);
    }
    const dashboard=sec.querySelector('.n-season-dashboard');
    const timeline=dashboard?.querySelector('.n-weeks');
    if(dashboard&&timeline&&!$('#obLiveRoundIntroR3')){
      const midLabel=timeline.querySelector('.n-milestone-mid > span');
      const finalLabel=timeline.querySelector('.n-milestone-final > span');
      if(midLabel)midLabel.textContent='W';
      if(finalLabel)finalLabel.textContent='W';
      const intro=el('div','ob-live-round-intro');intro.id='obLiveRoundIntroR3';
      intro.append(bilingual(el('span'),'12週間の旅 / 週を選んで振り返る','12-week journey / Tap a round to revisit it'),el('strong','ob-live-round-next'));
      timeline.before(intro);
    }
    const progress=$('.n-season-progress');
    if(progress&&!$('#obLivePhasesR1')){
      const band=el('div','ob-live-phases');band.id='obLivePhasesR1';
      [3,4,3,2].forEach((span,j)=>{
        const p=el('span','');p.style.flex=String(span);
        p.append(el('b','ob-live-phase-title',phaseNames()[j]),el('small','ob-live-phase-range',['W01–03','W04–07','W08–10','W11–12'][j]));
        band.append(p);
      });progress.after(band);
      const foot=el('div','ob-live-phase-foot');foot.id='obLivePhaseFootR3';
      const open=el('button','ob-live-peek-link');open.id='obLivePeekToggleR3';open.type='button';
      open.textContent=i('週の記録を見る · WEEK PEEK','WEEK PEEK · VIEW ROUND');
      open.addEventListener('click',()=>{const w=selectedWeek||active?.latest;if(active&&w>=1){
        const panel=$('#obLivePeekR1');if(panel&&!panel.hidden){panel.hidden=true;root.classList.remove('ob-live-peek-open');peekDismissed=true;renderPeek.ticket++;setSelectedWeek(w);}
        else{peekDismissed=false;renderPeek(active,w);}
      }});
      const legend=el('div','ob-live-stage-legend');legend.title=i('区分はOFFBEAT独自の目安です。','These stages are an approximate OFFBEAT viewing guide.');
      [ ['PRELIM · W00','is-prelim'],['MIDSEASON · W06','is-mid'],['FINAL · W12','is-final'] ].forEach(([txt,cls])=>{
        const item=el('span',cls);item.append(el('i',''),el('span','',txt));legend.append(item);
      });foot.append(open,legend);band.after(foot);
    }
    if(!$('#obLiveStoryR1')){
      const story=el('section','ob-live-story');story.id='obLiveStoryR1';story.setAttribute('aria-label','This round and what comes next');
      $('.n-season-dashboard')?.after(story);
    }
    if(!$('#obLivePulseR1')){
      const details=el('details','ob-live-pulse');details.id='obLivePulseR1';
      const summary=el('summary','ob-live-pulse-head');summary.append(bilingual(el('span'),'ここまでの推移','THE SEASON SO FAR'),bilingual(el('strong'),'12週間の流れを見る','A season at a glance'));
      // A restrained sparkline hints that this panel contains a trend chart.
      const hint=el('span','ob-live-pulse-chart-hint-r8');hint.setAttribute('aria-hidden','true');
      hint.innerHTML='<svg viewBox="0 0 33 17" width="33" height="17" xmlns="http://www.w3.org/2000/svg"><path d="M1 15H32" fill="none" stroke="#c3d1bd"/><polyline points="1,11 8,7 15,12 23,4 31,6" fill="none" stroke="#628566" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="1,6 8,8 15,5 23,9 31,3" fill="none" stroke="#b98652" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      summary.append(hint);
      const body=el('div','ob-live-pulse-content');body.id='obLivePulseBodyR1';
      details.append(summary,body);$('#obLiveStoryR1')?.after(details);
      details.addEventListener('toggle',()=>{if(details.open&&active)renderTrend(active);});
    }
    if(!$('#obLivePeekR1')){
      const preview=el('section','ob-live-peek');preview.id='obLivePeekR1';preview.hidden=true;preview.setAttribute('aria-live','polite');
      $('.n-season-dashboard')?.after(preview);
    }
    if(!$('#obLiveLineupStatusR1')){
      const grid=$('#obLineupGridR3');const bar=el('div','ob-live-lineup-status');bar.id='obLiveLineupStatusR1';
      grid?.before(bar);
    }
    // R48: Do not add a duplicate FROM THE START section under ABOUT S.O.W.
    // Season Checkpoints, companion links, and the main Archive already provide these paths.
    // One season guide, as in Concept 07F. Keep the full original approved text,
    // details/open handlers and About S.O.W. dialog rather than copying or deleting them.
    const experience=$('#obSeasonExperienceR3');
    const how=experience?.querySelector('.ob-how-r3');
    if(experience&&how&&!$('#obLiveGuideR5')){
      const guide=el('section','ob-live-guide');guide.id='obLiveGuideR5';
      guide.append(bilingual(el('h3','ob-live-guide-heading'),'ABOUT S.O.W. / シーズンの楽しみ方','ABOUT S.O.W. / HOW TO WATCH THE SEASON'));
      const aboutLink=bilingual(el('button','ob-live-guide-link'),'S.O.W.とは？','What is Seasons of the Watch?');aboutLink.type='button';
      aboutLink.addEventListener('click',()=>$('#obSowAboutOpenR1')?.click());guide.append(aboutLink);
      const row=el('details','ob-live-how-wrap');row.id='obLiveHowWrapR4';
      row.append(bilingual(el('summary'),'シーズンはどう展開する？','How the Season Unfolds'),how);guide.append(row);
      // R50: The last two guide links are their OWN readable accordions, not shortcuts
      // to the unrelated S.O.W. modal or a toggle far above the viewport.
      const ratings=el('details','ob-live-explain-r50');ratings.id='obLiveRatingsR50';
      ratings.append(bilingual(el('summary'),'ランキングと採点の見方','How rankings and ratings work'));
      const ratingsBody=el('div','ob-live-explain-content-r50');
      ratingsBody.append(
        bilingual(el('p'),
          '週間ランキングは、その週に評価した作品の記録です。スコアは作品や対象エピソードの出来についての評価で、順位は同じ週に評価した作品の中での位置を表します。',
          'Each weekly ranking records the titles evaluated in that round. A score reflects the assessment of a title or episode; its rank shows where it placed among the titles evaluated that week.'),
        bilingual(el('p'),
          'スコアも順位も週ごとに変わります。シーズン終了時のティアリストは、週別の結果を並べ直すだけではなく、作品全体としての出来も振り返る別の視点です。',
          'Scores and positions can change from week to week. The final tier list offers another perspective: a look at each series as a whole, rather than simply repeating the weekly results.')
      );
      ratings.append(ratingsBody);guide.append(ratings);
      const journey=el('details','ob-live-explain-r50');journey.id='obLiveJourneyR50';
      journey.append(bilingual(el('summary'),'なぜシーズン全体を追いかける？','Why follow an entire season?'));
      const journeyBody=el('div','ob-live-explain-content-r50 ob-live-journey-content-r50');
      journey.append(journeyBody);guide.append(journey);
      // Use the exact four existing, approved editorial paragraphs as the source of truth.
      // The site i18n code updates these paragraphs for Japanese; mirror those updates.
      const sourceJourney=$('#nJourneyText');
      if(sourceJourney){
        let lastJourneyHtml='';
        const syncJourney=()=>{
          const paragraphs=[...sourceJourney.children].filter(x=>x.tagName==='P');
          const html=paragraphs.map(x=>x.outerHTML).join('');
          if(!html||html===lastJourneyHtml)return;
          lastJourneyHtml=html;
          journeyBody.replaceChildren(...paragraphs.map(x=>x.cloneNode(true)));
        };
        syncJourney();
        new MutationObserver(syncJourney).observe(sourceJourney,{subtree:true,childList:true,characterData:true,attributes:true});
      }
      experience.after(guide);
    }
    const prev=sec.querySelector('.n-prev-season');
    if(prev&&!$('#obLivePrevWrapR4')){
      const group=el('details','ob-live-previous-wrap');group.id='obLivePrevWrapR4';
      // R46: A compact preview in the closed heading; preserve the existing details/cards.
      // Keep each label bilingual so the existing relabel() handles language changes.
      // R49: One hierarchy for both closed and open states; inner cards appear immediately.
      const previousSummary=el('summary','ob-live-prev-summary-r46 ob-live-prev-summary-r48 ob-live-prev-summary-r49');
      const previousCopy=el('span','ob-live-prev-copy-r48 ob-live-prev-copy-r49');
      previousCopy.append(
        bilingual(el('span','ob-live-prev-head-r49'),'前のシーズンを振り返る','A LOOK BACK'),
        bilingual(el('span','ob-live-prev-title-r46 ob-live-prev-title-r49'),'前のシーズン · 2026年夏','PREVIOUS SEASON · SUMMER 2026'),
        bilingual(el('small','ob-live-prev-deck-r46'),
          '前期はどんなシーズンだったっけ？ 最終ティアリストとおすすめを振り返ってみよう。もしかしたら、今季も少し違って見えるかも。',
          'How did last season turn out? Revisit the final tier list and recommendations. Who knows? You might see this season a little differently, too.')
      );
      previousSummary.append(previousCopy);
      group.append(previousSummary,prev);
      $('#obLiveGuideR5')?.before(group);
    }
    // Keep What's Here DOM for existing site scripts. Its destinations remain in the new navigation.
    const contents=$('.n-focus .n-contents');if(contents)contents.classList.add('ob-live-contents-legacy');
    initLineupExplore();
    groupWeekAndSeasonR8();
    root.classList.add('ob-live-r8','ob-live-r9','ob-live-r10','ob-live-r11','ob-live-r12');
  }
  // R8: preserve the original ranking card and existing featured/lineup functionality.
  // Reposition only the live nodes. No duplicate cards or removed source content.
  function groupWeekAndSeasonR8(){
    const experience=$('#obSeasonExperienceR3'),latest=$('#animeLatest');
    if(!experience||!latest||$('#obLiveWeekSeasonR8'))return;
    const group=el('section','ob-live-week-season-r8');group.id='obLiveWeekSeasonR8';
    group.setAttribute('aria-label','This week and this season');
    const head=el('header','ob-live-week-season-head-r8');
    const title=bilingual(el('h2'),'今週と今シーズン','THIS WEEK & THIS SEASON');
    const sub=bilingual(el('p'),'最新のランキングから、今シーズンの顔ぶれへ','From the latest ranking to the season’s lineup');
    head.append(title,sub);group.append(head);
    experience.before(group);
    group.append(latest,experience);
    const focus=$('.n-focus');if(focus)focus.classList.add('ob-live-focus-after-r8');
    const renav=()=>{
      const nav=focus?.querySelector('.obn-ranking-links');
      if(!nav)return;
      const anchors=[...nav.querySelectorAll('a')];
      const prev=anchors.find(a=>/previous week|前週/i.test(a.textContent||''));
      const browse=anchors.find(a=>a.getAttribute('href')==='#animeArticles');
      if(prev)prev.textContent=i('‹ 前週のランキング','‹ PREVIOUS WEEK’S RANKING');
      if(browse)bilingual(browse,
        'もっと探す · 今期の週・過去のシーズン・投稿 »',
        'MORE TO EXPLORE · WEEKS, SEASONS & POSTS »');
    };
    renav();
    if(focus)new MutationObserver(renav).observe(focus,{childList:true});
  }
  // Existing published links are reused. Add the published Prelim link beside
  // First Impressions; never invent Midseason/Final content or change other seasons.
  function updateCompanions(s){
    const area=$('#animeTier');if(!area)return;
    const old=area.querySelector('.ob-live-companion-prelim-r10');if(old)old.remove();
    const head=area.querySelector('.n-feature-label');
    if(!head)return;
    if(s.year==='2026'&&s.season==='fall'){
      head.replaceChildren(document.createTextNode(i('同じシーズンから · ','ALSO FROM ')));
      head.append(el('strong','ob-live-companion-season-r10',i('2026年秋','2026 FALL')),
                  el('span','ob-live-companion-season-word-r12',i('の関連記事',' SEASON')));
      if(s.weeks.has(0) && ![...area.querySelectorAll('.n-feature-item')].some(a=>/prelim|予選/i.test(a.textContent||''))){
        const link=safeLink(weekHref(s,0),'','n-feature-item ob-live-companion-prelim-r10');
        const kind=bilingual(el('span','n-feature-kind'),'予選 · WEEK 00','PRELIMINARY ROUND · WEEK 00');
        const name=bilingual(el('strong'),'予選ランキング','Preliminary Ranking');
        link.append(kind,name);area.append(link);
      }
    }else{
      // Original seasonal highlights are controlled by the original page.
      head.textContent=i('このシーズンの関連コンテンツ','ALSO FROM THIS SEASON');
    }
  }
  let lineupMaster=null,lineupFilter='all',lineupMasterByKv=new Map();
  function initLineupExplore(){
    const grid=$('#obLineupGridR3');const section=grid?.closest('.ob-study-section');
    if(!grid||!section||$('#obLiveLineupExploreR4'))return;
    const line=el('div','ob-live-lineup-explore');line.id='obLiveLineupExploreR4';
    const caption=bilingual(el('label'),'ジャンル別に見る','EXPLORE BY GENRE');
    const select=el('select');select.id='obLiveGenreR4';caption.htmlFor=select.id;
    select.append(new Option(i('すべてのジャンル','All genres'),'all'));
    const tally=el('span','ob-live-genre-count','');line.append(caption,select,tally);
    grid.before(line);line.hidden=true;
    const update=()=>{
      if(!lineupMaster)return;
      const buttons=[...grid.children].filter(x=>x.classList.contains('ob-lineup-item'));
      if(buttons.length!==lineupMaster.items.length)return;
      let count=0;
      buttons.forEach(button=>{
        const kv=button.dataset.obLineupKv||'';
        const item=lineupMasterByKv.get(kv);
        if(!item){button.hidden=false;console.warn('OFFBEAT: missing lineup kv',kv);return;}
        const genres=item.genres||[];
        const show=lineupFilter==='all'||genres.includes(lineupFilter);
        button.hidden=!show;if(show)count++;
      });
      if(lineupFilter==='all')tally.replaceChildren();
      else tally.replaceChildren(el('strong','ob-live-genre-number-r11',String(count)),
        document.createTextNode(i(' / ',' of ')),el('strong','ob-live-genre-number-r11',String(lineupMaster.items.length)),
        el('span','ob-live-genre-suffix-r11',i('作品',' titles')));
      if(lineupFilter!=='all'&&!grid.classList.contains('is-expanded')){
        grid.classList.add('is-expanded');
        const btn=$('#obLineupExpandR3');if(btn)btn.setAttribute('aria-expanded','true');
      }
    };
    select.addEventListener('change',()=>{lineupFilter=select.value;update();});
    const observer=new MutationObserver(()=>{setTimeout(update,0);});
    observer.observe(grid,{childList:true});
    fetch(new URL('assets/data/offbeat-season-2026-fall.json',base)).then(r=>{if(!r.ok)throw Error('Season master unavailable');return r.json();})
      .then(data=>{
        if(!Array.isArray(data.items)||data.items.length!==34)throw Error('Lineup count not verified');
        lineupMaster=data;
        lineupMasterByKv=new Map(data.items.map(item=>[String(item.kv),item]));
        refreshGenreOptions();
        line.hidden=false;update();
      }).catch(err=>{console.warn('OFFBEAT: genre view unavailable; original lineup untouched',err);line.remove();observer.disconnect();});
    root.addEventListener('click',e=>{if(e.target.closest('[data-peek-lang]'))setTimeout(()=>{
      caption.textContent=i('ジャンル別に見る','EXPLORE BY GENRE');
      refreshGenreOptions();update();
    },180);},true);
  }
  async function renderStory(s){
    const token=++sequence;const dom=$('#obLiveStoryR1');if(!dom)return;
    const w=s.latest;
    const ja=lang()==='ja';
    dom.replaceChildren();
    if(!w){dom.append(el('p','ob-live-muted',i('本戦の週間ランキングはまだ公開されていません。','The main-season weekly rankings have not yet been published.')));return;}
    const row=el('div','ob-live-editorial-grid');
    const main=el('section','ob-live-now');
    main.append(el('small','ob-live-kicker',`NOW · ${s.year} ${ja?seasons[s.season]:s.season.toUpperCase()} · WEEK ${fmt(w)} / 12`));
    main.append(el('h3','',i('今週の動き','This Week')));
    const para=el('p','ob-live-excerpt',i('公開済みのランキングから今週のひと言を読み込みます。','Reading the published This Week commentary…'));main.append(para);
    main.append(safeLink(weekHref(s,w),i('第'+fmt(w)+'週のランキングを見る','View Week '+fmt(w)+' Ranking'),'ob-live-cta'));
    const side=el('div','ob-live-side');const next=el('section','ob-live-next');
    next.append(el('small','ob-live-kicker','NEXT'));
    const nextNo=w+1;
    if(nextNo<=12){next.append(el('strong','',w<6&&nextNo===6?i('ミッドシーズンまであと1週','MIDSEASON NEXT'):i(`次は第${fmt(nextNo)}週`,`WEEK ${fmt(nextNo)} AHEAD`)));
      next.append(el('p','',w<6&&nextNo===6?i('折り返し地点が近づいています。','Approaching the halfway checkpoint.'):i('次の週の公開を待っています。','The next published round will appear here.')));
    }else{next.append(el('strong','',i('シーズンファイナル','SEASON FINALE')));}
    side.append(next);
    const previous=el('section','ob-live-previous');previous.append(el('small','ob-live-kicker','PREVIOUS'));
    if(w>1){previous.append(safeLink(weekHref(s,w-1),i(`第${fmt(w-1)}週を振り返る`,`Revisit Week ${fmt(w-1)}`)));}else previous.append(safeLink(weekHref(s,0),i('予選を振り返る','Revisit Prelim')));
    side.append(previous);row.append(main,side);dom.append(row);
    try{
      const d=await fetchWeek(s,w);if(token!==sequence)return;
      const p=snippet(textIntro(d),ja?154:245);
      para.textContent=p||i('今週のひと言はありません。','No This Week commentary available.');
      const status=d?.meta?.status;
      if(status){const facts=el('p','ob-live-story-status');facts.textContent=ja
        ? `本戦開始時 ${status.initialSeasonPool??'—'}作品 · 現在の対象 ${status.currentLineup??'—'}作品 · 累計除外 ${status.droppedTotal??'—'}作品`
        : `Opening ${status.initialSeasonPool??'—'} · Current lineup ${status.currentLineup??'—'} · Dropped total ${status.droppedTotal??'—'}`;
        main.insertBefore(facts,main.lastElementChild);}
      renderLineupStatus(status);
      try{const prev= w>1 ? await fetchWeek(s,w-1):null;if(token!==sequence)return;
        if(prev){const lead=reference(prev)[0];if(lead){const text=el('p','ob-live-previous-winner',i('前週の首位：','Previous leader: ')+titleOf(lead));previous.append(text);}}
      }catch(_){}
    }catch(err){if(token===sequence)para.textContent=i('今週の情報を取得できませんでした。','This Week data could not be loaded.');}
    if($('#obLivePulseR1')?.open)renderTrend(s);
  }
  function renderLineupStatus(status){const bar=$('#obLiveLineupStatusR1');if(!bar)return;
    bar.replaceChildren();if(!status)return;
    const items=lang()==='ja'
      ?[['本戦開始',status.initialSeasonPool],['現状ラインナップ',status.currentLineup],['除外累計',status.droppedTotal],['未放送',status.notAiredYet]]
      :[['OPENING',status.initialSeasonPool],['CURRENT LINEUP',status.currentLineup],['DROPPED TOTAL',status.droppedTotal],['NOT YET AIRED',status.notAiredYet]];
    items.forEach(([label,value])=>{if(num(value)===null)return;const item=el('span','');item.append(el('small','',label),el('strong','',value));bar.append(item);});
    if(!bar.children.length)bar.hidden=true;else bar.hidden=false;
  }
  function firstSentence(txt,limit){
    const clean=String(txt||'').replace(/\s+/g,' ').trim();
    if(!clean)return '';
    const pattern=lang()==='ja'?/^.{1,180}?[。！？]/:/^.{1,220}?[.!?](?:\s|$)/;
    const match=clean.match(pattern);
    return snippet(match?match[0].trim():clean,limit);
  }
  async function renderPeek(s,w,auto=false){
    const panel=$('#obLivePeekR1');if(!panel)return;
    if(!auto)peekDismissed=false;
    panel.hidden=false;root.classList.add('ob-live-peek-open');setSelectedWeek(w);
    panel.replaceChildren(el('p','ob-live-loading',i('週間記録を読み込み中…','Loading published week…')));
    const ticket=++renderPeek.ticket;
    try{
      const data=await fetchWeek(s,w);if(ticket!==renderPeek.ticket)return;
      if(!data){panel.hidden=true;root.classList.remove('ob-live-peek-open');return;}
      const rows=reference(data),stats=scoreInfo(data),prev=(w>1&&s.weeks.has(w-1))?scoreInfo(await fetchWeek(s,w-1)):null;
      if(ticket!==renderPeek.ticket)return;
      const close=el('button','ob-live-close','×');close.type='button';close.setAttribute('aria-label',i('閉じる','Close'));
      close.addEventListener('click',()=>{panel.hidden=true;root.classList.remove('ob-live-peek-open');peekDismissed=true;renderPeek.ticket++;setSelectedWeek(w);});
      const head=el('div','ob-live-peek-head');head.append(el('span','ob-live-kicker',`WEEK PEEK · ${fmt(w)} · ${w===s.latest?i('現在','CURRENT'):i('公開済み','PUBLISHED')}`),close);
      const context=el('div','ob-live-peek-context');
      const wPhase=w<=3?0:w<=7?1:w<=10?2:3;
      context.append(el('small','ob-live-kicker',i('この週を振り返る','THIS ROUND · AT A GLANCE')));
      const stageRange=['01–03','04–07','08–10','11–12'][wPhase];
      context.append(el('span','ob-live-peek-stage',i(`シーズンの段階 · ${phaseNames()[wPhase]}（W${stageRange}）`,`SEASON STAGE · ${phaseNames()[wPhase]} (W${stageRange})`)));
      const editorial=data?.meta?.home_pulse?.week_peek_line;
      const editorialLine=typeof editorial==='string'?editorial:(lang()==='ja'?editorial?.ja:editorial?.en);
      if(editorialLine&&String(editorialLine).trim())context.append(el('p','ob-live-peek-intro',String(editorialLine).trim()));
      const score=el('div','ob-live-metrics');
      const listed=stats.full!==null?stats.full:stats.listed;
      const prevListed=stats.full!==null?prev?.full:prev?.listed;
      const diff=(a,b)=>num(a)!==null&&num(b)!==null?Number(a)-Number(b):null;
      score.append(scoreText(i('TOP 10の平均','TOP 10 AVERAGE'),stats.top,stats.topN,true,diff(stats.top,prev?.top),prev?.top));
      score.append(scoreText(stats.full!==null?i('今週評価した全作品の平均','ALL RATED TITLES · AVERAGE'):i('今週のランキング対象作品の平均','ALL RANKED TITLES · AVERAGE'),listed,stats.full!==null?stats.fullN:stats.listedN,false,diff(listed,prevListed),prevListed));
      score.append(scoreText(i('TOP 10と全体平均の差','GAP · TOP 10 vs ALL RANKED'),diff(stats.top,listed),null,false,diff(diff(stats.top,listed),diff(prev?.top,prevListed)),diff(prev?.top,prevListed),'gap'));
      const pool=el('div','ob-live-population-r8 ob-live-population-r9 ob-live-population-r10');
      const line=el('div','ob-live-population-line-r9');
      if(stats.active!==null)line.append(el('span','',i(`現在のラインアップ ${stats.active}作品`,`Active lineup: ${stats.active} titles`)));
      if(stats.noAir>0)line.append(el('span','ob-live-noair-r9',i(`今週放送なし ${stats.noAir}作品`,`Not aired this week: ${stats.noAir}`)));
      line.append(el('strong','ob-live-rated-r9',i(`今週の採点・ランキング ${stats.listedN}作品`,`Scored and ranked this week: ${stats.listedN} titles`)));
      pool.append(line);
      const accountingVerified=stats.active!==null&&stats.active-stats.noAir===stats.listedN;
      const note=el('p','ob-live-stat-foot ob-live-stat-foot-r10', accountingVerified && stats.noAir>0
        ? i('※ 今週の平均には、放送がなかった作品を含みません。','This week’s averages exclude the titles that did not air.')
        : i(`公開されたランキングの${stats.listedN}作品を集計。`,`Based on ${stats.listedN} titles in the published ranking.`));
      if(prev&&stats.top!==null&&listed!==null&&prev.top!==null&&prevListed!==null){
        const topMove=stats.top-prev.top, fieldMove=listed-prevListed;
        const diffNow=stats.top-listed, diffBefore=prev.top-prevListed;
        const isWider=(diffNow-diffBefore)>.005, isNarrower=(diffNow-diffBefore)<-.005;
        if(isWider||isNarrower){
          const explain=el('p','ob-live-gap-context-r10');
          if(isWider&&topMove>=0&&fieldMove<0){
            explain.textContent=i('上位10作品は微増した一方、ランキング全体の平均は低下。両者の開きが広がりました。','The Top 10 edged up, while the overall ranked-title average fell—widening the gap.');
          }else if(isNarrower){
            explain.textContent=i('上位10作品とランキング全体の平均の開きが、前週より縮まりました。','The gap between the Top 10 and the full ranking narrowed this week.');
          }else{
            explain.textContent=i('上位10作品とランキング全体の平均の開きが、前週より広がりました。','The gap between the Top 10 and the full ranking widened this week.');
          }
          score.append(explain);
        }
      }
      const top=el('div','ob-live-top3');top.append(el('small','ob-live-kicker',i('この週の上位3作品','TOP THREE THIS ROUND')));
      const podium=el('div','ob-live-top3-grid');
      rows.slice(0,3).forEach((row,idx)=>{
        const item=el('div','ob-live-top3-item');item.append(el('b','ob-live-position',fmt(row.rank)));
        const src=imageOf(s,row);if(src){const img=el('img');img.src=src;img.alt='';img.loading='lazy';img.addEventListener('error',()=>img.remove());item.append(img);}
        item.append(el('span','ob-live-top3-title',titleOf(row)));
        // The compact three-title feature is an invitation, not another score table.
        podium.append(item);
      });top.append(podium);
      const numbers=el('details','ob-live-reading');numbers.append(bilingual(el('summary'),'数字の読み方を見る','READING THE FIGURES'));
      const explain=el('div','ob-live-reading-copy');
      const info=[
        [i('集計対象','What the averages cover'),stats.full===null?
          i(`今週のランキングに載った${stats.listedN}作品の点数を平均しています。休止などでランキングに入っていない作品は含みません。`,`The average covers ${stats.listedN} scored titles in this week's ranking; titles not ranked this week are not included.`):
          i('全体平均には、その週に評価した全作品が含まれます。','The overall average includes every title rated that week.')],
        [i('上位との開き','Why the gap matters'),i('TOP 10の平均点からランキング全体の平均点を引いた差です。大きいほど上位作品と全体との開きが目立ちます。','Top 10 average minus the average across all ranked titles. A larger gap means the leaders stand further above the field.')],
        [i('読み解く目安','How to interpret the scores'),i('S.O.W.ではTOP 10に高い水準を期待しており、平均9点は一つの参考目安です。ただし序盤の採点傾向、前週比、作品数、個人的な満足度も合わせて見ます。','S.O.W. expects a strong Top 10; an average of 9.0 is one useful reference, not an automatic pass/fail line. Consider the phase of the season, week-on-week changes, title count and personal enjoyment too.')]
      ];
      for(const [heading,body] of info){const p=el('p');p.append(el('strong','',heading),document.createTextNode(' · '+body));explain.append(p);}
      numbers.append(explain);
      const footer=el('div','ob-live-peek-footer');
      const meaning=el('div','ob-live-meaning');meaning.append(el('small','',i('この週の記録','THIS ROUND')),
        el('span','',i(`第${fmt(w)}週 · 評価点と週間満足度は別々に記録`,`Week ${fmt(w)} · ratings and enjoyment are separate measures`)));
      if(stats.satisfaction!==null&&stats.satisfaction>=0&&stats.satisfaction<=199.8){
        const sat=el('span','ob-live-enjoyment');
        const face=el('span','ob-live-enjoyment-face');face.setAttribute('aria-hidden','true');
        const curve=stats.satisfaction>=8?'M 8 17 Q 14 23 20 17':stats.satisfaction>=5?'M 8 18 L 20 18':'M 8 21 Q 14 14 20 21';
        face.innerHTML='<svg width="29" height="29" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="14" cy="14" r="12.2" fill="#f1d258" stroke="#866d2f" stroke-width="1.1"/><circle cx="10" cy="11" r="1.2" fill="#624a27"/><circle cx="18" cy="11" r="1.2" fill="#624a27"/><path d="'+curve+'" fill="none" stroke="#624a27" stroke-width="1.6" stroke-linecap="round"/></svg>';
        const satText=el('span','ob-live-enjoyment-label-r8',i('週間満足度','WEEKLY ENJOYMENT'));
        const satNumber=el('strong','ob-live-enjoyment-value-r8',(stats.satisfaction*stats.satisfactionScale/10).toFixed(1));
        const satMax=el('small','ob-live-enjoyment-max-r8','/'+stats.satisfactionScale);
        const figure=el('span','ob-live-enjoyment-figure-r9');figure.append(satNumber,satMax);
        sat.append(face,satText,figure);
        meaning.append(sat);
      }
      footer.append(meaning);
      const go=safeLink(weekHref(s,w),i(`第${fmt(w)}週のフルランキングを見る`,`READ FULL WEEK ${fmt(w)} RANKING`),'ob-live-cta ob-live-full-rank');
      const goRow=el('div','ob-live-go-row-r8');
      const goExplain=el('span','ob-live-go-explain-r8',i('全作品の順位、各話レビュー、今週の総評はフルランキングで','See the full standings, episode reviews and this week’s editorial'));
      goRow.append(goExplain,go);
      panel.replaceChildren(head,pool,note,context,score,top,numbers,footer,goRow);
      setSelectedWeek(w);
      if(!auto)requestAnimationFrame(()=>requestAnimationFrame(()=>scrollPeekToStart(panel)));
    }catch(err){if(ticket!==renderPeek.ticket)return;panel.replaceChildren(el('p','',i('週間データを取得できません。','Week record unavailable.')));}
  }
  // R93: the destination is the first Week Peek line, not a mid-article metric.
  // Use the actual visible sticky nav bottom; 'nearest' depended on the old scroll position.
  function scrollPeekToStart(panel){
    if(!panel || panel.hidden)return;
    const nav=document.querySelector('#greenNav');
    const rect=nav?.getBoundingClientRect();
    const navBottom=rect&&rect.bottom>0&&rect.top<innerHeight?Math.max(0,rect.bottom):0;
    const destination=Math.max(0,scrollY+panel.getBoundingClientRect().top-navBottom-10);
    window.scrollTo({top:destination,behavior:'smooth'});
  }
  let peekDismissed=true,selectedWeek=0;
  function setSelectedWeek(w){
    selectedWeek=w;
    const nav=$('.n-weeks');if(!nav)return;
    [...nav.querySelectorAll('a')].forEach(a=>{
      const ref=anchorToYearSeason(a),selected=!!ref&&ref.week===w;
      a.classList.toggle('ob-live-selected',selected);
      if(selected)a.setAttribute('data-ob-live-selected','true');
      else a.removeAttribute('data-ob-live-selected');
    });
    const open=$('#obLivePeekToggleR3');if(open){
      const isOpen=!$('#obLivePeekR1')?.hidden;
      open.textContent=isOpen?i(`WEEK PEEK · 第${fmt(w)}週を閉じる`,`CLOSE WEEK PEEK · W${fmt(w)}`)
                             :i(`WEEK PEEK · 第${fmt(w)}週を開く`,`OPEN WEEK PEEK · W${fmt(w)}`);
      open.setAttribute('aria-expanded',String(isOpen));
      open.setAttribute('aria-controls','obLivePeekR1');
    }
  }
  function refreshSeasonHeader(s){
    const title=$('#obLiveCurrentMarkerR3');
    if(title){title.querySelector('strong').textContent=`WEEK ${fmt(s.latest)} / 12`;
      const left=title.querySelector('small');left.replaceChildren(el('strong','ob-live-remaining-value-r9',String(12-s.latest)),document.createTextNode(i('週で終了',' rounds remaining')));}
    const next=$('#obLiveRoundIntroR3 .ob-live-round-next');
    if(next){
      const nextWeek=s.latest<12?s.latest+1:12;
      const label=bilingual(el('span','ob-live-next-word-r11'),s.latest<12?'次':'最終','NEXT');
      const detail=bilingual(el('b','ob-live-next-detail-r11'),s.latest===5?'W06 / ミッドシーズン':s.latest<12?`W${fmt(nextWeek)}`:'W12 / ファイナル',
        s.latest===5?'W06 / MIDSEASON':s.latest<12?`W${fmt(nextWeek)}`:'W12 / FINAL');
      if(s.latest>=12){label.textContent=i('最終','FINAL');label.dataset.obLiveJa='最終';label.dataset.obLiveEn='FINAL';}
      next.replaceChildren(label,detail);
    }
  }
  renderPeek.ticket=0;
  function buildPeekEvents(){
    const weekNav=$('.n-weeks');if(!weekNav||weekNav.dataset.obLiveEvents)return;
    weekNav.dataset.obLiveEvents='true';
    // Capture only unmodified primary clicks. Original Week Peek remains in the source,
    // but will not be opened at the same time as the compact recap.
    weekNav.addEventListener('click',e=>{
      const a=e.target.closest('a');if(!a||!weekNav.contains(a))return;
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
      const ref=anchorToYearSeason(a),s=active;
      if(!ref||!s||ref.year!==s.year||ref.season!==s.season||ref.week===0)return;
      // Coarse/touch: let the original Top-3 Snapshot own the tap.
      // The existing Week Peek control adopts the selected published week.
      if(matchMedia('(hover: none), (pointer: coarse)').matches){
        const panel=$('#obLivePeekR1');
        if(panel&&!panel.hidden){panel.hidden=true;root.classList.remove('ob-live-peek-open');peekDismissed=true;renderPeek.ticket++;}
        setSelectedWeek(ref.week);
        return;
      }
      // Fine pointer: hover stays with original Snapshot; click opens detail.
      e.preventDefault();e.stopImmediatePropagation();
      document.dispatchEvent(new Event('offbeat:close-top3-snapshot'));
      renderPeek(s,ref.week);
    },true);
  }
  document.addEventListener('offbeat:open-week-peek',event=>{
    const ref=event.detail,s=active;
    if(!ref||!s||String(ref.year)!==String(s.year)||ref.season!==s.season||
       !Number.isInteger(ref.week)||ref.week<1||!s.weeks.has(ref.week))return;
    document.dispatchEvent(new Event('offbeat:close-top3-snapshot'));
    renderPeek(s,ref.week);
  });
  function chartLine(points,lo,hi,color,width){
    const coords=points.filter(v=>v.v!==null).map(({w,v})=>[48+(w-1)*width/11,14+(hi-v)*(130/(hi-lo))]);
    if(!coords.length)return null;
    const path=document.createElementNS('http://www.w3.org/2000/svg','polyline');path.setAttribute('fill','none');
    path.setAttribute('stroke',color);path.setAttribute('stroke-width','2.5');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');
    path.setAttribute('points',coords.map(p=>p.join(',')).join(' '));return path;
  }
  async function renderTrend(s){
    const panel=$('#obLivePulseBodyR1');if(!panel)return;
    const token=++renderTrend.token;panel.replaceChildren(el('p','',i('公開済みデータを読み込み中…','Loading published weeks…')));
    const weeks=[...s.weeks].filter(w=>w>=1&&w<=12).sort((a,b)=>a-b);
    const reports=await Promise.all(weeks.map(async w=>{try{return {w,data:await fetchWeek(s,w)};}catch{return {w,data:null};}}));
    if(token!==renderTrend.token)return;
    const values=reports.filter(x=>x.data).map(({w,data})=>{
      const stats=scoreInfo(data),rows=reference(data),outsideRows=rows.filter(row=>num(row.rank)>10&&num(row.wrp_score)!==null);
      return {w,rows,...stats,overall:stats.full!==null?stats.full:stats.listed,
        outside:avg(outsideRows.map(row=>row.wrp_score)),outsideN:outsideRows.length,
        dataInitial:num(data?.meta?.status?.initialSeasonPool),notYet:num(data?.meta?.status?.notAiredYet),droppedTotal:num(data?.meta?.status?.droppedTotal)};
    });
    if(!values.length){panel.textContent=i('まだ公開済みデータがありません。','No published week data yet.');return;}
    function changeArrow(delta){
      if(delta===null||Math.abs(delta)<.005)return null;
      const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');
      arrow.setAttribute('viewBox','0 0 12 12');arrow.setAttribute('width','12');arrow.setAttribute('height','12');
      arrow.setAttribute('aria-hidden','true');arrow.setAttribute('class','ob-live-direction-r10 '+(delta>0?'is-up':'is-down'));
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',delta>0?'M6 10V2 M2.5 5.5L6 2l3.5 3.5':'M6 2v8 M2.5 6.5L6 10l3.5-3.5');
      path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.7');
      path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');arrow.append(path);return arrow;
    }
    const dataByWeek=new Map(values.map(x=>[x.w,x]));
    const initialPool=values.find(v=>v.w===1)?.dataInitial??values[0].dataInitial;
    const firstActive=values.find(v=>v.w===1)?.active;
    const latestActive=values.at(-1)?.active;
    const firstUnaired=values.find(v=>v.w===1)?.notYet;
    const lastUnaired=values.at(-1)?.notYet;
    const lastDropped=values.at(-1)?.droppedTotal;
    const countDetails=(firstUnaired!==null&&firstUnaired!==undefined&&lastUnaired!==null&&lastUnaired!==undefined&&lastDropped!==null&&lastDropped!==undefined)
      ? i(`（第01週の未放送${firstUnaired}作品／直近の累計脱落${lastDropped}作品・未放送${lastUnaired}作品）`,
          ` (${firstUnaired} unaired in Week 01; ${lastDropped} dropped to date and ${lastUnaired} still unaired in the latest week)`)
      : '';
    const overview=(initialPool!==null&&firstActive!==null&&latestActive!==null)?
      i(`開幕時のシーズン候補は${initialPool}作品。第01週の現行ラインアップ${firstActive}作品から、直近は${latestActive}作品に。${countDetails} 得点と作品数の推移を重ねて、シーズンの変化を見渡せます。`,
        `The opening season pool held ${initialPool} titles; ${firstActive} were active in Week 01, versus ${latestActive} in the latest published week.${countDetails} Follow ratings and lineup size together.`):
      i('毎週の得点と対象作品数の変化から、シーズン全体の動きを見渡せます。','See the season evolve through weekly averages and changes in the active lineup.');
    const caption=el('p','ob-live-trend-caption',i(
      '各週の平均点、現行ラインアップの作品数、そして週間1位の移り変わりを重ねると、シーズンの浮き沈みが見えてきます。',
      'Weekly averages, lineup changes and each round’s No. 1 reveal different sides of the season as it unfolds.'));
    const poolFoot=el('p','ob-live-season-pool-foot-r11',overview);
    // R82: Emphasize only real season counts, not arbitrary numerals in
    // prose (e.g. Week 01). Keep all copy intact, no HTML injection.
    const poolEmphasis=new Set([initialPool,firstActive,latestActive,lastDropped]
      .filter(n=>n!==null&&n!==undefined).map(String));
    if(poolEmphasis.size){
      const parts=overview.split(/(\d+)/);
      poolFoot.replaceChildren(...parts.map((part,index)=>
        index%2===1&&poolEmphasis.has(part)
          ? el('strong','ob-live-pool-number-r82',part)
          : document.createTextNode(part)));
    }
    const chart=el('div','ob-live-trend-chart');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 680 198');svg.setAttribute('role','img');
    svg.setAttribute('aria-label',i('TOP 10平均、全ランキング平均、TOP 10圏外平均、現行ラインアップ作品数の週別推移。左軸はWRP、右軸は作品数。',
      'Four weekly series: Top 10, all ranked, outside Top 10 WRP averages, and active lineup. Left axis: WRP points; right axis: titles.'));
    const NS='http://www.w3.org/2000/svg';
    const sv=(tag,attrs={},textValue)=>{const item=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([key,value])=>item.setAttribute(key,String(value)));if(textValue!==undefined)item.textContent=textValue;return item;};
    const scored=values.flatMap(v=>[v.overall,v.top,v.outside]).filter(v=>v!==null);
    // Use the meaningful 5–10 WRP band for the current season; extend if later data requires it.
    const low=scored.length?Math.min(5,Math.floor((Math.min(...scored)-.10)*2)/2):5;
    const high=scored.length?Math.max(10,Math.ceil((Math.max(...scored)+.10)*2)/2):10;
    const plotTop=28,plotBottom=162,plotLeft=48,plotRight=628;
    const x=w=>plotLeft+(w-1)*((plotRight-plotLeft)/11);
    const y=v=>plotTop+(high-v)*((plotBottom-plotTop)/(high-low));
    const mark=sv('rect',{x:x(Math.max(1,s.latest))-19,y:plotTop-6,width:38,height:plotBottom-plotTop+12,fill:'#e7efdf',opacity:.6});svg.append(mark);
    svg.append(sv('text',{x:plotLeft,y:13,'text-anchor':'start',class:'ob-live-axis-unit-r24'},i('WRP（点）','WRP (pts)')));
    svg.append(sv('text',{x:640,y:13,'text-anchor':'start',class:'ob-live-axis-unit-r24'},i('作品数','titles')));
    for(let v=Math.ceil(low);v<=high+.001;v+=1){const yy=y(v);
      svg.append(sv('line',{x1:plotLeft,x2:plotRight,y1:yy,y2:yy,stroke:'#d4dfce','stroke-width':1}));
      svg.append(sv('text',{x:37,y:yy+3.5,'text-anchor':'end','font-size':10,fill:'#687c6d'},v.toFixed(0)));
    }
    const draw=(key,color)=>{
      let chain=[];const flush=()=>{if(chain.length>1)svg.append(sv('polyline',{points:chain.map(p=>x(p.w)+','+y(p.v)).join(' '),fill:'none',stroke:color,'stroke-width':2.5,'stroke-linejoin':'round','stroke-linecap':'round'}));chain=[];};
      for(let w=1;w<=12;w++){const row=dataByWeek.get(w),v=row?.[key];if(v!==null&&v!==undefined)chain.push({w,v});else flush();}flush();
      values.forEach(row=>{const v=row[key];if(v===null)return;
        const circle=sv('circle',{cx:x(row.w),cy:y(v),r:3.4,fill:'#fafaf2',stroke:color,'stroke-width':2.3});
        circle.append(sv('title',{},`W${fmt(row.w)} · ${key==='top'?i('TOP 10平均','Top 10 average'):key==='outside'?i('TOP 10圏外平均','Outside Top 10 average'):i('全ランキング平均','All ranked average')}: ${nfmt(v)} WRP`));
        svg.append(circle);
      });
    };
    // The four signals share ONE graph; the three WRP lines use the LEFT scale.
    draw('overall','#557e59');draw('top','#bb824b');draw('outside','#886d91');
    // Title counts are a different unit, shown on the labeled RIGHT axis.
    const lineupEntries=values.filter(v=>v.active!==null);
    if(lineupEntries.length){
      const minCount=Math.min(...lineupEntries.map(v=>v.active)),maxCount=Math.max(...lineupEntries.map(v=>v.active));
      const countLow=Math.max(0,Math.floor((minCount-2)/5)*5),countHigh=Math.max(countLow+5,Math.ceil((maxCount+2)/5)*5);
      const yc=value=>plotTop+(countHigh-value)*(plotBottom-plotTop)/(countHigh-countLow);
      const ticks=[countLow,Math.round((countLow+countHigh)/2),countHigh];
      [...new Set(ticks)].forEach(value=>svg.append(sv('text',{x:644,y:yc(value)+3,'text-anchor':'start','font-size':9,fill:'#6d8174'},value)));
      let chain=[];const flush=()=>{if(chain.length>1)svg.append(sv('polyline',{points:chain.map(p=>x(p.w)+','+yc(p.v)).join(' '),fill:'none',stroke:'#758179','stroke-width':2,'stroke-dasharray':'5 4','stroke-linejoin':'round','stroke-linecap':'round'}));chain=[];};
      for(let w=1;w<=12;w++){const row=dataByWeek.get(w);if(row&&row.active!==null)chain.push({w,v:row.active});else flush();}flush();
      lineupEntries.forEach(row=>{const point=sv('rect',{x:x(row.w)-2.5,y:yc(row.active)-2.5,width:5,height:5,fill:'#f7f8f1',stroke:'#758879','stroke-width':1.3});
        point.append(sv('title',{},`W${fmt(row.w)} · ${i('現行ラインアップ','Active lineup')}: ${row.active} ${i('作品','titles')}`));svg.append(point);
      });
    }
    const clickAreas=[];
    values.forEach(row=>{const target=sv('rect',{x:x(row.w)-20,y:plotTop-7,width:40,height:plotBottom-plotTop+15,fill:'transparent',tabindex:0,role:'button','aria-label':i(`第${row.w}週を選択`,`Select Week ${row.w}`)});
      svg.append(target);clickAreas.push({w:row.w,target});
      target.addEventListener('click',()=>selectWeek(row.w));target.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectWeek(row.w);}});
    });
    for(let w=1;w<=12;w++)svg.append(sv('text',{x:x(w),y:186,'text-anchor':'middle','font-size':10,fill:values.some(row=>row.w===w)?'#55785e':'#a6b6a4'},'w'+fmt(w)));
    chart.append(svg);
    const legend=el('p','ob-live-key');legend.append(
      el('span','ob-live-dot-ranked',i('ランキング全体の平均','All ranked titles average')),
      el('span','ob-live-dot-top',i('TOP 10平均','Top 10 average')),
      el('span','ob-live-dot-outside-r24',i('TOP 10圏外の平均','Outside Top 10 average')));
    if(values.some(v=>v.active!==null))legend.append(el('span','ob-live-dot-lineup-r10',i('現行ラインアップ（右軸）','Active lineup (right axis)')));
    const winners=el('div','ob-live-winners');
    const winnerHeading=el('div','ob-live-winners-heading-r8');
    winnerHeading.append(el('strong','',i('各週の首位','WEEKLY WINNERS')),
      el('p','',i('毎週の1位をたどると、意外な首位や返り咲きなど、シーズンの顔ぶれの変化が見えてきます。週間1位は最終総合順位とは別です。','A record of each week’s No. 1—and a way to spot surprise leaders, repeat wins and shifts through the season. Weekly wins do not determine the final standings.')));
    winners.append(winnerHeading);
    const strip=el('div','ob-live-winner-strip ob-live-winner-strip-r24');const winnerButtons=[];
    const winnerLegend=el('p','ob-live-winner-legend-r24',i(
      '各週の首位WRP・TOP10平均・全体平均・圏外平均・現行作品数をポスターの下に表示。数字は各週の集計結果です。',
      'Below each winner: winning WRP · Top 10 avg · All ranked avg · Outside Top 10 avg · Active titles.'));
    winners.append(winnerLegend);
    // R82: An explicit, localized link between the selectable weeks and
    // the existing on-page context update. No new click handlers needed.
    winners.append(el('p','ob-live-select-week-hint-r82',i(
      'グラフや各週のカードを選ぶと、下の「その週の記録」が切り替わります。',
      'Select a week in the chart or the cards to update the Round in Context below.')));
    for(let w=1;w<=12;w++){
      const row=dataByWeek.get(w),winner=row?.rows?.[0],cell=el('button','ob-live-winner');cell.type='button';cell.disabled=!winner;
      cell.append(el('small','',`W${fmt(w)}`));
      if(winner){
        const url=imageOf(s,winner);if(url){const artwork=el('img');artwork.src=url;artwork.loading='lazy';artwork.alt=titleOf(winner);artwork.addEventListener('error',()=>{artwork.style.visibility='hidden';});cell.append(artwork);}
        const metrics=el('div','ob-live-winner-figures-r24');
        const stat=(label,amount,kind)=>{const line=el('div','ob-live-winner-figure-r24 '+kind);line.append(el('span','ob-live-winner-figure-label-r24',label),el('b','',amount));metrics.append(line);};
        stat('WRP',nfmt(num(winner.wrp_score)),'is-winner');
        stat(i('上位10','T10'),nfmt(row.top),'is-top');
        stat(i('全体','ALL'),nfmt(row.overall),'is-all');
        stat(i('圏外','OUT'),nfmt(row.outside),'is-outside');
        stat(i('現行','LIVE'),row.active===null?'—':String(row.active),'is-active');
        cell.append(metrics);
        cell.title=titleOf(winner)+` · W${fmt(w)} · WRP ${nfmt(num(winner.wrp_score))} · ${i('上位10平均','Top 10 avg')} ${nfmt(row.top)} · ${i('圏外平均','Outside Top 10 avg')} ${nfmt(row.outside)} · ${i('現行','Active')} ${row.active??'—'}`;
        cell.addEventListener('click',()=>selectWeek(w));
      }else cell.append(el('span','ob-live-no-result',i('未公開','—')));
      strip.append(cell);winnerButtons.push({w,cell});
    }winners.append(strip);
    const digest=el('div','ob-live-trend-digest');digest.setAttribute('aria-live','polite');
    const note=el('p','ob-live-trend-note',i('※ 緑・橙・紫の実線＝左のWRP目盛り。灰色の破線＝右の作品数目盛り。圏外は11位以下を指し、開幕候補数と現行ラインアップ数は異なります。',
      'Solid green, orange and plum lines use WRP points (left axis). The dashed gray line uses active titles (right). Outside Top 10 means rank 11 onward; opening pool and active lineup differ.'));
    panel.replaceChildren(caption,poolFoot,legend,note,chart,winners,digest);
    function selectWeek(w){
      const value=dataByWeek.get(w);if(!value)return;
      winnerButtons.forEach(({w:n,cell})=>cell.classList.toggle('is-active',n===w));
      clickAreas.forEach(({w:n,target})=>target.classList.toggle('is-active',n===w));
      mark.setAttribute('x',String(x(w)-19));
      const winner=value.rows?.[0],header=el('div','ob-live-digest-heading ob-live-digest-heading-r8');
      const previous=dataByWeek.get(w-1);
      header.append(el('strong','ob-live-digest-round',i(`W${fmt(w)} · シーズンの中での位置`,`W${fmt(w)} · THE ROUND IN CONTEXT`)));
      const winnerBox=el('div','ob-live-digest-winner ob-live-digest-winner-r8');
      if(winner){
        const art=imageOf(s,winner);if(art){const img=el('img');img.src=art;img.alt='';img.loading='lazy';winnerBox.append(img);}
        const copy=el('div');
        copy.append(el('small','',i('この週の1位','WEEKLY NO. 1')),el('strong','',titleOf(winner)));
        if(num(winner.wrp_score)!==null)copy.append(el('span','ob-live-digest-wrp',`WRP ${Number(winner.wrp_score).toFixed(2)}`));
        const details=[];
        if(winner.episode)details.push(lang()==='ja'?`対象 ${String(winner.episode)}`:String(winner.episode).replace(/^ep\./i,'Ep. '));
        if(num(winner.score)!==null)details.push(i(`評価 ${num(winner.score)}点`,`Episode score: ${num(winner.score)}`));
        if(details.length)copy.append(el('span','ob-live-winner-detail-r11',details.join(' · ')));
        const identity=e=>String(e?.kv||e?.jpTitle||e?.title||'').trim().toLowerCase();
        const winWeeks=values.filter(v=>v.w<=w&&identity(v.rows?.[0])===identity(winner)).map(v=>v.w);
        const wins=winWeeks.length;
        if(wins>1)copy.append(el('span','ob-live-wins-count-r8',
          i(`週間1位 ${wins}回（${winWeeks.map(n=>'W'+fmt(n)).join('・')}）`,
            `${wins} weekly wins so far (${winWeeks.map(n=>'W'+fmt(n)).join(', ')})`)));
        winnerBox.append(copy);
      }
      const measures=el('div','ob-live-digest-measures');
      const overall=value.overall;
      const measure=(heading,amount,foot)=>{
        const box=el('span','ob-live-context-stat-r8');
        box.append(el('small','',heading),el('b','',amount));if(foot){
          const changeClass=/^\+/.test(foot)?'is-up':/^-/.test(foot)?'is-down':'';
          box.append(el('em',changeClass,foot));
        }measures.append(box);
      };
      const delta=(a,b)=>a!==null&&b!==null&&b!==undefined?a-b:null;
      const changeText=v=>v===null?i('比較可能な前週値なし','No comparable previous week'):(v>0?'+':'')+v.toFixed(2)+i(' · 前週比',' vs prior week');
      // Do not compare mixed populations as equivalent if a full-rated field arrives later.
      const comparable=previous&&((value.full!==null)===(previous.full!==null));
      measure(value.full!==null?i('全評価作品の平均','ALL RATED TITLES'):i('ランキング全体の平均','ALL RANKED TITLES'),nfmt(overall),
        comparable?changeText(delta(overall,previous.overall)):i('前週との同条件比較なし','No comparable prior sample'));
      measure(i('TOP 10平均','TOP 10 AVERAGE'),nfmt(value.top),previous?changeText(delta(value.top,previous.top)):i('第1週の基準値','Opening-round baseline'));
      measure(i('TOP 10圏外の平均','OUTSIDE TOP 10 AVG'),nfmt(value.outside),
        value.outsideN?i(`第11位以下 ${value.outsideN}作品`,`Positions 11+ · ${value.outsideN} titles`):i('対象作品なし','No scored titles outside Top 10'));
      measure(i('上位10と全体の差','TOP 10 − FIELD GAP'),overall!==null&&value.top!==null?(value.top-overall).toFixed(2):'—',
        i(`${value.full!==null?'全評価':'公開済み得点'}平均との差`,`Difference from ${value.full!==null?'all rated':'published scored'} mean`));
      measure(i('今週のランキング作品数','RANKED THIS ROUND'),String(value.full!==null?value.fullN??'—':value.listedN),
        value.active!==null?i(`有効ラインアップ ${value.active}作品`,`active lineup ${value.active}`):'');
      const poolContext=el('p','ob-live-lineup-context-r10');
      const opening=values.find(v=>v.w===1)?.active;
      if(value.active!==null){
        poolContext.textContent=(opening!==null&&opening!==undefined)
          ? i(`現行ラインアップは第01週の${opening}作品から第${fmt(w)}週の${value.active}作品へ。※脱落と未放送は別集計。`,
              `Active lineup: ${opening} in Week 01 → ${value.active} in Week ${fmt(w)}. Dropped and not-yet-aired titles are tracked separately.`)
          : i(`現行ラインアップ ${value.active}作品`,`Active lineup: ${value.active} titles`);
      }
      const insight=el('div','ob-live-digest-insight-r8');
      const earlier=values.filter(v=>v.w<w&&v.overall!==null&&((v.full!==null)===(value.full!==null)));
      const baseAll=avg(earlier.map(v=>v.overall)),baseTop=avg(earlier.map(v=>v.top));
      const comparison=el('div','ob-live-season-comparison-r9');
      const pfx=v=>v>0?'+':'';
      const compare=(label,here,baseline)=>{
        const piece=el('div','ob-live-season-compare-stat-r9');
        piece.append(el('span','',label));
        if(here!==null&&baseline!==null){const d=here-baseline;
          const v=el('strong',d>0?'is-up':d<0?'is-down':'is-flat',pfx(d)+d.toFixed(2));
          piece.append(v);const arrow=changeArrow(d);if(arrow)piece.insertBefore(arrow,v);piece.append(el('small','',i(`それ以前の週の平均 ${baseline.toFixed(2)}`,`earlier-week mean ${baseline.toFixed(2)}`)));
        }else piece.append(el('span','ob-live-muted',i('前の週がまだありません','No earlier weeks yet')));
        comparison.append(piece);
      };
      const lead=el('p','ob-live-season-compare-lead-r9',i(`第${fmt(w)}週を、それ以前の公開済み${earlier.length}週と比較`,
        `Week ${fmt(w)} versus ${earlier.length} earlier published round${earlier.length===1?'':'s'}`));
      comparison.append(lead);
      compare(i('TOP 10平均','Top 10 average'),value.top,baseTop);
      compare(i('ランキング全体の平均','All ranked titles average'),overall,baseAll);
      insight.append(comparison);
      if(earlier.length&&overall!==null&&value.top!==null&&baseAll!==null&&baseTop!==null){
        const topChange=value.top-baseTop, allChange=overall-baseAll;
        const takeaway= topChange>=.005&&allChange<-.005
          ? i('上位は過去の週より好調ですが、ランキング全体は平均を下回っています。','The leaders are outperforming earlier weeks, but the field overall is below its earlier average.')
          : topChange<-.005&&allChange>=.005
          ? i('ランキング全体は持ち直していますが、TOP 10はこれまでの平均を下回っています。','The field is holding up better than the leaders, whose average is below earlier weeks.')
          : topChange>=.005&&allChange>=.005
          ? i('TOP 10もランキング全体も、それまでの平均を上回っています。','Both the Top 10 and the field are above their earlier-week averages.')
          : topChange<-.005&&allChange<-.005
          ? i('TOP 10もランキング全体も、それまでの平均を下回っています。','Both the Top 10 and the field are below their earlier-week averages.')
          : i('TOP 10とランキング全体の動きに、大きな差は出ていません。','Neither the Top 10 nor the field differs much from earlier weeks.');
        insight.append(el('p','ob-live-season-takeaway-r9',takeaway));
      }
      const actions=el('div','ob-live-digest-actions');
      const recap=el('button','ob-live-recap-cta',i(`第${fmt(w)}週の概要を見る`,`VIEW WEEK ${fmt(w)} SNAPSHOT`));
      recap.type='button';recap.addEventListener('click',()=>{peekDismissed=false;renderPeek(s,w);});
      actions.append(recap,safeLink(weekHref(s,w),i('全順位とレビュー','FULL RANKING & REVIEWS')));
      digest.replaceChildren(header,winnerBox,measures,poolContext,insight,actions);
    }
    selectWeek(Math.min(s.latest,values.at(-1).w));
  }
    renderTrend.token=0;
  let refreshTimer=0;
  function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,200);}
  function refresh(){
    if(!manifest)return;
    const s=selectedSeason();if(!s)return;
    const current=`${s.year}/${s.season}/${s.latest}`;const changed=current!==lastKey;
    if(!changed&&root.dataset.obLiveLang===lang())return;
    root.dataset.obLiveLang=lang();lastKey=current;active=s;relabel();updateCompanions(s);
    const currentLabel=$('.n-season-name small');
    if(currentLabel){
      const expected=i('今シーズン / Seasons of the Watch','CURRENT SEASON / SEASONS OF THE WATCH');
      if(currentLabel.textContent!==expected)currentLabel.textContent=expected;
    }
    const phases=$('#obLivePhasesR1');if(phases){[...phases.children].forEach((x,j)=>{const t=x.querySelector('.ob-live-phase-title');if(t)t.textContent=phaseNames()[j];x.classList.toggle('ob-live-phase-active-r10',(s.latest>=1&&s.latest<=3&&j===0)||(s.latest>=4&&s.latest<=7&&j===1)||(s.latest>=8&&s.latest<=10&&j===2)||(s.latest>=11&&j===3));});}
    refreshSeasonHeader(s);
    // Keep the archive-return control outside the year-selector row even
    // when other scripts refresh the historical season chooser.
    const archiveChooser=$('.n-season-chooser');
    const archiveReturn=archiveChooser?.querySelector('.ob-r16-back');
    const archiveTabs=archiveChooser?.querySelector('.n-season-tabs');
    if(archiveReturn && archiveTabs && archiveReturn.parentElement!==archiveChooser){
      archiveTabs.after(archiveReturn);
    }
    const peek=$('#obLivePeekR1');if(peek){peek.hidden=true;root.classList.remove('ob-live-peek-open');renderPeek.ticket++;}
    if(changed){peekDismissed=true;selectedWeek=s.latest;}
    if(!peekDismissed && s.latest>0)renderPeek(s,selectedWeek||s.latest,true);
    else if(selectedWeek)setSelectedWeek(selectedWeek);
    renderStory(s);if($('#obLivePulseR1')?.open)renderTrend(s);
  }
  async function init(){
    if(root.dataset.obLiveR5)return;
    try{const r=await fetch(manifestPath,{cache:'no-store'});if(!r.ok)throw Error('Manifest status '+r.status);manifest=await r.json();}catch(err){console.warn('OFFBEAT Live R2 skipped; manifest missing',err);return;}
    root.dataset.obLiveR5='ready';buildNav();buildFrames();buildPeekEvents();schedule();
    const weekNav=$('.n-weeks'), seasonName=$('.n-season-name');
    if(weekNav)new MutationObserver(schedule).observe(weekNav,{childList:true});
    if(seasonName)new MutationObserver(schedule).observe(seasonName,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',e=>{if(e.target.closest('[data-peek-lang]'))setTimeout(schedule,75);},true);
    window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang')schedule();});
  }
  if(document.readyState==='complete')setTimeout(init,350);
  else window.addEventListener('load',()=>setTimeout(init,350),{once:true});
})();
