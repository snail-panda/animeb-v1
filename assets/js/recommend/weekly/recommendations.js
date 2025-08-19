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
const enjoyPath = `${basePath}enjoyment_ranking-${year}-${season}-${weekSlug}.json`;

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

  fetch(enjoyPath)
    .then(res => res.json())
    .then(data => renderEnjoymentRanking(data.watchRanking));

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

  function renderEnjoymentRanking(list) {
    const container = document.querySelector('.section:nth-of-type(6)');
    list.forEach(item => {
      const note = item.note ? `<span class="note">※${item.note}</span>` : '';
      container.insertAdjacentHTML('beforeend', `
        <div class="watch-ranking-item">
          <div class="watch-title">
            ${item.rank}. <span class="title-en">${item.title}</span>
            <span class="title-romaji">(${item.romanized_title})</span> ${note}
          </div>
          <div>${item.comment}</div>
        </div>
      `);
    });
  }
});
