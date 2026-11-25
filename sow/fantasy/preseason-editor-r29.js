/* S.O.W. Fantasy · R2.9 Visual Classification Workbench
   One record per title, one ordered expectation list; overlapping groups are intentional.
   Commissioner-only local working copy. Never mutates My Team, scoring or official settings.
   Backwards-compatible with the R2.9 text-editor working-copy JSON. */
(()=>{'use strict';
const root=document.getElementById('classificationEditor');if(!root)return;
const by=id=>document.getElementById(id);
const initial=fullGroupManifest(),names=initial.names,season=initial.season;
const bridge=window.SOWFantasyClassificationR30,active=bridge.loadActive();
const KEY='sow-fantasy-preseason-editor-draft-'+season+'-v2';
const OLD_KEY='sow-fantasy-preseason-editor-draft-'+season+'-v1';
const ids=[...new Set(Object.values(initial.groupBands).flatMap(data=>[...(data.elite||[]),...(data.next||[]),...(data.all||[])]))];
const idSet=new Set(ids),baseRevision=initial.revision;
const initialById={};
for(const id of ids)initialById[id]={id,A:'none',B:'none',C:false,D:false};
for(const id of initial.groupBands.A.elite)initialById[id].A='elite';
for(const id of initial.groupBands.A.next)initialById[id].A='next';
for(const id of initial.groupBands.B.all)initialById[id].B=initial.groupBands.B.reliable.includes(id)?'reliable':'upside';
for(const id of initial.groupBands.C.all)initialById[id].C=true;
for(const id of initial.groupBands.D.all)initialById[id].D=true;
const clone=x=>JSON.parse(JSON.stringify(x));
const escapeHTML=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ja={};
try{for(const w of WEEKS)for(const entry of w.entries||[])if(entry.ja&&!ja[entry.id])ja[entry.id]=entry.ja;}catch(_){}
const desc=id=>ja[id]||names[id]||id;
const imageURL=id=>`https://snail-panda.github.io/animeb-v1/images/key-visuals/2026/fall/${encodeURIComponent(id)}.webp`;
const cover=id=>`<div class="ce-cover"><span class="ce-fallback" aria-hidden="true">${escapeHTML(String(id).slice(0,2).toUpperCase())}</span><img loading="lazy" alt="" src="${imageURL(id)}" onerror="this.hidden=true"></div>`;
let rows=clone(initialById),ranking=active.ranking.slice(),notes=clone(active.notes||{}),selected=ranking[0],mode='visual',changed=false;
let undoStack=[],redoStack=[],saveTimer=0,dragged='';
const report=(message,error=false)=>{by('ceMessage').textContent=message;by('ceMessage').classList.toggle('is-error',error)};
function groups(id){const r=rows[id];return (r.A!=='none'?'A':'')+(r.B!=='none'?'B':'')+(r.C?'C':'')+(r.D?'D':'')}
function validRows(source){
 if(!source||typeof source!=='object'||Array.isArray(source))throw Error('作品分類の形式が不正です');
 if(Object.keys(source).length!==ids.length||!ids.every(id=>Object.hasOwn(source,id)))throw Error('作品数・IDが一致しません');
 for(const id of ids){const r=source[id];if(!r||r.id!==id||!['none','elite','next'].includes(r.A)||!['none','reliable','upside'].includes(r.B)||typeof r.C!=='boolean'||typeof r.D!=='boolean')throw Error('不正な分類: '+id)}
}
function validRank(rank){if(!Array.isArray(rank)||rank.length!==ids.length||new Set(rank).size!==ids.length||!rank.every(id=>idSet.has(id)))throw Error('順位データが一致しません')}
function validNotes(n){if(!n||typeof n!=='object'||Array.isArray(n))throw Error('メモの形式が不正です');for(const [id,v] of Object.entries(n))if(!idSet.has(id)||typeof v!=='string'||v.length>400)throw Error('不正なメモ: '+id)}
const snapshot=()=>JSON.stringify({rows,ranking,notes});
function restore(s){const state=JSON.parse(s);validRows(state.rows);validRank(state.ranking);validNotes(state.notes);rows=clone(state.rows);ranking=state.ranking.slice();notes=clone(state.notes)}
function record(){undoStack.push(snapshot());if(undoStack.length>75)undoStack.shift();redoStack=[];changed=true}
function apply(change,message){const previous=snapshot();record();change();if(snapshot()===previous){undoStack.pop();return}scheduleSave();render();if(message)report(message)}
function groupCounts(){const n={A:0,B:0,C:0,D:0,Aelite:0,Anext:0,Breliable:0,Bupside:0,overlaps:0,unsorted:0};for(const id of ids){const g=groups(id);if(g.length>1)n.overlaps++;if(!g)n.unsorted++;for(const x of g)n[x]++;if(rows[id].A==='elite')n.Aelite++;if(rows[id].A==='next')n.Anext++;if(rows[id].B==='reliable')n.Breliable++;if(rows[id].B==='upside')n.Bupside++}return n}
function bandGroups(){const inOrder=fn=>ranking.filter(id=>fn(rows[id]));const elite=inOrder(r=>r.A==='elite'),next=inOrder(r=>r.A==='next'),reliable=inOrder(r=>r.B==='reliable'),upside=inOrder(r=>r.B==='upside');return {A:{elite,next},B:{reliable,all:[...reliable,...upside]},C:{all:inOrder(r=>r.C)},D:{all:inOrder(r=>r.D)}}}
function warnings(){const n=groupCounts(),out=[];if(n.A<3)out.push('A候補が3作品未満');if(n.Anext<2)out.push('A Nextが2作品未満');for(const g of 'BCD')if(n[g]<3)out.push(g+'候補が3作品未満');if(n.unsorted)out.push('未分類 '+n.unsorted+'作品');return out}
function envelope(){validRows(rows);validRank(ranking);validNotes(notes);return {schema:'sow-fantasy-preseason-classification-draft-v2',season,baseRevision,status:'LOCAL WORKING COPY · NOT FINAL',savedAt:new Date().toISOString(),ranking:ranking.slice(),notes:clone(notes),rows:clone(rows),groupBands:bandGroups(),names:clone(names),warnings:warnings()}}
function decode(x){if(!x||!['sow-fantasy-preseason-classification-draft-v1','sow-fantasy-preseason-classification-draft-v2'].includes(x.schema)||x.season!==season||(typeof x.baseRevision!=='string'||!/^fall2026-[a-zA-Z0-9-]+$/.test(x.baseRevision)))throw Error('シーズン・分類リビジョンが一致しません');validRows(x.rows);const rank=x.schema.endsWith('-v1')?ids.slice():x.ranking.slice();validRank(rank);const n=x.schema.endsWith('-v1')?{}:(x.notes||{});validNotes(n);return {rows:clone(x.rows),ranking:rank,notes:clone(n)}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(envelope()));changed=false;by('ceStatus').textContent='AUTO-SAVED · LOCAL';}catch(e){by('ceStatus').textContent='SAVE FAILED';report('自動保存できませんでした: '+e.message,true)}}
function scheduleSave(){clearTimeout(saveTimer);by('ceStatus').textContent='SAVING…';saveTimer=setTimeout(persist,350)}
function updateStats(){const n=groupCounts();by('ceStats').textContent=`A ${n.A} (Elite ${n.Aelite} / Next ${n.Anext})  ·  B ${n.B} (Reliable ${n.Breliable} / Upside ${n.Bupside})  ·  C ${n.C}  ·  D ${n.D}  ·  Multi-group ${n.overlaps}  ·  Unsorted ${n.unsorted}`;by('ceRankCount').textContent=`${ids.length} TITLES · ORDER EDITABLE`;by('ceUndo').disabled=!undoStack.length;by('ceRedo').disabled=!redoStack.length}
function card(id){const idx=ranking.indexOf(id)+1,g=groups(id)||'UNSORTED';const role=rows[id].A==='elite'?' · ELITE':rows[id].A==='next'?' · NEXT':rows[id].B==='reliable'?' · RELIABLE':'';return `<div class="ce-card${selected===id?' selected':''}" draggable="true" tabindex="0" role="button" aria-label="${escapeHTML(desc(id))} · rank ${idx} · ${g}" data-card="${escapeHTML(id)}" title="${escapeHTML(names[id]||id)}"><span class="ce-number">${String(idx).padStart(2,'0')}</span>${cover(id)}<div class="ce-name">${escapeHTML(desc(id))}</div><div class="ce-mini${g.length>1?' is-multi':''}">${g}${role}</div></div>`}
function choose(id){if(!idSet.has(id))return;selected=id;render()}
function rankingCards(q){const shown=ranking.filter(id=>!q||searchMatch(id,q));by('ceRankList').innerHTML=shown.map(card).join('')||'<span class="ce-muted">該当作品はありません。</span>'}
const laneOrder=['A','AB','ABC','ABCD','AC','ACD','AD','B','BC','BCD','BD','C','CD','D','UNSORTED'];
function board(q){const occupied=[...new Set(ids.map(id=>groups(id)||'UNSORTED'))];const fixed=['A','AB','B','BC','C','CD','D','UNSORTED'];const lanes=[...new Set([...fixed,...occupied])];const laneIndex=g=>laneOrder.includes(g)?laneOrder.indexOf(g):6;lanes.sort((a,b)=>laneIndex(a)-laneIndex(b));
 by('ceBoard').innerHTML=lanes.map(g=>{const members=ranking.filter(id=>(groups(id)||'UNSORTED')===g&&(!q||searchMatch(id,q)));const count=ids.filter(id=>(groups(id)||'UNSORTED')===g).length;return `<div class="ce-lane" data-lane="${g}" data-group="${g==='UNSORTED'?'UNSORTED':g.length>1?'COMBO':g}"><div class="ce-lane-header"><strong>${g==='UNSORTED'?'UNSORTED':g.split('').join(' / ')}</strong><span>${count} ${count===1?'TITLE':'TITLES'}</span></div><div class="ce-lane-list">${members.map(card).join('')}<button type="button" class="ce-place" data-place="${g}" aria-label="Move selected title to ${g}">＋ SELECTED HERE</button></div></div>`}).join('')}
function searchMatch(id,q){return (desc(id)+' '+(names[id]||'')+' '+id).toLocaleLowerCase().includes(q)}
function selectedInspector(){const id=selected,r=rows[id],rank=ranking.indexOf(id)+1;by('ceSelected').innerHTML=`<div class="ce-kicker">SELECTED TITLE</div><div class="ce-selected-head"><div class="ce-selected-cover"><img src="${imageURL(id)}" alt="" onerror="this.hidden=true"></div><div><div class="ce-selected-name">${escapeHTML(desc(id))}</div><div class="ce-selected-rank">#${rank} · ${escapeHTML(names[id]||id)}</div></div></div><p class="ce-muted">選択資格：複数選んでOK。AでのElite/NextとBでのReliable/Upsideは別途設定できます。</p><div class="ce-details-grid">${'ABCD'.split('').map(g=>`<label class="ce-check"><input type="checkbox" data-member="${g}" ${groups(id).includes(g)?'checked':''}>${g}</label>`).join('')}</div><div class="ce-selected-options"><label class="ce-control"><span>A · ROLE</span><select data-role="A" ${r.A==='none'?'disabled':''}><option value="elite"${r.A==='elite'?' selected':''}>Elite</option><option value="next"${r.A==='next'?' selected':''}>Next Tier</option></select></label><label class="ce-control"><span>B · ROLE</span><select data-role="B" ${r.B==='none'?'disabled':''}><option value="reliable"${r.B==='reliable'?' selected':''}>Reliable</option><option value="upside"${r.B==='upside'?' selected':''}>Upside / Uncertain</option></select></label></div><div class="ce-rank-tools"><label class="ce-control"><span>EXPECTED RANK</span><input type="number" id="ceRankTarget" min="1" max="${ids.length}" value="${rank}"></label><button type="button" data-inspector="rank">MOVE TO RANK</button><button type="button" data-inspector="up" ${rank===1?'disabled':''}>▲</button><button type="button" data-inspector="down" ${rank===ids.length?'disabled':''}>▼</button></div><label class="ce-control"><span>PERSONAL NOTE · optional</span><textarea class="ce-note" id="ceNote" maxlength="400" rows="2" placeholder="期待値・不安要素・ダークホース等">${escapeHTML(notes[id]||'')}</textarea></label><div class="ce-rank-tools"><button type="button" data-inspector="unsort">MOVE TO UNSORTED</button></div>`}
function mirror(){by('ceEcho').innerHTML='ABCD'.split('').map(g=>{const member=ranking.filter(id=>groups(id).includes(g));return `<div class="ce-echo-group"><h5>${g} <span>${member.length} titles</span></h5>${member.map(id=>`<div class="ce-echo-entry" data-mirror="${id}" role="button" tabindex="0" title="${escapeHTML(names[id]||id)}"><img loading="lazy" src="${imageURL(id)}" alt="" onerror="this.hidden=true"><span>${escapeHTML(desc(id))}${groups(id).length>1?' · '+groups(id):''}</span></div>`).join('')}</div>`}).join('')}
const opts=(field,vals,current,id)=>`<label class="ce-control"><span>${field}</span><select data-row-id="${escapeHTML(id)}" data-field="${field}">${vals.map(([v,t])=>`<option value="${v}" ${current===v?'selected':''}>${t}</option>`).join('')}</select></label>`;
function detailed(q){by('ceList').innerHTML=ranking.filter(id=>!q||searchMatch(id,q)).map(id=>{const r=rows[id];return `<div class="ce-row"><div class="ce-row-title" data-select="${id}" role="button" tabindex="0">${escapeHTML(desc(id))}<small>${escapeHTML(names[id]||id)}</small></div><div class="ce-rank-col"><span class="ce-mini">RANK</span><div style="font:700 17px 'Barlow Condensed',sans-serif">#${ranking.indexOf(id)+1}</div></div>${opts('A',[['none','—'],['elite','Elite'],['next','Next']],r.A,id)}${opts('B',[['none','—'],['reliable','Reliable'],['upside','Upside']],r.B,id)}${'CD'.split('').map(g=>`<label class="ce-control"><span>${g}</span><input type="checkbox" data-row-id="${id}" data-field="${g}" ${r[g]?'checked':''}></label>`).join('')}</div>`}).join('')||'<p class="ce-muted">該当作品はありません。</p>'}
function render(){by('ceActiveState').textContent=(active.isLocal?'LOCAL ACTIVE · このブラウザだけ':'PUBLISHED DEFAULT · GitHub 配布版')+' · '+active.revision+' ／ 編集中の作業コピーは未適用です。';const q=by('ceSearch').value.trim().toLocaleLowerCase();by('ceVisual').hidden=mode!=='visual';by('ceListView').hidden=mode!=='list';by('ceShowVisual').classList.toggle('active',mode==='visual');by('ceShowList').classList.toggle('active',mode==='list');rankingCards(q);board(q);selectedInspector();if(by('ceEchoDetail').open)mirror();detailed(q);updateStats()}
function setMembers(id,g){if(g!=='UNSORTED'&&(!g||[...g].some(x=>!'ABCD'.includes(x))||new Set(g).size!==g.length))return;const target=g==='UNSORTED'?'':g;apply(()=>{const r=rows[id];r.A=target.includes('A')?(r.A==='none'?(ranking.indexOf(id)<3?'elite':'next'):r.A):'none';r.B=target.includes('B')?(r.B==='none'?'upside':r.B):'none';r.C=target.includes('C');r.D=target.includes('D')},`${desc(id)} → ${g==='UNSORTED'?'UNSORTED':g.split('').join(' / ')} に配置`)}
function setRank(id,target){if(!idSet.has(id)||!Number.isInteger(target)||target<1||target>ids.length)return;const before=ranking.indexOf(id);if(before===target-1)return;apply(()=>{ranking.splice(before,1);ranking.splice(target-1,0,id)},`${desc(id)} → 期待順位 #${target}`)}
function history(isUndo){clearTimeout(saveTimer);const source=isUndo?undoStack:redoStack,dest=isUndo?redoStack:undoStack;if(!source.length)return;dest.push(snapshot());restore(source.pop());persist();render();report(isUndo?'1操作戻しました。':'1操作やり直しました。')}
// Board and ranking tiles work with mouse drag; mobile has tap→place and numeric rank controls.
root.addEventListener('click',e=>{const tile=e.target.closest('[data-card]');if(tile){choose(tile.dataset.card);return}const place=e.target.closest('[data-place]');if(place){setMembers(selected,place.dataset.place);return}const mirrorTile=e.target.closest('[data-mirror]');if(mirrorTile){choose(mirrorTile.dataset.mirror);return}const select=e.target.closest('[data-select]');if(select){mode='visual';choose(select.dataset.select);return}const action=e.target.closest('[data-inspector]');if(!action)return;const cmd=action.dataset.inspector,n=ranking.indexOf(selected)+1;if(cmd==='up')setRank(selected,n-1);if(cmd==='down')setRank(selected,n+1);if(cmd==='rank')setRank(selected,Number(by('ceRankTarget').value));if(cmd==='unsort')setMembers(selected,'UNSORTED')});
root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const el=e.target.closest('[data-card],[data-mirror],[data-select]');if(el){e.preventDefault();el.click()}}});
root.addEventListener('change',e=>{const el=e.target;if(el.dataset.member){const g=el.dataset.member,id=selected;apply(()=>{if(g==='A')rows[id].A=el.checked?(rows[id].A==='none'?'next':rows[id].A):'none';if(g==='B')rows[id].B=el.checked?(rows[id].B==='none'?'upside':rows[id].B):'none';if(g==='C'||g==='D')rows[id][g]=el.checked});return}
 if(el.dataset.role){const g=el.dataset.role;apply(()=>{rows[selected][g]=el.value});return}
 const id=el.dataset.rowId,g=el.dataset.field;if(id&&idSet.has(id)&&'ABCD'.includes(g)){apply(()=>{rows[id][g]=g==='C'||g==='D'?!!el.checked:el.value});return}
 if(el.id==='ceNote'){const id=selected,value=el.value.trim().slice(0,400);apply(()=>{if(value)notes[id]=value;else delete notes[id]});return}
});
root.addEventListener('dragstart',e=>{const tile=e.target.closest('[data-card]');if(!tile)return;dragged=tile.dataset.card;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragged);tile.classList.add('dragging')});
root.addEventListener('dragend',()=>{dragged='';root.querySelectorAll('.ce-lane.over').forEach(x=>x.classList.remove('over'));root.querySelectorAll('.ce-card.dragging').forEach(x=>x.classList.remove('dragging'))});
root.addEventListener('dragover',e=>{const lane=e.target.closest('[data-lane]'),rankCard=e.target.closest('#ceRankList [data-card]');if(!lane&&!rankCard)return;e.preventDefault();e.dataTransfer.dropEffect='move';if(lane){root.querySelectorAll('.ce-lane.over').forEach(x=>x.classList.remove('over'));lane.classList.add('over')}});
root.addEventListener('drop',e=>{const dest=e.target.closest('[data-lane]'),rank=e.target.closest('#ceRankList [data-card]');if(!dest&&!rank)return;e.preventDefault();const id=dragged||e.dataTransfer.getData('text/plain');if(!idSet.has(id))return;selected=id;if(dest)setMembers(id,dest.dataset.lane);else if(rank&&rank.dataset.card!==id){const a=ranking.indexOf(id),b=ranking.indexOf(rank.dataset.card);setRank(id,a<b?b:b+1)}dragged='';root.querySelectorAll('.ce-lane.over').forEach(x=>x.classList.remove('over'))});
by('ceSearch').addEventListener('input',render);
by('ceShowVisual').addEventListener('click',()=>{mode='visual';render()});by('ceShowList').addEventListener('click',()=>{mode='list';render()});by('ceEchoDetail').addEventListener('toggle',()=>{if(by('ceEchoDetail').open)mirror()});
by('ceUndo').addEventListener('click',()=>history(true));by('ceRedo').addEventListener('click',()=>history(false));
by('ceSave').addEventListener('click',()=>{clearTimeout(saveTimer);persist();report('ワーキングコピーをローカルに保存しました。公式分類には反映されません。')});
by('ceExport').addEventListener('click',()=>{try{const payload=envelope();const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`SOW-${season}-Preseason-Visual-Working.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);report('期待順位・分類・メモをJSONに書き出しました。'+(payload.warnings.length?' 注意: '+payload.warnings.join(' / '):''))}catch(e){report('書き出し失敗: '+e.message,true)}});
by('ceImport').addEventListener('change',async e=>{const el=e.target,file=el.files?.[0];if(!file)return;try{if(file.size>250000)throw Error('250KB超のJSONは読み込めません');const state=decode(JSON.parse(await file.text()));if(!confirm('作業中の順位・分類をこのJSONで置き換えますか？'))return;apply(()=>{rows=state.rows;ranking=state.ranking;notes=state.notes;selected=ranking[0]},'分類JSONを読み込みました。My Seasonは変更しません。')}catch(err){report('読み込み失敗: '+err.message,true)}finally{el.value=''}});
by('ceReset').addEventListener('click',()=>{if(!confirm('作品分類と期待順位を現在有効な設定に戻しますか？ Undoで復元可能です。'))return;apply(()=>{rows=clone(initialById);ranking=active.ranking.slice();notes=clone(active.notes||{});selected=ranking[0]},'初期候補に戻しました。My Teamは変更していません。')});
by('ceUnsortAll').addEventListener('click',()=>{if(!confirm('すべての作品をUNSORTEDに移しますか？期待順位は保持します。Undo可能です。'))return;apply(()=>{for(const id of ids)rows[id]={id,A:'none',B:'none',C:false,D:false}},'全作品をUNSORTEDに移しました。')});
by('ceAutoSuggest').addEventListener('click',()=>{const a=Number(by('ceCutA').value),b=Number(by('ceCutB').value),c=Number(by('ceCutC').value),overlap=Number(by('ceCutOverlap').value);if(![a,b,c,overlap].every(Number.isInteger)||a<1||b<=a||c<=b||c>=ids.length||overlap<0||overlap>3||overlap*2>=Math.min(b-a,c-b,ids.length-c)){report('A < B < C < 作品数となる境界と適切な重複幅（0–3）を指定してください。',true);return}
 if(!confirm(`順位 #1–${a}: A / #${a+1}–${b}: B / #${b+1}–${c}: C / #${c+1}–${ids.length}: D。境界の両側${overlap}作品に重複資格を付与します。\n\n現在の分類を置き換えますか？（Undo可能）`))return;
 apply(()=>{ranking.forEach((id,i)=>{const r=i+1;let g=r<=a?'A':r<=b?'B':r<=c?'C':'D';if(overlap){if(r>a-overlap&&r<=a+overlap)g='AB';else if(r>b-overlap&&r<=b+overlap)g='BC';else if(r>c-overlap&&r<=c+overlap)g='CD'}rows[id]={id,A:g.includes('A')?(r<=3?'elite':'next'):'none',B:g.includes('B')?(r<=a+Math.ceil((b-a)/2)?'reliable':'upside'):'none',C:g.includes('C'),D:g.includes('D')}})},'期待順位から仮分類を作りました。作品ごとに自由に調整できます。')});
by('ceApply').addEventListener('click',()=>{
 try{
  clearTimeout(saveTimer);persist();
  const proposed=bridge.fromDraft(envelope());
  const existingLock=JSON.parse(localStorage.getItem('offbeat-sow-fantasy-r28-lock-2026fall')||'null');
  if(existingLock?.groupRevision===active.revision)throw Error('編成がLOCAL LOCK中です。先にUNLOCK TEST DRAFTを押してください。');
  const changes=ids.filter(id=>JSON.stringify(rows[id])!==JSON.stringify(active.rows[id])).length;
  if(proposed.revision===active.revision){report('この分類はすでにMy Seasonに適用済みです。');return;}
  if(!confirm('2026 FALLの分類 '+changes+'作品分をこのブラウザのMy Seasonに反映しますか？\n\n編成候補・役割得点・24のTESTチームが新分類で再計算されます。以前の編成に不適格な枠があれば保存したうえで調整されます。\n\nGitHub上の全員には反映されません。'))return;
  bridge.activate(proposed);location.reload();
 }catch(e){report('適用できません: '+e.message,true)}
});
by('ceUsePublished').addEventListener('click',()=>{
 try{
  if(!active.isLocal){report('現在、GitHub配布版の分類が有効です。');return;}
  const existingLock=JSON.parse(localStorage.getItem('offbeat-sow-fantasy-r28-lock-2026fall')||'null');
  if(existingLock?.groupRevision===active.revision)throw Error('編成がLOCAL LOCK中です。先にUNLOCK TEST DRAFTを押してください。');
  if(!confirm('このブラウザの適用済み分類を解除し、GitHub配布版へ戻しますか？\n作業コピーは残ります。'))return;
  bridge.restorePublished();location.reload();
 }catch(e){report('戻せません: '+e.message,true)}
});
by('ceReleaseExport').addEventListener('click',()=>{
 try{
  const release=bridge.fromDraft(envelope());
  const blob=new Blob([JSON.stringify(release,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='SOW-'+season+'-Classification-Release-'+release.revision+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  report('配布用の分類JSONを書き出しました。サイト全体への公開にはGitHubへの更新が必要です。');
 }catch(e){report('書き出し失敗: '+e.message,true)}
});
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');const old=JSON.parse(localStorage.getItem(OLD_KEY)||'null');if(saved){const s=decode(saved);rows=s.rows;ranking=s.ranking;notes=s.notes;report('保存されているVisual Boardの作業内容を復元しました。')}else if(old){const s=decode(old);rows=s.rows;ranking=s.ranking;notes=s.notes;report('以前のR2.9リスト編集を引き継ぎました。期待順位は初期配置です。');persist()}}catch(e){report('保存データは利用できず、仮分類で開始しました: '+e.message,true)}
render();
})();
