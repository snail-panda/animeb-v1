/* OFFBEAT Weekly mobile text & episode polish R5.
   Existing reviews remain untouched. Only render a short responsive view on mobile. */
(function () {
  'use strict';
  if (window.__offbeatWeeklyMoreR5) return;
  window.__offbeatWeeklyMoreR5 = true;

  const sourceSelector = '.animeb-weekly-intro .animeb-intro-text, .animeb-dropped-card .animeb-dropped-reason, .animeb-bottom-item .animeb-bottom-comment';
  const mobile = window.matchMedia('(max-width: 768px)');
  const records = new WeakMap();
  let scheduled = false;
  let lastLanguage = null;
  let counter = 0;

  const language = () => document.body.dataset.animebLang === 'ja' ? 'ja' : 'en';
  function typeFor(source) {
    return source.matches('.animeb-intro-text') ? 'intro'
      : source.matches('.animeb-dropped-reason') ? 'dropped' : 'bottom';
  }
  function maxLines(type) { return type === 'intro' ? 8 : type === 'dropped' ? 4 : 3; }

  function state(source) {
    let r = records.get(source);
    if (!r) {
      if (!source.id) source.id = 'offbeat-r5-source-' + (++counter);
      source.classList.remove('offbeat-foldable', 'offbeat-folded', 'offbeat-r4-source-hidden');
      source.removeAttribute('data-offbeat-lines');
      source.removeAttribute('data-offbeat-expanded');
      const oldControl = source.nextElementSibling;
      if (oldControl?.classList.contains('offbeat-more-toggle')) oldControl.remove();
      r = { expanded: false, preview: null, less: null };
      records.set(source, r);
    }
    return r;
  }
  function removeExtras(r) {
    if (r.preview) { r.preview.remove(); r.preview = null; }
    if (r.less) { r.less.remove(); r.less = null; }
  }
  function full(source, r) {
    removeExtras(r);
    source.classList.remove('offbeat-r5-source-hidden');
  }
  function button(label, kind, controls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'offbeat-r5-' + kind;
    b.textContent = label;
    b.setAttribute('aria-controls', controls);
    b.setAttribute('aria-expanded', String(kind === 'less'));
    return b;
  }

  // Extract only the source's actual editorial text. The original remains
  // intact and keeps its native language and review handlers.
  function textFor(source, type) {
    const content = document.createElement('span');
    let heading = '';
    if (type === 'intro') {
      for (const child of source.childNodes) content.appendChild(child.cloneNode(true));
      content.querySelectorAll('[id],[data-en],[data-ja]').forEach(el => {
        el.removeAttribute('id'); el.removeAttribute('data-en'); el.removeAttribute('data-ja');
      });
    } else {
      let raw = source.textContent || '';
      if (type === 'dropped') {
        const m = raw.match(/^\s*((?:Episode\s*#?\d+|Ep\.?\s*#?\d+|第\s*[\d０-９]+話)[^\r\n]*)[\r\n]+([\s\S]*)$/i);
        if (m) { heading = m[1].trim(); raw = m[2]; }
      }
      content.textContent = raw.trim();
    }
    return { content, heading };
  }

  // Preserve inline markup such as <strong> while safely clipping text nodes.
  function excerpt(content, requestedCount, isEnglish) {
    const text = content.textContent || '';
    let count = Math.max(0, Math.min(requestedCount, text.length));
    if (isEnglish && count < text.length && /[A-Za-z]/.test(text[count - 1] || '')
      && /[A-Za-z]/.test(text[count] || '')) {
      const start = Math.max(0, count - 26);
      const end = text.slice(start, count);
      const p = Math.max(end.lastIndexOf(' '), end.lastIndexOf('\n'));
      if (p >= 0 && count - (start + p) <= 22) count = start + p;
    }
    // The single ellipsis comes from the inline More button below, never from both.
    while (count > 0 && /\s/.test(text[count - 1])) count--;
    const suffix = text.slice(0, count).match(/(?:\.{3,}|…)+\s*$/);
    if (suffix) count -= suffix[0].length;
    while (count > 0 && /\s/.test(text[count - 1])) count--;
    if (count > 0 && count < text.length && /[\uD800-\uDBFF]/.test(text[count - 1])) count--;

    const range = document.createRange();
    range.selectNodeContents(content);
    const walk = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    let node, passed = 0, endNode = null, endOffset = 0;
    while ((node = walk.nextNode())) {
      const after = passed + node.textContent.length;
      if (count <= after) { endNode = node; endOffset = count - passed; break; }
      passed = after;
    }
    if (endNode) range.setEnd(endNode, endOffset);
    else if (count === 0) range.collapse(true);
    return range.cloneContents();
  }

  function render(source, reset) {
    const r = state(source);
    if (reset) r.expanded = false;
    if (!mobile.matches || !source.isConnected || source.closest('[hidden]')
      || !(source.textContent || '').trim()) { full(source, r); return; }
    if (r.expanded) {
      full(source, r);
      r.less = button(language() === 'ja' ? '閉じる' : 'Show less', 'less', source.id);
      source.insertAdjacentElement('afterend', r.less);
      return;
    }

    const type = typeFor(source);
    const data = textFor(source, type);
    const allText = data.content.textContent || '';
    if (!allText.trim()) { full(source, r); return; }

    // Read computed typography before hiding the native element.
    const computed = getComputedStyle(source);
    const preview = document.createElement('div');
    preview.className = 'offbeat-r5-preview offbeat-r5-preview-' + type;
    for (const key of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
      'letterSpacing', 'wordSpacing', 'color', 'textAlign', 'textTransform', 'textShadow']) {
      preview.style[key] = computed[key];
    }
    preview.style.margin = computed.margin;
    if (data.heading) {
      const heading = document.createElement('div');
      heading.className = 'offbeat-r5-heading';
      heading.textContent = data.heading;
      preview.appendChild(heading);
    }
    const body = document.createElement('div');
    body.className = 'offbeat-r5-body';
    preview.appendChild(body);
    source.insertAdjacentElement('afterend', preview);
    source.classList.add('offbeat-r5-source-hidden');

    const heightPerLine = parseFloat(getComputedStyle(body).lineHeight) || parseFloat(computed.fontSize) * 1.5;
    const limit = heightPerLine * maxLines(type) + 1.5;
    // No More if the entire native text already fits within the line budget.
    body.appendChild(data.content.cloneNode(true));
    if (body.getBoundingClientRect().height <= limit) {
      preview.remove(); full(source, r); return;
    }

    const more = button(language() === 'ja' ? '… 続きを読む' : '… More', 'inline-more', source.id);
    const fits = count => {
      body.replaceChildren(excerpt(data.content, count, language() !== 'ja'), more);
      return body.getBoundingClientRect().height <= limit;
    };
    let low = 0, high = allText.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (fits(middle)) low = middle;
      else high = middle - 1;
    }
    fits(low);
    const visible = body.textContent.replace(/…\s*(More|続きを読む)$/, '').trim();
    if (visible.length < 2) { preview.remove(); full(source, r); return; }
    removeExtras(r);
    r.preview = preview;
  }

  // main.js creates 3 flex children: episode A, separator, episode B.
  // Join the separator with the first word of B so it can never occupy a row alone.
  function fixEpisodeLine(line) {
    if (!mobile.matches) return;
    const sep = line.querySelector(':scope > .ranking-episode-separator');
    if (!sep) return;
    const next = sep.nextElementSibling;
    if (!next) return;
    const text = next.textContent || '';
    if (!text) return;
    const match = text.match(/^\S{1,18}/u);
    const first = match ? match[0] : text.slice(0, 1);
    const rest = text.slice(first.length);
    const group = document.createElement('span');
    group.className = 'offbeat-r5-episode-secondary';
    group.dataset.offbeatSecondaryText = text;
    const leading = document.createElement('span');
    leading.className = 'offbeat-r5-episode-lead';
    const bar = document.createElement('span');
    bar.className = 'ranking-episode-separator';
    bar.textContent = '│';
    leading.append(bar, document.createTextNode('\u00a0' + first));
    group.append(leading, document.createTextNode(rest));
    sep.replaceWith(group);
    next.remove();
  }
  function restoreEpisodeLine(line) {
    const group = line.querySelector(':scope > .offbeat-r5-episode-secondary');
    if (!group) return;
    const sep = document.createElement('span');
    sep.className = 'ranking-episode-separator';
    sep.textContent = '│';
    const after = document.createElement('span');
    after.textContent = group.dataset.offbeatSecondaryText || group.textContent.replace(/^│\s*/, '');
    group.replaceWith(sep, after);
  }
  function refresh() {
    scheduled = false;
    const nextLang = language();
    const reset = lastLanguage !== null && nextLang !== lastLanguage;
    lastLanguage = nextLang;
    document.querySelectorAll(sourceSelector).forEach(node => render(node, reset));
    document.querySelectorAll('.entry .ranking-episode-line').forEach(line => {
      if (mobile.matches) fixEpisodeLine(line);
      else restoreEpisodeLine(line);
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }
  document.addEventListener('click', event => {
    const control = event.target.closest?.('.offbeat-r5-inline-more, .offbeat-r5-less');
    if (!control) return;
    const source = control.closest('.offbeat-r5-preview')?.previousElementSibling || control.previousElementSibling;
    if (!source || !source.matches(sourceSelector)) return;
    const r = state(source);
    r.expanded = control.classList.contains('offbeat-r5-inline-more');
    render(source, false);
  });

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'attributes') {
        if (m.target === document.body) { schedule(); return; }
        continue;
      }
      const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (el?.closest('.offbeat-r5-preview')) continue;
      if (el?.matches(sourceSelector) || el?.closest(sourceSelector)) { schedule(); return; }
      if (el?.matches('.ranking-episode-line') || el?.closest('.ranking-episode-line')) {
        // Ignore our own grouping once applied, but recognize main.js rebuilding it.
        if (el.querySelector?.(':scope > .ranking-episode-separator')) { schedule(); return; }
      }
      if (m.type === 'childList') for (const node of m.addedNodes) {
        if (node.nodeType !== 1 || node.classList?.contains('offbeat-r5-preview') || node.classList?.contains('offbeat-r5-less')) continue;
        if (node.matches?.(sourceSelector) || node.querySelector?.(sourceSelector)
          || node.matches?.('.ranking-episode-line') || node.querySelector?.('.ranking-episode-line')) {
          schedule(); return;
        }
      }
    }
  });
  function boot() {
    observer.observe(document.body, {subtree:true,childList:true,characterData:true,attributes:true,
      attributeFilter:['data-animeb-lang','data-animeb-theme','data-animeb-image-tone']});
    window.addEventListener('resize', schedule, {passive:true});
    mobile.addEventListener?.('change', schedule);
    document.fonts?.ready?.then(schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
