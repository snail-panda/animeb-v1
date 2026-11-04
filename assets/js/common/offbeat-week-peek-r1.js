/* OFFBEAT Current Season: per-week preview from the published ranking JSON.
   Read-only. Does not touch ranking, Converter, notes, or publication state. */
(() => {
  'use strict';
  const nav = document.querySelector('#anime-top .n-season .n-weeks');
  const dashboard = document.querySelector('#anime-top .n-season .n-season-dashboard');
  if (!nav || !dashboard) return;
  if (dashboard.querySelector('.ob-week-peek')) return;

  const panel = document.createElement('aside');
  panel.className = 'ob-week-peek';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Weekly ranking preview');
  dashboard.append(panel);

  let opened = null;
  let hideTimer = null;
  let sequence = 0;
  const cache = new Map();
  const base = new URL('./', document.baseURI);

  const tag = (name, className, value) => {
    const e = document.createElement(name);
    if (className) e.className = className;
    if (value !== undefined) e.textContent = value;
    return e;
  };
  const clearTimer = () => { if (hideTimer !== null) clearTimeout(hideTimer); hideTimer = null; };
  const close = () => {
    clearTimer();
    panel.hidden = true;
    opened = null;
    nav.querySelectorAll('.ob-week-peek-active').forEach(e => e.classList.remove('ob-week-peek-active'));
  };
  const scheduleClose = () => { clearTimer(); hideTimer = setTimeout(close, 360); };

  function details(a) {
    if (!a || a.tagName !== 'A') return null;
    const target = new URL(a.href, document.baseURI);
    if (target.origin !== base.origin) return null;
    const m = target.pathname.match(/\/ranking\/(\d{4})\/(winter|spring|summer|fall)\/week(\d{2})\/index\.html$/i);
    if (!m) return null;
    return { href: target.href, year: m[1], season: m[2].toLowerCase(), week: m[3] };
  }
  function pos(link) {
    const d = dashboard.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    const width = Math.min(374, Math.max(0, d.width - 24));
    const wanted = r.left + r.width / 2 - d.left - width / 2;
    const left = Math.max(12, Math.min(wanted, d.width - width - 12));
    panel.style.width = width + 'px';
    panel.style.left = left + 'px';
    panel.style.top = (n.bottom - d.top + 5) + 'px';
  }
  const shortIntro = (raw) => {
    const doc = new DOMParser().parseFromString(String(raw || ''), 'text/html');
    const plain = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    const limit = 215;
    if (plain.length <= limit) return plain;
    const piece = plain.slice(0, limit);
    const split = Math.max(piece.lastIndexOf('. '), piece.lastIndexOf('。'), piece.lastIndexOf('! '), piece.lastIndexOf('? '));
    return (split > 95 ? piece.slice(0, split + 1) : piece.replace(/\s+\S*$/, '')).trim() + '…';
  };
  function language(data) {
    try { if (localStorage.getItem('animeb-weekly-lang') === 'ja') return 'ja'; } catch (_) {}
    return 'en';
  }
  async function fetchWeek(d) {
    const key = `${d.year}/${d.season}/${d.week}`;
    if (!cache.has(key)) {
      const path = `ranking/${d.year}/${d.season}/week${d.week}/ranking-week${d.week}-${d.season}${d.year}.json`;
      const req = fetch(new URL(path, base)).then(r => {
        if (!r.ok) throw Error('Ranking source returned ' + r.status);
        return r.json();
      }).catch(err => { cache.delete(key); throw err; });
      cache.set(key, req);
    }
    return cache.get(key);
  }
  function showBody(d, data) {
    const ja = language(data) === 'ja';
    const entries = Array.isArray(data?.entries)
      ? data.entries.filter(x => Number.isInteger(Number(x.rank)) && Number(x.rank) > 0 && (x.title || x.jpTitle))
          .sort((a, b) => Number(a.rank) - Number(b.rank)).slice(0, 3)
      : [];
    const header = tag('div', 'ob-week-peek-heading');
    const headText = tag('div');
    headText.append(tag('small', '', `${d.year} ${d.season.toUpperCase()} / ${d.week === '00' ? 'PRELIM' : 'WEEK ' + d.week}`),
                    tag('strong', '', d.week === '00' ? (ja ? '予選ランキング' : 'PRELIMINARY ROUND') : (ja ? `第${Number(d.week)}週` : `WEEK ${d.week}`)));
    const x = tag('button', 'ob-week-peek-close', '×');
    x.type = 'button'; x.setAttribute('aria-label', 'Close preview');
    x.addEventListener('click', close);
    header.append(headText, x);
    const content = tag('div', 'ob-week-peek-content');
    content.append(tag('small', 'ob-week-peek-label', ja ? '上位3作品' : 'TOP 3'));
    if (entries.length) {
      const ol = tag('ol', 'ob-week-peek-top');
      for (const row of entries) {
        const li = tag('li');
        li.append(tag('b', '', String(row.rank).padStart(2, '0')),
                  tag('span', '', (ja ? row.jpTitle || row.title : row.title || row.jpTitle).trim()));
        ol.append(li);
      }
      content.append(ol);
    } else content.append(tag('p', 'ob-week-peek-muted', ja ? '順位データがありません。' : 'Ranking entries are unavailable.'));
    const original = data?.meta?.weekly_intro;
    const excerpt = shortIntro(typeof original === 'string' ? original : (original?.[ja ? 'ja' : 'en'] || original?.en || original?.ja));
    if (excerpt) {
      content.append(tag('small', 'ob-week-peek-label ob-week-peek-intro-label', ja ? 'この週のイントロから' : "FROM THIS WEEK'S INTRO"));
      content.append(tag('p', 'ob-week-peek-excerpt', excerpt));
    }
    const go = tag('a', 'ob-week-peek-go', ja ? 'ランキング全文を見る →' : 'VIEW FULL RANKING →');
    go.href = d.href;
    content.append(go);
    panel.replaceChildren(header, content);
  }
  async function openFor(link) {
    const d = details(link);
    if (!d) return;
    clearTimer();
    sequence += 1;
    const ownSequence = sequence;
    opened = link;
    nav.querySelectorAll('.ob-week-peek-active').forEach(e => e.classList.remove('ob-week-peek-active'));
    link.classList.add('ob-week-peek-active');
    pos(link);
    panel.hidden = false;
    const label = d.week === '00' ? 'PRELIM' : 'WEEK ' + d.week;
    panel.replaceChildren(tag('p', 'ob-week-peek-loading', 'Loading ' + label + '…'));
    try {
      const data = await fetchWeek(d);
      if (ownSequence !== sequence || opened !== link) return;
      showBody(d, data);
    } catch (err) {
      if (ownSequence !== sequence || opened !== link) return;
      panel.replaceChildren(tag('p', 'ob-week-peek-loading', 'Preview unavailable for this week.'));
    }
  }
  nav.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link || !nav.contains(link) || !details(link)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    openFor(link);
  });
  nav.addEventListener('pointerover', e => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const link = e.target.closest('a');
    if (link && nav.contains(link) && !link.contains(e.relatedTarget) && details(link)) openFor(link);
  });
  nav.addEventListener('pointerout', e => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const link = e.target.closest('a');
    if (link && !link.contains(e.relatedTarget) && !panel.contains(e.relatedTarget)) scheduleClose();
  });
  panel.addEventListener('pointerenter', clearTimer);
  panel.addEventListener('pointerleave', scheduleClose);
  document.addEventListener('click', e => {
    if (!panel.hidden && !panel.contains(e.target) && !nav.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (opened && !panel.hidden) pos(opened); });
  window.addEventListener('hashchange', close);
})();
