// recommendations.js  (EN/JA 両対応・単一ファイル版)

// ====== 基本設定・パス推定 ======
const path = window.location.pathname;
const segments = path.split('/');
// 例: /animeb-v1/features/recommend/2025/summer/week06/
const year = segments[segments.indexOf('recommend') + 1];     // "2025"
const season = segments[segments.indexOf('recommend') + 2];   // "summer"
const weekSlug = segments[segments.indexOf('recommend') + 3]; // "week06"
const week = weekSlug.replace(/^week/, '');

const basePath  = `/animeb-v1/features/recommend/${year}/${season}/${weekSlug}/`;
const imageBase = `/animeb-v1/images/key-visuals/${year}/${season}/`;

const recommendPath = `${basePath}recommend-${year}-${season}-${weekSlug}.json`;
const enjoyPath     = `${basePath}enjoyment-ranking-${year}-${season}-${weekSlug}.json`;

console.log("Recommend JSON Path:", recommendPath);
console.log("Enjoyment JSON Path:", enjoyPath);

// ====== 言語判定 ======
const IS_JA = /^ja/i.test(document.documentElement.lang || "");
const LANG_CLASS = IS_JA ? 'lang-ja' : 'lang-en';

// ====== 括弧内表記：例外オーバーライド（モード → KV一覧） ======
// モード: 'none' | 'en' | 'romaji' | 'en+romaji'
// ここに KV を並べるだけで、該当作の括弧表示を上書きできます。
// ※記載が無ければ既定の auto 規則で判断
const PAREN_OVERRIDE = {
  none:       new Set(['samapoke', 'city']),
  en:         new Set([
    // 例: 'buta-santa', 'food'
  ]),
  romaji:     new Set([
    // 例: 'kijin'
  ]),
  'en+romaji': new Set([
    // 例: 'bisque'
  ]),
};
// KVの別名を許す場合はここに追記（旧→新）
const KV_ALIAS = {
  // 'buta': 'buta-santa',
};

// ====== 汎用ピッカー ======
function aliasKV(kv) {
  if (!kv) return '';
  const k = String(kv).trim();
  return KV_ALIAS[k] || k;
}
function pickJPTitle(entry) {
  return entry.jpTitle || entry.title_ja || entry.title_jp || entry.native_title || "";
}
function pickENTitle(entry) {
  return entry.title || entry.title_en || "";
}
function pickRomaji(entry) {
  return entry.romanized_title || entry.romaji || entry.romanizedTitle || "";
}
function equalish(a, b) {
  const norm = (s) => String(s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s'’"“”\-—–_:;.,!?()［\]【】（）]/g, "");
  return !!a && !!b && norm(a) === norm(b);
}

// auto 規則（JAページの括弧決定）
function decideParenAuto({ jp, en, romaji }) {
  if (en && !equalish(jp, en)) return en;       // 英題が“別物”なら英題
  if (!en && romaji)        return romaji;      // 英題が無ければローマ字
  if (en && equalish(jp, en)) return "";        // 実質同名なら括弧なし
  return "";                                    // それ以外はなし
}

// 例外テーブルのモード取得
function getParenModeForKV(kvRaw) {
  const kv = aliasKV(kvRaw);
  for (const mode of Object.keys(PAREN_OVERRIDE)) {
    if (PAREN_OVERRIDE[mode].has(kv)) return mode;
  }
  return 'auto';
}

// JAページ用：括弧内文字列を構築（'' なら括弧出さない）
function buildParenForJA(entry) {
  const kv = aliasKV(entry.kv || "");
  const jp = pickJPTitle(entry);
  const en = pickENTitle(entry);
  const ro = pickRomaji(entry);
  const mode = getParenModeForKV(kv);

  const make = (s) => s ? `(${s})` : "";

  switch (mode) {
    case 'none':        return "";
    case 'en':          return make(en);
    case 'romaji':      return make(ro);
    case 'en+romaji':   return make([en, ro].filter(Boolean).join(" / "));
    default: {
      const decided = decideParenAuto({ jp, en, romaji: ro });
      return make(decided);
    }
  }
}

// レビュー/コメント（Rec）
function pickReviewForRec(entry) {
  if (IS_JA) {
    return (entry?.review?.jp || entry?.review?.ja || entry?.review_jp || entry?.review?.en || "").trim();
  }
  return (entry?.review?.en || entry?.review?.jp || "").trim();
}

// ====== ページメタ更新 ======
// 年・季節の正本はページURL。日付とステージはRecommendation JSONのmeta。
const PAGE_YEAR = year;
const PAGE_SEASON = season;

function formatDateJA(rawDate) {
  const dateText = String(rawDate || '').trim();
  const monthNumbers = {
    january: 1, february: 2, march: 3, april: 4,
    may: 5, june: 6, july: 7, august: 8,
    september: 9, october: 10, november: 11, december: 12
  };
  const match = dateText.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  const month = match && monthNumbers[match[1].toLowerCase()];
  return month
    ? `${match[3]}年${month}月${Number(match[2])}日`
    : dateText;
}

function updatePageMeta(meta) {
  const metaYear = String(meta.year || '').trim();
  const metaSeason = String(meta.season || '').trim().toLowerCase();
  if ((metaYear && metaYear !== PAGE_YEAR) ||
      (metaSeason && metaSeason !== PAGE_SEASON.toLowerCase())) {
    console.warn('[Recommendations] URL and JSON year/season differ. Displaying the URL values.', {
      url: `${PAGE_YEAR}/${PAGE_SEASON}`,
      json: `${metaYear}/${metaSeason}`
    });
  }

  const stage = meta.recommendationstage || meta.recommendationStage || '';
  const date = meta.seasondate || meta.seasonDate || '';
  const displayDate = IS_JA ? formatDateJA(date) : date;
  const seasonName = PAGE_SEASON.charAt(0).toUpperCase() + PAGE_SEASON.slice(1).toLowerCase();
  const seasonJPMap = { Spring: '春', Summer: '夏', Fall: '秋', Winter: '冬' };
  const seasonJP = seasonJPMap[seasonName] || seasonName;
  const stageJA = /mid/i.test(stage)
    ? '中盤折り返しおすすめ作品'
    : /end/i.test(stage)
      ? 'シーズン終了時おすすめ作品'
      : stage;

  document.querySelectorAll('.season').forEach(el => {
    el.textContent = IS_JA
      ? `${PAGE_YEAR}年${seasonJP}`
      : `${seasonName} ${PAGE_YEAR}`;
  });

  document.querySelectorAll('.stage').forEach(el => {
    el.textContent = IS_JA
      ? stageJA
      : stage ? `${stage} Recommendations` : 'Recommendations';
  });

  document.querySelectorAll('.update-date').forEach(el => {
    el.textContent = IS_JA
      ? `最終更新日: ${displayDate}`
      : `Last updated: ${displayDate}`;
  });

  const footer = document.querySelector('footer');
  if (footer) {
    const dateLine = Array.from(footer.querySelectorAll('p'))
      .find(p => /Last updated|最終更新日/i.test(p.textContent));
    if (dateLine) {
      dateLine.textContent = IS_JA
        ? `最終更新日: ${displayDate}`
        : `Last updated: ${displayDate}`;
    }
  }

  document.title = IS_JA
    ? `${PAGE_YEAR}年${seasonJP}アニメ ${stageJA}`
    : `${seasonName} ${PAGE_YEAR} Anime ${stage} Recommendations`;
}

// ===== AnimeB v1.1: bilingual, optional series information =====
// Existing EN/JA JSON and Master-assisted JSON both remain supported.
function infoText(value) {
  if (value === null || value === undefined || value === 0) return '';
  const text = String(value).trim();
  return /^(?:0|n\/?a|none|null|undefined|not available|tbd|—|-)$/i.test(text) ? '' : text;
}
function infoPick(...values) { for (const v of values) { const x = infoText(v); if (x) return x; } return ''; }
function infoEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
// Preserve harmless editorial emphasis/line breaks in existing reviews without allowing script HTML.
function infoReviewHTML(value) {
  const input = document.createElement('template');
  input.innerHTML = String(value || '');
  const allowed = new Set(['B','STRONG','EM','I','U','BR','P','SUP','SUB']);
  const blocked = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM']);
  const clean = node => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue);
    if (node.nodeType !== Node.ELEMENT_NODE || blocked.has(node.tagName)) return document.createDocumentFragment();
    const safe = allowed.has(node.tagName) ? document.createElement(node.tagName.toLowerCase()) : document.createDocumentFragment();
    [...node.childNodes].forEach(child=>safe.appendChild(clean(child)));
    return safe;
  };
  const output = document.createElement('div');
  [...input.content.childNodes].forEach(node=>output.appendChild(clean(node)));
  return output.innerHTML;
}
function localized(entry, key, ...fallbacks) {
  return IS_JA
    ? infoPick(entry[key + '_ja'], entry[key + '_jp'], entry[key], ...fallbacks)
    : infoPick(entry[key + '_en'], entry[key], ...fallbacks);
}
const INFO_TRANSLATIONS = {
  genre: {Action:'アクション',Adventure:'冒険',Comedy:'コメディ',Drama:'ドラマ',Fantasy:'ファンタジー',Romance:'恋愛',
    'Slice of Life':'日常','Sci-Fi':'SF',Mystery:'ミステリー',Horror:'ホラー',Psychological:'心理',Sports:'スポーツ',
    Mecha:'ロボット',Supernatural:'超常現象',Thriller:'スリラー',Ecchi:'お色気',Historical:'歴史',Music:'音楽',
    School:'学園',Isekai:'異世界',Suspense:'サスペンス'},
  base: {'Manga':'漫画','Light Novel':'ライトノベル','Novel':'小説','Original':'オリジナル','Web Comics':'ウェブ漫画',
    'Web Comic':'ウェブ漫画','Web Novel':'ウェブ小説','Visual Novel':'ビジュアルノベル','Game':'ゲーム','Video Game':'ゲーム',
    'Naro':'なろう系','4-koma Manga':'4コマ漫画','Light Novels':'ライトノベル',
    'Mangas':'漫画','Web Comics':'ウェブ漫画','Anime':'アニメ','Mobile Game':'モバイルゲーム','Comic':'コミック'}
};
const INFO_LABELS = IS_JA ? {
  studio:'制作会社',director:'監督',series:'シリーズ構成',details:'＋ 詳細情報',
  release:'放送開始日',romaji:'ローマ字表記',creator:'原作者・出版社',episodes:'話数',seasonEps:'今期の話数',
  allEps:'シリーズ総話数',cast:'キャスト',op:'オープニング',ed:'エンディング',site:'公式サイト',
  external:'外部評価',streaming:'配信サービス',broadcast:'放送情報',synopsis:'作品概要'
} : {
  studio:'Production Studio',director:'Director',series:'Series Composition',details:'＋ More details',
  release:'Release Date',romaji:'Romanized Title',creator:'Original Creator / Publisher',episodes:'Episodes',
  seasonEps:'This Season',allEps:'Series Total Episodes',cast:'Cast',op:'Opening Theme',ed:'Ending Theme',site:'Official Website',
  external:'External Scores',streaming:'Streaming Services',broadcast:'Broadcast',synopsis:'Synopsis'
};
function pickBasedOn(entry) { return infoPick(entry.based_on, entry.base); }
function parseGenres(value) {
  return (Array.isArray(value) ? value : String(value || '').split('|')).map(infoText).filter(Boolean);
}
function infoTags(entry) {
  const rawGenre = parseGenres(entry.genre);
  const genres = [...new Set(rawGenre.map(x => IS_JA ? (INFO_TRANSLATIONS.genre[x] || x) : x))];
  const base = pickBasedOn(entry);
  const baseLabel = IS_JA ? (INFO_TRANSLATIONS.base[base] || base) : base;
  const chips = [...genres.map(x=>`<span class="animeb-chip animeb-genre">${infoEscape(x)}</span>`),
     ...(baseLabel ? [`<span class="animeb-chip animeb-based">${infoEscape(baseLabel)}</span>`] : [])];
  return chips.length ? `<div class="animeb-info-tags">${chips.join('')}</div>` : '';
}
function studioName(entry) { return localized(entry,'studios'); }
function directorName(entry) { return localized(entry,'director',entry.creators); }
function seriesName(entry) { return localized(entry,'series_composition', entry.seriesComposition); }
function basicMeta(entry) {
  const lines = [
    [INFO_LABELS.studio,studioName(entry)],
    [INFO_LABELS.director,directorName(entry)],
    [INFO_LABELS.series,seriesName(entry)]
  ].filter(x=>!!x[1]);
  return lines.length ? `<div class="animeb-basic-meta">${lines.map(([label,value])=>
      `<span class="animeb-basic-item"><strong>${infoEscape(label)}:</strong> ${infoEscape(value)}</span>`).join('')}</div>` : '';
}
function officialLinks(value) {
  const urls = String(value || '').split('|').map(x=>x.trim()).filter(Boolean);
  const unique = [...new Set(urls)].filter(x => /^https?:\/\/[^\s]+$/i.test(x));
  return unique.map((url,i)=>`<a href="${infoEscape(url)}" target="_blank" rel="noopener noreferrer">${infoEscape(unique.length>1?`${IS_JA?'公式サイト':'Official Site'} ${i+1}`:url)}</a>`).join('<span class="animeb-link-break"></span>');
}
function castList(value) {
  const cast = infoText(value).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  return cast.length ? `<div class="animeb-cast-grid">${cast.map(x=>`<span>${infoEscape(x)}</span>`).join('')}</div>` : '';
}
function moreDetailHTML(entry) {
  // Fields already visible in the card (genres, source, studio, director, composition) are not repeated.
  const cells = [
    [INFO_LABELS.release,infoPick(entry.release_date)],
    [INFO_LABELS.creator,localized(entry,'original_creator_publisher')],
    [INFO_LABELS.episodes,infoPick(entry.episode_count)],
    [INFO_LABELS.seasonEps,infoPick(entry.total_eps_this_season)],
    [INFO_LABELS.allEps,infoPick(entry.seasons_total_ep_cnt)],
    [INFO_LABELS.broadcast,localized(entry,'broadcast',entry.broadcast_info)],
    [INFO_LABELS.streaming,localized(entry,'streaming_services')],
    [INFO_LABELS.external,infoPick(entry.external_scores)]
  ].filter(x=>!!x[1]);
  const cellHTML = cells.length ? `<div class="animeb-details-grid">${cells.map(([label,value])=>
    `<div class="animeb-detail-pair"><span class="animeb-detail-label">${infoEscape(label)}</span><span class="animeb-detail-value">${infoEscape(value)}</span></div>`).join('')}</div>` : '';
  const synopsis = localized(entry,'synopsis');
  const cast = castList(entry.cast);
  const songRows = [[INFO_LABELS.op,infoPick(entry.opening_theme,entry.op)],
    [INFO_LABELS.ed,infoPick(entry.ending_theme,entry.ed)]].filter(x=>!!x[1]);
  const songHTML = songRows.length ? `<div class="animeb-details-grid animeb-songs">${songRows.map(([label,value])=>
    `<div class="animeb-detail-pair"><span class="animeb-detail-label">${infoEscape(label)}</span><span class="animeb-detail-value">${infoEscape(value)}</span></div>`).join('')}</div>` : '';
  const links = officialLinks(entry.official_website);
  const more = cellHTML
    + (synopsis ? `<section class="animeb-details-full"><h4>${INFO_LABELS.synopsis}</h4><p class="animeb-synopsis">${infoEscape(synopsis)}</p></section>` : '')
    + (cast ? `<section class="animeb-details-full"><h4>${INFO_LABELS.cast}</h4>${cast}</section>` : '')
    + songHTML
    + (links ? `<section class="animeb-details-full"><h4>${INFO_LABELS.site}</h4><div class="animeb-official-links">${links}</div></section>` : '');
  return more ? `<details class="animeb-more"><summary>${INFO_LABELS.details}</summary><div class="animeb-more-body">${more}</div></details>` : '';
}
function cardKV(entry) {
  const kv = infoText(entry.kv);
  const title = infoEscape(pickENTitle(entry));
  return kv ? `<img class="animeb-kv" src="${infoEscape(imageBase+encodeURIComponent(kv)+'.webp')}" alt="${title}" loading="lazy">` : '';
}

// ====== Recommendations: cumulative tiers (not individual ranks) ======
// Add a quiet, localized hint without changing the original heading/catchcopy.
// Top 3 stays unchanged; Top 5 = two additional titles, Top 8 = three, Top 10 = two.
function addRecommendationIncrementHints() {
  const additional = { 5: 2, 8: 3, 10: 2 };
  document.querySelectorAll('.section > h2').forEach(heading => {
    if (heading.querySelector('.animeb-add-more')) return; // Idempotent
    const headingLabel = heading.firstChild?.textContent || '';
    const match = headingLabel.match(/(?:Top\s*|ベスト\s*)(5|8|10)(?!\d)/i);
    if (!match) return;
    const count = additional[Number(match[1])];
    if (!count) return;
    const hint = document.createElement('span');
    hint.className = 'animeb-add-more';
    hint.textContent = IS_JA ? `さらに${count}作品 ` : `ADD ${count} MORE `;
    const description = heading.querySelector('.class-description');
    heading.insertBefore(hint, description || null);
  });
}

// ====== 起動処理 ======
document.addEventListener('DOMContentLoaded', () => {
  addRecommendationIncrementHints();
  // プレースホルダー除去
  document.querySelectorAll('.section').forEach(section => {
    section.querySelectorAll('.card, .small-card, .watch-ranking-item').forEach(el => el.remove());
  });

  // Recommendations
  fetch(recommendPath)
    .then(res => res.json())
    .then(data => {
      updatePageMeta(data.meta || {});
      renderMainEntries(data.entries || []);
    });

  // Enjoyment
  renderEnjoymentRankingFromJson(enjoyPath);
});

// ====== Recommendations 描画 ======
function renderMainEntries(entries) {
  entries.forEach(entry => {
    const html = generateCard(entry);
    if (entry.rank <= 3) {
      document.querySelector('.section:nth-of-type(1)').insertAdjacentHTML('beforeend', html);
    } else if (entry.rank <= 5) {
      document.querySelector('.section:nth-of-type(2)').insertAdjacentHTML('beforeend', html);
    } else if (entry.rank <= 8) {
      document.querySelector('.section:nth-of-type(3)').insertAdjacentHTML('beforeend', html);
    } else if (entry.rank <= 10) {
      document.querySelector('.section:nth-of-type(4)').insertAdjacentHTML('beforeend', html);
    } else {
      document.querySelector('.section:nth-of-type(5)').insertAdjacentHTML('beforeend', html);
    }
  });
}

function generateCard(entry) {
  const mainTitle = IS_JA ? (pickJPTitle(entry) || pickENTitle(entry)) : pickENTitle(entry);
  const parenText = IS_JA ? buildParenForJA(entry) : (pickRomaji(entry) ? `(${pickRomaji(entry)})` : '');
  const review = pickReviewForRec(entry);
  const tierClass = (entry.rank <= 3) ? 'tier-top3' : (entry.rank <= 5) ? 'tier-top5' :
    (entry.rank <= 8) ? 'tier-top8' : (entry.rank <= 10) ? 'tier-top10' : 'tier-additional';
  const large = entry.rank <= 5;
  const titleHTML = `<span class="title-en">${infoEscape(mainTitle)}</span>${parenText ?
      `<span class="title-romaji"> ${infoEscape(parenText)}</span>` : ''}`;
  return `
    <div class="${large?'card':'small-card'} animeb-info-card ${LANG_CLASS} ${tierClass}">
      <div class="animeb-recommend-main">
        ${cardKV(entry)}
        <div class="${large?'card-content':'animeb-small-content'}">
          <div class="${large?'card-title':'small-title'}">${titleHTML}</div>
          ${infoTags(entry)}
          ${basicMeta(entry)}
          ${review ? `<div class="review-text ${LANG_CLASS}">${infoReviewHTML(review)}</div>` : ''}
        </div>
      </div>
      ${moreDetailHTML(entry)}
    </div>`;
}

// ====== Enjoyment Ranking: JSON → HTML ======

function getEnjoymentSection() {
  // JA/ENどちらでも検出できるよう見出し文字を多言語対応
  const sections = Array.from(document.querySelectorAll(".section"));
  const isEnjoyHead = (el) => {
    const txt = (el.textContent || "").trim();
    return /enjoyment/i.test(txt) || /楽し|エンジョイ/.test(txt);
  };
  let found = sections.find(sec => {
    const h = sec.querySelector("h1, h2, h3");
    return h && isEnjoyHead(h);
  });
  // 見つからなければ最後のセクションをフォールバック
  return found || sections[sections.length - 1] || null;
}

function clearEnjoymentItems(sectionEl) {
  if (!sectionEl) return;
  sectionEl.querySelectorAll(".watch-ranking-item").forEach(el => el.remove());
}

// 注記整形（既存）
function formatNoteEn(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  if (/※\s*not\s*ranked/i.test(s)) return s.replace(/※\s*not\s*ranked/ig, "※Not ranked");
  if (/not\s*ranked/i.test(s))     return s.replace(/(^|\b)not\s*ranked(\b|$)/ig, "※Not ranked").trim();
  if (/※\s*complete/i.test(s))     return s.replace(/※\s*complete/ig, "※Complete");
  if (/\bcomplete\b/i.test(s))     return s.replace(/\bcomplete\b/ig, "※Complete").trim();
  return s;
}
function formatNoteJp(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  if (/※\s*対象外/.test(s)) return s.replace(/※\s*対象外/g, "※対象外");
  if (/対象外/.test(s))      return s.replace(/対象外/g, "※対象外").trim();
  if (/※\s*放送終了/.test(s)) return s.replace(/※\s*放送終了/g, "※放送終了");
  if (/放送終了/.test(s))     return s.replace(/放送終了/g, "※放送終了").trim();
  return s;
}

// コメント（Enjoyment）
function pickCommentEN(entry) {
  const en = (entry?.comment_en || "").trim();
  return en.replace(/^\s*[—-]\s*/, "");
}
function pickCommentJP(entry) {
  const jp = (entry?.comment_jp || entry?.comment_ja || "").trim();
  return jp.replace(/^\s*[—-]\s*/, "");
}

function createWatchRankingItem(entry, indexForFallback) {
  const rankNum = (typeof entry.rank === 'number' && Number.isFinite(entry.rank))
    ? entry.rank : (indexForFallback + 1);
  const mainTitle = IS_JA ? (pickJPTitle(entry) || pickENTitle(entry)) : pickENTitle(entry);
  const parenText = IS_JA ? buildParenForJA(entry) : (pickRomaji(entry) ? `(${pickRomaji(entry)})` : '');
  const noteEN = formatNoteEn(entry.note_en || '');
  const noteJP = formatNoteJp(entry.note_jp || '');
  const noteText = IS_JA ? (noteJP || noteEN) : (noteEN || noteJP);
  const item = document.createElement('div');
  item.className = 'watch-ranking-item animeb-enjoyment-card ' + LANG_CLASS;
  const title = `<div class="watch-title"><span class="animeb-rank">${infoEscape(rankNum)}.</span> `+
    `<span class="title-en">${infoEscape(mainTitle)}</span>`+
    (parenText ? `<span class="title-romaji"> ${infoEscape(parenText)}</span>` : '')+
    (noteText ? `<span class="note"> ${infoEscape(noteText)}</span>` : '') + '</div>';
  const comment = IS_JA ? (pickCommentJP(entry) || pickCommentEN(entry)) : pickCommentEN(entry);
  item.innerHTML = `
    <div class="animeb-enjoyment-main">
      ${cardKV(entry)}
      <div class="animeb-enjoyment-top">
        ${title}
        ${infoTags(entry)}
        ${basicMeta(entry)}
      </div>
    </div>
    ${comment ? `<div class="comment comment-text ${LANG_CLASS}">${infoEscape(comment)}</div>` : ''}
    ${moreDetailHTML(entry)}`;
  return item;
}

async function renderEnjoymentRankingFromJson(jsonUrl) {
  const section = getEnjoymentSection();
  if (!section) return;

  clearEnjoymentItems(section);

  let data;
  try {
    const res = await fetch(jsonUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to fetch ${jsonUrl} (${res.status})`);
    data = await res.json();
  } catch (err) {
    console.error("[Enjoyment] JSON読込エラー:", err);
    return;
  }

  const entries = Array.isArray(data?.enjoymentRanking) ? data.enjoymentRanking.slice() : [];
  entries.sort((a, b) => {
    const ra = (typeof a.rank === "number" && Number.isFinite(a.rank)) ? a.rank : Infinity;
    const rb = (typeof b.rank === "number" && Number.isFinite(b.rank)) ? b.rank : Infinity;
    return ra - rb;
  });

  let anchor = section.querySelector("p.note") || section.querySelector("h1, h2") || section;
  entries.forEach((entry, i) => {
    const item = createWatchRankingItem(entry, i);
    anchor.insertAdjacentElement('afterend', item);
    anchor = item;
  });
}
