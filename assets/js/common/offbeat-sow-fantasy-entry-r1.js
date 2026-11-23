/* S.O.W. Fantasy R1: a small, reversible Anime Home entry. Does not touch existing UI event handlers. */
(() => {
  'use strict';
  const ID = 'ob-sow-fantasy-entry-r1';
  const HREF = 'sow/fantasy/index.html';
  let scheduled = false;
  function inject() {
    scheduled = false;
    const root = document.getElementById('anime-top');
    if (!root || document.getElementById(ID)) return;
    const season = root.querySelector('.n-season');
    if (!season) return; // No guessed fallback: protect the approved Home layout.
    const entry = document.createElement('section');
    entry.id = ID;
    entry.className = 'ob-sow-fantasy-entry-r1';
    entry.setAttribute('aria-label', 'S.O.W. Fantasy Points preview');
    entry.innerHTML = `
      <div class="ob-sow-fantasy-copy">
        <div class="ob-sow-fantasy-kicker"><span class="ob-sow-fantasy-dot" aria-hidden="true"></span>S.O.W. <span class="ob-sow-fantasy-slash">/</span> FANTASY <span class="ob-sow-fantasy-state">PREVIEW</span></div>
        <div class="ob-sow-fantasy-head">
          <h2>Fantasy Points</h2>
          <p class="ob-sow-fantasy-ja" lang="ja">4作品を選び、12週間の行方を追う。</p>
          <p class="ob-sow-fantasy-en" lang="en">Four picks. Twelve weeks. Anything can happen.</p>
        </div>
        <p class="ob-sow-fantasy-deck ob-sow-fantasy-en" lang="en">Build a team from A–D, follow the weekly rankings, and see how your choices play out. A first look at a new way to experience the season.</p>
        <p class="ob-sow-fantasy-deck ob-sow-fantasy-ja" lang="ja">A〜Dから1作品ずつ選んで、毎週のランキングとチームの運命を追いかける。シーズンを楽しむ、新しい試み。</p>
      </div>
      <a class="ob-sow-fantasy-go" href="${HREF}" aria-label="Explore S.O.W. Fantasy Points">
        <span class="ob-sow-fantasy-en" lang="en">EXPLORE FANTASY</span>
        <span class="ob-sow-fantasy-ja" lang="ja">FANTASYを見てみる</span>
        <i aria-hidden="true"></i>
      </a>`;
    // The intro and current-season section are unchanged; link sits after the entire season block.
    season.insertAdjacentElement('afterend', entry);
    entry.querySelector('a').addEventListener('click', (e) => {
      const isJa = root.getAttribute('data-ob-live-lang') === 'ja';
      e.currentTarget.href = HREF + (isJa ? '?lang=ja' : '?lang=en');
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(inject);
  }
  function start() {
    schedule();
    const root = document.getElementById('anime-top');
    if (root) new MutationObserver(() => {
      if (!document.getElementById(ID)) schedule();
    }).observe(root, {childList:true,subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
