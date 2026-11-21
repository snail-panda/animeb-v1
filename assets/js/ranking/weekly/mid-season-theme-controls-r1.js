/* OFFBEAT / AnimeB — MID-SEASON label controls R1c
 * Standalone, scoped companion to the Weekly Ranking Theme Studio.
 * No ranking data, Converter JSON, theme presets or existing CSS/JS modified.
 * Preferences are personal, browser-local, separate for Original / Dark / Image.
 */
(() => {
  'use strict';
  const KEY = 'animeb-mid-label-studio-r1';
  const modes = ['auto', 'below', 'inline', 'stacked', 'above'];
  const themes = ['original', 'dark', 'image'];
  const selector = '.animeb-mid-under,.animeb-mid-above,.animeb-mid-inline,.animeb-mid-stack-label';
  const fonts = {
    auto: null,
    barlow: "'Barlow Condensed','Roboto Condensed',sans-serif",
    roboto: "'Roboto Condensed','Barlow Condensed',sans-serif",
    fira: "'Fira Sans',sans-serif",
    antonio: "'Antonio','Barlow Condensed',sans-serif"
  };
  const shadows = ['off','theme','soft'];
  const validHex = v => typeof v === 'string' && /^#[\da-fA-F]{6}$/.test(v);
  const limit = (v,lo,hi,def) => Number.isFinite(Number(v)) && v !== '' && v != null ? Math.min(hi,Math.max(lo,Number(v))) : def;
  const defaults = () => ({ placement:'auto', color:null, font:'auto', shadow:'off', desktopSize:8.5, desktopWeight:650, mobileSize:10.5, mobileWeight:500 });
  const normalize = value => {
    const clean = defaults();
    if (!value || typeof value !== 'object') return clean;
    clean.placement = modes.includes(value.placement) ? value.placement : 'auto';
    clean.color = validHex(value.color) ? value.color : null;
    clean.font = Object.prototype.hasOwnProperty.call(fonts,value.font) ? value.font : 'auto';
    clean.shadow = shadows.includes(value.shadow) ? value.shadow : 'off';
    clean.desktopSize = limit(value.desktopSize,8,16,8.5);
    clean.desktopWeight = limit(value.desktopWeight,400,700,650);
    clean.mobileSize = limit(value.mobileSize,7,16,10.5);
    clean.mobileWeight = limit(value.mobileWeight,400,700,500);
    return clean;
  };
  let profiles = Object.fromEntries(themes.map(id => [id,defaults()]));
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      for (const id of themes) profiles[id] = normalize(saved[id]);
    }
  } catch (_) {}
  const theme = () => themes.includes(document.body.dataset.animebTheme) ? document.body.dataset.animebTheme : 'original';
  const save = () => { try { localStorage.setItem(KEY,JSON.stringify(profiles)); } catch (_) {} };
  const actualHeader = () => document.querySelector('.wrapper > .header');
  const detectPlacement = header => {
    if (header.querySelector('.animeb-mid-stack-label')) return 'stacked';
    if (header.querySelector('.animeb-mid-inline')) return 'inline';
    if (header.querySelector('.animeb-mid-above')) return 'above';
    if (header.querySelector('.animeb-mid-under')) return 'below';
    return null;
  };
  // Move only the existing MID-SEASON label (and date in stacked mode).
  // Do not regenerate the WEEK number, TOP title, date text or any article content.
  const arrange = (header,requested) => {
    const title = header.querySelector('.week-title.animeb-week-enhanced');
    const label = header.querySelector(selector);
    const week = title?.querySelector('.animeb-week-label');
    const duration = header.querySelector('.duration');
    if (!title || !label || !week || !duration) return;
    if (!header.dataset.obMidOriginal) header.dataset.obMidOriginal = detectPlacement(header) || 'below';
    const target = requested === 'auto' ? header.dataset.obMidOriginal : requested;
    const current = detectPlacement(header);
    if (!target || current === target) return;
    // Detach the label first, then unwrap the former layout without losing nodes.
    label.remove();
    const stack = header.querySelector('.animeb-mid-stack');
    if (stack) {
      title.after(duration);
      stack.remove();
    }
    const word = title.querySelector('.animeb-week-word');
    if (word) word.replaceWith(week);
    title.classList.remove('animeb-mid-below');
    if (target === 'below' || target === 'above') {
      const wrap = document.createElement('span');
      wrap.className = 'animeb-week-word';
      week.replaceWith(wrap);
      wrap.append(week);
      label.className = target === 'below' ? 'animeb-mid-under' : 'animeb-mid-above';
      wrap.append(label);
      if (target === 'below') title.classList.add('animeb-mid-below');
    } else if (target === 'inline') {
      label.className = 'animeb-mid-inline';
      title.append(label);
    } else if (target === 'stacked') {
      const box = document.createElement('span');
      box.className = 'animeb-mid-stack';
      label.className = 'animeb-mid-stack-label';
      duration.before(box);
      box.append(label,duration);
    }
  };
  function apply() {
    const header = actualHeader();
    if (!header) return;
    const config = profiles[theme()];
    header.style.setProperty('--ob-mid-desktop-size',config.desktopSize+'px');
    header.style.setProperty('--ob-mid-desktop-weight',String(config.desktopWeight));
    header.style.setProperty('--ob-mid-mobile-size',config.mobileSize+'px');
    header.style.setProperty('--ob-mid-mobile-weight',String(config.mobileWeight));
    if (config.color) header.style.setProperty('--ob-mid-color',config.color);
    else header.style.removeProperty('--ob-mid-color');
    if (fonts[config.font]) header.style.setProperty('--ob-mid-font-family',fonts[config.font]);
    else header.style.removeProperty('--ob-mid-font-family');
    // The original R1 explicitly disabled all shadows. Opt-in copies the
    // CURRENT header shadow, including Theme Studio's image-legibility settings.
    let shadow = 'none';
    if (config.shadow === 'soft') shadow = '0 1px 1px rgba(0,0,0,.20)';
    if (config.shadow === 'theme') {
      const primary = header.querySelector('h1');
      shadow = primary ? getComputedStyle(primary).textShadow : 'none';
    }
    header.style.setProperty('--ob-mid-shadow',shadow);
    arrange(header,config.placement);
  }
  const scroll = document.querySelector('#animeb-theme-panel .animeb-theme-panel-scroll');
  if (!scroll || !scroll.querySelector('.animeb-week-style-control')) {
    console.warn('OFFBEAT MID label controls: compatible Theme Studio not found; no changes made.');
    return;
  }
  if (document.getElementById('ob-mid-studio')) return;
  const box = document.createElement('fieldset'); box.id = 'ob-mid-studio'; box.className = 'ob-mid-studio';
  const legend = document.createElement('legend'); legend.textContent = 'MID-SEASON LABEL / 中間ラベル';
  const note = document.createElement('p'); note.textContent = 'Overrides this browser’s view only. Auto follows article JSON. Original / Dark / Image are saved separately. / この端末のみ。Autoは記事JSON優先、テーマ別に保存。';
  note.className = 'ob-mid-help'; box.append(legend,note);
  const row = (caption,control) => { const label=document.createElement('label');label.className='ob-mid-row'; const span=document.createElement('span');span.textContent=caption;label.append(span,control);box.append(label);return label; };
  const pos = document.createElement('select');pos.id='ob-mid-position';
  [['auto','Auto / JSON'],['below','Below WEEK / WEEKの下'],['inline','Right of 06 / 番号の右'],['stacked','Above dates / 日付の上'],['above','Above WEEK / WEEKの上']].forEach(([v,text])=>{const opt=document.createElement('option');opt.value=v;opt.textContent=text;pos.append(opt);});
  row('Position / 表示位置',pos);
  const colorWrap = document.createElement('div');colorWrap.className='ob-mid-color-row';
  const color = document.createElement('input');color.type='color';color.id='ob-mid-color';color.value='#91765c';
  const auto = document.createElement('button');auto.type='button';auto.textContent='Auto / JSON'; auto.id='ob-mid-color-auto';
  colorWrap.append(color,auto);row('Text color / 文字色',colorWrap);
  const addSelect=(title,id,items)=>{
    const select=document.createElement('select');select.id=id;
    for(const [value,caption] of items){
      const option=document.createElement('option');option.value=value;option.textContent=caption;select.append(option);
    }
    row(title,select);return select;
  };
  const face=addSelect('Font / 書体','ob-mid-font',[
    ['auto','Auto · Desktop / Mobile'],['barlow','Barlow Condensed'],
    ['roboto','Roboto Condensed'],['fira','Fira Sans'],['antonio','Antonio']
  ]);
  const shade=addSelect('Shadow / 影','ob-mid-shadow',[
    ['off','Off / なし'],['theme','Match header / ヘッダーに合わせる'],
    ['soft','Soft / 薄い影']
  ]);
  const createSlider = (name,id,min,max,step) => {
    const wrap=document.createElement('div');wrap.className='ob-mid-slider';
    const slider=document.createElement('input');slider.type='range';slider.min=min;slider.max=max;slider.step=step;slider.id=id;
    const out=document.createElement('output');out.htmlFor=id;
    wrap.append(slider,out);row(name,wrap);return {slider,out};
  };
  const ds = createSlider('Desktop size / PC文字サイズ','ob-mid-size-desktop',8,16,.5);
  const dw = createSlider('Desktop weight / PC文字の太さ','ob-mid-weight-desktop',400,700,50);
  const ms = createSlider('iPhone size / スマホ文字サイズ','ob-mid-size-mobile',7,16,.5);
  const mw = createSlider('iPhone weight / スマホ文字の太さ','ob-mid-weight-mobile',400,700,50);
  const reset = document.createElement('button');reset.type='button';reset.className='ob-mid-reset';reset.id='ob-mid-reset';reset.textContent='Reset label settings / ラベル設定を戻す';box.append(reset);
  scroll.querySelector('.animeb-week-style-control').after(box);
  const slots = [[ds,'desktopSize','px'],[dw,'desktopWeight',''],[ms,'mobileSize','px'],[mw,'mobileWeight','']];
  function sync() {
    const config=profiles[theme()]; pos.value=config.placement; face.value=config.font; shade.value=config.shadow;
    color.value=config.color || '#91765c'; auto.setAttribute('aria-pressed',String(!config.color));
    for(const [parts,key,unit] of slots) {parts.slider.value=config[key];parts.out.value=String(config[key])+unit;parts.out.textContent=String(config[key])+unit;}
  }
  const update = fn => {fn(profiles[theme()]);save();sync();apply();};
  pos.addEventListener('change',()=>update(cfg=>{cfg.placement=pos.value;}));
  face.addEventListener('change',()=>update(cfg=>{cfg.font=face.value;}));
  shade.addEventListener('change',()=>update(cfg=>{cfg.shadow=shade.value;}));
  color.addEventListener('input',()=>update(cfg=>{cfg.color=color.value;}));
  auto.addEventListener('click',()=>update(cfg=>{cfg.color=null;}));
  for(const [parts,key] of slots) parts.slider.addEventListener('input',()=>update(cfg=>{cfg[key]=Number(parts.slider.value);}));
  reset.addEventListener('click',()=>update(cfg=>{Object.assign(cfg,defaults());}));
  sync();apply();
  // The weekly presentation is injected after asynchronous JSON loading.
  // Observe only children so our CSS-variable writes do not cause a mutation loop.
  const header = actualHeader();
  if (header) new MutationObserver(()=>apply()).observe(header,{childList:true,subtree:true});
  new MutationObserver(()=>{sync();apply();}).observe(document.body,{attributes:true,attributeFilter:['data-animeb-theme']});
  // Track Theme Studio's injected style text, but never write into <head> here.
  // This keeps 'Match header' live when the global shadow slider changes.
  let shadowRefreshPending=false;
  new MutationObserver(()=>{
    if (profiles[theme()].shadow !== 'theme' || shadowRefreshPending) return;
    shadowRefreshPending=true;
    requestAnimationFrame(()=>{shadowRefreshPending=false;apply();});
  }).observe(document.head,{childList:true,subtree:true,characterData:true});
})();
