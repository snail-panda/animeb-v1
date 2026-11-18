/* OFFBEAT Anime Home R33 — editorial UP NEXT (additive; R32 preserved).
 * Published posts-index.json is the ONLY source of publication state.
 * An optional per-season omission list handles intentionally cancelled features.
 * No unpublished cards or invented links; no timeline, ranking or R29 markup rewrite.
 */
(() => {
  'use strict';
  const root = document.querySelector('#anime-top.anime09');
  if (!root) return;
  const $ = (q, node = root) => node.querySelector(q);
  const stagePlan = [
    {id:'prelim', week:0,  en:'PRELIMINARY',       ja:'予選',             slots:['ranking']},
    {id:'opening',week:1,  en:'FIRST IMPRESSIONS', ja:'ファーストインプレッション',slots:['tier']},
    {id:'middle', week:6,  en:'MIDSEASON',         ja:'ミッドシーズン', slots:['tier','recommendation']},
    {id:'final',  week:12, en:'FINAL',             ja:'ファイナル',      slots:['tier','recommendation']}
  ];
  const isJapanese = () => root.dataset.obLiveLang === 'ja' ||
    (!root.dataset.obLiveLang && (() => {try {return localStorage.getItem('animeb-weekly-lang') === 'ja';} catch {return false;}})());
  const tr = (en,ja) => isJapanese()?ja:en;
  const make = (tag, cls, value) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (value !== undefined) e.textContent = value;
    return e;
  };
  const pubUrlOK = href => {
    if (typeof href !== 'string') return false;
    try {
      const url = new URL(href,document.baseURI);
      const base = new URL('.',document.baseURI);
      return url.origin === base.origin && url.pathname.startsWith(base.pathname);
    } catch {return false;}
  };
  let posts = null, omissions = {}, note = null, pending = false;

  function currentSeason() {
    // Follow the season that the existing R29 editorial panel ACTUALLY shows.
    // Do not independently guess a new season or change the season selector.
    const panel = $('#obR29Editorial');
    if (!panel) return null;
    const year = Number($('.ob-r29-year',panel)?.textContent?.trim());
    const seasonLabel = $('.ob-r29-season',panel);
    const season = ['winter','spring','summer','fall'].find(x => seasonLabel?.classList.contains(x));
    if (!Number.isInteger(year) || year < 2000 || !season) return null;
    return {year,season,panel};
  }
  function publishedTypes(year,season) {
    const result = new Set();
    if (!Array.isArray(posts)) return result;
    for (const p of posts) {
      if (!p || p.status !== 'published' || Number(p.year) !== year || p.season !== season || !pubUrlOK(p.url)) continue;
      const w = Number(p.week);
      for (const stage of stagePlan) {
        if (w === stage.week && stage.slots.includes(p.type)) result.add(stage.id+':'+p.type);
      }
    }
    return result;
  }
  function nextStage(year,season) {
    const pub = publishedTypes(year,season);
    const omit = new Set(Array.isArray(omissions[`${year}-${season}`]) ? omissions[`${year}-${season}`] : []);
    for (const stage of stagePlan) {
      const planned = stage.slots.map(type => stage.id+':'+type).filter(key => !omit.has(key));
      if (!planned.length) continue;
      const publishedCount = planned.filter(key => pub.has(key)).length;
      if (publishedCount !== planned.length) return {stage, publishedCount};
    }
    return null;
  }
  function caption(stage,publishedCount) {
    if (stage.id==='prelim') return tr("The season’s first selection is coming soon.",'シーズン最初の予選ランキングを準備中。');
    if (stage.id==='opening') return tr('First impressions are on the way.','開幕時点のファーストインプレッションを準備中。');
    if (stage.id==='middle') return publishedCount
      ? tr('More from midseason is on the way.','ミッドシーズンの特集はまだ続きます。')
      : tr('More to come as the season unfolds.','シーズンの進行とともに、さらに特集を公開予定。');
    return publishedCount
      ? tr('More season-closing features are on the way.','シーズンを締めくくる特集はまだ続きます。')
      : tr('The season’s closing features are still to come.','シーズンを締めくくる特集を公開予定。');
  }
  function update() {
    pending = false;
    if (!posts) return;
    const view = currentSeason();
    if (!view) return;
    const footer = $('.ob-r29-footer',view.panel);
    if (!footer) return;
    if (!note || note.parentElement !== view.panel) {
      note = make('div','ob-r33-upnext');
      note.id = 'obR33UpNext';
      footer.after(note); // Existing MORE THAN A WEEKLY RANKING footer remains untouched.
    }
    const next = nextStage(view.year,view.season);
    if (!next) {note.hidden=true;note.replaceChildren();return;}
    const {stage,publishedCount} = next;
    const label = make('div','ob-r33-upnext-label');
    label.append(make('strong','',tr('UP NEXT','次の特集')),
                 make('span','',` · ${tr(stage.en,stage.ja)} / W${String(stage.week).padStart(2,'0')}`));
    note.className='ob-r33-upnext ob-r33-'+stage.id;
    note.replaceChildren(label,make('p','ob-r33-upnext-copy',caption(stage,publishedCount)));
    note.hidden=false;
  }
  function scheduleUpdate() {
    if (pending) return;
    pending=true;
    // After R29's language refresh has reconstructed its header and footer.
    setTimeout(update,0);
  }
  async function init() {
    let panel;
    for (let n=0;n<55;n++) {
      panel = $('#obR29Editorial');
      if (panel?.querySelector('.ob-r29-footer') && panel.querySelector('.ob-r29-year')) break;
      await new Promise(resolve=>setTimeout(resolve,150));
    }
    if (!panel?.querySelector('.ob-r29-footer')) {console.warn('OFFBEAT R33: R29 editorial panel not found; nothing changed.');return;}
    try {
      const [manifestResponse,planResponse] = await Promise.all([
        fetch(new URL('posts-index.json',document.baseURI),{cache:'no-store'}),
        fetch(new URL('assets/data/offbeat-editorial-upnext-r33.json',document.baseURI),{cache:'no-store'})
      ]);
      if (!manifestResponse.ok || !planResponse.ok) throw Error('Required index or plan is unavailable');
      const [manifest,plan] = await Promise.all([manifestResponse.json(),planResponse.json()]);
      if (!Array.isArray(manifest.posts) || plan.schemaVersion!==1 || !plan.omitBySeason || typeof plan.omitBySeason!=='object')
        throw Error('Unexpected posts or plan format');
      posts=manifest.posts;omissions=plan.omitBySeason;
      update();
      const titleline=$('.ob-r29-titleline',panel);
      if(titleline) new MutationObserver(scheduleUpdate).observe(titleline,{childList:true,subtree:true,characterData:true});
      new MutationObserver(scheduleUpdate).observe(root,{attributes:true,attributeFilter:['data-ob-live-lang']});
      window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang')scheduleUpdate();});
      console.info('OFFBEAT R33: UP NEXT is derived from published editorial articles; R32 layout preserved.');
    } catch(err) {console.warn('OFFBEAT R33 safe skip:',err);}
  }
  if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
})();
