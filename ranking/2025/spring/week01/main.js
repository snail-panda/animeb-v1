// ========== バー描画ロジック ==========
function adjustScoreBars() {
  document.querySelectorAll('.bar').forEach(bar => {
    const scoreText = bar.querySelector('.wrp-score')?.textContent || '0';
    const score = parseFloat(scoreText);
    const main = bar.querySelector('.bar-main');
    const overflow = bar.querySelector('.bar-overflow');

    const min = 4;
    const max = 10;
    const unit = max - min;

    const baseWidth = Math.min(score, max);
    const extraWidth = score > max ? score - max : 0;

    const percentMain = ((baseWidth - min) / unit) * 100;
    const percentOverflow = (extraWidth / unit) * 100;

    main.style.width = `${percentMain}%`;
    overflow.style.width = `${percentOverflow}%`;

    const wrpScore = bar.querySelector('.wrp-score');
    if (score > 11) {
      wrpScore.style.marginLeft = '60px';
    } else if (score > 10.8) {
      wrpScore.style.marginLeft = '44px';
    } else if (score > 10.5) {
      wrpScore.style.marginLeft = '34px';
    } else if (score > 10.3) {
      wrpScore.style.marginLeft = '21px';
    } else if (score > 10) {
      wrpScore.style.marginLeft = '14px';
    } else {
      wrpScore.style.marginLeft = '6px';
    }
  });
}

// ========== JSON読み込み & DOM更新 ==========
fetch('ranking-week01-spring2025.json')
  .then(response => response.json())
  .then(data => {
    // メタ情報更新
    document.querySelector('.week-title').textContent = data.meta.week;
    document.querySelector('.season-title').textContent = data.meta.season;
    document.title = `Anime Weekly Ranking - ${data.meta.week}`;

    // エントリー取得
    const entryElements = document.querySelectorAll('.entry');

    data.entries.forEach((entryData, index) => {
      const el = entryElements[index];
      if (!el) return;

      // タイトル更新
      const titleEl = el.querySelector('.title');
      if (titleEl) {
        const epSpan = titleEl.querySelector('.title-ep');
        titleEl.childNodes[0].textContent = entryData.title;
        if (epSpan) epSpan.textContent = ` — Ep.${entryData.episode}`;

       const jpTitleEl = titleEl.querySelector('.jp-title');
if (jpTitleEl) {
  jpTitleEl.textContent = entryData.jpTitle || "";
}



      // Review挿入処理
        const reviewTag = titleEl.querySelector('.review-tag');
        if (entryData.review && entryData.review.trim() !== '') {
          reviewTag.dataset.review = entryData.review;
          reviewTag.style.display = 'inline-block';
        } else {
          reviewTag.style.display = 'none';
        }

  

      // トレンド情報更新
      const trendLabel = el.querySelector('.trend-label');
      const trendIcon = el.querySelector('.rank-trend img');
      const label = entryData.trend.toLowerCase();
      if (trendLabel && trendIcon) {
        trendLabel.textContent = entryData.trend;
        trendIcon.src = `../../../../images/trends/${label}-arrow.png`;
        trendIcon.className = `trend-icon-${label}`;
      }

     // WRPスコア更新完全統合 (titleCase版・最終確定版)
const wrpScoreEl = el.querySelector('.wrp-score');
if (wrpScoreEl) {
  wrpScoreEl.innerHTML = `${entryData.wrp_score}<span class="wrp-score-unit">pt</span> <img src="../../../../images/badges/info-green.svg" width="8px">`;

  // Breakdown内容も事前加工
  const breakdown = Object.entries(entryData.wrp_breakdown)
    .map(([key, val]) => `${titleCase(key.replace(/_/g, ' '))}: ${val}`)
    .join('<br>');

  wrpScoreEl.querySelector('img').addEventListener('click', function(e) {
    e.stopPropagation();
    closeAll();
    const popup = createPopup('WRP Breakdown:<br>' + breakdown, 'wrp-popup');
    positionPopup(this, popup);
  });
}

// titleCase関数（新規追加分・これをJSの関数群に加える）
function titleCase(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}



      // Totalスコア更新
      const scoreEl = el.querySelector('.score');
      if (scoreEl) {
        scoreEl.innerHTML = `${entryData.score}<span class="score-unit">pt</span>`;
      }
    });

    // 全ての更新が終わったあとにバー描画
    adjustScoreBars();

    // イベントリスナー登録
    setupPopups();
  });

// ========== ポップアップロジック ==========
// ================================
// 🟡 レビューポップアップの処理
// ================================

// ボタンクリックでポップアップ表示
document.querySelectorAll('.review-btn').forEach(btn => {
  btn.addEventListener('click', event => {
    const card = btn.closest('.anime-card');
    const entryId = card.getAttribute('data-id'); // 例: "1", "2"
    const entryData = animeData.find(e => e.id == entryId);

    // データからレビュー情報を取り出す
    const reviewData = entryData.review || {};
    const reviewEN = (reviewData.en || "").trim();
    const reviewJP = (reviewData.jp || "").trim();

    const hasEN = reviewEN.length > 0;
    const hasJP = reviewJP.length > 0;

    const popup = document.getElementById('review-popup');
    const popupContent = popup.querySelector('.popup-content');
    const toggleButtons = popup.querySelectorAll('.popup-toggle');

    // 両方レビューが空なら何もしない（ボタン自体が表示されてないはず）
    if (!hasEN && !hasJP) return;

    // 初期表示（英語優先）
    popupContent.innerText = hasEN ? reviewEN : reviewJP;

    // 切り替えボタンの状態設定（存在しない方は無効化）
    toggleButtons.forEach(button => {
      const lang = button.getAttribute("data-lang");
      const isActive = (lang === "en" && hasEN) || (lang === "jp" && hasJP);

      button.disabled = !isActive;
      if (isActive) {
        button.classList.remove("disabled");
      } else {
        button.classList.add("disabled");
      }

      button.classList.remove("active");
    });

    // デフォルトボタンをアクティブに（EN優先）
    const defaultLang = hasEN ? "en" : "jp";
    const defaultButton = popup.querySelector(`.popup-toggle[data-lang='${defaultLang}']`);
    if (defaultButton) defaultButton.classList.add("active");

    // 表示
    popup.style.display = "flex";

    // 切り替えボタンクリック処理
    toggleButtons.forEach(button => {
      button.addEventListener("click", () => {
        const lang = button.getAttribute("data-lang");
        const content = (lang === "en")
          ? (hasEN ? reviewEN : "No English Review Available.")
          : (hasJP ? reviewJP : "日本語のレビューはありません。");

        popupContent.innerText = content;

        toggleButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
      });
    });
  });
});

// ポップアップ閉じる処理（× ボタン）
document.querySelector(".popup-close")?.addEventListener("click", () => {
  document.getElementById("review-popup").style.display = "none";
});


