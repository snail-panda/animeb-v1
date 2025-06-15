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
fetch('ranking-week07-spring2025.json')
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

        // Review挿入処理
        const reviewTag = titleEl.querySelector('.review-tag');
        if (entryData.review && entryData.review.trim() !== '') {
          reviewTag.dataset.review = entryData.review;
          reviewTag.style.display = 'inline-block';
        } else {
          reviewTag.style.display = 'none';
        }
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

      // WRPスコア更新
      const wrpScoreEl = el.querySelector('.wrp-score');
      if (wrpScoreEl) {
        wrpScoreEl.innerHTML = `${entryData.wrp_score}<span class="wrp-score-unit">pt</span>`;
      }

      // WRP Breakdown埋め込み & SVG埋め込み処理
      const wrpDetailBtn = el.querySelector('.wrp-detail-btn');
  if (wrpDetailBtn && entryData.wrp_breakdown) {
  const breakdown = Object.entries(entryData.wrp_breakdown)
    .map(([key, val]) => `${capitalize(key)}: ${val}`)
    .join(', ');
  wrpDetailBtn.dataset.breakdown = breakdown;

  // アイコンの描画位置を親要素から取得
  const rect = wrpDetailBtn.getBoundingClientRect();

  // オーバーレイアイコン作成
  const overlayIcon = document.createElement('img');
  overlayIcon.src = '../../../../images/badges/info-green.svg';
  overlayIcon.width = 8;
  overlayIcon.style.position = 'absolute';
  overlayIcon.style.left = `${rect.left + window.scrollX}px`;
  overlayIcon.style.top = `${rect.top + window.scrollY}px`;
  overlayIcon.style.zIndex = '9999';
  overlayIcon.style.pointerEvents = 'auto';
  overlayIcon.style.cursor = 'pointer';

  // クリック時に同じポップアップを出す（レビューと統一）
  overlayIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    closeAll();
    const popup = createPopup('WRP Breakdown:<br>' + breakdown.replace(/,/g, '<br>'), 'wrp-popup');
    positionPopup(this, popup);
  });

  // bodyに追加 (完全に親DOMとは独立)
  document.body.appendChild(overlayIcon);
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
function setupPopups() {
  document.querySelectorAll('.review-tag').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAll();
      const review = this.dataset.review;
      const popup = createPopup(review, 'review-popup');
      positionPopup(this, popup);
    });
  });

  document.querySelectorAll('.wrp-detail-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAll();
      const breakdown = this.dataset.breakdown.replace(/,/g, '<br>');
      const popup = createPopup('WRP Breakdown:<br>' + breakdown, 'wrp-popup');
      positionPopup(this, popup);
    });
  });

  document.addEventListener('click', () => closeAll());
}

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
  popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
