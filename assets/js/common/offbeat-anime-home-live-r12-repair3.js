/* OFFBEAT R12 repair 3: dock Back to Current next to View All Seasons.
   Existing R16 season-selection behavior remains intact. No new data loading. */
(()=>{'use strict';
  const dock=()=>{
    const sec=document.querySelector('.anime09.ob-live-r12 .n-season-13');
    if(!sec)return false;
    const overview=sec.querySelector('.n-season-header > .ob-r16-overview') ||
                   sec.querySelector('.n-season-header .ob-r16-overview');
    const home=sec.querySelector('.n-season-chooser .ob-r16-back') ||
               sec.querySelector('.n-season-header .ob-r12-archive-actions > .ob-r16-back');
    if(!overview||!home)return false;
    let controls=sec.querySelector('.n-season-header .ob-r12-archive-actions');
    if(!controls){
      controls=document.createElement('div');
      controls.className='ob-r12-archive-actions';
      overview.before(controls);
    }
    if(home.parentNode!==controls)controls.append(home);
    if(overview.parentNode!==controls)controls.append(overview);
    return true;
  };
  const begin=()=>{
    if(dock())return;
    const observer=new MutationObserver(()=>{if(dock())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.setTimeout(()=>observer.disconnect(),12000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});
  else begin();
})();
