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

// Structured editorial, opt-in per article. Legacy prose is never replaced unless
// the page explicitly requests auto mode. All copy is derived from this edition.
const autoEditorial = document.body.dataset.tierEditorial === "auto";
function renderTierEditorial(data, meta, lang = "en") {
  const ja = lang === "ja";
  const tr = (en, jp) => ja ? jp : en;
  const a = data.analysis, n = a?.counts;
  const intro = document.getElementById("introText"), content = document.getElementById("contentText"), conclusion = document.getElementById("conclusionText");
  if (!intro || !content || !conclusion) return;
  const make = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text != null) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const para = (root, text) => root.append(make("p", text));
  const heading = (root, text) => root.append(make("h3", text, "tier-editorial-subheading"));
  [intro, content, conclusion].forEach(el => el.replaceChildren());
  // Fail closed rather than displaying a previous season's copied text.
  if (!meta || !n || !Array.isArray(a.distribution) || !a.changes ||
      ![n.totalTitles,n.ratedTitles,n.totalDropped,n.unrated].every(x => Number.isInteger(x) && x >= 0) ||
      n.ratedTitles + n.totalDropped + n.unrated !== n.totalTitles) {
    para(intro, tr("This edition's analysis is currently unavailable. The tier list below remains available.", "この回の分析データは現在表示できません。ティアリストは下からご覧いただけます。"));
    return;
  }
  const seasonJa = {Winter:"冬",Spring:"春",Summer:"夏",Fall:"秋"}[meta.season] || meta.season;
  const season = tr(`${meta.season} ${meta.year}`, `${meta.year}年${seasonJa}`);
  const week = String(meta.weekNumber).padStart(2,"0");
  const stage = week === "01" ? tr("first impressions", "初回の印象") : week === "06" ? tr("midseason", "中間時点") : week === "12" ? tr("season finale", "最終時点") : tr(`Week ${week}`, `第${Number(week)}週`);
  const episode = String(data.version || "").match(/Episodes?\s+([0-9]+(?:\s*[–—-]\s*[0-9]+)?)/i);
  const episodeLabel = episode ? tr(` (around episode${/[–—-]/.test(episode[1])?"s":""} ${episode[1]})`, `（第${episode[1]}話前後）`) : "";
  const baseline = a.hasBaseline === true && Number.isInteger(n.previousRated) && Number.isInteger(n.previousTotal);
  const baselineText = String(a.baseline || "");
  const baselineWeek = baselineText.match(/\bW(?:eek\s*)?(\d{1,2})\b/i);
  const previous = baselineWeek ? tr(`Week ${baselineWeek[1].padStart(2,"0")}`, `第${Number(baselineWeek[1])}週`) : tr("the previous edition", "前回");
  const change = (key) => Array.isArray(a.changes[key]) ? a.changes[key] : [];
  const num = (key) => change(key).length;
  const custom = data.editorial?.[lang];
  const addCustom = (root, key) => {
    if (typeof custom?.[key] === "string" && custom[key].trim()) custom[key].trim().split(/\n\s*\n/).forEach(t => para(root,t));
  };
  para(intro, tr(`Here is the ${season} anime tier list at ${stage}${episodeLabel}. Week ${week} includes ${n.totalTitles} titles: ${n.ratedTitles} in the rated tiers, ${n.totalDropped} marked as Dropped, and ${n.unrated} outside the rated tiers (neither rated nor dropped).`, `${season}アニメの${stage}${episodeLabel}のティアリストです。第${Number(week)}週では全${n.totalTitles}作品を掲載し、評価対象は${n.ratedTitles}作品、ドロップは${n.totalDropped}作品、それ以外の評価対象外は${n.unrated}作品です。`));
  if (baseline) {
    para(intro, tr(`Compared with ${previous}, ${num("promotions")} titles moved up a rated tier and ${num("demotions")} moved down. ${num("newlyDropped")} titles moved into a Dropped category.`, `${previous}との比較では、評価Tier内の昇格が${num("promotions")}作品、降格が${num("demotions")}作品、新たにドロップ区分へ移った作品が${num("newlyDropped")}作品です。`));
  }
  addCustom(intro,"intro");
  const note = make("aside", null, "tier-auto-note");
  note.append(make("strong", tr("A note on the tier list", "ティアリストについて")));
  const noteEn = "The tier list is a separate assessment from the Weekly Ranking. Titles excluded from the Weekly Ranking may still be evaluated here. A change to Dropped refers to this tier list, not necessarily to the date a title left the Weekly Ranking.";
  const noteJa = "ティアリストはウィークリーランキングとは別の評価です。週間ランキングの対象外となった作品でも、ここでは評価される場合があります。ドロップへの移動はティアリスト上の変化であり、週間ランキングから外れた時期と必ずしも一致しません。";
  para(note,tr(noteEn,noteJa));
  if (!ja) { const d=make("details"); d.append(make("summary","日本語ノートを表示 / 隠す"),make("p",noteJa)); note.append(d); }
  intro.append(note);
  heading(content, week === "06" ? tr("Midseason at a Glance", "中間時点の評価状況") : tr("The Lineup at a Glance", "評価状況"));
  const stats = make("div",null,"tier-auto-stats");
  const stat = (label,value,sub) => {const card=make("div",null,"tier-auto-stat");card.append(make("span",label),make("strong",String(value)));if(sub)card.append(make("small",sub));stats.append(card);};
  const signed=x=>x>0?`+${x}`:String(x);
  stat(tr("Titles listed","全掲載作品"),n.totalTitles,baseline?`${previous}: ${n.previousTotal}`:null);
  stat(tr("Rated titles","評価対象"),n.ratedTitles,baseline?`${previous}: ${n.previousRated} (${signed(n.ratedTitles-n.previousRated)})`:null);
  stat(tr("Dropped","ドロップ"),n.totalDropped,baseline?`${tr("Newly dropped","新規ドロップ")}: ${num("newlyDropped")}`:null);
  stat(tr("N/A / Other","その他の対象外"),n.unrated,null);
  content.append(stats);
  heading(content,tr("Tier Distribution","Tier別作品数"));
  const table=make("table",null,"tier-auto-table"), thead=make("thead"), hrow=make("tr"), tbody=make("tbody");
  const th=(text)=>{const el=make("th",text);el.scope="col";return el;};
  ["Tier",...(baseline?[previous]:[]),tr(`Week ${week}`,`第${Number(week)}週`),...(baseline?[tr("Change","増減")]:[])].forEach(t=>hrow.append(th(t)));thead.append(hrow);
  const tierName = t => ja ? ({Dropped:"ドロップ",RecentlyDropped:"新規ドロップ", "Never Watched":"未視聴", "N/A":"対象外"}[t] || t) : t;
  a.distribution.filter(x=>x && Number.isInteger(x.current) && x.current>=0 && (x.current || (baseline && x.previous))).forEach(x=>{
    const row=make("tr"), name=make("th",tierName(x.tier));name.scope="row";row.append(name);
    if(baseline)row.append(make("td",Number.isInteger(x.previous)?String(x.previous):"—"));
    row.append(make("td",String(x.current)));
    if(baseline)row.append(make("td",Number.isInteger(x.previous)?signed(x.current-x.previous):"—"));tbody.append(row);
  });table.append(thead,tbody);content.append(table);
  if (baseline) {
    const names = r=>ja?(r.jpTitle||r.title):r.title;
    const movement = (key, title, biggest) => {
      const rows=change(key);if(!rows.length)return;
      heading(content,`${title} · ${rows.length}`);
      const list=make("ul",null,"tier-auto-movers");
      const max=biggest?Math.max(...rows.map(r=>Math.abs(Number(r.steps)||0))):0;
      rows.slice().sort((x,y)=>biggest?Math.abs(Number(y.steps)||0)-Math.abs(Number(x.steps)||0):0).forEach(r=>{
        const li=make("li"), label=make("span",names(r)||"", "tier-auto-mover-title"), transition=make("span",`${r.from==null?"—":tierName(r.from)} → ${r.to==null?"—":tierName(r.to)}`,"tier-auto-transition");
        li.append(label,transition);
        if(biggest && max && Math.abs(Number(r.steps)||0)===max)li.append(make("small",tr(`${max} tier${max===1?"":"s"}`,`${max}段階`),"tier-auto-step"));
        list.append(li);
      });content.append(list);
    };
    movement("promotions",tr("Promotions","昇格"),true);
    movement("demotions",tr("Demotions","降格"),true);
    movement("newlyDropped",tr("Newly Dropped","新規ドロップ"));
    movement("backOnList",tr("Back in the Rated Tiers","評価Tierへ復帰・移行"));
    movement("newEntries",tr("New Entries","新規掲載"));
    movement("removed",tr("No Longer Listed","掲載から除外"));
    // Other state transitions are not repeated under the drop/return sections.
    const identity=r=>JSON.stringify([r.imageId,r.title,r.from,r.to]);
    const already=new Set([...change("newlyDropped"),...change("backOnList")].map(identity));
    const other=change("statusChanges").filter(r=>!already.has(identity(r)));
    if(other.length){heading(content,tr("Other Status Changes","その他の状態変化"));const list=make("ul",null,"tier-auto-movers");other.forEach(r=>list.append(make("li",`${names(r)}: ${tierName(r.from)} → ${tierName(r.to)}`)));content.append(list);}
    para(content,tr(`${num("unchanged")} titles remained in the same tier or status. This comparison does not count changes in ordering within a tier as promotions or demotions.`, `${num("unchanged")}作品は同じTier・状態を維持しました。同じTier内での並び順の変化は昇格・降格には含めていません。`));
  }
  if(typeof custom?.content === "string" && custom.content.trim()){heading(content,tr("Editorial Notes","補足・感想"));addCustom(content,"content");}
  heading(conclusion,tr("Final Thoughts","まとめ"));
  const ratedChange = baseline ? n.ratedTitles - n.previousRated : 0;
  if(baseline && ratedChange !== 0) para(conclusion,tr(`The rated lineup ${ratedChange<0?"narrowed":"expanded"} from ${n.previousRated} to ${n.ratedTitles} titles since ${previous}. This is a snapshot of the tier list at Week ${week}, separate from the weekly scores.`, `${previous}から評価対象作品は${n.previousRated}作品から${n.ratedTitles}作品に${ratedChange<0?"減少":"増加"}しました。週間評価点とは別に、第${Number(week)}週時点の位置づけを示したものです。`));
  else para(conclusion,tr(`This edition records ${n.ratedTitles} rated titles at Week ${week}.`, `第${Number(week)}週時点の評価対象は${n.ratedTitles}作品です。`));
  addCustom(conclusion,"conclusion");
  if(week==="01")para(conclusion,tr("The next regular tier list is the midseason update (Week 06).","次回の定期ティアリストは中間評価（第6週）です。"));
  if(week==="06")para(conclusion,tr("The next regular tier list is the season-final edition (Week 12).","次回の定期ティアリストは最終評価（第12週）です。"));
  const link=make("a",tr(`Week ${week} Weekly Ranking`,`第${Number(week)}週 ウィークリーランキング`));
  link.href=`../../../../ranking/${meta.year}/${meta.season.toLowerCase()}/week${week}/index.html`;
  const p=make("p",tr("For weekly scores and individual reviews, see the ","週間評価点や各作品のレビューは、"));p.append(link,document.createTextNode(tr(".","をご覧ください。")));conclusion.append(p);
}

if (!autoEditorial) {
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


}

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
      if (autoEditorial) {
        renderTierEditorial(jsonData, validPage ? tierArticleMetadata : null);
        // Future shared language switch can invoke this without re-fetching JSON.
        document.addEventListener("offbeat:tier-editorial-language", event => {
          renderTierEditorial(jsonData, validPage ? tierArticleMetadata : null, event.detail === "ja" ? "ja" : "en");
        });
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
