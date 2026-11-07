/* OFFBEAT R20 — readable season metrics and responsive language-aware historical inspector.
 * A read-only enhancement to R16, not a replacement for the live current-season dashboard.
 * Published rankings are evidence of appearances, NOT proof of the original season pool.
 */
(() => {
  'use strict';
  const base = new URL('./', document.baseURI);
  const capitalize = text => text.slice(0,1).toUpperCase() + text.slice(1);
  const pad = n => String(n).padStart(2,'0');
  const make = (tag, cls, value) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (value !== undefined) n.textContent = String(value);
    return n;
  };
  const labels = {
    en: {
      snapshot:'SEASON SNAPSHOT', intro:'Explore this season through its published weekly rankings. The opening lineup is shown when a verified master is available.', introMaster:'Revisit the original opening lineup alongside the weekly rankings published throughout the season.',
      checkpoints:'SEASON CHECKPOINTS', checkpointIntro:'A season in three stages: first impressions, the midpoint, and the finale. Browse the assessments available at each point.',
      first:'First Impressions', middle:'Midseason', final:'Season Finale', tier:'Tier List', recommendation:'Recommendations & Enjoyment Ranking',
      master:'OPENING SEASON LINEUP', masterNote:'Opening pool explicitly defined in the season file.',
      galleryInvite:"Select a poster to explore each anime's season record—weekly ranking appearances, final standing, ratings, and more.",
      recorded:'TITLES APPEARING IN WEEKLY RANKINGS', recordedNote:'Reconstructed from published weekly rankings, not a verified opening lineup. Titles that never placed in the weekly rankings, including early dropouts, may be absent.',
      preliminary:'ELIMINATED IN PRELIM', prelimNote:'Explicitly marked eliminated in the Preliminary Round; not included in the opening main-season lineup.',
      preload:'Explore Weekly Ranking Titles', hideList:'Hide title list', loading:'Reading published weekly records…',
      failed:'Some weekly records could not be read; this list may be incomplete.', noEntries:'No usable title data was found in the published records.',
      details:'Season record', close:'Close', seen:'First weekly ranking placement',
      noMaster:'The opening lineup has not yet been registered. You can explore titles found in the published weekly rankings below.',
      generic:'Each season begins with the selection process and unfolds through its weekly rankings. Historic season statistics may follow older counting rules.',
      notInitial:'No verified opening lineup is specified; these are titles recorded in the season master.',
      fromMaster:'TITLES IN THE SEASON MASTER', description:'ABOUT THE SEASON', titles:'titles', artMissing:'Poster unavailable',
      studio:'Studio', airing:'Aired from', alternate:'Japanese title', alternateJa:'English title', romanized:'Romanized title', synopsis:'Synopsis',
      finalPlace:'Final ranking', overallRating:'Overall rating', wrp:'Final WRP', keyElements:'Six key elements', total:'Six-element total',
      elementsNote:["Beyond the average of weekly episode scores, these six elements reflect what a series leaves behind over the course of a season. Together, they contribute to its final WRP.", "OP and ED are evaluated through both their animation and music—not simply as separate components, but for how they work together and enhance the viewing experience."], times:'times', points:'pt', place:'place',
      notInFinal:'No final placement recorded for this title', notPublished:'A final ranking has not been published for this season.',
      weeklyAppearances:'Weekly ranking appearances', bestWeekly:'Best weekly position', topThree:'Top-three finishes',
      firstLink:'View first weekly appearance', finalLink:'View the final ranking',
      unknownRank:'Rank not recorded', dataPending:'Looking up this title’s season record…',
      noWeekly:'No weekly ranking placement verified', partial:'Some weeks could not be checked.',
      firstOnly:'Only published weekly data is shown. No opening-lineup status is inferred.'
    },
    ja: {
      snapshot:'シーズンの記録', intro:'公開済みの週間ランキングを振り返ります。本戦開始時のラインナップは、正式なマスターがある場合に表示します。', introMaster:'本戦開始時のラインナップと、シーズンを通して公開された週間ランキングの記録を振り返ります。',
      checkpoints:'シーズンのチェックポイント', checkpointIntro:'開幕・中間・最終。それぞれの節目で公開された評価やおすすめを振り返れます。',
      first:'ファーストインプレッション', middle:'ミッドシーズン', final:'シーズンファイナル', tier:'ティアリスト', recommendation:'おすすめ作品・満足度ランキング',
      master:'本戦開始時のラインナップ', masterNote:'シーズン用ファイルに指定された本戦開始時の作品一覧です。',
      galleryInvite:'作品画像を選ぶと、週間ランキングへの登場記録や最終順位、評価など、その作品のシーズン記録を見ることができます。',
      recorded:'週間ランキングに登場した作品', recordedNote:'公開済みの週間ランキングから復元した一覧で、正式な初期ラインナップではありません。ランクインしないまま脱落した作品などは含まれない場合があります。',
      preliminary:'予選ラウンドで選考外となった作品', prelimNote:'予選で選考外と明記された作品です。本戦の初期ラインナップには含めていません。',
      preload:'週間ランキングの作品一覧を見る', hideList:'作品一覧を閉じる', loading:'公開済みの週間記録を読み込み中…',
      failed:'取得できなかった週があります。作品一覧は不完全な場合があります。', noEntries:'公開済みの記録から作品一覧を復元できませんでした。',
      details:'シーズンでの記録', close:'閉じる', seen:'週間ランキング初ランクイン',
      noMaster:'本戦開始時のラインナップは未登録です。公開済みの週間ランキングから登場作品を確認できます。',
      generic:'各シーズンは作品の選考から始まり、毎週のランキングを重ねて進みます。過去シーズンの視聴状況には、現在と異なる集計方法が使われている場合があります。',
      notInitial:'初期ラインナップの確定情報がないため、マスターに記録された作品として表示しています。',
      fromMaster:'作品マスターの登録作品', description:'シーズンの進み方', titles:'作品', artMissing:'画像なし',
      studio:'制作会社', airing:'放送開始', alternate:'日本語タイトル', alternateJa:'英語タイトル', romanized:'ローマ字表記', synopsis:'あらすじ',
      finalPlace:'最終ランキング順位', overallRating:'総合評価点', wrp:'最終WRP', keyElements:'6要素の評価', total:'6要素合計',
      elementsNote:["各話の評価を積み重ねただけでは捉えきれない、シーズン全体を通して作品が残した印象や魅力を6つの要素から評価し、最終WRPに加算しています。", "OP・EDは映像と楽曲それぞれの完成度だけでなく、その組み合わせや作品との相性、視聴体験にもたらす効果も含めて評価しています。"], times:'回', points:'pt', place:'位',
      notInFinal:'この作品の最終順位は記録されていません', notPublished:'このシーズンの最終ランキングはまだ公開されていません。',
      weeklyAppearances:'週間ランキング登場回数', bestWeekly:'週間最高順位', topThree:'トップ3入り',
      firstLink:'初登場した週を見る', finalLink:'最終ランキングを見る',
      unknownRank:'順位記録なし', dataPending:'この作品のシーズン記録を確認中…',
      noWeekly:'週間ランキングでのランクインは確認できません', partial:'一部の週を確認できませんでした。',
      firstOnly:'公開済みの週間記録に基づく情報です。初期ラインナップへの出場は推定しません。'
    }
  };
  const locale = () => { try{return localStorage.getItem('animeb-weekly-lang')==='ja'?'ja':'en';}catch{return 'en';}};
  const statusOf = entry => String(entry?.finalDecision ?? entry?.final_decision ?? entry?.fields?.final_decision ?? entry?.fields?.finalDecision ?? '').trim().toUpperCase();
  const titleOf = e => String(e?.title ?? e?.info?.title ?? e?.fields?.title ?? '').trim();
  const jpOf = e => String(e?.jpTitle ?? e?.info?.jpTitle ?? e?.fields?.jp_title ?? '').trim();
  const kvOf = e => String(e?.kv ?? e?.id ?? e?.info?.image_id ?? e?.fields?.id ?? '').trim();
  const normalize = s => String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
  const imageOf = (season,entry) => {
    const kv=kvOf(entry);
    return /^[\w-]+$/.test(kv) ? new URL(`images/key-visuals/${season.year}/${season.season}/${kv}.webp`,base).href : '';
  };
  const masterCache=new Map();
  const fetchJSON=async path => {
    const response = await fetch(new URL(path,base));
    if (!response.ok) return null;
    return response.json();
  };
  async function masterFor(season){
    const key=`${season.year}-${season.season}`;
    if (!masterCache.has(key)){
      masterCache.set(key,(async()=>{
        // OFFBEAT MASTER BRIDGE R21: canonical full master first; legacy display JSON remains fallback.
        for (const path of [
          `master/${season.year}/${season.season}/anime-master-${key}.json`,
          `master/${season.year}/${season.season}/anime_master-${key}.json`,
          `assets/data/offbeat-season-${key}.json`,
          `assets/data/anime-master-${key}.json`,
          `assets/data/ranking/weekly/anime-master-${key}.json`
        ]){
          try {
            const d=await fetchJSON(path);
            if(d && (Array.isArray(d.items)||Array.isArray(d.entries)))return d;
          }catch(_){}
        }
        return null;
      })());
    }
    return masterCache.get(key);
  }
  const panelToken=new WeakMap();
  const openHistoryLists=new Set(); // Retain the title-list state across EN/JP re-rendering.
  // Read real published entries; do not infer the initial pool from weekly counts.
  // OFFBEAT MASTER BRIDGE R21: preserve Excel order; only N/A / NA excludes opening candidates.
  // initialSeasonPool remains the editor's value; never silently change it on mismatch.
  const isNotApplicable = value => /^N\s*\/?\s*A$/i.test(String(value ?? '').trim());
  const asMasterDisplayItem = e => ({...e, ...(e.fields || {}), ...(e.info || {}),
    kv:kvOf(e), title:titleOf(e), jpTitle:jpOf(e),
    romanized_title:e.info?.romanized_title ?? e.fields?.romanized_title ?? e.romanized_title ?? '',
    synopsis:e.info?.synopsis ?? e.fields?.synopsis ?? e.synopsis ?? '',
    synopsis_ja:e.info?.synopsis_ja ?? e.fields?.synopsis_ja ?? e.synopsis_ja ?? '',
    studios:e.info?.studios ?? e.fields?.production_studio ?? e.studios ?? '',
    air_date:e.fields?.air_date ?? e.air_date ?? ''
  });
  function masterItems(data){
    const src=Array.isArray(data.items)?data.items:(Array.isArray(data.entries)?data.entries:[]);
    const count=Number(data.initialSeasonPool ?? data.meta?.initialSeasonPool);
    const hasCount=Number.isSafeInteger(count)&&count>=0&&count<=src.length;
    if(Array.isArray(data.mainSeason)){
      const selected=new Set(data.mainSeason.map(normalize));
      const items=src.filter(e=>selected.has(normalize(titleOf(e)))||selected.has(normalize(kvOf(e))));
      return {items:items.map(asMasterDisplayItem),verified:true,excluded:[]};
    }
    const rawCandidate=data.meta?.initialCandidateCount ?? data.initialCandidateCount;
    const candidate=rawCandidate===null||rawCandidate===undefined||rawCandidate==='' ? NaN:Number(rawCandidate);
    if(Number.isSafeInteger(candidate)&&candidate>=0&&candidate<=src.length){
      const slots=src.slice(0,candidate);
      const excluded=slots.filter(e=>isNotApplicable(statusOf(e)));
      const eligible=slots.filter(e=>!isNotApplicable(statusOf(e)));
      // A mismatch is not hidden: the actual eligible titles take precedence in the list,
      // but we do NOT assert that the manually entered pool count has been verified.
      if(hasCount&&eligible.length!==count){
        console.warn('OFFBEAT R21: master lineup count mismatch',data.meta?.year,data.meta?.season,
          {enteredInitialSeasonPool:count,initialCandidateCount:candidate,excluded:excluded.length,eligible:eligible.length});
      }
      return {items:eligible.map(asMasterDisplayItem),verified:hasCount&&eligible.length===count,
        excluded:excluded.map(asMasterDisplayItem)};
    }
    // Legacy R3 display JSON already contains the selected lineup; do not change its semantics.
    if(Array.isArray(data.items)&&hasCount){
      return {items:src.slice(0,count).map(asMasterDisplayItem),verified:true,excluded:[]};
    }
    // A full master with no candidate boundary is NOT proof of an opening lineup.
    // The caller falls back to weekly-ranking records rather than inventing membership.
    return {items:[],verified:false,excluded:[]};
  }
  function weekURL(season,n){return new URL(`ranking/${season.year}/${season.season}/week${pad(n)}/index.html`,base).href;}
  const identity=e=>kvOf(e)?'kv:'+normalize(kvOf(e)):'title:'+normalize(titleOf(e)||jpOf(e));
  const weeksCache=new Map();
  const num=v=>typeof v==='number'&&Number.isFinite(v)?v:(typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v))?Number(v):null);
  async function fromWeekly(season){
    const key=`${season.year}-${season.season}`;
    if(!weeksCache.has(key))weeksCache.set(key,(async()=>{
      const nums=[...season.weeks].sort((a,b)=>a-b);
      const union=new Map(), eliminated=new Map();
      let unavailable=0,cursor=0,finalPublished=false;
      async function worker(){
        while(cursor<nums.length){
          const n=nums[cursor++];
          const folder=`ranking/${season.year}/${season.season}/week${pad(n)}/`;
          let data=null;
          try{
            data=await fetchJSON(folder+`ranking-week${pad(n)}-${season.season}${season.year}.json`);
            if(!data&&n<10)data=await fetchJSON(folder+`ranking-week${n}-${season.season}${season.year}.json`);
          }catch(_){data=null;}
          if(!data){unavailable++;continue;}
          const sorted=Array.isArray(data.entries)?data.entries:[];
          const isFinal=n===12&&/final/i.test(String(data.meta?.week||''));
          if(isFinal)finalPublished=true;
          if(n===0){
            const explicit=data.meta?.prelim_selection?.eliminated_entries;
            if(Array.isArray(explicit)){
              const byName=new Map(sorted.filter(e=>titleOf(e)).map(e=>[normalize(titleOf(e)),e]));
              for(const e of explicit){
                if(!titleOf(e))continue;
                eliminated.set(normalize(titleOf(e)),{...(byName.get(normalize(titleOf(e)))||{}),...e});
              }
            }
            continue;
          }
          for(const entry of sorted){
            const rank=num(entry?.rank);
            if(!Number.isInteger(rank)||rank<1||!titleOf(entry))continue;
            const id=identity(entry);
            if(!union.has(id))union.set(id,{item:{...entry},firstWeek:null,firstRank:null,bestRank:null,weeklyCount:0,topThree:0,final:null});
            const record=union.get(id);
            if(!kvOf(record.item)&&kvOf(entry))record.item.kv=kvOf(entry);
            // A Week 12 *Final* report is a season aggregate, not an extra weekly finish.
            if(isFinal){record.final={...entry};continue;}
            record.weeklyCount++;
            if(rank<=3)record.topThree++;
            record.bestRank=record.bestRank===null?rank:Math.min(record.bestRank,rank);
            if(record.firstWeek===null||n<record.firstWeek){record.firstWeek=n;record.firstRank=rank;}
          }
        }
      }
      await Promise.all(Array.from({length:Math.min(3,nums.length)},()=>worker()));
      const records=[...union.values()];
      // Preserve a useful fallback first week for a Final-only title without claiming a weekly debut.
      const entries=records.map(r=>({...r.item,firstWeek:r.firstWeek,firstRank:r.firstRank}));
      return {entries,records,finalPublished,eliminated:[...eliminated.values()],unavailable};
    })());
    return weeksCache.get(key);
  }
  function lookupRecord(records,item){
    const candidates=[identity(item),normalize(titleOf(item)),normalize(jpOf(item)),normalize(kvOf(item))].filter(Boolean);
    return records.find(r=>candidates.includes(identity(r.item))||
      candidates.includes(normalize(titleOf(r.item)))||
      candidates.includes(normalize(jpOf(r.item)))||
      candidates.includes(normalize(kvOf(r.item))))||null;
  }
  function closeDialog(){
    const veil=document.querySelector('.ob-r19-veil');
    if(!veil)return;
    const oldFocus=veil._oldFocus;
    veil.remove();document.body.classList.remove('ob-r19-modal-open');
    if(oldFocus?.isConnected)oldFocus.focus({preventScroll:true});
  }
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.querySelector('.ob-r19-veil')){e.preventDefault();closeDialog();}
    if(e.key!=='Tab')return;
    const veil=document.querySelector('.ob-r19-veil');if(!veil)return;
    const focusables=[...veil.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')];
    if(!focusables.length)return;
    if(e.shiftKey&&document.activeElement===focusables[0]){e.preventDefault();focusables.at(-1).focus();}
    else if(!e.shiftKey&&document.activeElement===focusables.at(-1)){e.preventDefault();focusables[0].focus();}
  });
  function detailLine(target,label,value){
    if(value===null||value===undefined||value==='')return;
    const row=make('div','ob-r19-detail-row');
    row.append(make('dt','',label),make('dd','',value));target.append(row);
  }
  // Keep the number prominent. The unit and maximum are quieter, not bolded.
  function detailMetric(target,label,value,unit){
    if(value===null||value===undefined||value==='')return;
    const row=make('div','ob-r19-detail-row ob-r20-metric');
    const dd=make('dd','');
    dd.append(make('span','ob-r20-value',value));
    if(unit)dd.append(make('span','ob-r20-unit',unit));
    row.append(make('dt','',label),dd);target.append(row);
  }
  function placeOf(n,lang){
    if(lang==='ja')return `${n}位`;
    const suffix=(n%100>=11&&n%100<=13)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');
    return `${n}${suffix} place`;
  }

  function makeLink(text,url){
    const a=make('a','ob-r19-detail-link',text);a.href=url;return a;
  }
  function drawGrid(target,season,entries,lang,opts={}){
    const grid=make('div','ob-r17-grid');const w=labels[lang];
    for(const item of entries.slice(0,120)){
      const btn=make('button','ob-r17-title');btn.type='button';
      const thumb=make('span','ob-r17-thumb');const url=imageOf(season,item);
      if(url){const img=make('img','');img.src=url;img.alt='';img.loading='lazy';
        img.onerror=()=>{img.remove();thumb.classList.add('ob-r17-empty');thumb.textContent=w.artMissing;};thumb.append(img);
      } else {thumb.classList.add('ob-r17-empty');thumb.textContent=w.artMissing;}
      const title=lang==='ja'?jpOf(item)||titleOf(item):titleOf(item)||jpOf(item);
      btn.append(thumb,make('span','ob-r17-title-name',title||'—'));
      if(opts.eliminated)btn.classList.add('ob-r17-eliminated');
      btn.setAttribute('aria-label',title||'—');
      btn.addEventListener('click',()=>showInfo(season,item,lang,btn));grid.append(btn);
    }
    target.append(grid);
  }
  async function showInfo(season,item,lang,trigger){
    closeDialog();const w=labels[lang];
    const veil=make('div','ob-r19-veil');veil._oldFocus=trigger;
    const dialog=make('section','ob-r19-modal');dialog.lang=lang;dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',w.details);
    const heading=make('div','ob-r19-modal-top');heading.append(make('span','ob-r19-eyebrow',w.details));
    const exit=make('button','ob-r19-close',w.close+' ×');exit.type='button';exit.addEventListener('click',closeDialog);heading.append(exit);
    const inner=make('div','ob-r19-modal-inner');
    const identityBlock=make('div','ob-r19-identity');
    const poster=make('img','ob-r19-poster');poster.alt='';poster.src=imageOf(season,item);poster.onerror=()=>poster.remove();
    const titleBlock=make('div','ob-r19-identity-text');
    const titleGroup=make('div','ob-r20-title-group');
    titleGroup.append(make('h3','',lang==='ja'?jpOf(item)||titleOf(item):titleOf(item)||jpOf(item)));
    if(lang==='ja'&&titleOf(item))titleGroup.append(make('p','ob-r19-alternate',titleOf(item)));
    if(lang==='en'&&jpOf(item))titleGroup.append(make('p','ob-r19-alternate',jpOf(item)));
    if(item.romanized_title)titleGroup.append(make('p','ob-r19-romanized',item.romanized_title));
    titleBlock.append(titleGroup);

    const studio=String(item.studios||item.info?.studios||item.info?.production_studio||item.fields?.production_studio||'').trim();
    if(studio)titleBlock.append(make('p','ob-r19-studio',`${w.studio}: ${studio}`));
    identityBlock.append(poster,titleBlock);inner.append(identityBlock);
    const status=make('p','ob-r19-loading',w.dataPending);inner.append(status);
    dialog.append(heading,inner);veil.append(dialog);document.body.append(veil);
    veil.addEventListener('click',e=>{if(e.target===veil)closeDialog();});
    document.body.classList.add('ob-r19-modal-open');exit.focus({preventScroll:true});
    const result=await fromWeekly(season);
    if(!veil.isConnected)return;
    const record=lookupRecord(result.records,item);
    const best=record?.item||item;
    if(!studio&&best.studios)titleBlock.append(make('p','ob-r19-studio',`${w.studio}: ${best.studios}`));
    if(!item.romanized_title&&best.romanized_title)titleGroup.append(make('p','ob-r19-romanized',best.romanized_title));
    const date=String(best.air_date||best.release_date||item.air_date||item.release_date||'').split(/\s+to\s+/i)[0].trim();
    if(date)titleBlock.append(make('p','ob-r19-air',`${w.airing}: ${date}`));
    status.remove();
    const stats=make('dl','ob-r19-stats');
    if(record&&record.firstWeek!==null){
      const first=Number(record.firstRank);
      detailMetric(stats,w.seen,`Week ${pad(record.firstWeek)}`,
        Number.isFinite(first)?` · ${placeOf(first,lang)}`:'');
      detailMetric(stats,w.weeklyAppearances,`${record.weeklyCount}`,` ${w.times}`);
      if(record.bestRank!==null){
        const rank=Number(record.bestRank);
        detailMetric(stats,w.bestWeekly,lang==='ja'?String(rank):`${rank}${(rank%100>=11&&rank%100<=13)?'th':({1:'st',2:'nd',3:'rd'}[rank%10]||'th')}`,` ${w.place}`);
      }
      detailMetric(stats,w.topThree,`${record.topThree}`,` ${w.times}`);
    }else{
       const noRank=make('div','ob-r19-detail-row ob-r21-unranked');
       noRank.append(make('dt','',w.seen),make('dd','',w.noWeekly));
       stats.append(noRank);
     }
    const fin=record?.final;
    if(fin){
      const rank=num(fin.rank),overall=num(fin.overall_rating),wrp=num(fin.wrp_score);
      if(rank===null)detailLine(stats,w.finalPlace,w.unknownRank);
      else detailMetric(stats,w.finalPlace,lang==='ja'?String(rank):placeOf(rank,lang).split(' ')[0],` ${w.place}`);
      if(overall!==null)detailMetric(stats,w.overallRating,String(overall),` ${w.points}`);
      if(wrp!==null)detailMetric(stats,w.wrp,wrp.toFixed(2),` ${w.points}`);
    }else detailLine(stats,w.finalPlace,result.finalPublished?w.notInFinal:w.notPublished);
    inner.append(stats);
    const six=fin?.key_elements_breakdown;
    if(six&&typeof six==='object'){
      const block=make('section','ob-r19-elements');
      const noteWrap=make('div','ob-r21-elements-copy');
       w.elementsNote.forEach((line,i)=>{
         const note=make('p','ob-r20-elements-note',line);
         if(i===0){
           const focus=lang==='ja'?'最終WRPに加算しています':'contribute to its final WRP';
           const at=line.indexOf(focus);
           if(at>=0)note.replaceChildren(document.createTextNode(line.slice(0,at)),
             make('strong','ob-r21-elements-emphasis',focus),
             document.createTextNode(line.slice(at+focus.length)));
         }
         noteWrap.append(note);
       });
       block.append(make('h4','',w.keyElements),noteWrap);
      const elements=make('dl','ob-r19-six');
      const keys=[
        ['op','OP',1.5],['ed','ED',1.5],
        ['acting',lang==='ja'?'演技':'Acting',0.5],
        ['sound/music',lang==='ja'?'音響・音楽':'Sound / Music',0.5],
        ['consistency/impact',lang==='ja'?'一貫性・印象':'Consistency / Impact',1],
        ['overall',lang==='ja'?'総合':'Overall',2]
      ];
      for(const [key,label,maximum] of keys){
        const value=num(six[key]);
        if(value!==null)detailMetric(elements,label,String(value),` / ${maximum} ${w.points}`);
      }
      if(num(six.total)!==null)detailMetric(elements,w.total,String(six.total),` / 7 ${w.points}`);
      block.append(elements);inner.append(block);
    }
    const synopsis=lang==='ja'?(best.synopsis_ja||item.synopsis_ja||best.synopsis||item.synopsis):(best.synopsis||item.synopsis);
    if(synopsis){const block=make('section','ob-r19-synopsis');block.append(make('h4','',w.synopsis));
      let clean=String(synopsis).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
      if(clean.length>360)clean=clean.slice(0,357).replace(/\s+\S*$/,'')+'…';
      const synopsisParagraph=make('p','',clean);
       // When Japanese synopsis is absent, give English fallback text its own language.
       if(lang==='ja' && !(best.synopsis_ja||item.synopsis_ja))synopsisParagraph.lang='en';
       block.append(synopsisParagraph);inner.append(block);
    }
    const links=make('div','ob-r19-actions');
    if(record&&record.firstWeek!==null)links.append(makeLink(w.firstLink,weekURL(season,record.firstWeek)));
    if(result.finalPublished)links.append(makeLink(w.finalLink,weekURL(season,12)));
    if(links.children.length)inner.append(links);
    if(result.unavailable)inner.append(make('p','ob-r19-partial',w.partial));
    const l=make('p','ob-r19-provenance',w.firstOnly);inner.append(l);
  }
  function appendHeading(section,text,count,unit){
    const h=make('h4','ob-r19-list-heading');
    h.append(make('span','ob-r19-list-label',text));
    if(Number.isFinite(count)){
      const amount=make('span','ob-r19-list-count');
      amount.append(make('b','',String(count)),document.createTextNode(' '+unit));h.append(amount);
    }
    section.append(h);
  }
  // R25: a typographic call-to-explore with no icon or arrow.
  function appendGalleryIntro(target,sourceNote,invite) {
    const row=make('div','ob-r24-gallery-intro');
    row.append(make('p','ob-r19-list-note',sourceNote));
    const hint=make('p','ob-r24-gallery-hint');
    hint.append(
      make('span','ob-r25-gallery-label',locale()==='ja'?'画像を選んでシーズン記録を見る':'EXPLORE SEASON RECORDS'),
      make('span','ob-r24-gallery-text',invite)
    );
    row.append(hint);
    target.append(row);
  }
  async function renderHistory({season,panel,active}){
    closeDialog();
    const id=Symbol();panelToken.set(panel,id);
    const isFresh=()=>panelToken.get(panel)===id&&active();
    const lang=locale(),w=labels[lang];panel.lang=lang;
    const title=make('h3','',w.snapshot),intro=make('p','ob-r17-intro',w.intro);
    const checkpoints=make('section','ob-r17-checkpoints');
    const postsArray=typeof posts!=='undefined'&&Array.isArray(posts)?posts:[];
    const seasonal=postsArray.filter(p=>String(p.year)===String(season.year)&&String(p.season).toLowerCase()===season.season&&(p.type==='tier'||p.type==='recommendation'));
    const stages=[['01',w.first],['06',w.middle],['12',w.final]];
    const row=make('div','ob-r19-stage-row');
    for(const [week,stage] of stages){
      const matched=seasonal.filter(p=>pad(p.week)===week);
      if(!matched.length)continue;
      const card=make('div','ob-r19-stage');
      card.append(make('span','ob-r19-stage-week',`Week ${week}`),make('h5','',stage));
      for(const p of matched){
        const link=make('a','ob-r19-stage-link',p.type==='tier'?w.tier:w.recommendation);
        link.href=new URL(p.url,base).href;card.append(link);
      }
      row.append(card);
    }
    if(row.children.length){
      checkpoints.append(make('h4','',w.checkpoints),make('p','ob-r19-checkpoint-note',w.checkpointIntro),row);
    }
    const how=make('details','ob-r17-how');
    how.append(make('summary','',w.description),make('p','',w.generic));
    const body=make('div','ob-r17-body');panel.replaceChildren(title,intro,checkpoints,how,body);
    const master=await masterFor(season);
    if(!isFresh())return;
    const m=master?masterItems(master):null;
    if(m&&m.items.length){
      if(m.verified)intro.textContent=w.introMaster;
       const box=make('section','ob-r17-lineup');
      appendHeading(box,m.verified?w.master:w.fromMaster,m.items.length,w.titles);
      appendGalleryIntro(box,m.verified?w.masterNote:w.notInitial,w.galleryInvite);
      drawGrid(box,season,m.items,lang);
      const explicit=Array.isArray(master.prelimEliminated)?master.prelimEliminated:[];
      if(explicit.length){
        appendHeading(box,w.preliminary,explicit.length,w.titles);
        box.append(make('p','ob-r19-list-note',w.prelimNote));
        drawGrid(box,season,explicit,lang,{eliminated:true});
      }
      body.append(box);return;
    }
    body.append(make('p','ob-r17-nomaster',w.noMaster));
    const btn=make('button','ob-r17-load',w.preload);btn.type='button';
    btn.setAttribute('aria-expanded','false');
    const holder=make('div','ob-r19-results');holder.hidden=true;
    body.append(btn,holder);
    const historyKey=`${season.year}-${season.season}`;
    let hasLoaded=false;
    btn.addEventListener('click',async()=>{
      if(hasLoaded){
        holder.hidden=!holder.hidden;
        if(holder.hidden)openHistoryLists.delete(historyKey);
        else openHistoryLists.add(historyKey);
        btn.textContent=holder.hidden?w.preload:w.hideList;
        btn.setAttribute('aria-expanded',String(!holder.hidden));
        return;
      }
      btn.disabled=true;btn.textContent=w.loading;
      const result=await fromWeekly(season);
      if(!isFresh())return;
      btn.disabled=false;hasLoaded=true;openHistoryLists.add(historyKey);btn.textContent=w.hideList;
      btn.setAttribute('aria-expanded','true');holder.hidden=false;
      if(result.entries.length){
        const block=make('section','ob-r17-lineup');
        appendHeading(block,w.recorded,result.entries.length,w.titles);
        appendGalleryIntro(block,w.recordedNote,w.galleryInvite);
        drawGrid(block,season,result.entries,lang);holder.append(block);
      }else holder.append(make('p','',w.noEntries));
      if(result.eliminated.length){
        const block=make('section','ob-r17-lineup');
        appendHeading(block,w.preliminary,result.eliminated.length,w.titles);
        block.append(make('p','ob-r19-list-note',w.prelimNote));
        drawGrid(block,season,result.eliminated,lang,{eliminated:true});holder.append(block);
      }
      if(result.unavailable)holder.append(make('p','ob-r17-warning',`${w.failed} (${result.unavailable})`));
    });
    if(openHistoryLists.has(historyKey))btn.click();
  }
  // R16's internal archive renderer delegates to this when installed.
  window.OFFBEAT_R17={renderHistory};
  function enhanceArchive(){
    const holder=document.querySelector('.anime09 .n-index-filters');
    if(!holder||document.getElementById('offbeatArchiveWeekFilter')||typeof window.renderAnime!=='function')return;
    const label=make('label','ob-r17-week-label','WEEK ');
    const select=make('select','');select.id='offbeatArchiveWeekFilter';
    select.setAttribute('aria-label','Archive week / アーカイブの週');
    select.append(new Option('ALL WEEKS','all'));
    for(let n=0;n<=12;n++)select.append(new Option(n===0?'PRELIM / 00':`WEEK ${pad(n)}`,pad(n)));
    label.append(select);holder.append(label);
    // Rendering is left to the existing Post Index and card creator; R17 hides only
    // nonmatching article rows and empty month groups after that native rendering.
    const renderOriginal=window.renderAnime;
    window.renderAnime=function(...args){
      const returned=renderOriginal.apply(this,args);
      const value=select.value;
      if(value==='all')return returned;
      const archive=document.getElementById('animeArchive');if(!archive)return returned;
      let matches=0;
      for(const group of archive.querySelectorAll('.cards')){
        let count=0;
        for(const card of group.querySelectorAll('.n-archive-row')){
          const href=card.querySelector('a.thumb[href]')?.getAttribute('href')||'';
          const matched=/\/week(\d{2})\//i.exec(href);
          const visible=Boolean(matched&&matched[1]===value);
          card.hidden=!visible;
          if(visible){count++;matches++;}
        }
        group.hidden=count===0;
        const month=group.previousElementSibling;
        if(month?.classList.contains('archive-title'))month.hidden=count===0;
      }
      if(!matches){
        const p=make('p','ob-r17-empty',locale()==='ja'?'該当する公開済みの記事はありません。':'No published posts match this week.');
        archive.append(p);
      }
      return returned;
    };
    select.addEventListener('change',()=>{
      const current=document.querySelector('.anime09 [data-filter][aria-pressed="true"]')?.dataset.filter||'all';
      window.renderAnime(current);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceArchive,{once:true});
  else enhanceArchive();
})();
