/* S.O.W. Fantasy R3.3.5 — server-owned registration and scoped local practice. */
(() => {
 'use strict';
 const confirmLocalized=s=>window.confirm(window.SOWR34?.t(s)||s);
 const $=id=>document.getElementById(id), bridge=window.SOWFantasyOnlineBridgeR31, cfg=window.SOWFantasyOnlineConfigR31||{};
 if(!bridge||!$('onlineStatus'))return;
 let api=null,user=null,season=null,entry=null,profile=null,admin=false,busy=false,ready=false,epoch=0,loaded=false,deadlineRefresh=0,authRequest=0;
 let notice='',error=false, pendingWindow=null, adminData=null, clockOffset=0, adminNotice='', adminNoticeScope='official';
 const roster=e=>({name:e.team_name,picks:e.picks,backups:e.backups,captain:e.captain});
 const now=()=>Date.now()+clockOffset, expired=()=>!!season&&now()>=Date.parse(season.closes_at), finalized=()=>!!season?.finalized_at;
 const deadlineLocked=()=>finalized()||!!season?.deadline_armed&&expired();
 const open=()=>ready&&!!season&&season.deadline_armed&&season.status==='open'&&!finalized()&&Date.parse(season.opens_at)<=now()&&!expired();
 const matching=()=>!!season&&!bridge.isLocalClassification()&&season.classification_revision===bridge.groupRevision();
 const confirmed=()=>entry?.status==='confirmed';
 const current=(e,u)=>e===epoch&&user?.id===u;
 function say(s,err=false){notice=s;error=err;controls();}
 function date(v){return v?new Date(v).toLocaleString(undefined,{timeZoneName:'short'}):'—';}
 // Pure presentation rules; server timestamps and flags remain authoritative.
 function visualState(s,t,known){
   if(!known)return 'unavailable';
   if(!s.deadline_armed)return 'neutral';
   const left=Date.parse(s.closes_at)-t;
   if(s.finalized_at||left<=0)return 'closed';
   if(s.status!=='open')return 'paused';
   if(Date.parse(s.opens_at)>t)return 'scheduled';
   return left<=600000?'critical':left<=3600000?'urgent':left<=86400000?'soon':'open';
 }
 function timeParts(ms){
   const seconds=Math.max(0,Math.ceil(ms/1000)), d=Math.floor(seconds/86400),h=Math.floor(seconds%86400/3600),m=Math.floor(seconds%3600/60),sec=seconds%60;
   return d?[['Days',d],['Hours',h],['Min',m]]:h?[['Hours',h],['Min',m],['Sec',sec]]:[['Min',m],['Sec',sec]];
 }
 function renderTimer(id,s,t,active){
   const el=$(id);el.hidden=!active;if(!active)return;
   const before=Date.parse(s.opens_at)>t, parts=timeParts(Date.parse(before?s.opens_at:s.closes_at)-t);
   const label=before?'Registration opens in':s.status!=='open'?'Time until deadline (countdown continues)':'Time left to enter';
   const key=JSON.stringify([label,parts]);if(el.dataset.key===key)return;el.dataset.key=key;
   const caption=document.createElement('div');caption.className='countdown-caption';caption.textContent=label;
   const digits=document.createElement('div');digits.className='countdown-digits';
   for(const [unit,value] of parts){const cell=document.createElement('div'), n=document.createElement('strong'), u=document.createElement('span');n.textContent=String(value).padStart(2,'0');u.textContent=unit;cell.append(n,u);digits.append(cell);}
   el.replaceChildren(caption,digits);
 }
 function controls(){
   const signed=!!user, name=profile?.display_name||'Signed in';
   $('accountTop').textContent=signed?`● ${name}${admin?' · COMMISSIONER':''}`:api?'○ Not signed in':'○ Offline / checking sign-in';
   $('onlineIdentity').textContent=signed?name+(admin?' · COMMISSIONER':''):'';
   $('onlineLogin').hidden=signed; $('onlineSignedIn').hidden=!signed;
   $('sowCommissioner').hidden=!signed||!admin;
   $('onlineSave').disabled=busy||!signed||!open()||!matching()||confirmed()||bridge.isServerTeamView();
   $('onlineConfirm').disabled=$('onlineSave').disabled;
   $('onlineLoad').hidden=!entry; $('onlineLoad').disabled=busy||!matching()||!entry;
   $('onlineRestoreLocal').hidden=true;
   $('reopenEntry').hidden=!confirmed()||!open(); $('reopenEntry').disabled=busy||!matching();
   $('autoConfirm').disabled=busy||!open()||confirmed();
   $('saveNickname').disabled=busy||!ready;
   for(const id of ['onlineGoogle','onlineSendOtp','onlineSignOut','sowAdminRefresh','setWindow'])$(id).disabled=busy||!api;
   const canAdmin=admin&&ready&&!!season&&!busy, locked=deadlineLocked(), armed=!!season?.deadline_armed, test=!!season?.test_mode, official=armed&&!test;
   const known=ready&&!!season, paused=season?.status!=='open';
   const officialState=!known?'Registration status unavailable':!official?'NOT YET SCHEDULED':finalized()?'REGISTRATION CLOSED · TEAMS LOCKED':locked?'REGISTRATION CLOSED':paused?'REGISTRATION PAUSED':Date.parse(season.opens_at)>now()?'REGISTRATION SCHEDULED':'REGISTRATION OPEN';
   const officialAdvice=!known?'Unable to check the registration period. Refresh the page before making changes.':!official?'The official registration period has not been set.'+(test?' Reset the registration test before setting official dates.':''):finalized()?'The official deadline has passed. Team lineups cannot be changed.':locked?'The official deadline has passed. Team updates are closed; automatic confirmations are being processed.':paused?'New submissions are paused. The closing time still applies.':'You can change the registration dates until the closing time.';

   function facts(id,rows){const box=$(id);box.replaceChildren();box.hidden=!rows.length;for(const [k,v] of rows){const group=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k; if(v==='Not set'){dd.textContent=v;}else{const d=new Date(v);if(Number.isFinite(+d)){dd.textContent=d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});const time=document.createElement('small');time.textContent=d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit',timeZoneName:'short'});dd.append(time);}else dd.textContent=v;}group.append(dt,dd);box.append(group);}}
   const dates=()=>[['Opens',season.opens_at],['Deadline',season.closes_at]];
   $('sowAdminState').textContent=officialState;const tone=known?(official?visualState(season,now(),true):'neutral'):'unavailable';$('sowAdminState').dataset.state=tone;$('officialCard').dataset.state=tone;renderTimer('officialCountdown',season,now(),known&&official&&!locked);$('adminAdvice').textContent=officialAdvice;
   facts('adminFacts',known&&official?dates():known?[['Opens','Not set'],['Deadline','Not set']]:[]);
   $('editWindow').hidden=!known||locked||test;$('editWindow').disabled=!canAdmin;$('editWindow').textContent=official?'CHANGE REGISTRATION PERIOD':'SET REGISTRATION PERIOD';
   if(!known||locked||test){$('windowEditor').hidden=true;$('adminReview').hidden=true;pendingWindow=null;}
   $('setWindow').disabled=!canAdmin||locked||test;$('applyWindow').disabled=$('setWindow').disabled||!pendingWindow;
   for(const b of document.querySelectorAll('[data-sow-admin]')){const applicable=known&&armed&&!locked&&(b.dataset.scope==='test'?test:official);b.hidden=!applicable||(b.dataset.sowAdmin==='closed'?paused:!paused);b.disabled=!canAdmin||!applicable;}
   $('testWindowControls').hidden=bridge.season!=='2026-fall';if(test&&known&&!$('testWindowControls').dataset.wasTest)$('testWindowControls').open=true;if(test&&known)$('testWindowControls').dataset.wasTest='1';else delete $('testWindowControls').dataset.wasTest;
   $('startTestWindow').hidden=test||official;$('startTestWindow').disabled=!canAdmin||test||armed||locked;
   $('testDuration').hidden=test||official;$('resetTestWindow').hidden=!test;$('resetTestWindow').disabled=!canAdmin||!test;
   $('testHeadline').textContent=!known?'Test status unavailable':!test?'No test running':finalized()?'TEST COMPLETED':locked?'TEST ENDED · Processing confirmations':paused?'TEST PAUSED':'TEST RUNNING';
   $('testWindowState').textContent=!known?'Check server status first.':official?'An official registration period is set. Testing is unavailable.':!test?'Run a temporary registration test without setting an official deadline.':locked?'Reset the test to allow another test. Saved teams are kept. Teams automatically confirmed during the test return to draft; manually confirmed teams stay confirmed.':'Test registration uses saved team entries. Resetting ends the test, keeps saved teams and reverses automatic test confirmations. Manually confirmed teams stay confirmed.';
   facts('testFacts',known&&test?dates():[]);$('testWindowControls').dataset.state=known&&test?visualState(season,now(),true):'neutral';renderTimer('testCountdown',season,now(),known&&test&&!locked);
   $('adminZone').textContent='Time zone: '+Intl.DateTimeFormat().resolvedOptions().timeZone;
   $('technicalClock').textContent=known?'Server time: '+date(now()):'Server time unavailable';
   $('entryTotal').textContent=known&&adminData?adminData.total:'—';$('entryConfirmed').textContent=known&&adminData?adminData.confirmed:'—';$('entryDraft').textContent=known&&adminData?adminData.total-adminData.confirmed:'—';$('entryDraftLabel').textContent=official&&finalized()?'Not entered':'Draft teams';$('entryConfirmedLabel').textContent=official&&finalized()?'Official participants':'Confirmed teams';$('entryCounts').dataset.final=String(official&&finalized());
   $('entryCountNote').textContent=test?'Includes teams saved or confirmed during the test.':official&&finalized()?'Official participants include manually and automatically confirmed teams.':official&&locked?'Deadline reached. Automatic confirmations are being processed; counts are not final.':'Confirmed teams can be reopened before the deadline while registration is open. Excludes the 23 simulated teams.';
   $('adminResult').textContent=adminNoticeScope==='official'?adminNotice:'';$('testResult').textContent=adminNoticeScope==='test'&&!(test&&locked&&adminNotice.startsWith('Test started.'))?adminNotice:'';
   const publicState=!known?'Status unavailable':!official?'Not accepting entries':finalized()||locked?'Closed':paused?'Paused':Date.parse(season.opens_at)>now()?'Scheduled':'Open';
   const publicTone=!known||!official||locked||paused?'closed':Date.parse(season.opens_at)>now()?'scheduled':'open';
   $('seasonEntrySummary').textContent=publicState;$('seasonEntryCell').dataset.tone=publicTone;
   $('seasonTestNote').hidden=!known||!test;$('seasonTestNote').textContent=known&&test?'Development test · '+(locked?'Ended':paused?'Paused':'Running')+' · Not official registration.':'';
   $('onlineDeadline').dataset.tone=test?'test':publicTone;
   $('onlineDeadline').textContent='Fall 2026 · Official registration: '+publicState+(!known?'':!official?' · No official schedule set.':` · Opens ${date(season.opens_at)} · Closes ${date(season.closes_at)}`)+(known&&test?` | Development test: ${locked?'Ended':paused?'Paused':open()?'Open':'Not open'} · Test deadline ${date(season.closes_at)}`:'');
   const msg=!signed?'Googleアカウントでサインインできます。':!ready?'アカウント情報を確認中。':!season?'シーズン未登録。':!matching()?'公開分類とサーバー分類を確認してください。':test?(
     deadlineLocked()?confirmed()?'テスト終了 · テスト編成は確定済みです。':!finalized()&&entry?.auto_confirm?'テスト終了 · 自動確定処理待ち。':'テスト終了 · 正式参加の判定ではありません。':confirmed()?'テスト編成を確定済み。受付中ならREOPEN ENTRYで再編集できます。':!open()?'テスト受付停止中。':entry?'テスト用下書き保存済み。編集後はSAVE DRAFTで更新できます。':'テスト受付中。正式な参加登録ではありません。'
   ):!official?'正式な参加受付はまだ設定されていません。':deadlineLocked()?confirmed()?'正式受付終了 · 参加確定。':entry?.auto_confirm&&!finalized()?'正式受付終了 · 自動確定処理待ち。':'正式受付終了 · 参加未確定。':confirmed()?'参加意思を確定済み。受付中ならREOPEN ENTRYで再編集できます。':!open()?'正式受付期間外。サーバー送信はできません。':entry?'サーバー保存済み。編集後はSAVE DRAFTで更新してください。':'正式受付中。SAVE DRAFTまたはFINAL CONFIRMで登録してください。';
   if(locked&&!error)notice='';
   $('onlineStatus').textContent=notice||msg; $('onlineStatus').classList.toggle('is-error',error);
 }
 function snapshot(){
   const box=$('onlineSnapshot');box.replaceChildren();box.hidden=!entry;
   if(!entry)return;
   for(const line of [`SERVER ENTRY · ${season?.test_mode?(confirmed()?'TEST CONFIRMED':finalized()?'TEST ENDED · DRAFT':'TEST DRAFT'):confirmed()?'CONFIRMED':finalized()?'NOT ENTERED':'SAVED DRAFT'}`,`${entry.team_name} · CAPTAIN ${entry.captain}`, ...[...'ABCD'].map(g=>`${g}: ${bridge.teamLabel(entry.picks?.[g]||'')}`),`Last saved: ${date(entry.updated_at)} · Auto confirm ${entry.auto_confirm?'ON':'OFF'}`]){const p=document.createElement('p');p.textContent=line;box.appendChild(p);}
 }
 async function count(){try{const r=await api.rpc('sow_entry_counts',{p_season_id:bridge.season});if(r.error)throw r.error;$('onlineLiveCount').textContent=`SERVER-SAVED TEAMS · ${r.data.total} saved / ${r.data.confirmed} confirmed · Excludes 23 simulated opponents`;}catch(_){$('onlineLiveCount').textContent='Server-saved teams · Count unavailable';}}
 function displaySaved(){
   if(!entry||!matching()||entry.group_revision!==bridge.groupRevision())return;
   if(confirmed()||deadlineLocked())bridge.showServerTeam(roster(entry));
   else bridge.editServerTeam(roster(entry));
 }
 async function refresh(e=epoch,hydrate=false){
   if(!api)return;
   const u=user?.id;
   try{
     const s=await api.from('sow_seasons').select('season_id,classification_revision,status,opens_at,closes_at,deadline_armed,finalized_at,test_mode').eq('season_id',bridge.season).maybeSingle();
     if(!current(e,u))return;if(s.error)throw s.error;
     if(!u){season=s.data;ready=true;controls();void count();return;}
     const r=await api.from('sow_entries').select('season_id,user_id,team_name,picks,backups,captain,group_revision,status,updated_at,confirmed_at,auto_confirm').eq('season_id',bridge.season).eq('user_id',u).maybeSingle();
     if(!current(e,u))return;if(r.error)throw r.error;
     if(admin){const x=await api.rpc('sow_admin_state_r332',{p_season_id:bridge.season});if(!current(e,u))return;if(x.error)throw x.error;adminData=x.data;clockOffset=Date.parse(x.data.server_now)-Date.now();Object.assign(s.data,x.data.season);}
     const wasLocked=bridge.isServerTeamView();
     season=s.data;entry=r.data;ready=true;
     if(hydrate||!loaded){$('autoConfirm').checked=entry?entry.auto_confirm:true;displaySaved();loaded=true;}
     else if(confirmed()||deadlineLocked())displaySaved();
     else if(wasLocked){if(entry){displaySaved();$('autoConfirm').checked=entry.auto_confirm;}else bridge.restoreLocalView();}
     snapshot();controls();void count();
   }catch(err){if(current(e,u)){ready=false;say('サーバーの登録状況を取得できません: '+String(err.message||err),true);}}
 }
 async function sessionChanged(session){
   const next=session?.user||null;
   if(user?.id===next?.id&&loaded&&ready)return;
   const e=++epoch; user=next;season=null;entry=null;profile=null;admin=false;busy=false;ready=false;loaded=false;notice='';error=false;deadlineRefresh=0;
   pendingWindow=null;adminData=null;adminNotice='';adminNoticeScope='official';$('windowEditor').hidden=true;clockOffset=0;$('adminReview').hidden=true;$('windowOpen').value='';$('windowClose').value='';
   bridge.switchAccount(user?.id||null);$('nickname').value='';$('onlineEmail').value='';$('autoConfirm').checked=true;snapshot();controls();
   if(!user){await refresh(e);if(e===epoch)loaded=true;return;}
   const u=user.id;
   try{
     const [p,a]=await Promise.all([api.rpc('sow_profile'),api.rpc('sow_is_commissioner')]);
     if(!current(e,u))return;if(p.error)throw p.error;if(a.error)throw a.error;
     profile=p.data;admin=a.data===true;$('nickname').value=profile.nickname||'';controls();
     await refresh(e,true);
     if(current(e,u)&&!profile.nickname){$('onlineEntry').open=true;}
   }catch(err){if(current(e,u))say('アカウント情報を取得できません: '+String(err.message||err),true);}
 }
 async function operation(work,success){
   if(busy||!user||!api)return;const e=epoch,u=user.id;busy=true;notice='';error=false;controls();
   try{await work(e,u);if(current(e,u)&&success&&ready){notice=success;error=false;}}
   catch(err){if(current(e,u)){notice='操作に失敗: '+String(err.message||err);error=true;}}
   finally{if(current(e,u)){busy=false;controls();}}
 }
 async function rpc(name,args){const r=await api.rpc(name,args);if(r.error)throw r.error;return r.data;}
 async function submit(confirm){
   if(!open()||!matching()||confirmed()||bridge.isServerTeamView())return;
   const t=bridge.getTeam();if(!bridge.validateTeam(t)){say('編成に候補外・重複・不足があります。',true);return;}
   if(confirm&&!confirmLocalized(season?.test_mode?'テスト編成を確定しますか？ 正式参加にはなりません。':'正式参加を確定しますか？ 締切前なら受付中にREOPEN ENTRYで再編集できます。'))return;
   const auto=$('autoConfirm').checked;
   await operation(async(e,u)=>{
     await rpc('sow_save_entry',{p_season_id:bridge.season,p_roster:{name:t.name,picks:t.picks,backups:t.backups,captain:t.captain,groupRevision:bridge.groupRevision(),autoConfirm:auto,ownerId:u},p_confirm:confirm});
     if(current(e,u))await refresh(e,true);
   },confirm?(season?.test_mode?'テスト編成を確定しました。':'正式参加を確定しました。'):'サーバーに下書き保存しました。');
 }
 $('accountJump').onclick=()=>{$('onlineEntry').open=true;$('onlineEntry').scrollIntoView({block:'start',behavior:'smooth'});};
 $('autoConfirm').onchange=()=>say('自動確定の設定を変更しました。SAVE DRAFTでサーバーに保存してください。');
 $('onlineSave').onclick=()=>submit(false);$('onlineConfirm').onclick=()=>submit(true);
 $('onlineLoad').onclick=()=>{if(!entry||!matching())return;if(!confirmLocalized('保存済み編成を再読み込みしますか？ 未保存の変更は失われます。'))return;try{displaySaved();$('autoConfirm').checked=entry.auto_confirm;say('サーバー編成を読み込みました。');}catch(err){say(err.message,true);}};
 $('reopenEntry').onclick=()=>{if(!open()||!confirmed()||!confirmLocalized('確定を取り消し、下書きに戻しますか？'))return;void operation(async(e,u)=>{await rpc('sow_reopen_entry',{p_season_id:bridge.season});if(current(e,u))await refresh(e,true);},'下書きに戻しました。');};
 $('saveNickname').onclick=()=>{const name=$('nickname').value.trim();if(name.includes('@')){say('メールアドレスではなくNicknameを入力してください。',true);return;}void operation(async(e,u)=>{const p=await rpc('sow_profile',{p_nickname:name});if(current(e,u)){profile=p;$('nickname').value=p.nickname||'';}},'Nicknameを保存しました。');};
 async function adminOperation(name,args,success,scope='official'){
   if(!admin||busy||!ready)return;adminNoticeScope=scope;adminNotice='Applying…';
   await operation(async(e,u)=>{await rpc(name,args);if(current(e,u))await refresh(e,false);},success);
   adminNotice=!ready?'Unable to verify server status. Refresh before continuing.':error?notice:success;if(ready&&!error)notice='';controls();
 }
 $('sowAdminRefresh').onclick=()=>{notice='';error=false;adminNotice='';void refresh(epoch,false);};
 for(const b of document.querySelectorAll('[data-sow-admin]'))b.onclick=()=>{
   if(b.disabled)return;const action=b.dataset.sowAdmin;
   if(!confirmLocalized(action==='resume'?'Resume submissions with the same deadline?':'Pause submissions? The deadline and automatic finalization will still proceed.'))return;
   void adminOperation('sow_commissioner_change',{p_season_id:bridge.season,p_action:action},action==='resume'?'Registration resumed.':'Registration paused; deadline unchanged.',b.dataset.scope);
 };
 $('startTestWindow').onclick=()=>{
   const m=Number($('testMinutes').value);if($('startTestWindow').disabled)return;
   if(!Number.isInteger(m)||m<1||m>60){adminNoticeScope='test';adminNotice='Enter a whole number from 1 to 60 minutes.';controls();return;}
   if(!confirmLocalized(`Start a ${m}-minute development test? No official schedule will be created.`))return;
   void adminOperation('sow_start_test_r332',{p_season_id:bridge.season,p_minutes:m},'Test started. No official dates were set.','test');
 };
 $('resetTestWindow').onclick=()=>{
   if($('resetTestWindow').disabled||!confirmLocalized('Reset test? Automatically confirmed test entries return to draft. Manual confirmations remain.'))return;
   void adminOperation('sow_test_window',{p_season_id:bridge.season,p_action:'reset'},'Test reset. Saved teams retained.','test');
 };
 function cancelReview(){pendingWindow=null;$('adminReview').hidden=true;$('windowEditor').hidden=false;adminNotice='';controls();}
 $('editWindow').onclick=()=>{if($('editWindow').disabled)return;pendingWindow=null;$('adminReview').hidden=true;$('windowEditor').hidden=false;adminNoticeScope='official';adminNotice='';const local=v=>{const d=new Date(v);return new Date(+d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};$('windowOpen').value=season.deadline_armed?local(season.opens_at):'';$('windowClose').value=season.deadline_armed?local(season.closes_at):'';controls();};
 $('dismissWindow').onclick=()=>{pendingWindow=null;$('windowEditor').hidden=true;$('adminReview').hidden=true;adminNotice='';controls();};
 $('cancelWindow').onclick=cancelReview;
 $('setWindow').onclick=()=>{
   if($('setWindow').disabled)return;adminNoticeScope='official';const a=new Date($('windowOpen').value),b=new Date($('windowClose').value);
   if(!Number.isFinite(+a)||!Number.isFinite(+b)||+b<=+a||+b<=now()){adminNotice='Enter both dates. Closing time must be after opening and in the future.';controls();return;}
   pendingWindow={p_season_id:bridge.season,p_opens_at:a.toISOString(),p_closes_at:b.toISOString()};
   $('adminReviewText').textContent=`Registration will open: ${date(a)}\nRegistration will close: ${date(b)}\n${+a<=now()?'Registration will open immediately when applied.':'Registration will open automatically at the scheduled time.'}`;$('windowEditor').hidden=true;$('adminReview').hidden=false;adminNotice='';controls();
 };
 $('applyWindow').onclick=()=>{if($('applyWindow').disabled||!pendingWindow)return;const args=pendingWindow;pendingWindow=null;$('adminReview').hidden=true;$('windowEditor').hidden=true;void adminOperation('sow_set_window',args,'Official registration period saved.');};
 $('onlineGoogle').onclick=async()=>{if(!api||busy)return;busy=true;controls();try{const r=await api.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});if(r.error)throw r.error;}catch(err){say('Googleログインに失敗: '+err.message,true);}finally{busy=false;controls();}};
 $('onlineSendOtp').onclick=async()=>{if(!api||busy)return;const email=$('onlineEmail').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){say('有効なメールアドレスを入力してください。',true);return;}busy=true;controls();try{const r=await api.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});if(r.error)throw r.error;say('認証メールを送信しました。');}catch(err){say('メール認証に失敗: '+err.message,true);}finally{busy=false;controls();}};
 $('onlineSignOut').onclick=async()=>{if(!api||busy)return;busy=true;controls();try{const r=await api.auth.signOut({scope:'local'});if(r.error)throw r.error;await sessionChanged(null);}catch(err){say('サインアウトに失敗: '+err.message,true);}finally{busy=false;controls();}};
 setInterval(()=>{if(!api)return;controls();if((admin||ready)&&!busy&&now()-deadlineRefresh>15000){deadlineRefresh=now();void refresh(epoch,false);}},1000);
 try{if(location.protocol!=='https:'||new URL(cfg.url).protocol!=='https:'||typeof cfg.publishableKey!=='string')throw Error('Offline');}catch(_){say('オンライン登録は公開HTTPSページで利用できます。');return;}
 const sdk=document.createElement('script');sdk.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
 sdk.onload=()=>{try{api=window.supabase.createClient(cfg.url,cfg.publishableKey);api.auth.onAuthStateChange((event,session)=>{if(user?.id===session?.user?.id&&loaded&&ready)return;const request=++authRequest;if(user?.id!==session?.user?.id){++epoch;ready=false;loaded=false;busy=true;controls();}setTimeout(()=>{if(request===authRequest)void sessionChanged(session);},0);});}catch(err){say('認証初期化に失敗: '+err.message,true);}};
 sdk.onerror=()=>say('認証ライブラリを取得できません。',true);document.head.appendChild(sdk);controls();
})();
