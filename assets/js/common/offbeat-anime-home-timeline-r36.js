/* OFFBEAT R36 — move the EXISTING milestones legend to the R35 Week Peek row.
   No clone, no changed text, no new events, no mutations to timeline data. */
(()=>{'use strict';
  const root=document.querySelector('#anime-top.anime09');
  if(!root)return;
  let queued=false;
  function place(){
    queued=false;
    const dash=root.querySelector('.n-season-dashboard.ob-r35-ready');
    const row=dash?.querySelector('#obR35PeekRow');
    const button=row?.querySelector('#obLivePeekToggleR3');
    const foot=dash?.querySelector('#obLivePhaseFootR3');
    const legend=dash?.querySelector('.ob-live-stage-legend');
    // R35 must be ready and all originals intact. Otherwise leave R35 alone.
    if(!dash||!row||!button||!foot||!legend)return;
    if(legend.parentElement!==row)row.append(legend);
    dash.classList.add('ob-r36-legend-moved');
  }
  function schedule(){
    if(queued)return;
    queued=true;requestAnimationFrame(place);
  }
  function init(){
    // Covers R35's async published-checkpoint build and season re-renders.
    // Only child additions/removals, not attribute/style tweaks, are watched.
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    place();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
