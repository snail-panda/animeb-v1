/* Tier List 用 html CSS JS Json 分離型*/

document.addEventListener("DOMContentLoaded", function() {
  // Load data from tierlistData
  const data = tierlistData;

  document.getElementById("seasonTitle").textContent = data.seasonTitle;
  document.getElementById("seasonDate").textContent = data.seasonDate;
  document.getElementById("introText").textContent = data.intro;
  document.getElementById("conclusionText").textContent = data.conclusion;
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

    const button = document.createElement("button");
    button.className = `toggle-button ${tierName.toLowerCase()}-button`;
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
