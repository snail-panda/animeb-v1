/* S.O.W. Fantasy — online season entry R3.1.
   Never considers localStorage a submitted entry. Server RPC is the sole write path. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const bridge = window.SOWFantasyOnlineBridgeR31;
  const settings = window.SOWFantasyOnlineConfigR31 || {};
  const statusBox = $('onlineStatus');
  if (!bridge || !statusBox) return;
  const loginBox = $('onlineLogin');
  const signedBox = $('onlineSignedIn');
  const snapshotBox = $('onlineSnapshot');
  const saveButton = $('onlineSave');
  const confirmButton = $('onlineConfirm');
  const loadButton = $('onlineLoad');
  let api = null, user = null, season = null, entry = null, busy = false;

  function message(value, error = false) {
    statusBox.textContent = value;
    statusBox.classList.toggle('is-error', error);
  }
  function validConfig() {
    try {
      const u = new URL(settings.url);
      return u.protocol === 'https:' && !!u.hostname && typeof settings.publishableKey === 'string' && settings.publishableKey.length >= 20;
    } catch (_) { return false; }
  }
  function setBusy(state) {
    busy = state;
    for (const b of [saveButton, confirmButton, loadButton, $('onlineSendOtp'), $('onlineSignOut')]) {
      b.disabled = state;
    }
  }
  function showSnapshot() {
    snapshotBox.replaceChildren();
    if (!entry) { snapshotBox.hidden = true; loadButton.hidden = true; return; }
    snapshotBox.hidden = false;
    const row = (line) => {
      const p = document.createElement('p'); p.textContent = line; snapshotBox.appendChild(p);
    };
    row(`SERVER ENTRY · ${entry.status === 'confirmed' ? 'FINAL CONFIRMED' : 'SAVED DRAFT'}`);
    row(`${entry.team_name} · CAPTAIN ${entry.captain} · ${entry.group_revision}`);
    for (const g of 'ABCD') {
      const id = entry.picks?.[g] || '';
      row(`${g}: ${bridge.teamLabel(id)}`);
    }
    row(`Last saved: ${entry.updated_at ? new Date(entry.updated_at).toLocaleString() : '—'}`);
    loadButton.hidden = false;
  }
  function controls() {
    const active = !!user && !!season;
    const isOpen = active && season.status === 'open' && new Date(season.opens_at).getTime() <= Date.now() && Date.now() < new Date(season.closes_at).getTime();
    const matching = active && !bridge.isLocalClassification() && season.classification_revision === bridge.groupRevision();
    const confirmed = entry?.status === 'confirmed';
    loginBox.hidden = !!user;
    signedBox.hidden = !user;
    $('onlineIdentity').textContent = user ? `SIGNED IN · ${user.email || 'verified account'}` : '';
    saveButton.disabled = busy || !isOpen || !matching || confirmed;
    confirmButton.disabled = busy || !isOpen || !matching || confirmed;
    loadButton.disabled = busy || !entry || bridge.isLocalClassification() || !matching;
    showSnapshot();
    if (!user) { message('メールアドレスで認証してから、受付中のシーズンに編成を登録できます。'); return; }
    if (!season) { message('現在のシーズンはサーバーに登録されていません。大会受付はまだ始まっていません。'); return; }
    if (confirmed) { message('この編成はサーバーで正式確定済みです。変更できません。'); return; }
    if (bridge.isLocalClassification()) { message('ローカル試験分類が有効です。ONLINE ENTRYでは公開分類に戻してから登録してください。'); return; }
    if (!matching) { message('公開済み分類とサーバーの登録用分類が一致しません。管理者が同期するまで送信できません。'); return; }
    if (!isOpen) { message(`現在は登録受付期間外です（状態：${season.status}）。サーバー側で開幕・締切を管理します。`); return; }
    message(entry ? '編成はサーバーに下書き保存済み。締切まで更新できます。FINAL CONFIRMすると変更不可です。' : '受付中。My Teamの内容をサーバーへSAVEできます。ローカルでの保存とは別です。');
  }
  async function loadRemote() {
    if (!api || !user) { season = null; entry = null; controls(); return; }
    try {
      const seasonResult = await api.from('sow_seasons').select('season_id,classification_revision,status,opens_at,closes_at').eq('season_id', bridge.season).maybeSingle();
      if (seasonResult.error) throw seasonResult.error;
      season = seasonResult.data;
      const result = await api.from('sow_entries').select('season_id,user_id,team_name,picks,backups,captain,group_revision,status,updated_at,confirmed_at').eq('season_id', bridge.season).maybeSingle();
      if (result.error) throw result.error;
      entry = result.data;
      controls();
    } catch (err) { message(`サーバーの登録状況を取得できません: ${String(err.message || err)}`, true); }
  }
  async function submit(confirm) {
    if (!user || busy || !season) return;
    // The database validates again; these checks are only explanatory UX.
    if (bridge.isLocalClassification() || bridge.groupRevision() !== season.classification_revision) { controls(); return; }
    const t = bridge.getTeam();
    if (!bridge.validateTeam(t)) { message('編成に候補外・重複・不足があるため、送信できません。', true); return; }
    if (confirm && !window.confirm('この編成をサーバーで最終確定しますか？ 確定後は締切前でも変更できません。')) return;
    setBusy(true);
    let failure = '';
    try {
      const payload = {name:t.name,picks:t.picks,backups:t.backups,captain:t.captain,groupRevision:bridge.groupRevision()};
      const result = await api.rpc('sow_save_entry', {p_season_id:bridge.season,p_roster:payload,p_confirm:confirm});
      if (result.error) throw result.error;
      entry = result.data;
      message(confirm ? 'サーバーで最終確定しました。' : 'サーバーに編成を保存しました。');
      await loadRemote();
    } catch (err) { failure = `送信できませんでした。サーバーには反映されたとみなさないでください: ${String(err.message || err)}`; }
    finally { setBusy(false); controls(); if(failure)message(failure,true); }
  }
  $('onlineSendOtp').onclick = async () => {
    const email = $('onlineEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { message('有効なメールアドレスを入力してください。', true); return; }
    if (!/^https?:$/.test(location.protocol)) { message('メール認証は公開サイトのhttpsページで行ってください。file://では利用できません。', true); return; }
    setBusy(true);
    try {
      const redirect = location.origin + location.pathname;
      const result = await api.auth.signInWithOtp({email,options:{emailRedirectTo:redirect}});
      if (result.error) throw result.error;
      message('認証メールを送信しました。メール内のリンクからこのページへ戻ってください。');
    } catch (err) { message('認証メールを送信できません: ' + String(err.message || err),true); }
    finally { setBusy(false); }
  };
  $('onlineSignOut').onclick = async () => {
    setBusy(true);
    try { const r = await api.auth.signOut(); if (r.error) throw r.error; user = null; entry = null; season = null; }
    catch (e) { message('サインアウトに失敗しました: ' + e.message,true); }
    finally { setBusy(false); controls(); }
  };
  saveButton.onclick = () => submit(false);
  confirmButton.onclick = () => submit(true);
  loadButton.onclick = () => {
    if (!entry || !season || season.classification_revision !== bridge.groupRevision()) return;
    if (!window.confirm('サーバーに保存された編成を、このブラウザのMy Teamに読み込みますか？\n現在のローカル編成は上書きされます。')) return;
    try {
      bridge.loadTeam({name:entry.team_name,picks:entry.picks,backups:entry.backups,captain:entry.captain});
      message('サーバーの編成をローカルMy Teamに読み込みました。');
    } catch (err) { message(err.message,true); }
  };

  if (!validConfig()) {
    message('オンライン登録は準備中です。My Team・24テストチーム・ローカル編成機能はそのまま利用できます。');
    loginBox.hidden = true; signedBox.hidden = true;
    return;
  }
  if (location.protocol === 'file:') {
    message('ローカルファイルではメール認証を使えません。公開サイトのhttpsページで利用してください。'); return;
  }
  const sdk = document.createElement('script');
  sdk.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  sdk.onload = async () => {
    try {
      if (!window.supabase?.createClient) throw new Error('SDK is unavailable');
      api = window.supabase.createClient(settings.url,settings.publishableKey);
      api.auth.onAuthStateChange((_,session) => {
        user = session?.user || null;
        // Run outside the auth callback to avoid the SDK's callback-lock deadlock.
        setTimeout(() => { void loadRemote(); }, 0);
      });
      const result = await api.auth.getSession();
      if (result.error) throw result.error;
      user = result.data.session?.user || null;
      await loadRemote();
    } catch (err) { message('オンライン登録を初期化できません: ' + String(err.message || err),true); }
  };
  sdk.onerror = () => message('認証ライブラリを取得できません。My Seasonのローカル機能は利用できます。',true);
  document.head.appendChild(sdk);
})();
