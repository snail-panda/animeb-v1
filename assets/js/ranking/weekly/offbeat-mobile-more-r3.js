/* OFFBEAT WEEKLY MOBILE EDITORIAL MORE R4 - BEGIN
 * Inline, single ellipsis + More. Keeps native source nodes for language redraw.
 * Does not alter the underlying review data or the full-text content.
 * Mobile only; responsive excerpt measured in the actual rendered column.
 */
(function () {
  'use strict';
  if (window.__offbeatWeeklyMoreR4) return;
  window.__offbeatWeeklyMoreR4 = true;

  const selector = '.animeb-weekly-intro .animeb-intro-text, .animeb-dropped-card .animeb-dropped-reason, .animeb-bottom-item .animeb-bottom-comment';
  const mobile = window.matchMedia('(max-width: 768px)');
  const records = new WeakMap();
  let pending = false;
  let lastLanguage = null;
  let index = 0;

  function kindOf(node) {
    if (node.matches('.animeb-intro-text')) return 'intro';
    if (node.matches('.animeb-dropped-reason')) return 'dropped';
    return 'bottom';
  }
  function locale() { return document.body.dataset.animebLang === 'ja' ? 'ja' : 'en'; }
  function newButton(expanded, targetId) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = expanded ? 'offbeat-r4-less' : 'offbeat-r4-more';
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    button.setAttribute('aria-controls', targetId);
    button.textContent = expanded ? (locale() === 'ja' ? '閉じる' : 'Show less')
                                  : (locale() === 'ja' ? '… 続きを読む' : '… More');
    return button;
  }
  function recordFor(source) {
    let record = records.get(source);
    if (!record) {
      if (!source.id) source.id = 'offbeat-r4-content-' + (++index);
      source.classList.remove('offbeat-foldable', 'offbeat-folded');
      source.removeAttribute('data-offbeat-lines');
      source.removeAttribute('data-offbeat-expanded');
      const leftover = source.nextElementSibling;
      if (leftover && leftover.classList.contains('offbeat-more-toggle')) leftover.remove();
      record = { expanded:false, preview:null, less:null };
      records.set(source, record);
    }
    return record;
  }
  function removeControls(record) {
    if (record.preview) { record.preview.remove(); record.preview = null; }
    if (record.less) { record.less.remove(); record.less = null; }
  }
  function showFull(source, record) {
    source.classList.remove('offbeat-r4-source-hidden');
    source.hidden = false;
    removeControls(record);
  }
  function styleLike(target, source) {
    const css = window.getComputedStyle(source);
    for (const property of ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight',
      'letterSpacing','wordSpacing','color','textAlign','textTransform','textShadow']) {
      target.style[property] = css[property];
    }
    target.style.whiteSpace = 'pre-line';
    return css;
  }
  function sourceContent(source, kind) {
    const root = document.createElement('div');
    let heading = '';
    if (kind === 'intro') {
      // The existing weekly-intro renderer uses safe inline tags (notably strong).
      for (const child of source.childNodes) root.appendChild(child.cloneNode(true));
    } else {
      let value = source.textContent || '';
      if (kind === 'dropped') {
        // Episode heading is metadata, not part of the 4-line reason preview.
        const match = value.match(/^\s*((?:Episode\s*#?\d+|Ep\.?\s*#?\d+|第\s*[\d０-９]+話)[^\r\n]*)[\r\n]+([\s\S]*)$/i);
        if (match) { heading = match[1].trim(); value = match[2].trim(); }
      }
      root.textContent = value.trim();
    }
    // Clones must not become new language-update targets or repeat IDs.
    root.querySelectorAll('[id],[data-en],[data-ja]').forEach(element => {
      element.removeAttribute('id');
      element.removeAttribute('data-en');
      element.removeAttribute('data-ja');
    });
    return {root, heading};
  }
  function clip(root, rawCount, en) {
    const text = root.textContent || '';
    let count = Math.max(0, Math.min(rawCount, text.length));
    while (count > 0 && /\s/.test(text.charAt(count-1))) count--;
    // Avoid cutting a surrogate pair (emoji etc.) in half.
    if (count > 0 && count < text.length && /[\uD800-\uDBFF]/.test(text.charAt(count-1))) count--;
    // Prefer breaking before the last incomplete English word, but do not
    // sacrifice a whole long line for an unusually long unbroken token.
    if (en && count < text.length && /[A-Za-z]/.test(text.charAt(count-1)) && /[A-Za-z]/.test(text.charAt(count))) {
      const preceding = text.slice(Math.max(0, count-20), count);
      const boundary = Math.max(preceding.lastIndexOf(' '), preceding.lastIndexOf('\n'));
      if (boundary >= 0 && count - (Math.max(0,count-20) + boundary) <= 15) {
        count = Math.max(0,count-20) + boundary;
      }
    }
    while (count > 0 && /\s/.test(text.charAt(count-1))) count--;
    // An existing trailing ellipsis is only removed in the PREVIEW: the full
    // original text remains unchanged and a single ellipsis comes from More.
    const lead = text.slice(0,count);
    const tail = lead.match(/(?:\.{3,}|…)+$/);
    if (tail) count -= tail[0].length;

    const range = document.createRange();
    range.selectNodeContents(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node, consumed = 0, endNode = null, endOffset = 0;
    while ((node = walker.nextNode())) {
      const end = consumed + node.textContent.length;
      if (count <= end) { endNode = node; endOffset = count - consumed; break; }
      consumed = end;
    }
    if (endNode) range.setEnd(endNode, endOffset);
    else if (count === 0) range.collapse(true);
    return range.cloneContents();
  }
  function render(source, reset) {
    const record = recordFor(source);
    if (reset) record.expanded = false;
    if (!mobile.matches || !source.isConnected || source.closest('[hidden]') || !(source.textContent || '').trim()) {
      showFull(source, record);
      return;
    }
    if (record.expanded) {
      showFull(source, record);
      record.less = newButton(true, source.id);
      record.less.classList.add('offbeat-r4-after');
      source.insertAdjacentElement('afterend', record.less);
      return;
    }

    // Build from the original source, never from a previous truncated preview.
    const kind = kindOf(source);
    const {root, heading} = sourceContent(source, kind);
    const whole = root.textContent || '';
    const preview = document.createElement('div');
    preview.className = 'offbeat-r4-preview offbeat-r4-preview-' + kind;
    const inherited = styleLike(preview, source);
    preview.style.margin = inherited.margin;
    const body = document.createElement('div');
    body.className = 'offbeat-r4-body';
    preview.appendChild(body);
    if (heading) {
      const top = document.createElement('div');
      top.className = 'offbeat-r4-drop-heading';
      top.textContent = heading;
      preview.insertBefore(top, body);
    }
    // Hide while measuring only after gathering computed styling.
    source.classList.add('offbeat-r4-source-hidden');
    source.insertAdjacentElement('afterend', preview);
    const css = window.getComputedStyle(body);
    const lineHeight = parseFloat(css.lineHeight) || parseFloat(css.fontSize) * 1.5;
    const limit = (kind === 'intro' ? 8 : kind === 'dropped' ? 4 : 3) * lineHeight + 1.5;

    // If it already fits, keep the native content and show no More.
    body.appendChild(root.cloneNode(true));
    const allFits = body.getBoundingClientRect().height <= limit;
    if (allFits) {
      showFull(source, record);
      return;
    }

    const more = newButton(false, source.id);
    const fits = n => {
      body.replaceChildren(clip(root,n,locale() === 'en'), more);
      return body.getBoundingClientRect().height <= limit;
    };
    let low = 0, high = whole.length;
    // The button is measured as part of the last line, not on a new row.
    while (low < high) {
      const middle = Math.ceil((low+high)/2);
      if (fits(middle)) low=middle;
      else high=middle-1;
    }
    fits(low);
    // If 4/3 lines really cannot accommodate any words plus the link,
    // keep the native text rather than creating an empty '… More' block.
    if (low < 2 || !(body.textContent || '').replace(/…\s*(More|続きを読む)$/, '').trim()) {
      showFull(source, record);
      return;
    }
    removeControls(record);
    // removeControls also removes the old preview, if there was one.
    record.preview = preview;
  }
  function refresh() {
    pending = false;
    const language = locale();
    const reset = lastLanguage !== null && lastLanguage !== language;
    lastLanguage = language;
    document.querySelectorAll(selector).forEach(node => render(node, reset));
    fixEpisodeSeparators();
  }
  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(refresh);
  }
  // Main.js rebuilds the episode line on every language switch. Keep the
  // native flex wrapping; only hide a '|' when it is stranded on a separate row.
  function fixEpisodeSeparators() {
    if (!mobile.matches) return;
    document.querySelectorAll('.entry .ranking-episode-line').forEach(line => {
      const divider = line.querySelector('.ranking-episode-separator');
      if (!divider) return;
      const before = divider.previousElementSibling;
      const after = divider.nextElementSibling;
      if (!before || !after) return;
      divider.style.display = '';
      const a=before.getBoundingClientRect(), b=divider.getBoundingClientRect(), c=after.getBoundingClientRect();
      const sameRow = Math.abs(a.top-b.top)<3 && Math.abs(b.top-c.top)<3;
      divider.style.display = sameRow ? '' : 'none';
    });
  }
  document.addEventListener('click', event => {
    const button = event.target.closest && event.target.closest('.offbeat-r4-more, .offbeat-r4-less');
    if (!button) return;
    const source = button.closest('.offbeat-r4-preview')?.previousElementSibling || button.previousElementSibling;
    if (!source || !source.matches(selector)) return;
    const record = recordFor(source);
    record.expanded = button.classList.contains('offbeat-r4-more');
    render(source, false);
  });
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target === document.body) {
        schedule(); return;
      }
      if (mutation.type !== 'childList' && mutation.type !== 'characterData') continue;
      const owner = mutation.target.nodeType===1 ? mutation.target : mutation.target.parentElement;
      if (owner?.closest('.offbeat-r4-preview')) continue;
      if (owner?.matches(selector) || owner?.closest(selector)) { schedule(); return; }
      if (mutation.type === 'childList') for (const child of mutation.addedNodes) {
        if (child.nodeType!==1 || child.classList?.contains('offbeat-r4-preview') || child.classList?.contains('offbeat-r4-less')) continue;
        if (child.matches?.(selector) || child.querySelector?.(selector) || child.matches?.('.ranking-episode-line')) {
          schedule(); return;
        }
      }
    }
  });
  function boot() {
    observer.observe(document.body, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-animeb-lang','data-animeb-theme','data-animeb-image-tone']});
    window.addEventListener('resize', schedule, {passive:true});
    if (mobile.addEventListener) mobile.addEventListener('change', schedule);
    if (document.fonts?.ready) document.fonts.ready.then(schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
/* OFFBEAT WEEKLY MOBILE EDITORIAL MORE R4 - END */
