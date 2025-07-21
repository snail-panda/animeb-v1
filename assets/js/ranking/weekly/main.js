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
      wrpScore.style.marginLeft = '45px';
    } else if (score > 10.8) {
      wrpScore.style.marginLeft = '35px';
    } else if (score > 10.5) {
      wrpScore.style.marginLeft = '28px';
    } else if (score > 10.3) {
      wrpScore.style.marginLeft = '18px';
    } else if (score > 10) {
      wrpScore.style.marginLeft = '12px';
    } else {
      wrpScore.style.marginLeft = '6px';
    }

  });
}

// ========== JSON読み込み & DOM更新 ==========
fetch(`ranking-${currentWeek}-spring2025.json`)
  .then(response => {
    console.log(`🔍 Response status: ${response.status}`);
    if (!response.ok) throw new Error("Fetch failed");
    return response.json();
  })
.then(data => {

  console.log(`✅ Successfully fetched: ranking-${currentWeek}-spring2025.json`);
  // ここから通常処理

  // ✅ ← この位置のすぐ下に追加してOK！

    // ========== WATCH STATUS を反映 ==========
    function updateWatchStatus(metaStatus) {
      if (!metaStatus) return;

      const labelMap = {
        watching: 'W',
        droppedThisWeek: 'D',
        droppedTotal: 'DT',
        noAir: 'NoAir'
      };

      document.querySelectorAll('.watch-status .ws-item').forEach(item => {
  const key = item.dataset.tooltip;
  const label = labelMap[key];
  const count = metaStatus[key];
  const target = item.querySelector('.view-count'); // ← 明示的にここだけ書き換える
  if (target && count !== undefined) {
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
  document.querySelector('.week-title').textContent = data.meta.week;
  document.querySelector('.season-title').textContent = data.meta.season;
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
    const infoTopEl = el.querySelector('.info-top');
    if (infoTopEl) {
      // 中身を一度クリア
      infoTopEl.textContent = "";

      // 英語タイトル
      const enTitle = document.createTextNode(entryData.title || "");
      infoTopEl.appendChild(enTitle);

      // エピソード
      const kvThumbBox = el.querySelector('.kv-thumb');
      if (kvThumbBox) {
        const epBox = document.createElement("div");
        epBox.className = "title-ep";  // ← 既存のclassをそのまま使う場合
        epBox.textContent = `Ep.${entryData.episode || ""}`;
        kvThumbBox.appendChild(epBox);
      }

      // 日本語タイトル 既存の日本語タイトルを上書き
      const jpTitleEl = el.querySelector('.jp-title');
      if (jpTitleEl) {
        jpTitleEl.textContent = entryData.jpTitle || "";
      }

      // ========== KV画像更新 ==========
      const kvThumbEl = el.querySelector('.kv-thumb img');
      if (kvThumbEl && entryData.kv) {
        kvThumbEl.src = `../../../../images/key-visuals/2025/spring/${entryData.kv}.webp`;
        kvThumbEl.alt = `${entryData.title} key visual`;
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
      const scoreNumberEl = scoreEl.querySelector('.score-number');
      const scoreUnitEl = scoreEl.querySelector('.score-unit');

      if (scoreNumberEl) scoreNumberEl.textContent = entryData.score;
      if (scoreUnitEl) scoreUnitEl.textContent = 'pt';  // ptは固定
    }

    // more-info <dl> の更新
    const moreInfoDl = el.querySelector('.more-info dl');
    if (moreInfoDl) {
      moreInfoDl.innerHTML = `
        <dt>Romanized Title</dt><dd>${entryData.romanized_title || ""}</dd>
        <dt>Release Date</dt><dd>${formatReleaseDates(entryData.release_date || "")}</dd>
        <dt>Based On</dt><dd>${entryData.based_on || ""}</dd>
        <dt>Studios</dt><dd>${entryData.studios || ""}</dd>
        <dt>Creators</dt><dd>${entryData.creators || ""}</dd>
        <dt>External Scores</dt><dd>${entryData.external_scores || ""}</dd>
        <dt>Streaming Services</dt><dd>${entryData.streaming_services || ""}</dd>
      `;
    }

    // synopsis の開閉も一緒に制御するために
    const collapseBtn = el.querySelector(".collapse-btn");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        const synopsisBox = el.querySelector(".synopsis");
        if (synopsisBox) {
          synopsisBox.classList.toggle("active");
        }
      });

       // 既存の review-tag を削除しておく（念のため）
  const existingReviewTag = el.querySelector('.review-tag');
  if (existingReviewTag) {
    existingReviewTag.remove();
  }

      // Review ボタン ✅ collapseBtn が使える状態で Review ボタンを追加
  const reviewTag = document.createElement("span");
  reviewTag.className = "review-tag";
  const reviewData = entryData.review;
  if (reviewData && (reviewData.en?.trim() || reviewData.jp?.trim())) {
    reviewTag.dataset.reviewEn = reviewData.en || "";
    reviewTag.dataset.reviewJp = reviewData.jp || "";
    reviewTag.dataset.lang = "en";
    reviewTag.textContent = "Review";
    reviewTag.style.display = "inline-block";
  } else {
    reviewTag.style.display = "none";
  }

  collapseBtn.parentElement.appendChild(reviewTag);
}

    }

    // 👇ここに追加
    const synopsisBox = el.querySelector(".synopsis");
    if (synopsisBox) {
      synopsisBox.textContent = entryData.synopsis || "";
    }

    // ジャンラーの更新
    const genreTagsEl = el.querySelector('.genre-tags');
    if (genreTagsEl && entryData.genre) {
      genreTagsEl.innerHTML = "";  // 既存タグをクリア
      entryData.genre.forEach(g => {
        const tag = document.createElement('span');
        tag.className = 'genre-tag';
        tag.textContent = g;
        genreTagsEl.appendChild(tag);
      });
    }
  }); // ← ここでforEachの閉じカッコ

  // 👇 ここに追加していい！！
updateWatchStatus(data.meta.status);

  // 全ての更新が終わったあとにバー描画
  adjustScoreBars();

  // イベントリスナー登録
  setTimeout(() => {
    setupPopups();
  }, 0);  // 🔁 DOMが確実に構築されてからイベントをバインド
})
.catch(error => {
  console.error(`❌ Fetch failed: ${error.message}`);
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

console.log("📦 reviewEn =", reviewEn);

    contentEl.innerHTML = reviewEn || 'English review not available.';
    switchBtn.textContent = 'Switch to Japanese';

 console.log("🌸 contentEl.innerHTML after setting:", contentEl.innerHTML);
  console.log("🧱 DOM:", contentEl);


  } else {
    contentEl.innerHTML = reviewJp || 'Japanese review not available.';
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

// ============Overview Section

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("overview-toggle-btn");
  const container = document.getElementById("overview-container");
  const triangle = btn.querySelector(".triangle-icon");

  let currentLang = "EN";

  // 最初は overview.html を読み込む
  function loadOverview(lang) {
    const file = lang === "EN"
      ? `2025spring-${currentWeek}-overview.html`
      : `2025spring-${currentWeek}-overview-ja.html`;

    fetch(file)
      .then((response) => {
        if (!response.ok) throw new Error("not found");
        return response.text();
      })
      .then((html) => {
        container.innerHTML = html;

        // 言語切り替えボタンを作成
        const langBtn = document.createElement("button");
        langBtn.id = "lang-toggle";
        langBtn.textContent = "EN ⇄ JP";

        langBtn.addEventListener("click", () => {
          currentLang = currentLang === "EN" ? "JP" : "EN";
          loadOverview(currentLang);
        });

        // ボタンを overview の先頭に差し込む
        const weeklyOverview = container.querySelector(".weekly-overview");
        if (weeklyOverview) {
          weeklyOverview.prepend(langBtn);
        } else {
          container.prepend(langBtn);
        }
      })
      .catch(() => {
        if (lang === "EN") {
  console.log("English overview missing");
  container.innerHTML = `
    <p class="overview-notice" style="text-align:center; margin:1em 0;">
      English Overview not available.
    </p>
  `;
  const langBtn = document.createElement("button");
  langBtn.id = "lang-toggle";
  langBtn.textContent = "EN ⇄ JP";
  langBtn.addEventListener("click", () => {
    currentLang = "JP";
    loadOverview("JP");
  });
  container.prepend(langBtn);
}
 else if (lang === "JP") {
          console.log("Japanese overview missing");
          container.innerHTML = `
            <p class="overview-notice" style="text-align:center; margin:1em 0;">
              Japanese Overview not available.
            </p>
          `;
          const langBtn = document.createElement("button");
          langBtn.id = "lang-toggle";
          langBtn.textContent = "EN ⇄ JP";

          langBtn.addEventListener("click", () => {
            currentLang = "EN";
            loadOverview("EN");
          });
          container.prepend(langBtn);
		  langBtn.blur();  // ← これを入れるだけ
        }
      });
  }

  // トグル動作 ボタンクリックでアコーディオン開閉（innerHTML を使わない！）
  btn.addEventListener("click", () => {
    container.classList.toggle("expanded");
    triangle.classList.toggle("rotate");

    if (container.classList.contains("expanded")) {
      btn.innerHTML = '<span class="triangle-icon rotate">&#9660;</span> CLOSE';
      loadOverview(currentLang);
    } else {
      btn.innerHTML = '<span class="triangle-icon">&#9660;</span> OVERVIEW';
      container.innerHTML = ""; //閉じたとき中身クリア
    }
  });

  // overview.html も overview-ja.html も存在しない場合は
  // ボタンごと非表示にする
  fetch(`2025spring-${currentWeek}-overview.html`)
    .then((res) => {
      if (!res.ok) {
        return fetch(`2025spring-${currentWeek}-overview-ja.html`);
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
});



// 展開ボタン制御
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.collapse-btn');
  if (!btn) return;

  const entry = btn.closest('.entry');
  const moreInfo = entry.querySelector('.more-info');
  //const synopsisBox = entry.querySelector('.synopsis-box'); // ← これを追加

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
    <strong>What’s WRP?</strong>
    <ul style="margin-top: 4px; padding-left: 18px;">
      <li><strong>WRP</strong> (Weekly Ranking Point) is a combined score reflecting how satisfying and well-executed an anime episode was <em>within its week</em>.</li>
      <li>It balances technical quality (like animation, script, direction) with overall enjoyment.</li>
      <li>It shows how well the episode performed both <em>on its own terms</em> and <em>compared to others airing that week</em>.</li>
    </ul>
    <p style="margin-top: 6px;"><strong>Note:</strong> It’s not an absolute score, but a contextual evaluation — it shifts based on the week’s landscape and relative enjoyment.</p>
    <p style="margin-top: 4px; font-style: italic;">For more, scroll to the bottom.</p>
  `,
   total: `
  <strong>What’s the Total Score?</strong>
  <ul style="margin-top: 4px; padding-left: 18px;">
    <li>Total Score is a simplified, rounded version of the weekly WRP values.</li>
    <li>Each week’s WRP is typically rounded <strong>down</strong> to the nearest integer.</li>
    <li><strong>Exception:</strong> Scores from <strong>9.50 to 9.99</strong> are treated as <strong>10</strong>, and <strong>10.00+</strong> becomes <strong>11</strong>.</li>
  </ul>
  <p style="margin-top: 6px;"><strong>Note:</strong> While useful for seasonal ranking, this score is also a simplified reflection of the overall impression—both practical and intuitive.</p>
`
  
};

document.querySelectorAll('.info-trigger').forEach(el => {
  const key = el.dataset.key;
  const content = infoMap[key];
  if (!content) return;

  // Hover for desktop
  el.addEventListener('mouseenter', (e) => {
    showTooltip(e, content);
  });

  el.addEventListener('mousemove', (e) => {
    moveTooltip(e);  // ← 追従させたい場合（定義が必要）
  });

  el.addEventListener('mouseleave', () => {
    hideTooltip();
  });

  // Tap / Click for mobile
  el.addEventListener('click', (e) => {
    showTooltip(e, content);
  });
});

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

  // 下端からはみ出す場合上に（必要なら）現状維持
  if (pageY + tooltipHeight + padding > window.innerHeight + window.scrollY) {
    top = pageY - tooltipHeight - padding;
  } else {
    top = pageY + padding;
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

// Noteのdetailsの開閉トグル
document.querySelectorAll('.detail-toggle').forEach(el => {
  el.addEventListener('click', () => {
    el.nextElementSibling.classList.toggle('open');
  });
});

// VIEWING STATUS
/*
const toggleBtn = document.getElementById('toggleBtn');
    const details = document.getElementById('details');
    toggleBtn.addEventListener('click', () => {
      const expanded = details.classList.toggle('active');
      toggleBtn.textContent = expanded ? '▲' : '▼';
    });
*/