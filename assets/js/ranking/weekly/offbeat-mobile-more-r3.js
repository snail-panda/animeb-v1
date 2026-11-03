/* OFFBEAT WEEKLY MOBILE EDITORIAL MORE R3 - BEGIN
 * Standalone add-on: never modifies raw reviews, Theme Studio, or language toggles.
 * If the text fits, no More button is shown. Mobile <=768 only.
 */
(function () {
  'use strict';
  if (window.__offbeatWeeklyMoreR3) return;
  window.__offbeatWeeklyMoreR3 = true;

  const sel = '.animeb-weekly-intro .animeb-intro-text, .animeb-dropped-card .animeb-dropped-reason, .animeb-bottom-item .animeb-bottom-comment';
  const mobile = window.matchMedia('(max-width: 768px)');
  let scheduled = false;
  let lastLang = null;
  let serial = 0;

  function prepare(node) {
    const lines = node.matches('.animeb-intro-text') ? '8' : '3';
    node.classList.add('offbeat-foldable');
    node.dataset.offbeatLines = lines;
    let button = node.nextElementSibling;
    if (!button || !button.classList.contains('offbeat-more-toggle')) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'offbeat-more-toggle';
      button.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (!node.id) node.id = 'offbeat-fold-content-' + (++serial);
      button.setAttribute('aria-controls', node.id);
      node.insertAdjacentElement('afterend', button);
    }
    return button;
  }

  function updateOne(node, reset) {
    const button = prepare(node);
    const ja = document.body.dataset.animebLang === 'ja';
    if (reset) node.dataset.offbeatExpanded = '0';
    if (!mobile.matches || !node.isConnected || !node.textContent.trim() || node.closest('[hidden]')) {
      node.classList.remove('offbeat-folded');
      button.hidden = true;
      return;
    }
    // Measure actual visible text after language/width changes, not character count.
    const expanded = node.dataset.offbeatExpanded === '1';
    node.classList.add('offbeat-folded');
    const overflowing = node.scrollHeight > node.clientHeight + 1.5;
    node.classList.toggle('offbeat-folded', overflowing && !expanded);
    button.hidden = !overflowing;
    button.setAttribute('aria-expanded', String(expanded && overflowing));
    button.textContent = expanded ? (ja ? '\u9589\u3058\u308b' : 'Show less') : (ja ? '\u2026 \u7d9a\u304d\u3092\u8aad\u3080' : '\u2026 More');
  }

  function refresh() {
    scheduled = false;
    const lang = document.body.dataset.animebLang || 'en';
    const reset = lastLang !== null && lang !== lastLang;
    lastLang = lang;
    document.querySelectorAll(sel).forEach(n => updateOne(n, reset));
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(refresh);
  }
  document.addEventListener('click', function(e) {
    const button = e.target.closest && e.target.closest('.offbeat-more-toggle');
    if (!button) return;
    const content = button.previousElementSibling;
    if (!content || !content.matches(sel)) return;
    content.dataset.offbeatExpanded = content.dataset.offbeatExpanded === '1' ? '0' : '1';
    updateOne(content, false);
  });
  const observer = new MutationObserver(function(mutations) {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.target === document.body && m.attributeName === 'data-animeb-lang') {
        schedule(); return;
      }
      if (m.type !== 'childList') continue;
      if (m.target.nodeType === 1 && (m.target.matches(sel) || m.target.closest(sel))) {
        schedule(); return;
      }
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.matches(sel) || n.querySelector(sel))) {
          schedule(); return;
        }
      }
    }
  });
  function boot() {
    observer.observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['data-animeb-lang']});
    window.addEventListener('resize', schedule, {passive:true});
    if (mobile.addEventListener) mobile.addEventListener('change', schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
/* OFFBEAT WEEKLY MOBILE EDITORIAL MORE R3 - END */
