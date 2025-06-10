// ========= 1. SCORE BAR WIDTH + MARGIN =========

document.querySelectorAll('.bar').forEach(bar => {
  const score = parseFloat(bar.querySelector('.wrp-score')?.textContent || '0');
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
  
// スコアに応じて wrp-score の左マージンを変える
const wrpScore = bar.querySelector('.wrp-score');
  if (score > 11) {
  wrpScore.style.marginLeft = '60px';
  } else if (score > 10.8) {
  wrpScore.style.marginLeft = '44px';
} else if (score > 10.5) {
  wrpScore.style.marginLeft = '34px'; // オーバーフローがあるときに少しスペース空ける    
} else if (score > 10.3) {
  wrpScore.style.marginLeft = '21px'; // オーバーフローがあるときに少しスペース空ける
} else if (score > 10) {
  wrpScore.style.marginLeft = '14px';    
} else {
  wrpScore.style.marginLeft = '6px'; // 通常時はコンパクトに
} 
});


// TODO: カード表示切り替え
// TODO: JSONデータからアニメランキング読み込み

//===============2. LOAD JASON============================

/*fetch('ranking-week07-spring2025_modified.json')
  .then(response => response.json())
  .then(data => {
    // Update meta info
    document.querySelector('.week-title').textContent = data.meta.week;
    document.querySelector('.season-title').textContent = data.meta.season;

    // Get all entry elements in order
    const entryElements = document.querySelectorAll('.entry');

    data.entries.forEach((entryData, index) => {
      const el = entryElements[index];
      if (!el) return;

      // Title + Episode
      const titleEl = el.querySelector('.title');
      if (titleEl) {
        const epSpan = titleEl.querySelector('.title-ep');
        titleEl.childNodes[0].textContent = entryData.title;
        if (epSpan) epSpan.textContent = ` — ${entryData.episode}`;
      }

      // Trend Label & Icon
      const trendLabel = el.querySelector('.trend-label');
      const trendIcon = el.querySelector('.rank-trend img');
      if (trendLabel) trendLabel.textContent = entryData.trend.label;
      if (trendIcon) trendIcon.src = entryData.trend.icon;

      // WRP Score
      const wrpScoreEl = el.querySelector('.wrp-score');
      if (wrpScoreEl) wrpScoreEl.innerHTML = `${entryData.wrp_score}<span class="wrp-score-unit">pt</span>`;

      // Total Score
      const scoreEl = el.querySelector('.score');
      if (scoreEl) scoreEl.innerHTML = `${entryData.score}<span class="score-unit">pt</span>`;
    });
  });
*/
