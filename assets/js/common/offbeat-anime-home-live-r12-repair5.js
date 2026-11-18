/* OFFBEAT R12 targeted repair 5: wording only for the checkpoint note.
   Repair 4 renders these entries asynchronously from posts-index.json. */
(()=>{'use strict';
 const root=()=>document.querySelector('.anime09.ob-live-r12');
 const ja=()=>{
   try {return localStorage.getItem('animeb-weekly-lang')==='ja'||document.getElementById('anime-top')?.lang==='ja'}catch{return false}
 };
 const fix=()=>{
   const note=root()?.querySelector('.n-season-13 .n-checkpoints .ob-r12-checkpoint-note');
   if(!note)return;
   const txt=ja()?'公開中の特集はリンクから読めます。今後の予定は参考表示です。':'Available features are linked. Upcoming entries are listed for reference.';
   if(note.textContent!==txt)note.textContent=txt;
 };
 const begin=()=>{
   const sec=root()?.querySelector('.n-season-13');
   if(!sec)return;
   const cp=sec.querySelector('.n-checkpoints');if(!cp)return;
   fix();
   new MutationObserver(fix).observe(cp,{childList:true,subtree:true,characterData:true});
   window.addEventListener('storage',()=>setTimeout(fix,50));
   document.addEventListener('click',e=>{
     if(e.target.closest('[data-peek-lang],#obLangToggle,.ob-language-toggle'))setTimeout(fix,350);
   },true);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
})();
