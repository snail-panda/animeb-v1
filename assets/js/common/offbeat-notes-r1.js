/* OFFBEAT Notes R1: read-only Notes presentation + verified ranking paths.
   No publishing credentials, no invented live posts, no changes to posts-index.json. */
(() => {
  'use strict';
  const base = new URL('./', document.currentScript?.src || document.baseURI);
  const root = new URL('../../../', base);
  const preview = new URL(location.href).searchParams.get('notes-preview') === '1';
  const mockNotes = [
    { id: 'sample-dawn-of-the-witch', status: 'published', category: 'anime',
      label: 'REWATCH', tags: ['2022','rewatch'], published: {iso: '2026-11-04'},
      title: 'The Dawn of the Witch (2022)',
      body: 'Watching this for the third time, I’m struck by how much more carefully made it feels than so many anime airing now—and it’s only a few years old.' },
    { id: 'sample-sequels', status: 'published', category: 'anime',
      label: 'SEASON THOUGHT', tags: ['sequels'], published: {iso: '2026-11-03'},
      title: 'Sequels Everywhere', body: 'Sequels, remakes, revivals everywhere this season. What still feels new?' },
    { id: 'sample-small-discovery', status: 'published', category: 'anime',
      label: 'QUICK THOUGHT', tags: [], published: {iso: '2026-11-02'},
      title: 'A small detour', body: 'Sometimes one tiny detail stays with you longer than an entire episode.' }
  ];
  const $ = (s, el=document) => el.querySelector(s);
  const el = (tag, cls, value) => { const n=document.createElement(tag); if(cls)n.className=cls; if(value!==undefined)n.textContent=value; return n; };
  function date(iso) { const d=new Date(String(iso||'')+'T12:00:00Z'); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-US',{month:'short',day:'2-digit',year:'numeric',timeZone:'UTC'}).format(d).toUpperCase(); }
  function cleanNotes(data) {
    if(data?.schemaVersion!==1||!Array.isArray(data.notes))throw Error('Invalid notes schema');
    return data.notes.filter(n=>n&&n.status==='published'&&typeof n.id==='string'&&/^[a-z0-9][a-z0-9-]{1,100}$/.test(n.id)&&typeof n.body==='string').sort((a,b)=>String(b.published?.iso||'').localeCompare(String(a.published?.iso||'')));
  }
  function textContent(note) { return String(note.body||'').trim(); }
  function imgOf(note) {
    const src=String(note.image?.src||'').trim(); if(!src)return null;
    try { const url=new URL(src,root); if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname))return null;
      const figure=el('figure','obn-image');figure.classList.add(note.image?.display==='wide'?'obn-image-wide':'obn-image-small');
      const img=el('img'); img.src=url.href; img.loading='lazy';img.alt=String(note.image?.alt||'Note illustration');img.onerror=()=>figure.remove();figure.append(img);return figure;
    } catch {return null;}
  }
  function noteLabel(note){return [String(note.label||note.category||'NOTE').toUpperCase(),date(note.published?.iso)].filter(Boolean).join(' · ');}
  function noteLink(note){return new URL('notes/index.html#'+encodeURIComponent(note.id),root).href;}
  function feature(note) {
    const article=el('article','obn-feature');article.id='obn-'+note.id;
    const label=el('small','obn-label',noteLabel(note));article.append(label);
    const title=String(note.title||'').trim();if(title){const h=el('h3','obn-title');const a=el('a',null,title);a.href=noteLink(note);h.append(a);article.append(h);}
    const figure=imgOf(note),body=el('p','obn-body',textContent(note));const layout=el('div','obn-feature-body');if(figure)layout.append(figure);layout.append(body);article.append(layout);
    if(body.textContent.length>135){body.classList.add('obn-clamped');const more=el('button','obn-read-more','READ MORE');more.type='button';more.setAttribute('aria-expanded','false');more.addEventListener('click',()=>{const expanded=body.classList.toggle('obn-expanded');more.textContent=expanded?'SHOW LESS':'READ MORE';more.setAttribute('aria-expanded',String(expanded));});article.append(more);}
    return article;
  }
  function compact(note) {
    const article=el('article','obn-compact');const a=el('a','obn-compact-link');a.href=noteLink(note);
    a.append(el('small','obn-label',noteLabel(note)));a.append(el('span','obn-compact-title',String(note.title||'').trim()||textContent(note).slice(0,85)));
    article.append(a);return article;
  }
  function renderHome(notes) {
    const aside=$('#animeMoment');if(!aside)return;
    aside.setAttribute('aria-label','Short notes and discoveries');
    const existing=aside.querySelector('.offbeat-coming-note');if(existing)existing.remove();
    const block=el('div','obn-home');
    if(preview){block.append(el('p','obn-preview','DESIGN PREVIEW · NOT PUBLISHED'));}
    const selected=notes.filter(n=>String(n.category||'').toLowerCase()==='anime'||(Array.isArray(n.tags)&&n.tags.some(t=>String(t).toLowerCase()==='anime')));
    if(!selected.length){block.append(el('p','obn-empty','Short notes and small discoveries will appear here as they are published.'));}
    else {
      block.append(feature(selected[0])); selected.slice(1,3).forEach(n=>block.append(compact(n)));
      const link=el('a','obn-all-link','VIEW ALL NOTES  »');link.href=new URL('notes/index.html'+(preview?'?notes-preview=1':''),root).href;block.append(link);
    }
    aside.append(block);
  }
  function renderAll(notes){
    const list=$('#offbeatNotesAll');if(!list)return;
    if(preview)list.before(el('p','obn-preview','DESIGN PREVIEW · NOT PUBLISHED'));
    if(!notes.length){list.append(el('p','obn-empty','No notes published yet.'));return;}
    notes.forEach(n=>{const entry=feature(n);entry.id=n.id;entry.classList.add('obn-list-entry');list.append(entry);});
    const hash=decodeURIComponent(location.hash.slice(1));if(hash)requestAnimationFrame(()=>document.getElementById(hash)?.scrollIntoView());
  }
  function addRankingPaths(data){
    const focus=$('#animeLatest'), card=focus?.querySelector('a.n-rank-card');if(!focus||!card)return;
    const all=Array.isArray(data?.posts)?data.posts:[];
    const ranked=all.filter(p=>p.status==='published'&&p.type==='ranking'&&/^ranking\/\d{4}\/(winter|spring|summer|fall)\/week\d{2}\/index\.html$/i.test(p.url||''));
    if(!ranked.length)return;
    const order={winter:0,spring:1,summer:2,fall:3};
    ranked.sort((a,b)=>Number(b.year)-Number(a.year) || order[b.season]-order[a.season] || Number(b.week)-Number(a.week));
    const current=ranked.find(p=>Number(p.week)>0);
    if(!current)return;
    const matches=ranked.filter(p=>p.year===current.year&&p.season===current.season&&Number(p.week)<Number(current.week));
    const previous=matches.sort((a,b)=>Number(b.week)-Number(a.week))[0];
    const nav=el('nav','obn-ranking-links');nav.setAttribute('aria-label','Browse weekly rankings');
    if(previous){const a=el('a',null,'‹  PREVIOUS WEEK');a.href=new URL(previous.url,root).href;nav.append(a);}
    const browse=el('a',null,'BROWSE RANKINGS  »');browse.href='#animeArticles';browse.addEventListener('click',()=>{
       const year=document.getElementById('offbeatArchiveYearFilter'),season=document.getElementById('offbeatArchiveSeasonFilter');
       if(year)year.value='all';if(season)season.value='all';
       const allSeason=document.querySelector('.anime09 .n-season-filters [data-season-filter="all"]');if(allSeason)allSeason.click();
       const btn=document.querySelector('.anime09 .n-archive-filters .filter-button[data-filter="ranking"]');if(btn)btn.click();
    });nav.append(browse);
    const companion=focus.querySelector('#animeTier');if(companion)focus.insertBefore(nav,companion);else focus.append(nav);
    const prelim=ranked.find(p=>p.year===current.year&&p.season===current.season&&Number(p.week)===0);
    if(prelim&&companion&&!companion.querySelector('.obn-prelim-link')){
      const a=el('a','n-feature-item obn-prelim-link');a.href=new URL(prelim.url,root).href;
      a.append(el('span','n-feature-kind','PRELIMINARY · WEEK 00'));a.append(el('strong',null,'Preliminary Ranking'));
      const mark=el('span','n-double-chevron');mark.setAttribute('aria-hidden','true');mark.append(el('i'),el('i'));a.append(mark);companion.append(a);
    }
  }
  async function init(){
    // These two independent files are read only; failure in one must not break the other.
    if($('#animeMoment')||$('#offbeatNotesAll')){
      try{const response=await fetch(new URL('notes/notes.json',root),{cache:'no-store'});if(!response.ok)throw Error('Notes '+response.status);
        const notes=preview?mockNotes:cleanNotes(await response.json());renderHome(notes);renderAll(notes);
      }catch(err){console.warn('OFFBEAT Notes:',err);if($('#animeMoment'))renderHome([]);if($('#offbeatNotesAll'))renderAll([]);}
    }
    if($('#animeLatest')){
      try{const response=await fetch(new URL('posts-index.json',root),{cache:'no-store'});if(!response.ok)throw Error('Posts '+response.status);addRankingPaths(await response.json());}catch(err){console.warn('OFFBEAT Ranking paths:',err);}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
