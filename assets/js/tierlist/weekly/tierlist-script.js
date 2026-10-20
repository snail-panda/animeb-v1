/* Tier List 用 html CSS JS Json 分離型 */

document.addEventListener("DOMContentLoaded", function() {
  

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
    "RecentlyDropped": "recently-dropped",
    // 追加（JSONのキーに合わせてどちらか一方を使う）
  "Never Watched": "neverwatched",
  // "NeverWatched": "neverwatched",
  };


// v11: Explicit opt-in metadata tokens in article snippets.
// Text nodes only: do not rewrite prose, HTML attributes, or existing dates.
// Available after JSON loads; no changes are made to legacy text unless a token exists.
let tierArticleMetadata = null;
function applyTierArticleMetadata(root) {
  if (!root || !tierArticleMetadata) return;
  const tokens = {
    "{{year}}": tierArticleMetadata.year,
    "{{season}}": tierArticleMetadata.season,
    "{{previousSeason}}": tierArticleMetadata.previousSeason,
    "{{previousYear}}": tierArticleMetadata.previousYear,
    "{{nextSeason}}": tierArticleMetadata.nextSeason,
    "{{nextYear}}": tierArticleMetadata.nextYear,
    "{{week}}": tierArticleMetadata.week,
    "{{weekNumber}}": tierArticleMetadata.weekNumber,
    "{{seasonDate}}": tierArticleMetadata.seasonDate,
    "{{publishedDate}}": tierArticleMetadata.publishedDate,
    "{{updatedDate}}": tierArticleMetadata.updatedDate
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (!/\{\{(?:year|season|previousSeason|previousYear|nextSeason|nextYear|week|weekNumber|seasonDate|publishedDate|updatedDate)\}\}/.test(node.nodeValue)) return;
    node.nodeValue = node.nodeValue.replace(/\{\{(?:year|season|previousSeason|previousYear|nextSeason|nextYear|week|weekNumber|seasonDate|publishedDate|updatedDate)\}\}/g, token => tokens[token] == null ? token : String(tokens[token]));
  });
}
function applyTierMetadataToArticles() {
  ["introText","contentText","conclusionText"].forEach(id => applyTierArticleMetadata(document.getElementById(id)));
}

// ✅ intro.html 読み込み
  fetch("intro.html")
    .then(res => res.ok ? res.text() : null)
    .then(html => {
      const target = document.getElementById("introText");
      if (html) {
        target.innerHTML = html;
        applyTierArticleMetadata(target);
      }
    });


 // ✅ content.html 読み込み
  fetch("content.html")
    .then(res => res.ok ? res.text() : null)
    .then(html => {
      const target = document.getElementById("contentText");
      if (html) {
        target.innerHTML = html;
        applyTierArticleMetadata(target);
      }
    });

// ✅ conclusion.html 読み込み
  fetch("conclusion.html")
    .then(res => res.ok ? res.text() : null)
    .then(html => {
      const target = document.getElementById("conclusionText");
      if (html) {
        target.innerHTML = html;
        applyTierArticleMetadata(target);
      }
    });


  // ========== Tier Guide ロード ==========
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

  const tierGuidePath = `../../../../assets/js/tierlist/weekly/tierguide-${week}.js`;
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

// ========== Tier Image ロード ==========

function setTierImage() {
  const pathParts = window.location.pathname.split("/");
  const year = pathParts[pathParts.indexOf("tierlist")+1];   // "2025"
  const season = pathParts[pathParts.indexOf("tierlist")+2]; // "summer"
  const week = pathParts[pathParts.indexOf("tierlist")+3];   // "week06"

  // ファイル名例: tierlist-2025-summer-week06.png
  const imgPath = `../../../../images/tier-lists/${year}/${season}/${week}/tierlist-${year}-${season}-${week}.png`;

  console.log("Tier image path:", imgPath);
  document.getElementById("tierImage").src = imgPath;
}


  // Titles by Tier をJSONからロードし、Season Title/Dateも設定
  function loadTiersFromJSON() {
  const pathParts = window.location.pathname.split("/");
  const year = pathParts[pathParts.indexOf("tierlist")+1];   // "2025"
  const season = pathParts[pathParts.indexOf("tierlist")+2]; // "summer"
  const week = pathParts[pathParts.indexOf("tierlist")+3];   // "week06"

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
      const heading = document.getElementById("seasonTitle");
      heading.textContent = "";
      const match = fullSeasonTitle.match(/^(\d{4})\s+(Spring|Summer|Fall|Winter)(.*)$/i);
      if (match) {
        heading.append(document.createTextNode(match[1]+" "));
        const seasonSpan = document.createElement("span");
        seasonSpan.className = "season-highlight " + match[2].toLowerCase();
        seasonSpan.textContent = match[2];
        heading.append(seasonSpan,document.createTextNode(match[3]));
      } else heading.textContent=fullSeasonTitle;
      // Common editorial header: use each page's JSON without modifying article HTML.
      // Refuse to apply the theme if JSON season disagrees with the URL folder.
      const urlSeason = String(season || "").toLowerCase();
      const jsonSeason = match ? match[2].toLowerCase() : "";
      const jsonYear = match ? match[1] : "";
      const validPage = Boolean(match && jsonSeason === urlSeason && jsonYear === String(year));
      if (validPage) {
        // Keep the browser-tab title in sync with the validated article JSON.
        if (String(jsonData.version || "").trim()) document.title = fullSeasonTitle.trim();
        // Reuse the year-aware season navigation rules (Winter <-> Fall rollover).
        const currentSeason = jsonSeason.charAt(0).toUpperCase() + jsonSeason.slice(1);
        const previous = typeof getPrevSeason === "function" ? getPrevSeason(year, currentSeason) : null;
        const next = typeof getNextSeason === "function" ? getNextSeason(year, currentSeason) : null;
        if (!previous || !next) console.warn("Previous/next season metadata unavailable: tierlist-nav.js was not loaded");
        tierArticleMetadata = {
          year: String(year),
          season: currentSeason,
          previousSeason: previous?.season ?? null,
          previousYear: previous?.year ?? null,
          nextSeason: next?.season ?? null,
          nextYear: next?.year ?? null,
          week: String(week),
          weekNumber: String(Number(String(week).replace(/^week/i, ""))),
          seasonDate: jsonData.seasonDate ?? null,
          publishedDate: jsonData.publishedDate ?? null,
          updatedDate: jsonData.updatedDate ?? null
        };
        applyTierMetadataToArticles();
        const body = document.body;
        ["fall-hero-v27", "fall-hero-v28", "fall-hero-v29", "fall-hero-v30", "fall-hero-v31", "fall-hero-v32"].forEach(cls => body.classList.add(cls));
        body.classList.add("tierlist-editorial-common", "tierlist-theme-" + jsonSeason);
        const header = heading.closest(".post-header");
        if (header && !header.querySelector(".fall-hero-eyebrow")) {
          const eyebrow = document.createElement("div");
          eyebrow.className = "fall-hero-eyebrow";
          const brand = document.createElement("span");
          brand.textContent = "OFFBEAT";
          const slash = document.createElement("span");
          slash.className = "fall-hero-slash";
          slash.textContent = " / ";
          const tier = document.createElement("span");
          tier.className = "fall-hero-eyebrow-tier";
          tier.textContent = "TIER LIST";
          eyebrow.append(brand, slash, tier);
          header.insertBefore(eyebrow, heading);
        }
        heading.textContent = "";
        const yearEl = document.createElement("span");
        yearEl.className = "fall-hero-year";
        yearEl.textContent = jsonYear;
        const seasonEl = document.createElement("span");
        seasonEl.className = "fall-hero-season";
        seasonEl.textContent = jsonSeason.toUpperCase();
        const left = document.createElement("span");
        left.className = "fall-hero-left";
        left.append(yearEl, seasonEl);
        const right = document.createElement("span");
        right.className = "fall-hero-right";
        const lines = document.createElement("span");
        lines.className = "fall-hero-lines";
        // Split the supplied title only at the Tier List phrase and episode suffix.
        // No hard-coded Premiere, Mid-Season, Finale or episode number.
        const versionText = String(jsonData.version || "").trim();
        const suffixMatch = versionText.match(/\s*[–—-]\s*(Episodes?\s+.+)$/i);
        const episodeText = suffixMatch ? suffixMatch[1].trim() : "";
        const mainText = suffixMatch ? versionText.slice(0, suffixMatch.index).trim() : versionText;
        const tierMatch = mainText.match(/\bTier\s+List\b/i);
        const lead = tierMatch ? mainText.slice(0, tierMatch.index).trim() : mainText;
        const tail = tierMatch ? mainText.slice(tierMatch.index).trim() : "";
        // Keep the Premiere article's approved line breaks without altering its words.
        const parts = /Anime Season Premiere\s*\/\s*First impressions?/i.test(lead)
          ? lead.replace(/^(Anime Season)\s+(Premiere\s*\/)\s+(First impressions?)$/i, "$1|$2|$3").split("|")
          : [lead];
        parts.forEach(part => {
          const line = document.createElement("span");
          line.textContent = part;
          lines.appendChild(line);
        });
        if (tail) {
          const tierLine = document.createElement("span");
          tierLine.className = "fall-hero-tier";
          tierLine.textContent = tail;
          lines.appendChild(tierLine);
        }
        right.appendChild(lines);
        if (episodeText) {
          const episode = document.createElement("span");
          episode.className = "fall-hero-episode";
          episode.textContent = "— " + episodeText;
          right.appendChild(episode);
        }
        heading.append(left, right);

        // v4: fit the rendered season word to its actual column width.
        // This is independent of viewport size, so split-screen desktop widths
        // and phone orientations cannot cause a word to cross the divider.
        const fitSeason = () => {
          seasonEl.style.fontSize = "";
          const available = left.getBoundingClientRect().width;
          const actual = seasonEl.getBoundingClientRect().width;
          if (!available || !actual) return;
          if (actual > available - 2) {
            const initial = parseFloat(getComputedStyle(seasonEl).fontSize);
            seasonEl.style.fontSize = Math.max(12, initial * (available - 3) / actual * .985) + "px";
          }
        };
        let fitQueued = false;
        const queueFit = () => {
          if (fitQueued) return;
          fitQueued = true;
          requestAnimationFrame(() => { fitQueued = false; fitSeason(); });
        };
        queueFit();
        window.addEventListener("resize", queueFit, {passive:true});
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueFit);
        if (typeof ResizeObserver !== "undefined") {
          new ResizeObserver(queueFit).observe(left);
        }
      } else {
        console.warn("Editorial header skipped: JSON season/year differs from page URL", jsonData.season, year, season);
      }
      // v26 editorial image heading, restored for every seasonal week.
      // Earlier weekly HTML pages lack the caption node that Fall Week 01 has.
      const imageColumn = document.querySelector(".tierlist-image");
      let caption = imageColumn && imageColumn.querySelector(".tier-image-caption");
      if (imageColumn && !caption) {
        caption = document.createElement("div");
        caption.className = "tier-image-caption";
        caption.setAttribute("aria-label", "Tier list caption");
        imageColumn.insertBefore(caption, imageColumn.firstChild);
      }
      if (caption) {
        // Preserve v26's seasonal caption hierarchy, but use each page's
        // actual version (Mid-Season, Finale, Premiere) rather than a
        // hard-coded First Impression / Episode 1 label.
        const seasonLabel = match ? match[1] + " " + match[2] : String(jsonData.season || "");
        caption.textContent = seasonLabel + " Anime — " + String(jsonData.version || "Tier List").trim();
      }
      // Legacy JSON uses `date`, newer JSON uses `seasonDate`.
      const dateNode = document.getElementById("seasonDate");
      if (dateNode) dateNode.textContent = jsonData.seasonDate || jsonData.date || "";

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
        // 完全に空配列の場合だけスキップ
  if (!titles || (titles.length === 1 && titles[0].trim() === "")) {
    continue;
  }

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

        if (titles.length === 1 && titles[0].toLowerCase() === "no entry") {
    // No entry でもボタンは作成、クリック時に表示
    const noEntryDiv = document.createElement("div");
  noEntryDiv.textContent = "No entry";
  noEntryDiv.className = "no-entry-text hidden"; // 初期状態で非表示

  section.appendChild(button);
  section.appendChild(noEntryDiv);
  tierSections.appendChild(section);

  // ボタンクリックで表示切替
  button.addEventListener("click", function() {
    noEntryDiv.classList.toggle("hidden");
  });

  continue;
  } else {

    // 通常のリスト表示

        titles.forEach(title => {
          const li = document.createElement("li");
          li.textContent = title;
          list.appendChild(li);
        });

        section.appendChild(button);
        section.appendChild(list);
  }  
        tierSections.appendChild(section);
      }
    })
    .catch(err => {
      console.error(err);
    });
}
});
// v23: accessible click-to-zoom image viewer (desktop and touch).
document.addEventListener("DOMContentLoaded",()=>{
 const img=document.getElementById("tierImage");if(!img)return;
 const viewer=document.createElement("div");viewer.className="tier-image-viewer";viewer.setAttribute("role","dialog");viewer.setAttribute("aria-label","Enlarged tier list image");viewer.setAttribute("aria-modal","true");
 viewer.innerHTML='<div class="tier-image-toolbar"><button type="button" data-action="minus" aria-label="Zoom out">−</button><span>Tier List · Zoom & pan</span><button type="button" data-action="plus" aria-label="Zoom in">+</button><button type="button" data-action="close">Close ×</button></div><div class="tier-image-scroll"><img alt="Enlarged tier list"></div>';
 document.body.append(viewer);const enlarged=viewer.querySelector("img"),scroll=viewer.querySelector(".tier-image-scroll");let zoom=window.innerWidth<=480?280:170;
 function setZoom(){enlarged.style.width=zoom+"%";}
 function close(){viewer.classList.remove("is-open");document.body.style.overflow="";}
 const isTouchLayout=()=>matchMedia("(hover:none), (pointer:coarse)").matches;
 function alignTierHeadings(){const caption=document.querySelector(".tier-image-caption"),header=document.querySelector(".tierlist-titles-header");if(!caption||!header)return;caption.style.minHeight="";header.style.minHeight="";const height=Math.max(caption.getBoundingClientRect().height,header.getBoundingClientRect().height);caption.style.minHeight=height+"px";header.style.minHeight=height+"px";}
 requestAnimationFrame(alignTierHeadings);window.addEventListener("resize",alignTierHeadings);
 // JSON is loaded asynchronously. Re-align once its missing caption is inserted.
 const imageColumnForHeading = document.querySelector(".tierlist-image");
 if (imageColumnForHeading && typeof MutationObserver !== "undefined") {
   const headingObserver = new MutationObserver(() => {
     if (imageColumnForHeading.querySelector(".tier-image-caption")) {
       headingObserver.disconnect();
       requestAnimationFrame(alignTierHeadings);
       if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignTierHeadings);
     }
   });
   if (!imageColumnForHeading.querySelector(".tier-image-caption")) {
     headingObserver.observe(imageColumnForHeading,{childList:true});
   } else if (document.fonts && document.fonts.ready) {
     document.fonts.ready.then(alignTierHeadings);
   }
 }
 const hint=document.createElement("p");
 hint.className="tier-image-touch-hint";
 hint.textContent=isTouchLayout()?"Tap to enlarge · Tap again for full-screen view":"Hover to enlarge · Click for full-screen zoom & pan";
 img.insertAdjacentElement("afterend",hint);

 function openViewer(){img.classList.remove("mobile-preview-zoom");enlarged.src=img.currentSrc||img.src;zoom=window.innerWidth<=480?280:170;setZoom();viewer.classList.add("is-open");document.body.style.overflow="hidden";scroll.scrollTop=0;scroll.scrollLeft=0;}
 img.addEventListener("click",()=>{if(isTouchLayout()&&!img.classList.contains("mobile-preview-zoom")){img.classList.add("mobile-preview-zoom");return;}openViewer();});
 document.addEventListener("click",e=>{if(!img.contains(e.target)&&!viewer.contains(e.target))img.classList.remove("mobile-preview-zoom");});
 viewer.addEventListener("click",e=>{const action=e.target?.dataset?.action;if(action==="close")close();else if(action==="plus"){zoom=Math.min(600,zoom+35);setZoom();}else if(action==="minus"){zoom=Math.max(100,zoom-35);setZoom();}else if(e.target===viewer)close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 if(matchMedia("(hover:hover) and (pointer:fine)").matches){img.addEventListener("mouseenter",()=>{const r=img.getBoundingClientRect();img.style.transformOrigin=window.innerWidth-r.right < r.width*.8?"right center":"left center";});}
});
