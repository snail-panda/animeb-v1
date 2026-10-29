// ========== バー描画ロジック ==========
function adjustScoreBars() {
  document.querySelectorAll('.bar').forEach(bar => {
    const scoreText = bar.querySelector('.wrp-score')?.textContent || '0';
    const score = parseFloat(scoreText);
    const main = bar.querySelector('.bar-main');
    const overflow = bar.querySelector('.bar-overflow');

    // === スコアタイプ判定 ===
    const isFinalWeek = score >= 40; // Final Week はスコアが40〜110

    // === スケーリング設定 ===
    const min = isFinalWeek ? 40 : 3;
    const max = isFinalWeek ? 100 : 10;
    const unit = max - min;

    const baseWidth = Math.min(score, max);
    const extraWidth = score > max ? score - max : 0;

    const percentMain = ((baseWidth - min) / unit) * 100;
    const percentOverflow = (extraWidth / unit) * 100;

    main.style.width = `${percentMain}%`;
    overflow.style.width = `${percentOverflow}%`;

     // === 共通：スコア表示のマージン調整 ===
    const wrpScore = bar.querySelector('.wrp-score');
    if (wrpScore) {
      let scoreForMargin = isFinalWeek ? score / 10 : score;

      if (scoreForMargin > 11.0) {
        wrpScore.style.marginLeft = '45px';
      } else if (scoreForMargin > 10.8) {
        wrpScore.style.marginLeft = '35px';
      } else if (scoreForMargin > 10.5) {
        wrpScore.style.marginLeft = '28px';
      } else if (scoreForMargin > 10.3) {
        wrpScore.style.marginLeft = '18px';
      } else if (scoreForMargin > 10.0) {
        wrpScore.style.marginLeft = '12px';
      } else {
        wrpScore.style.marginLeft = '6px';
      }
    }
  });
}

// 🔍 デバッグログを追加！
console.log("🔍 currentWeek:", window.currentWeek);
console.log("🔍 season:", window.season);
console.log("🔍 year:", window.year);

// ── 1. JSON ファイル名を動的に組み立て ──
const jsonPath = `ranking-${window.currentWeek}-${window.season}${window.year}.json`;



// AnimeB weekly series-information renderer; empty/zero/unavailable values are omitted.
function animebInfoValue(value) {
  if (value === undefined || value === null || value === false || value === 0) return '';
  const str = String(value).trim();
  return /^(?:0|false|n\/?a|none|null|undefined|tbd|not available|—|-)$/i.test(str) ? '' : str;
}
function animebInfoFirst(...values) {
  for (const v of values) { const text = animebInfoValue(v); if (text) return text; }
  return '';
}

// Weekly Intro only: render a small, safe set of editorial HTML tags from JSON.
// Leave all other JSON fields and rendering paths unchanged.
function animebRenderWeeklyIntro(target, raw) {
  if (!target) return;
  const allowed = new Set(['STRONG','B','EM','I','U','S','DEL','SMALL','BR']);
  const blocked = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','TEMPLATE']);
  const parsed = new DOMParser().parseFromString(String(raw ?? ''), 'text/html');
  function safeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE || blocked.has(node.tagName)) return null;
    const out = allowed.has(node.tagName) ? document.createElement(node.tagName.toLowerCase()) : document.createDocumentFragment();
    // No attributes are copied: prevents style, event-handler, URL and class injection.
    if (node.tagName !== 'BR') for (const child of node.childNodes) {
      const safe = safeNode(child);
      if (safe) out.appendChild(safe);
    }
    return out;
  }
  const fragment = document.createDocumentFragment();
  for (const node of parsed.body.childNodes) {
    const safe = safeNode(node);
    if (safe) fragment.appendChild(safe);
  }
  target.replaceChildren(fragment);
}
// The page-language selector is independent of individual review popups and the legacy Overview.
let animebWeeklyLang = 'en';
try { if (localStorage.getItem('animeb-weekly-lang') === 'ja') animebWeeklyLang = 'ja'; } catch (_) {}
const animebWeeklyGenreJA = {
  action:'アクション', adventure:'アドベンチャー', comedy:'コメディ', drama:'ドラマ',
  fantasy:'ファンタジー', romance:'ロマンス', mystery:'ミステリー', horror:'ホラー',
  historical:'歴史', supernatural:'超常現象', 'slice of life':'日常', 'sci-fi':'SF',
  'science fiction':'SF', sports:'スポーツ', music:'音楽', psychological:'心理',
  thriller:'スリラー', suspense:'サスペンス', school:'学園', ecchi:'お色気',
  mecha:'メカ', isekai:'異世界', 'martial arts':'格闘', 'boys love':'BL',
  'girls love':'GL', 'award winning':'受賞作', 'avant garde':'前衛', 'gourmet':'グルメ',
  'adult cast':'大人', 'childcare':'育児', 'medical':'医療', workplace:'お仕事'
};
const animebWeeklyBasedJA = {
  manga:'漫画', 'light novel':'ライトノベル', 'light novels':'ライトノベル',
  novel:'小説', novels:'小説', original:'オリジナル', webtoon:'ウェブトゥーン',
  game:'ゲーム', 'video game':'ゲーム', 'visual novel':'ビジュアルノベル',
  '4-koma manga':'4コマ漫画', '4-koma':'4コマ漫画', 'web manga':'ウェブ漫画',
  'web novel':'ウェブ小説', other:'その他', unknown:'不明'
};
function animebWeeklyTranslatedTag(raw, type='genre') {
  const value=String(raw || '').trim();
  if(animebWeeklyLang!=='ja') return value;
  const map=type==='based' ? animebWeeklyBasedJA : animebWeeklyGenreJA;
  return map[value.toLowerCase()] || value;
}
function animebWeeklyDate(raw) {
  const value=animebInfoValue(raw);
  if(animebWeeklyLang!=='ja') return value;
  return value.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,(_,m,d,y)=>`${y}年${Number(m)}月${Number(d)}日`).replace(/\s+to\s+/gi,' ～ ');
}
function animebFillWeeklyInfo(dl, entry) {
  dl.replaceChildren();
  const ja=animebWeeklyLang==='ja';
  const addPair=(enLabel,jaLabel,raw,options={})=>{
    const val=animebInfoValue(raw);
    if (!val) return;
    const dt=document.createElement('dt'); dt.textContent=ja?jaLabel:enLabel;
    const dd=document.createElement('dd');
    if(options.cast) {
      const grid=document.createElement('div'); grid.className='animeb-weekly-cast';
      // Regular ranking uses its existing CSS grid. Bottom More Info lives
      // outside .entry, so inline <span>s used to run together: render each
      // role/voice-actor pair as its own block there, without changing ranking.
      const inBottom=Boolean(dl.closest('.animeb-bottom-details'));
      val.replace(/<br\s*\/?>/gi,'\n').replace(/\\n/g,'\n')
        .split(/\r?\n/).map(x=>x.trim()).filter(Boolean).forEach(item=>{
          const person=document.createElement(inBottom?'div':'span');
          person.textContent=item;grid.appendChild(person);
        });
      dd.appendChild(grid);
    } else if(options.url) {
      for(const url of [...new Set(val.split('|').map(x=>x.trim()).filter(Boolean))]) {
        if(!/^https?:\/\/[^\s]+$/i.test(url)) continue;
        const link=document.createElement('a'); link.href=url; link.textContent=url;
        link.target='_blank'; link.rel='noopener noreferrer'; dd.append(link,document.createElement('br'));
      }
      if(!dd.querySelector('a')) return;
    } else dd.textContent=val;
    dl.append(dt,dd);
  };
  const localized=(key)=>animebInfoFirst(ja && entry[`${key}_ja`],entry[key]);
  addPair('Release Date','放送開始日',animebWeeklyDate(entry.release_date));
  addPair('Romanized Title','ローマ字タイトル',entry.romanized_title);
  const based=animebInfoFirst(entry.based_on,entry.base);
  addPair('Based On','原作媒体',animebWeeklyTranslatedTag(based,'based'));
  addPair('Production Studio','制作会社',localized('studios'));
  addPair('Director','監督',animebInfoFirst(ja&&entry.director_ja,entry.director,entry.creators));
  addPair('Series Composition','シリーズ構成',animebInfoFirst(ja&&entry.series_composition_ja,entry.series_composition,entry.seriesComposition));
  addPair('Original Creator / Publisher','原作者・出版社',animebInfoFirst(ja&&entry.original_creator_publisher_ja,!ja&&entry.original_creator_publisher_en,entry.original_creator_publisher));
  addPair('Episodes','総話数',entry.episode_count);
  addPair('This Season','今期の話数',entry.total_eps_this_season);
  addPair('Series Total Episodes','シリーズ総話数',entry.seasons_total_ep_cnt);
  addPair('Broadcast','放送情報',animebInfoFirst(ja&&entry.broadcast_ja,entry.broadcast,entry.broadcast_info));
  addPair('Streaming Services','配信サービス',animebInfoFirst(ja&&entry.streaming_services_ja,entry.streaming_services));
  addPair('Cast','キャスト',entry.cast,{cast:true});
  addPair('Opening Theme','オープニングテーマ',animebInfoFirst(entry.opening_theme,entry.op));
  addPair('Ending Theme','エンディングテーマ',animebInfoFirst(entry.ending_theme,entry.ed));
  addPair('Official Website','公式サイト',entry.official_website,{url:true});
  addPair('External Scores','外部評価',entry.external_scores);
}
// Labels for the score-details panel, applied when the panel is opened.
const animebWRPItemLabels = {
  base_score:['Base Score','素点'],base:['Base Score','素点'],
  animation:['Animation','アニメーション'],
  script:['Script','脚本'], direction:['Direction','演出'], charm:['Charm','魅力'],
  overall:['Overall','総合評価'], total:['Total','合計'],
  op:['Opening','オープニング'], ed:['Ending','エンディング'],
  acting:['Voice Acting','声優・演技'],
  'sound/music':['Sound / Music','音楽・音響'],
  'consistency/impact':['Consistency / Impact','一貫性・インパクト']
};
function animebSafeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, chr => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[chr]));
}
function animebWRPItemLabel(key) {
  const pair=animebWRPItemLabels[String(key).trim().toLowerCase()];
  return pair ? pair[animebWeeklyLang==='ja'?1:0] : titleCase(String(key).replace(/_/g,' '));
}
function animebWRPDetailHTML(data, final=false) {
  const heading=animebWeeklyLang==='ja'
    ? (final?'6要素ポイント内訳：':'WRP（週間ランキングポイント）内訳：')
    : (final?'Key elements breakdown:':'WRP (Weekly Ranking Point) Breakdown:');
  const rows=Object.entries(data||{}).filter(([,v]) => v!==undefined && v!==null && v!=='')
    .map(([key,val])=>`${animebSafeHTML(animebWRPItemLabel(key))}: ${animebSafeHTML(val)}`);
  return `${heading}<br>${rows.join('<br>')}`;
}
function animebWRPLegacyDetailHTML(text) {
  const parsed=String(text||'').split(',').map(part=>part.trim()).filter(Boolean).map(part=>{
    const match=part.match(/^([^:]+):\s*(.*)$/);
    return match ? `${animebSafeHTML(animebWRPItemLabel(match[1].trim().toLowerCase().replace(/\s+/g,'_')))}: ${animebSafeHTML(match[2])}` : animebSafeHTML(part);
  });
  return (animebWeeklyLang==='ja'?'WRP（週間ランキングポイント）内訳：':'WRP (Weekly Ranking Point) Breakdown:')+'<br>'+parsed.join('<br>');
}

function animebSetWeeklyLanguage(next) {
  animebWeeklyLang=next==='ja'?'ja':'en';
  try {localStorage.setItem('animeb-weekly-lang',animebWeeklyLang);} catch (_) {}
  animebApplyWeeklyLanguage();
  // Existing Overview remains a separate, optional HTML source; synchronize its initial/active language.
  if(typeof window.animebWeeklyReloadOverview==='function') window.animebWeeklyReloadOverview();
}
function animebEnsureWeeklyControls() {
  if(!document.querySelector('#animeb-weekly-language')) {
    const control=document.createElement('div');
    control.id='animeb-weekly-language'; control.className='animeb-weekly-language';
    control.setAttribute('role','group'); control.setAttribute('aria-label','Page language / 表示言語');
    [['en','EN'],['ja','日本語']].forEach(([code,label])=>{
      const b=document.createElement('button'); b.type='button'; b.dataset.weeklyLang=code;
      b.textContent=label; b.setAttribute('aria-label',code==='en'?'Show English':'日本語で表示');
      b.addEventListener('click',()=>animebSetWeeklyLanguage(code));control.appendChild(b);
    });
    (document.querySelector('.nav-bar') || document.body).after(control);
  }
}

/* AnimeB v4.34 — Image-theme library: thumbnail picker for repo backgrounds and local photos.
   Static GitHub Pages has no server upload: repository gallery is read-only from the public site.
   Local browser images are stored in IndexedDB; nothing is sent to GitHub. */
function animebInitWeeklyThemes(){
  if(document.querySelector('#animeb-theme-controls'))return;
  const STORE='animeb-weekly-theme-v1';
  const IMG='animeb-weekly-theme-image-v1';
  const SOURCE='animeb-weekly-theme-image-source-v1';
  const LOCAL_KEY='animeb-weekly-theme-local-key-v1';
  const SCOPE_KEY='animeb-weekly-image-scope-v1';
  const VIS_KEY='animeb-weekly-image-visibility-v1';
  const PHOTO_OPACITY_KEY='animeb-weekly-image-photo-opacity-v1';
  const WEEK_STYLE_KEY='animeb-weekly-week-number-style-v1';
  // v4.36: image framing / tone / reading-surface controls remain local to this browser.
  const ZOOM_KEY='animeb-weekly-image-zoom-v1';
  const POSX_KEY='animeb-weekly-image-posx-v1';
  const POSY_KEY='animeb-weekly-image-posy-v1';
  const INTRO_KEY='animeb-weekly-image-intro-opacity-v1';
  const TONE_KEY='animeb-weekly-image-tone-v1';
  const FIT_KEY='animeb-weekly-image-fit-v1';
  const COLORS_KEY='animeb-weekly-header-colors-v1'; // legacy: retained as an untouched recovery copy
  const HEADER_PROFILES_KEY='animeb-weekly-header-profiles-v2';
  // The new keys are independent: they do not rewrite the v1 image library/settings.
  const RANK_OPACITY_KEY='animeb-weekly-rank-opacity-v1';
  const STATUS_OPACITY_KEY='animeb-weekly-status-opacity-v1';
  const SEASON_SETTINGS_KEY='animeb-weekly-season-type-v1';
  const PRESETS_KEY='animeb-weekly-background-presets-v1';
  const MIGRATED='animeb-weekly-v434-legacy-gallery-migrated';
  const API='https://api.github.com/repos/snail-panda/animeb-v1/contents/images/backgrounds?ref=main';
  const scriptSrc=Array.from(document.scripts).find(s=>/\/assets\/js\/ranking\/weekly\/main\.js(?:[?#]|$)/.test(s.src))?.src;
  const base=new URL('../../../../images/backgrounds/',scriptSrc||new URL('/animeb-v1/assets/js/ranking/weekly/main.js',location.origin));
  let theme='original',url='',source='url',localId='',localObjectUrl=null;
  // Default image placement is confined to the area ABOVE the ranking table.
  let imageScope='header', imageVisibility=78, photoOpacity=100, weekStyle='auto';
  let imageZoom=100, imagePosX=50, imagePosY=40, introOpacity=84;
  let rankOpacity=96, statusOpacity=87;
  let seasonSettings={weight:'auto',style:'auto',size:100};
  let presets=[];
  let imageTone='light', fullFit='cover', imageNatural=null;
  let customColors={};
  let localThumbUrls=[],remoteItems=[],localItems=[];
  try {
    theme=localStorage.getItem(STORE)||'original';
    url=localStorage.getItem(IMG)||'';
    source=localStorage.getItem(SOURCE)||'url';
    localId=localStorage.getItem(LOCAL_KEY)||'';
    imageScope=localStorage.getItem(SCOPE_KEY)||'header';
    const savedPhotoOpacity=Number(localStorage.getItem(PHOTO_OPACITY_KEY));
    if(localStorage.getItem(PHOTO_OPACITY_KEY)!==null&&Number.isFinite(savedPhotoOpacity)) photoOpacity=Math.max(15,Math.min(100,savedPhotoOpacity));
    weekStyle=localStorage.getItem(WEEK_STYLE_KEY)||'auto';
    const savedVisibility=Number(localStorage.getItem(VIS_KEY));
    if(Number.isFinite(savedVisibility)&&savedVisibility>=25&&savedVisibility<=100)imageVisibility=savedVisibility;
    const clamped=(key,min,max,fallback)=>{const n=Number(localStorage.getItem(key));return localStorage.getItem(key)!==null&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
    imageZoom=clamped(ZOOM_KEY,60,320,100);
    imagePosX=clamped(POSX_KEY,-25,125,50);
    imagePosY=clamped(POSY_KEY,-50,250,40);
    introOpacity=clamped(INTRO_KEY,20,100,84);
    rankOpacity=clamped(RANK_OPACITY_KEY,20,100,96);
    statusOpacity=clamped(STATUS_OPACITY_KEY,20,100,87);
    const savedSeason=JSON.parse(localStorage.getItem(SEASON_SETTINGS_KEY)||'{}');
    if(savedSeason && typeof savedSeason==='object' && !Array.isArray(savedSeason)){
      seasonSettings.weight=['auto','normal','bold'].includes(savedSeason.weight)?savedSeason.weight:'auto';
      seasonSettings.style=['auto','filled','outline'].includes(savedSeason.style)?savedSeason.style:'auto';
      const n=Number(savedSeason.size);seasonSettings.size=Number.isFinite(n)?Math.max(80,Math.min(160,n)):100;
    }
    const savedPresets=JSON.parse(localStorage.getItem(PRESETS_KEY)||'[]');
    if(Array.isArray(savedPresets))presets=savedPresets.filter(p=>p&&typeof p==='object'&&p.id&&p.state).slice(0,30);
    imageTone=localStorage.getItem(TONE_KEY)||'light';
    fullFit=localStorage.getItem(FIT_KEY)||'cover';
    const savedColors=JSON.parse(localStorage.getItem(COLORS_KEY)||'{}');
    if(savedColors&&typeof savedColors==='object'&&!Array.isArray(savedColors))customColors=savedColors;
  }catch(_){}
  if(!['original','dark','image'].includes(theme))theme='original';
  if(!['url','local'].includes(source))source='url';
  if(!['header','hero','full'].includes(imageScope))imageScope='header';
  if(!['light','dark'].includes(imageTone))imageTone='light';
  if(!['auto','filled','outline'].includes(weekStyle))weekStyle='auto';
  if(!['cover','contain','tile'].includes(fullFit))fullFit='cover';
  // Theme-specific header settings. On the first v2 visit, migrate the old
  // shared overrides ONLY to the currently selected theme; never erase v1 keys.
  const blankProfile=()=>({customColors:{},seasonSettings:{weight:'auto',style:'auto',size:100},weekStyle:'auto'});
  const normalizeProfile=p=>{
    const blank=blankProfile();
    if(!p||typeof p!=='object'||Array.isArray(p))return blank;
    const rawColors=p.customColors;
    if(rawColors&&typeof rawColors==='object'&&!Array.isArray(rawColors)){
      for(const [k,v] of Object.entries(rawColors))if(/^#[0-9a-fA-F]{6}$/.test(v||''))blank.customColors[k]=v;
    }
    const settings=p.seasonSettings||{};
    blank.seasonSettings={weight:['auto','normal','bold'].includes(settings.weight)?settings.weight:'auto',
      style:['auto','filled','outline'].includes(settings.style)?settings.style:'auto',
      size:Number.isFinite(Number(settings.size))?Math.max(80,Math.min(160,Number(settings.size))):100};
    blank.weekStyle=['auto','filled','outline'].includes(p.weekStyle)?p.weekStyle:'auto';
    return blank;
  };
  let headerProfiles={original:blankProfile(),dark:blankProfile(),image:blankProfile()};
  let profileOwner=theme;
  try {
    const stored=JSON.parse(localStorage.getItem(HEADER_PROFILES_KEY)||'null');
    if(stored?.version===2 && stored.themes && typeof stored.themes==='object'){
      for(const id of ['original','dark','image'])headerProfiles[id]=normalizeProfile(stored.themes[id]);
    }else{
      headerProfiles[theme]=normalizeProfile({customColors,seasonSettings,weekStyle});
      localStorage.setItem(HEADER_PROFILES_KEY,JSON.stringify({version:2,themes:headerProfiles}));
    }
  }catch(_){headerProfiles[theme]=normalizeProfile({customColors,seasonSettings,weekStyle});}
  function saveHeaderProfile(){
    headerProfiles[profileOwner]=normalizeProfile({customColors,seasonSettings,weekStyle});
    try{localStorage.setItem(HEADER_PROFILES_KEY,JSON.stringify({version:2,themes:headerProfiles}));}catch(_){}
  }
  function activateHeaderProfile(id){
    if(profileOwner===id)return;
    saveHeaderProfile();
    profileOwner=id;
    const profile=normalizeProfile(headerProfiles[id]);
    customColors=profile.customColors;
    seasonSettings=profile.seasonSettings;
    weekStyle=profile.weekStyle;
  }
  // The initial UI and stylesheet must use this theme's own palette, not v1's global palette.
  const initialProfile=normalizeProfile(headerProfiles[theme]);
  customColors=initialProfile.customColors;seasonSettings=initialProfile.seasonSettings;weekStyle=initialProfile.weekStyle;
  const ctr=document.createElement('div');ctr.id='animeb-theme-controls';ctr.className='animeb-theme-controls';
  const btn=document.createElement('button');btn.type='button';btn.className='animeb-theme-button';
  btn.textContent='◐';btn.setAttribute('aria-label','Theme / テーマ切替');
  btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','animeb-theme-panel');
  const panel=document.createElement('div');panel.className='animeb-theme-panel';panel.id='animeb-theme-panel';panel.hidden=true;
  const panelHead=document.createElement('div');panelHead.className='animeb-theme-panel-head';
  const header=document.createElement('p');header.className='animeb-theme-panel-title';header.textContent='THEME / テーマ';
  const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.className='animeb-theme-close';
  closeBtn.setAttribute('aria-label','Close theme settings / テーマ設定を閉じる');
  const previewBtn=document.createElement('button');previewBtn.type='button';previewBtn.className='animeb-theme-preview-button';
  const previewSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  previewSvg.setAttribute('viewBox','0 0 24 24');previewSvg.setAttribute('width','15');previewSvg.setAttribute('height','15');
  previewSvg.setAttribute('fill','none');previewSvg.setAttribute('stroke','currentColor');
  previewSvg.setAttribute('stroke-width','1.8');previewSvg.setAttribute('stroke-linecap','round');
  previewSvg.setAttribute('stroke-linejoin','round');previewSvg.setAttribute('aria-hidden','true');
  const previewPath=document.createElementNS('http://www.w3.org/2000/svg','path');
  previewPath.setAttribute('d','M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3');
  previewSvg.append(previewPath);
  const previewText=document.createElement('span');previewText.textContent='Preview page / 画面で確認';
  previewBtn.append(previewSvg,previewText);
  panelHead.append(header,previewBtn,closeBtn);
  const choices=document.createElement('div');choices.className='animeb-theme-choices';
  const buttons={};
  [['original','Original'],['dark','Dark'],['image','Image']].forEach(([id,name])=>{
    const el=document.createElement('button');el.type='button';el.className='animeb-theme-choice';el.textContent=name;
    el.dataset.theme=id;el.addEventListener('click',()=>{apply(id,true);if(id==='image')loadGallery();});
    choices.append(el);buttons[id]=el;
  });
  // Independent editorial override; AUTO keeps the Converter/JSON presentation.
  const weekStylePanel=document.createElement('div');weekStylePanel.className='animeb-week-style-control';
  const weekStyleLabel=document.createElement('span');weekStyleLabel.textContent='WEEK NUMBER / 週番号のスタイル';
  const weekStyleGroup=document.createElement('div');weekStyleGroup.className='animeb-week-style-buttons';
  const weekStyleButtons={};
  for(const [key,label] of [['auto','Auto / JSON'],['filled','Filled / 塗り'],['outline','Outline / 輪郭']]){
    const b=document.createElement('button');b.type='button';b.className='animeb-week-style-choice';
    b.textContent=label;b.setAttribute('aria-pressed',String(key===weekStyle));
    b.addEventListener('click',()=>{weekStyle=key;saveHeaderProfile();apply(theme,false);});
    weekStyleGroup.append(b);weekStyleButtons[key]=b;
  }
  weekStylePanel.append(weekStyleLabel,weekStyleGroup);
  const field=document.createElement('div');field.className='animeb-theme-image-field';
  // Image extent and visibility, deliberately above the library so they are easy to find.
  const imageOptions=document.createElement('fieldset');imageOptions.className='animeb-bg-placement';
  const placementLegend=document.createElement('legend');placementLegend.textContent='IMAGE AREA / 背景の表示範囲';
  const scopeChoices=document.createElement('div');scopeChoices.className='animeb-bg-scope-choices';
  const scopeButtons={};
  [['header','Compact / 通常上部'],['hero','Hero / 広い上部'],['full','Full page / 全面']].forEach(([key,label])=>{
    const el=document.createElement('button');el.type='button';el.className='animeb-bg-scope-button';
    el.textContent=label;el.dataset.scope=key;
    el.addEventListener('click',()=>{
      imageScope=key;try{localStorage.setItem(SCOPE_KEY,key);}catch(_){}
      apply(theme,false);
    });
    scopeChoices.append(el);scopeButtons[key]=el;
  });
  const visibilityLabel=document.createElement('label');visibilityLabel.className='animeb-bg-visibility-label';
  visibilityLabel.textContent='IMAGE CLARITY / 明暗・色調';
  const visibilityValue=document.createElement('output');visibilityValue.className='animeb-bg-visibility-value';
  const visibilityRange=document.createElement('input');visibilityRange.className='animeb-bg-visibility-range';
  visibilityRange.type='range';visibilityRange.min='25';visibilityRange.max='100';visibilityRange.step='5';
  visibilityRange.value=String(imageVisibility);visibilityRange.setAttribute('aria-label','Background image visibility / 背景画像の見えやすさ');
  visibilityLabel.append(visibilityValue,visibilityRange);
  const opacityLabel=document.createElement('label');opacityLabel.className='animeb-bg-visibility-label';
  opacityLabel.textContent='IMAGE OPACITY / 画像そのものの不透明度';
  const opacityValue=document.createElement('output');opacityValue.className='animeb-bg-visibility-value';
  const opacityRange=document.createElement('input');opacityRange.className='animeb-bg-visibility-range';
  opacityRange.type='range';opacityRange.min='15';opacityRange.max='100';opacityRange.step='5';
  opacityRange.value=String(photoOpacity);opacityRange.setAttribute('aria-label','Photo opacity / 写真そのものの不透明度');
  opacityLabel.append(opacityValue,opacityRange);
  opacityRange.addEventListener('input',()=>{
    photoOpacity=Number(opacityRange.value);
    try{localStorage.setItem(PHOTO_OPACITY_KEY,String(photoOpacity));}catch(_){}
    apply(theme,false);
  });
  visibilityRange.addEventListener('input',()=>{
    imageVisibility=Number(visibilityRange.value);
    try{localStorage.setItem(VIS_KEY,String(imageVisibility));}catch(_){}
    apply(theme,false);
  });
  // Live framing preview: mirrors the same selected picture, tone, position and zoom.
  const previewStage=document.createElement('div');previewStage.className='animeb-bg-live-preview';
  previewStage.setAttribute('role','img');previewStage.setAttribute('aria-label','Live background crop preview / 背景のトリミングプレビュー');
  const previewHeader=document.createElement('div');previewHeader.className='animeb-bg-preview-header';
  const previewDescription=document.createElement('span');previewDescription.className='animeb-bg-preview-description';
  previewDescription.textContent='LIVE PREVIEW  ·  設定中のヘッダー色を反映';
  // The Image view renders the real page's photo and wash layers at one scale.
  // This avoids stretching/cropping the artwork to the studio's box dimensions.
  const previewScene=document.createElement('div');previewScene.className='animeb-bg-preview-scene';
  const previewPhoto=document.createElement('div');previewPhoto.className='animeb-bg-preview-photo-layer';
  const previewWash=document.createElement('div');previewWash.className='animeb-bg-preview-wash-layer';
  const previewBoundary=document.createElement('div');previewBoundary.className='animeb-bg-preview-boundary';
  previewBoundary.textContent='VIEWING STATUS ▾';
  previewScene.append(previewPhoto,previewWash,previewBoundary);
  previewStage.append(previewScene);
  // Keep live page headline duplicates out of document.querySelector() entirely.
  // The r6 emergency move fixed the first-selector bug; Shadow DOM makes it
  // impossible for future renderer selectors to mistake the preview for the page.
  const previewShadow=previewHeader.attachShadow({mode:'open'});
  const previewCanvas=document.createElement('div');
  previewCanvas.className='animeb-preview-geometry';
  previewCanvas.style.cssText='position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none;';
  previewShadow.append(previewCanvas);
  previewStage.append(previewHeader,previewDescription);
  const frame=document.createElement('div');frame.className='animeb-bg-frame';
  const mkRange=(name,min,max,step)=>{
    const row=document.createElement('label');row.className='animeb-bg-frame-label';
    const title=document.createElement('span');title.textContent=name;
    const value=document.createElement('output');value.className='animeb-bg-frame-number';
    const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;
    row.append(title,value,input);frame.append(row);
    return {input,value};
  };
  const zoomCtl=mkRange('ZOOM / 拡大・縮小',60,320,5);
  const posXCtl=mkRange('HORIZONTAL / 左右位置',-25,125,5);
  const posYCtl=mkRange('VERTICAL / 上下位置',-50,250,5);
  const introCtl=mkRange('THIS WEEK PANEL / 本文パネルの不透明度',20,100,5);
  const statusCtl=mkRange('VIEWING STATUS / 上部パネルの不透明度',20,100,5);
  const rankCtl=mkRange('RANKING CARDS / ランキング行の不透明度',20,100,5);
  const toneBox=document.createElement('fieldset');toneBox.className='animeb-bg-tone';
  const toneLabel=document.createElement('legend');toneLabel.textContent='IMAGE + COLOR / 背景との組み合わせ';
  const toneButtons={};const toneRow=document.createElement('div');toneRow.className='animeb-bg-tone-buttons';
  [['light','Light / 明るい'],['dark','Dark / 暗い']].forEach(([key,label])=>{
    const el=document.createElement('button');el.type='button';el.className='animeb-bg-tone-choice';el.textContent=label;
    el.addEventListener('click',()=>{imageTone=key;try{localStorage.setItem(TONE_KEY,key);}catch(_){}apply(theme,false);});
    toneButtons[key]=el;toneRow.append(el);
  });toneBox.append(toneLabel,toneRow);
  const fitRow=document.createElement('div');fitRow.className='animeb-bg-fit-row';
  const fitLabel=document.createElement('label');fitLabel.textContent='IMAGE FIT / 画像の表示方法';
  const fitSelect=document.createElement('select');fitSelect.className='animeb-bg-fit';
  [['cover','Fill screen / 画面に合わせる'],['contain','Entire image / 全体を収める'],['tile','Pattern / タイル状（模様向け）']].forEach(([key,label])=>{
    const opt=document.createElement('option');opt.value=key;opt.textContent=label;fitSelect.append(opt);
  });fitSelect.value=fullFit;fitRow.append(fitLabel,fitSelect);
  fitSelect.addEventListener('change',()=>{fullFit=fitSelect.value;try{localStorage.setItem(FIT_KEY,fullFit);}catch(_){}apply(theme,false);});
  const frameNote=document.createElement('p');frameNote.className='animeb-bg-frame-note';
  frameNote.textContent='スライダーで画像の切り抜き位置を調整できます。プレビューでパネルを一時的に隠せます。';
  // Optional per-device overrides: do not edit JSON or overwrite the source palette.
  const colorDetails=document.createElement('details');colorDetails.className='animeb-bg-color-options';
  const colorSummary=document.createElement('summary');colorSummary.textContent='HEADER TEXT COLORS / 見出し文字色（詳細）';
  const colorRows=document.createElement('div');colorRows.className='animeb-bg-color-grid';
  const colorDefs=[
    ['top','TOP 10 / トップ数','#414344'],
    ['week','WEEK + number / 週の共通色','#8e2222'],
    ['season','Season line / 下段の共通色','#587966'],
    ['sat','Satisfaction / 満足度','#4c524e'],
    ['weekLabel','WEEK label / WEEK文字','#8e2222'],
    ['weekNumber','Week number / 週番号','#8e2222'],
    ['duration','Dates / 日付','#a04343'],
    ['year','Year / 年号','#a67d23'],
    ['seasonName','Season name / 春夏秋冬','#c2572a'],
    ['anime','ANIME / アニメ表記','#999999'],
    ['ranking','RANKING / ランキング表記','#bb6c94'],
    ['epRange','Episode range / 話数範囲','#749277']
  ];
  const colorInputs={};
  for(const [key,label,defaultColor] of colorDefs){
    const row=document.createElement('label');row.className='animeb-bg-color-row';const name=document.createElement('span');name.textContent=label;
    const input=document.createElement('input');input.type='color';input.value=/^#[0-9a-fA-F]{6}$/.test(customColors[key])?customColors[key]:defaultColor;
    const auto=document.createElement('button');auto.type='button';auto.className='animeb-bg-color-auto';auto.textContent='Auto';
    auto.setAttribute('aria-label','Restore default color: '+label);
    const refreshAuto=()=>auto.setAttribute('aria-pressed',String(!(/^#[0-9a-fA-F]{6}$/.test(customColors[key]||''))));
    input.addEventListener('input',()=>{customColors[key]=input.value;saveColors();applyColors();refreshAuto();});
    auto.addEventListener('click',()=>{delete customColors[key];input.value=defaultColor;saveColors();applyColors();refreshAuto();});
    colorInputs[key]=input;row.append(name,input,auto);colorRows.append(row);refreshAuto();
  }
  const refreshAllColorAuto=()=>colorRows.querySelectorAll('.animeb-bg-color-row').forEach((row,index)=>{
    const key=colorDefs[index]?.[0],button=row.querySelector('.animeb-bg-color-auto');
    if(button)button.setAttribute('aria-pressed',String(!(/^#[0-9a-fA-F]{6}$/.test(customColors[key]||''))));
  });
  const colorActions=document.createElement('div');colorActions.className='animeb-bg-color-actions';
  const colorReset=document.createElement('button');colorReset.type='button';colorReset.textContent='Reset / 色の指定を解除';
  colorReset.addEventListener('click',()=>{customColors={};saveColors();applyColors();for(const [key,,defaultColor] of colorDefs)colorInputs[key].value=defaultColor;refreshAllColorAuto();});
  const colorLight=document.createElement('button');colorLight.type='button';colorLight.textContent='White text / 白系';
  colorLight.addEventListener('click',()=>{customColors={top:'#fffdf4',week:'#ffd6ca',season:'#f9ead1',sat:'#ffffff'};saveColors();applyColors();for(const [key,,fallback] of colorDefs)colorInputs[key].value=customColors[key]||fallback;refreshAllColorAuto();});
  colorActions.append(colorLight,colorReset);
  const colorNote=document.createElement('p');colorNote.textContent='Original / Dark / Image は別々に保存。Auto は各テーマの標準色（季節名は春夏秋冬の色）です。Reset は今のテーマだけに適用。';
  colorDetails.append(colorSummary,colorRows,colorActions,colorNote);
  // Season name typography: Auto respects the season's original CSS palette.
  const seasonBox=document.createElement('fieldset');seasonBox.className='animeb-season-studio';
  const seasonLegend=document.createElement('legend');seasonLegend.textContent='SEASON NAME / 季節名だけの装飾';
  seasonBox.append(seasonLegend);
  const seasonGroups={};
  const seasonButtonRow=(key,title,values)=>{
    const wrap=document.createElement('div');wrap.className='animeb-season-style-row';
    const label=document.createElement('span');label.textContent=title;wrap.append(label);
    const actions=document.createElement('div');actions.className='animeb-bg-tone-buttons';
    seasonGroups[key]={};
    for(const [value,text] of values){
      const button=document.createElement('button');button.type='button';button.className='animeb-season-choice';
      button.textContent=text;button.addEventListener('click',()=>{
        seasonSettings[key]=value;saveSeasonSettings();applyColors();refreshSeasonButtons();
      });
      actions.append(button);seasonGroups[key][value]=button;
    }
    wrap.append(actions);seasonBox.append(wrap);
  };
  seasonButtonRow('weight','WEIGHT / 太さ',[['auto','Auto'],['normal','Normal'],['bold','Bold']]);
  seasonButtonRow('style','FILL / 表現',[['auto','Auto'],['filled','Filled'],['outline','Outline']]);
  const seasonSizeRow=document.createElement('label');seasonSizeRow.className='animeb-season-size';
  const seasonSizeText=document.createElement('span');seasonSizeText.textContent='SIZE / 季節名のサイズ';
  const seasonSizeValue=document.createElement('output');
  const seasonSizeInput=document.createElement('input');seasonSizeInput.type='range';seasonSizeInput.min=80;seasonSizeInput.max=160;seasonSizeInput.step=5;
  seasonSizeRow.append(seasonSizeText,seasonSizeValue,seasonSizeInput);seasonBox.append(seasonSizeRow);
  const saveSeasonSettings=()=>saveHeaderProfile();
  function refreshSeasonButtons(){
    Object.entries(seasonGroups).forEach(([key,group])=>Object.entries(group).forEach(([value,b])=>b.setAttribute('aria-pressed',String(seasonSettings[key]===value))));
    seasonSizeInput.value=String(seasonSettings.size);seasonSizeValue.textContent=seasonSettings.size+'%';
  }
  seasonSizeInput.addEventListener('input',()=>{seasonSettings.size=Number(seasonSizeInput.value);saveSeasonSettings();applyColors();refreshSeasonButtons();});
  const seasonReset=document.createElement('button');seasonReset.type='button';seasonReset.className='animeb-season-choice';seasonReset.textContent='Reset season style / 季節名の装飾を元に戻す';
  seasonReset.addEventListener('click',()=>{seasonSettings={weight:'auto',style:'auto',size:100};saveSeasonSettings();applyColors();refreshSeasonButtons();});
  seasonBox.append(seasonReset);refreshSeasonButtons();
  const onRange=(ctl,key,get,set)=>{
    ctl.input.value=String(get());ctl.input.addEventListener('input',()=>{
      set(Number(ctl.input.value));try{localStorage.setItem(key,String(get()));}catch(_){}apply(theme,false);
    });
  };
  onRange(zoomCtl,ZOOM_KEY,()=>imageZoom,n=>imageZoom=n);
  onRange(posXCtl,POSX_KEY,()=>imagePosX,n=>imagePosX=n);
  onRange(posYCtl,POSY_KEY,()=>imagePosY,n=>imagePosY=n);
  onRange(introCtl,INTRO_KEY,()=>introOpacity,n=>introOpacity=n);
  onRange(statusCtl,STATUS_OPACITY_KEY,()=>statusOpacity,n=>statusOpacity=n);
  onRange(rankCtl,RANK_OPACITY_KEY,()=>rankOpacity,n=>rankOpacity=n);
  const scopeHint=document.createElement('p');scopeHint.className='animeb-bg-scope-note';
  scopeHint.textContent='Header area ends above the ranking table. / 上部のみ：ランキング表の直前まで。';
  imageOptions.append(placementLegend,scopeChoices,visibilityLabel,opacityLabel,scopeHint,frame,toneBox,fitRow,frameNote);
  // Presets live in the theme panel (outside the image-only field), so Original
  // and Dark appearances can be saved as well. Photos are referenced by gallery ID.
  const presetBox=document.createElement('fieldset');presetBox.className='animeb-bg-presets';
  const presetLegend=document.createElement('legend');presetLegend.textContent='MY PRESETS / 保存済み設定（最大30件）';
  const presetPick=document.createElement('select');presetPick.className='animeb-bg-presets-select';presetPick.setAttribute('aria-label','Saved background preset');
  const presetName=document.createElement('input');presetName.type='text';presetName.maxLength=50;presetName.placeholder='New name / 新しいプリセット名';
  const presetActions=document.createElement('div');presetActions.className='animeb-bg-presets-actions';
  const presetStatus=document.createElement('p');presetStatus.className='animeb-bg-presets-status';presetStatus.setAttribute('role','status');
  const presetButton=(title,handler)=>{const button=document.createElement('button');button.type='button';button.textContent=title;button.addEventListener('click',handler);presetActions.append(button);return button;};
  presetBox.append(presetLegend,presetPick,presetName,presetActions,presetStatus);
  const galleryTitle=document.createElement('div');galleryTitle.className='animeb-bg-gallery-head';
  const heading=document.createElement('strong');heading.textContent='BACKGROUND LIBRARY / 背景ギャラリー';
  const refresh=document.createElement('button');refresh.type='button';refresh.className='animeb-bg-refresh';refresh.textContent='↻ Refresh';
  galleryTitle.append(heading,refresh);
  const repoHeading=document.createElement('p');repoHeading.className='animeb-bg-subheading';repoHeading.textContent='Saved on AnimeB / サイトに保存済み';
  const remoteGrid=document.createElement('div');remoteGrid.className='animeb-bg-gallery';remoteGrid.setAttribute('aria-label','AnimeB background images');
  const repoStatus=document.createElement('p');repoStatus.className='animeb-bg-gallery-note';
  const localHeading=document.createElement('p');localHeading.className='animeb-bg-subheading';localHeading.textContent='On this device / この端末';
  const localGrid=document.createElement('div');localGrid.className='animeb-bg-gallery';localGrid.setAttribute('aria-label','Background images saved in this browser');
  const localStatus=document.createElement('p');localStatus.className='animeb-bg-gallery-note';
  const fileLabel=document.createElement('label');fileLabel.className='animeb-theme-file-label';
  fileLabel.textContent='＋ Add from photos / ファイルから追加';
  const fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='image/jpeg,image/png,image/webp,image/gif,image/avif';
  fileLabel.appendChild(fileInput);
  const fileNote=document.createElement('p');fileNote.className='animeb-theme-local-note';
  fileNote.textContent='Device images stay in this browser; they do not sync to other devices. / 端末の画像はこのブラウザにのみ保存され、他端末には同期しません。';
  const details=document.createElement('details');details.className='animeb-bg-manual-url';
  const summary=document.createElement('summary');summary.textContent='Advanced: direct image URL / URLを直接指定';
  const input=document.createElement('input');input.type='url';input.placeholder='https://…/image.webp';input.value=url;
  const set=document.createElement('button');set.type='button';set.className='animeb-theme-apply';set.textContent='Use URL / URLを設定';
  details.append(summary,input,set);
  const message=document.createElement('p');message.className='animeb-theme-message';message.setAttribute('role','status');
  field.append(imageOptions,galleryTitle,repoHeading,remoteGrid,repoStatus,localHeading,localGrid,localStatus,fileLabel,fileNote,details);
  // The stage and mode selector stay visible. Only the controls below scroll.
  // This avoids Safari's nested-position:sticky behavior and makes the preview
  // usable while adjusting the furthest sliders and the color picker.
  const panelPinned=document.createElement('div');panelPinned.className='animeb-theme-panel-pinned';
  const panelScroll=document.createElement('div');panelScroll.className='animeb-theme-panel-scroll';
  panelPinned.append(panelHead,choices,previewStage);
  panelScroll.append(weekStylePanel,colorDetails,seasonBox,presetBox,field,message);
  panel.append(panelPinned,panelScroll);ctr.append(btn,panel);
  const lang=document.querySelector('#animeb-weekly-language');
  // Append after the real page, so the preview's cloned .header/.sub-header
  // cannot hijack generic document.querySelector() calls in the weekly renderer.
  // Position is fixed by CSS; DOM order is for selector safety only.
  document.body.append(ctr);
  const validPath=v=>{
    if(!v||/[\\"'\n\r<>]/.test(v))return null;
    try{const p=new URL(v,location.href);return ['https:','http:'].includes(p.protocol)?p.href:null;}catch(_){return null;}
  };
  const safeName=n=>typeof n==='string'&&n.length<170&&/^[^/\\\\<>:;?*\x00-\x1f]+\.(?:jpe?g|png|webp|gif|avif)$/i.test(n)&&n!=='.'&&n!=='..';
  const repoUrl=name=>new URL(encodeURIComponent(name),base).href;
  const heroSpacer=document.createElement('div');heroSpacer.className='animeb-image-hero-spacer';heroSpacer.setAttribute('aria-hidden','true');
  // Insert as a sibling of the established heading. No cards, notes, ranking rows or JSON are altered.
  document.querySelector('.wrapper > .header')?.before(heroSpacer);
  const colorStyle=document.createElement('style');colorStyle.id='animeb-theme-custom-colors';document.head.append(colorStyle);
  const saveColors=()=>saveHeaderProfile();
  function applyColors(){
    const selectors={
      top:'.wrapper .header h1',
      week:'.wrapper .header .week-title, .wrapper .header .animeb-week-token',
      season:'.wrapper .sub-header, .wrapper .sub-header .season-title, .wrapper .sub-header .year, .wrapper .sub-header .title-ranking, .wrapper .sub-header .ep-range',
      sat:'.wrapper .animeb-weekly-satisfaction, .wrapper .animeb-weekly-satisfaction .animeb-sat-label-ja, .wrapper .animeb-weekly-satisfaction .animeb-sat-label-en, .wrapper .animeb-weekly-satisfaction .animeb-sat-denominator',
      weekLabel:'.wrapper .header .week-title .animeb-week-label',
      weekNumber:'.wrapper .header .week-title .animeb-week-token',
      duration:'.wrapper .header .duration',
      year:'.wrapper .sub-header .season-title .year',
      seasonName:'.wrapper .sub-header .season-title .season',
      anime:'.wrapper .sub-header .title-anime',
      ranking:'.wrapper .sub-header .title-ranking',
      epRange:'.wrapper .sub-header .ep-range'
    };
    // Group overrides apply FIRST, component-specific overrides SECOND.
    let rules='';
    const valid=color=>/^#[0-9a-fA-F]{6}$/.test(color||'');
    for(const [key] of colorDefs){
      if(!valid(customColors[key]))continue;
      rules+=`\nbody ${selectors[key].split(', ').join(', body ')}{color:${customColors[key]} !important;}`;
    }
    if(valid(customColors.week))rules+=`\nbody .wrapper .header .week-title{--animeb-week-accent:${customColors.week} !important;--animeb-week-label-color:${customColors.week} !important;}`;
    if(valid(customColors.weekLabel))rules+=`\nbody .wrapper .header .week-title .animeb-week-label{--animeb-week-label-color:${customColors.weekLabel}!important;color:${customColors.weekLabel}!important;}`;
    if(valid(customColors.weekNumber)){
      rules+=`\nbody .wrapper .header .week-title .animeb-week-token{--animeb-week-accent:${customColors.weekNumber}!important;}`;
      rules+=`\nbody[data-animeb-week-style="filled"] .wrapper .header .week-title .animeb-week-token,body[data-animeb-week-style="auto"] .wrapper .header .week-title .animeb-week-token:not(.animeb-outline){color:${customColors.weekNumber}!important;}`;
      rules+=`\nbody[data-animeb-week-style="outline"] .wrapper .header .week-title .animeb-week-token,body[data-animeb-week-style="auto"] .wrapper .header .week-title .animeb-week-token.animeb-outline{color:transparent!important;}`;
    }
    if(valid(customColors.seasonName))rules+=`\nbody{--animeb-season-paint:${customColors.seasonName}}`;
    else rules+='\nbody .wrapper .sub-header .season-title .season{--animeb-season-paint:var(--animeb-season-default)}';
    if(seasonSettings.weight!=='auto')rules+=`\nbody .wrapper .sub-header .season-title .season{font-weight:${seasonSettings.weight==='bold'?'800':'400'}!important;}`;
    if(seasonSettings.size!==100)rules+=`\nbody .wrapper .sub-header .season-title .season{font-size:${seasonSettings.size}%!important;}`;
    if(seasonSettings.size>115)rules+='\nbody .wrapper .sub-header{width:auto!important;max-width:100%!important;flex-wrap:wrap!important;row-gap:3px;}body .wrapper .sub-header .ep-range{margin-left:0;}';
    if(seasonSettings.style==='outline')rules+='\nbody .wrapper .sub-header .season-title .season{color:transparent!important;-webkit-text-stroke:1px var(--animeb-season-paint)!important;paint-order:stroke fill;}';
    else if(seasonSettings.style==='filled')rules+='\nbody .wrapper .sub-header .season-title .season{-webkit-text-stroke:0!important;}';
    colorStyle.textContent=rules;
    refreshPreviewHeader();
  }
  applyColors();
  function refreshPreviewHeader(){
    const wrapper=document.querySelector('.wrapper');
    if(!wrapper)return;
    const pageBox=wrapper.getBoundingClientRect();
    // A photo is composed above Viewing Status, NOT just around the headline.
    // Only the preview changes; the actual header/status/background are untouched.
    const imageMode=theme==='image';
    const full=imageScope==='full';
    const firstStatus=wrapper.querySelector('.watch-status-wrapper.ws-modern-wrapper')
      ||wrapper.querySelector('.watch-status-wrapper');
    const heading=wrapper.querySelector(':scope > .header');
    const statusEnd=firstStatus?.getBoundingClientRect().top;
    const fallbackEnd=(heading?.getBoundingClientRect().bottom ?? pageBox.top+190)+70;
    const sourceHeight=Math.max(125,Math.round((Number.isFinite(statusEnd)?statusEnd:fallbackEnd)-pageBox.top));
    const sourceWidth=full?Math.max(1,window.innerWidth):Math.max(1,pageBox.width);
    const stageWidth=Math.max(1,previewStage.clientWidth||330);
    // On a small phone preserve space for the sliders under the pinned preview.
    // If the header is unusually tall, FIT the whole view (never distort it).
    const heightLimit=Math.min(310,Math.max(155,window.innerHeight*.36));
    const scaleWidth=stageWidth/sourceWidth;
    const scale=imageMode?Math.min(scaleWidth,heightLimit/sourceHeight):scaleWidth;
    const drawnWidth=sourceWidth*scale,drawnHeight=sourceHeight*scale;
    const offsetX=Math.max(0,(stageWidth-drawnWidth)/2);
    if(imageMode){
      const targetHeight=Math.max(165,Math.ceil(drawnHeight+7));
      if(Math.abs((Number.parseFloat(previewStage.style.height)||0)-targetHeight)>.5)
        previewStage.style.height=targetHeight+'px';
    }else previewStage.style.removeProperty('height');
    previewCanvas.style.width=sourceWidth+'px';
    previewCanvas.style.transform=`translateX(${offsetX.toFixed(2)}px) scale(${scale.toFixed(5)})`;
    const leftBase=full?0:pageBox.left;
    const topBase=pageBox.top;

    // Use computed backgrounds from the live wrapper's two pseudo-layers. They
    // retain the REAL image zoom, focal point, transparency, mask and wash.
    // For Full Page, the photo is viewport-fixed, so show the first viewport
    // at the page's natural top (rather than pretending it follows content).
    previewScene.hidden=!imageMode;
    if(imageMode){
      const root=full?document.body:wrapper;
      const rootWidth=full?Math.max(1,window.innerWidth):sourceWidth;
      const rawHeight=full?Math.max(1,window.innerHeight):
        (Number.parseFloat(getComputedStyle(wrapper).getPropertyValue('--animeb-image-header-height'))||560);
      const pageTopAtStart=pageBox.top+window.scrollY;
      const layerTop=full?-pageTopAtStart:0;
      const paintLayer=(element,pseudo,z)=>{
        const st=getComputedStyle(root,pseudo);
        element.style.cssText=`position:absolute;z-index:${z};left:${offsetX.toFixed(2)}px;top:${(layerTop*scale).toFixed(2)}px;`+
          `width:${rootWidth}px;height:${rawHeight}px;transform-origin:0 0;transform:scale(${scale.toFixed(5)});pointer-events:none;`;
        for(const key of ['backgroundImage','backgroundColor','backgroundSize','backgroundPosition',
          'backgroundRepeat','opacity','maskImage','webkitMaskImage','maskSize','webkitMaskSize']){
          const value=st[key];if(value)element.style[key]=value;
        }
      };
      paintLayer(previewPhoto,'::before',0);
      paintLayer(previewWash,'::after',1);
      previewBoundary.hidden=!firstStatus;
      previewBoundary.style.top=Math.max(0,drawnHeight-1).toFixed(1)+'px';
      previewBoundary.style.left=offsetX.toFixed(1)+'px';
      previewBoundary.style.width=drawnWidth.toFixed(1)+'px';
    }
    const srcNodes=[wrapper.querySelector(':scope > .header'),wrapper.querySelector(':scope > .sub-header')].filter(Boolean);
    const satisfaction=wrapper.querySelector('.animeb-weekly-satisfaction');
    if(satisfaction&&!srcNodes.some(node=>node.contains(satisfaction)))srcNodes.push(satisfaction);
    const copyAppearance=(from,to)=>{
      if(from.nodeType!==1||to.nodeType!==1)return;
      const st=getComputedStyle(from);
      for(const prop of ['color','font-family','font-size','font-weight','font-style','line-height',
        'letter-spacing','word-spacing','text-align','white-space','vertical-align',
        '-webkit-text-stroke-width','-webkit-text-stroke-color','-webkit-text-fill-color',
        'text-shadow','opacity','display','box-sizing','flex','flex-direction','flex-wrap',
        'align-items','justify-content','gap','column-gap','row-gap','width','max-width','min-width',
        'margin','padding','transform','transform-origin','position','top','right','bottom','left']){
        const val=st.getPropertyValue(prop);if(val)to.style.setProperty(prop,val,'important');
      }
      const fromKids=[...from.children],toKids=[...to.children];
      for(let i=0;i<Math.min(fromKids.length,toKids.length);i++)copyAppearance(fromKids[i],toKids[i]);
    };
    const fragment=document.createDocumentFragment();
    for(const src of srcNodes){
      const rect=src.getBoundingClientRect();
      const clone=src.cloneNode(true);
      clone.removeAttribute('id');for(const el of clone.querySelectorAll('[id]'))el.removeAttribute('id');
      copyAppearance(src,clone);
      clone.style.setProperty('position','absolute','important');
      clone.style.setProperty('top',`${(rect.top-topBase).toFixed(2)}px`,'important');
      clone.style.setProperty('left',`${(rect.left-leftBase).toFixed(2)}px`,'important');
      clone.style.setProperty('width',`${rect.width.toFixed(2)}px`,'important');
      // Flex sub-headlines centre their children inside their measured height.
      // An absolutely positioned clone with auto height collapses to 0, pulling
      // the second row upward into TOP/WEEK. Preserve its live height in Image.
      if(imageMode&&src.matches('.sub-header'))
        clone.style.setProperty('height',`${rect.height.toFixed(2)}px`,'important');
      clone.style.setProperty('margin','0','important');
      fragment.append(clone);
    }
    previewCanvas.replaceChildren(fragment);
  }
  function updatePicturePreview(targetWidth,cameraHeight,sizing){
    const previewWidth=previewStage.clientWidth||330;
    const ratio=previewWidth/Math.max(1,targetWidth);
    if(imageNatural?.width&&imageNatural?.height&&sizing!=='cover'){
      const [w,h]=sizing.split(' ').map(v=>Number(v.replace('px','')));
      if(Number.isFinite(w)&&Number.isFinite(h)){
        previewStage.style.setProperty('--animeb-preview-size',`${(w*ratio).toFixed(1)}px ${(h*ratio).toFixed(1)}px`);
        const yOffset=(cameraHeight-h)*(imagePosY/100);
        previewStage.style.setProperty('--animeb-preview-y-px',`${(yOffset*ratio).toFixed(1)}px`);
      }
    }else{
      previewStage.style.setProperty('--animeb-preview-size','cover');
      previewStage.style.setProperty('--animeb-preview-y-px',imagePosY+'%');
    }
    previewStage.style.setProperty('--animeb-preview-repeat',fullFit==='tile'?'repeat':'no-repeat');
  }
  const pageHeader=document.querySelector('.wrapper > .header');
  const pageSubHeader=document.querySelector('.wrapper > .sub-header');
  if('MutationObserver' in window){
    const observer=new MutationObserver(refreshPreviewHeader);
    for(const el of [pageHeader,pageSubHeader])if(el)observer.observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
  }
  refreshPreviewHeader();
  function rememberNaturalSize(address){
    if(!address)return;
    const probe=new Image();probe.onload=()=>{
      if((source==='url'?url:localObjectUrl)!==address)return;
      imageNatural={width:probe.naturalWidth,height:probe.naturalHeight};scheduleHeroExtent();
    };probe.src=address;
  }
  function photo(value){
    if(value)document.body.style.setProperty('--animeb-theme-photo',`url("${value}")`);
    else document.body.style.removeProperty('--animeb-theme-photo');
  }
  function updateHeroExtent(){
    if(theme!=='image')return;
    const wrapper=document.querySelector('.wrapper');
    if(!wrapper)return;
    // Full Page is painted against the VIEWPORT. Do not read Overview height,
    // rank mount positions, or write header-height when it is selected.
    // Those values change during archived ShadowRoot stylesheet loading and
    // previously caused repeated WebKit layout/repaint churn on open/close.
    let height=0;
    if(imageScope!=='full'){
      const ranking=document.querySelector('.table-header-mount')||document.querySelector('.entry-list');
      const wrapperTop=wrapper.getBoundingClientRect().top;
      const bottom=ranking?ranking.getBoundingClientRect().top:wrapperTop+410;
      const openOverview=document.querySelector('#overview-container.expanded');
      const expandedOverviewHeight=openOverview?openOverview.getBoundingClientRect().height:0;
      height=Math.max(180,Math.round(bottom-wrapperTop-expandedOverviewHeight-8));
      wrapper.style.setProperty('--animeb-image-header-height',height+'px');
    }
    const viewportHeight=Math.max(1,window.innerHeight);
    const targetWidth=imageScope==='full'?window.innerWidth:Math.max(1,wrapper.getBoundingClientRect().width);
    // Image framing used to be recomputed from the variable header height.
    // No "THIS WEEK" made the hero short, changing BOTH image zoom and
    // background-position percentage; the featured face slid out of view.
    // Keep a common visual camera height for short archived weeks. When a
    // modern week already has a taller intro, retain its existing framing.
    const cameraFloor=window.innerWidth<=768
      ? Math.min(560,Math.max(500,Math.round(window.innerWidth*1.31)))
      : Math.min(780,Math.max(590,Math.round(window.innerWidth*.68)));
    const cameraHeight=imageScope==='full'?viewportHeight:Math.max(height,cameraFloor);
    const targetHeight=cameraHeight;
    let sizing='cover';
    if(imageNatural?.width&&imageNatural?.height){
      const ratio=fullFit==='tile'?Math.min(1,240/imageNatural.width):
        (fullFit==='contain'?Math.min(targetWidth/imageNatural.width,targetHeight/imageNatural.height):
        Math.max(targetWidth/imageNatural.width,targetHeight/imageNatural.height));
      const factor=ratio*(imageZoom/100);
      sizing=`${Math.round(imageNatural.width*factor)}px ${Math.round(imageNatural.height*factor)}px`;
    }
    document.body.style.setProperty('--animeb-image-size',sizing);
    updatePicturePreview(targetWidth,cameraHeight,sizing);
    if(imageScope==='header'||imageScope==='hero') {
      // A CSS percentage uses the *visible layer height*, so % is not a
      // stable crop for short vs long weeks. Anchor y to the shared camera.
      // x stays user-controlled and unchanged; Full Page retains its setting.
      const scaledHeight = imageNatural?.height && imageNatural?.width
        ? Number(sizing.split(' ')[1]?.replace('px','')) : null;
      const yOffset = scaledHeight!==null && Number.isFinite(scaledHeight)
        ? (cameraHeight-scaledHeight)*(imagePosY/100) : null;
      if(yOffset!==null)document.body.style.setProperty('--animeb-image-y-fixed',`${yOffset.toFixed(2)}px`);
      else document.body.style.removeProperty('--animeb-image-y-fixed');
    }else document.body.style.removeProperty('--animeb-image-y-fixed');
    if(!panel.hidden)refreshPreviewHeader();
  }
  let heroFrame=0;
  function scheduleHeroExtent(){
    cancelAnimationFrame(heroFrame);
    heroFrame=requestAnimationFrame(updateHeroExtent);
  }
  function apply(id,persist){
    if(id!==profileOwner){
      activateHeaderProfile(id);
      for(const [key,,fallback] of colorDefs)
        colorInputs[key].value=/^#[0-9a-fA-F]{6}$/.test(customColors[key]||'')?customColors[key]:fallback;
      refreshAllColorAuto();refreshSeasonButtons();
    }
    theme=id;document.body.dataset.animebTheme=id;
    applyColors();
    document.body.dataset.animebWeekStyle=weekStyle;
    Object.entries(weekStyleButtons).forEach(([key,b])=>b.setAttribute('aria-pressed',String(key===weekStyle)));
    document.body.dataset.animebImageScope=imageScope;
    document.body.dataset.animebImageTone=imageTone;
    document.body.dataset.animebFullFit=fullFit;
    heroSpacer.hidden=!(id==='image'&&imageScope==='hero');
    for(const [key,el] of Object.entries(toneButtons))el.setAttribute('aria-pressed',String(key===imageTone));
    fitRow.hidden=false;
    fitLabel.textContent=imageScope==='full'?'FULL PAGE FIT / 全面時の画像配置':'IMAGE FIT / 背景画像の収まり方';
    zoomCtl.value.textContent=imageZoom+'%';
    posXCtl.value.textContent=imagePosX+'%';posYCtl.value.textContent=imagePosY+'%';
    introCtl.value.textContent=introOpacity+'%';
    statusCtl.value.textContent=statusOpacity+'%';
    rankCtl.value.textContent=rankOpacity+'%';
    document.body.style.setProperty('--animeb-image-x',imagePosX+'%');
    document.body.style.setProperty('--animeb-image-y',imagePosY+'%');
    document.body.style.setProperty('--animeb-intro-opacity',(introOpacity/100).toFixed(2));
    document.body.style.setProperty('--animeb-status-opacity',(statusOpacity/100).toFixed(2));
    document.body.style.setProperty('--animeb-rank-opacity',(rankOpacity/100).toFixed(2));
    document.body.style.setProperty('--animeb-image-photo-opacity',(photoOpacity/100).toFixed(2));
    opacityValue.textContent=photoOpacity+'%';
    // A lighter overlay makes the selected illustration visible while
    // preserving enough contrast for the headline and reading panels.
    const wash=(0.10+((100-imageVisibility)/100)*0.68).toFixed(3);
    document.body.style.setProperty('--animeb-image-wash',wash);
    visibilityValue.textContent=imageVisibility+'%';
    Object.entries(scopeButtons).forEach(([key,element])=>element.setAttribute('aria-pressed',String(key===imageScope)));
    scopeHint.textContent=imageScope==='header'
      ?'Compact: original header height, image ends at the ranking. / 通常：現在のヘッダーサイズ。'
      :imageScope==='hero'
        ?'Hero: extra picture space before the weekly commentary. / 広い上部：今週のひと言より前に画像の余白を追加。'
        :'Full: image across the page; screen cover prevents tall stretching. / 全面：画面幅に合わせ、極端な縦伸びを防ぎます。';
    const activePhoto=source==='local'?localObjectUrl:validPath(url);
    photo(activePhoto);
    previewStage.style.setProperty('--animeb-preview-photo',activePhoto?`url("${activePhoto}")`:'none');
    previewStage.style.setProperty('--animeb-preview-visibility',String(imageVisibility/100));
    previewStage.style.setProperty('--animeb-preview-photo-opacity',String(photoOpacity/100));
    previewStage.style.setProperty('--animeb-preview-x',imagePosX+'%');
    previewStage.style.setProperty('--animeb-preview-y',imagePosY+'%');
    previewStage.style.setProperty('--animeb-preview-zoom',String(imageZoom/100));
    previewStage.dataset.tone=id==='dark'?'dark':id==='original'?'light':imageTone;
    previewStage.dataset.theme=id;
    previewStage.dataset.scope=imageScope;
    previewDescription.textContent=imageScope==='full'
      ? 'LIVE PREVIEW · FULL PAGE / 画面上部の構図'
      : imageScope==='hero'
        ? 'LIVE PREVIEW · HERO / 広い上部'
        : 'LIVE PREVIEW · COMPACT / 通常上部';
    refreshPreviewHeader();
    Object.entries(buttons).forEach(([key,element])=>element.setAttribute('aria-pressed',String(key===id)));
    field.hidden=id!=='image';
    if(persist)try{localStorage.setItem(STORE,id);}catch(_){}
    if(id!=='image')previewStage.style.removeProperty('--animeb-preview-photo');
    if(id==='image')scheduleHeroExtent();
    else updatePicturePreview(1,1,'cover');
    highlight();
  }
  function savePref(next){
    try{localStorage.setItem(SOURCE,next);localStorage.setItem(LOCAL_KEY,localId);if(next==='url')localStorage.setItem(IMG,url);}catch(_){}
  }
  function setLocalPreview(blob){
    if(localObjectUrl)URL.revokeObjectURL(localObjectUrl);
    localObjectUrl=URL.createObjectURL(blob);
    if(source==='local'){rememberNaturalSize(localObjectUrl);apply(theme,false);}
  }
  function database(){return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window))return reject(new Error('IndexedDB unavailable'));
    const req=indexedDB.open('animeb-weekly-backgrounds',2);
    req.onupgradeneeded=()=>{
      if(!req.result.objectStoreNames.contains('images'))req.result.createObjectStore('images');
      if(!req.result.objectStoreNames.contains('gallery'))req.result.createObjectStore('gallery',{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Database blocked'));
  });}
  async function withDB(store,mode,fn){
    const db=await database();
    try{return await new Promise((resolve,reject)=>{
      const tx=db.transaction(store,mode);let req;
      try{req=fn(tx.objectStore(store));}catch(err){reject(err);return;}
      if(req){req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}
      else tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });}finally{db.close();}
  }
  // The saved slots are snapshots, not live bindings to the sliders. A change to
  // the controls never modifies a preset until Update is pressed explicitly.
  function snapshot(){
    return {theme,url,source,localId,imageScope,imageVisibility,photoOpacity,
      weekStyle,imageZoom,imagePosX,imagePosY,introOpacity,statusOpacity,rankOpacity,
      imageTone,fullFit,customColors:{...customColors},seasonSettings:{...seasonSettings}};
  }
  function savePresetList(){
    try{localStorage.setItem(PRESETS_KEY,JSON.stringify(presets));return true;}
    catch(_){presetStatus.textContent='Storage full/unavailable — nothing saved. / 保存できませんでした。';return false;}
  }
  function renderPresets(chosen=''){
    presetPick.replaceChildren();
    const blank=document.createElement('option');blank.value='';blank.textContent='Select a preset / 保存設定を選択';presetPick.append(blank);
    presets.forEach(p=>{const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.name;presetPick.append(opt);});
    presetPick.value=chosen && presets.some(p=>p.id===chosen)?chosen:'';
  }
  function persistSnapshot(){
    try{
      for(const [key,val] of [[STORE,theme],[IMG,url],[SOURCE,source],[LOCAL_KEY,localId],
        [SCOPE_KEY,imageScope],[VIS_KEY,imageVisibility],[PHOTO_OPACITY_KEY,photoOpacity],
        [WEEK_STYLE_KEY,weekStyle],[ZOOM_KEY,imageZoom],[POSX_KEY,imagePosX],
        [POSY_KEY,imagePosY],[INTRO_KEY,introOpacity],[STATUS_OPACITY_KEY,statusOpacity],
        [RANK_OPACITY_KEY,rankOpacity],[TONE_KEY,imageTone],[FIT_KEY,fullFit]])localStorage.setItem(key,String(val));
      saveHeaderProfile();
    }catch(_){presetStatus.textContent='Loaded for this page, but browser storage is unavailable. / 保存領域にアクセスできません。';}
  }
  function syncControls(){
    visibilityRange.value=String(imageVisibility);opacityRange.value=String(photoOpacity);
    zoomCtl.input.value=String(imageZoom);posXCtl.input.value=String(imagePosX);posYCtl.input.value=String(imagePosY);
    introCtl.input.value=String(introOpacity);statusCtl.input.value=String(statusOpacity);rankCtl.input.value=String(rankOpacity);
    fitSelect.value=fullFit;input.value=url;
    for(const [key,,fallback] of colorDefs)colorInputs[key].value=/^#[0-9a-fA-F]{6}$/.test(customColors[key]||'')?customColors[key]:fallback;
    refreshSeasonButtons();applyColors();refreshAllColorAuto();
  }
  async function loadSnapshot(state){
    // Check the photo BEFORE changing settings; deleting it should never
    // accidentally switch the active appearance to a broken empty preset.
    let blob=null;
    if(state.source==='local'){
      const image=await withDB('gallery','readonly',os=>os.get(state.localId));
      if(!image?.blob)throw new Error('This preset references a device photo that was deleted. / 参照画像が削除されています。');
      blob=image.blob;
    }else if(state.theme==='image' && state.url){
      const address=validPath(state.url);if(!address)throw new Error('Stored image URL is invalid. / 保存URLが無効です。');
      await verifyImage(address);
    }
    saveHeaderProfile(); // Preserve the outgoing theme before loading a preset.
    theme=['original','dark','image'].includes(state.theme)?state.theme:'original';
    profileOwner=theme;
    url=typeof state.url==='string'?state.url:'';
    source=state.source==='local'?'local':'url';localId=typeof state.localId==='string'?state.localId:'';
    imageScope=['header','hero','full'].includes(state.imageScope)?state.imageScope:'header';
    imageVisibility=Math.max(25,Math.min(100,Number(state.imageVisibility)||78));
    photoOpacity=Math.max(15,Math.min(100,Number(state.photoOpacity)||100));
    weekStyle=['auto','filled','outline'].includes(state.weekStyle)?state.weekStyle:'auto';
    imageZoom=Math.max(60,Math.min(320,Number(state.imageZoom)||100));
    imagePosX=Math.max(-25,Math.min(125,Number(state.imagePosX ?? 50)));
    imagePosY=Math.max(-50,Math.min(250,Number(state.imagePosY ?? 40)));
    introOpacity=Math.max(20,Math.min(100,Number(state.introOpacity)||84));
    statusOpacity=Math.max(20,Math.min(100,Number(state.statusOpacity)||87));
    rankOpacity=Math.max(20,Math.min(100,Number(state.rankOpacity)||96));
    imageTone=['light','dark'].includes(state.imageTone)?state.imageTone:'light';
    fullFit=['cover','contain','tile'].includes(state.fullFit)?state.fullFit:'cover';
    customColors=state.customColors && typeof state.customColors==='object'?{...state.customColors}:{};
    seasonSettings={weight:['auto','normal','bold'].includes(state.seasonSettings?.weight)?state.seasonSettings.weight:'auto',
      style:['auto','filled','outline'].includes(state.seasonSettings?.style)?state.seasonSettings.style:'auto',
      size:Math.max(80,Math.min(160,Number(state.seasonSettings?.size)||100))};
    saveHeaderProfile(); // Only the target theme gets this preset's header styling.
    imageNatural=null;
    if(source==='local'&&blob)setLocalPreview(blob);
    else if(source==='url'){if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=null;}if(url)rememberNaturalSize(validPath(url));}
    syncControls();persistSnapshot();apply(theme,false);
    if(theme==='image')loadGallery();
  }
  const currentPreset=()=>presets.find(p=>p.id===presetPick.value);
  presetButton('Load / 呼び出す',async()=>{
    const p=currentPreset();if(!p){presetStatus.textContent='Select a preset. / 保存設定を選択してください。';return;}
    presetStatus.textContent='Loading… / 読み込み中…';
    try{await loadSnapshot(p.state);presetStatus.textContent='Loaded: '+p.name+' / 元の設定は変更されません。';}
    catch(e){presetStatus.textContent=e.message||'Could not load preset. / 読み込み失敗。';}
  });
  presetButton('Save NEW / 新規保存',()=>{
    if(source==='local'&&!localId){presetStatus.textContent='Save the device photo to the library first. / 先に端末画像をギャラリーに保存してください。';return;}
    const name=presetName.value.trim();if(!name){presetStatus.textContent='Enter a name. / 名前を入力してください。';return;}
    if(presets.length>=30){presetStatus.textContent='Maximum 30 presets. / 最大30件です。';return;}
    if(presets.some(p=>p.name.toLocaleLowerCase()===name.toLocaleLowerCase())){presetStatus.textContent='Name already in use. / 同名があります。';return;}
    const id='preset-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
    presets.push({id,name,state:snapshot()});
    if(savePresetList()){renderPresets(id);presetStatus.textContent='Saved: '+name+' / このブラウザに保存しました。';presetName.value='';}
    else presets.pop();
  });
  presetButton('Update / 上書き',()=>{
    if(source==='local'&&!localId){presetStatus.textContent='Save the device photo to the library first. / 先に端末画像をギャラリーに保存してください。';return;}
    const p=currentPreset();if(!p){presetStatus.textContent='Select a preset first. / 保存設定を選択してください。';return;}
    const before=p.state;p.state=snapshot();
    if(savePresetList())presetStatus.textContent='Updated: '+p.name+' / 手動で更新しました。';else p.state=before;
  });
  presetButton('Rename / 名前変更',()=>{
    const p=currentPreset();if(!p){presetStatus.textContent='Select a preset first. / 保存設定を選択してください。';return;}
    const name=presetName.value.trim();if(!name){presetStatus.textContent='Enter a new name. / 新しい名前を入力してください。';return;}
    if(presets.some(q=>q.id!==p.id && q.name.toLocaleLowerCase()===name.toLocaleLowerCase())){presetStatus.textContent='Name already in use. / 同名があります。';return;}
    const previous=p.name;p.name=name;
    if(savePresetList()){renderPresets(p.id);presetStatus.textContent='Renamed: '+name;presetName.value='';}
    else p.name=previous;
  });
  presetButton('Delete / 削除',()=>{
    const p=currentPreset();if(!p)return;
    if(!confirm('Delete this preset (not its image)? / この設定を削除しますか？\n'+p.name))return;
    const old=presets;presets=presets.filter(q=>q.id!==p.id);
    if(savePresetList()){renderPresets();presetStatus.textContent='Preset deleted (photo retained). / 設定のみ削除しました。';}
    else presets=old;
  });
  renderPresets();
  async function saveLocal(blob,name){
    const id='local-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
    await withDB('gallery','readwrite',os=>os.put({id,name,blob,created:Date.now()}));
    await withDB('images','readwrite',os=>os.put(blob,'background'));
    return id;
  }
  async function restoreLocal(){
    if(localId){const item=await withDB('gallery','readonly',os=>os.get(localId));if(item?.blob)return item.blob;}
    return withDB('images','readonly',os=>os.get('background'));
  }
  function verifyImage(address){return new Promise((resolve,reject)=>{
    const probe=new Image();const timer=setTimeout(()=>{probe.onload=probe.onerror=null;reject(new Error('timeout'));},12000);
    probe.onload=()=>{clearTimeout(timer);resolve()};probe.onerror=()=>{clearTimeout(timer);reject(new Error('not an image'))};probe.src=address;
  });}
  async function useRemote(item){
    message.textContent='Loading… / 画像を読み込み中…';
    try{await verifyImage(item.url);}catch(_){message.textContent='Could not open this image. / 画像を開けませんでした。';return;}
    url=item.url;source='url';localId='';input.value=url;
    rememberNaturalSize(item.url);
    savePref('url');apply('image',true);message.textContent=`Selected: ${item.name}`;
  }
  async function useLocal(item){
    if(!item?.blob)return;
    source='local';localId=item.id;setLocalPreview(item.blob);
    try{await withDB('images','readwrite',os=>os.put(item.blob,'background'))}catch(_){}
    savePref('local');apply('image',true);message.textContent=`Selected: ${item.name}`;
  }
  function highlight(){
    panel.querySelectorAll('.animeb-bg-item[data-source]').forEach(el=>{
      const active=el.dataset.source===source&&(source==='url'?el.dataset.identifier===url:el.dataset.identifier===localId);
      el.setAttribute('aria-pressed',String(active));
    });
  }
  function tile(item,where,kind){
    const box=document.createElement('div');box.className='animeb-bg-tile';
    const choose=document.createElement('button');choose.type='button';choose.className='animeb-bg-item';
    choose.dataset.source=kind;choose.dataset.identifier=kind==='url'?item.url:item.id;
    choose.setAttribute('aria-label',(kind==='url'?'Select AnimeB background: ':'Select device background: ')+item.name);
    const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=item.thumb;
    const label=document.createElement('span');label.className='animeb-bg-name';label.textContent=item.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
    const check=document.createElement('span');check.className='animeb-bg-selected';check.textContent='✓';check.setAttribute('aria-hidden','true');
    choose.append(img,label,check);choose.addEventListener('click',()=>kind==='url'?useRemote(item):useLocal(item));box.append(choose);
    if(kind==='local'){
      const del=document.createElement('button');del.type='button';del.className='animeb-bg-delete';del.textContent='×';
      del.setAttribute('aria-label','Remove saved image / 保存画像を削除: '+item.name);
      del.addEventListener('click',async()=>{
        try{await withDB('gallery','readwrite',os=>os.delete(item.id));
          if(item.id==='legacy-background')try{await withDB('images','readwrite',os=>os.delete('background'))}catch(_){}
          if(source==='local'&&localId===item.id){source='url';localId='';url='';savePref('url');apply('original',true);}
          message.textContent='Removed from this browser. / この端末の保存画像を削除しました。';await loadLocalGallery();
        }catch(_){message.textContent='Could not remove saved image. / 削除できませんでした。';}
      });box.append(del);
    }
    where.append(box);
  }
  function renderRemote(){remoteGrid.replaceChildren();for(const item of remoteItems)tile({...item,thumb:item.url},remoteGrid,'url');highlight();}
  async function loadRepoGallery(){
    repoStatus.textContent='Loading AnimeB gallery… / サイトの画像を検索中…';
    remoteItems=[];
    let raw=null,reason='';
    try{
      const response=await fetch(API,{cache:'no-store',headers:{'Accept':'application/vnd.github+json'}});
      if(response.ok){const v=await response.json();if(Array.isArray(v))raw=v.filter(x=>x.type==='file').map(x=>x.name);}
      else reason=`GitHub API: ${response.status}`;
    }catch(_){reason='GitHub API unavailable';}
    if(raw===null){
      try{
        const r=await fetch(new URL('gallery.json',base),{cache:'no-store'});
        if(r.ok){const data=await r.json();if(Array.isArray(data))raw=data.map(v=>typeof v==='string'?v:v?.filename);}
      }catch(_){}
    }
    remoteItems=(raw||[]).filter(safeName).slice(0,90).map(name=>({name,url:repoUrl(name)}));
    renderRemote();
    if(remoteItems.length)repoStatus.textContent=`${remoteItems.length} images — tap a thumbnail. / サムネイルをタップして選択。`;
    else if(raw!==null)repoStatus.textContent='No backgrounds saved yet. Add images to images/backgrounds/ and Push. / まだ画像がありません。画像を保存してPushしてください。';
    else repoStatus.textContent='Could not list GitHub images ('+reason+'). Add filenames to gallery.json if needed. / 自動取得できません。必要ならgallery.jsonに画像名を記載してください。';
  }
  async function loadLocalGallery(){
    for(const u of localThumbUrls)URL.revokeObjectURL(u);localThumbUrls=[];
    localGrid.replaceChildren();localItems=[];
    try{
      const all=await withDB('gallery','readonly',os=>os.getAll());
      localItems=all.filter(x=>x.blob).sort((a,b)=>b.created-a.created).slice(0,30);
      // v4.33 already saved a single image under 'background': preserve it for upgrades.
      let migrationDone=false;try{migrationDone=localStorage.getItem(MIGRATED)==='yes'}catch(_){}
      if(!localItems.length&&!migrationDone){
        const legacy=await withDB('images','readonly',os=>os.get('background'));
        if(legacy){const entry={id:'legacy-background',name:'Previously selected image / 以前の画像',blob:legacy,created:0};
          await withDB('gallery','readwrite',os=>os.put(entry));localItems=[entry];
        }
        try{localStorage.setItem(MIGRATED,'yes')}catch(_){}
      }
      for(const entry of localItems){const thumb=URL.createObjectURL(entry.blob);localThumbUrls.push(thumb);tile({...entry,thumb},localGrid,'local');}
      localStatus.textContent=localItems.length?'Tap to reuse; × removes a saved image. / 再選択はタップ、削除は×。':'No images saved on this device yet. / この端末には保存画像がありません。';
      highlight();
    }catch(_){localStatus.textContent='Browser storage is unavailable. / 端末の保存領域を利用できません。';}
  }
  let lastGalleryLoad=0;
  async function loadGallery(force=false){
    await loadLocalGallery();
    if(force||Date.now()-lastGalleryLoad>90000){lastGalleryLoad=Date.now();await loadRepoGallery();}
  }
  refresh.addEventListener('click',()=>loadGallery(true));
  fileInput.addEventListener('change',async()=>{
    const f=fileInput.files?.[0];if(!f)return;
    if(!/^image\/(?:jpe?g|png|webp|gif|avif)$/.test(f.type)||f.size>20*1024*1024){
      message.textContent='JPEG / PNG / WebP / GIF / AVIF only, up to 20 MB. / 対応画像20MB以下でお試しください。';fileInput.value='';return;}
    const testURL=URL.createObjectURL(f);
    try{await verifyImage(testURL);}catch(_){message.textContent='Image cannot be displayed in this browser. / この画像を表示できません。';URL.revokeObjectURL(testURL);fileInput.value='';return;}
    URL.revokeObjectURL(testURL);
    source='local';setLocalPreview(f);localId='';savePref('local');apply('image',true);
    try{localId=await saveLocal(f,f.name);savePref('local');message.textContent=f.name+' — Saved in this browser. / この端末のギャラリーに保存しました。';}
    catch(_){message.textContent=f.name+' — Shown now but not saved; storage may be full. / 表示中ですが保存できませんでした。';}
    await loadLocalGallery();fileInput.value='';
  });
  set.addEventListener('click',async()=>{
    const candidate=input.value.trim(),checked=validPath(candidate);
    if(!candidate||!checked){message.textContent='Enter a direct image URL. / 画像の直接URLを入力してください。';return;}
    try{await verifyImage(checked);}catch(_){message.textContent='Cannot load this image. A Reddit post URL is not a direct image. / この画像は読み込めません。Reddit投稿ページのURLは使用できません。';return;}
    await useRemote({url:checked,name:'Custom image / 指定URLの画像'});
  });
  function setPanelOpen(open){
    panel.hidden=!open;btn.setAttribute('aria-expanded',String(open));
    if(open){
      loadGallery();
      requestAnimationFrame(()=>{refreshPreviewHeader();scheduleHeroExtent();});
    }
  }
  previewBtn.addEventListener('click',()=>{setPanelOpen(false);btn.focus();});
  // Drag settings by the title bar when they cover the selected image.
  // Only the header is a drag handle; the settings remain independently scrollable.
  let drag=null;
  panelHead.addEventListener('pointerdown',event=>{
    if(event.target.closest('button')||event.button!==0)return;
    const rect=panel.getBoundingClientRect();
    drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
    panel.style.position='fixed';panel.style.left=rect.left+'px';panel.style.top=rect.top+'px';
    panel.style.right='auto';panel.style.margin='0';
    panelHead.setPointerCapture(event.pointerId);
  });
  panelHead.addEventListener('pointermove',event=>{
    if(!drag||drag.pointer!==event.pointerId)return;
    const width=panel.getBoundingClientRect().width;
    const height=panel.getBoundingClientRect().height;
    const maxX=Math.max(8,window.innerWidth-width-8);
    const maxY=Math.max(8,window.innerHeight-height-8);
    const x=Math.min(maxX,Math.max(8,drag.left+event.clientX-drag.x));
    const y=Math.min(maxY,Math.max(8,drag.top+event.clientY-drag.y));
    panel.style.left=x+'px';panel.style.top=y+'px';
  });
  for(const end of ['pointerup','pointercancel'])panelHead.addEventListener(end,()=>{drag=null;});
  btn.addEventListener('click',()=>setPanelOpen(panel.hidden));
  closeBtn.addEventListener('click',()=>{setPanelOpen(false);btn.focus();});
  document.addEventListener('pointerdown',e=>{if(!ctr.contains(e.target)&&!panel.hidden)setPanelOpen(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){setPanelOpen(false);btn.focus();}});
  // Listen for dynamic weekly content and image-scope changes, without
  // modifying the old ranking renderer or adding duplicate UI elements.
  window.addEventListener('resize',()=>{scheduleHeroExtent();refreshPreviewHeader();},{passive:true});
  if('ResizeObserver' in window){
    const stageObserver=new ResizeObserver(()=>{if(!panel.hidden)refreshPreviewHeader();});
    stageObserver.observe(previewStage);
  }
  window.addEventListener('load',scheduleHeroExtent);
  const wrapper=document.querySelector('.wrapper');
  if(wrapper && 'ResizeObserver' in window){
    const ro=new ResizeObserver(scheduleHeroExtent);
    for(const sel of ['.animeb-weekly-intro','.watch-status-wrapper','.table-header-mount']){
      const el=wrapper.querySelector(sel);if(el)ro.observe(el);
    }
    // Overview is not a camera input for Full Page. For Header/Hero, update
    // once on toggle instead of observing every async Shadow DOM resize.
    document.getElementById('overview-toggle-btn')?.addEventListener('click',()=>{
      if(imageScope!=='full')scheduleHeroExtent();
    });
  }
  apply(theme,false);
  if(source==='url'&&url)rememberNaturalSize(validPath(url));
  if(source==='local')restoreLocal().then(blob=>{
    if(blob)setLocalPreview(blob);
    else message.textContent='Saved image not found. Select an image again. / 保存画像が見つかりません。再選択してください。';
  }).catch(()=>{message.textContent='Browser storage not available. / 保存領域にアクセスできません。';});
}
animebInitWeeklyThemes();
// The legacy Note 1/2 HTML is retained as the authoritative English version.
// A Japanese counterpart is mounted only when required, without changing shared-index.html.
const animebNoteJaGeneral = `
  <div class="note animeb-note-jp"><p class="note-title"><strong>※注釈1：一般的な免責事項</strong></p>
  <p>このランキングは徹底して個人的・主観的なものでありながら、可能な限り客観性も大切にしています。制作者や作品を貶めたり、否定したりする意図は一切ありません。評価には長年の視聴を通して見直してきた独自の基準を用い、相対的・絶対的な観点の双方を踏まえています。アニメーション、脚本、構成、演出、テンポ、作品としての魅力や個性、そして一つの作品として得られた満足感などを重視しています。</p>
  <div class="detail-toggle"><u>続きを読む…</u> ▾</div>
  <div class="detail-content">
    <p class="note-continued">（続き）</p>
    <p>WRPでは各話をできるだけ一貫した基準で評価しようとしていますが、固定的・絶対的な尺度ではありません。したがって、各得点も絶対的な数値を意味するものではありません。</p>
    <p>毎週、放送作品の顔ぶれ、ジャンルの組み合わせ、作品への期待や強みが異なります。そのため、同じ数値でも週によって意味合いが違うことがあります。たとえば、ある週の9点と別の週の9点を必ずしも同じものとしては扱えません。</p>
    <p>このランキングでは、ジャンル、制作規模、作品固有の魅力やその週の状況も考慮し、相対的・絶対的な評価を組み合わせています。そして、そうした変化も週間ランキングの面白さの一つだと考えています。</p>
  </div></div>`;
const animebNoteJaNormal = `
  <div class="hairline"></div>
  <div class="note animeb-note-jp"><p class="note-title"><strong>※注釈2：WRP（週間ランキングポイント）とは？</strong></p>
  <p><strong>WRP</strong>は <em>Weekly Ranking Point</em> の略で、アニメ1話をその週に視聴して得た体験を、できる限り忠実に捉えるための独自の評価指標です。感情や好みだけに頼るのではなく、丁寧な観察と一貫した基準を土台に、個人の感性と客観的な視点を組み合わせています。</p>
  <p>作品全体を一度に評価するのではなく、1クール約12週間のうちの「その週の1話」に焦点を当てています。たとえ約23分の短い時間でも、かけがえのない視聴体験だからこそ、その瞬間を記録したいと考えています。</p>
  <div class="detail-toggle"><u>続きを読む…</u> ▾</div>
  <div class="detail-content"><p class="note-continued">（続き）</p>
   <p><strong>評価の構成：</strong> WRPは、毎週の視聴体験に大きく関わる6つの基本要素をもとにしています。</p>
   <ul><li><strong>素点</strong></li><li><strong>映像品質・アニメーション</strong></li><li><strong>脚本・物語構成</strong></li><li><strong>演出・テンポ・画面構成</strong></li><li><strong>魅力</strong>：登場人物、世界観、作風や物語ならではの持ち味が、どれほど発揮されているか。</li><li><strong>総合評価・完成度・満足感</strong>：1話としてのまとまり、楽しさ、充実感、作り込みを含む評価。</li></ul>
   <p>WRPはあくまで一つの採点方法ですが、アニメの1話1話をより注意深く、深く味わう手がかりとして作られました。ただ「見た」で終わらない23分にすること。そして、ときには作り手と思いを共有するような瞬間につなげることを目指しています。</p>
  </div></div><div class="hairline"></div>`;
const animebNoteJaFinal = `
  <div class="note animeb-note-jp"><p class="note-title"><strong>※注釈2：F.WRP（ファイナル・ウィークリー・ランキング・ポイント）について</strong></p>
  <p>FWRPは、1クールを通して積み重なった視聴体験を評価するための独自指標です。第1話から最終話までのWRPと、6つの重要な要素を別途採点したポイントを組み合わせています。</p>
  <p><strong>算出式：</strong></p>
  <p><code>総WRP（第1話〜最終話）÷ 話数 × 100 × Var(x) ＋ 6要素ポイント</code></p>
  <div class="detail-toggle"><strong>詳細：▾</strong></div>
  <div class="detail-content">
    <p><strong>Var(x)について</strong></p>
    <p>Var(x)は、WRPの累積点が属するスコア帯によって変わる係数です。作品間の点数分布に生じる偏りを調整し、順位の不均衡を抑える役割を持ちます。</p>
    <p><strong>6要素ポイントとその内訳</strong></p>
    <p>1クール全体を通して、作品の魅力と視聴体験に特に大きな影響を与える次の6点を評価します。</p>
    <ul><li><strong>オープニング：</strong>楽曲（最大1.0点）＋アニメーション（最大0.5点）</li>
    <li><strong>エンディング：</strong>楽曲（最大1.0点）＋アニメーション（最大0.5点）</li>
    <li><strong>声優・演技：</strong>最大0.5点</li><li><strong>音楽・音響：</strong>最大0.5点</li>
    <li><strong>一貫性・整合性・インパクト：</strong>最大1.0点</li><li><strong>総合的な調和・作品力：</strong>最大2.0点</li></ul>
    <p><strong>合計：最大7.0点</strong></p>
    <p><strong>なぜすべての項目の点数を公開しないのか？</strong></p>
    <p>この評価方法は個人の経験と長年の観察から生まれたものです。絶対的な尺度ではなく、作品のニュアンスや感情に訴える部分、視聴体験の豊かさを伝える参考指標です。数字だけですべてを判断しないために、一部の細かな採点や内部ロジックは公開していません。</p>
  </div></div>`;
function animebUpdateWeeklyNotes() {
  const mount=document.querySelector('.note-mount');
  if(!mount || !mount.children.length) return;
  let jaSection=mount.querySelector(':scope > .animeb-weekly-notes-ja');
  if(!jaSection) {
    const isFinal=!!mount.querySelector('.about-vax, .six-element-summary');
    jaSection=document.createElement('div');jaSection.className='animeb-weekly-notes-ja';
    jaSection.innerHTML=animebNoteJaGeneral + (isFinal?animebNoteJaFinal:animebNoteJaNormal);
    mount.appendChild(jaSection);
    jaSection.querySelectorAll('.detail-toggle').forEach(toggle=>{
      toggle.addEventListener('click',()=>toggle.nextElementSibling?.classList.toggle('open'));
    });
  }
  // Emphasize only the expanded English name in Note 2, not other italics.
  mount.querySelectorAll('.note em').forEach(term => {
    if (term.textContent.trim() === 'Weekly Ranking Point') {
      term.classList.add('animeb-note-wrp-term');
    }
  });
  const ja=animebWeeklyLang==='ja';
  [...mount.children].forEach(child=>{ child.hidden = child===jaSection ? !ja : ja; });
}

function animebApplyWeeklyLanguage() {
  const ja=animebWeeklyLang==='ja';
  document.body.dataset.animebLang=animebWeeklyLang;
  document.querySelectorAll('#animeb-weekly-language button').forEach(b=>{
    const selected=b.dataset.weeklyLang===animebWeeklyLang;
    b.classList.toggle('selected',selected); b.setAttribute('aria-pressed',String(selected));
  });
  const navTexts=ja
   ? [['.nav-link.left a','« 前の週'],['.nav-link.center a','ホーム'],['.nav-link.right a','次の週 »']]
   : [['.nav-link.left a','« Previous Week'],['.nav-link.center a','Back to Home'],['.nav-link.right a','Next Week »']];
  for(const [selector,label] of navTexts) {const node=document.querySelector(selector);if(node) node.textContent=label;}
  const statusTranslations={watching:['Watching','視聴中'],droppedThisWeek:['Dropped','今週の視聴中止'],droppedTotal:['Total dropped','視聴中止合計'],backOnList:['Back on List','復帰'],noAir:['NoAir','放送なし'],completed:['Completed','完走'],notAiredYet:['Not Aired Yet','未放送（開始前）'],startedAiringThisWeek:['Started This Week','今週放送開始'],total:['Total','合計']};
  document.querySelectorAll('.watch-status .ws-item[data-tooltip]').forEach(node=>{
    const key=node.dataset.tooltip; const count=node.dataset.statusValue;
    const label=statusTranslations[key]?.[ja?1:0];
    const target=node.querySelector('.view-count');
    if(label && count!==undefined && target) target.textContent=`${label}:${count}`;
  });
  document.querySelectorAll('.ws-modern [data-en][data-ja]').forEach(el=>{
    el.textContent=ja?el.dataset.ja:el.dataset.en;
  });
  const wsTitle=document.querySelector('.ws-title');
  if(wsTitle && wsTitle.firstChild && wsTitle.firstChild.nodeType===3) wsTitle.firstChild.textContent=ja?'視聴状況':'VIEWING STATUS';
  const header=document.querySelector('.table-header-mount .header-title');
  if(header) {
    const prefix=header.firstChild;
    if(prefix && prefix.nodeType===3) {
      const original=header.dataset.originalLeadingText || prefix.textContent;
      header.dataset.originalLeadingText=original;
      prefix.textContent=ja?original.replace(/^TITLE\s*\//i,'タイトル /').replace(/Bar Scale:/i,'バー目盛:'):original;
    }
  }
  document.querySelectorAll('.bar-label').forEach(label=>{
    const original=label.dataset.originalLabel || label.textContent;
    label.dataset.originalLabel=original;
    label.textContent=ja ? (original.startsWith('Final')?'最終WRP（6要素）*':'週間ランキングポイント*') : original;
  });
  animebUpdateWeeklyNotes();
  animebRefreshDropLanguage();
  if (typeof hideTooltip === 'function') hideTooltip();
  const headerScore=document.querySelector('.table-header-mount .header-totalscore');
  if(headerScore) {
    const trigger=headerScore.querySelector('.info-trigger');
    const original=headerScore.dataset.animebOriginalScoreLabel ||
      (trigger?.textContent.trim() || headerScore.firstChild?.textContent?.trim() || '');
    headerScore.dataset.animebOriginalScoreLabel=original;
    const label=ja ? (original==='Overall Rating'?'総合評価':'トータルスコア') : original;
    if(trigger && original!=='Overall Rating') {
      const text=Array.from(trigger.childNodes).find(x=>x.nodeType===3);
      if(text) text.textContent=label;
    } else if(headerScore.firstChild?.nodeType===3) headerScore.firstChild.textContent=label;
  }
  const intro=document.querySelector('.animeb-weekly-intro');
  if(intro) {
    const en=animebInfoValue(intro.dataset.en);
    const jp=animebInfoValue(intro.dataset.ja);
    const content=animebInfoFirst(ja && jp,en,jp);
    intro.hidden=!content;
    if(content) {
      intro.querySelector('.animeb-intro-label').textContent=ja?'今週のひと言':'THIS WEEK';
      animebRenderWeeklyIntro(intro.querySelector('.animeb-intro-text'),content);
    }
  }
  document.querySelectorAll('.animeb-bottom-details').forEach(details=>{
    const entry=details._animebBottomInfoEntry,dl=details.querySelector('dl');
    if(entry&&dl)animebFillWeeklyInfo(dl,entry);
  });
  document.querySelectorAll('.entry-list .entry').forEach(clone=>{
    const entry=clone._animebEntry;
    if(!entry) return;
    const primary=clone.querySelector('.info-top');
    const secondary=clone.querySelector('.jp-title');
    const primaryText=animebInfoFirst(ja&&entry.jpTitle,entry.title,entry.jpTitle);
    const secondaryText=animebInfoFirst(ja&&entry.title,entry.jpTitle);
    if(primary) primary.textContent=primaryText;
    if(secondary) {
      secondary.textContent=(secondaryText && secondaryText!==primaryText)?secondaryText:'';
      secondary.classList.toggle('animeb-title-duplicate',!secondary.textContent);
    }
    const headings=clone._animebEpisodeHeadings||{};
    const line=clone.querySelector('.ranking-episode-line');
    if(line) {
      line.replaceChildren();
      const order=ja?['ja','en']:['en','ja'];
      for(const key of order) {
        if(!headings[key]) continue;
        if(line.childNodes.length) {
          const divider=document.createElement('span');divider.className='ranking-episode-separator';divider.textContent='│';line.appendChild(divider);
        }
        const span=document.createElement('span');span.textContent=headings[key];line.appendChild(span);
      }
    }
    const genre=clone.querySelector('.genre-tags');
    if(genre) genre.querySelectorAll('.genre-tag').forEach((node,index)=>{
      const tags=Array.isArray(entry.genre)?entry.genre:String(entry.genre||'').split('|').map(x=>x.trim()).filter(Boolean);
      node.textContent=animebWeeklyTranslatedTag(tags[index]||'');
    });
    const synopsis=clone.querySelector('.synopsis');
    const preview=clone.querySelector('.animeb-synopsis-preview');
    const source=animebInfoFirst(ja&&entry.synopsis_ja,entry.synopsis,entry.synopsis_ja);
    if(synopsis) {
      synopsis.textContent=source;
      synopsis.classList.toggle('animeb-empty-synopsis',!source);
    }
    if(preview) { preview.textContent=source;preview.hidden=!source; }
    const dl=clone.querySelector('.more-info dl');
    if(dl) animebFillWeeklyInfo(dl,entry);
  });
}
// The green navigation remains unchanged structurally; its links are labelled here.
animebEnsureWeeklyControls();
animebApplyWeeklyLanguage();


// Optional per-article appearance. No presentation metadata => legacy output exactly as before.
function animebSatisfactionFace(value10) {
  const tier = Math.max(0,Math.min(4,Math.ceil(value10/2)-1));
  const mouths = [
    '<path d="M15 39Q25 27 35 39"/>',
    '<path d="M15 38Q25 31 35 38"/>',
    '<path d="M15 34H35"/>',
    '<path d="M15 33Q25 43 35 33"/>',
    '<path d="M13 31Q25 48 37 31"/>'
  ];
  return '<svg viewBox="0 0 50 50" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">'
    + '<circle cx="25" cy="25" r="22" fill="#ffd84e" stroke="#c99b23" stroke-width="2"/>'
    + '<circle cx="17" cy="20" r="2.4" fill="#444"/><circle cx="33" cy="20" r="2.4" fill="#444"/>'
    + '<g stroke="#55432c" stroke-width="2.6" fill="none" stroke-linecap="round">'+mouths[tier]+'</g></svg>';
}
function animebApplyWeeklyPresentation(meta) {
  const cfg = meta?.presentation;
  const header = cfg?.header;
  const title = document.querySelector('.header .week-title');
  if (title && header?.mode === 'enhanced' && meta.week) {
    const raw = String(meta.week).trim().toUpperCase();
    const tokenText = raw.replace(/^WEEK\s*/,'').trim();
    if (/^WEEK\s*/.test(raw) && /^(\d+|PRELIM|FINAL)$/.test(tokenText)) {
      const isSpecial = tokenText === 'PRELIM' || tokenText === 'FINAL';
      const num = /^\d+$/.test(tokenText) ? Number(tokenText) : null;
      const label = document.createElement('span'); label.className='animeb-week-label';label.textContent='WEEK';
      const token = document.createElement('span');token.className='animeb-week-token';
      token.textContent=num!==null && header.numberFormat!=='plain' ? String(num).padStart(2,'0') : tokenText;
      if(header.fill==='outline')token.classList.add('animeb-outline');
      title.replaceChildren(label,token);
      title.classList.add('animeb-week-enhanced');
      title.classList.toggle('animeb-special-token',isSpecial);
      const defaultColor = getComputedStyle(title).color;
      const colorMap={red:'#8E2222',teal:'#168d98'};
      const goodHex = value => typeof value==='string' && /^#[0-9a-fA-F]{6}$/.test(value);
      const accent = header.color==='custom'&&goodHex(header.customColor) ? header.customColor
        : colorMap[header.color] || defaultColor;
      title.style.setProperty('--animeb-week-accent',accent);
      const mode = header.specialColorMode === 'unified' ? 'unified' : 'split';
      const labelAccent = header.labelColor==='custom'&&goodHex(header.customLabelColor) ? header.customLabelColor
        : colorMap[header.labelColor] || (isSpecial && mode==='split' ? '#215973' : defaultColor);
      title.style.setProperty('--animeb-week-label-color',isSpecial&&mode==='unified' ? accent : labelAccent);
      const midPolicy = header.midSeasonLabel || 'auto';
      const showMid = !isSpecial && (midPolicy==='show' || (midPolicy==='auto'&&num===6));
      if(showMid) {
        title.classList.remove('normal');
        title.classList.add('mid'); // Mid-Season color for Week 6 by default, or chosen Week 5/7
        if(header.color==='auto')title.style.setProperty('--animeb-week-accent','#215973');
        if(header.labelColor==='auto')title.style.setProperty('--animeb-week-label-color','#215973');
        const place = ['inline','below','stacked'].includes(header.midSeasonPlacement)?header.midSeasonPlacement:'below';
        if(place==='below') {
          title.classList.add('animeb-mid-below');
          const sub=document.createElement('span');sub.className='animeb-mid-under';sub.textContent='MID-SEASON';title.appendChild(sub);
        } else if(place==='inline') {
          const sub=document.createElement('span');sub.className='animeb-mid-inline';sub.textContent='MID-SEASON';title.appendChild(sub);
        } else {
          const duration=document.querySelector('.header .duration');
          if(duration) {
            const stack=document.createElement('span');stack.className='animeb-mid-stack';
            const sub=document.createElement('span');sub.className='animeb-mid-stack-label';sub.textContent='MID-SEASON';
            duration.before(stack);stack.append(sub,duration);
          }
        }
      }
    }
  }
  const sat=cfg?.satisfaction;
  if(!sat || !Number.isInteger(sat.value10) || sat.value10<1 || sat.value10>10 || ![5,10].includes(sat.displayScale))return;
  const node=document.createElement('aside');
  node.className='animeb-weekly-satisfaction';
  node.setAttribute('aria-label','今週の満足度 / Weekly Satisfaction');
  const ja=document.createElement('span');ja.className='animeb-sat-label-ja';ja.textContent='今週の満足度';
  const en=document.createElement('span');en.className='animeb-sat-label-en';en.textContent='Weekly Satisfaction';
  const row=document.createElement('div');row.className='animeb-sat-main';
  const number=document.createElement('strong');number.className='animeb-sat-score';
  number.textContent=String(sat.displayScale===5 ? sat.value10/2 : sat.value10);
  const denominator=document.createElement('span');denominator.className='animeb-sat-denominator';
  denominator.textContent=' / '+sat.displayScale;
  number.appendChild(denominator);
  // Safe: the SVG comes from a fixed internal set of five expressions, not JSON markup.
  row.innerHTML=animebSatisfactionFace(sat.value10);
  row.appendChild(number);node.append(ja,en,row);
  // v4.27.1: Satisfaction belongs to the article header, independent of the intro.
  // This avoids narrow-screen text wrapping and works when weekly_intro is absent.
  const pageHeader=document.querySelector('.header');
  const subHeader=document.querySelector('.sub-header');
  if(!pageHeader) return;
  pageHeader.classList.add('animeb-has-satisfaction');
  pageHeader.appendChild(node);

  // A long PRELIM/FINAL/date header may fill the available width on small screens.
  // Preserve the headline instead of allowing an overlap: use a separate, right-aligned
  // row immediately after the subheader only when there is insufficient horizontal room.
  function placeSatisfaction() {
    if(!node.isConnected) return;
    if(node.parentElement!==pageHeader) pageHeader.appendChild(node);
    node.classList.remove('animeb-sat-inline-fallback');
    const headerRight=(pageHeader.querySelector('.animeb-mid-stack') ||
      pageHeader.querySelector('.duration') || pageHeader.querySelector('.week-title'))?.getBoundingClientRect().right;
    const satLeft=node.getBoundingClientRect().left;
    if(subHeader && Number.isFinite(headerRight) && headerRight + 10 > satLeft) {
      subHeader.after(node);
      node.classList.add('animeb-sat-inline-fallback');
    }
  }
  placeSatisfaction();
  window.addEventListener('resize',placeSatisfaction,{passive:true});
  if(document.fonts?.ready)document.fonts.ready.then(placeSatisfaction).catch(()=>{});
}

// v4.29 - Design A. The current season/week header, entries, and score columns are untouched.
function animebMountRankingCoverage(status, publishedCount, weekLabel) {
  const getCount = value => {
    if(value === undefined || value === null || String(value).trim() === '') return null;
    const n=Number(value);
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  };
  // v4.39: Render the modern panel for ALL historical weeks. Missing modern
  // counters remain missing: legacy watching/total are NOT Rated This Week or
  // Current Lineup, and must never be silently converted to either metric.
  const rated=getCount(status?.ratedThisWeek);
  const lineup=getCount(status?.currentLineup);
  const legacyWatching=getCount(status?.watching);
  const legacyTotal=getCount(status?.total);
  const completed=getCount(status?.completed);
  const isPrelim=/prelim/i.test(String(weekLabel||''));
  // Only explicitly present v2 counters trigger the new vocabulary. Archived
  // JSON from earlier seasons (and currently published old-format weeks) retain
  // their original meanings and display, with no fabricated values.
  const hasNewDropCounts=getCount(status?.droppedLastWeek)!==null ||
    getCount(status?.decidedToDropThisWeek)!==null;
  const hasNewPrelimCounts=isPrelim && (getCount(status?.eliminatedInPrelim)!==null ||
    getCount(status?.eliminatedTotal)!==null);
  // Fall 2026 Weeks 01-03 were published before the new JSON keys existed.
  // Their old droppedThisWeek counter already has the "last week's decision,
  // excluded this week" meaning. Update only its DISPLAY text, not its data.
  // Older seasons' counters keep their archival wording and definitions.
  const isFall2026LegacyDrop=!isPrelim && !hasNewDropCounts &&
    Number(window.year)===2026 && String(window.season||'').toLowerCase()==='fall' &&
    rated!==null && lineup!==null;
  // Final rankings summarize a completed season. A historical Watching field
  // (sometimes 0, sometimes another archival value) is NOT an active lineup.
  const isLegacyFinal=rated===null && lineup===null && /\bfinal\b/i.test(String(weekLabel||''));
  if(!Number.isSafeInteger(publishedCount) || publishedCount<=0) return;
  const legacy=document.querySelector('.watch-status');
  const wrapper=document.querySelector('.watch-status-wrapper');
  if(!legacy || !wrapper) return;
  const LANG=() => animebWeeklyLang === 'ja' ? 'ja' : 'en';
  const text=(en, ja, cls) => {
    const span=document.createElement('span');
    if(cls)span.className=cls;
    span.dataset.en=en;span.dataset.ja=ja;span.textContent=LANG()==='ja'?ja:en;
    return span;
  };
  const count=(n,cls) => {
    const el=document.createElement('strong');if(cls)el.className=cls;
    el.textContent=String(n);return el;
  };
  const modern=document.createElement('section');modern.className='ws-modern';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='ws-modern-toggle';
  toggle.setAttribute('aria-controls','animeb-weekly-coverage-detail');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label','View ranking coverage details');
  const mark=document.createElement('span');mark.className='ws-modern-crown';mark.setAttribute('aria-hidden','true');
  mark.innerHTML='<svg viewBox="0 0 32 27" role="presentation" focusable="false"><path d="M3.6 8.5 9.3 16l6.6-11.5L22.7 16l5.8-7.5-2.3 13.2H6L3.6 8.5Zm3.1 16.1h18.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><circle cx="3.6" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.9" cy="4.5" r="1.3" fill="currentColor"/><circle cx="28.5" cy="8.5" r="1.3" fill="currentColor"/></svg>';
  const hero=document.createElement('span');hero.className='ws-modern-main';
  const statement=document.createElement('strong');statement.className='ws-modern-headline';
  const rankingMain=document.createElement('span');rankingMain.className='ws-modern-ranked';rankingMain.textContent='TOP '+publishedCount;
  statement.append(rankingMain);
  if(rated!==null){
    const rankingBase=document.createElement('span');rankingBase.className='ws-modern-denominator';
    rankingBase.textContent=' / '+rated;statement.append(rankingBase);
  }
  hero.append(statement,text(rated!==null?'RATED THIS WEEK':'RANKED TITLES',
    rated!==null?'今週の評価作品':'ランキング掲載作品'));
  const divider=document.createElement('span');divider.className='ws-modern-separator';divider.setAttribute('aria-hidden','true');
  const line=document.createElement('span');line.className='ws-modern-lineup';
  // The old Watching count is shown under its OWN label, not as Current Lineup.
  const sideCount=lineup!==null?lineup:isLegacyFinal?completed:legacyWatching!==null?legacyWatching:legacyTotal;
  if(sideCount!==null){
    line.append(count(sideCount),text(lineup!==null?'CURRENT LINEUP':isLegacyFinal?'COMPLETED':legacyWatching!==null?'WATCHING':'TOTAL (LEGACY)',
      lineup!==null?'継続評価対象':isLegacyFinal?'完走作品':legacyWatching!==null?'視聴中（旧集計）':'合計（旧集計）'));
  }
  const chevron=document.createElement('span');chevron.className='ws-modern-chevron';chevron.setAttribute('aria-hidden','true');
  toggle.append(mark,hero);
  if(sideCount!==null)toggle.append(divider,line);
  toggle.append(chevron);modern.append(toggle);

  const detail=document.createElement('div');detail.id='animeb-weekly-coverage-detail';detail.className='ws-modern-details';detail.hidden=true;
  const seasonPool=getCount(status?.seasonPool);
  const initialPool=getCount(status?.initialSeasonPool);
  const metrics=document.createElement('div');metrics.className='ws-modern-metrics';
  const kpis=[
    { en:'Season Pool', ja:'シーズン候補総数', n:seasonPool, key:'pool' },
    { en:'Current Lineup', ja:'継続評価対象', n:lineup, key:'lineup' },
    { en:'Rated This Week', ja:'今週の評価作品', n:rated, key:'rated' },
    ...(isLegacyFinal ? [
      {en:'Completed',ja:'完走作品',n:completed,key:'archive-completed'},
      {en:'Dropped',ja:'視聴中止',n:getCount(status?.droppedTotal),key:'archive-dropped'},
      {en:'Recorded Total',ja:'旧記録の合計',n:legacyTotal,key:'archive-total'}
    ] : rated===null && lineup===null ? [
      ...(legacyWatching!==null?[{en:'Watching (legacy)',ja:'視聴中（旧集計）',n:legacyWatching,key:'legacy'}]:[]),
      ...(legacyTotal!==null?[{en:'Recorded Total',ja:'旧記録の合計',n:legacyTotal,key:'archive-total'}]:[])
    ] : [])
  ];
  for(const k of kpis){
    if(k.n===null)continue;
    const box=document.createElement('div');box.className='ws-modern-metric ws-modern-metric-'+k.key;
    box.append(count(k.n),text(k.en,k.ja));
    if(k.key==='pool' && initialPool!==null){
      const difference=k.n-initialPool;
      const sign=difference>0?'+':'';
      box.append(text(`Initial: ${initialPool}${difference ? `  (${sign}${difference})` : ''}`,`初期: ${initialPool}${difference ? `  (${sign}${difference})` : ''}`,'ws-modern-metric-note'));
    } else if(k.key==='rated' && lineup>0) {
      const ratio=(100*k.n/lineup).toFixed(1);
      box.append(text(`${ratio}% of lineup`,`対象の${ratio}%`,'ws-modern-metric-note'));
    } else if(k.key==='lineup') {
      box.append(text('Includes weekly breaks','今週の放送休止を含む','ws-modern-metric-note'));
    }
    metrics.append(box);
  }
  detail.append(metrics);

  const glossary={
    pool: ['Season Pool is the total number of selected titles, including later additions. It does not shrink when titles are dropped or completed.', 'シーズン候補総数は、途中追加を含む累計の選定作品数です。視聴中止や完結では減りません。'],
    lineup: ['Current Lineup counts titles targeted for evaluation this week, including titles on a one-week broadcast break. It excludes those not yet airing or previously removed.', '継続評価対象は今週の対象作品数です。今週だけの放送休止は含み、未放送開始や前週までに対象外となった作品は含みません。'],
    rated: ['Rated This Week counts titles scored for this week’s ranking. It is the denominator in TOP 10 / 27.', '今週の評価作品は、今週ランキング用に採点した作品数。TOP 10 / 27 の分母です。'],
    seasonHalted: ['No further episodes are planned for this season because broadcasting was halted, deferred or canceled. Ordinary completion is not included.', '今期の続きが中断・延期・中止され、今期中の続話放送がなくなった作品。通常の完結は含みません。'],
    dropped: ['This week’s exclusion count reflects decisions made in the previous week. Those titles are no longer in the current lineup.', '今週から対象外になった作品数。基本的に前週の判断が今週の対象数に反映されます。'],
    unrated: ['Titles dropped during this week without receiving a ranking score, whether watched or not. They leave next week’s lineup; this is not necessarily included in this week’s exclusion count.', '今週、ランキング評価を付けずに対象外と決めた作品数。視聴したかどうかは問いません。原則として翌週から対象外になります。'],
    back: ['This legacy count may combine a return after a broadcast break and the restoration of a previously dropped title.', '従来の混合集計です。放送休止からの復帰と、過去に対象外とした作品の再採用が含まれる場合があります。'],
    droppedLastWeek: ['Titles dropped based on decisions made last week. They are excluded from this week’s ranking lineup.', '前週にランキング対象から外すと決定し、今週から対象外になった作品数。今週の除外決定は含まれません。'],
    decidedToDropThisWeek: ['Titles decided for removal this week, whether viewed or scored or not. Their exclusion affects next week’s lineup. The unrated counter is separate and may be a subset.', '今週、次週からの対象外を決めた作品数。視聴・採点の有無は問いません。未評価での除外は別項目であり、この数の内数となる場合があります。'],
    droppedTotalNew: ['Cumulative exclusions through LAST week; decisions made this week are not included.', '先週までに対象外になった作品の累計。今週の除外決定は含みません。'],
    eliminatedInPrelim: ['Titles eliminated in the preliminary selection. These are not regular-season drops.', 'プレリム選考で本戦進出を逃した作品数。本戦の視聴中止には含めません。']
  };
  const helpButton=(en,ja,cls='ws-modern-info')=>{
    const btn=document.createElement('button');btn.type='button';btn.className=cls;
    btn.setAttribute('aria-label',LANG()==='ja' ? ja:en);
    btn.title=LANG()==='ja'?ja:en;btn.textContent='ⓘ';return btn;
  };
  const helpBar=document.createElement('div');helpBar.className='ws-modern-helpbar';
  const helpTrigger=helpButton('Explain these counts','数値の意味を説明');
  helpTrigger.classList.add('ws-modern-help-toggle');helpTrigger.setAttribute('aria-expanded','false');
  helpBar.append(text('How to read these figures','この数値について','ws-modern-help-caption'),helpTrigger);
  const helpContent=document.createElement('div');helpContent.className='ws-modern-glossary';helpContent.hidden=true;
  const modernGlossaryNames={rated:['Rated This Week','今週の評価作品'],lineup:['Current Lineup','継続評価対象'],pool:['Season Pool','シーズン候補総数'],dropped:isFall2026LegacyDrop?['Dropped Last Week','今週から評価対象外']:['Dropped This Week','今週からの対象外'],unrated:['Dropped (Unrated)','未評価での視聴中止'],seasonHalted:['Season Halted','シーズン中断'],back:['Back on List','復帰'],
    droppedLastWeek:['Dropped Last Week','今週から評価対象外'],
    decidedToDropThisWeek:['Decided to Drop This Week','今週の除外決定'],
    droppedTotalNew:['Dropped Total','先週までの除外累計'],
    eliminatedInPrelim:['Eliminated in Prelim','プレリム選考落ち']};
  const archiveGlossary={
    watching: [['Watching (legacy)','視聴中（旧記録）'],['The original Watching counter, recorded under the older system. It is not a modern Current Lineup.', '旧形式で記録したWatching。新しい「継続評価対象」とは同一視しません。']],
    total: [['Recorded Total','旧記録の合計'],['Historical total stored in this week’s JSON. It is not automatically the modern Season Pool.', '当時のJSONに記録された合計。新しいSeason Poolと同一とは限りません。']],
    completed: [['Completed','完走作品'],['Recorded completed count for the season. On the Final page this is the season result, not "previously completed this week".', '当時の完走作品数。Finalではシーズン最終結果であり、単なる前週までの完結数ではありません。']],
    droppedTotal: [['Total Dropped','視聴中止累計'],['Cumulative count of excluded titles recorded under the old system.', '旧形式で記録された視聴中止作品の累計です。']],
    noAir: [['No Episode This Week','今週放送なし'],['Recorded no-broadcast count for that week. It is not the number of shows ranked.', 'その週に放送がなかった作品の記録数。ランキング掲載数とは異なります。']],
    droppedThisWeek: [['Dropped This Week','今週の対象外'],['Historical weekly exclusion count. Its timing may differ from a drop decision made after this week’s viewing.', '旧週次集計の対象外作品数。今週視聴後に決めた来週からの除外とはタイミングが異なる場合があります。']],
    backOnList: [['Back on List','復帰'],glossary.back]
  };
  const isOldFormat=rated===null && lineup===null;
  const glossaryKeys=isOldFormat
    ? ['watching','completed','droppedTotal','total',...(!isLegacyFinal?['noAir','droppedThisWeek','backOnList']:[])]
    : hasNewPrelimCounts
      ? ['rated','lineup','pool','eliminatedInPrelim','seasonHalted','back']
      : hasNewDropCounts
        ? ['rated','lineup','pool','droppedLastWeek','decidedToDropThisWeek','droppedTotalNew','unrated','seasonHalted','back']
        : ['rated','lineup','pool','dropped','unrated','seasonHalted','back'];
  for(const key of glossaryKeys){
    if(isOldFormat && getCount(status?.[key])===null)continue;
    if(key==='eliminatedInPrelim' && getCount(status?.eliminatedInPrelim)===null)continue;
    const [name,definition]=isOldFormat?archiveGlossary[key]:[modernGlossaryNames[key],
      key==='droppedTotalNew'?glossary.droppedTotalNew:(key==='dropped' && isFall2026LegacyDrop?glossary.droppedLastWeek:glossary[key])];
    const p=document.createElement('p');p.className='ws-modern-glossary-entry';
    const b=document.createElement('b');b.append(text(...name));
    p.append(b,text(...definition));helpContent.append(p);
  }
  helpTrigger.addEventListener('click',()=>{
    helpContent.hidden=!helpContent.hidden;
    helpTrigger.setAttribute('aria-expanded',String(!helpContent.hidden));
  });
  detail.append(helpBar,helpContent);
  // A compact micro-note appears even when glossary is closed.
  const note=document.createElement('p');note.className='ws-modern-footnote';
  note.append(rated!==null && lineup!==null
    ? text('Ranking denominator = rated titles. Other counts can overlap and are not meant to add up.', 'ランキングの分母は評価作品数。ほかの項目は重複するため、足し引きで一致するとは限りません。')
    : isLegacyFinal
      ? text('Final season results from archived counters. The old Watching value does not represent a current lineup.',
        '最終週の記録に基づくシーズン結果です。旧Watchingは現在の視聴数として扱いません。')
      : text('Archived counters only; no new metrics have been inferred from Watching.',
        '旧記録にある数値のみを表示。Watchingから新しい指標は推定していません。'));
  detail.append(note);
  const descriptions={
    seasonHalted:glossary.seasonHalted,
    droppedThisWeekUnrated:glossary.unrated,
    droppedThisWeek:isFall2026LegacyDrop?glossary.droppedLastWeek:glossary.dropped,
    droppedLastWeek:glossary.droppedLastWeek,
    decidedToDropThisWeek:glossary.decidedToDropThisWeek,
    eliminatedInPrelim:glossary.eliminatedInPrelim,
    droppedTotal:hasNewDropCounts?glossary.droppedTotalNew:null,
    backOnList:glossary.back
  };
  const group=(headingEn, headingJa, rows) => {
    const existing=rows.filter(([key])=>getCount(status?.[key])!==null);
    if(!existing.length)return;
    const section=document.createElement('section');section.className='ws-modern-group';
    section.append(text(headingEn,headingJa,'ws-modern-group-title'));
    const grid=document.createElement('div');grid.className='ws-modern-grid';
    for(const [key,en,ja,icon] of existing){
      const row=document.createElement('div');row.className='ws-modern-row';
      const pict=document.createElement('span');pict.className='ws-modern-icon '+icon;pict.setAttribute('aria-hidden','true');
      if(icon==='ws-glyph-added')pict.textContent='+';
      if(icon==='ws-glyph-halted')pict.textContent='Ⅱ';
      if(icon==='ws-glyph-unrated')pict.textContent='×';
      const label=document.createElement('span');label.className='ws-modern-item-label';
      label.append(text(en,ja));
      if(descriptions[key]) {
        const hint=helpButton(...descriptions[key], 'ws-modern-item-info');
        hint.setAttribute('aria-expanded','false');
        hint.addEventListener('click',(event)=>{
          event.stopPropagation();
          // Tip lives AFTER the row, not INSIDE it. Find it in the correct place.
          const sibling=row.nextElementSibling;
          const alreadyOpen=Boolean(sibling?.classList.contains('ws-modern-inline-tip'));
          detail.querySelectorAll('.ws-modern-inline-tip').forEach(el=>el.remove());
          detail.querySelectorAll('.ws-modern-item-info[aria-expanded="true"]').forEach(el=>el.setAttribute('aria-expanded','false'));
          if(alreadyOpen)return; // same ⓘ toggles it off
          const p=document.createElement('div');p.className='ws-modern-inline-tip';
          p.dataset.en=descriptions[key][0];p.dataset.ja=descriptions[key][1];
          p.textContent=LANG()==='ja'?p.dataset.ja:p.dataset.en;
          row.after(p);hint.setAttribute('aria-expanded','true');
        });
        label.append(hint);
      }
      row.append(pict,label,count(getCount(status[key])));grid.append(row);
    }
    section.append(grid);detail.insertBefore(section,helpBar);
  };
  if(!isLegacyFinal) group('THIS WEEK · CHANGES','今週の変化',[
    ['startedAiringThisWeek','Started Airing','今週放送開始','icon-startedairing'],
    ['noAir','No Episode This Week','今週放送なし','icon-noair'],
    ['notAiredYet','Not Aired Yet','未放送（開始前）','icon-notairedyet'],
    ['addedThisWeek','Added to Pool','今週新規追加','ws-glyph-added'],
    ...(hasNewPrelimCounts ? [
      ['eliminatedInPrelim','Eliminated in Prelim','プレリム選考落ち','icon-drop']
    ] : hasNewDropCounts ? [
      ['droppedLastWeek','Dropped Last Week','今週から評価対象外','icon-drop'],
      ['decidedToDropThisWeek','Decided to Drop This Week','今週の除外決定','icon-trash']
    ] : [
      ['droppedThisWeek',isFall2026LegacyDrop?'Dropped Last Week':'Dropped This Week',isFall2026LegacyDrop?'今週から評価対象外':'今週の視聴中止','icon-drop']
    ]),
    ...(!hasNewPrelimCounts ? [['droppedThisWeekUnrated','Dropped (Unrated)','未評価で視聴中止','ws-glyph-unrated']] : []),
    ['seasonHalted','Season Halted','シーズン中断','ws-glyph-halted']
  ]);
  if(!isLegacyFinal) group('SEASON · HISTORY','シーズン・累計',[
    ['completed','Completed (recorded)','完走作品（旧記録）','icon-completed'],
    ...(hasNewPrelimCounts?[]:[
      ['droppedTotal',hasNewDropCounts?'Dropped Total':'Total Dropped',hasNewDropCounts?'先週までの除外累計':'視聴中止累計','icon-trash']
    ]),
    ['backOnList','Back on List','復帰（混合集計）','icon-back']
  ]);
  modern.append(detail);
  function clearInlineTips(){
    detail.querySelectorAll('.ws-modern-inline-tip').forEach(el=>el.remove());
    detail.querySelectorAll('.ws-modern-item-info[aria-expanded="true"]').forEach(el=>el.setAttribute('aria-expanded','false'));
  }
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest('.ws-modern-item-info, .ws-modern-inline-tip'))clearInlineTips();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')clearInlineTips();});
  toggle.addEventListener('click',()=>{
    const open=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded',String(!open));detail.hidden=open;
    if(open)clearInlineTips();
    modern.classList.toggle('ws-modern-open',!open);
  });
  legacy.replaceWith(modern);wrapper.classList.add('ws-modern-wrapper');
  const intro=document.querySelector('.animeb-weekly-intro:not([hidden])');
  if(intro)intro.before(wrapper);
  else document.querySelector('.sub-header')?.after(wrapper);
}

// AnimeB v4.38.2 — One full-screen key-visual viewer for all weekly ranked
// titles, including DROPPED posters, and for the Dropped Titles list.
// We display the source <img> in a separate layer: the source rank/episode
// badges and its DROPPED X/sticker are never detached or mutated.
function animebSetupKeyVisualViewer(){
  if(document.getElementById('animeb-kv-lightbox'))return;

  const sources=document.querySelectorAll('.entry-list .kv-thumb, .animeb-dropped-list .animeb-drop-poster');
  if(!sources.length)return;
  sources.forEach(thumb=>{
    const photo=thumb.querySelector(':scope > img');
    if(!photo || !photo.getAttribute('src'))return;
    const entry=thumb.closest('.entry');
    const dropCard=thumb.closest('.animeb-dropped-card');
    const title=(entry?.querySelector('.info-top')?.textContent || dropCard?.querySelector('.animeb-dropped-name')?.textContent || photo.alt || '').trim();
    thumb.classList.add('animeb-kv-view-trigger');
    thumb.setAttribute('role','button');
    thumb.setAttribute('tabindex','0');
    thumb.setAttribute('aria-label',`View large key visual: ${title || 'anime'} / キービジュアルを拡大`);
  });

  const viewer=document.createElement('div');
  viewer.id='animeb-kv-lightbox';
  viewer.className='animeb-kv-lightbox';
  viewer.hidden=true;
  viewer.innerHTML=`
    <div class="animeb-kv-lightbox-backdrop" data-kv-close="1"></div>
    <section class="animeb-kv-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Key visual / キービジュアル">
      <button class="animeb-kv-lightbox-close" type="button" data-kv-close="1" aria-label="Close image / 画像を閉じる">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
      </button>
      <figure class="animeb-kv-lightbox-figure">
        <img class="animeb-kv-lightbox-photo" alt="" data-kv-close="1">
        <figcaption class="animeb-kv-lightbox-caption"></figcaption>
      </figure>
    </section>`;
  document.body.append(viewer);
  const fullPhoto=viewer.querySelector('.animeb-kv-lightbox-photo');
  const caption=viewer.querySelector('.animeb-kv-lightbox-caption');
  const closeButton=viewer.querySelector('.animeb-kv-lightbox-close');
  let lastFocus=null;
  let previousScroll=0;
  let savedBody=null;
  let savedRootOverflow='';

  function close(){
    if(viewer.hidden)return;
    viewer.hidden=true;
    fullPhoto.removeAttribute('src');
    fullPhoto.alt='';
    caption.textContent='';
    if(savedBody){
      for(const [name,value] of Object.entries(savedBody))document.body.style[name]=value;
      savedBody=null;
    }
    document.documentElement.style.overflow=savedRootOverflow;
    window.scrollTo(0,previousScroll);
    if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
    lastFocus=null;
  }
  function open(thumb){
    const photo=thumb.querySelector(':scope > img');
    if(!photo || !photo.getAttribute('src'))return;
    // Do not use a screenshot of the thumbnail; reuse the unmodified image URL.
    const src=photo.currentSrc || photo.src;
    const title=(thumb.closest('.entry')?.querySelector('.info-top')?.textContent ||
      thumb.closest('.animeb-dropped-card')?.querySelector('.animeb-dropped-name')?.textContent ||
      thumb.closest('.animeb-bottom-item')?.querySelector('.animeb-bottom-name')?.textContent || photo.alt || '').trim();
    lastFocus=thumb;
    previousScroll=window.scrollY;
    savedRootOverflow=document.documentElement.style.overflow;
    savedBody={position:document.body.style.position,top:document.body.style.top,
      left:document.body.style.left,right:document.body.style.right,
      width:document.body.style.width,overflow:document.body.style.overflow};
    // Safari needs a fixed-body scroll lock so the article does not drift.
    document.documentElement.style.overflow='hidden';
    document.body.style.position='fixed';
    document.body.style.top=`-${previousScroll}px`;
    document.body.style.left='0';
    document.body.style.right='0';
    document.body.style.width='100%';
    document.body.style.overflow='hidden';
    fullPhoto.src=src;
    fullPhoto.alt=photo.alt || title;
    caption.textContent=title;
    viewer.hidden=false;
    closeButton.focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    if(!viewer.hidden)return; // Viewer controls are handled on the viewer itself.
    const thumb=event.target.closest?.('.animeb-kv-view-trigger');
    if(!thumb || !thumb.contains(event.target))return;
    event.preventDefault();event.stopPropagation();open(thumb);
  },true);
  document.addEventListener('keydown',event=>{
    if(!viewer.hidden){
      if(event.key==='Escape'){event.preventDefault();close();}
      else if(event.key==='Tab'){event.preventDefault();closeButton.focus({preventScroll:true});}
      return;
    }
    if(event.key!=='Enter'&&event.key!==' ')return;
    const thumb=event.target.closest?.('.animeb-kv-view-trigger');
    if(!thumb)return;
    event.preventDefault();open(thumb);
  },true);
  viewer.addEventListener('click',event=>{
    if(event.target===viewer || event.target.closest?.('[data-kv-close]')){event.preventDefault();close();}
  });
}

// v4.38.4 — supplementary full-week rank reference. Never rewrites entries.
function animebRefKey(name){return String(name||'').normalize('NFKC').toLowerCase()
  .replace(/[’‘`]/g,"'").replace(/\s+/g,' ').trim();}
function animebRefLookup(data,title){
  const records=data?.meta?.weekly_ranking_reference?.entries;
  if(!Array.isArray(records))return null;
  return records.find(r=>animebRefKey(r.title)===animebRefKey(title))||null;
}
function animebReferenceLastRank(data){
  const list=data?.meta?.weekly_ranking_reference?.entries||[];
  return Math.max(0,...list.map(r=>Number(r.rank)||0));
}
function animebBottomNote(data,title){
  const comments=data?.meta?.bottom_of_week?.comments;
  const rows=Array.isArray(comments)?comments:[];
  return rows.find(row=>animebRefKey(row.title)===animebRefKey(title))||{};
}
// Display choices are keyed to a title, never to the mutable weekly rank.
function animebBottomDisplay(data,title){
  const list=data?.meta?.bottom_of_week?.display;
  return (Array.isArray(list)?list:[]).find(x=>animebRefKey(x.title)===animebRefKey(title))||null;
}
// The Excel review remains a *whole review*. Preserve its line breaks but don't
// divide it into summary/detail according to quotes, brackets or paragraphs.
function animebBottomReviewFull(markup){
  if(!markup)return '';
  const template=document.createElement('template');template.innerHTML=String(markup);
  template.content.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));
  template.content.querySelectorAll('p,div,li').forEach(el=>el.after(document.createTextNode('\n\n')));
  const text=String(template.content.textContent||'').replace(/\r/g,'').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  const lines=text.split('\n');
  if(/^(?:Episode\s*(?:#|＃)?\s*\d+|第\s*[0-9０-９]+\s*話)\s*(?:\([^)]*\))?\s*[:：]?/i.test(lines[0]||''))lines.shift();
  return lines.join('\n').trim();
}
function animebBottomPoster(row, lastRank){
  const box=document.createElement('span');box.className='animeb-bottom-poster animeb-kv-view-trigger';
  box.setAttribute('role','button');box.tabIndex=0;
  const imgId=String(row.kv||'').trim();
  if(imgId && /^[\w-]+$/.test(imgId)){
    const img=document.createElement('img');img.loading='lazy';img.alt=row.title+' key visual';
    img.src=`../../../../images/key-visuals/${window.year}/${window.season}/${imgId}.webp`;
    img.addEventListener('error',()=>{img.remove();box.classList.add('animeb-bottom-no-poster');});
    box.append(img);
  }else box.classList.add('animeb-bottom-no-poster');
  const rank=animebDropText('#'+row.rank,row.rank+'位','animeb-bottom-poster-rank');
  box.append(rank);
  if(row.rank===lastRank){
    box.classList.add('animeb-bottom-last');
    box.append(animebDropText('LAST','最下位','animeb-bottom-last-sticker'));
  }
  const ep=String(row.episode||'').trim();
  if(ep){const label=document.createElement('span');label.className='animeb-bottom-episode';label.textContent=/^(?:ep\.?|episode\s*#?|第)/i.test(ep)?ep.toUpperCase():'EP.'+ep.toUpperCase();box.append(label);}
  return box;
}
// Bottom cards are the ranking's editorial extension. The Excel Last rows
// supply weekly review details; Reference supplies ranking position.
function animebBottomSource(data,title){
  return (data?.meta?.bottom_of_week?.source_entries||[]).find(e=>animebRefKey(e.title)===animebRefKey(title))||null;
}
function animebBottomReviewBits(markup){
  const el=document.createElement('template');el.innerHTML=String(markup||'');
  const paragraphs=[...el.content.querySelectorAll('p')].map(p=>p.textContent.trim()).filter(Boolean);
  const head=reviewParts(markup||'').heading;
  const first=paragraphs[0]||'';
  const summary=/^["“「]/.test(first)?first.replace(/^["“「]/,'').replace(/["”」]$/,''):first;
  const detail=paragraphs.length>1?paragraphs.slice(1).join('\n\n'):'';
  const whole=el.content.textContent?.trim()||'';
  return {head,summary:summary||(!detail?whole.replace(head,'').trim():''),detail};
}
function animebBottomSafeText(en,ja,klass){return animebDropText(en||ja,ja||en,klass);}
function animebBottomDetails(entry, label){
  const d=document.createElement('details');d.className='animeb-bottom-details';
  const summary=document.createElement('summary');summary.append(animebDropText(label==='info'?'MORE INFO':'REVIEW',label==='info'?'作品情報':'レビュー'));d.append(summary);
  if(label==='info'){
    const synopsis=animebBottomSafeText(entry.synopsis,entry.synopsis_ja,'animeb-bottom-synopsis');
    if(synopsis.textContent){
      // An explicit bilingual heading distinguishes the synopsis from the
      // metadata below. Reuse the current Bottom typography and theme colors.
      const intro=document.createElement('section');
      intro.className='animeb-bottom-synopsis-section';
      const heading=document.createElement('strong');
      heading.className='animeb-bottom-synopsis-heading';
      heading.append(animebDropText('Synopsis','あらすじ'));
      intro.append(heading,synopsis);d.append(intro);
    }
    const dl=document.createElement('dl');d.append(dl);d._animebBottomInfoEntry=entry;animebFillWeeklyInfo(dl,entry);
  }else{
    const text=animebBottomSafeText(animebBottomReviewFull(entry.review?.en||''),animebBottomReviewFull(entry.review?.jp||''),'animeb-bottom-full-review');
    d.append(text);
  }
  return d;
}
function animebMountBottomOfWeek(data){
  const count=Number(data?.meta?.bottom_of_week?.count||0);
  const rows=data?.meta?.weekly_ranking_reference?.entries;
  if(![1,3,5].includes(count)||!Array.isArray(rows)||!rows.length)return;
  const ranked=rows.filter(r=>Number.isSafeInteger(r.rank)&&r.rank>0).sort((a,b)=>a.rank-b.rank);
  if(!ranked.length)return;
  const lastRank=ranked.at(-1).rank;
  const section=document.createElement('section');section.className='animeb-bottom-week';section.id='animeb-bottom-of-week';section.dataset.animebBottomLang=animebWeeklyLang;
  const head=document.createElement('header');head.className='animeb-bottom-head';
  head.append(animebDropText('BOTTOM OF THE WEEK','今週の（最）下位作品','animeb-bottom-heading'));
  const countBadge=document.createElement('span');countBadge.className='animeb-bottom-count';countBadge.textContent=String(Math.min(count,ranked.length));
  head.append(countBadge);section.append(head);
  const items=document.createElement('div');items.className='animeb-bottom-items';
  ranked.slice(-count).reverse().forEach(row=>{
    const card=document.createElement('article');card.className='animeb-bottom-item';
    const source=animebBottomSource(data,row.title);
    // Master-enriched Excel source supplements Reference; never override the weekly rank.
    const detailed=source?{...row,...source,rank:row.rank,last_slot:source.last_slot,
      jpTitle:source.jpTitle||row.jpTitle,kv:source.kv||row.kv}:row;
    const poster=animebBottomPoster(detailed,lastRank);
    const body=document.createElement('div');body.className='animeb-bottom-text';
    const title=document.createElement('strong');title.className='animeb-bottom-name';
    title.append(animebDropText(row.title,detailed.jpTitle||row.title));body.append(title);
    if(detailed.jpTitle && animebRefKey(detailed.jpTitle)!==animebRefKey(row.title)){
      const alternate=animebDropText(detailed.jpTitle,row.title,'animeb-bottom-alt');body.append(alternate);
    }
    const values=document.createElement('div');values.className='animeb-bottom-score';
    const wrp=Number(row.wrp_score);
    values.textContent=`WRP ${Number.isFinite(wrp)?wrp.toFixed(2):'—'} · ${row.score??'—'}pt`;
    body.append(values);
    // Proper episode titles live in the Excel review header, NOT the freeform comment.
    if(source?.review){
      const enHead=animebBottomReviewBits(source.review.en||'').head;
      const jaHead=animebBottomReviewBits(source.review.jp||'').head;
      if(enHead||jaHead){const ep=document.createElement('div');ep.className='animeb-bottom-episode-title';
        ep.append(animebBottomSafeText(enHead,jaHead));body.append(ep);}
    }
    const comment=animebBottomNote(data,row.title);
    const selected=animebBottomDisplay(data,row.title); // null for legacy v4.38.6 JSON
    const enManual=String(comment.en||'').trim(),jaManual=String(comment.ja||'').trim();
    // Older JSON remains visually compatible until a user explicitly applies
    // independent visibility switches in the Converter.
    const legacySource=data?.meta?.bottom_of_week?.comment_source!=='manual';
    const enLegacy=animebBottomReviewBits(source?.review?.en||'').summary;
    const jaLegacy=animebBottomReviewBits(source?.review?.jp||'').summary;
    const en=selected?(enManual):(legacySource?(enLegacy||enManual):(enManual||enLegacy));
    const ja=selected?(jaManual):(legacySource?(jaLegacy||jaManual):(jaManual||jaLegacy));
    if((selected?.show_comment!==false)&&(en||ja)){
      const note=document.createElement('p');note.className='animeb-bottom-comment';
      note.append(animebBottomSafeText(en,ja));body.append(note);
    }
    if(source){
      const buttons=document.createElement('div');buttons.className='animeb-bottom-actions';
      const hasInfo=Boolean(source.synopsis||source.synopsis_ja||source.studios||source.based_on||source.director||source.creators||source.cast||source.official_website);
      if(hasInfo)buttons.append(animebBottomDetails(source,'info'));
      const hasReview=Boolean(animebBottomReviewFull(source.review?.en||'')||animebBottomReviewFull(source.review?.jp||''));
      if(hasReview && selected?.show_review!==false)buttons.append(animebBottomDetails(source,'review'));
      if(buttons.children.length)body.append(buttons);
    }
    card.append(poster,body);items.append(card);
  });
  section.append(items);
  // Called AFTER Dropped Titles; insert exactly before it (after ranked entries).
  const list=document.querySelector('.entry-list');if(list)list.after(section);
}

// v4.38: title-level drop decisions (distinct from the legacy weekly status counters).
function animebDropKey(title){return String(title||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();}
function animebDropText(en,ja,cls=''){
  const el=document.createElement('span');if(cls)el.className=cls;
  el.dataset.en=en;el.dataset.ja=ja;el.textContent=animebWeeklyLang==='ja'?ja:en;return el;
}
function animebDropCross(stickerText="DROPPED"){
  // The X spans all four corners of the poster; SVG content is constant, not JSON.
  const layer=document.createElement('span');layer.className='animeb-drop-visual';layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><path d="M0 0 L100 100 M100 0 L0 100" fill="none" stroke="rgba(255,255,255,.43)" stroke-width="13"/></svg>';
  const sticker=document.createElement('span');sticker.className='animeb-drop-sticker';sticker.textContent=stickerText;
  layer.appendChild(sticker);return layer;
}
function animebDropPortrait(info, mini=false, stickerText="DROPPED"){
  const box=document.createElement('span');box.className='animeb-drop-poster'+(mini?' animeb-drop-poster-mini':'');
  const id=String(info.kv||'').trim();
  if(/^[\w-]+$/.test(id)&&id){
    const img=document.createElement('img');img.loading='lazy';img.alt='';
    img.src=`../../../../images/key-visuals/${window.year}/${window.season}/${id}.webp`;
    img.addEventListener('error',()=>{img.remove();box.classList.add('animeb-drop-poster-missing');});
    box.append(img);
  }else box.classList.add('animeb-drop-poster-missing');
  box.append(animebDropCross(stickerText));
  const ep=String(info.episode||'').trim();
  if(!mini && ep){const badge=document.createElement('span');badge.className='animeb-drop-episode';badge.textContent=/^(?:ep\.?|episode\s*#?|第)/i.test(ep)?ep.toUpperCase():'EP.'+ep.toUpperCase();box.append(badge);}
  return box;
}
function animebMountDroppedTitles(data,clones){
  const prelim=String(data?.meta?.week||'').toLowerCase().includes('prelim');
  const eligible=prelim && Array.isArray(data?.meta?.prelim_selection?.eliminated_entries)
    ? data.meta.prelim_selection.eliminated_entries : [];
  const rows=prelim ? eligible : (Array.isArray(data?.meta?.drop_decisions)?data.meta.drop_decisions:[]);
  if(!rows.length)return;
  const stickerText='DROPPED'; // Retain the diagonal DROPPED sticker in Prelim too.
  const entries=Array.isArray(data.entries)?data.entries:[];
  const decisions=[];const seen=new Set();
  rows.forEach(row=>{
    if(!row || typeof row.title!=='string'||!row.title.trim())return;
    const key=animebDropKey(row.title);if(seen.has(key))return;seen.add(key);
    const rowKv=String(row.kv||'').trim();
    const i=entries.findIndex(entry=>animebDropKey(entry.title)===key || (rowKv && String(entry.kv||'').trim()===rowKv));
    const match=i>=0?entries[i]:null;
    // Rated/Unrated is an explicit drop decision, not a consequence of current ranking inclusion.
    // Legacy JSON without a mode falls back to the old inclusion-based heuristic.
    const ratingMode=prelim?'rated':(['rated','unrated'].includes(row.mode)?row.mode:(i>=0?'rated':'unrated'));
    decisions.push({title:match?.title||row.title,jpTitle:match?.jpTitle||row.jpTitle||'',kv:match?.kv||row.kv||'',episode:String(row.episode||match?.episode||animebRefLookup(data,row.title)?.episode||'').trim(),ranked:i>=0,ratingMode,index:i,reason:row.reason||{},ref:animebRefLookup(data,row.title)});
  });
  if(!decisions.length)return;
  const list=document.querySelector('.entry-list');if(!list)return;
  const section=document.createElement('section');section.className='animeb-dropped-titles'+(prelim?' animeb-prelim-eliminated':'');section.id='animeb-dropped-titles';
  const heading=document.createElement('div');heading.className='animeb-dropped-heading';
  const mark=document.createElement('span');mark.className='animeb-dropped-heading-x';mark.textContent='×';mark.setAttribute('aria-hidden','true');
  heading.append(mark,animebDropText(prelim?'ELIMINATED AFTER PRELIM':'DROPPED TITLES',prelim?'プレリム選考落ち作品':'今週でさよならする作品','animeb-dropped-heading-title'));
  const total=document.createElement('span');total.className='animeb-dropped-heading-count';total.textContent=String(decisions.length);
  heading.append(total);section.append(heading);
  const explanation=animebDropText(prelim?'Titles that did not qualify for the main season. Not counted as regular-season drops.':'Titles leaving the ranking from next week (including unrated decisions).',prelim?'本戦出場を逃した作品。本戦の視聴中止数には含まれません。':'来週からランキング対象外になる作品（未評価も含む）。','animeb-dropped-explanation');section.append(explanation);
  const holder=document.createElement('div');holder.className='animeb-dropped-list';
  decisions.forEach((decision,index)=>{
    const card=document.createElement('article');card.className='animeb-dropped-card';card.id=`animeb-drop-card-${index}`;
    const thumb=animebDropPortrait(decision,false,stickerText);
    const copy=document.createElement('div');copy.className='animeb-dropped-copy';
    const title=document.createElement('strong');title.className='animeb-dropped-name';
    title.append(animebDropText(decision.title,decision.jpTitle||decision.title));
    const sub=decision.jpTitle && decision.jpTitle!==decision.title ? animebDropText(decision.jpTitle,decision.title,'animeb-dropped-alt-title'):null;
    const isRated=decision.ratingMode==='rated';
    const hasOverallRank=Number.isSafeInteger(decision.ref?.rank);
    const flag=animebDropText(isRated?(decision.ranked?'RATED · Ranked this week':hasOverallRank?'RATED · Outside featured entries':'RATED · Scored this week (not ranked)'):'UNRATED · No score this week',isRated?(decision.ranked?'評価済み · 今週のランキング掲載':hasOverallRank?'評価済み · ページ掲載外':'評価済み · 今週のランキング掲載なし'):'未評価 · 今週の採点なし','animeb-drop-rating');
    flag.classList.add(isRated?'is-rated':'is-unrated');
    copy.append(title);if(sub)copy.append(sub);if(!prelim)copy.append(flag);
    // Rated but not part of Top10/Extra can still be #13, #15 in the full weekly ranking.
    if(isRated && Number.isSafeInteger(decision.ref?.rank)){
      const rankNote=document.createElement('span');rankNote.className='animeb-drop-full-rank';
      rankNote.append(animebDropText("This week's rank: #"+decision.ref.rank,'今週'+decision.ref.rank+'位'));
      copy.append(rankNote);
    }
    const en=String(decision.reason?.en||'').trim(),ja=String(decision.reason?.ja||'').trim();
    if(en||ja){const p=document.createElement('p');p.className='animeb-dropped-reason';p.append(animebDropText(en||ja,ja||en));copy.append(p);}
    if(decision.ranked){const link=document.createElement('a');link.className='animeb-dropped-go';link.href=`#animeb-drop-ranked-${decision.index}`;link.append(animebDropText('View ranked entry ↑','ランキングの作品へ ↑'));copy.append(link);}
    card.append(thumb,copy);holder.append(card);
    if(decision.ranked){
      const clone=clones[decision.index];if(clone){
        clone.id=`animeb-drop-ranked-${decision.index}`;clone.classList.add('animeb-entry-dropped');
        const poster=clone.querySelector('.kv-thumb');if(poster){poster.classList.add('animeb-kv-dropped');poster.append(animebDropCross(stickerText));}
        const info=clone.querySelector('.more-info');
        if(info){const note=document.createElement('div');note.className='animeb-drop-more-notice';
          const strong=document.createElement('strong');strong.append(animebDropText(prelim?'ELIMINATED AFTER PRELIM':'DROPPED THIS WEEK',prelim?'プレリム選考落ち':'今週で対象外にしました'));
          note.append(strong);
          if(en||ja){const p=document.createElement('p');p.append(animebDropText(en||ja,ja||en));note.append(p);}
          info.prepend(note);
        }
      }
    }
  });
  section.append(holder);list.after(section);
  // The viewing-status panel is a separate navigation surface; the existing metrics remain unchanged.
  const status=document.querySelector('.ws-modern-details');
  if(status){
    const group=document.createElement('section');group.className='ws-modern-group animeb-drop-status-group';
    const head=document.createElement('div');head.className='animeb-drop-status-header';
    const label=animebDropText(prelim?'ELIMINATED AFTER PRELIM':'DECIDED TO DROP THIS WEEK',prelim?'本戦進出を逃した作品':'今週対象外にすると決めた作品','ws-modern-group-title');
    const count=document.createElement('strong');count.textContent=String(decisions.length);
    const go=document.createElement('a');go.href='#animeb-dropped-titles';go.className='animeb-drop-status-jump';go.setAttribute('aria-label','Go to Dropped Titles / Dropped Titlesへ移動');go.textContent='›';
    head.append(label,count,go);group.append(head);
    const thumbs=document.createElement('div');thumbs.className='animeb-drop-status-thumbs';
    decisions.forEach((decision,index)=>{
      const a=document.createElement('a');a.className='animeb-drop-status-link';a.href=decision.ranked?`#animeb-drop-ranked-${decision.index}`:`#animeb-drop-card-${index}`;
      a.append(animebDropPortrait(decision,true,stickerText));
      const name=animebDropText(decision.title,decision.jpTitle||decision.title,'animeb-drop-status-name');a.append(name);
      a.title=(decision.jpTitle||decision.title)+' · '+(decision.ratingMode==='rated'?'RATED':'UNRATED');thumbs.append(a);
    });
    group.append(thumbs);
    const helpbar=status.querySelector('.ws-modern-helpbar');if(helpbar)status.insertBefore(group,helpbar);else status.append(group);
  }
  // Language switching updates every new label without re-rendering the page.
  animebRefreshDropLanguage();
}
function animebRefreshDropLanguage(){
  document.querySelectorAll('.animeb-bottom-week').forEach(el=>el.dataset.animebBottomLang=animebWeeklyLang);
  document.querySelectorAll('.animeb-dropped-titles [data-en][data-ja], .animeb-drop-status-group [data-en][data-ja], .animeb-drop-more-notice [data-en][data-ja], .animeb-bottom-week [data-en][data-ja], .animeb-extra-reference-rank[data-en][data-ja], .animeb-extra-last-label[data-en][data-ja]').forEach(el=>{
    el.textContent=animebWeeklyLang==='ja'?el.dataset.ja:el.dataset.en;
  });
}

// ========== JSON読み込み & DOM更新 =========
fetch(jsonPath)
  .then(response => {
    console.log(`🔍 Response status: ${response.status}`);
    if (!response.ok) throw new Error("Fetch failed");
    return response.json();
  })
.then(data => {

  console.log(`✅ Successfully fetched: ranking-${currentWeek}-${season}${year}.json`);
  
  const isFinalWeek = (data.meta.week || "").toLowerCase().includes("final");
  document.body.dataset.animebFinalWeek=String(isFinalWeek);

  
  // ここから通常処理


  // テーブルヘッダー出し分け
  const headerMountPoint = document.querySelector('.table-header-mount');
  const normalHeaderTemplate = document.getElementById('table-header-normal');
  const finalHeaderTemplate = document.getElementById('table-header-final');

if (headerMountPoint) {
  // 一旦中身クリア（※ mount先が空でない可能性がある場合）
  headerMountPoint.innerHTML = '';

  const selectedHeader = isFinalWeek
    ? finalHeaderTemplate?.content.cloneNode(true)
    : normalHeaderTemplate?.content.cloneNode(true);

  if (selectedHeader) {
    headerMountPoint.appendChild(selectedHeader);
    setupInfoTriggers(); // 🔁 ポップアップイベントを再バインドする関数
  }
}

  // note 出し分け（拡張性・安全性重視）
const noteMountPoint = document.querySelector('.note-mount');
const normalNoteTemplate = document.getElementById('note-normal');
const finalNoteTemplate = document.getElementById('note-final');

if (noteMountPoint) {
  // 念のため mount point を初期化
  noteMountPoint.innerHTML = '';

  // 適切なテンプレートを選択
  let selectedNote = null;
  if (isFinalWeek && finalNoteTemplate) {
    selectedNote = finalNoteTemplate.content.cloneNode(true);
  } else if (normalNoteTemplate) {
    selectedNote = normalNoteTemplate.content.cloneNode(true);
  }

  // 最後に反映
  if (selectedNote) {
    noteMountPoint.appendChild(selectedNote);
    setupInfoTriggers(); // 🔁 ポップアップイベントを再バインドする関数
    setupDetailToggles();     // ←これ追加！
  }
}


  // ✅ ← この位置のすぐ下に追加してOK！

    // ========== WATCH STATUS を反映 ==========
    // v4.28: add two optional items to the existing panel without altering shared-index.html.
    function animebEnsureOptionalStatusRows(metaStatus) {
      const panel = document.querySelector('.watch-status .ws-panel');
      if (!panel) return;
      const optionalRows = [
        ['notAiredYet', 'icon-notairedyet'],
        ['startedAiringThisWeek', 'icon-startedairing']
      ];
      for (const [key, icon] of optionalRows) {
        let row = panel.querySelector(`.ws-item[data-tooltip="${key}"]`);
        const raw = metaStatus && Object.prototype.hasOwnProperty.call(metaStatus, key) ? metaStatus[key] : null;
        const available = raw !== null && raw !== undefined && raw !== '' && Number.isInteger(Number(raw)) && Number(raw) >= 0;
        if (!available) { if (row) row.remove(); continue; }
        if (!row) {
          row = document.createElement('div'); row.className = 'ws-item'; row.dataset.tooltip = key;
          const iconSpan = document.createElement('span'); iconSpan.className = icon; iconSpan.setAttribute('aria-hidden', 'true');
          const valueSpan = document.createElement('span'); valueSpan.className = 'view-count'; valueSpan.dataset.key = key;
          row.append(iconSpan, valueSpan);
        }
        // Place both new rows after Completed, before Total, in a consistent order.
        const totalRow = panel.querySelector('.ws-item[data-tooltip="total"]');
        if (totalRow) panel.insertBefore(row, totalRow); else panel.appendChild(row);
      }
    }
    function updateWatchStatus(metaStatus) {
      if (!metaStatus) return;
      animebEnsureOptionalStatusRows(metaStatus);

      const labelMap = {
        watching: 'Watching',
        droppedThisWeek: 'Dropped',
        droppedTotal: 'Total dropped',
        backOnList: 'Back on List', // 追加
        noAir: 'NoAir',
        completed: 'Completed',
        notAiredYet: 'Not Aired Yet',
        startedAiringThisWeek: 'Started This Week',
        total: 'Total'
      };

      document.querySelectorAll('.watch-status .ws-item').forEach(item => {
  const key = item.dataset.tooltip;
  const label = labelMap[key];
  const count = metaStatus[key];
  const target = item.querySelector('.view-count'); // ← 明示的にここだけ書き換える
  // 空欄やnull/undefinedはスキップ（ただし0は表示）
    if (target && label && count !== undefined && count !== null && String(count).trim() !== "") {
      item.dataset.statusValue=String(count);
      target.textContent = `${label}:${count}`;
  }
});
    }

    // ========== パネル開閉トグル ==========
(function initWatchPanel(){            // IIFEで1回だけ実行
  const toggle = document.querySelector('.ws-toggle');
  const panel  = document.querySelector('.ws-panel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !open);
    panel.hidden = open;               // true→非表示
    panel.classList.toggle('open', !open);
  });
})();

    // メタ情報更新
    // ✅ WEEK を完全全大文字表示に変更
    const weekEl = document.querySelector('.week-title');
    // 🛠️ TEMP FIX: Final week header width control (will be replaced by flex layout later)
    const subHeader = document.querySelector('.sub-header');


if (weekEl && data.meta.week) {
  const weekText = data.meta.week.toUpperCase();

  // ✅ 👇 ここに追加すればバッチリ
  console.log("🪪 Week text:", weekText);

  weekEl.textContent = weekText;

  // ========== サブヘッダーに "FINAL" を追加 ==========
if (weekText === 'WEEK FINAL') {
  const subHeader = document.querySelector('.sub-header');

  if (subHeader) {
    const animeEl = subHeader.querySelector('.title-anime');
    const rankingEl = subHeader.querySelector('.title-ranking');

    // すでに存在していないかチェック（重複防止）
    if (animeEl && rankingEl && !subHeader.querySelector('.final')) {
      const finalSpan = document.createElement('span');
      finalSpan.className = 'final';
      finalSpan.textContent = 'FINAL';
      subHeader.insertBefore(finalSpan, rankingEl);
    }
  }
}


  // クラスのリセットと付け直し
  weekEl.classList.remove('final', 'mid', 'prelim', 'normal');

  if (weekText === 'WEEK FINAL') {
    weekEl.classList.add('final');
  } else if (weekText === 'WEEK 6') {
    weekEl.classList.add('mid');
  } else if (weekText === 'WEEK PRELIM') {
    weekEl.classList.add('prelim');
  } else {
    weekEl.classList.add('normal');
  }

  // === TEMPORARY WIDTH FIX START ===
  // ✅ ★ここで sub-header にクラスを付ける
  if (subHeader) {
    subHeader.classList.remove('wide', 'normal');
    if (weekText === 'WEEK FINAL') {
      subHeader.classList.add('wide');
    } else {
      subHeader.classList.add('normal');
    }
  }
  // === TEMPORARY WIDTH FIX END ===
}
 // ✅ Season title 分解して挿入（"2025 Spring" → 2025, SPRING）
const seasonRaw = data.meta.season || "";
const [yearText, seasonRawText] = seasonRaw.trim().split(" "); // "2025", "Spring"
const seasonText = seasonRawText?.toUpperCase?.() || "";       // "SPRING"
const seasonLower = seasonRawText?.toLowerCase?.() || "";      // "spring", "summer", etc.

const yearEl = document.querySelector('.season-title .year');
const seasonEl = document.querySelector('.season-title .season');

if (yearEl) yearEl.textContent = yearText;

if (seasonEl) {
  seasonEl.textContent = seasonText;

  // 👇 クラスを完全に置き換え（"season" ＋ 季節名）
  seasonEl.className = "season"; // 基本クラスでリセット
  seasonEl.classList.add(`season-${seasonLower}`); // 追加で .season-spring など
}

    document.title = `Anime Weekly Ranking - ${data.meta.week}`;

// ✅ ここにフォーマット関数を置くのがベスト
function formatReleaseDates(dateStr) {
  if (!dateStr) return "";

  // "4/10/2025" or "4/10/2025 to 6/26/2025"
  const parts = dateStr.split(" to ");

  function convert(d) {
    const [m, day, y] = d.split("/");
    const monthMap = [
      "", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthMap[parseInt(m, 10)]} ${parseInt(day, 10)}, ${y}`;
  }

  if (parts.length === 2) {
    // 両方ある場合
    return `${convert(parts[0])} to ${convert(parts[1])}`;
  } else {
    // 開始日だけの場合
    return convert(parts[0]);
  }
}


    // ========== PATCH: duration and ep_range display ==========

// （どこか上の方に）関数定義を追加
function formatDuration(durationStr) {
  const p = durationStr.split(/[-\s]+/);
  return `${p[0]}/${p[1]}/${p[2]}–${p[3]}/${p[4]}/${p[5]}`;
}


// Duration を <span class="duration"> に挿入（Jsonで括弧なし前提）
const durationEl = document.querySelector('.duration');
if (durationEl && data.meta.duration) {
  const rawDuration = data.meta.duration;

  // ↓ここで formatDuration 関数を使って整形
  const formattedDuration = formatDuration(rawDuration);

  // 表示に反映
  durationEl.textContent = `(${formattedDuration})`;
}


// Ep Range を <span class="ep-range"> に挿入（Ep の E は大文字化）
const epRangeEl = document.querySelector('.ep-range');
if (epRangeEl && data.meta.ep_range) {
  const formatted = data.meta.ep_range.replace(/^ep/i, 'Ep'); // Epだけ大文字化
  epRangeEl.textContent = `[${formatted}]`;
}


    // Optional weekly intro comes from the ranking JSON, not the anime Master.
    const introRaw=data.meta.weekly_intro || {};
    const introEn=animebInfoValue(typeof introRaw==='object'?introRaw.en:data.meta.weekly_intro_en);
    const introJa=animebInfoValue(typeof introRaw==='object'?introRaw.ja:data.meta.weekly_intro_ja);
    document.querySelector('.wrapper')?.classList.toggle('animeb-no-weekly-intro',!(introEn || introJa));
    if(introEn || introJa) {
      let intro=document.querySelector('.animeb-weekly-intro');
      if(!intro) {
        intro=document.createElement('section');intro.className='animeb-weekly-intro';
        const label=document.createElement('div');label.className='animeb-intro-label';
        const content=document.createElement('div');content.className='animeb-intro-text';
        intro.append(label,content);
        document.querySelector('.sub-header')?.after(intro);
      }
      intro.dataset.en=introEn;intro.dataset.ja=introJa;
    }
    animebApplyWeeklyPresentation(data.meta);

    // ============= phase 1: 構造だけ複製 ==============
const container = document.querySelector(".entry-list");
const template = document.querySelector("#entry-template .entry"); // ← ここで .entry を取得
const clones = [];

data.entries.forEach(() => {
  const clone = template.cloneNode(true);
  container.appendChild(clone);
  clones.push(clone);
});


// ========== Phase 2: 情報だけ注入 ==========
clones.forEach((clone, i) => {
  const entryData = data.entries[i];
  clone._animebEntry=entryData;

  // — ランク —
const rankEl = clone.querySelector(".rank-number");
const rankTop = clone.querySelector(".rank-top");
const rankVal = entryData.rank;

// 既に入っている画像の削除は rank-top / rank-number 両方試みる
if (rankTop) {
  const oldImgTop = rankTop.querySelector("img");
  if (oldImgTop) oldImgTop.remove();
}
if (rankEl) {
  const oldImgInNumber = rankEl.querySelector("img");
  if (oldImgInNumber) oldImgInNumber.remove();
}

// 数値ランク（1〜3）1〜3位に色を付けるためクラス名を定義(rank-number)
if (typeof rankVal === "number" && [1, 2, 3].includes(rankVal)) {
  const classMap = {
    1: "rank-number-first",
    2: "rank-number-second",
    3: "rank-number-third",
  };
  const className = classMap[rankVal];

  // クラス名を付与（画像は削除）
  if (rankEl) {
    rankEl.textContent = String(rankVal);
    rankEl.classList.add(className);  // ここで色付け用のクラス追加
  }
} else {
  // 通常の数値ランク表示（4位以降）
  if (rankEl) {
    rankEl.textContent = String(rankVal);
  }
}

/*
// 数値ランク（1〜3）1〜3位に応じた画像とクラス名を定義
if (typeof rankVal === "number" && [1, 2, 3].includes(rankVal)) {
  const badgeMap = {
    1: { src: "cupcake.png", class: "crown-gold" },
    2: { src: "beer.png", class: "crown-silver" },
    3: { src: "rose.png", class: "crown-bronze" },
  };
  const badge = badgeMap[rankVal];


if (rankTop) {
    const img = document.createElement("img");
    img.src = `../../../../images/badges/${badge.src}`;
    img.className = badge.class;
    img.alt = `Rank ${rankVal}`;
    rankTop.prepend(img);
  }

  if (rankEl) rankEl.textContent = String(rankVal);
}
*/
// スペシャルランクバッジ（spotlight, editor's pick, dookie）
if (typeof rankVal === "string") {
  const key = rankVal.toLowerCase();
  const specialMap = {
    "spotlight":     { src: "spotlight.png",     class: "light" },
    "editor's pick": { src: "editorspick.png",   class: "editor-pick" },
    "dookie":        { src: "dookie.png",        class: "dookie-skull" },
  };

  if (specialMap[key] && rankEl) {
    const { src, class: cls } = specialMap[key];

    const img = document.createElement("img");
    img.src = `../../../../images/badges/${src}`;
    img.className = cls;
    img.alt = key;
    rankEl.innerHTML = ""; // 数字を消す
    rankEl.appendChild(img); // 画像は rank-number に入れる（数字の代替）
    const fullRank=animebRefLookup(data,entryData.title);
    if(fullRank && Number.isSafeInteger(fullRank.rank) && fullRank.rank>0){
      const rankText=document.createElement('span');rankText.className='animeb-extra-reference-rank';
      rankText.dataset.en='#'+fullRank.rank;
      rankText.dataset.ja=fullRank.rank+'位';
      rankText.textContent=animebWeeklyLang==='ja'?rankText.dataset.ja:rankText.dataset.en;
      rankText.title='Weekly rank / 今週の順位';rankEl.append(rankText);
      if(fullRank.rank===animebReferenceLastRank(data)){
        const last=animebDropText('LAST','最下位','animeb-extra-last-label');
        rankEl.append(last);rankEl.closest('.rank-wrapper')?.classList.add('animeb-extra-last');
      }
    }

  }
}

// 通常ランク（4位以降の数値）
if (typeof rankVal === "number" && rankVal > 3) {
  if (rankEl) rankEl.textContent = String(rankVal);
}



  // — KV画像 —
  // 動的に year / season を使ってパス生成
const year = window.year;
const season = window.season; // spring, summer, etc.

  const kvImg = clone.querySelector(".kv-thumb img");
  if (kvImg && entryData.kv) {
    kvImg.src = `../../../../images/key-visuals/${year}/${season}/${entryData.kv}.webp`;
    kvImg.alt = `${entryData.title} key visual`;
  }

  // Experiment: move the original rank/trend node into the key-visual corner.
  // This preserves rank colors, special badges, trend updates and source data.
  const originalRank = clone.querySelector('.entry > .rank-wrapper');
  const kvCorner = clone.querySelector('.kv-thumb');
  if (originalRank && kvCorner) kvCorner.appendChild(originalRank);

  // — トレンド —
  const trendLabel = clone.querySelector(".trend-label");
  const trendIcon = clone.querySelector(".rank-trend img");
  const label = (entryData.trend || "").toLowerCase();
  const labelMap = { re: "Re-entry" };
  if (trendLabel && trendIcon) {
    trendLabel.textContent = labelMap[label] || entryData.trend;
    trendIcon.src = `../../../../images/trends/${label}-arrow.png`;
    trendIcon.alt = `${entryData.trend} icon`;
    trendIcon.onerror = () => trendIcon.style.display = "none";
  }

  // — タイトル＆日本語タイトル —
  clone.querySelector(".info-top").textContent = entryData.title || "";
  clone.querySelector(".jp-title").textContent = entryData.jpTitle || "";

  // v20: bilingual episode headings beneath the anime titles.
  const enEpisode = reviewParts(entryData.review?.en || '').heading;
  const jpEpisode = reviewParts(entryData.review?.jp || '').heading;
  clone._animebEpisodeHeadings={en:enEpisode,ja:jpEpisode};
  const jpTitle = clone.querySelector('.jp-title');
  if (jpTitle && (enEpisode || jpEpisode)) {
    const episodeLine = document.createElement('div');
    episodeLine.className = 'ranking-episode-line';
    if (enEpisode) {
      const en = document.createElement('span');
      en.textContent = enEpisode;
      episodeLine.appendChild(en);
    }
    if (enEpisode && jpEpisode) {
      const separator = document.createElement('span');
      separator.className = 'ranking-episode-separator';
      separator.textContent = '│';
      episodeLine.appendChild(separator);
    }
    if (jpEpisode) {
      const jp = document.createElement('span');
      jp.textContent = jpEpisode;
      episodeLine.appendChild(jp);
    }
    jpTitle.after(episodeLine);
  }

  // — ジャンルタグ —
  const genreBox = clone.querySelector(".genre-tags");
  genreBox.innerHTML = "";
  (entryData.genre || []).forEach(tag => {
    const span = document.createElement("span");
    span.className = "genre-tag";
    span.textContent = tag;
    genreBox.appendChild(span);
  });

  // — WRPスコア & Breakdown —
  const wrpEl = clone.querySelector(".wrp-score");
  if (wrpEl) {
    wrpEl.innerHTML = `${entryData.wrp_score}<span class="wrp-score-unit">pt</span> <img src="../../../../images/badges/info-green.svg" width="8px">`;

  // — バーラベル (Weekly Ranking Point 表示)
const barLabel = clone.querySelector(".bar-label");
if (barLabel) {
  barLabel.textContent = isFinalWeek
    ? "Final WRP w/6EP*"
    : "Weekly Ranking Point*";
}


  // Final Week 専用: key_elements_breakdown がある場合
  const keyBreakdown = entryData.key_elements_breakdown;
  if (keyBreakdown) {
    wrpEl.querySelector('img').addEventListener('click', function(e) {
      e.stopPropagation();
      closeAll();
      const popup = createPopup(animebWRPDetailHTML(keyBreakdown, true), 'wrp-popup');
      positionPopup(this, popup);
    });

  
  
  } else if (entryData.wrp_breakdown) {
  // 通常の WRP Breakdown をそのまま使う  
    wrpEl.querySelector("img").addEventListener("click", function (e) {
      e.stopPropagation();
      closeAll();
      const popup = createPopup(animebWRPDetailHTML(entryData.wrp_breakdown), "wrp-popup");
      positionPopup(this, popup);
    });
  }
  }
  // — Totalスコア —
const scoreEl = clone.querySelector(".score");
if (scoreEl) {
  const scoreValue = entryData.score ?? entryData.overall_rating ?? "-";
  scoreEl.innerHTML = `
    <div class="score-number">${scoreValue}</div>
    <div class="score-unit">pt</div>
  `;
}

  // — エピソード番号を kv-thumb に追加 —
const kvThumbBox = clone.querySelector('.kv-thumb');
if (kvThumbBox && entryData.episode) {
  const epBox = document.createElement("div");
  epBox.className = "title-ep";
  epBox.textContent = `Ep.${entryData.episode}`;
  kvThumbBox.appendChild(epBox);
}


  // PC-only three-line synopsis preview occupies empty space beneath the WRP bar.
  const infoBox=clone.querySelector('.info-box');
  if(infoBox && !infoBox.querySelector('.animeb-synopsis-preview')) {
    const preview=document.createElement('div');preview.className='animeb-synopsis-preview';
    preview.textContent=animebInfoFirst(entryData.synopsis,entryData.synopsis_ja);
    preview.hidden=!preview.textContent;
    infoBox.appendChild(preview);
  }

  // — Synopsis (show the heading only when content exists) —
  const synopsisBox = clone.querySelector('.synopsis');
  if (synopsisBox) {
    synopsisBox.textContent = animebInfoValue(entryData.synopsis);
    synopsisBox.classList.toggle('animeb-empty-synopsis', !synopsisBox.textContent);
  }

  // — More Info: backward compatible with old and Master-assisted weekly JSON —
  const infoPanel = clone.querySelector('.more-info');
  const dl = infoPanel?.querySelector('dl');
  if (dl) animebFillWeeklyInfo(dl, entryData);

  // — Reviewボタン —
const reviewAnchor = clone.querySelector(".collapse-wrapper");
if (reviewAnchor) {
  // ✅ 既存の review-tag を削除（wrapper内から探す）
  const existingReview = reviewAnchor.querySelector(".review-tag");
  if (existingReview) existingReview.remove();

  const reviewData = entryData.review;
  const reviewTag = document.createElement("span");
  reviewTag.className = "review-tag";

  if (reviewData && (reviewData.en?.trim() || reviewData.jp?.trim())) {
    reviewTag.dataset.reviewEn = reviewData.en || "";
    reviewTag.dataset.reviewJp = reviewData.jp || "";
    reviewTag.dataset.lang = "en";
    reviewTag.textContent = "Review";
    reviewTag.style.display = "inline-block";
  } else {
    reviewTag.style.display = "none";
  }

  reviewAnchor.appendChild(reviewTag);
}

}); // ← ✅ ← ← ← これが `.forEach()` の閉じ

  // ✅ 必ず `.then(data => { ... })` の中にある必要がある
    animebApplyWeeklyLanguage();
    updateWatchStatus(data.meta.status);
    // v4.39: All weeks use modern styling. Historical missing counters stay undefined;
    // only counters actually present in JSON receive labels and values.
    animebMountRankingCoverage(data.meta.status, Array.isArray(data.entries) ? data.entries.filter(e => typeof e.rank === "number").length : 0, data.meta.week);
    animebMountDroppedTitles(data, clones);
    animebMountBottomOfWeek(data);
    animebSetupKeyVisualViewer();
    animebApplyWeeklyLanguage();
    adjustScoreBars();
    setTimeout(() => {
      setupPopups();
    }, 0); // 🔁 DOMが確実に構築されてからイベントをバインド
	
	// ✅ TOP 数字の書き換え処理
const topHeader = document.querySelector(".header h1");

if (topHeader && Array.isArray(data.entries)) {
  // 数値 rank だけを抽出・カウント
  const numericRanks = data.entries.filter(e => typeof e.rank === "number");
  const topCount = numericRanks.length;

  // "TOP"の後ろに数字を差し込む形で置換
  topHeader.textContent = `TOP${topCount}`;
}

	
	
  })  // ← fetch().then(data => { ... }) の閉じ

.catch(error => {
  console.error(`❌ Fetch failed: ${error.message}`);
});

// 補助関数（forEach外に配置してOK）
function titleCase(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

//  positionPopup()（スマホ右端補正つきバージョン）
function positionPopup(trigger, popup) {
  // 一時的に表示してサイズ測定
  popup.style.visibility = 'hidden';
  popup.style.display = 'block';

  const rect = trigger.getBoundingClientRect();
  const top = rect.top + window.scrollY + 30;
  const popupWidth = popup.offsetWidth;
  const screenWidth = window.innerWidth;

  let left;

  if (screenWidth <= 480) {
    // ✅ スマホだけ中央に表示（表示幅が480px以下）
    left = window.scrollX + (screenWidth - popupWidth) / 2;
  } else {
    // 通常の表示（レビューボタンの横）
    left = rect.left + window.scrollX;

    // 画面右端を超えないように調整
    const overflow = left + popupWidth - screenWidth;
    if (overflow > 0) {
      left = Math.max(10, left - overflow - 12);
    }
  }

  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  // 表示復元
  popup.style.display = '';
  popup.style.visibility = '';
}



// v20: presentation-only parsing of the existing bilingual review HTML.
// The source JSON and its original review markup are never modified.
function reviewParts(markup) {
  if (!markup || !markup.trim()) return { heading: '', html: markup || '' };
  const template = document.createElement('template');
  template.innerHTML = markup;
  const root = template.content;
  // Existing reviews begin with either a <strong> episode heading or a text node.
  let heading = '';
  const first = root.firstChild;
  if (first && first.nodeType === Node.ELEMENT_NODE && first.tagName === 'STRONG') {
    heading = first.textContent.trim();
    first.remove();
  } else if (first && first.nodeType === Node.TEXT_NODE) {
    const raw = first.textContent;
    const m = raw.match(/^\s*((?:Episode\s*#?\s*\d+|第\s*\d+\s*話)[^\r\n]*)/i);
    if (m) {
      heading = m[1].trim();
      first.textContent = raw.slice(m[0].length);
    }
  }
  if (heading) {
    const h = document.createElement('div');
    h.className = 'review-episode-heading';
    h.textContent = heading;
    root.insertBefore(h, root.firstChild);
  }
  const paragraphs = [...root.querySelectorAll('p')];
  const firstParagraph = paragraphs[0];
  if (firstParagraph) {
    const quote = firstParagraph.textContent.trim();
    if (/^["“「]/.test(quote) && /["”」]$/.test(quote)) {
      firstParagraph.classList.add('review-standfirst');
      if (paragraphs.length > 1) {
        const rule = document.createElement('div');
        rule.className = 'review-section-divider';
        rule.setAttribute('aria-hidden', 'true');
        firstParagraph.after(rule);
      }
    }
  }
  return { heading, html: template.innerHTML };
}

// ========== ポップアップロジック（EN/JP切り替え: 閉じずに切替・ボタン制御追加） ==========
function setupPopups() {
  document.querySelectorAll('.review-tag').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAll();

      const reviewEn = this.dataset.reviewEn?.trim() || '';
      const reviewJp = this.dataset.reviewJp?.trim() || '';
      let lang;

      // 初期表示言語決定
      if (animebWeeklyLang === 'ja' && reviewJp) {
        lang = 'jp';
      } else if (reviewEn) {
        lang = 'en';
      } else if (reviewJp) {
        lang = 'jp';
      } else {
        return;
      }

       // === ここから下が review-tag のクリックイベント内 ===
const popup = document.createElement('div');
popup.className = 'popup review-popup active';

// popupクリック中は閉じないようにする
popup.addEventListener('click', function (e) {
  e.stopPropagation();
});

const languageBar = document.createElement('div');
languageBar.className = 'review-language-bar';
const languageButtons = {};
['en', 'jp'].forEach(code => {
  const languageBtn = document.createElement('button');
  languageBtn.type = 'button';
  languageBtn.className = `review-language-choice review-language-${code}`;
  languageBtn.textContent = code.toUpperCase();
  languageBtn.setAttribute('aria-label', code === 'en' ? 'English review' : 'Japanese review');
  languageButtons[code] = languageBtn;
  languageBar.appendChild(languageBtn);
});

const contentEl = document.createElement('div');
contentEl.className = 'popup-review-text';

const switchBtn = document.createElement('button');
switchBtn.className = 'review-switch-btn';

const closeBtn = document.createElement('button');
closeBtn.className = 'popup-close-btn';
closeBtn.textContent = 'Close';

// ✅🌸 花の画像をここで挿入
const flowerTopLeft = document.createElement('img');
flowerTopLeft.src = '../../../../images/popup/flowers_left02.png';
flowerTopLeft.className = 'review-flower top-left';

const flowerBottomRight = document.createElement('img');
flowerBottomRight.src = '../../../../images/popup/flowers_right01.png';
flowerBottomRight.className = 'review-flower bottom-right';

// ⬇️ テキストとボタン設定
function updateContent() {
  if (lang === 'en') {

console.log("📦 reviewEn =", reviewEn);

    contentEl.innerHTML = reviewEn ? reviewParts(reviewEn).html : 'English review not available.';
    switchBtn.textContent = 'Switch to Japanese';

 console.log("🌸 contentEl.innerHTML after setting:", contentEl.innerHTML);
  console.log("🧱 DOM:", contentEl);


  } else {
    contentEl.innerHTML = reviewJp ? reviewParts(reviewJp).html : 'Japanese review not available.';
    switchBtn.textContent = 'Switch to English';
  }
// 🔁 ここでフォント用クラスを切り替える
  contentEl.classList.remove('lang-en', 'lang-jp');
  contentEl.classList.add(lang === 'jp' ? 'lang-jp' : 'lang-en');
  switchBtn.disabled = false;
  Object.entries(languageButtons).forEach(([code, languageBtn]) => {
    const selected = code === lang;
    languageBtn.classList.toggle('is-selected', selected);
    languageBtn.setAttribute('aria-pressed', String(selected));
  });
  btn.dataset.lang = lang;
}

updateContent();

function changeReviewLanguage(nextLang) {
  if (lang === nextLang) return;
  lang = nextLang;
  updateContent();
  popup.scrollTop = 0;
  requestAnimationFrame(() => {
    popup.scrollTop = 0;
    adjustFlowerSize(contentEl, flowerTopLeft, flowerBottomRight);
    adjustPopupPadding(popup);
  });
}
Object.entries(languageButtons).forEach(([code, languageBtn]) => {
  languageBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    changeReviewLanguage(code);
  });
});

switchBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  changeReviewLanguage(lang === 'en' ? 'jp' : 'en');
});

// 🌟 ここにセットタイムアウトを追加！
setTimeout(() => {
  // 再度位置やサイズを微調整（delay後にDOMが安定するので）
  adjustFlowerSize(contentEl, flowerTopLeft, flowerBottomRight);
  adjustPopupPadding(popup);
}, 0);

closeBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  closeAll();
});

// ✅ Append順に注意（花 → content → ボタン）
popup.appendChild(flowerTopLeft);
popup.appendChild(flowerBottomRight);
popup.appendChild(languageBar);
popup.appendChild(contentEl);
popup.appendChild(switchBtn);
popup.appendChild(closeBtn);

document.body.appendChild(popup);
positionPopup(this, popup);

// ✅🌸 ここで花サイズを調整する関数を呼び出す
adjustFlowerSize(contentEl, flowerTopLeft, flowerBottomRight);

adjustPopupPadding(popup); // ←💡追加！


    });
  });

  document.querySelectorAll('.wrp-detail-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAll();
      const popup = createPopup(animebWRPLegacyDetailHTML(this.dataset.breakdown), 'wrp-popup');
      positionPopup(this, popup);
    });
  });


  // documentクリック時にだけ閉じるように（popup内部のクリックでは閉じない）
  document.addEventListener('click', () => closeAll());
}

// ========== Helper Functions ==========
// titleCase関数（Final Weekのラベル整形に使用）
function titleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .split(/([\/\-\s])/g)
    .map(part => /^[a-zA-Z]/.test(part)
      ? part.charAt(0).toUpperCase() + part.slice(1)
      : part)
    .join('');
}


//ここから先は変えない、必要だから取っておく

function closeAll() {
  document.querySelectorAll('.popup').forEach(p => p.remove());
}

function createPopup(content, typeClass) {
  const popup = document.createElement('div');
  popup.className = `popup ${typeClass} active`;
  popup.innerHTML = content;
  document.body.appendChild(popup);
  return popup;
}

function positionPopup(button, popup) {
  const rect = button.getBoundingClientRect();

  // Keep non-WRP popups unchanged (e.g. the review panel).
  if (!popup.classList.contains('wrp-popup')) {
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    return;
  }

  // WRP breakdown is positioned relative to the *visible viewport*, not the page.
  // This also overrides the old mobile CSS 'left: auto !important; right: 16px'.
  const margin = 12;
  const gap = 8;
  const viewport = window.visualViewport;
  const viewLeft = viewport ? viewport.offsetLeft : 0;
  const viewTop = viewport ? viewport.offsetTop : 0;
  const viewWidth = viewport ? viewport.width : window.innerWidth;
  const viewHeight = viewport ? viewport.height : window.innerHeight;
  const viewRight = viewLeft + viewWidth;
  const viewBottom = viewTop + viewHeight;

  popup.style.setProperty('position', 'fixed', 'important');
  popup.style.setProperty('right', 'auto', 'important');
  popup.style.setProperty('left', '0px', 'important');
  popup.style.setProperty('transform', 'none', 'important');
  popup.style.top = '0px';
  popup.style.width = 'max-content';
  popup.style.maxWidth = `${Math.max(1, viewWidth - 2 * margin)}px`;
  popup.style.maxHeight = `${Math.max(1, viewHeight - 2 * margin)}px`;
  popup.style.overflowY = 'auto';
  popup.style.boxSizing = 'border-box';
  popup.style.visibility = 'hidden';
  popup.style.display = 'block';

  const popupWidth = popup.getBoundingClientRect().width;
  const popupHeight = popup.getBoundingClientRect().height;
  const minLeft = viewLeft + margin;
  const maxLeft = Math.max(minLeft, viewRight - margin - popupWidth);

  // Always prefer the inner (left) side of the WRP Info icon.
  const targetLeft = rect.left - gap - popupWidth;
  const left = Math.max(minLeft, Math.min(targetLeft, maxLeft));

  const minTop = viewTop + margin;
  const maxTop = Math.max(minTop, viewBottom - margin - popupHeight);
  let top = rect.bottom + gap;
  if (top > maxTop && rect.top - gap - popupHeight >= minTop) {
    top = rect.top - gap - popupHeight;
  }
  top = Math.max(minTop, Math.min(top, maxTop));

  popup.style.setProperty('left', `${Math.round(left)}px`, 'important');
  popup.style.top = `${Math.round(top)}px`;
  popup.style.visibility = '';
  popup.style.display = '';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


// 🌸 花のサイズを高さベース(offsetHeight)で調整する関数（完全版）
function adjustFlowerSize() {
  const reviewText = document.querySelector('.popup-review-text');
  const flowerLeft = document.querySelector('.review-flower.top-left');
  const flowerRight = document.querySelector('.review-flower.bottom-right');

  if (!reviewText || !flowerLeft || !flowerRight) {
    console.warn('[flower-resize.js] One or more elements not found. Aborting resize.');
    return;
  }

  const height = reviewText.clientHeight;

  let leftSize = 25;
  let rightSize = 40;

  if (height < 100) {
    leftSize = 20;
    rightSize = 35;
  } else if (height > 200) {
    leftSize = 30;
    rightSize = 50;
  } else if (height > 500) {
    leftSize = 40;
    rightSize = 65;
  }

  flowerLeft.style.width = `${leftSize}px`;
  flowerRight.style.width = `${rightSize}px`;

  console.log(`[flower-resize.js] Widths set to: ${leftSize}px / ${rightSize}px`);
}

//=====PopupのPadding-bottomを縮める

function adjustPopupPadding(popup) {
  const height = popup.offsetHeight;

  if (height < 120) {
    popup.style.paddingBottom = '10px';
  } else {
    popup.style.paddingBottom = '';
  }
}

//==== Infotrigerのポップアップ？

function setupInfoTriggers() {
  document.querySelectorAll('.info-trigger').forEach(el => {
    const key = el.dataset.key;
    if (!infoMap[key]) return;
    if (el.dataset.animebInfoBound === '1') return;
    el.dataset.animebInfoBound = '1';

    el.addEventListener('mouseenter', (e) => {
      if(window.matchMedia('(hover:hover)').matches)showTooltip(e, animebWeeklyTooltipFor(key));
    });

    el.addEventListener('mousemove', (e) => {
      if(window.matchMedia('(hover:hover)').matches)moveTooltip(e);
    });

    el.addEventListener('mouseleave', () => {
      hideTooltip();
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const content=animebWeeklyTooltipFor(key);
      const tooltip=document.getElementById('tooltip');
      if(tooltip?.style.display==='block' && tooltip.dataset.animebOpenKey===key){
        hideTooltip();return;
      }
      showTooltip(e,content);
      if(tooltip)tooltip.dataset.animebOpenKey=key;
    });
  });
}

// ====DetailToggler のセットアップ
function setupDetailToggles() {
  document.querySelectorAll('.detail-toggle').forEach(el => {
    el.addEventListener('click', () => {
      el.nextElementSibling.classList.toggle('open');
    });
  });
}



// ============Overview Section

window.initOverviewSection = function() {
  const btn = document.getElementById("overview-toggle-btn");
  const container = document.getElementById("overview-container");
  const triangle = btn.querySelector(".triangle-icon");

  if (btn.dataset.animebInitialized) return;
  btn.dataset.animebInitialized='1';
  let currentLang = animebWeeklyLang === 'ja' ? 'JP' : 'EN';
  let overviewRequest = 0;
  // Archive articles are inside Shadow DOM. A single observer per page mirrors
  // the live theme onto the Shadow host: no reload, no mutation of old articles.
  const overviewDarkMode=()=>document.body.dataset.animebTheme==='dark' ||
    (document.body.dataset.animebTheme==='image' && document.body.dataset.animebImageTone==='dark');
  const syncOverviewTheme=()=>{
    container.querySelector('.animeb-overview-isolated')
      ?.toggleAttribute('data-animeb-overview-dark',overviewDarkMode());
  };
  new MutationObserver(syncOverviewTheme).observe(document.body,{
    attributes:true,attributeFilter:['data-animeb-theme','data-animeb-image-tone']
  });
  window.animebWeeklyReloadOverview=()=>{
    currentLang=animebWeeklyLang === 'ja' ? 'JP' : 'EN';
    if(container.classList.contains('expanded')) loadOverview(currentLang);
  };

  // 最初は overview.html を読み込む
  function loadOverview(lang) {
  const requestId=++overviewRequest;
  const year = window.year;
  const season = window.season;
  const currentWeek = window.currentWeek;

  console.log("🛠️ [loadOverview] year:", year);
  console.log("🛠️ [loadOverview] season:", season);
  console.log("🛠️ [loadOverview] week:", currentWeek);

  const basePath = `/animeb-v1/ranking/${year}/${season}/${currentWeek}/`;
  const file = lang === "EN"
    ? `${basePath}${year}${season}-${currentWeek}-overview.html`
    : `${basePath}${year}${season}-${currentWeek}-overview-ja.html`;

    fetch(file)
      .then((response) => {
        if (!response.ok) throw new Error("not found");
        return response.text();
      })
      .then((html) => {
        if(requestId!==overviewRequest || !container.classList.contains('expanded')) return;
        // The archived files are complete HTML documents. Injecting the entire
        // document via innerHTML drops/misplaces <head> styles and lets generic
        // CSS collide with ranking styles. Mount ONLY the content in a shadow
        // root, loading the CSS referenced by that specific archived document.
        const doc=new DOMParser().parseFromString(html,'text/html');
        const article=doc.querySelector('.weekly-overview');
        if(!article) throw new Error('Overview content missing');
        const host=document.createElement('div');
        host.className='animeb-overview-isolated';
        host.toggleAttribute('data-animeb-overview-dark',overviewDarkMode());
        const shadow=host.attachShadow({mode:'open'});
        const sizing=document.createElement('style');
        sizing.textContent=':host{display:block;max-width:100%;min-width:0}*,*::before,*::after{box-sizing:border-box}.weekly-overview{max-width:100%;overflow-wrap:anywhere}.weekly-overview p,.weekly-overview ul{max-width:100%;box-sizing:border-box}.weekly-overview img,.weekly-overview iframe{max-width:100%;height:auto}';
        shadow.append(sizing);
        const sourceStyles=[...doc.head.querySelectorAll('link[rel~="stylesheet"]')];
        const cssBase='/animeb-v1/assets/css/ranking/overview/';
        for(const original of sourceStyles){
          try{
            const href=new URL(original.getAttribute('href'),new URL(file,location.href));
            // Week 08 EN archive has a double slash before /assets/.
            href.pathname=href.pathname.replace(/\/{2,}/g,'/');
            // Limit to the known archived overview styles; do not load page-wide CSS.
            if(href.origin!==location.origin || !href.pathname.startsWith(cssBase))continue;
            const link=document.createElement('link');link.rel='stylesheet';link.href=href.href;
            shadow.append(link);
          }catch(_){}
        }
        // Some archived pages used inline styles rather than a stylesheet.
        doc.head.querySelectorAll('style').forEach(original=>{
          const style=document.createElement('style');style.textContent=original.textContent;
          shadow.append(style);
        });
        // Append the reading-scale override AFTER archive CSS, so the legacy
        // HTML's paragraphs and headings are preserved but can no longer be
        // clipped or oddly justified in narrow mobile layouts.
        host.setAttribute('lang',lang==='EN'?'en':'ja');
        const reading=document.createElement('style');
        reading.textContent=`
          .weekly-overview{width:100%;max-width:680px;margin:0 auto 20px;padding:0 clamp(10px,2.5vw,18px) 16px;box-sizing:border-box}
          .weekly-overview p,.weekly-overview ul{width:100%;max-width:100%;margin-left:0;margin-right:0;text-align:left;overflow-wrap:break-word}
          .weekly-overview img,.weekly-overview table{max-width:100%}
          @media(max-width:768px){
            .weekly-overview p{font-size:.90rem;line-height:1.72}
            .weekly-overview ul{font-size:.88rem;line-height:1.75;padding-left:1rem}
            .weekly-overview .section-title{margin-top:2.25rem;margin-bottom:1.6rem}
            :host([lang=ja]) .weekly-overview p{font-size:.83rem;line-height:1.79}
            :host([lang=ja]) .weekly-overview ul{font-size:.82rem;line-height:1.85}
          }
          /* Keep the archive's original article typography and cream palette
             completely untouched in light mode. Only the dark theme overrides. */
          :host([data-animeb-overview-dark]) .weekly-overview{
            background-color:var(--animeb-overview-paper,#172a31)!important;
            color:var(--animeb-overview-ink,#e2eae6)!important;
          }
          :host([data-animeb-overview-dark]) .weekly-overview :is(p,ul,li,small,.dropped-list,.footnote){
            color:var(--animeb-overview-ink,#e2eae6)!important;
          }
          :host([data-animeb-overview-dark]) .weekly-overview :is(h1,h2,h3,h4,h5,h6,.section-title,.section-top5,.three-picks,.overview-title){
            color:var(--animeb-overview-heading,#d9e4de)!important;
          }
          :host([data-animeb-overview-dark]) .weekly-overview :is(.date,small,.footnote){
            color:var(--animeb-overview-muted,#b9c8c2)!important;
          }
          :host([data-animeb-overview-dark]) .weekly-overview .week-number{
            color:var(--animeb-overview-accent,#e5a98b)!important;
          }
          :host([data-animeb-overview-dark]) .weekly-overview :is(.overview-title,hr){
            border-color:var(--animeb-overview-rule,#506965)!important;
          }
          :host([data-animeb-overview-dark]) .weekly-overview a{color:#b7dfcd!important;}
          :host([data-animeb-overview-dark]) .weekly-overview :is(blockquote,pre,code){
            color:var(--animeb-overview-ink,#e2eae6)!important;
            background-color:#21383f!important;
          }
        `;
        shadow.append(reading);
        shadow.append(document.importNode(article,true));
        container.replaceChildren(host);
        // Page-wide EN / 日本語 control also switches this legacy Overview.
      })
      .catch(() => {
        if(requestId!==overviewRequest || !container.classList.contains('expanded')) return;
        const message=document.createElement('p');
        message.className='overview-notice';message.style.textAlign='center';
        message.textContent=lang==='EN'?'English Overview not available.':'日本語のOverviewはありません。';
        container.replaceChildren(message);
      });
  }

  // トグル動作 ボタンクリックでアコーディオン開閉（innerHTML を使わない！）
  btn.addEventListener("click", () => {
  const isExpanded=container.classList.toggle("expanded");
  triangle.classList.toggle("rotate",isExpanded);
  btn.setAttribute('aria-expanded',String(isExpanded));
  // Visibility is now an explicit two-state layout, not a multi-thousand-pixel
  // max-height animation. On iPhone, no stale blank scroll area survives close.
  const label = isExpanded ? "CLOSE" : "OVERVIEW";

  // span.triangle-icon を直接残したまま、テキストだけ変える
  const textNode = btn.querySelector('.label-text');
  if (textNode) {
    textNode.textContent = label;
  }

  if (container.classList.contains("expanded")) {
    loadOverview(currentLang);
  } else {
    overviewRequest++;
    container.innerHTML = ""; //閉じたとき中身クリア
  }
});


  const year = window.year;
  const season = window.season;

  // overview.html も overview-ja.html も存在しない場合は
  // ボタンごと非表示にする
  fetch(`${year}${season}-${currentWeek}-overview.html`)
    .then((res) => {
      if (!res.ok) {
        return fetch(`${year}${season}-${currentWeek}-overview-ja.html`);
      } else {
        return res;
      }
    })
    .then((res) => {
      if (!res.ok) {
        throw new Error("no overview at all");
      }
    })
    .catch(() => {
      console.log("No overview files found for this week. Skipping...");
      const overviewSection = document.querySelector(".overview-section");
      if (overviewSection) {
        overviewSection.style.display = "none";
      }
    });
};



// 展開ボタン制御
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.collapse-btn');
  if (!btn) return;

  const entry = btn.closest('.entry');
  entry?.classList.toggle('animeb-expanded');
  const moreInfo = entry.querySelector('.more-info');
  const synopsisBox = entry.querySelector('.synopsis');  // ← ここ追加必要！

  if (moreInfo) {
    moreInfo.classList.toggle('active');
    btn.setAttribute(
      'aria-expanded',
      moreInfo.classList.contains('active') ? 'true' : 'false'
    );
  }


 if (synopsisBox) {
    synopsisBox.classList.toggle('active');
  }

});

// ==============================
// Info-trigger hover/tap popups
// ==============================

const infoMap = {
  wrp: `
      <span class="tooltip-heading">What’s WRP?</span>
      <ul class="tooltip-list">
        <li><span class="key">WRP</span> (Weekly Ranking Point) is a combined score reflecting how satisfying and well-executed an anime episode was <em>within its week</em>.</li>
        <li>It balances technical quality (like animation, script, direction) with overall enjoyment.</li>
        <li>It shows how well the episode performed both <em>on its own terms</em> and <em>compared to others airing that week</em>.</li>
      </ul>
      <p class="tooltip-note">Note: It’s not an absolute score, but a contextual evaluation — it shifts based on the week’s landscape and relative enjoyment.</p>
      <p class="tooltip-bottom-note">For more, scroll to the bottom.</p>
  `,
  total: `
      <span class="tooltip-heading">What’s the Total Score?</span>
      <ul class="tooltip-list">
        <li>Total Score is a simplified, rounded version of the weekly <span class="key">WRP</span> values.</li>
        <li>Each week’s WRP is typically rounded <span class="key">down</span> to the nearest integer.</li>
        <li><span class="key">Exception:</span> Scores from <span class="key">9.50 to 9.99</span> are treated as <span class="key">10</span>, and <span class="key">10.00+</span> becomes <span class="key">11</span>.</li>
      </ul>
      <p class="tooltip-note">Note: While useful for seasonal ranking, this score is also a simplified reflection of the overall impression—both practical and intuitive.</p>
  `,
  fwrp: `
  <span class="tooltip-heading">What’s FWRP?</span>
  <ul class="tooltip-list">
    <li><span class="key">FWRP</span> (Final Weekly Ranking Point) is a score representing the total viewing experience over the season.</li>
    <li>It blends two components: <em>cumulative WRP</em> across all episodes and a <em>separately scored 6-Element Point</em>.</li>
    <li>The formula adjusts based on overall balance and volatility — ensuring both emotional impact and structural integrity are captured.</li>
  </ul>
  <p class="tooltip-note">Note: FWRP is designed to reflect the unique, evolving texture of a full-cour anime — not just raw stats but the journey as a whole.</p>
  <p class="tooltip-bottom-note">For full breakdown, see the note at the bottom.</p>
  `,
  orp: `<span class="tooltip-heading">What’s Overall Rating?</span>
  <p>
  <span class="key">Overall Rating</span> is a cumulative score that reflects how the show has performed as a complete work — not just based on the final episode, but as the sum of each episode’s evaluation throughout the series.
  </p>
  <p>
  It's meant to show the show's total value as both a viewing experience and a completed piece of media. It often becomes a simple reference point to understand how highly regarded the work is, either for returning viewers or those considering watching.
  </p>
  <p class="tooltip-note">
  Note: While this score is based on a personal framework, it strives for consistency and balance. It's not intended to unfairly praise or criticize any specific work. Interpretations of value will naturally vary from person to person.
  </p>
  <p class="tooltip-bottom-note">For more, scroll to the bottom.</p>
  `,
  vstatus: `<span class="tooltip-heading">What’s Viewing Status?</span>
<ul class="tooltip-list">
  <li><span class="key">Watching</span>: 今週視聴した全作品数（Dropped・Back on List 含む）<br>
      <em>Titles watched this week, including dropped ones and back on list.</em></li>
  <li><span class="key">Dropped (this week) </span>: 今週新たに切った作品数<br>
      <em>Titles dropped this week.</em></li>
  <li><span class="key">Total Dropped</span>: 今までに切った作品数（今週含む）<br>
      <em>Total titles dropped so far, including this week.</em></li>
  <li><span class="key">Back on List</span>: 既に切っていたが、今週視聴評価対象に復帰した作品数<br>
      <em>Titles that were previously dropped but returned to the active watching list this week.</em></li>        
  <li><span class="key">No Air</span>: 今週放送されなかった作品数（放送休止など）<br>
      <em>Titles with no episode aired this week.</em></li>
  <li><span class="key">Completed</span>: 先週までに全話放送した作品数<br>
      <em>Titles completed before this week.<br>
      * Titles that ended this week are still counted as “Watching” and will be added here next week.</em></li>
  <li><span class="key">Not Aired Yet</span>: まだ放送開始していない作品数（TBA）。放送開始済みの一時休止であるNo Airとは別。<br>
      <em>Titles that have not started airing yet. Different from a temporary no-air week.</em></li>
  <li><span class="key">Started This Week</span>: 今週初めて放送開始した作品数。視聴数の増加理由を示す項目。<br>
      <em>Titles whose broadcast began this week; this is a change count, not an additional category to add to Total.</em></li>
  <li><span class="key">Total</span>: 初期評価候補数（Prelim 時点）<br>
      <em>Initial number of titles selected at the prelim stage.</em></li>
</ul>
<p class="tooltip-note">“Watching” includes all titles watched this week, even if they were dropped, ended, or returned to the list.</p>
`

};


const animebInfoMapJa = {
  wrp: `<span class="tooltip-heading">WRPとは？</span>
    <ul class="tooltip-list"><li><span class="key">WRP</span>（週間ランキングポイント）は、その週に視聴したアニメ1話の満足度や完成度を総合的に示す点数です。</li>
    <li>アニメーション、脚本、演出などの技術的な出来と、作品としての楽しさを合わせて評価します。</li>
    <li>その話単体の出来に加え、同じ週に放送されたほかの作品との比較も考慮します。</li></ul>
    <p class="tooltip-note">注：絶対的な評価ではありません。その週の作品の顔ぶれや相対的な楽しさによって意味合いは変わります。</p>
    <p class="tooltip-bottom-note">詳しくはページ下部の注釈をご覧ください。</p>`,
  total: `<span class="tooltip-heading">トータルスコアとは？</span>
    <ul class="tooltip-list"><li>トータルスコアは、週間WRPを簡略化し整数に丸めた得点です。</li>
    <li>通常はWRPの小数点以下を切り捨てます。</li>
    <li><span class="key">例外：</span><span class="key">9.50〜9.99</span>は<span class="key">10</span>点、<span class="key">10.00以上</span>は<span class="key">11</span>点として扱います。</li></ul>
    <p class="tooltip-note">注：シーズンランキングに使いやすい簡略化された数値であり、その話の総合的な印象を示す目安でもあります。</p>`,
  fwrp: `<span class="tooltip-heading">FWRPとは？</span><ul class="tooltip-list">
    <li><span class="key">FWRP</span>（最終週間ランキングポイント）は、シーズン全体の視聴体験を表す得点です。</li>
    <li>全話を通した<span class="key">WRPの累積値</span>と、別途採点した<span class="key">6要素ポイント</span>を組み合わせます。</li>
    <li>得点帯に応じて係数を調整し、感情的なインパクトと作品の構造的な完成度の両方を捉えます。</li></ul>
    <p class="tooltip-note">注：単純な数値の比較だけでなく、1クールを通して変化する視聴体験を表すための指標です。</p>
    <p class="tooltip-bottom-note">詳細はページ下部の注釈をご覧ください。</p>`,
  orp: `<span class="tooltip-heading">総合評価（Overall Rating）とは？</span>
    <p><span class="key">Overall Rating</span>は、最終話だけではなく、シーズン全体を通した各話の評価を積み重ねた総合的な得点です。</p>
    <p>一つの作品として完成したときの価値と、視聴体験全体を示すための目安です。これから視聴する人や、あらためて作品を振り返る人にも参考になるよう設計しています。</p>
    <p class="tooltip-note">注：個人的な基準に基づく評価ですが、できる限り一貫性とバランスを保つよう努めています。作品の価値観は人によって異なります。</p>
    <p class="tooltip-bottom-note">詳しくはページ下部をご覧ください。</p>`,
  vstatus: `<span class="tooltip-heading">視聴状況とは？</span><ul class="tooltip-list">
    <li><span class="key">視聴中</span>：その週に見た作品の総数。視聴中止や復帰した作品も含みます。</li>
    <li><span class="key">今週の視聴中止</span>：その週に新たに視聴をやめた作品数。</li>
    <li><span class="key">視聴中止合計</span>：その週を含む、これまでの視聴中止作品数。</li>
    <li><span class="key">復帰</span>：以前視聴をやめた作品のうち、その週に再び視聴対象となった作品数。</li>
    <li><span class="key">放送なし</span>：その週に新しいエピソードが放送されなかった作品数。</li>
    <li><span class="key">完走</span>：前週までに全話の放送が終わった作品数。今週完結した作品は今週の「視聴中」に含め、翌週からこちらに加えます。</li>
    <li><span class="key">未放送（開始前）</span>：まだ放送開始していない作品の数（TBA）。一時的な放送休止「放送なし」とは区別します。</li>
    <li><span class="key">今週放送開始</span>：その週に初めて放送が始まった作品数。新規放送開始の動きを示す数で、Totalとの単純な足し算には使いません。</li>
    <li><span class="key">合計</span>：Prelim時点で選んだ初期評価候補数。</li></ul>
    <p class="tooltip-note">「視聴中」には、その週に見た作品をすべて含みます。</p>`
};
function animebWeeklyTooltipFor(key) {
  return (animebWeeklyLang==='ja' ? animebInfoMapJa[key] : infoMap[key]) || infoMap[key] || '';
}

// Bind the initial icons once. Dynamically mounted header icons are bound after JSON loading.
setupInfoTriggers();
document.addEventListener('click', e=>{
  if(!e.target.closest('.info-trigger, #tooltip'))hideTooltip();
});
document.addEventListener('keydown', e=>{if(e.key==='Escape')hideTooltip();});


function showTooltip(event, text) {
  const tooltip = document.getElementById('tooltip');
  tooltip.innerHTML = text;
  tooltip.style.display = 'block'; // まず表示して幅を測れるようにする
  tooltip.style.visibility = 'hidden'; // 一瞬消す（ちらつき防止）

// 幅と高さを取得
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const pageX = event.pageX;
  const pageY = event.pageY + window.scrollY;
  const padding = 12;

  const screenMid = window.innerWidth / 2;
  let left, top;

  // 左右自動判定（中心より左なら右側に出す）
  if (pageX < screenMid) {
    left = pageX + padding;
  } else {
    left = pageX - tooltipWidth - padding;
  }

   // ★ 上下判定（はみ出し防止つき）
  const spaceBelow = window.innerHeight + window.scrollY - pageY;
  const spaceAbove = pageY - window.scrollY;

  if (spaceBelow >= tooltipHeight + padding) {
    top = pageY + padding; // 下に出す（余裕あり）
  } else if (spaceAbove >= tooltipHeight + padding) {
    top = pageY - tooltipHeight - padding; // 上に出す（余裕あり）
  } else {
    // 上下どちらも足りない場合：なるべく収まる位置に
    top = Math.max(padding, window.scrollY + 4);
  }


  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.visibility = 'visible';
}


function moveTooltip(event) {
  showTooltip(event, document.getElementById('tooltip').innerHTML);
}

function hideTooltip() {
  const tooltip = document.getElementById('tooltip');
  if(!tooltip)return;
  tooltip.style.display = 'none';
  delete tooltip.dataset.animebOpenKey;
}


// ❌ 今では不要（消してもよし、念のためならコメントでもOK）
/*
// Noteのdetailsの開閉トグル
document.querySelectorAll('.detail-toggle').forEach(el => {
  el.addEventListener('click', () => {
    el.nextElementSibling.classList.toggle('open');
  });
});
*/

//　通常のページ（入れ子にしていないWeek01など）では、DOMContentLoaded イベントが使うためにinitOverviewSection() を呼ぶ
document.addEventListener("DOMContentLoaded", () => {
  initOverviewSection();
});
