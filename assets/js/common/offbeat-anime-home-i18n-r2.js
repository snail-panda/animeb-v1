/* OFFBEAT Anime Home bilingual UI R2 — editorial JP polish (2026-11-06).
 * Works with the existing Week Peek EN / 日本語 control and its localStorage key.
 * Does not rewrite ranking JSON, Featured Titles, article copy, or their sources.
 * Uses exact DOM selectors; editor-written post titles/excerpts are not machine-translated.
 */
(() => {
  'use strict';
  const root = document.getElementById('anime-top');
  if (!root || window.OFFBEAT_ANIME_HOME_I18N_R2) return;
  window.OFFBEAT_ANIME_HOME_I18N_R2 = true;
  const original = new WeakMap();
  const applied = new WeakMap();
  const seasons = {winter:'冬',spring:'春',summer:'夏',fall:'秋'};
  const months = {JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
  let pending = false;
  const language = () => {try{return localStorage.getItem('animeb-weekly-lang') === 'ja' ? 'ja' : 'en';}catch{return 'en';}};
  const find = (sel, scope=document) => scope.querySelector(sel);
  function change(el, japanese, part='text') {
    if (!el) return;
    const isJa = language() === 'ja';
    const read = () => part==='html' ? el.innerHTML : part==='lead' ? (el.firstChild?.nodeType===3 ? el.firstChild.nodeValue : '') : el.textContent;
    const write = s => {
      if (read() === s) return;
      if (part==='html') el.innerHTML = s;
      else if (part==='lead') {if(el.firstChild?.nodeType===3) el.firstChild.nodeValue=s;}
      else el.textContent = s;
    };
    const old = original.get(el), last = applied.get(el);
    if(isJa) {
      if (old === undefined || (read() !== last && read() !== japanese)) original.set(el, read());
      write(japanese); applied.set(el, japanese);
    } else if(old !== undefined) {
      if (read() === last) write(old);
      applied.delete(el);
    }
  }
  function plain(selector, japanese, part='text') { document.querySelectorAll(selector).forEach(el => change(el,japanese,part)); }
  function dynamic(el, trans) {
    if(!el)return;
    const old=original.get(el), last=applied.get(el), current=el.textContent;
    const src=(old!==undefined && current===last)?old:current;
    const next=trans(src);
    if(language()==='ja' && next && next!==src)change(el,next);
    else if(language()==='en' && old!==undefined)change(el,'');
  }
  function timestamp(raw){
    const s=String(raw||'').toUpperCase();
    const match=s.match(/(?:PUBLISHED\s+)?(?:(\d{1,2})\s+([A-Z]{3})\s+(\d{4})|([A-Z]{3})\s+(\d{1,2}),?\s+(\d{4}))/);
    if(!match)return '';
    const day=+(match[1]||match[5]),mon=months[match[2]||match[4]],year=+(match[3]||match[6]);
    return mon?`${year}年${mon}月${day}日`:'';
  }
  function seasonName(src){
    return String(src).replace(/\b(20\d{2})\s+(WINTER|SPRING|SUMMER|FALL)\b/gi,(_,y,s)=>`${y}年${seasons[s.toLowerCase()]}`)
      .replace(/\b(WINTER|SPRING|SUMMER|FALL)\b/gi,(_,s)=>seasons[s.toLowerCase()]);
  }
  function periodJP(src){
    let x=String(src);
    x=x.replace(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:UARY|RUARY|CH|IL|E|Y|UST|TEMBER|OBER|EMBER)?\b/gi,(v)=>months[v.slice(0,3).toUpperCase()]+'月');
    x=x.replace(/\bEPISODES?\s*/gi,'第').replace(/\bPRELIMINARY SELECTION\b/gi,'予選選考');
    return x;
  }
  const jpJourney = [
    '毎週、各話ごとに何十本ものアニメを追いかける。一つひとつの作品を作品単位で別々に捉えるのではなく、シーズン全体を一つのまとまりとして週単位で味わう—それは、まったく違う視聴体験なのです。',
    'それはまるで、鬱蒼と木々の茂った森の中の曲がりくねった道なき小道を、いつもの慣れ親しんだ道から少し外れて歩いていくようなもの。　全く同じ道や景色がないように、各週もまた回を重ねるごとに景色の見え方も変わっていくし、胸が躍る瞬間も、腹立たしい展開も、驚きも、思いがけない曲がり角も、その先に新しい見方を見せてくれたりもするのです。',
    '最終回を迎えるころには、その一つひとつの瞬間が旅の一部となり、シーズンを通して追いかけたからこそ味わえる楽しさを形づくっていくのだと思います。',
    'アニメの楽しみ方は一つではありません。でも、これもアニメを存分に楽しむとても贅沢な一つの方法だと、私には思えてならないのです。'
  ];
  const pair = [
    ['.anime09 .n-jump-nav a[href="#animeLatest"]','最新ランキング'],
    ['.anime09 .n-jump-nav a[data-anime-type="tier"]','ティアリスト'],
    ['.anime09 .n-jump-nav a[data-anime-type="recommendation"]','おすすめ'],
    ['.anime09 .n-jump-nav a[href="#animeRecent"]','最近の投稿'],
    ['.anime09 .n-jump-nav a[href="#animeMoment"]','ノート'],
    ['.anime09 .n-jump-nav a[href="#animeArticles"]:not([data-anime-type])','アーカイブ'],
    ['.anime09 .n-rail-journey',' — シーズンをアニメとともに辿る旅'],
    ['.anime09 .n-word-sub .n-mobile-subtitle','— シーズンをアニメとともに辿る旅'],
    ['.anime09 .n-season-name small','今シーズン'],
    ['.anime09 .n-season-chooser > span','2026シーズン'],
    ['.anime09 .n-season-sub .n-progress-intro','シーズンの進み具合'],
    ['.anime09 .n-season-progress .n-progress-intro','シーズン進行状況'],
    ['.anime09 .n-checkpoints > span:first-child','シーズンのチェックポイント'],
    ['.anime09 .n-checkpoints > small','• 今後の節目は目安として表示'],
    ['.anime09 .n-prev-header > span','前シーズンから'],
    ['.anime09 .n-prev-header > small','前シーズンを振り返る'],
    ['.anime09 .n-prev-links a:nth-child(1) > small','シーズンの最終評価'],
    ['.anime09 .n-prev-links a:nth-child(1) > b','2026年夏・最終ティアリスト'],
    ['.anime09 .n-prev-links a:nth-child(2) > small','おすすめ作品'],
    ['.anime09 .n-prev-links a:nth-child(2) > b','おすすめ作品と満足度ランキング'],
    ['.anime09 .n-latest .n-block-top h2','最新週間ランキング'],
    ['.anime09 .n-rank-issue > span','WEEK'],
    ['.anime09 .n-rank-quote','– 今週ランクインしたのは<br>どの作品？ –','html'],
    ['.anime09 .n-rank-detail h3','週間アニメ<br>トップ10','html'],
    ['.anime09 .n-contents .n-block-top h2','サイト案内'],
    ['.anime09 .n-contents .n-block-top > span','— コンテンツ —'],
    ['.anime09 .n-contents nav a:nth-child(1) b','週間ランキング'],
    ['.anime09 .n-contents nav a:nth-child(1) small','週ごとの評価でシーズンを追う。'],
    ['.anime09 .n-contents nav a:nth-child(2) b','ティアリスト'],
    ['.anime09 .n-contents nav a:nth-child(2) small','序盤・中盤・シーズン最終の評価。'],
    ['.anime09 .n-contents nav a:nth-child(3) b','おすすめ作品'],
    ['.anime09 .n-contents nav a:nth-child(3) small','中盤とシーズン終了時のおすすめ。'],
    ['.anime09 .n-contents nav a:nth-child(4) b','ノートと寄り道'],
    ['.anime09 .n-contents nav a:nth-child(4) small','気ままな雑記や、ちょっとした寄り道。'],
    ['.anime09 #animeRecent .n-block-top h2','最近の投稿'],
    ['.anime09 #animeRecent .n-block-top > span','新しい順'],
    ['.anime09 #animeMoment .n-block-top h2','ノート'],
    ['.anime09 #animeMoment .n-block-top > span','ちょっとした寄り道'],
    ['.anime09 #animeMoment .offbeat-coming-note','短いメモや、日々の小さな発見をここに掲載していきます。'],
    ['.anime09 .n-archive-heading small','これまでの投稿を探す'],
    ['.anime09 .n-archive-heading h2','最近の投稿・アーカイブ'],
    ['.anime09 .n-archive-heading > span','シーズンや投稿の種類から探せます。'],
    ['.anime09 .n-season-filters [data-season-filter="all"]','すべてのシーズン'],
    ['.anime09 .n-season-filters [data-season-filter="2026-fall"]','2026年秋'],
    ['.anime09 .n-season-filters [data-season-filter="2026-summer"]','2026年夏'],
    ['.anime09 .filters [data-filter="all"]','すべての投稿'],
    ['.anime09 .filters [data-filter="ranking"]','ランキング'],
    ['.anime09 .filters [data-filter="tier"]','ティアリスト'],
    ['.anime09 .filters [data-filter="recommendation"]','おすすめ'],
    ['.anime09 .n-legacy','以前のサイトを見る'],
    ['#animeSearchPane label','投稿を検索'],
  ];
  // Post Index can contain a JA intro; if it is blank, the published weekly
  // ranking JSON remains the authoritative source for that week's bilingual intro.
  const weekIntroRequests = new Map();
  const observedIntroRows = new WeakSet();
  const introWatch = ('IntersectionObserver' in window) ? new IntersectionObserver(items => {
    for(const item of items) if(item.isIntersecting){
      introWatch.unobserve(item.target);
      const a=item.target.querySelector('h3 a[href]');
      if(a)requestRankingIntro(a.href);
    }
  },{rootMargin:'420px 0px'}) : null;
  function cleanIntro(value){
    const raw=String(value||'');
    if(!raw.trim())return '';
    const doc=new DOMParser().parseFromString(raw.replace(/<br\s*\/?\s*>/gi,'\n'),'text/html');
    return (doc.body.textContent||'').replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'  ').trim();
  }
  function rankingIntroURL(href){
    try {
      const u=new URL(href,document.baseURI);
      if(u.origin!==location.origin)return null;
      const m=u.pathname.match(/\/ranking\/(20\d{2})\/(winter|spring|summer|fall)\/week(\d{2})\/index\.html$/i);
      if(!m)return null;
      const [,y,ss,w]=m;
      return new URL(`ranking/${y}/${ss}/week${w}/ranking-week${w}-${ss}${y}.json`,new URL('./',document.baseURI));
    } catch {return null;}
  }
  function requestRankingIntro(href){
    if(language()!=='ja')return;
    const key=String(href);
    if(weekIntroRequests.has(key))return;
    const url=rankingIntroURL(key);
    if(!url){weekIntroRequests.set(key,null);return;}
    weekIntroRequests.set(key,'loading');
    fetch(url,{cache:'force-cache'}).then(r=>r.ok?r.json():null).then(data=>{
      const ja=cleanIntro(data?.meta?.weekly_intro?.ja);
      if(ja && typeof posts!=='undefined'){
        const post=posts.find(p=>p.url===key);
        if(post)post.intro_ja=ja;
        schedule();
      }
      weekIntroRequests.set(key,ja||null);
    }).catch(()=>{weekIntroRequests.set(key,null);});
  }
  function bilingualArchiveIntros(){
    if(typeof posts==='undefined')return;
    for(const card of root.querySelectorAll('#animeArchive .n-archive-row')){
      const link=card.querySelector('h3 a[href]'),excerpt=card.querySelector('.n-intro-preview');
      if(!link||!excerpt)continue;
      const post=posts.find(p=>p.url===link.href);
      if(!post)continue;
      const ja=cleanIntro(post.intro_ja);
      if(ja)change(excerpt,ja);
      else if(language()==='ja'&&post.type==='ranking'){
        if(introWatch){if(!observedIntroRows.has(card)){observedIntroRows.add(card);introWatch.observe(card);}}
        else requestRankingIntro(link.href);
      }
      else if(language()==='en')change(excerpt,'');
    }
  }
  function apply() {
    const ja = language()==='ja';
    root.lang=ja?'ja':'en';
    for(const [selector,value,part] of pair) plain(selector,value,part);
    // Never overwrite or alter the original four approved English paragraphs.
    root.querySelectorAll('.n-journey-content p').forEach((p,i)=>{if(i<jpJourney.length)change(p,jpJourney[i],'html');});
    plain('.anime09 .n-word-sub','シーズン by シーズン ', 'lead');
    plain('.anime09 .n-prev-links .n-prev-go','見てみる ', 'lead');
    plain('.anime09 #animeTier .n-feature-item[href*="/tierlist/"][href*="/week01/"] .n-feature-kind','シーズン開幕 · WEEK 01');
    plain('.anime09 #animeTier .n-feature-item[href*="/tierlist/"][href*="/week01/"] strong','ファーストインプレッション — ティアリスト');
    plain('.anime09 #animeTier .n-feature-item[href*="/ranking/"][href*="/week00/"] .n-feature-kind','予選 · WEEK 00');
    plain('.anime09 #animeTier .n-feature-item[href*="/ranking/"][href*="/week00/"] strong','予選ランキング');
    // Journey is a real toggle controlled by pre-existing code: reflect its state after click.
    const jt=find('#nJourneyToggle'), journey=find('#nJourneyCopy');
    if(jt && journey)change(jt,journey.classList.contains('is-expanded')?'続きを読む内容を閉じる <span aria-hidden="true">⌃</span>':'旅の続きはこちら <span aria-hidden="true">⌄</span>','html');
    // Runtime-updated season values are computed rather than frozen at Week 04.
    const week=(find('.anime09 .n-weeks .n-now b')?.textContent || find('.anime09 .n-progress-count')?.textContent || '04').match(/\d+/)?.[0] || '04';
    const year=find('.anime09 .n-season-name h2 b')?.textContent || '2026';
    const seasonFromUrl=(window.OFFBEAT_LATEST_URL||'').match(/\/(winter|spring|summer|fall)\/week\d+/i)?.[1]?.toLowerCase();
    const enSeason=find('.anime09 .n-season-name h2 em')?.textContent.toLowerCase();
    const ss=seasonFromUrl||Object.keys(seasons).find(k=>k===enSeason||seasons[k]===enSeason)||'fall';
    dynamic(find('.anime09 .n-season-name h2 em'),s=>seasons[s.toLowerCase()] || seasons[ss]);
    root.querySelectorAll('.n-season-tabs > *').forEach(el=>{
      const value=el.textContent.trim().toLowerCase(); const key=Object.keys(seasons).find(s=>s===value||seasons[s]===value);
      if(key)change(el,seasons[key]);
    });
    const now=find('.anime09 .n-season-now-mark');
    if(now)change(now,` 現在 · 第${week}週`,'lead'); // actual pulse is a span: set first trailing text below
    if(now) {const txt=[...now.childNodes].find(x=>x.nodeType===3 && x.textContent.trim());if(txt){
      const state=now._obLocText||(now._obLocText={original:txt.textContent,jp:''});
      if(ja){if(txt.textContent!==state.jp)state.original=txt.textContent;state.jp=` 現在 · 第${week}週`;if(txt.textContent!==state.jp)txt.textContent=state.jp;}
      else if(txt.textContent===state.jp)txt.textContent=state.original;
    }}
    dynamic(find('.anime09 .n-season-sub-detail'),()=>`${year}年${seasons[ss]} · 全12週中 第${week}週`);
    dynamic(find('.anime09 .n-note-stage'),()=>`残り${Math.max(0,12-Number(week))}週`);
    // Week 00 / milestone tokens retain their compact form on narrow screens.
    plain('.anime09 .n-weeks .n-prelim > span','予選');
    const cp=find('.anime09 .n-checkpoints');
    if(cp){
      cp.querySelectorAll('a,span').forEach(el=>{
        const lead=el.firstChild?.nodeType===3?el.firstChild.textContent.trim():'';
        if(/^First Impressions$|^第一印象$|^ファーストインプレッション$/.test(lead))change(el,'ファーストインプレッション ','lead');
        if(/^Midseason$|^中間$|^ミッドシーズン$/.test(lead))change(el,'ミッドシーズン ','lead');
        if(/^Final$|^最終$|^ファイナル$/.test(lead))change(el,'ファイナル ','lead');
      });
    }
    dynamic(find('.anime09 .n-latest .n-block-top > span'),src=>{
      const n=(src.match(/WEEK\s*(\d+)/i)||[])[1]||week, t=timestamp(src);
      return (t||`${year}年${seasons[ss]}`)+` · 第${n}週`;
    });
    dynamic(find('.anime09 .n-rank-overline'),()=>`${year}年${seasons[ss]} / 週間ランキング`);
    dynamic(find('.anime09 .n-rank-period'),s=>periodJP(s).replace(/\b\/\b/g,' / '));
    dynamic(find('.anime09 .n-rank-open > span:first-child'),src=>`第${(src.match(/\d+/)||[])[0]||week}週を見る`);
    dynamic(find('.anime09 #animeTier .n-feature-label'),()=>`${year}年${seasons[ss]}・ほかの特集`);
    dynamic(find('.anime09 .n-prev-header em'),s=>seasonName(s));
    // The archive is populated asynchronously and can be rebuilt by filters.
    root.querySelectorAll('#animeRecentPosts .post-cat, #animeArchive .n-atype, #animeSearchResults small').forEach(el=>dynamic(el,s=>s.replace(/\bTIER LIST\b/gi,'ティアリスト').replace(/\bRANKING\b/gi,'ランキング').replace(/\bRECOMMENDATIONS\b/gi,'おすすめ').replace(/\bPICKS\b/gi,'おすすめ')));
    root.querySelectorAll('#animeArchive .n-aseason').forEach(el=>dynamic(el,seasonName));
    root.querySelectorAll('#animeArchive .n-published').forEach(el=>dynamic(el,s=>'公開：'+(timestamp(s)||s.replace(/^Published\s*/i,''))));
    root.querySelectorAll('#animeArchive .n-aperiod').forEach(el=>dynamic(el,periodJP));
    root.querySelectorAll('#animeArchive .n-archive-open > span:first-child').forEach(el=>change(el,'記事を見る'));
    root.querySelectorAll('#animeArchive .n-index-filters label').forEach(el=>{
      const n=el.firstChild;if(!n || n.nodeType!==3)return;
      const a=n.textContent;const to=/YEAR/.test(a)?'年　':'シーズン　';
      const saved=el._obLabelOriginal??a;if(el._obLabelOriginal===undefined)el._obLabelOriginal=saved;
      if(ja&&a!==to)n.textContent=to;
      if(!ja&&a!==saved)n.textContent=saved;
    });
    root.querySelectorAll('#offbeatArchiveYearFilter option, #offbeatArchiveSeasonFilter option').forEach(el=>{
      const value=el.value;
      const lbl=value==='all'?(el.parentElement.id==='offbeatArchiveYearFilter'?'すべての年':'すべてのシーズン'):seasons[value]||null;
      if(lbl)change(el,lbl);
    });
    root.querySelectorAll('#animeArchive .n-archive-row h3 a,#animeRecentPosts .post-name').forEach(el=>{
      dynamic(el,s=>seasonName(s).replace(/Weekly Anime(?: Final)? Ranking/gi,'週間アニメランキング').replace(/Preliminary Ranking/gi,'予選ランキング').replace(/\bWeek\s*0?(\d+)\b/gi,'第$1週'));
    });
    bilingualArchiveIntros();
    // Preserve editor-written titles; use only existing bilingual intros, never auto-translate.
    root.querySelectorAll('#animeRecentPosts .post-date').forEach(el=>dynamic(el,s=>timestamp(s)||s));
    const ph=find('#animeSearchInput');if(ph){
      if(ph._obOriginalPlaceholder===undefined)ph._obOriginalPlaceholder=ph.placeholder;
      ph.placeholder=ja?'作品名・シーズン・投稿の種類…':ph._obOriginalPlaceholder;
    }
    const empty=find('#animeArchive > .callout');if(empty)change(empty,'該当する公開記事はまだありません。');
    // The green nav is rewritten on every hash navigation: translate its displayed labels only.
    document.querySelectorAll('#greenNav .bar-links > a,#greenNav .bar-links > .current').forEach(el=>{
      const v=el.getAttribute('href')||''; const code=el.textContent.trim();
      const dict={RECENT:'最近の投稿',POSTS:'記事一覧',RANKING:'ランキング'};
      if(v==='#animeRecent'||code==='RECENT'||code==='最近の投稿')change(el,dict.RECENT);
      if(v==='#animeArticles'||code==='POSTS'||code==='記事一覧')change(el,dict.POSTS);
      if(v.includes('/ranking/')||code==='RANKING'||code==='ランキング')change(el,dict.RANKING);
    });
    const ntime=find('#nToday');if(ntime && ntime.dateTime){const dt=new Date(ntime.dateTime+'T12:00:00Z');if(!isNaN(dt)){
      const st=ntime._obOriginalDate??null;if(st===null)ntime._obOriginalDate=ntime.textContent;
      const txt=ja?new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(dt):new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(dt).toUpperCase();
      if(ntime.textContent!==txt)ntime.textContent=txt;
    }}
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply();});}
  // Week Peek's existing click handler sets the shared preference and stops bubbling.
  // Capture sees that exact control without needing to modify R11/R15 or Week Peek R5.
  document.addEventListener('click', e=>{
    const target=e.target instanceof Element && e.target.closest('.ob-week-peek-language button[data-peek-lang]');
    if(target){setTimeout(schedule,0);return;}
    if(e.target instanceof Element && e.target.closest('#nJourneyToggle'))setTimeout(schedule,0);
  },true);
  window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang')schedule();});
  window.addEventListener('pageshow',schedule);
  window.addEventListener('hashchange',schedule);
  // Watch only Anime Home (async published posts/week changes) and the short green nav.
  new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true});
  const nav=find('#greenNav');if(nav)new MutationObserver(schedule).observe(nav,{subtree:true,childList:true,characterData:true});
  // Japanese heading width correction only; keeps approved R5 grids/layout intact.
  const style=document.createElement('style');
  style.id='ob-anime-home-i18n-r1-css';
  style.textContent='@media(max-width:690px){#anime-top[lang=ja] .n-archive-heading h2{font-size:clamp(21px,5.6vw,25px);line-height:1.18}#anime-top[lang=ja] .n-jump-nav a{letter-spacing:0}}';
  document.head.append(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
