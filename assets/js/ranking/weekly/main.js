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
      val.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).forEach(item=>{
        const span=document.createElement('span'); span.textContent=item; grid.appendChild(span);
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
  const statusTranslations={watching:['Watching','視聴中'],droppedThisWeek:['Dropped','今週の視聴中止'],droppedTotal:['Total dropped','視聴中止合計'],backOnList:['Back on List','復帰'],noAir:['NoAir','放送なし'],completed:['Completed','完走'],total:['Total','合計']};
  document.querySelectorAll('.watch-status .ws-item[data-tooltip]').forEach(node=>{
    const key=node.dataset.tooltip; const count=node.dataset.statusValue;
    const label=statusTranslations[key]?.[ja?1:0];
    const target=node.querySelector('.view-count');
    if(label && count!==undefined && target) target.textContent=`${label}:${count}`;
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

// ========== JSON読み込み & DOM更新 ==========
fetch(jsonPath)
  .then(response => {
    console.log(`🔍 Response status: ${response.status}`);
    if (!response.ok) throw new Error("Fetch failed");
    return response.json();
  })
.then(data => {

  console.log(`✅ Successfully fetched: ranking-${currentWeek}-${season}${year}.json`);
  
  const isFinalWeek = (data.meta.week || "").toLowerCase().includes("final");

  
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
    function updateWatchStatus(metaStatus) {
      if (!metaStatus) return;

      const labelMap = {
        watching: 'Watching',
        droppedThisWeek: 'Dropped',
        droppedTotal: 'Total dropped',
        backOnList: 'Back on List', // 追加
        noAir: 'NoAir',
        completed: 'Completed',
        total: 'Total'
      };

      document.querySelectorAll('.watch-status .ws-item').forEach(item => {
  const key = item.dataset.tooltip;
  const label = labelMap[key];
  const count = metaStatus[key];
  const target = item.querySelector('.view-count'); // ← 明示的にここだけ書き換える
  // 空欄やnull/undefinedはスキップ（ただし0は表示）
    if (target && String(count).trim() !== "") {
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
      showTooltip(e, animebWeeklyTooltipFor(key));
    });

    el.addEventListener('mousemove', (e) => {
      moveTooltip(e);
    });

    el.addEventListener('mouseleave', () => {
      hideTooltip();
    });

    el.addEventListener('click', (e) => {
      showTooltip(e, animebWeeklyTooltipFor(key));
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
        container.innerHTML = html;

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
  container.classList.toggle("expanded");
  triangle.classList.toggle("rotate");

  const label = container.classList.contains("expanded") ? "CLOSE" : "OVERVIEW";

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
    <li><span class="key">合計</span>：Prelim時点で選んだ初期評価候補数。</li></ul>
    <p class="tooltip-note">「視聴中」には、その週に見た作品をすべて含みます。</p>`
};
function animebWeeklyTooltipFor(key) {
  return (animebWeeklyLang==='ja' ? animebInfoMapJa[key] : infoMap[key]) || infoMap[key] || '';
}

// Bind the initial icons once. Dynamically mounted header icons are bound after JSON loading.
setupInfoTriggers();


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
  tooltip.style.display = 'none';
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
