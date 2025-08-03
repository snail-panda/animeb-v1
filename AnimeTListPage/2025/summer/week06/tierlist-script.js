/* Tier List 用 html CSS JS Json 分離型*/

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
  const safeIntro = data.intro.replace(/\n/g, "<br>");
document.getElementById("introText").innerHTML = safeIntro;

const safeContent = data.content.replace(/\n/g, "<br>");
document.getElementById("contentText").innerHTML = safeContent;

const safeConclusion = data.conclusion.replace(/\n/g, "<br>");
document.getElementById("conclusionText").innerHTML = safeConclusion;

// ← この下あたりに追加するのが自然
  fetch("content.html")
  .then(res => res.ok ? res.text() : null)
  .then(html => {
    if (html) {
      document.getElementById("contentText").innerHTML = html;
    }
  });

  
  document.getElementById("tierImage").src = data.tierImage;

  // Tier Guide
  // 最初に詳細版を読み込む
  document.getElementById("tierGuide").innerHTML = data.tierGuide;

  // criteria-listのliから簡易版を生成
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

  // Disclaimer
  document.getElementById("disclaimer").innerHTML = data.disclaimer;

  // Titles by Tier
  const tierSections = document.getElementById("tierSections");
  const tiers = data.tiers;

  for (const [tierName, titles] of Object.entries(tiers)) {
    const section = document.createElement("div");
    section.className = "tier-section";

  // --- 🔧 ここでマッピングを適用 ---
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
});

