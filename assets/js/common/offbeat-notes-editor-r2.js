/* OFFBEAT Notes Studio R2: direct browser publishing to GitHub Git Data API.
   Owner token exists only in JS memory, never persisted or included in commits.
   Atomic multi-file commit: notes.json + posts-index.json + optional image. */
(() => {
  'use strict';
  const API = 'https://api.github.com/repos/snail-panda/animeb-v1';
  const PUBLIC = 'https://snail-panda.github.io/animeb-v1/';
  const DRAFT = 'offbeat-notes-studio-r2-local-draft';
  const $ = id => document.getElementById(id);
  let token = '';
  let selectedFile = null;
  let localBlobUrl = '';
  let existingImage = null;
  let removeExistingImage = false;
  let currentId = null;
  let currentPublished = null;
  let currentCreatedAt = null;
  let publishedNotes = [];
  let busy = false;
  let autosaveTimer;

  function msg(message, error = false, link) {
    const box = $('message');
    box.replaceChildren(); box.hidden = false;
    box.classList.toggle('error', error);
    box.append(document.createTextNode(message));
    if (link) {
      box.append(document.createTextNode('  '));
      const a = document.createElement('a');
      a.href = link; a.textContent = 'OPEN NOTE ↗';
      a.target = '_blank'; a.rel = 'noopener noreferrer'; box.append(a);
    }
  }
  function setBusy(value) {
    busy = value;
    $('connect').disabled = value;
    $('refresh').disabled = value || !token;
    $('publish').disabled = value || !token;
    $('newNote').disabled = value;
    $('saveDraft').disabled = value;
  }
  const localDate = (d = new Date()) => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const dateDisplay = iso => { const [y,m,d] = iso.split('-').map(Number); return new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric'}).format(new Date(y,m-1,d)); };
  function decode64(s) { const bin=atob(s.replace(/\s/g,'')),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new TextDecoder().decode(bytes); }
  function encode64(bytes) { const chunks=[];for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));return btoa(chunks.join('')); }
  async function api(path, method='GET', body) {
    if (!token) throw Error('Connect a GitHub token before publishing.');
    const response = await fetch(API + path, {
      method,
      headers: {'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...(body ? {'Content-Type':'application/json'} : {})},
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store', credentials: 'omit', referrerPolicy:'no-referrer'
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) {
      const detail = String(data.message||response.statusText).slice(0,300);
      throw Error('GitHub '+response.status+': '+detail);
    }
    return data;
  }
  async function fetchFile(path, commitSha) {
    const file = await api('/contents/' + path + '?ref=' + encodeURIComponent(commitSha));
    if (file.type!=='file' || !file.sha) throw Error('Expected GitHub file missing: '+path);
    let content = file.content;
    if (!content || file.encoding!=='base64') {
      const blob = await api('/git/blobs/'+encodeURIComponent(file.sha));
      if (blob.encoding!=='base64' || !blob.content) throw Error('GitHub blob is not Base64: '+path);
      content = blob.content;
    }
    return JSON.parse(decode64(content));
  }
  async function snapshot() {
    const ref = await api('/git/ref/heads/main');
    const head = ref?.object?.sha;
    if(!/^[a-f0-9]{40}$/.test(head||'')) throw Error('Cannot find main branch head.');
    const [commit,notesData,postData] = await Promise.all([
      api('/git/commits/'+head), fetchFile('notes/notes.json',head), fetchFile('posts-index.json',head)
    ]);
    if(!/^[a-f0-9]{40}$/.test(commit?.tree?.sha||''))throw Error('Cannot read the latest Git tree.');
    if(notesData?.schemaVersion!==1||!Array.isArray(notesData.notes))throw Error('Unsupported notes/notes.json format.');
    if(postData?.schemaVersion!==1||!Array.isArray(postData.posts))throw Error('Unsupported posts-index.json format.');
    return {head,treeSha:commit.tree.sha,notesData,postData};
  }
  function formData() {
    return {
      category:$('category').value,
      label:$('label').value.trim(), title:$('title').value.trim(),
      body:$('body').value.trim(),
      tags:$('tags').value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,25),
      display:$('display').value
    };
  }
  function draftObject() {
    return {...formData(),id:currentId,published:currentPublished,createdAt:currentCreatedAt,
      image:(!removeExistingImage&&existingImage)?existingImage:null,
      imageWasSelected:!!selectedFile};
  }
  function saveDraft(silent=false) {
    try {
      const data = draftObject();
      localStorage.setItem(DRAFT,JSON.stringify(data));
      $('draftStatus').textContent = selectedFile
        ? 'Text saved locally. Re-select the image after a reload.'
        : 'Draft saved on this device only.';
      if(!silent)msg('Draft saved locally on this browser. It is not published or synced to other devices.');
    } catch (error) {
      $('draftStatus').textContent='Local save unavailable.';
      if(!silent)msg('Cannot save a local draft: '+error.message,true);
    }
  }
  function scheduleSave() {
    clearTimeout(autosaveTimer);
    autosaveTimer=setTimeout(()=>saveDraft(true),600);
  }
  function releasePreviewUrl() { if(localBlobUrl){URL.revokeObjectURL(localBlobUrl); localBlobUrl='';} }
  function updateImagePreview() {
    const box=$('imagePreview'),prev=$('previewImage');
    const src = selectedFile ? localBlobUrl : (!removeExistingImage && existingImage?.src ? new URL(existingImage.src, PUBLIC).href : '');
    box.hidden=!src; prev.hidden=!src;
    if(src) {
      $('imageElement').src=src; prev.src=src;
      $('imageInfo').textContent=selectedFile ? `${selectedFile.name} · ${(selectedFile.size/1048576).toFixed(1)} MB` : 'Current published image';
      prev.classList.toggle('wide',$('display').value==='wide');
    } else {
      $('imageElement').removeAttribute('src');prev.removeAttribute('src');
    }
  }
  function renderPreview() {
    const d=formData();
    $('previewTitle').textContent=d.title;
    $('previewTitle').hidden=!d.title;
    $('previewLabel').textContent=(d.label||d.category).toUpperCase()+' · '+(currentPublished?.iso||'NEW NOTE');
    $('previewBody').textContent=d.body||'Your note will appear here…';
    updateImagePreview();
  }
  function fill(d={}) {
    $('category').value = ['anime','language','misc'].includes(d.category)?d.category:'anime';
    $('label').value = d.label||''; $('title').value=d.title||'';
    $('body').value=d.body||''; $('tags').value=(d.tags||[]).join(', ');
    $('display').value = d.display==='wide'||d.image?.display==='wide'?'wide':'small';
    currentId=d.id||null; currentPublished=d.published||null;currentCreatedAt=d.createdAt||null;
    existingImage=d.image||null;removeExistingImage=false;
    releasePreviewUrl();selectedFile=null;$('imageInput').value='';
    $('editMode').textContent=currentId?'EDITING · '+currentId:'NEW NOTE';
    renderPreview();
    if(d.imageWasSelected)$('draftStatus').textContent='Select the image again; image files are not stored in local drafts.';
  }
  function loadLocalDraft(){
    try {const raw=localStorage.getItem(DRAFT);if(raw){fill(JSON.parse(raw));$('draftStatus').textContent='Local draft restored (this device only).';}}
    catch { /* Browsers can deny storage in private mode. */ }
  }
  function confirmReplace(){return !($('body').value.trim()||$('title').value.trim()||selectedFile) || window.confirm('Replace this editor and the saved local draft with another Note?');}
  function renderPublished(){
    const list=$('publishedList');list.replaceChildren();
    if(!publishedNotes.length){const p=document.createElement('p');p.className='hint';p.textContent='No published Notes yet.';list.append(p);return;}
    for(const note of [...publishedNotes].sort((a,b)=>String(b.published?.iso||'').localeCompare(String(a.published?.iso||'')))){
      if(note.status!=='published')continue;
      const row=document.createElement('div');row.className='note-row';
      const wrap=document.createElement('div'), title=document.createElement('strong'),desc=document.createElement('small'),edit=document.createElement('button');
      title.textContent=note.title||note.body.slice(0,75)||'Untitled Note';
      desc.textContent=[String(note.category||'').toUpperCase(),String(note.published?.iso||'')].filter(Boolean).join(' · ');
      edit.type='button';edit.textContent='EDIT';
      edit.addEventListener('click',()=>{if(!confirmReplace())return;fill({...note,display:note.image?.display});saveDraft(true);window.scrollTo({top:0,behavior:'smooth'});});
      wrap.append(title,desc);row.append(wrap,edit);list.append(row);
    }
  }
  async function refresh(){
    if(!token)return;
    setBusy(true);msg('Loading Notes from GitHub…');
    try {const snap=await snapshot();publishedNotes=snap.notesData.notes;renderPublished();msg('Connected. Loaded '+publishedNotes.length+' Notes from GitHub main.');}
    catch(error){msg('Unable to load Notes. '+error.message,true);}
    finally{setBusy(false);}
  }
  async function connect() {
    if(busy)return;
    const value=$('token').value.trim();
    if(!value){msg('Enter your GitHub token.',true);return;}
    token=value;$('token').value='';setBusy(true);msg('Checking GitHub access…');
    try {
      const repo=await api('');
      if(repo?.full_name!=='snail-panda/animeb-v1')throw Error('Repository mismatch.');
      if(repo.permissions && !repo.permissions.push)throw Error('Token lacks write access to this repository.');
      $('authBox').hidden=true;$('logout').hidden=false;
      const snap=await snapshot();publishedNotes=snap.notesData.notes;renderPublished();
      msg('Connected successfully. You can publish Notes directly from this page.');
    }catch(err){token='';$('authBox').hidden=false;$('logout').hidden=true;msg('Connection failed: '+err.message,true);}
    finally{setBusy(false);}
  }
  function generateId(title){
    const slug = String(title||'note').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,38).replace(/-$/,'')||'note';
    const n=new Uint8Array(4);crypto.getRandomValues(n);
    return localDate()+'-'+slug+'-'+[...n].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  async function prepareImage(file){
    if(!file)return null;
    if(file.size>40*1048576)throw Error('Original image exceeds 40 MB. Choose a smaller file.');
    const valid=['image/jpeg','image/png','image/webp'];
    if(valid.includes(file.type)&&file.size<=3*1048576)return {blob:file,ext:file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'};
    const objectUrl=URL.createObjectURL(file);let image;
    try {
      image=await new Promise((resolve,reject)=>{
        const node=new Image();node.onload=()=>resolve(node);node.onerror=()=>reject(Error('This image cannot be decoded by your browser; use JPG or PNG.'));node.src=objectUrl;
      });
      const w=image.naturalWidth,h=image.naturalHeight;
      if(!w||!h)throw Error('Invalid image dimensions.');
      const scale=Math.min(1,1600/Math.max(w,h));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      let output=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.83));
      if(!output)throw Error('The browser could not convert this image.');
      if(output.size>4*1048576)throw Error('Converted image is too large. Try a smaller photo.');
      return {blob:output,ext:'jpg'};
    } finally {URL.revokeObjectURL(objectUrl);}
  }
  async function publish(event){
    event.preventDefault();if(busy)return;
    if(!token){msg('Connect your GitHub token first.',true);return;}
    const data=formData();
    if(!data.body){msg('Write at least one sentence before publishing.',true);$('body').focus();return;}
    if(!['anime','language','misc'].includes(data.category))return msg('Invalid category.',true);
    if(!window.confirm((currentId?'Update the published Note':'Publish this Note')+' on OFFBEAT? This writes to GitHub main.'))return;
    setBusy(true);msg('Preparing your Note. No published files have changed yet…');
    try {
      // Prepare the image before taking a GitHub snapshot; no remote changes yet.
      const media=selectedFile?await prepareImage(selectedFile):null;
      const snap=await snapshot();
      const now=new Date().toISOString();
      const id=currentId||generateId(data.title);
      const index=snap.notesData.notes.findIndex(n=>n.id===id);
      if(currentId&&index<0)throw Error('This Note no longer exists on GitHub. Refresh before editing.');
      if(!currentId&&index>=0)throw Error('Generated Note ID conflict. Try Publish again.');
      const original=index<0?null:snap.notesData.notes[index];
      let image=removeExistingImage?null:(original?.image||existingImage||null);
      let mediaEntry=null;
      if(media){
        const path=`images/notes/${localDate().slice(0,4)}/${id}.${media.ext}`;
        image={src:path,display:data.display,alt:data.title||'Note illustration'};
        mediaEntry={path,blob:media.blob};
      }else if(image){image={...image,display:data.display};}
      const published = original?.published||currentPublished||{iso:localDate()};
      const note={...(original||{}),id,status:'published',category:data.category,label:data.label,
        title:data.title,body:data.body,tags:data.tags,published,
        createdAt:original?.createdAt||currentCreatedAt||now,updatedAt:now};
      if(image)note.image=image;else delete note.image;
      if(index>=0)snap.notesData.notes[index]=note;else snap.notesData.notes.unshift(note);
      const posts=snap.postData.posts;
      const postId='note:'+id;
      const pi=posts.findIndex(p=>p.id===postId);
      const prevPost=pi<0?{}:posts[pi];
      const displayTitle=data.title||data.body.replace(/\s+/g,' ').slice(0,90);
      const post={...prevPost,id:postId,status:'published',type:'note',category:data.category.toUpperCase(),url:'notes/index.html#'+id,
        published:{iso:published.iso,display:dateDisplay(published.iso)},
        title:{display:displayTitle}, excerpt:data.body.slice(0,360),
        tags:[...new Set([data.category,'note',...data.tags])],
        labels:[{text:'Note',className:'tag-label tag-note'}],updatedAt:now};
      if(image)post.image={src:image.src,alt:image.alt};else delete post.image;
      if(pi>=0)posts[pi]=post;else posts.unshift(post);
      snap.postData.updatedAt=now;
      // Do not commit anything until all files and optional photo are assembled.
      const treeEntries=[
        {path:'notes/notes.json',mode:'100644',type:'blob',content:JSON.stringify(snap.notesData,null,2)+'\n'},
        {path:'posts-index.json',mode:'100644',type:'blob',content:JSON.stringify(snap.postData,null,2)+'\n'}
      ];
      if(mediaEntry){
        msg('Uploading the image to GitHub (not visible on the site yet)…');
        const raw=new Uint8Array(await mediaEntry.blob.arrayBuffer());
        const blob=await api('/git/blobs','POST',{content:encode64(raw),encoding:'base64'});
        if(!blob?.sha)throw Error('GitHub image upload did not return a blob SHA.');
        treeEntries.push({path:mediaEntry.path,mode:'100644',type:'blob',sha:blob.sha});
      }
      msg('Saving Notes and the post registry together in a single Git commit…');
      const tree=await api('/git/trees','POST',{base_tree:snap.treeSha,tree:treeEntries});
      if(!tree?.sha)throw Error('GitHub failed to create a tree.');
      const commit=await api('/git/commits','POST',{
        message:(index<0?'Publish':'Update')+' OFFBEAT Note: '+displayTitle.slice(0,70),
        tree:tree.sha,parents:[snap.head]
      });
      if(!commit?.sha)throw Error('GitHub failed to create a commit.');
      try {
        await api('/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});
      }catch(error){
        throw Error('Branch changed while publishing (or permission denied). Nothing from this Note was published. '+error.message+' Refresh the published list and retry.');
      }
      // GitHub main now points to a single commit containing all changes.
      currentId=id; currentPublished=published; currentCreatedAt=note.createdAt;
      existingImage=image;selectedFile=null;releasePreviewUrl();$('imageInput').value='';removeExistingImage=false;
      try{localStorage.removeItem(DRAFT);}catch{}
      $('editMode').textContent='PUBLISHED · '+id;
      $('draftStatus').textContent='Published to GitHub main.';
      renderPreview();
      publishedNotes=snap.notesData.notes;renderPublished();
      msg('Published successfully in one Git commit. GitHub Pages may take a little while to update.',false,PUBLIC+'notes/#'+encodeURIComponent(id));
    } catch(error){
      saveDraft(true);
      msg('Publish stopped. Your text draft is preserved locally. '+error.message,true);
    } finally{setBusy(false);}
  }
  function newNote() {
    if(!confirmReplace())return;
    fill({});saveDraft(true);
    $('body').focus();
  }
  $('connect').addEventListener('click',connect);
  $('token').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();connect();}});
  $('logout').addEventListener('click',()=>{token='';$('logout').hidden=true;$('authBox').hidden=false;$('refresh').disabled=true;$('publish').disabled=true;publishedNotes=[];$('publishedList').textContent='Connect to load your published Notes.';msg('Disconnected. Your Notes draft stays on this device.');});
  $('refresh').addEventListener('click',refresh);
  $('newNote').addEventListener('click',newNote);
  $('saveDraft').addEventListener('click',()=>saveDraft());
  $('noteForm').addEventListener('submit',publish);
  for(const id of ['category','label','title','body','tags','display']){
    $(id).addEventListener('input',()=>{renderPreview();scheduleSave();});
    $(id).addEventListener('change',()=>{renderPreview();scheduleSave();});
  }
  $('imageInput').addEventListener('change',()=>{
    releasePreviewUrl(); selectedFile=$('imageInput').files?.[0]||null;
    if(selectedFile){localBlobUrl=URL.createObjectURL(selectedFile);removeExistingImage=false;}
    renderPreview();scheduleSave();
  });
  $('removeImage').addEventListener('click',()=>{
    releasePreviewUrl();selectedFile=null;removeExistingImage=true;existingImage=null;
    $('imageInput').value='';renderPreview();scheduleSave();
  });
  loadLocalDraft();renderPreview();
})();
