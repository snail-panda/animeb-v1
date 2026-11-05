/* R13: compact bilingual hint below the weekly timeline. R11 preview untouched. */
(() => {
  'use strict';
  const nav=document.querySelector('#anime-top .n-season .n-weeks');
  if(!nav || document.querySelector('.ob-week-peek-cue-r13')) return;
  const cue=document.createElement('p');
  cue.className='ob-week-peek-cue-r13';
  cue.setAttribute('role','note');
  nav.insertAdjacentElement('afterend',cue);
  function update() {
    let lang='en';
    try { if(localStorage.getItem('animeb-weekly-lang')==='ja') lang='ja'; } catch(_) {}
    cue.lang=lang;
    cue.textContent=lang==='ja'
      ? '公開済みの週に触れると、その週のランキングの縮小版を表示します。'
      : 'Hover over or tap a published week to preview its weekly ranking.';
  }
  update();
  // R11 language buttons write localStorage during their click handler.
  // Read the updated preference after that handler completes.
  document.addEventListener('click',e=>{
    if(e.target.closest('.ob-week-peek-language button')) queueMicrotask(update);
  });
  window.addEventListener('storage',e=>{if(e.key==='animeb-weekly-lang') update();});
})();
