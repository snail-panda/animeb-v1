/* OFFBEAT Anime Home R20 — presentation only.
   Enhances the existing R12 This Week / Next / Previous DOM, never fetches
   or replaces published data, links, weekly ranking, Week Peek or charts. */
(() => {
  'use strict';
  const root = document.querySelector('#anime-top.anime09');
  if (!root || root.dataset.obStoryBridgeR20) return;
  root.dataset.obStoryBridgeR20 = 'ready';
  const fmt = n => String(n).padStart(2,'0');
  function enhance(story) {
    const mark = story.querySelector('.ob-live-now>.ob-live-kicker');
    const m = mark && /\bWEEK\s+(\d{2})\s*\/\s*12\b/i.exec(mark.textContent);
    if (!m) return;
    const week = Number(m[1]);
    if (!Number.isInteger(week) || week < 1 || week > 12) return;
    const isJa = root.dataset.obLiveLang === 'ja';
    const next = story.querySelector('.ob-live-next');
    const prev = story.querySelector('.ob-live-previous');
    const nextLabel = next?.querySelector('.ob-live-kicker');
    const prevLabel = prev?.querySelector('.ob-live-kicker');
    if (nextLabel) {
      const expected = week < 12 ? `NEXT · W${fmt(week+1)}` : 'NEXT';
      if (nextLabel.textContent !== expected) nextLabel.textContent = expected;
    }
    if (prevLabel) {
      const expected = `PREVIOUS · W${fmt(Math.max(0,week-1))}`;
      if (prevLabel.textContent !== expected) prevLabel.textContent = expected;
    }
    // Week 05 is the approach to the W06 midseason checkpoint.
    if (!isJa && week === 5) {
      const heading = next?.querySelector('strong');
      if (heading && heading.textContent === 'MIDSEASON NEXT') {
        heading.textContent = 'MIDSEASON IS COMING.';
      }
    }
    // Preserve the data and Japanese copy; only differentiate the number glyphs.
    const status = story.querySelector('.ob-live-story-status');
    if (status && !status.querySelector('.ob-bridge-number-r20')) {
      const original = status.textContent;
      const parts = original.split(/(\d+)/);
      if (parts.length > 1) {
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (/^\d+$/.test(p)) {
            const strong=document.createElement('strong');
            strong.className='ob-bridge-number-r20';
            strong.textContent=p;
            frag.appendChild(strong);
          } else frag.appendChild(document.createTextNode(p));
        }
        status.replaceChildren(frag);
      }
    }
  }
  function attach(story) {
    if (story.dataset.obStoryBridgeObserved) return;
    story.dataset.obStoryBridgeObserved='yes';
    const watch = new MutationObserver(() => enhance(story));
    watch.observe(story,{childList:true,subtree:true,characterData:true});
    enhance(story);
  }
  function seek() {
    const story = root.querySelector('#obLiveStoryR1');
    if (!story) return false;
    attach(story);
    return true;
  }
  if (!seek()) {
    const search = new MutationObserver(() => {
      if (seek()) search.disconnect();
    });
    search.observe(root,{childList:true,subtree:true});
  }
})();
