/* S.O.W. Fantasy · Season classification bridge R3.0.
   The bundled preseason snapshot is the published default AFTER this file is deployed.
   Browser activation is never online submission or a site-wide publication. */
(function(global){'use strict';
 const PUBLISHED={"season":"2026-fall","ranking":["kusuriya","jouheki","hotel","seitokai","oukoku","chitose","romelia","choujou","hako","tokyo","kyouran","fx","toaru","kikansha","goblin","zombie","psyren","hyouken","mezametara","vertex","rayearth","shinja","revo","aoki","shiotaiou","kanata","fuyoshi","max","tetsuryo","hitakakusu","saikyou","tanmoshi"],"rows":{"kusuriya":{"id":"kusuriya","A":"elite","B":"none","C":false,"D":false},"jouheki":{"id":"jouheki","A":"elite","B":"none","C":false,"D":false},"seitokai":{"id":"seitokai","A":"elite","B":"reliable","C":false,"D":false},"hotel":{"id":"hotel","A":"next","B":"reliable","C":false,"D":false},"oukoku":{"id":"oukoku","A":"next","B":"reliable","C":false,"D":false},"choujou":{"id":"choujou","A":"next","B":"reliable","C":true,"D":false},"romelia":{"id":"romelia","A":"none","B":"reliable","C":false,"D":false},"chitose":{"id":"chitose","A":"next","B":"upside","C":false,"D":false},"zombie":{"id":"zombie","A":"none","B":"upside","C":true,"D":false},"tokyo":{"id":"tokyo","A":"none","B":"upside","C":true,"D":false},"hako":{"id":"hako","A":"next","B":"reliable","C":true,"D":false},"toaru":{"id":"toaru","A":"none","B":"upside","C":true,"D":false},"vertex":{"id":"vertex","A":"none","B":"none","C":true,"D":false},"goblin":{"id":"goblin","A":"none","B":"upside","C":true,"D":false},"rayearth":{"id":"rayearth","A":"none","B":"none","C":true,"D":false},"kyouran":{"id":"kyouran","A":"next","B":"upside","C":true,"D":false},"mezametara":{"id":"mezametara","A":"none","B":"none","C":true,"D":false},"tetsuryo":{"id":"tetsuryo","A":"none","B":"none","C":true,"D":true},"fx":{"id":"fx","A":"none","B":"upside","C":true,"D":false},"kanata":{"id":"kanata","A":"none","B":"none","C":true,"D":true},"shinja":{"id":"shinja","A":"none","B":"none","C":true,"D":true},"kikansha":{"id":"kikansha","A":"none","B":"upside","C":true,"D":false},"revo":{"id":"revo","A":"none","B":"none","C":true,"D":true},"hitakakusu":{"id":"hitakakusu","A":"none","B":"none","C":true,"D":true},"saikyou":{"id":"saikyou","A":"none","B":"none","C":false,"D":true},"max":{"id":"max","A":"none","B":"none","C":true,"D":true},"shiotaiou":{"id":"shiotaiou","A":"none","B":"none","C":true,"D":true},"fuyoshi":{"id":"fuyoshi","A":"none","B":"none","C":true,"D":true},"hyouken":{"id":"hyouken","A":"none","B":"none","C":true,"D":false},"tanmoshi":{"id":"tanmoshi","A":"none","B":"none","C":false,"D":true},"aoki":{"id":"aoki","A":"none","B":"none","C":true,"D":true},"psyren":{"id":"psyren","A":"none","B":"none","C":true,"D":false}},"notes":{},"names":{"kusuriya":"『薬屋のひとりごと』第3期","jouheki":"『氷の城壁』第2期","seitokai":"生徒会にも穴はある！","hotel":"『ホテル・インヒューマンズ』第2期","oukoku":"マロニエ王国の七人の騎士","choujou":"超巡！超条先輩","romelia":"ロメリア戦記","chitose":"『千歳くんはラムネ瓶のなか』第2クール","zombie":"#ゾンビさがしてます","tokyo":"『東京リベンジャーズ』三天戦争編","hako":"『アオのハコ』Season2","toaru":"とある暗部の少女共棲","vertex":"バーテックスフォース","goblin":"転生ゴブリンだけど質問ある？","rayearth":"魔法騎士レイアース","kyouran":"凶乱令嬢ニア・リストン 病弱令嬢に転生した神殺しの武人の華麗なる無双録","mezametara":"目覚めたら最強装備と宇宙船持ちだったので、一戸建て目指して傭兵として自由に生きたい","tetsuryo":"てつりょー！meet with 鉄道むすめ","fx":"FX戦士くるみちゃん","kanata":"彼方から","shinja":"信者ゼロの女神サマと始める異世界攻略","kikansha":"『帰還者の魔法は特別です』第二期","revo":"貸した魔力は【リボ払い】で強制徴収","hitakakusu":"転生した大聖女は、聖女であることをひた隠す","saikyou":"世界最強の魔女、始めました","max":"弱気MAX令嬢なのに、辣腕婚約者様の賭けに乗ってしまった","shiotaiou":"塩対応の佐藤さんが俺にだけ甘い","fuyoshi":"追放されたチート付与魔術師は気ままなセカンドライフを謳歌する。 ～俺は武器だけじゃなく、あらゆるものに『強化ポイント』を付与できるし、俺の意思でいつでも効果を解除できるけど、残った人たち大丈夫？～","hyouken":"冰剣の魔術師が世界を統べるⅡ","tanmoshi":"探偵はもう、死んでいる。Season2","aoki":"蒼き伝承 – Welsh & Shedar","psyren":"PSYREN -サイレン-"},"schema":"sow-fantasy-season-classification-release-v1","revision":"fall2026-commissioner-20261125-r30","status":"PUBLISHED CONFIGURATION · 2026 FALL","basedOn":"SOW-2026-fall-Preseason-Visual-Working (1).json","publishedAt":"2026-11-25","baseRevision":"fall2026-preseason-test-r28"};
 const KEY='sow-fantasy-active-classification-'+PUBLISHED.season+'-v1';
 const clone=o=>JSON.parse(JSON.stringify(o));
 const ids=Object.keys(PUBLISHED.rows),idSet=new Set(ids);
 function check(x){
  if(!x||x.season!==PUBLISHED.season||!x.rows||!Array.isArray(x.ranking)||x.ranking.length!==ids.length||new Set(x.ranking).size!==ids.length||!x.ranking.every(id=>idSet.has(id)))throw Error('Season, title IDs or expectation order mismatch');
  if(Object.keys(x.rows).length!==ids.length||!ids.every(id=>Object.hasOwn(x.rows,id)))throw Error('Title list is incomplete');
  for(const id of ids){const r=x.rows[id];if(!r||r.id!==id||!['none','elite','next'].includes(r.A)||!['none','reliable','upside'].includes(r.B)||typeof r.C!=='boolean'||typeof r.D!=='boolean')throw Error('Invalid group membership: '+id);}
  if(!x.notes||typeof x.notes!=='object'||Array.isArray(x.notes))throw Error('Invalid notes');
  const eligible={A:0,B:0,C:0,D:0,Anext:0};
  for(const id of ids){const r=x.rows[id];if(r.A!=='none')eligible.A++;if(r.A==='next')eligible.Anext++;if(r.B!=='none')eligible.B++;if(r.C)eligible.C++;if(r.D)eligible.D++;if(r.A==='none'&&r.B==='none'&&!r.C&&!r.D)throw Error('Unsorted title cannot be activated: '+id);}
  if(eligible.A<3||eligible.Anext<2||eligible.B<3||eligible.C<3||eligible.D<3)throw Error('Too few eligible titles in a group / A Next tier');
  for(const [id,note] of Object.entries(x.notes)){if(!idSet.has(id)||typeof note!=='string'||note.length>400)throw Error('Invalid note: '+id);}
 }
 function bands(x){
  const ordered=(fn)=>x.ranking.filter(id=>fn(x.rows[id]));
  const elite=ordered(r=>r.A==='elite'),next=ordered(r=>r.A==='next');
  const reliable=ordered(r=>r.B==='reliable'),upside=ordered(r=>r.B==='upside');
  return {A:{elite,next},B:{reliable,all:[...reliable,...upside]},C:{all:ordered(r=>r.C)},D:{all:ordered(r=>r.D)}};
 }
 function hash(x){const s=JSON.stringify([x.ranking,x.rows,x.notes]);let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return (n>>>0).toString(16).padStart(8,'0');}
 function fromDraft(x){
  if(!x||!['sow-fantasy-preseason-classification-draft-v1','sow-fantasy-preseason-classification-draft-v2'].includes(x.schema))throw Error('Import a Preseason Visual Working JSON');
  const d=clone(x);
  if(d.schema.endsWith('-v1')){d.ranking=ids.slice();d.notes={};}
  check(d);
  const release={schema:'sow-fantasy-season-classification-release-v1',season:PUBLISHED.season,baseRevision:PUBLISHED.baseRevision,revision:'fall2026-local-'+hash(d),status:'ACTIVE ON THIS BROWSER ONLY',publishedAt:null,source:'visual-workbench',ranking:d.ranking,rows:d.rows,notes:d.notes,names:clone(PUBLISHED.names),groupBands:bands(d)};
  return release;
 }
 function validateRelease(x){if(!x||x.schema!=='sow-fantasy-season-classification-release-v1'||typeof x.revision!=='string'||!/^fall2026-[a-zA-Z0-9-]{5,70}$/.test(x.revision))throw Error('Invalid release');check(x);x.groupBands=bands(x);return x;}
 function load(){
  try{const s=localStorage.getItem(KEY);if(s){const x=validateRelease(JSON.parse(s));return {...clone(x),isLocal:true};}}catch(e){global.console?.warn('SOW classification local override is invalid; using published release',e);}
  return {...validateRelease(clone(PUBLISHED)),isLocal:false};
 }
 function activate(x){const r=validateRelease(clone(x));if(!r.revision.startsWith('fall2026-local-'))throw Error('Only working copies may be activated locally');localStorage.setItem(KEY,JSON.stringify(r));return r;}
 function restorePublished(){localStorage.removeItem(KEY);}
 global.SOWFantasyClassificationR30=Object.freeze({published:()=>validateRelease(clone(PUBLISHED)),loadActive:load,fromDraft,activate,restorePublished,storeKey:KEY});
})(window);
