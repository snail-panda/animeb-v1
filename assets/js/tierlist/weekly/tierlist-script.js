/* Tier List 用 html CSS JS Json 分離型 */

document.addEventListener("DOMContentLoaded", function() {
  // Load data from tierlistData
  const data = tierlistData;

 // --- 🔧 正規化マッピングここに追加 ---
  const classMap = {
	"SSS": "sss",
    "SS": "ss",
    "S": "s",
    "A": "a",
    "B": "b",
    "C": "c",
    "D": "d",
    "Dropped": "dropped",
    "N/A": "na",
    "RecentlyDropped": "recently-dropped"
  };
  
  document.getElementById("seasonTitle").textContent = data.seasonTitle;
  document.getElementById("seasonDate").textContent = data.seasonDate;

 // ✅ contentText用のsafeContent は削除！でもいまはコメントアウト
  /* const safeIntro = data.intro.replace(/\n/g, "<br>"); */

// ✅ introText を先に読みに行きなければdata.jsのcontentをfallbackで読みに行く

fetch("intro.html")
  .then(res => res.ok ? res.text() : null)
  .then(html => {
    const target = document.getElementById("introText");
    if (html) {
      target.innerHTML = html;
    } else {
      target.innerHTML = tierlistData.intro;
    }
});


// ✅ contentText用のsafeContent は削除！でもいまはコメントアウト
/* const safeContent = data.content.replace(/\n/g, "<br>"); */

// ✅ contentText を先に読みに行きなければdata.jsのcontentをfallbackで読みに行く

fetch("content.html")
  .then(res => res.ok ? res.text() : null)
  .then(html => {
    const target = document.getElementById("contentText");
    if (html) {
      target.innerHTML = html;
    } else {
      target.innerHTML = tierlistData.content;
    }
});

// ✅ conclusionText用のsafeContent は削除！でもいまはコメントアウト
/* const safeConclusion = data.conclusion.replace(/\n/g, "<br>"); */

// ✅ conclusionText を先に読みに行きなければdata.jsのcontentをfallbackで読みに行く

fetch("conclusion.html")
  .then(res => res.ok ? res.text() : null)
  .then(html => {
    const target = document.getElementById("conclusionText");
    if (html) {
      target.innerHTML = html;
    } else {
      target.innerHTML = tierlistData.conclusion;
    }
});


  // Tier Guide
   // Tier Guide（週別自動読み込みに変更）まず詳細版

  function getWeekFolder() {
  // 1. もしグローバル変数があればそれを使う
  if (window.weekFolder) {
    return window.weekFolder;
  }

  // 2. なければURLからweekXXを抽出
  const match = window.location.pathname.match(/(week\d{2})/);
  return match ? match[1] : null;
}


  function loadTierGuide() {
  const week = getWeekFolder();
  console.log("Detected week folder:", week); // デバッグ用
  if (!week) {
    console.error("Week folder could not be determined.");
    return;
  }

  const tierGuidePath = `/animeb-v1/assets/js/tierlist/weekly/tierguide-${week}.js`;
  console.log("Loading tier guide from:", tierGuidePath); // デバッグ用

  const script = document.createElement("script");
  script.src = tierGuidePath;
  script.onload = function() {
    console.log("Tier guide script loaded");
    if (typeof tierGuideData !== "undefined") {
      console.log("tierGuideData found:", tierGuideData);
      const box = document.getElementById("tierGuide");
      if (box) box.innerHTML = tierGuideData.tierGuide;

      const disclaimerBox = document.getElementById("disclaimer");
      if (disclaimerBox) disclaimerBox.innerHTML = tierGuideData.disclaimer;

      // 以下は簡易版生成とトグル（省略せずそのまま）
      const simpleList = document.createElement("ul");
      simpleList.className = "criteria-simple";
      document.querySelectorAll(".criteria-list li").forEach(li => {
        const simpleLi = document.createElement("li");
        const span = li.querySelector("span");
        if (span) {
          simpleLi.textContent = span.textContent;
          simpleList.appendChild(simpleLi);
        }
      });
      // 最初はcriteria-list(詳細版)を非表示
      document.querySelector(".criteria-list").classList.add("hidden");
      // 最初は簡易版だけ見せる
      document.getElementById("tierGuide").appendChild(simpleList);

      //🔽 ここに追記 トグルボタン show details button and function added
      const toggleButton = document.createElement('button');
      toggleButton.id = "toggleTierGuide";
      toggleButton.textContent = "Show details";
      toggleButton.classList.add("tier-guide-toggle");
      document.getElementById("tierGuide").appendChild(toggleButton);

      // ボタンクリックで切替
      toggleButton.addEventListener("click", function() {
        const detailed = document.querySelector(".criteria-list");
        const simple = document.querySelector(".criteria-simple");
        if (detailed.classList.contains("hidden")) {
          // 詳細版を出す→簡易版を隠す
          detailed.classList.remove("hidden");
          simple.classList.add("hidden");
          toggleButton.textContent = "Hide details";
        } else {
          // 簡易版に戻す
          detailed.classList.add("hidden");
          simple.classList.remove("hidden");
          toggleButton.textContent = "Show details";
        }
      });
    } else {
      console.error("tierGuideData is undefined!");
    }
  };
  document.body.appendChild(script);
}


loadTierGuide();
setTierImage();
loadTiersFromJSON();

function setTierImage() {
  const pathParts = window.location.pathname.split("/");
  const year = pathParts[3];   // "2025"
  const season = pathParts[4]; // "summer"
  const week = pathParts[5];   // "week06"

  // ファイル名例: tierlist-2025-summer-week06.png
  const imgPath = `/animeb-v1/images/tier-lists/${year}/${season}/${week}/tierlist-${year}-${season}-${week}.png`;

  console.log("Tier image path:", imgPath);
  document.getElementById("tierImage").src = imgPath;
}


  // Titles by Tier をJSONからロードし、Season Title/Dateも設定
  function loadTiersFromJSON() {
  const pathParts = window.location.pathname.split("/");
  const year = pathParts[3];   // "2025"
  const season = pathParts[4]; // "summer"
  const week = pathParts[5];   // "week06"

   // JSONファイル名はシンプルに：tierlist-${year}-${season}-${week}.json
  const jsonPath = `tierlist-${year}-${season}-${week}.json`;

  console.log("Loading tiers JSON from:", jsonPath);

  fetch(jsonPath)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${jsonPath}`);
      return res.json();
    })
    .then(jsonData => {

     /* ============================
         1. Season Title と Season Date を設定
         ============================ */
      // JSONには "season" と "version" が別々にあるので、結合して seasonTitle にする
      const fullSeasonTitle = `${jsonData.season} ${jsonData.version}`;
      document.getElementById("seasonTitle").textContent = fullSeasonTitle;

      // seasonDate はJSONにある値をそのまま使う
      document.getElementById("seasonDate").textContent = jsonData.seasonDate;

    /* ============================
         2. Titles by Tier の生成
         ============================ */

      if (!jsonData.tiers) {
        console.error("No 'tiers' key found in JSON");
        return;
      }

      const tierSections = document.getElementById("tierSections");
      tierSections.innerHTML = ""; // 初期化

      for (const [tierName, titles] of Object.entries(jsonData.tiers)) {
        const section = document.createElement("div");
        section.className = "tier-section";

      // マッピング適用（classMapは外部スコープで定義されている想定）
        const normalizedClass = classMap[tierName.trim()] || tierName.trim().toLowerCase();

        const button = document.createElement("button");
        button.className = `toggle-button ${normalizedClass}-button`;
        button.textContent = tierName;
        button.addEventListener("click", function() {
          list.classList.toggle("hidden");
        });

        const list = document.createElement("ul");
        list.className = "tier-list hidden";
        titles.forEach(title => {
          const li = document.createElement("li");
          li.textContent = title;
          list.appendChild(li);
        });

        section.appendChild(button);
        section.appendChild(list);
        tierSections.appendChild(section);
      }
    })
    .catch(err => {
      console.error(err);
    });
}
});