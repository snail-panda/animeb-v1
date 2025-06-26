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
fetch('ranking-week010-spring2025.json')
  .then(response => response.json())
  .then(data => {
    // メタ情報更新
    document.querySelector('.week-title').textContent = data.meta.week;
    document.querySelector('.season-title').textContent = data.meta.season;
    document.title = `Anime Weekly Ranking - ${data.meta.week}`;

　　// ✅ WEEK を全大文字表示に変更
　　const weekEl = document.querySelector('.week-title');
if (weekEl && data.meta.week) {
  weekEl.textContent = data.meta.week.toUpperCase();  // 🔁 完全に全大文字化
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

/*元の初心者向けバージョン(duration部分）
// ========== PATCH: duration and ep_range display ==========

// Duration を <span class="duration"> に挿入（Jsonで括弧なし前提）
const durationEl = document.querySelector('.duration');
if (durationEl && data.meta.duration) {
  // 最初の「MM-DD」部分だけ / に直し、曜日範囲部分はそのまま残す
  const durationRaw = data.meta.duration;

  // 例: "05-18/Sun–05/24/Sat"
  // --- 修正された duration 表示処理 ---
const rawDuration = entry.duration;

// 正規表現で分割： ["05", "18", "Sun", "05", "24", "Sat"]
const parts = rawDuration.split(/[-\s]+/); 

// 組み立てる：05/18/Sat–05/24/Fri
const formattedDuration = ${parts[0]}/${parts[1]}/${parts[2]}–${parts[3]}/${parts[4]}/${parts[5]};

// 表示に反映
durationCell.textContent = (${formattedDuration});

//=============ここまで
*/



// Ep Range を <span class="ep-range"> に挿入（Ep の E は大文字化）
const epRangeEl = document.querySelector('.ep-range');
if (epRangeEl && data.meta.ep_range) {
  const formatted = data.meta.ep_range.replace(/^ep/i, 'Ep'); // Epだけ大文字化
  epRangeEl.textContent = `[${formatted}]`;
}


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
      const labelTextMap = {
        "re": "Re-entry"
      };
      if (trendLabel && trendIcon) {
        trendLabel.textContent = labelTextMap[label] || entryData.trend;
        trendIcon.src = `../../../../images/trends/${label}-arrow.png`;
        trendIcon.className = `trend-icon-${label}`;
        trendIcon.alt = `${entryData.trend} icon`;


        // 🔽 この行を追加するだけでOK！
trendIcon.onerror = () => trendIcon.style.display = 'none';

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
      let lang;

      // 初期表示言語決定
      if (reviewEn) {
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
    contentEl.textContent = reviewEn || 'English review not available.';
    switchBtn.textContent = 'Switch to Japanese';
  } else {
    contentEl.textContent = reviewJp || 'Japanese review not available.';
    switchBtn.textContent = 'Switch to English';
  }
// 🔁 ここでフォント用クラスを切り替える
  contentEl.classList.remove('lang-en', 'lang-jp');
  contentEl.classList.add(lang === 'jp' ? 'lang-jp' : 'lang-en');
  switchBtn.disabled = false;
  btn.dataset.lang = lang;
}

updateContent();

switchBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  lang = lang === 'en' ? 'jp' : 'en';
  updateContent();
  setTimeout(() => {
  adjustFlowerSize(contentEl, flowerTopLeft, flowerBottomRight);
}, 0); // ←💡追加！
  adjustPopupPadding(popup); // ←💡追加！
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
      const breakdown = this.dataset.breakdown.replace(/,/g, '<br>');
      const popup = createPopup('WRP Breakdown:<br>' + breakdown, 'wrp-popup');
      positionPopup(this, popup);
    });
  });


  // documentクリック時にだけ閉じるように（popup内部のクリックでは閉じない）
  document.addEventListener('click', () => closeAll());
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
  popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
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

  let leftSize = 30;
  let rightSize = 45;

  if (height < 100) {
    leftSize = 20;
    rightSize = 35;
  } else if (height > 200) {
    leftSize = 35;
    rightSize = 55;
  } else if (height > 500) {
    leftSize = 40;
    rightSize = 70;
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

