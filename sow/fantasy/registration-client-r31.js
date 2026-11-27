/* S.O.W. Fantasy R3.3.3 — server-owned registration and scoped local practice. */
(() => {
 'use strict';
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
   const officialState=!known?'Registration status unavailable':!official?'NOT YET SCHEDULED':finalized()?'REGISTRATION CLOSED · TEAMS LOCKED':locked?'REGISTRATION CLOSED':paused?'REGISTRATION PAUSED':Date.parse(season.opens_at)>now()?'REGISTRATION OPENS SOON':'REGISTRATION OPEN';
   const officialAdvice=!known?'Unable to check the registration period. Refresh the page before making changes.':!official?'The official registration period has not been set.'+(test?' Reset the registration test before setting official dates.':''):finalized()?'The official deadline has passed. Team lineups cannot be changed.':locked?'The official deadline has passed. Team updates are closed; automatic confirmations are being processed.':paused?'New submissions are paused. The closing time still applies.':'You can change the registration dates until the closing time.';
   const remaining=()=>{const m=Math.max(0,Math.ceil((Date.parse(season.closes_at)-now())/60000));return `${Math.floor(m/1440)}d ${Math.floor(m%1440/60)}h ${m%60}m`;};
   function facts(id,rows){const box=$(id);box.replaceChildren();box.hidden=!rows.length;for(const [k,v] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;box.append(dt,dd);}}
   const dates=()=>[['Registration opens',date(season.opens_at)],['Registration closes',date(season.closes_at)],...(!locked?[['Time until closing',remaining()]]:[])];
   $('sowAdminState').textContent=officialState;$('sowAdminState').dataset.state=official&&locked?'closed':official&&open()?'open':'neutral';$('adminAdvice').textContent=officialAdvice;
   facts('adminFacts',known&&official?dates():known?[['Registration opens','Not set'],['Registration closes','Not set']]:[]);
   $('editWindow').hidden=!known||locked||test;$('editWindow').disabled=!canAdmin;$('editWindow').textContent=official?'CHANGE REGISTRATION PERIOD':'SET REGISTRATION PERIOD';
   if(!known||locked||test){$('windowEditor').hidden=true;$('adminReview').hidden=true;pendingWindow=null;}
   $('setWindow').disabled=!canAdmin||locked||test;$('applyWindow').disabled=$('setWindow').disabled||!pendingWindow;
   for(const b of document.querySelectorAll('[data-sow-admin]')){const applicable=known&&armed&&!locked&&(b.dataset.scope==='test'?test:official);b.hidden=!applicable||(b.dataset.sowAdmin==='closed'?paused:!paused);b.disabled=!canAdmin||!applicable;}
   $('testWindowControls').hidden=bridge.season!=='2026-fall';if(test&&known&&!$('testWindowControls').dataset.wasTest)$('testWindowControls').open=true;if(test&&known)$('testWindowControls').dataset.wasTest='1';else delete $('testWindowControls').dataset.wasTest;
   $('startTestWindow').hidden=test||official;$('startTestWindow').disabled=!canAdmin||test||armed||locked;
   $('testDuration').hidden=test||official;$('resetTestWindow').hidden=!test;$('resetTestWindow').disabled=!canAdmin||!test;
   $('testHeadline').textContent=!known?'Test status unavailable':!test?'No test running':finalized()?'TEST COMPLETED':locked?'TEST ENDED · Processing confirmations':paused?'TEST PAUSED':'TEST RUNNING';
   $('testWindowState').textContent=!known?'Check server status first.':official?'An official registration period is set. Testing is unavailable.':!test?'Run a temporary registration test without setting an official deadline.':locked?'Reset the test to allow another test. Saved teams are kept. Teams automatically confirmed during the test return to draft; manually confirmed teams stay confirmed.':'Test registration uses saved team entries. Resetting ends the test, keeps saved teams and reverses automatic test confirmations. Manually confirmed teams stay confirmed.';
   facts('testFacts',known&&test?dates():[]);
   $('adminZone').textContent='Time zone: '+Intl.DateTimeFormat().resolvedOptions().timeZone;
   $('technicalClock').textContent=known?'Server time: '+date(now()):'Server time unavailable';
   $('entryTotal').textContent=known&&adminData?adminData.total:'—';$('entryConfirmed').textContent=known&&adminData?adminData.confirmed:'—';$('entryDraft').textContent=known&&adminData?adminData.total-adminData.confirmed:'—';$('entryDraftLabel').textContent=official&&finalized()?'Unconfirmed teams':'Draft teams';
   $('entryCountNote').textContent=test?'Includes teams saved or confirmed during the test.':'Counts actual saved team entries, not the 23 simulated league teams.';
   $('adminResult').textContent=adminNoticeScope==='official'?adminNotice:'';$('testResult').textContent=adminNoticeScope==='test'?adminNotice:'';
   if(known){$('onlineDeadline').textContent=test?`TEST REGISTRATION · ${locked?'ENDED':paused?'PAUSED':open()?'OPEN':'NOT OPEN'} · Test closes ${date(season.closes_at)}`:officialState+(official?` · Opens ${date(season.opens_at)} · Closes ${date(season.closes_at)}`:'');}else $('onlineDeadline').textContent='Registration status unavailable.';
   const msg=!signed?'Googleアカウントでサインインできます。':!ready?'アカウント情報を確認中。':!season?'シーズン未登録。':!matching()?'公開分類とサーバー分類を確認してください。':deadlineLocked()?confirmed()?'締切済み・正式参加。':entry?.auto_confirm&&!finalized()?'締切済み・自動確定処理待ち。':'締切済み・未確定の編成は不参加。':confirmed()?'正式参加を確定済み。受付中ならREOPEN ENTRYで再編集できます。':!open()?'登録受付期間外。サーバー送信はできません。':entry?'サーバー保存済み。編集後はSAVE DRAFTで更新してください。':'受付中。SAVE DRAFTまたはFINAL CONFIRMで登録してください。';
   $('onlineStatus').textContent=notice||msg; $('onlineStatus').classList.toggle('is-error',error);
 }
 function snapshot(){
   const box=$('onlineSnapshot');box.replaceChildren();box.hidden=!entry;
   if(!entry)return;
   for(const line of [`SERVER ENTRY · ${confirmed()?'CONFIRMED':finalized()?'NOT ENTERED':'SAVED DRAFT'}`,`${entry.team_name} · CAPTAIN ${entry.captain}`, ...[...'ABCD'].map(g=>`${g}: ${bridge.teamLabel(entry.picks?.[g]||'')}`),`Last saved: ${date(entry.updated_at)} · Auto confirm ${entry.auto_confirm?'ON':'OFF'}`]){const p=document.createElement('p');p.textContent=line;box.appendChild(p);}
 }
 async function count(){try{const r=await api.rpc('sow_entry_counts',{p_season_id:bridge.season});if(r.error)throw r.error;$('onlineLiveCount').textContent=`REAL ONLINE ENTRIES · ${r.data.total} SAVED TEAMS / ${r.data.confirmed} CONFIRMED TEAMS · separate from 23 TEST teams`;}catch(_){$('onlineLiveCount').textContent='REAL ONLINE ENTRIES · Count unavailable';}}
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
   if(confirm&&!window.confirm('正式参加を確定しますか？ 締切前なら受付中にREOPEN ENTRYで再編集できます。'))return;
   const auto=$('autoConfirm').checked;
   await operation(async(e,u)=>{
     await rpc('sow_save_entry',{p_season_id:bridge.season,p_roster:{name:t.name,picks:t.picks,backups:t.backups,captain:t.captain,groupRevision:bridge.groupRevision(),autoConfirm:auto,ownerId:u},p_confirm:confirm});
     if(current(e,u))await refresh(e,true);
   },confirm?'正式参加を確定しました。':'サーバーに下書き保存しました。');
 }
 $('accountJump').onclick=()=>{$('onlineEntry').open=true;$('onlineEntry').scrollIntoView({block:'start',behavior:'smooth'});};
 $('autoConfirm').onchange=()=>say('自動確定の設定を変更しました。SAVE DRAFTでサーバーに保存してください。');
 $('onlineSave').onclick=()=>submit(false);$('onlineConfirm').onclick=()=>submit(true);
 $('onlineLoad').onclick=()=>{if(!entry||!matching())return;if(!window.confirm('保存済み編成を再読み込みしますか？ 未保存の変更は失われます。'))return;try{displaySaved();$('autoConfirm').checked=entry.auto_confirm;say('サーバー編成を読み込みました。');}catch(err){say(err.message,true);}};
 $('reopenEntry').onclick=()=>{if(!open()||!confirmed()||!window.confirm('確定を取り消し、下書きに戻しますか？'))return;void operation(async(e,u)=>{await rpc('sow_reopen_entry',{p_season_id:bridge.season});if(current(e,u))await refresh(e,true);},'下書きに戻しました。');};
 $('saveNickname').onclick=()=>{const name=$('nickname').value.trim();if(name.includes('@')){say('メールアドレスではなくNicknameを入力してください。',true);return;}void operation(async(e,u)=>{const p=await rpc('sow_profile',{p_nickname:name});if(current(e,u)){profile=p;$('nickname').value=p.nickname||'';}},'Nicknameを保存しました。');};
 async function adminOperation(name,args,success,scope='official'){
   if(!admin||busy||!ready)return;adminNoticeScope=scope;adminNotice='Applying…';
   await operation(async(e,u)=>{await rpc(name,args);if(current(e,u))await refresh(e,false);},success);
   adminNotice=!ready?'Unable to verify server status. Refresh before continuing.':error?notice:success;controls();
 }
 $('sowAdminRefresh').onclick=()=>{notice='';error=false;adminNotice='';void refresh(epoch,false);};
 for(const b of document.querySelectorAll('[data-sow-admin]'))b.onclick=()=>{
   if(b.disabled)return;const action=b.dataset.sowAdmin;
   if(!window.confirm(action==='resume'?'Resume submissions with the same deadline?':'Pause submissions? The deadline and automatic finalization will still proceed.'))return;
   void adminOperation('sow_commissioner_change',{p_season_id:bridge.season,p_action:action},action==='resume'?'Registration resumed.':'Registration paused; deadline unchanged.',b.dataset.scope);
 };
 $('startTestWindow').onclick=()=>{
   const m=Number($('testMinutes').value);if($('startTestWindow').disabled)return;
   if(!Number.isInteger(m)||m<1||m>60){adminNoticeScope='test';adminNotice='Enter a whole number from 1 to 60 minutes.';controls();return;}
   if(!window.confirm(`Start a ${m}-minute development test? No official schedule will be created.`))return;
   void adminOperation('sow_start_test_r332',{p_season_id:bridge.season,p_minutes:m},'Test started. No official dates were set.','test');
 };
 $('resetTestWindow').onclick=()=>{
   if($('resetTestWindow').disabled||!window.confirm('Reset test? Automatically confirmed test entries return to draft. Manual confirmations remain.'))return;
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
