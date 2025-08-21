// recommendations.js

// ファイルの最上部（グローバル定義）
const path = window.location.pathname;
const segments = path.split('/');

// 例: /animeb-v1/features/recommend/2025/summer/week06/
const year = segments[segments.indexOf('recommend') + 1];     // "2025"
const season = segments[segments.indexOf('recommend') + 2];   // "summer"
const weekSlug = segments[segments.indexOf('recommend') + 3]; // "week06"

// 👇ここで "06" だけを抽出する
const week = weekSlug.replace(/^week/, '');

// JSONファイルのパスは week を2重にしないように構成する
const basePath = `/animeb-v1/features/recommend/${year}/${season}/${weekSlug}/`;
const imageBase = `/animeb-v1/images/key-visuals/${year}/${season}/`;

const recommendPath = `${basePath}recommend-${year}-${season}-${weekSlug}.json`;
const enjoyPath = `${basePath}enjoyment-ranking-${year}-${season}-${weekSlug}.json`;

// 👇ここでログ出力
console.log("Recommend JSON Path:", recommendPath);
console.log("Enjoyment JSON Path:", enjoyPath);

// 読み込み処理（グローバル定義を使う）
document.addEventListener('DOMContentLoaded', () => {
	
// 各セクションの中身をクリアしてプレースホルダーを削除
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    const cards = section.querySelectorAll('.card, .small-card, .watch-ranking-item');
    cards.forEach(card => card.remove());
  });	
  
// ✅ 正しいパスで読み込み
  fetch(recommendPath)
    .then(res => res.json())
    .then(data => renderMainEntries(data.entries));

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
    const romaji = entry.romanized_title ? `(${entry.romanized_title})` : '';
    const studio = entry.studios ? `Studio: ${entry.studios}` : '';
    const review = entry.review?.en || '';

    if (entry.rank <= 5) {
      return `
        <div class="card">
          <img src="${kvImage}" alt="${entry.romanized_title}">
          <div class="card-content">
            <div class="card-title">
              <span class="title-en">${entry.title}</span>
              <span class="title-romaji">${romaji}</span>
            </div>
            <div class="studio">${studio}</div>
            <p>${review}</p>
            <details>
              <summary>＋ More details</summary>
              <p><strong>Director:</strong> ${entry.creators || ''}<br>
              <strong>Series comp:</strong> ${entry.seriesComposition || ''}<br>
			  <strong>Based on:</strong> ${entry.based_on || ''}<br>
              <strong>Synopsis:</strong> ${entry.synopsis || ''}</p>
            </details>
          </div>
        </div>`;
    } else {
      return `
        <div class="small-card">
          <img src="${kvImage}" alt="${entry.romanized_title}">
          <div>
            <div class="small-title">
              <span class="title-en">${entry.title}</span>
              <span class="title-romaji">${romaji}</span>
            </div>
			<div class="studio">${studio}</div>
            <div>${review}</div>
          </div>
        </div>`;
    }
  }

    renderEnjoymentRankingFromJson(enjoyPath);


});

// === Enjoyment Ranking: JSON → HTML 描画 =====================================


// 3) Enjoymentセクション（h2に Enjoyment Ranking を含む .section）を取得
function getEnjoymentSection() {
  const sections = Array.from(document.querySelectorAll(".section"));
  return sections.find(sec => {
    const heading = sec.querySelector("h1, h2, h3"); // ← h1/h2/h3 もOKに
    return heading && /enjoyment ranking/i.test(heading.textContent);
  });
}

// 4) 既存の .watch-ranking-item をクリア
function clearEnjoymentItems(sectionEl) {
  if (!sectionEl) return;
  sectionEl.querySelectorAll(".watch-ranking-item").forEach(el => el.remove());
}

  function formatNoteEn(raw) {
  if (!raw) return "";
  let s = String(raw).trim();

  // 既に「※not ranked」系 → 大文字だけ統一
  if (/※\s*not\s*ranked/i.test(s)) {
    return s.replace(/※\s*not\s*ranked/ig, "※Not ranked");
  }
  // 「not ranked」を含むのに※が無い → 「※Not ranked」に置換
  if (/not\s*ranked/i.test(s)) {
    return s.replace(/(^|\b)not\s*ranked(\b|$)/ig, "※Not ranked").trim();
  }

    // 既に「※Complete」系 → 表記統一
  if (/※\s*complete/i.test(s)) {
    return s.replace(/※\s*complete/ig, "※Complete");
  }
  // 「complete」を含むのに※が無い → 「※Complete」に置換
  if (/\bcomplete\b/i.test(s)) {
    return s.replace(/\bcomplete\b/ig, "※Complete").trim();
  }

  return s; // NEW など他の語は触らない
}

  function formatNoteJp(raw) {
  if (!raw) return "";
  let s = String(raw).trim();

  // 既に「※対象外」ならそのまま
  if (/※\s*対象外/.test(s)) return s.replace(/※\s*対象外/g, "※対象外");

  // 「対象外」を含むのに※が無い場合 → 置換して「※対象外」に
  if (/対象外/.test(s)) return s.replace(/対象外/g, "※対象外").trim();

    // 既に「※放送終了」なら表記統一
  if (/※\s*放送終了/.test(s)) {
    return s.replace(/※\s*放送終了/g, "※放送終了");
  }
  // 「放送終了」を含むのに※が無い → 「※放送終了」に置換
  if (/放送終了/.test(s)) {
    return s.replace(/放送終了/g, "※放送終了").trim();
  }

  // それ以外は触らない
  return s;
}

  // コメントは当面 EN のみ表示（JPは将来用に残す）
// 先頭のダッシュ等は描画側で付けるので除去
function pickCommentEN(entry) {
  const en = (entry?.comment_en || "").trim();
  return en.replace(/^\s*[—-]\s*/, ""); // 先頭の「— / -」が入ってたら外す
}


// 5) 1件分のアイテムDOMを生成
// ▼ 理由：注記はコンバーター取りこぼしの“保険”だけ行う。
//         EN優先・無ければJP。DOMは必要な時だけ作って無駄を減らす。
function createWatchRankingItem(entry, indexForFallback) {
  const rankNum = (typeof entry.rank === "number" && Number.isFinite(entry.rank))
    ? entry.rank
    : (indexForFallback + 1);

  const titleEN = entry.title || "";
  const titleRomaji = entry.romanized_title ? `(${entry.romanized_title})` : "";

  
  
  // --- 注記は文字列だけ先に整形（ここではDOMを作らない） -----------------
  const noteEN = typeof formatNoteEn === "function" ? formatNoteEn(entry.note_en || "") : (entry.note_en || "");
  const noteJP = typeof formatNoteJp === "function" ? formatNoteJp(entry.note_jp || "") : (entry.note_jp || "");
  const noteText = noteEN || noteJP;   // EN優先、無ければJP
  // -------------------------------------------------------------------------

  // --- DOM構築（titleWrap を先に作る。これより前で append しない） ----------
  // <div class="watch-ranking-item">	
  const item = document.createElement("div");
  item.className = "watch-ranking-item";

  //   <div class="watch-title"> 1. <span class="title-en">...</span> <span class="title-romaji">(...)</span> <span class="note">※...</span> </div>
  const titleWrap = document.createElement("div");
  titleWrap.className = "watch-title";

  titleWrap.appendChild(document.createTextNode(`${rankNum}. `));

  const spanEN = document.createElement("span");
  spanEN.className = "title-en";
  spanEN.textContent = titleEN;
  titleWrap.appendChild(spanEN);

  if (titleRomaji) {
    const spanRomaji = document.createElement("span");
    spanRomaji.className = "title-romaji";
    spanRomaji.textContent = ` ${titleRomaji}`;
    titleWrap.appendChild(spanRomaji);
  }
  
  
   // ★ 注記は titleWrap を作った“後”に、1回だけ追加（重複防止）
  if (noteText) {
  const spanNote = document.createElement("span");
  spanNote.className = "note";
  spanNote.textContent = ` ${noteText}`;
  titleWrap.appendChild(spanNote);
}


  item.appendChild(titleWrap);

  // ★ コメントDOMは“必要な時だけ”作る（無駄を減らす）ENがあればENだけ表示／ENが空なら何も出さない（JPは無視）<div>コメント本文</div>（comment_enがあれば）
const commentText = pickCommentEN(entry);
if (commentText) {
  const commentDiv = document.createElement("div");
  commentDiv.className = "comment";
  commentDiv.textContent = commentText; // JSONは素の文だけ
  item.appendChild(commentDiv);
}




  return item;
}

// 6) メイン：JSONを読み込み → ソート → 描画
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

  // rank昇順（数値のみ正規ソート）
  entries.sort((a, b) => {
    const ra = (typeof a.rank === "number" && Number.isFinite(a.rank)) ? a.rank : Infinity;
    const rb = (typeof b.rank === "number" && Number.isFinite(b.rank)) ? b.rank : Infinity;
    return ra - rb;
  });

  // ✅ 修正：アンカーを前進させる（順序そのまま） 
  let anchor = section.querySelector("p.note") || section.querySelector("h1, h2") || section;
entries.forEach((entry, i) => {
  const item = createWatchRankingItem(entry, i);
  anchor.insertAdjacentElement('afterend', item);
  anchor = item; // ← これで次は末尾に足され、昇順に並ぶ
  });
}


