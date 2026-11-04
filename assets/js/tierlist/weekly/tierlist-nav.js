const prevLink = document.querySelector(".nav-left");
const nextLink = document.querySelector(".nav-right");

// 現在のURLから year, season, week を抽出
const pathSegments = window.location.pathname.split("/").filter(Boolean);
const currentWeek = pathSegments[pathSegments.length - 2];
const season = pathSegments[pathSegments.length - 3];
const year = pathSegments[pathSegments.length - 4];

// JSONを読み込む
fetch("../../../../tierlist/tier-list.json")
  .then(response => response.json())
  .then(data => {
    const correctedSeason = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
    const seasonData = data?.[year]?.[correctedSeason];
    const weeksRaw = seasonData?.weeks;

    if (!weeksRaw || !Array.isArray(weeksRaw)) {
      console.log("🚫 No available tier weeks found for", year, correctedSeason);
      return;
    }

    // 数値で安定ソート & 正規化
const sorted = sortWeeksNumeric(weeksRaw);
const ids = sorted.map(x => x.id);
const normalizedCurrentWeek = normWeekId(currentWeek);

const currentIndex = ids.indexOf(normalizedCurrentWeek);
const prevWeek = currentIndex > 0 ? ids[currentIndex - 1] : null;
const nextWeek = (currentIndex >= 0 && currentIndex < ids.length - 1) ? ids[currentIndex + 1] : null;

    const basePath = `/animeb-v1/tierlist/${year}/${correctedSeason.toLowerCase()}/`;

    // 前のリンク
if (prevWeek) {
  prevLink.href = `${basePath}${prevWeek}/tierlist.html`;
} else {
  const prevInfo = getPrevSeason(year, correctedSeason);
  const prevSeasonData = data?.[prevInfo.year]?.[prevInfo.season];

  // ▼final優先、無ければ最大週
  const prevSorted = sortWeeksNumeric(prevSeasonData?.weeks);
  const finalId = normWeekId(prevSeasonData?.final);
  const hasFinal = finalId && prevSorted.some(x => x.id === finalId);
  const targetPrev = hasFinal ? finalId
                   : (prevSorted.length ? prevSorted[prevSorted.length - 1].id : null);

  if (targetPrev) {
    prevLink.href = `/animeb-v1/tierlist/${prevInfo.year}/${prevInfo.season.toLowerCase()}/${targetPrev}/tierlist.html`;
  } else {
    prevLink.href = "#";
    prevLink.classList.add("disabled");
    prevLink.setAttribute("title", "Coming soon");
  }
}

// 次のリンク
if (nextWeek) {
  nextLink.href = `${basePath}${nextWeek}/tierlist.html`;
} else {
  const nextInfo = getNextSeason(year, correctedSeason);
  const nextSeasonData = data?.[nextInfo.year]?.[nextInfo.season];

  // ▼最小週、空なら無効化
  const nextSorted = sortWeeksNumeric(nextSeasonData?.weeks);
  const targetNext = nextSorted.length ? nextSorted[0].id : null;

  if (targetNext) {
    nextLink.href = `/animeb-v1/tierlist/${nextInfo.year}/${nextInfo.season.toLowerCase()}/${targetNext}/tierlist.html`;
  } else {
    nextLink.href = "#";
    nextLink.classList.add("disabled");
    nextLink.setAttribute("title", "Coming soon");
  }
}

  })
  .catch(error => {
    console.error("❌ Error loading tierlist nav:", error);
  });

// 補助関数：次/前のシーズン計算
function getPrevSeason(year, season) {
  const seasons = ["Winter", "Spring", "Summer", "Fall"];
  let index = seasons.indexOf(season);
  if (index === 0) {
    return { year: (parseInt(year) - 1).toString(), season: "Fall" };
  }
  return { year, season: seasons[index - 1] };
}

function getNextSeason(year, season) {
  const seasons = ["Winter", "Spring", "Summer", "Fall"];
  let index = seasons.indexOf(season);
  if (index === seasons.length - 1) {
    return { year: (parseInt(year) + 1).toString(), season: "Winter" };
  }
  return { year, season: seasons[index + 1] };
}

// 週IDの正規化と数値ソート用（最小差分）
const normWeekId = (s) => String(s || "").toLowerCase().replace(/\s+/g, "");
const weekNum = (s) => {
  const m = String(s || "").match(/(\d{1,2})/);
  return m ? parseInt(m[1], 10) : NaN;
};
function sortWeeksNumeric(weeks = []) {
  return weeks
    .map(w => ({ id: normWeekId(w), n: weekNum(w) }))
    .filter(x => Number.isFinite(x.n))
    .sort((a,b) => a.n - b.n);
}


// 押せないリンクを無効化（グレーアウト中）
prevLink.addEventListener("click", (e) => {
  if (prevLink.classList.contains("disabled")) e.preventDefault();
});
nextLink.addEventListener("click", (e) => {
  if (nextLink.classList.contains("disabled")) e.preventDefault();
});

/* OFFBEAT TIER A1: shared mast above the existing light-olive Tier List navigation.
   Article markup/CSS and existing Prev/Next destination logic stay unchanged. */
(function offbeatTierMastA1() {
  'use strict';
  const nav = document.querySelector('.tierlist-nav');
  const article = document.querySelector('.tierlist-post');
  if (!nav || !article || document.getElementById('offbeat-global-header')) return;
  document.body.classList.add('offbeat-tier-a1');

  const base = '/animeb-v1/';
  function addStyle(url) {
    if (document.querySelector('link[href="' + url + '"]')) return;
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = url;
    document.head.appendChild(el);
  }
  addStyle(base + 'assets/css/common/offbeat-header.css?v=20261103-r5c');
  addStyle(base + 'assets/css/tlist/weekly/offbeat-tier-a1.css?v=20261104-a1');

  // Change presentation only; the existing tierlist-nav.js still resolves links.
  const prev = nav.querySelector('.nav-left');
  const next = nav.querySelector('.nav-right');
  const back = nav.querySelector('.nav-center');
  if (prev) prev.textContent = '\u00AB ' + prev.textContent.replace(/^[\s\u2190\u00AB]+/, '').trim();
  if (next) next.textContent = next.textContent.replace(/[\s\u2192\u00BB]+$/, '').trim() + ' \u00BB';
  if (back) {
    back.textContent = 'Back to Anime Top';
    back.href = base + '#anime';
  }

  const mast = document.createElement('div');
  mast.id = 'offbeat-global-header';
  mast.setAttribute('aria-label', 'OFFBEAT site header');
  nav.parentNode.insertBefore(mast, nav);
  const script = document.createElement('script');
  script.src = base + 'assets/js/common/offbeat-header.js?v=20261104-tier-a1';
  script.onerror = () => console.error('OFFBEAT shared header script failed to load.');
  document.body.appendChild(script);
})();
