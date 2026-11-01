/* OFFBEAT Shared Header R2c — common navigation on legacy weekly ranking pages.
   No writes to theme/language/localStorage; no updates to ranking articles.
   Archive: weekly-rankings.json + verified Tier/Recommendations from Entrance Tune 03. */
(function () {
  'use strict';
  const host = document.getElementById('offbeat-global-header');
  if (!host || host.dataset.offbeatReady === '1') return;
  host.dataset.offbeatReady = '1';
  const base = '/animeb-v1/';
  const hdr = document.createElement('header');
  hdr.className = 'offbeat-site-header';
  hdr.innerHTML = `
    <div class="offbeat-header-inner">
      <a class="offbeat-brand" href="${base}" aria-label="OFFBEAT — Home">
        <strong>Offbeat</strong><small>— on a crooked path —</small>
      </a>
      <button class="offbeat-menu-button" aria-controls="offbeat-header-drawer"
              aria-expanded="false" aria-label="Open site navigation" type="button">
        <span></span><span></span><span></span>
      </button>
    </div>
    <nav class="offbeat-drawer" id="offbeat-header-drawer" aria-label="Site navigation" hidden>
      <p class="offbeat-drawer-title">FIND YOUR WAY</p>
      <div class="offbeat-drawer-links">
        <a href="${base}">OFFBEAT HOME</a>
        <a href="${base}#anime">ANIME</a>
        <a href="${base}#language">LANGUAGE</a>
        <a href="${base}#blog">BLOG</a>
      </div>
      <div class="offbeat-drawer-archive">
        <p class="offbeat-drawer-title">ANIME ARCHIVES / 既存ページへ</p>
        <label for="offbeat-archive-type">Category</label>
        <select id="offbeat-archive-type">
          <option value="ranking">Weekly Ranking</option>
          <option value="tier">Tier List</option>
          <option value="recommendation">Recommendations</option>
        </select>
        <label for="offbeat-archive-season">Year / Season</label>
        <select id="offbeat-archive-season"></select>
        <label for="offbeat-archive-week">Week</label>
        <select id="offbeat-archive-week"></select>
        <button class="offbeat-archive-go" type="button">OPEN ARTICLE →</button>
        <p class="offbeat-drawer-result" aria-live="polite"></p>
      </div>
      <p class="offbeat-drawer-note">OFFBEAT Home and Anime are now available here. Language and Blog will expand as new posts arrive.</p>
    </nav>`;
  host.append(hdr);
  const button = hdr.querySelector('.offbeat-menu-button');
  const drawer = hdr.querySelector('.offbeat-drawer');
  const type = hdr.querySelector('#offbeat-archive-type');
  const season = hdr.querySelector('#offbeat-archive-season');
  const week = hdr.querySelector('#offbeat-archive-week');
  const go = hdr.querySelector('.offbeat-archive-go');
  const result = hdr.querySelector('.offbeat-drawer-result');

  function close() {
    drawer.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open site navigation');
  }
  function toggle() {
    const open = drawer.hidden;
    drawer.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close site navigation' : 'Open site navigation');
  }
  button.addEventListener('click', toggle);
  document.addEventListener('click', e => {if (!host.contains(e.target)) close();});
  document.addEventListener('keydown', e => {if (e.key === 'Escape' && !drawer.hidden) {close(); button.focus();}});
  drawer.addEventListener('click', e => {if (e.target.closest('a')) close();});

  // A verified, conservative offline fallback. New weekly pages are added from
  // the ranking index, not from guesses or a hard-coded 'latest week' label.
  const archive = new Map();
  for (let n = 0; n <= 4; n++) {
    const w = String(n).padStart(2, '0');
    archive.set(`ranking|2026|fall|${w}`, `${base}ranking/2026/fall/week${w}/index.html`);
  }
  archive.set('tier|2026|fall|01', base + 'tierlist/2026/fall/week01/tierlist.html');
  archive.set('tier|2026|summer|12', base + 'tierlist/2026/summer/week12/tierlist.html');
  archive.set('recommendation|2026|summer|12', base + 'features/recommend/2026/summer/week12/index.html');
  const seasonOrder = {winter:0,spring:1,summer:2,fall:3};
  const seasonText = s => s[0].toUpperCase() + s.slice(1);

  function availableSeasons(kind) {
    return [...new Set([...archive.keys()]
      .filter(key => key.startsWith(kind + '|'))
      .map(key => key.split('|').slice(1,3).join('|')))]
      .sort((a,b) => {
        const [ay, as] = a.split('|'), [by, bs] = b.split('|');
        return (+by - +ay) || (seasonOrder[bs] - seasonOrder[as]);
      });
  }
  function renderSeasons() {
    const previous = season.value;
    const options = availableSeasons(type.value);
    season.replaceChildren(...options.map(value => {
      const [year, term] = value.split('|');
      return new Option(`${year} ${seasonText(term)}`, value);
    }));
    if (options.includes(previous)) season.value = previous;
    renderWeeks();
  }
  function renderWeeks() {
    const previous = week.value;
    const [year, term] = (season.value || '').split('|');
    const prefix = `${type.value}|${year}|${term}|`;
    const values = [...archive.keys()].filter(key => key.startsWith(prefix))
      .map(key => key.slice(prefix.length)).sort((a,b) => +a - +b);
    week.replaceChildren(...values.map(w => new Option(w === '00' ? 'Prelim / Week 00' : `Week ${w}`, w)));
    if (values.includes(previous)) week.value = previous;
    else if (values.length) week.value = values[values.length - 1];
    go.disabled = !values.length;
    result.textContent = values.length ? '' : 'No published articles for this selection.';
  }
  type.addEventListener('change', renderSeasons);
  season.addEventListener('change', renderWeeks);
  go.addEventListener('click', () => {
    const [year, term] = (season.value || '').split('|');
    const link = archive.get(`${type.value}|${year}|${term}|${week.value}`);
    if (link) window.location.assign(link);
  });
  renderSeasons();
  // The existing ranking navbar uses this same index: same source of truth.
  // Only year/season/week values actually present in the index are added.
  if (typeof fetch === 'function') {
    fetch(base + 'weekly-rankings.json')
      .then(r => {if (!r.ok) throw new Error('index unavailable'); return r.json();})
      .then(index => {
        for (const [year, seasons] of Object.entries(index || {})) {
          if (!/^\d{4}$/.test(year) || !seasons || typeof seasons !== 'object') continue;
          for (const [seasonName, details] of Object.entries(seasons)) {
            const term = seasonName.toLowerCase();
            if (!(term in seasonOrder) || !Array.isArray(details?.weeks)) continue;
            for (const raw of details.weeks) {
              const matched = /^week\s*(\d{1,2})$/i.exec(String(raw).trim());
              if (!matched) continue;
              const w = matched[1].padStart(2, '0');
              archive.set(`ranking|${year}|${term}|${w}`,
                `${base}ranking/${year}/${term}/week${w}/index.html`);
            }
          }
        }
        // Re-render only if user is browsing the ranking section; preserve picks.
        if (type.value === 'ranking') renderSeasons();
      }).catch(() => { /* verified fallback remains available offline */ });
  }

  // Theme Studio is the source of truth; this header merely observes it.
  function syncTone() {
    const b = document.body.dataset;
    const dark = b.animebTheme === 'dark' ||
      (b.animebTheme === 'image' && b.animebImageTone === 'dark');
    host.dataset.offbeatTone = dark ? 'dark' : 'light';
  }
  syncTone();
  new MutationObserver(syncTone).observe(document.body, {
    attributes:true,attributeFilter:['data-animeb-theme','data-animeb-image-tone']
  });
})();
/* OFFBEAT R2d — presentation-only repair. Keeps ranking's own theme/language
   controls; no storage writes. Search covers published archive entries. */
(function(){
  'use strict';
  const host=document.getElementById('offbeat-global-header');
  if(!host || host.dataset.offbeatR2d==='1')return;
  const inner=host.querySelector('.offbeat-header-inner');
  const burger=inner?.querySelector('.offbeat-menu-button');
  if(!burger)return;
  host.dataset.offbeatR2d='1';
  const tools=document.createElement('div');tools.className='offbeat-header-tools';
  burger.replaceWith(tools);tools.appendChild(burger);
  const searchBtn=document.createElement('button');
  searchBtn.type='button';searchBtn.className='offbeat-search-button';
  searchBtn.setAttribute('aria-label','Search published anime archives');
  searchBtn.setAttribute('aria-expanded','false');
  searchBtn.setAttribute('aria-controls','offbeat-header-search');
  searchBtn.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3 21 21"/></svg>';
  tools.appendChild(searchBtn);
  const searchPane=document.createElement('div');
  searchPane.className='offbeat-search-pane';searchPane.id='offbeat-header-search';
  searchPane.hidden=true;
  searchPane.innerHTML='<label for="offbeat-header-search-input">SEARCH PUBLISHED ANIME ARCHIVES</label><input id="offbeat-header-search-input" type="search" placeholder="2026 Fall Week 03…" autocomplete="off"><ul class="offbeat-search-results" aria-live="polite"></ul>';
  host.querySelector('.offbeat-site-header').appendChild(searchPane);
  const field=searchPane.querySelector('input'),results=searchPane.querySelector('ul');
  const archiveEntries=[];
  const base='/animeb-v1/';
  function addEntry(label,href){
    if(!archiveEntries.some(a=>a.href===href))archiveEntries.push({label,href});
  }
  addEntry('2026 Fall Week 01 Tier List',base+'tierlist/2026/fall/week01/tierlist.html');
  addEntry('2026 Summer Week 12 Final Tier List',base+'tierlist/2026/summer/week12/tierlist.html');
  addEntry('2026 Summer Week 12 Recommendations',base+'features/recommend/2026/summer/week12/index.html');
  for(let n=0;n<=4;n++){
    const w=String(n).padStart(2,'0');
    addEntry(`2026 Fall ${n===0?'Prelim ':''}Weekly Ranking Week ${w}`,base+`ranking/2026/fall/week${w}/index.html`);
  }
  const seasons={winter:0,spring:1,summer:2,fall:3};
  function fillArchive(index){
    for(const [y,entries] of Object.entries(index||{})){
      if(!/^\d{4}$/.test(y)||!entries||typeof entries!=='object')continue;
      for(const [name,record] of Object.entries(entries)){
        const term=name.toLowerCase();
        if(!(term in seasons)||!Array.isArray(record?.weeks))continue;
        for(const word of record.weeks){
          const matched=/^week\s*(\d{1,2})$/i.exec(String(word).trim());
          if(!matched)continue;
          const w=matched[1].padStart(2,'0');
          addEntry(`${y} ${name} ${w==='00'?'Prelim ':''}Weekly Ranking Week ${w}`,base+`ranking/${y}/${term}/week${w}/index.html`);
        }
      }
    }
    showResults();
  }
  function showResults(){
    const query=field.value.toLowerCase().trim().replace(/[^\da-z\u3040-\u30ff\s]/g,' ');
    const tokens=query.split(/\s+/).filter(Boolean);
    const found=archiveEntries.filter(e=>tokens.every(t=>e.label.toLowerCase().includes(t))).slice(0,20);
    results.replaceChildren();
    if(!tokens.length){
      const li=document.createElement('li');li.className='offbeat-search-empty';
      li.textContent='Enter a season, year, week or article type.';results.append(li);return;
    }
    if(!found.length){
      const li=document.createElement('li');li.className='offbeat-search-empty';
      li.textContent='No matching published archive entry.';results.append(li);return;
    }
    for(const {href,label} of found){
      const li=document.createElement('li'),a=document.createElement('a');
      a.href=href;a.textContent=label;li.append(a);results.append(li);
    }
  }
  function closeSearch(){searchPane.hidden=true;searchBtn.setAttribute('aria-expanded','false');}
  searchBtn.addEventListener('click',()=>{
    const opening=searchPane.hidden;
    if(opening){
      burger.closest('header')?.querySelector('.offbeat-drawer')?.setAttribute('hidden','');
      burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Open site navigation');
    }
    searchPane.hidden=!opening;searchBtn.setAttribute('aria-expanded',String(opening));
    if(opening){showResults();field.focus();}
  });
  burger.addEventListener('click',()=>{if(burger.getAttribute('aria-expanded')==='true')closeSearch();});
  document.addEventListener('click',event=>{
    if(!searchPane.hidden && !searchPane.contains(event.target) && !searchBtn.contains(event.target))closeSearch();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!searchPane.hidden){closeSearch();searchBtn.focus();}});
  field.addEventListener('input',showResults);
  searchPane.addEventListener('click',event=>{if(event.target.closest('a'))closeSearch();});
  fetch(base+'weekly-rankings.json').then(r=>{if(!r.ok)throw Error('No archive index');return r.json();})
    .then(fillArchive).catch(()=>{});
  // Existing fixed weekly controls were hidden under R2c's high-z-index mast.
  // Account only for the VISIBLE part of the non-sticky mast; once scrolled
  // away they return to their original 43/47px fixed positions.
  let scheduled=false;
  function updateVisibleHeader(){
    scheduled=false;
    const rect=host.getBoundingClientRect();
    const v=Math.max(0,Math.min(rect.height,rect.bottom));
    document.documentElement.style.setProperty('--offbeat-header-visible',v+'px');
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(updateVisibleHeader);}}
  updateVisibleHeader();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
})();
