// ========= 1. SCORE BAR WIDTH + MARGIN =========
function adjustScoreBars() {
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

  main.style.width = ${percentMain}%;
  overflow.style.width = ${percentOverflow}%;

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

// ========= 2. LOAD JSON AND RENDER CARDS =========
document.addEventListener("DOMContentLoaded", function () {
  fetch("ranking-week07-spring2025.json")
    .then((response) => response.json())
    .then((data) => {
      // ヘッダー部
      document.querySelector(".week-title").textContent = data.meta.week.toUpperCase();
      document.querySelector(".season-title").textContent = data.meta.season.toUpperCase();

      const entryList = document.querySelector(".entry-list");
      entryList.innerHTML = "";

      data.entries.forEach((entry) => {
        const entryDiv = document.createElement("div");
        entryDiv.classList.add("entry");

        // Rank 部分
        const rankWrapper = document.createElement("div");
        rankWrapper.classList.add("rank-wrapper");

        const rankTop = document.createElement("div");
        rankTop.classList.add("rank-top");

        let rankNumberDiv = document.createElement("div");
        let crownImg = null;

        if (entry.rank === "spotlight") {
          rankNumberDiv.innerHTML = `<div class="rank-number spotlight"><span class="label-big">S</span><span class="label-rest">potlight</span></div>`;
        } else if (entry.rank === "editor's pick") {
          rankNumberDiv.innerHTML = `<div class="rank-number pick"><span class="label-big">E</span><span class="label-rest">ditor's</span> <span class="label-big">P</span><span class="label-rest">ick</span></div>`;
        } else if (entry.rank === "dookie") {
          crownImg = document.createElement("img");
          crownImg.className = "dookie-skull";
          crownImg.src = "https://i.postimg.cc/XNBQdp7H/bee-no-bg-cropped-with-shadow.png";
          rankNumberDiv = document.createElement("div");
          rankNumberDiv.className = "rank-number dookie";
          rankNumberDiv.innerHTML = `<span class="label-big">D</span><span class="label-rest">OOKIE</span>`;
        } else {
          if (entry.rank == 1) {
            crownImg = document.createElement("img");
            crownImg.className = "crown-gold";
            crownImg.src = "https://i.postimg.cc/d336xV81/cupcake.png";
          } else if (entry.rank == 2) {
            crownImg = document.createElement("img");
            crownImg.className = "crown-silver";
            crownImg.src = "https://i.postimg.cc/026ZGrkX/beer.png";
          } else if (entry.rank == 3) {
            crownImg = document.createElement("img");
            crownImg.className = "crown-bronze";
            crownImg.src = "https://i.postimg.cc/rpTJLJS7/rose.png";
          }
          rankNumberDiv = document.createElement("div");
          rankNumberDiv.className = "rank-number first";
          rankNumberDiv.textContent = entry.rank;
        }

        if (crownImg) rankTop.appendChild(crownImg);
        rankTop.appendChild(rankNumberDiv);
        rankWrapper.appendChild(rankTop);

        const rankTrend = document.createElement("div");
        rankTrend.classList.add("rank-trend");
        const trendImg = document.createElement("img");

        if (entry.trend === "UP") {
          trendImg.src = "https://i.postimg.cc/x1bcfV04/trend-up-arrow01.png";
          trendImg.className = "trend-icon-up";
        } else if (entry.trend === "DOWN") {
          trendImg.src = "https://i.postimg.cc/CL5R2f9Y/trend-down-03.png";
          trendImg.className = "trend-icon-down";
        } else {
          trendImg.src = "https://i.postimg.cc/ZnkwQS5z/arrow-right-2.png";
          trendImg.className = "trend-icon-stay";
        }

        const trendLabel = document.createElement("div");
        trendLabel.className = "trend-label";
        trendLabel.textContent = entry.trend;

        rankTrend.appendChild(trendImg);
        rankTrend.appendChild(trendLabel);
        rankWrapper.appendChild(rankTrend);
        entryDiv.appendChild(rankWrapper);

        // Title + Review
        const titleDiv = document.createElement("div");
        titleDiv.className = "title";
        titleDiv.innerHTML = `${entry.title}<span class="title-ep">&ensp; &mdash; Ep.${entry.episode}</span>`;

        if (entry.review) {
          const reviewTag = document.createElement("span");
          reviewTag.className = "review-tag";
          reviewTag.textContent = "Review";
          reviewTag.setAttribute("data-review", entry.review);
          titleDiv.appendChild(reviewTag);
        }

        entryDiv.appendChild(titleDiv);

        // WRP Bar
        const barWrapper = document.createElement("div");
        barWrapper.className = "bar-wrapper";

        const barDiv = document.createElement("div");
        barDiv.className = "bar";

        const barLabel = document.createElement("div");
        barLabel.className = "bar-label";
        barLabel.textContent = "Weekly Ranking Point";
        barDiv.appendChild(barLabel);

        const barInner = document.createElement("div");
        barInner.className = "bar-inner";

        const barTrack = document.createElement("div");
        barTrack.className = "bar-track";

        const barFill = document.createElement("div");
        barFill.className = "bar-fill";
        const barMain = document.createElement("div");
        barMain.className = "bar-main";
        const barOverflow = document.createElement("div");
        barOverflow.className = "bar-overflow";
        barFill.appendChild(barMain);
        barFill.appendChild(barOverflow);
        barTrack.appendChild(barFill);
        barInner.appendChild(barTrack);

        const wrpScore = document.createElement("div");
        wrpScore.className = "wrp-score";
        wrpScore.textContent = entry.wrp_score + "pt";
        barInner.appendChild(wrpScore);

        // WRP詳細 Breakdownデータをボタンに格納
        const wrpDetailBtn = document.createElement("button");
        wrpDetailBtn.className = "wrp-detail-btn";
        wrpDetailBtn.setAttribute(
          "data-breakdown",
          `Base Score: ${entry.wrp_breakdown.base_score}, Animation: ${entry.wrp_breakdown.animation}, Script: ${entry.wrp_breakdown.script}, Direction: ${entry.wrp_breakdown.direction}, Charm: ${entry.wrp_breakdown.charm}, Overall: ${entry.wrp_breakdown.overall}`
        );
        wrpScore.appendChild(wrpDetailBtn);

        barDiv.appendChild(barInner);
        barWrapper.appendChild(barDiv);
        entryDiv.appendChild(barWrapper);

        // Score
        const scoreDiv = document.createElement("div");
        scoreDiv.className = "score";
        scoreDiv.innerHTML = `${entry.score}<span class="score-unit">pt</span>`;
        entryDiv.appendChild(scoreDiv);

        entryList.appendChild(entryDiv);
      });
    });
});
