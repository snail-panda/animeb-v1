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

               // --- Review挿入処理 (EN/JPネスト対応版) ---
        const reviewTag = titleEl.querySelector('.review-tag');
        const reviewData = entryData.review;
        if (
          reviewData &&
          (reviewData.en?.trim() || reviewData.jp?.trim())
        ) {
          // デフォルトで英語レビュー表示
          reviewTag.dataset.reviewEn = reviewData.en || '';
          reviewTag.dataset.reviewJp = reviewData.jp || '';
          reviewTag.dataset.lang = 'en';
          reviewTag.textContent = 'Review';
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


// ========== ポップアップロジック（EN/JP切り替え: 閉じずに切替・ボタン制御追加） ==========
function setupPopups() {
  document.querySelectorAll('.review-tag').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAll();

      const reviewEn = this.dataset.reviewEn?.trim() || '';
      const reviewJp = this.dataset.reviewJp?.trim() || '';
      let lang = this.dataset.lang || 'en';

      const popup = document.createElement('div');
      popup.className = 'popup review-popup active';

      const contentEl = document.createElement('div');
      contentEl.className = 'popup-review-text';

      const switchBtn = document.createElement('button');
      switchBtn.className = 'review-switch-btn';

      const closeBtn = document.createElement('button');
      closeBtn.className = 'popup-close-btn';
      closeBtn.textContent = 'Close';

      function updateContent() {
        const hasBoth = reviewEn && reviewJp;

        // 表示内容更新
        if (lang === 'en') {
          contentEl.textContent = reviewEn || 'English review not available.';
          switchBtn.textContent = 'Switch to Japanese';
        } else {
          contentEl.textContent = reviewJp || 'Japanese review not available.';
          switchBtn.textContent = 'Switch to English';
        }

        // 無効化判定
        if (!hasBoth) {
          if ((lang === 'en' && !reviewJp) || (lang === 'jp' && !reviewEn)) {
            switchBtn.disabled = true;
          } else {
            switchBtn.disabled = false;
          }
        } else {
          switchBtn.disabled = false;
        }

        // dataset.lang更新（元のタグの記録にも反映）
        btn.dataset.lang = lang;
      }

      updateContent();

      switchBtn.addEventListener('click', () => {
        lang = lang === 'en' ? 'jp' : 'en';
        updateContent();
      });

      closeBtn.addEventListener('click', closeAll);

      popup.appendChild(contentEl);
      popup.appendChild(switchBtn);
      popup.appendChild(closeBtn);

      document.body.appendChild(popup);
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


//ここから先は変えない

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
