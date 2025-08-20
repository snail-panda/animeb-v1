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
    const h2 = sec.querySelector("h2");
    return h2 && /enjoyment ranking/i.test(h2.textContent);
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
  return s; // NEW など他の語は触らない
}

  function formatNoteJp(raw) {
  if (!raw) return "";
  let s = String(raw).trim();

  // 既に「※対象外」ならそのまま
  if (/※\s*対象外/.test(s)) return s.replace(/※\s*対象外/g, "※対象外");

  // 「対象外」を含むのに※が無い場合 → 置換して「※対象外」に
  if (/対象外/.test(s)) return s.replace(/対象外/g, "※対象外").trim();

  // それ以外は触らない
  return s;
}

// 5) 1件分のアイテムDOMを生成
function createWatchRankingItem(entry, indexForFallback) {
  const rankNum = (typeof entry.rank === "number" && Number.isFinite(entry.rank))
    ? entry.rank
    : (indexForFallback + 1);

  const titleEN = entry.title || "";
  const titleRomaji = entry.romanized_title ? `(${entry.romanized_title})` : "";

  const commentEN = entry.comment_en || "";
  const noteEN = formatNoteEn(entry.note_en || "");
  const noteJP = formatNoteJp(entry.note_jp || "");

 // 例: "※not ranked" / "※Complete ※not ranked" など（そのまま表示）

  // <div class="watch-ranking-item">
  const item = document.createElement("div");
  item.className = "watch-ranking-item";

  //   <div class="watch-title"> 1. <span class="title-en">...</span> <span class="title-romaji">(...)</span> <span class="note">※...</span> </div>
  const titleWrap = document.createElement("div");
  titleWrap.className = "watch-title";

  const textNode = document.createTextNode(`${rankNum}. `);
  titleWrap.appendChild(textNode);

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

  if (noteEN) {
    const spanNote = document.createElement("span");
    spanNote.className = "note";
    spanNote.textContent = ` ${noteEN}`;
    titleWrap.appendChild(spanNote);
  }
  
  if (noteJP) {
  const spanNoteJp = document.createElement("span");
  spanNoteJp.className = "note";
  spanNoteJp.textContent = ` ${noteJP}`;
  titleWrap.appendChild(spanNoteJp);
}



  //   <div>コメント本文</div>（comment_enがあれば）
  const commentDiv = document.createElement("div");
  if (commentEN) {
    commentDiv.textContent = commentEN;
  } else {
    // コメント未設定なら空のdivは作らない
    commentDiv.remove();
  }

  item.appendChild(titleWrap);
  if (commentEN) item.appendChild(commentDiv);

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
  let anchor = section.querySelector("p.note") || section.querySelector("h2");
entries.forEach((entry, i) => {
  const item = createWatchRankingItem(entry, i);
  anchor.insertAdjacentElement('afterend', item);
  anchor = item; // ← これで次は末尾に足され、昇順に並ぶ
  });
}


