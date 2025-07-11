/* Tier List 用 html CSS JS Json 分離型*/

document.addEventListener("DOMContentLoaded", function() {
  // Load data from tierlistData
  const data = tierlistData;

 // --- 🔧 正規化マッピングここに追加 ---
  const classMap = {
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
  
  document.getElementById("tierImage").src = data.tierImage;

  // Tier Guide
  document.getElementById("tierGuide").innerHTML = data.tierGuide;

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

