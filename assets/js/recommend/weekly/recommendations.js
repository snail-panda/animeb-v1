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

// ====== 起動処理 ======
document.addEventListener('DOMContentLoaded', () => {
  // プレースホルダー除去
  document.querySelectorAll('.section').forEach(section => {
    section.querySelectorAll('.card, .small-card, .watch-ranking-item').forEach(el => el.remove());
  });

  // Recommendations
  fetch(recommendPath)
    .then(res => res.json())
    .then(data => renderMainEntries(data.entries || []));

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
  const kvImage = `${imageBase}${entry.kv}.webp`;

  // タイトル・括弧
  const mainTitle = IS_JA ? (pickJPTitle(entry) || pickENTitle(entry)) : pickENTitle(entry);
  const parenText = IS_JA ? buildParenForJA(entry) : (pickRomaji(entry) ? `(${pickRomaji(entry)})` : '');

  // メタ（スタジオは英語のまま表示）
  const studioText = entry.studios ? `Studio: ${entry.studios}` : '';

  // レビュー本文
  const review = pickReviewForRec(entry);

  // ランク帯クラス（Recommendations のカード用）
  const tierClass =
     (entry.rank <= 3) ? 'tier-top3' :
     (entry.rank <= 5) ? 'tier-top5' :
     (entry.rank <= 8) ? 'tier-top8' :
     (entry.rank <= 10) ? 'tier-top10' : 'tier-additional';

  // details ラベル（Rec は既存踏襲。必要になったらJA化）
  const L = {
    details: "＋ More details",
    dir: "Director:",
    series: "Series comp:",
    based: "Based on:",
    synopsis: "Synopsis:"
  };

  if (entry.rank <= 5) {
    return `
      <div class="card ${LANG_CLASS} ${tierClass}">
        <img src="${kvImage}" alt="${pickRomaji(entry) || mainTitle}">
        <div class="card-content">
          <div class="card-title">
            <span class="title-en">${mainTitle}</span>
            ${parenText ? `<span class="title-romaji"> ${parenText}</span>` : ""}
          </div>
          <div class="studio">${studioText}</div>
          ${review ? `<p class="review-text ${LANG_CLASS}">${review}</p>` : ""}
          <details>
            <summary>${L.details}</summary>
            <p>
              <strong>${L.dir}</strong> ${entry.creators || ''}<br>
              <strong>${L.series}</strong> ${entry.seriesComposition || ''}<br>
              <strong>${L.based}</strong> ${entry.based_on || ''}<br>
              <strong>${L.synopsis}</strong> ${entry.synopsis || ''}
            </p>
          </details>
        </div>
      </div>`;
  } else {
    return `
      <div class="small-card ${LANG_CLASS} ${tierClass}">
        <img src="${kvImage}" alt="${pickRomaji(entry) || mainTitle}">
        <div>
          <div class="small-title">
            <span class="title-en">${mainTitle}</span>
            ${parenText ? `<span class="title-romaji"> ${parenText}</span>` : ""}
          </div>
          <div class="studio">${studioText}</div>
          ${review ? `<div class="review-text ${LANG_CLASS}">${review}</div>` : ""}
        </div>
      </div>`;
  }
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
  const rankNum = (typeof entry.rank === "number" && Number.isFinite(entry.rank))
    ? entry.rank : (indexForFallback + 1);

  // タイトル・括弧（JAは和題を主、ENは英題を主）
  const mainTitle = IS_JA ? (pickJPTitle(entry) || pickENTitle(entry)) : pickENTitle(entry);
  const parenText = IS_JA ? buildParenForJA(entry) : (pickRomaji(entry) ? `(${pickRomaji(entry)})` : "");

  // 注記（EN優先→JP）
  const noteEN = formatNoteEn(entry.note_en || "");
  const noteJP = formatNoteJp(entry.note_jp || "");
  const noteText = noteEN || noteJP;

  // DOM
  const item = document.createElement("div");
  item.className = "watch-ranking-item " + LANG_CLASS;

  const titleWrap = document.createElement("div");
  titleWrap.className = "watch-title";
  titleWrap.appendChild(document.createTextNode(`${rankNum}. `));

  const spanMain = document.createElement("span");
  spanMain.className = "title-en"; // 既存スタイル継続
  spanMain.textContent = mainTitle;
  titleWrap.appendChild(spanMain);

  if (parenText) {
    const spanParen = document.createElement("span");
    spanParen.className = "title-romaji";
    spanParen.textContent = ` ${parenText}`;
    titleWrap.appendChild(spanParen);
  }
  if (noteText) {
    const spanNote = document.createElement("span");
    spanNote.className = "note";
    spanNote.textContent = ` ${noteText}`;
    titleWrap.appendChild(spanNote);
  }
  item.appendChild(titleWrap);

  // メタ行（Studios / Dir / Series comp）— ラベルはJAページのみ日本語
  const metaText = buildMetaLine(entry, rankNum);
  if (metaText) {
    const metaDiv = document.createElement("div");
    metaDiv.className = "meta-line";
    metaDiv.textContent = metaText;
    item.appendChild(metaDiv);
  }

  // コメント（JA→JP優先 / EN→EN）
  const commentText = IS_JA ? (pickCommentJP(entry) || pickCommentEN(entry)) : pickCommentEN(entry);
  if (commentText) {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment comment-text " + LANG_CLASS;
    commentDiv.textContent = commentText;
    item.appendChild(commentDiv);
  }

  return item;
}

function normalizeStudios(st) {
  if (Array.isArray(st)) return st.map(s => String(s).trim()).filter(Boolean);
  if (!st) return [];
  return String(st).split(/[;,/|｜]/).map(s => s.trim()).filter(Boolean);
}
function summarizeStudios(list) {
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list[0]} +${list.length - 1}`;
}
const META_DETAIL_MAX_RANK = Infinity;

function buildMetaLine(entry, rankNum) {
  const parts = [];
  const studios = summarizeStudios(normalizeStudios(entry.studios));
  if (studios) parts.push(studios);

  if (rankNum <= META_DETAIL_MAX_RANK) {
    const dir = (entry.creators || entry.director || "").trim();
    if (dir) parts.push(IS_JA ? `監督：${dir}` : `Dir: ${dir}`);
    const series = (entry.seriesComposition || "").trim();
    if (series) parts.push(IS_JA ? `シリーズ構成：${series}` : `Series comp: ${series}`);
  }
  return parts.join(" · ");
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
