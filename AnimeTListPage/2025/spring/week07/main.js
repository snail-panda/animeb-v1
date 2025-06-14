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



const tierlistData = {
  seasonTitle: "2025 Spring Anime Mid-Season Tier List – Episodes 7–8",
  seasonDate: "May 31, 2025",
  intro: "We’re already halfway through the season! Here’s my updated tier list after Episode 8. Some shows continue to shine, others fell off, and a few... I had to drop.",
  content: "The mid-season tier highlight definitely revolves around the sub-top tiers like A, B, and C. While SS, S, and D are pretty much locked in, mid-tier titles such as Mobile Suit Gundam GQuuuuuuX, Kowloon Generic Romance, and From the Old Country Bumpkin... are still holding some potential to rise — though honestly, they're quite wobbly. From my personal view, Gundam and From the Old... have finally started showing some of their own charm, though not fully baked yet. Hopefully they'll offer a bit more than what we saw back in Episode 1. \nThe mid-season highlight tends to revolve around the sub-top tiers — A, B, and C. While SS, S, and D are mostly stable, mid-tier titles often show both signs of potential and inconsistency. Some shows, like Mobile Suit Gundam GQuuuuuuX, Kowloon Generic Romance, and From the Old Country Bumpkin..., are starting to reveal their strengths, but still feel a bit shaky overall. Hopefully, the coming episodes will give a clearer sense of where these shows are really headed. \nMid-season shifts mainly appear in the mid-tiers — A, B, and C — where some titles keep wobbling while showing small flashes of potential. For now, shows like Mobile Suit Gundam GQuuuuuuX, Kowloon Generic Romance, and From the Old Country Bumpkin... are still hanging in there, slightly improving but not fully convincing yet. I hope the next few episodes will give them more room to settle and show stronger direction.",
  conclusion: "That wraps up my Ep. 7–8 impressions. Thanks for reading! I'll see you again for the 2025 Spring Final Tier List.  (And hey—don't forget to let me know where your favorites landed!)",
  tierImage: "https://i.postimg.cc/CK5DYTZ7/2025midspring-tier-list-ep7-8.png",
  tierGuide: `
    <h4 class="criteria-title">Tier Guide</h4>
    <ul class="criteria-list">
      <li><span class="ss">🔴 SS – CELESTIAL</span> Crème de la crème. Absolute must-watch.</li>
      <li><span class="s">🟠 S – GREAT</span> Strong execution and great energy, just shy of that tiny spark of god-tier brilliance. This is where recommendations really start.</li>
      <li><span class="a">🟡 A – GOOD</span> Solid work, still holding attention. Definitely enjoyable, but started wobbling, or vice versa.</li>
      <li><span class="b">⚪ B – DECENT</span> Not essential, but fully watchable. Perfectly fine for light watching. You won't miss much if you skip it.</li>
      <li><span class="c">🟢 C – BAD / ABYSMAL</span> As most things fail to click, but faint hope still lingers if a few pieces finally fall into place.</li>
      <li><span class="d">🔻 D – TRASH</span> Pure trash barely justifying watch time. But sometimes bad enough for fun, creating twisted flashes of charm. Falling apart — yet weirdly still a part of what makes the full anime season complete.</li>
      <li><span class="dropped">🔵 DROPPED / PICKING BACK UP</span> Dropped for now. Some might get another shot to win me back. We’ll see.</li>
      <li><span class="na">⚫ N/A – Disqualified</span> Judgement made. In the void.</li>
    </ul>
  `,
  disclaimer: `
  <div class="disclaimer-title">*Note on N/A Disqualified Tier:</div>
  Most titles in the N/A Disqualified tier were dropped or excluded from my watch pool after the first few episodes or even during it. Some didn’t last more than a few minutes, while others were ruled out at a glance—or not even. That doesn’t mean they’re all “absolute trash.” Most just weren’t my cup of tea or didn’t suit the ranking format. Some shows—even if good or fun in their own way—just don’t fit the structure or vibe of my weekly list. That said, yeah, a few were truly dookie.`,
  
  tiers: {
     "SS": [
      "The Apothecary Diaries 2nd Season",
      "Sword of the Demon Hunter",
      "Shoshimin: How to Become Ordinary 2"
    ],
    "S": [
      "Apocalypse Hotel",
      "A Ninja and an Assassin Under One Roof",
      "Me and the Alien MuMu"
    ],
    "A": [
      "Mobile Suit Gundam GQuuuuuuX",
      "The Catcher in the Ballpark!"
    ],
    "B": [
      "Please Put Them On",
      "Kowloon Generic Romance"
    ],
    "C": [
      "From Old Country Bumpkin to Master Swordsman: My Hotshot Disciples Are All Grown Up Now",
      "Your Forma",
      "Miru: Paths to My Future"
    ],
    "D": [
      "Can a Boy-Girl Friendship Survive?",
      "Once Upon a Witch's Death"
    ],
    "Dropped": [
      "LAZARUS",
      "Uma Musume: Cinderella Grey",
      "The Dinner Table Detective",
      "Mono",
      "Anne Shirley",
      "Zatsu Tabi: That's Journey",
      "Rock wa Lady no Tashinami deshite",
      "Food For the Soul",
      "The Shiunji Family Children",
      "The Too-Perfect Saint: Tossed Aside by My Fiancé and Sold to Another Kingdom",
      "Summer Pockets"
    ],
    "N/A": [
      "The Mononoke Lecture Logs of Chuzenji-sensei",
      "The Brilliant Healer's New Life in the Shadows",
      "Maebashi Witches",
      "Aharen Is Indecipherable 2nd Season",
      "Moonrise",
      "Yandere Dark Elf: She Chased Me All the Way From Another World!",
      "The Beginning After the End",
      "Witch Watch"
],
    "RecentlyDropped": ["Your Forma", "Uma Musume: Cinderella Grey", "Summer Pockets", "LAZARUS"
]
  }
}
