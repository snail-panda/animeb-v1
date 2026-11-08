/* OFFBEAT S.O.W. — bilingual draft reading panel (R1).
   The EN draft is the approved in-chat working version, not edited here.
   The JA rendering is provisional. Shared language setting; no JSON changes. */
(() => {
  'use strict';
  const trigger = document.getElementById('obSowAboutOpenR1');
  const root = document.getElementById('anime-top');
  if (!trigger || !root || document.getElementById('obSowAboutOverlayR1')) return;

  const text = {
    en: [
      `You can't be twelve wks angry men; we're all just 23 min travelers with seasons.`,
      `You should not let princes keep and control the view, plowmen dig your fav anime, or businessmen drink your wine — yeah, there may still be some jokers saying to a thief, "There's too much confusion."`,
      `And as the thief kindly speaks, "There are many here among us who feel that life is but a joke."`,
      `Yeah, you and I, we've been through that. At the end of the day, we're gathering all along the watchtower.`,
      `This doesn't have to be our fate; there's always some kind of way out of here, but we still stay and watch, especially as the hour's getting late.`,
      `No reason not to get too excited.`,
      `Don't let anime just be a joke.`,
      `So, let us stop talking falsely now.`,
      `Gotta be a way, gotta be a way out of here...`,
      `...must be seasons of the watch...`,
      `But hey, whose watchtower is it anyway?`,
      `Shouldn't you be the keeper of your own watchtower?`,
      `It's your pilgrimage, your own journey through the season. You decide where it leads, which paths to take, where to stop, and what to leave behind. No prince gets to map it all out for you.`,
      `And S.O.W.? It's not here to tell you which way to go. It's just one way to travel, one companion along the road — perhaps even a few more stitches in the Great Anthology we're all weaving together, season after season.`,
      `So now, we have this Fantasy Anime League Seasonal Championship here!`
    ],
    ja: [
      `12週間ずっと「怒れる男たち」ではいられない。僕らはみんな、季節を渡る23分の旅人にすぎないんだから。`,
      `王侯たちに視界を見張らせ、支配させてはいけない。農夫たちにお気に入りのアニメを掘り返させたり、ビジネスマンに自分のワインを飲ませたりするのもね。まあ、まだ道化師が泥棒に「何もかも混乱だらけだ」なんて言っているかもしれないけれど。`,
      `そして泥棒は親切そうにこう言う。「人生なんて冗談みたいなものだと感じている人間が、ここには大勢いるんだ」。`,
      `そう、君も僕も、そんなことはとっくに経験してきた。結局、一日の終わりには、僕らはまた見張り塔の周りに集まってくる。`,
      `でも、それが僕らの運命である必要はない。ここから抜け出す道は、いつだってどこかにある。それなのに僕らは、時が遅くなるほど、ここに残って見続けてしまう。`,
      `大いに熱くなってはいけない理由なんてない。`,
      `アニメをただの冗談で終わらせるな。`,
      `だから、もう偽りの言葉を交わすのはやめよう。`,
      `道はあるはずだ、ここから抜け出す道はきっとある……`,
      `……それはきっと、Seasons of the Watch……`,
      `でも、ちょっと待って。その見張り塔は、そもそも誰のものなんだ？`,
      `自分自身の見張り塔の番人になるべきじゃないか？`,
      `これは君自身の巡礼であり、シーズンを通して歩む君自身の旅だ。行き先も、通る道も、どこで立ち止まり、何を置いていくかも、自分で決める。王侯たちに道のりを全部決めさせる必要なんてない。`,
      `じゃあS.O.W.は？　進むべき道を君に命じるものじゃない。旅の一つの楽しみ方であり、道連れの一人でもある。そして、季節ごとに僕らが紡いでいくGreat Anthologyに、さらにいくつかの縫い目を加えるものなのかもしれない。`,
      `というわけで、ここにFantasy Anime League Seasonal Championshipの開幕だ！`
    ]
  };

  const overlay = document.createElement('div');
  overlay.className = 'ob-sow-about-overlay-r1';
  overlay.id = 'obSowAboutOverlayR1';
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="ob-sow-about-dialog-r1" role="dialog" aria-modal="true" aria-labelledby="obSowAboutTitleR1" tabindex="-1">
      <header class="ob-sow-about-head-r1">
        <h2 class="ob-sow-about-title-r1" id="obSowAboutTitleR1">What is S.O.W.?</h2>
        <button class="ob-sow-about-close-r1" id="obSowAboutCloseR1" type="button" aria-label="Close">×</button>
      </header>
      <div class="ob-sow-about-copy-r1" id="obSowAboutCopyR1"></div>
    </section>`;
  document.body.append(overlay);
  const dialog = overlay.querySelector('.ob-sow-about-dialog-r1');
  const closeButton = overlay.querySelector('#obSowAboutCloseR1');
  const title = overlay.querySelector('#obSowAboutTitleR1');
  const copy = overlay.querySelector('#obSowAboutCopyR1');
  let restoreFocus = null;
  let priorOverflow = '';
  let renderedLanguage = null;
  const language = () => {
    try { return localStorage.getItem('animeb-weekly-lang') === 'ja' ? 'ja' : 'en'; }
    catch { return 'en'; }
  };

  function syncLanguage() {
    const lang = language();
    const label = lang === 'ja' ? 'S.O.W.とは？' : 'What is S.O.W.?';
    // Avoid unnecessary DOM writes: the Anime Home i18n observer watches text changes.
    if (trigger.textContent !== label) trigger.textContent = label;
    if (trigger.getAttribute('aria-label') !== label) trigger.setAttribute('aria-label', label);
    if (title.textContent !== label) title.textContent = label;
    const closeLabel = lang === 'ja' ? '閉じる' : 'Close';
    if (closeButton.getAttribute('aria-label') !== closeLabel) closeButton.setAttribute('aria-label', closeLabel);
    if (overlay.lang !== lang) overlay.lang = lang;
    if (renderedLanguage === lang) return;
    renderedLanguage = lang;
    const fragment = document.createDocumentFragment();
    text[lang].forEach((line, i) => {
      const p = document.createElement('p');
      if (i === text[lang].length - 1) p.className = 'ob-sow-about-final-r1';
      p.textContent = line; // editorial text is data, never evaluated as HTML
      fragment.append(p);
    });
    copy.replaceChildren(fragment);
  }
  function open() {
    syncLanguage();
    restoreFocus = document.activeElement;
    priorOverflow = document.body.style.overflow;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    trigger.setAttribute('aria-expanded', 'true');
    dialog.focus();
  }
  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.style.overflow = priorOverflow;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus && typeof restoreFocus.focus === 'function') restoreFocus.focus();
  }
  trigger.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const focusable = [closeButton];
    if (!focusable.includes(document.activeElement)) { e.preventDefault(); closeButton.focus(); }
  });
  // The established Week Peek switch stores the shared preference on click.
  document.addEventListener('click', e => {
    if (e.target instanceof Element && e.target.closest('.ob-week-peek-language button[data-peek-lang]')) {
      setTimeout(syncLanguage, 0);
    }
  }, true);
  window.addEventListener('storage', e => { if (e.key === 'animeb-weekly-lang') syncLanguage(); });
  window.addEventListener('pageshow', syncLanguage);
  new MutationObserver(syncLanguage).observe(root, {attributes:true, attributeFilter:['lang']});
  syncLanguage();
})();
