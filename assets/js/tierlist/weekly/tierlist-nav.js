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

    const availableWeeks = weeksRaw.map(w => w.toLowerCase().replace(/\s+/g, ''));
    const finalWeek = seasonData.final?.toLowerCase().replace(/\s+/g, '');
    const normalizedCurrentWeek = currentWeek.toLowerCase().replace(/\s+/g, '');

    const currentIndex = availableWeeks.indexOf(normalizedCurrentWeek);
    const prevWeek = currentIndex > 0 ? availableWeeks[currentIndex - 1] : null;
    const nextWeek = currentIndex >= 0 && currentIndex < availableWeeks.length - 1
      ? availableWeeks[currentIndex + 1]
      : null;

    const basePath = `/animeb-v1/tierlist/${year}/${correctedSeason.toLowerCase()}/`;

    // 前のリンク
    if (prevWeek) {
  prevLink.href = `${basePath}${prevWeek}/tierlist.html`;
} else {
  const prevInfo = getPrevSeason(year, correctedSeason);
  const prevSeasonData = data?.[prevInfo.year]?.[prevInfo.season];
  const prevFinal = prevSeasonData?.final?.toLowerCase().replace(/\s+/g, '');
  if (prevFinal) {
    prevLink.href = `/animeb-v1/tierlist/${prevInfo.year}/${prevInfo.season.toLowerCase()}/${prevFinal}/tierlist.html`;
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
  const nextStart = nextSeasonData?.weeks?.[0]?.toLowerCase().replace(/\s+/g, '');
  if (nextStart) {
    nextLink.href = `/animeb-v1/tierlist/${nextInfo.year}/${nextInfo.season.toLowerCase()}/${nextStart}/tierlist.html`;
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

// 押せないリンクを無効化（グレーアウト中）
prevLink.addEventListener("click", (e) => {
  if (prevLink.classList.contains("disabled")) e.preventDefault();
});
nextLink.addEventListener("click", (e) => {
  if (nextLink.classList.contains("disabled")) e.preventDefault();
});
