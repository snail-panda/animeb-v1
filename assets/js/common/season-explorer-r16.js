/* OFFBEAT R16 — Anime Home season explorer.
 * Read-only published-season navigation. Never changes the current-season editorial data,
 * Week Peek, Featured/Lineup code, the ranking pages, or the archive filters.
 * Optional historical data: assets/data/offbeat-season-YYYY-season.json
 */
(() => {
  'use strict';
  const order = ['winter', 'spring', 'summer', 'fall'];
  const cap = s => s.slice(0, 1).toUpperCase() + s.slice(1);
  const fmt = n => String(n).padStart(2, '0');
  const base = new URL('./', document.baseURI);
  const make = (tag, cls, label) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (label !== undefined) el.textContent = label;
    return el;
  };
  function language() {
    try { return localStorage.getItem('animeb-weekly-lang') === 'ja' ? 'ja' : 'en'; }
    catch (_) { return 'en'; }
  }
  const words = {
    en: {seasons:'SEASONS', current:'CURRENT SEASON', archive:'FROM THE ARCHIVE', back:'BACK TO CURRENT',
      browse:'VIEW ALL SEASONS', close:'HIDE OVERVIEW', last:'LAST PUBLISHED', none:'NO PUBLISHED WEEKS',
      now:'NOW', weeksLeft:'WEEKS TO GO', done:'ARCHIVED RECORD', progress:'PUBLISHED WEEKS',
      snapshot:'SEASON SNAPSHOT', pending:'Published rankings are available above. An editorial lineup has not yet been added for this season.',
      master:'MASTER REFERENCE', lineup:'Season lineup', entries:'published weeks', titles:'titles recorded',
      full:'An opening lineup count was not specified, so these are master-recorded titles, not a verified initial pool.',
      first:'FEATURED TITLES', disabled:'No published rankings' },
    ja: {seasons:'シーズン', current:'現在のシーズン', archive:'過去のシーズン', back:'今期に戻る',
      browse:'全シーズンを見渡す', close:'一覧を閉じる', last:'最終公開', none:'公開済みランキングなし',
      now:'現在', weeksLeft:'週を残す', done:'過去の記録', progress:'公開済みの週',
      snapshot:'シーズンの記録', pending:'公開済みの週間ランキングは上から閲覧できます。このシーズンの作品マスターはまだ登録されていません。',
      master:'作品マスター', lineup:'シーズンの作品', entries:'公開済みの週', titles:'登録作品',
      full:'初期ラインナップ数が指定されていないため、初期出場作品ではなくマスター登録作品として表示しています。',
      first:'注目作品', disabled:'公開ランキングなし'}
  };

  let retryCount=0;
  async function init() {
    if(document.querySelector('#anime-top .ob-r16-years')) return;
    const sec = document.querySelector('#anime-top .n-season');
    if (!sec || !sec.querySelector('.n-season-chooser') || !sec.querySelector('.n-weeks') || !document.getElementById('obSeasonExperienceR3')) {
      if(retryCount++<4) setTimeout(init,1200);
      return;
    }
    let raw;
    try {
      const response = await fetch(new URL('weekly-rankings.json', base), {cache:'no-store'});
      if (!response.ok) throw Error(String(response.status));
      raw = await response.json();
    } catch (err) {
      console.warn('Season explorer: manifest unavailable; original page preserved.', err);
      if(retryCount++<4) setTimeout(init,1200);
      return;
    }

    // Only actual manifest week entries are linked. Empty seasons stay visible for historical context.
    const seasons = new Map();
    for (const [yr, content] of Object.entries(raw || {})) {
      if (!/^\d{4}$/.test(yr) || !content || typeof content !== 'object') continue;
      for (const s of order) {
        const spec = Object.entries(content).find(([k]) => k.toLowerCase() === s)?.[1];
        if (!spec) continue;
        const published = new Set();
        for (const name of (Array.isArray(spec.weeks) ? spec.weeks : [])) {
          const m = /^Week\s+(\d{2})$/i.exec(String(name));
          if (m && Number(m[1]) <= 12) published.add(Number(m[1]));
        }
        seasons.set(`${yr}-${s}`, {year:yr, season:s, weeks:published});
      }
    }
    const entries = [...seasons.values()].filter(x=>[...x.weeks].some(n=>n>0))
      .sort((a,b) => Number(a.year)-Number(b.year) || order.indexOf(a.season)-order.indexOf(b.season));
    const latest = entries[entries.length-1];
    if (!latest) {
      console.warn('Season explorer: no published weeks in the manifest; keeping the fallback season header.');
      if(retryCount++<4) setTimeout(init,1200);
      return;
    }
    let selected = latest, displayYear = latest.year, masterRequest = 0;

    // R16 waits for the existing data loader to establish the latest-ranking card,
    // so this feature does not race its one-time Current Season rendering.
    for (let i=0; i<45 && !window.OFFBEAT_LATEST_URL; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const chooser = sec.querySelector('.n-season-chooser');
    const originalLabel = sec.querySelector('.n-season-name small');
    const seasonName = sec.querySelector('.n-season-name h2 em');
    const seasonYear = sec.querySelector('.n-season-name h2 b');
    const weekNav = sec.querySelector('.n-weeks');
    const now = sec.querySelector('.n-season-now-mark');
    const detail = sec.querySelector('.n-season-sub-detail');
    const stage = sec.querySelector('.n-note-stage');
    const progressLabel = sec.querySelector('.n-progress-intro');
    const progressCount = sec.querySelector('.n-progress-count');
    const progressBar = sec.querySelector('.n-progress-track i');
    const dashboard = sec.querySelector('.n-season-dashboard');
    const archivePanel = make('section', 'ob-r16-archive');
    archivePanel.hidden = true;
    archivePanel.setAttribute('aria-live','polite');
    if (!dashboard || !now || !seasonName || !seasonYear || !detail || !progressBar) return;
    dashboard.after(archivePanel);
    const titleRow = make('div','ob-r16-chooser-top');
    const label = make('span','ob-r16-seasons-label');
    const yearSelect = make('select','ob-r16-years');
    yearSelect.setAttribute('aria-label','Select an anime year / 年度を選択');
    const years = [...new Set([...seasons.values()].map(s=>s.year))].sort((a,b)=>Number(b)-Number(a));
    for (const year of years) { const option = make('option','',year);option.value=year;yearSelect.append(option); }
    const home = make('button','ob-r16-back'); home.type='button';
    titleRow.append(label,yearSelect,home);
    const tabs = make('div','n-season-tabs ob-r16-tabs');
    const overview = make('details','ob-r16-overview');
    const summary = make('summary','ob-r16-summary');
    overview.append(summary,make('div','ob-r16-overview-rows'));
    chooser.replaceChildren(titleRow,tabs);
    sec.querySelector('.n-season-header').append(overview);
    const setNow = str => {
      const existing = now.querySelector('.n-pulse');
      now.replaceChildren();
      if (existing) now.append(existing);
      now.append(document.createTextNode(' '+str));
    };
    const same = (a,b) => a.year===b.year && a.season===b.season;
    const href = (s,n) => new URL(`ranking/${s.year}/${s.season}/week${fmt(n)}/index.html`,base).href;
    const mkWeek = (s,n,mini=false) => {
      const valid = s.weeks.has(n);
      const el = make(valid ? 'a' : 'span', mini ? 'ob-r16-mini-week' : '');
      if (valid) el.href=href(s,n);
      if (!valid) el.classList.add(mini ? 'ob-r16-missing' : 'n-unreleased');
      if (!mini) {
        if (n===0) el.classList.add('n-prelim');
        if (n===6) el.classList.add('n-milestone','n-milestone-mid');
        if (n===12) el.classList.add('n-milestone','n-milestone-final');
      }
      const text = mini ? (n===0 ? 'P' : fmt(n)) : (n===0 ? 'PRELIM':'W');
      if (mini) el.textContent=text;
      else el.append(make('span','',text),make('b','',fmt(n)));
      el.title = `${s.year} ${cap(s.season)} · ${n===0?'Preliminary':'Week '+fmt(n)}${valid?'':' (unavailable)'}`;
      return el;
    };
    function renderTimeline() {
      const prior = sec.querySelector('.ob-week-peek');
      if (prior) prior.hidden = true;
      weekNav.replaceChildren();
      const isCurrent = same(selected,latest);
      const published = [...selected.weeks].filter(x=>x>0).sort((a,b)=>a-b);
      const last = published.length ? published[published.length-1] : (selected.weeks.has(0)?0:null);
      const w = words[language()];
      originalLabel.textContent = isCurrent ? w.current : w.archive;
      seasonName.textContent = cap(selected.season);
      seasonYear.textContent = selected.year;
      sec.setAttribute('aria-label',`${isCurrent?'Current':'Archived'} anime season — ${selected.year} ${cap(selected.season)}`);
      for (let n=0;n<=12;n++) {
        const link=mkWeek(selected,n);
        if (isCurrent && n===last) {
          link.classList.add('n-now');link.setAttribute('aria-current','step');
          link.setAttribute('aria-label',`Current week ${fmt(n)}`);
        }
        weekNav.append(link);
      }
      setNow(last===null ? w.none : `${isCurrent?w.now:w.last} · ${last===0?'PRELIM':'WEEK '+fmt(last)}`);
      detail.textContent=`${selected.year} ${selected.season.toUpperCase()} · ${published.length} ${w.entries}`;
      stage.textContent=isCurrent ? `${Math.max(0,12-(last||0))} ${w.weeksLeft}` : w.done;
      const count = (last || 0);
      progressCount.replaceChildren(document.createTextNode(last===null?'—':fmt(last)+' '));
      progressCount.append(make('small','','/ 12'));
      progressBar.style.width=Math.min(100,count/12*100)+'%';
      progressLabel.textContent=isCurrent ? (language()==='ja'?'シーズン進行状況':'THE SEASON SO FAR') : w.progress;
      sec.classList.toggle('ob-r16-history',!isCurrent);
      archivePanel.hidden=isCurrent;
      if (isCurrent) archivePanel.replaceChildren();
      else renderArchivePanel(selected);
    }
    function renderTabs() {
      const w=words[language()];
      label.textContent=w.seasons;
      home.textContent=w.back; home.hidden=same(selected,latest);
      yearSelect.value=displayYear;
      tabs.replaceChildren();
      for(const s of order) {
        const found=seasons.get(`${displayYear}-${s}`);
        const button=make('button','ob-r16-tab',cap(s).toUpperCase());button.type='button';
        if (!found || !found.weeks.size) button.classList.add('ob-r16-tab-empty');
        if (found && same(found,selected)) {
          button.classList.add('ob-r16-tab-selected');button.setAttribute('aria-current','true');
        }
        button.disabled=!found;
        if (found) button.addEventListener('click',()=>change(found));
        tabs.append(button);
      }
      summary.textContent=overview.open?w.close:w.browse;
      renderOverview();
    }
    function renderOverview() {
      const rows=overview.querySelector('.ob-r16-overview-rows');
      rows.replaceChildren();
      for(const season of order) {
        const item=seasons.get(`${displayYear}-${season}`);
        const line=make('div','ob-r16-season-row');
        const btn=make('button','ob-r16-season-label',cap(season)); btn.type='button';
        btn.disabled=!item;
        if (item) btn.addEventListener('click',()=>change(item));
        const weeks=make('div','ob-r16-season-links');
        if (item) {
          for(let n=0;n<=12;n++)weeks.append(mkWeek(item,n,true));
        } else weeks.textContent='—';
        line.append(btn,weeks);
        rows.append(line);
      }
    }
    const masterCache = new Map();
    async function readMaster(s) {
      const key=`${s.year}-${s.season}`;
      if(!masterCache.has(key)){
        const path=`assets/data/offbeat-season-${key}.json`;
        const p=fetch(new URL(path,base)).then(r=>r.ok?r.json():null)
          .then(d=>d&&Array.isArray(d.items)&&d.items.length>0?d:null)
          .catch(()=>null);
        masterCache.set(key,p);
      }
      return masterCache.get(key);
    }
    async function renderArchivePanel(s) {
      // R17 renders historical seasons without guessing their opening pools.
      if (window.OFFBEAT_R17 && typeof window.OFFBEAT_R17.renderHistory === 'function') {
        ++masterRequest;
        window.OFFBEAT_R17.renderHistory({season:s, panel:archivePanel,
          active:()=>!same(selected,latest) && same(selected,s)});
        return;
      }
      const request=++masterRequest;
      const w=words[language()];
      archivePanel.replaceChildren(make('h3','',w.snapshot),make('p','ob-r16-pending',w.pending));
      const m=await readMaster(s);
      if(request!==masterRequest||same(selected,latest)||!same(selected,s))return;
      if(!m)return;
      const list=m.items.filter(x=>x&&typeof x==='object');
      const initial=Number(m.initialSeasonPool);
      const verified=Number.isInteger(initial)&&initial>0&&initial<=list.length;
      const display=verified?list.slice(0,initial):list;
      const heading=make('h4','',`${w.lineup} · ${display.length} ${w.titles}`);
      const note=make('p','ob-r16-master-note',verified ?
        (language()==='ja'?'初期ラインナップ数が指定された作品マスターを使用しています。':'Based on the verified opening pool in the master file.') : w.full);
      const grid=make('div','ob-r16-title-grid');
      for(const entry of display){
        const figure=make('figure','ob-r16-title');
        const kv=String(entry.kv||entry.id||'');
        if (/^[a-z0-9_-]+$/i.test(kv)) {
          const img=make('img','');
          img.src=new URL(`images/key-visuals/${s.year}/${s.season}/${kv}.webp`,base).href;
          img.loading='lazy';img.alt='';
          img.onerror=()=>{img.remove();figure.classList.add('ob-r16-no-art');};
          figure.append(img);
        } else figure.classList.add('ob-r16-no-art');
        const name=language()==='ja'?(entry.jpTitle||entry.title):(entry.title||entry.jpTitle);
        figure.append(make('figcaption','',String(name||kv||'—')));
        grid.append(figure);
      }
      archivePanel.replaceChildren(make('h3','',w.snapshot),heading,note,grid);
      // "Featured" remains a manual editorial choice, never inferred from weekly standings.
      if(Array.isArray(m.featured)&&m.featured.length){
        const chosen=new Set(m.featured.map(x=>String(x)));
        const featured=display.filter(x=>chosen.has(String(x.kv||x.id||'')));
        if(featured.length){
          const feat=make('p','ob-r16-featured-note',`${w.first}: ${featured.map(x=>language()==='ja'?(x.jpTitle||x.title):(x.title||x.jpTitle)).join(' · ')}`);
          archivePanel.insertBefore(feat,grid);
        }
      }
    }
    function change(s){
      selected=s; displayYear=s.year;
      renderTabs();renderTimeline();
    }
    yearSelect.addEventListener('change',()=>{displayYear=yearSelect.value;renderTabs();});
    home.addEventListener('click',()=>change(latest));
    overview.addEventListener('toggle',()=>{summary.textContent=overview.open?words[language()].close:words[language()].browse;});
    // Locale changes may be dispatched by existing mast controls without a storage event.
    // Refresh the selected archive even if the language toggle is in the mast.
    // A small delay lets the site's own handler write animeb-weekly-lang first.
    let appliedExplorerLang = language();
    document.addEventListener('click', () => {
      window.setTimeout(() => {
        const nextLang = language();
        if (nextLang !== appliedExplorerLang) {
          appliedExplorerLang = nextLang;
          renderTabs();
          renderTimeline();
        }
      }, 90);
    }, true);
    window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang'){appliedExplorerLang=language();renderTabs();renderTimeline();}});
    change(latest);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
