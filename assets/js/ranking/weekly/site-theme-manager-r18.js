/* AnimeB Site Theme Manager R18 — bulk assignments, safe JSON export.
   No credentials or write endpoints; the published file remains untouched. */
(function(){
  'use strict';
  if(window.animebInitSiteThemeManagerR18)return;
  const seasonPattern=/^\d{4}-(winter|spring|summer|fall)$/;
  const weekPattern=/^(?:prelim|00|0[1-9]|1[0-9]|20|mid|final)$/;
  const seasons=['winter','spring','summer','fall'];
  const weeks=['prelim','00',...Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')),'mid','final'];
  const copy=x=>JSON.parse(JSON.stringify(x));
  const labelSeason=id=>id.replace('-', ' · ').replace(/\b(winter|spring|summer|fall)\b/g,x=>x[0].toUpperCase()+x.slice(1));
  const formatPreset=(id,config)=>{
    const state=config.presets[id];
    if(!state)return '[Missing preset] '+id;
    const type=state.theme==='image'?'Image / 画像':(state.theme||'Original');
    let photo='';
    if(state.url){try{photo=decodeURIComponent(new URL(state.url,location.href).pathname.split('/').pop()||'');}catch(_){photo=String(state.url).slice(-32);}}
    const scope=state.imageScope==='full'?'Full':state.imageScope==='hero'?'Hero':'Compact';
    return type+(photo?' · '+photo:'')+' · '+scope;
  };
  const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
  const addOption=(select,value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);};
  window.animebInitSiteThemeManagerR18=function(api){
    if(!api||typeof api.getConfig!=='function'||typeof api.getPresets!=='function')return null;
    const root=el('details','animeb-r18-manager');
    const summary=el('summary','animeb-r18-heading','SITE THEME MANAGER / サイトテーマ管理');
    const intro=el('p','animeb-r18-muted','Published assignments → select saved presets → export one JSON. / 公開中の割当を確認し、複数の変更をまとめて書き出します。');
    const listing=el('div','animeb-r18-list');
    const status=el('p','animeb-r18-status');status.setAttribute('role','status');
    const actions=el('div','animeb-r18-actions');
    const exportButton=el('button','','Export all changes / 変更を一括書出し');exportButton.type='button';
    const discardButton=el('button','','Discard draft / 変更を破棄');discardButton.type='button';
    actions.append(exportButton,discardButton);
    const note=el('p','animeb-r18-muted','Export is NOT publishing. / 書き出しだけでは公開されません。GitHubのsite-themes.jsonに反映後、デプロイが必要です。');
    const addRow=el('div','animeb-r18-add');
    const addYear=el('select');addYear.setAttribute('aria-label','Year / 年');
    const addSeason=el('select');addSeason.setAttribute('aria-label','Season / 季節');
    const addButton=el('button','','Add season / シーズン追加');addButton.type='button';
    for(let y=2020;y<=2040;y++)addOption(addYear,String(y),String(y));
    addYear.value=String(new Date().getFullYear());
    for(const s of seasons)addOption(addSeason,s,s[0].toUpperCase()+s.slice(1));
    addRow.append(addYear,addSeason,addButton);
    root.append(summary,intro,listing,addRow,actions,status,note);
    let pending=new Map(),extraSeasons=new Set(),extraWeeks=new Set(),currentFingerprint=null;
    let lastExported='';
    const fingerprint=cfg=>JSON.stringify(cfg);
    const getBase=()=>api.getConfig();
    function allTargets(cfg){
      const ids=new Set([...Object.keys(cfg.seasons||{}),...Object.keys(cfg.weeks||{}).map(k=>k.split(':')[0]),...extraSeasons]);
      if(ids.size===0 && api.currentSeason && seasonPattern.test(api.currentSeason))ids.add(api.currentSeason);
      return [...ids].filter(x=>seasonPattern.test(x)).sort((a,b)=>{
        const [ay,as]=a.split('-'),[by,bs]=b.split('-');
        return Number(ay)-Number(by)||seasons.indexOf(as)-seasons.indexOf(bs);
      });
    }
    function selectFor(target,currentId,config){
      const select=el('select','animeb-r18-select');
      select.setAttribute('aria-label','Assign theme to '+target);
      addOption(select,'keep','Keep published / 公開中のまま');
      addOption(select,'none','Use parent/base / 割当を解除');
      const local=api.getPresets();
      const validLocal=Array.isArray(local)?local.filter(x=>x&&x.id&&x.state):[];
      const localGroup=document.createElement('optgroup');localGroup.label='MY PRESETS / 保存済み設定';
      validLocal.forEach(p=>{
        const o=document.createElement('option');o.value='local:'+p.id;o.textContent=p.name||p.label||p.id;localGroup.append(o);
      });
      if(localGroup.childNodes.length)select.append(localGroup);
      const publishedGroup=document.createElement('optgroup');publishedGroup.label='PUBLISHED THEMES / 公開済みテーマ';
      Object.keys(config.presets||{}).forEach(id=>{
        const o=document.createElement('option');o.value='published:'+id;
        o.textContent=formatPreset(id,config);publishedGroup.append(o);
      });
      if(publishedGroup.childNodes.length)select.append(publishedGroup);
      select.value=pending.get(target)||'keep';
      if(select.selectedIndex<0){pending.delete(target);select.value='keep';}
      select.addEventListener('change',()=>{
        if(select.value==='keep')pending.delete(target);
        else pending.set(target,select.value);
        lastExported='';updateCounts();
      });
      return select;
    }
    function assignmentRow(target,base){
      const isWeek=target.startsWith('w:');
      const lookup=isWeek?base.weeks:base.seasons;
      const key=target.slice(2);
      const currentId=lookup[key];
      const row=el('div','animeb-r18-row');
      const cap=el('div','animeb-r18-row-head');
      cap.append(el('span','animeb-r18-id',isWeek?'Week '+key.split(':')[1]:'SEASON / シーズン'),
        el('span','animeb-r18-published',currentId?formatPreset(currentId,base):'Base default / 共通設定'));
      const selector=selectFor(target,currentId,base);
      row.append(cap,selector);
      return row;
    }
    function render(){
      const base=getBase();
      if(!api.isReady()){
        listing.replaceChildren(el('p','animeb-r18-muted','Loading site-themes.json / 公開設定を読み込み中…'));
        exportButton.disabled=true;discardButton.disabled=true;return;
      }
      const fp=fingerprint(base);
      if(currentFingerprint!==null&&fp!==currentFingerprint){
        pending.clear();extraWeeks.clear();extraSeasons.clear();lastExported='';
        status.textContent='Published map changed; previous draft cleared. / 読込データ変更のため一時的な下書きをクリアしました。';
      }
      currentFingerprint=fp;
      listing.replaceChildren();
      allTargets(base).forEach(seasonId=>{
        const card=el('section','animeb-r18-card');
        card.append(el('h3','animeb-r18-season-label',labelSeason(seasonId)));
        card.append(assignmentRow('s:'+seasonId,base));
        const weekDetails=el('details','animeb-r18-weeks');
        const keys=new Set([...Object.keys(base.weeks||{}).filter(k=>k.startsWith(seasonId+':')),
          ...[...extraWeeks].filter(k=>k.startsWith(seasonId+':'))]);
        weekDetails.append(el('summary','',`WEEK OVERRIDES / 週別設定 (${keys.size})`));
        const body=el('div','animeb-r18-week-list');
        [...keys].sort((a,b)=>weeks.indexOf(a.split(':')[1])-weeks.indexOf(b.split(':')[1]))
          .forEach(k=>body.append(assignmentRow('w:'+k,base)));
        const weekTools=el('div','animeb-r18-add-week');
        const weekPick=el('select');weekPick.setAttribute('aria-label','Week to add');
        weeks.forEach(w=>addOption(weekPick,w,w==='prelim'?'Prelim':w==='final'?'Final':w==='mid'?'Mid':'Week '+w));
        const weekAdd=el('button','','Add week / 週を追加');weekAdd.type='button';
        weekAdd.addEventListener('click',()=>{
          extraWeeks.add(seasonId+':'+weekPick.value);
          const wasOpen=weekDetails.open;
          render();
          const match=[...root.querySelectorAll('.animeb-r18-card')].find(x=>x.querySelector('h3')?.textContent===labelSeason(seasonId));
          if(match)match.querySelector('.animeb-r18-weeks').open=wasOpen||true;
        });
        weekTools.append(weekPick,weekAdd);
        body.append(weekTools);weekDetails.append(body);card.append(weekDetails);listing.append(card);
      });
      updateCounts();
    }
    function updateCounts(){
      exportButton.disabled=!api.isReady()||pending.size===0;
      discardButton.disabled=pending.size===0&&extraSeasons.size===0&&extraWeeks.size===0;
      if(!lastExported)status.textContent=`Draft changes / 未公開の変更: ${pending.size} · Published map remains unchanged / 公開中の設定は未変更`;
    }
    addButton.addEventListener('click',()=>{
      const s=addYear.value+'-'+addSeason.value;
      if(!seasonPattern.test(s))return;
      extraSeasons.add(s);render();
    });
    discardButton.addEventListener('click',()=>{
      pending.clear();extraWeeks.clear();extraSeasons.clear();lastExported='';render();
    });
    function newId(config,where,presetId){
      const slug=(where+'-'+presetId).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,115);
      const baseId='theme-r18-'+slug;let candidate=baseId,i=1;
      while(Object.prototype.hasOwnProperty.call(config.presets,candidate))candidate=baseId+'-'+(++i);
      return candidate;
    }
    function buildConfig(){
      const base=getBase();
      const next=copy(base);
      for(const [target,choice] of pending){
        const isWeek=target.startsWith('w:');const id=target.slice(2);
        if(isWeek?!/^\d{4}-(?:winter|spring|summer|fall):(?:prelim|00|0[1-9]|1[0-9]|20|mid|final)$/.test(id):!seasonPattern.test(id))
          throw new Error('Invalid target: '+id);
        const map=isWeek?next.weeks:next.seasons;
        if(choice==='none'){delete map[id];continue;}
        if(choice.startsWith('published:')){
          const presetId=choice.slice(10);
          if(!next.presets[presetId])throw new Error('Published preset not found: '+presetId);
          map[id]=presetId;continue;
        }
        if(choice.startsWith('local:')){
          const presetId=choice.slice(6);
          const preset=api.getPresets().find(p=>p.id===presetId);
          if(!preset||!preset.state)throw new Error('Saved preset missing: '+presetId);
          if(preset.state.source==='local')throw new Error('Local photo cannot be published: '+(preset.name||presetId));
          if(preset.state.theme==='image'&&!api.validateImage(preset.state))
            throw new Error('Image URL is not publishable: '+(preset.name||presetId));
          const targetId=newId(next,id,presetId);
          next.presets[targetId]=copy(preset.state);
          map[id]=targetId;continue;
        }
        throw new Error('Unknown selection: '+choice);
      }
      next.version=1;
      return next;
    }
    exportButton.addEventListener('click',async()=>{
      exportButton.disabled=true;status.textContent='Checking published version / 公開版を確認中…';
      try{
        const base=getBase();
        const remote=await fetch(api.configURL,{cache:'no-store'});
        if(!remote.ok)throw new Error('Could not check current public config (HTTP '+remote.status+'). Export blocked.');
        const latest=await remote.json();
        if(fingerprint(latest)!==fingerprint(base))throw new Error('Published config has changed. Reload the page before exporting / 公開版に変更があります。ページを再読込してください。');
        const result=buildConfig();
        if(pending.size===0)throw new Error('No changes to export');
        const blob=new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json'});
        const objectUrl=URL.createObjectURL(blob);
        const a=el('a');a.href=objectUrl;a.download='site-themes.json';document.body.append(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(objectUrl),15000);
        lastExported=`Exported ${pending.size} assignments. NOT published. / ${pending.size}件を書き出しました。まだサイトには未反映です。`;
        status.textContent=lastExported;
      }catch(err){lastExported='';status.textContent='Export stopped / 書き出し停止: '+(err.message||err);}
      exportButton.disabled=false;
    });
    root.addEventListener('toggle',()=>{if(root.open)render();});
    render();
    return {element:root,render};
  };
})();
