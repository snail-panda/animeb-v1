/* S.O.W. Fantasy R3.3.1 — server-owned registration and scoped local practice. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id), bridge=window.SOWFantasyOnlineBridgeR31, cfg=window.SOWFantasyOnlineConfigR31||{};
 if(!bridge||!$('onlineStatus'))return;
 let api=null,user=null,season=null,entry=null,profile=null,admin=false,busy=false,ready=false,epoch=0,loaded=false,deadlineRefresh=0,authRequest=0;
 let notice='',error=false;
 const roster=e=>({name:e.team_name,picks:e.picks,backups:e.backups,captain:e.captain});
 const now=()=>Date.now(), expired=()=>!!season&&now()>=Date.parse(season.closes_at), finalized=()=>!!season?.finalized_at;
 const deadlineLocked=()=>finalized()||!!season?.deadline_armed&&expired();
 const open=()=>ready&&!!season&&season.status==='open'&&!finalized()&&Date.parse(season.opens_at)<=now()&&!expired();
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
   for(const b of document.querySelectorAll('[data-sow-admin]'))b.disabled=busy||finalized()||(season?.deadline_armed&&expired());
   $('setWindow').disabled=busy||!ready||finalized()||(season?.deadline_armed&&expired())||!!season?.test_mode;
   for(const b of document.querySelectorAll('[data-sow-admin="open"]'))if(season?.test_mode)b.disabled=true;
   $('testWindowControls').hidden=bridge.season!=='2026-fall';
   $('startTestWindow').disabled=busy||!ready||!season||!!season.test_mode||deadlineLocked();
   $('resetTestWindow').disabled=busy||!ready||!season?.test_mode;
   $('testWindowState').textContent=season?.test_mode?'TEST MODE · reset available after deadline':'Development test only';
   if(season){
     const ms=Date.parse(season.closes_at)-now(), mins=Math.max(0,Math.ceil(ms/60000));
     $('onlineDeadline').textContent=`${season.test_mode?'TEST MODE · ':''}${finalized()?'DEADLINE LOCKED':open()?'REGISTRATION OPEN':season.status==='open'&&expired()?'DEADLINE PASSED':season.status==='open'?'SCHEDULED':'REGISTRATION PAUSED / CLOSED'} · Opens ${date(season.opens_at)} · Deadline ${date(season.closes_at)}${open()?` · ${Math.floor(mins/60)}h ${mins%60}m remaining`:''}`;
     $('sowAdminState').textContent=$('onlineDeadline').textContent;
   }else $('onlineDeadline').textContent='No registration window loaded.';
   const msg=!signed?'Googleアカウントでサインインできます。':!ready?'アカウント情報を確認中。':!season?'シーズン未登録。':!matching()?'公開分類とサーバー分類を確認してください。':deadlineLocked()?confirmed()?'締切済み・正式参加。':entry?.auto_confirm&&!finalized()?'締切済み・自動確定処理待ち。':'締切済み・未確定の編成は不参加。':confirmed()?'正式参加を確定済み。受付中ならREOPEN ENTRYで再編集できます。':!open()?'登録受付期間外。サーバー送信はできません。':entry?'サーバー保存済み。編集後はSAVE DRAFTで更新してください。':'受付中。SAVE DRAFTまたはFINAL CONFIRMで登録してください。';
   $('onlineStatus').textContent=notice||msg; $('onlineStatus').classList.toggle('is-error',error);
 }
 function snapshot(){
   const box=$('onlineSnapshot');box.replaceChildren();box.hidden=!entry;
   if(!entry)return;
   for(const line of [`SERVER ENTRY · ${confirmed()?'CONFIRMED':finalized()?'NOT ENTERED':'SAVED DRAFT'}`,`${entry.team_name} · CAPTAIN ${entry.captain}`, ...[...'ABCD'].map(g=>`${g}: ${bridge.teamLabel(entry.picks?.[g]||'')}`),`Last saved: ${date(entry.updated_at)} · Auto confirm ${entry.auto_confirm?'ON':'OFF'}`]){const p=document.createElement('p');p.textContent=line;box.appendChild(p);}
 }
 async function count(){try{const r=await api.rpc('sow_entry_counts',{p_season_id:bridge.season});if(r.error)throw r.error;$('onlineLiveCount').textContent=`REAL ONLINE ENTRIES · ${r.data.total} SAVED / ${r.data.confirmed} CONFIRMED · separate from 23 TEST teams`;}catch(_){$('onlineLiveCount').textContent='REAL ONLINE ENTRIES · Count unavailable';}}
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
 $('sowAdminRefresh').onclick=()=>{notice='';error=false;void refresh(epoch,false);};
 for(const b of document.querySelectorAll('[data-sow-admin]'))b.onclick=()=>{
   if(!admin)return;const action=b.dataset.sowAdmin,minutes=Number(b.dataset.duration||30);
   if(!window.confirm(action==='open'?'新しい受付期間を設定しますか？':action==='resume'?'現在の締切を維持して受付を再開しますか？':'受付を一時停止しますか？ 設定済み締切は維持されます。'))return;
   void operation(async(e,u)=>{await rpc('sow_commissioner_change',{p_season_id:bridge.season,p_action:action,p_minutes:minutes});if(current(e,u))await refresh(e,false);},'受付状態を更新しました。');
 };
 $('startTestWindow').onclick=()=>{
   if(!admin||bridge.season!=='2026-fall'||!window.confirm('5分間のテスト受付を開始しますか？ 現在の受付日時を置き換えます。'))return;
   void operation(async(e,u)=>{await rpc('sow_test_window',{p_season_id:bridge.season,p_action:'start'});if(current(e,u))await refresh(e,false);},'テスト受付を開始しました。');
 };
 $('resetTestWindow').onclick=()=>{
   if(!admin||!season?.test_mode||!window.confirm('テストを終了して受付停止に戻しますか？ テストで自動確定した編成のみ下書きに戻します。手動確定は維持します。'))return;
   void operation(async(e,u)=>{await rpc('sow_test_window',{p_season_id:bridge.season,p_action:'reset'});if(current(e,u))await refresh(e,false);},'テストをリセットしました。');
 };
 $('setWindow').onclick=()=>{
   if(!admin)return;const a=new Date($('windowOpen').value),b=new Date($('windowClose').value);
   if(!Number.isFinite(+a)||!Number.isFinite(+b)||+b<=+a||+b<=now()){say('有効な開始・締切日時を入力してください。',true);return;}
   if(!window.confirm(`受付開始: ${date(a)}\n締切: ${date(b)}\nこの日時で設定しますか？`))return;
   void operation(async(e,u)=>{await rpc('sow_set_window',{p_season_id:bridge.season,p_opens_at:a.toISOString(),p_closes_at:b.toISOString()});if(current(e,u))await refresh(e,false);},'受付期間を設定しました。');
 };
 $('onlineGoogle').onclick=async()=>{if(!api||busy)return;busy=true;controls();try{const r=await api.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});if(r.error)throw r.error;}catch(err){say('Googleログインに失敗: '+err.message,true);}finally{busy=false;controls();}};
 $('onlineSendOtp').onclick=async()=>{if(!api||busy)return;const email=$('onlineEmail').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){say('有効なメールアドレスを入力してください。',true);return;}busy=true;controls();try{const r=await api.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});if(r.error)throw r.error;say('認証メールを送信しました。');}catch(err){say('メール認証に失敗: '+err.message,true);}finally{busy=false;controls();}};
 $('onlineSignOut').onclick=async()=>{if(!api||busy)return;busy=true;controls();try{const r=await api.auth.signOut({scope:'local'});if(r.error)throw r.error;await sessionChanged(null);}catch(err){say('サインアウトに失敗: '+err.message,true);}finally{busy=false;controls();}};
 setInterval(()=>{if(!api)return;controls();if(ready&&(season?.test_mode||deadlineLocked())&&!busy&&now()-deadlineRefresh>15000){deadlineRefresh=now();notice='';error=false;void refresh(epoch,false);}},1000);
 try{if(location.protocol!=='https:'||new URL(cfg.url).protocol!=='https:'||typeof cfg.publishableKey!=='string')throw Error('Offline');}catch(_){say('オンライン登録は公開HTTPSページで利用できます。');return;}
 const sdk=document.createElement('script');sdk.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
 sdk.onload=()=>{try{api=window.supabase.createClient(cfg.url,cfg.publishableKey);api.auth.onAuthStateChange((event,session)=>{if(user?.id===session?.user?.id&&loaded&&ready)return;const request=++authRequest;if(user?.id!==session?.user?.id){++epoch;ready=false;loaded=false;busy=true;controls();}setTimeout(()=>{if(request===authRequest)void sessionChanged(session);},0);});}catch(err){say('認証初期化に失敗: '+err.message,true);}};
 sdk.onerror=()=>say('認証ライブラリを取得できません。',true);document.head.appendChild(sdk);controls();
})();
