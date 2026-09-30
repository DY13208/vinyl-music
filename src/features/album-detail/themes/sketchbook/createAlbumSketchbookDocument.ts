import type { Album, Track } from '../../../../types';
import { getAlbumDiscs } from '../../../../utils/vinylSides';
import canonicalSketchbookHtml from '../../../../vendor/threeui/meng-to-sketchbook.html?raw';

type AlbumSketchbookOptions = {
  album: Album;
  favorite: boolean;
  wishlistEnabled: boolean;
};

type SketchbookPage = {
  url: string;
  title: string;
  place: string;
  trackId?: string;
};

const escapeMarkup = (value: string | number | undefined) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const safeJson = (value: unknown) => JSON.stringify(value)
  .replaceAll('<', '\\u003c')
  .replaceAll('\u2028', '\\u2028')
  .replaceAll('\u2029', '\\u2029');

const placeholderCover = (title: string) => {
  const safeTitle = escapeMarkup(title || 'Untitled record');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="#29251f"/><text x="600" y="570" fill="#ece7dc" font-family="Georgia,serif" font-size="58" text-anchor="middle">${safeTitle}</text><text x="600" y="640" fill="rgba(236,231,220,.62)" font-family="Arial,sans-serif" font-size="24" letter-spacing="8" text-anchor="middle">VINYL SHELF</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const meaningful = (value: unknown) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return /待确认|待考|未确认|未分类|未知|暂无|unknown|not confirmed|^n\/?a$|^[-—]$/i.test(text) ? '' : text;
};

function albumTracks(album: Album): Track[] {
  return getAlbumDiscs(album).flatMap(record => record.sides.flatMap(side => side.tracks));
}

function replaceRequired(document: string, pattern: string | RegExp, replacement: string, label: string) {
  const next = document.replace(pattern, () => replacement);
  if (next === document) throw new Error(`ThreeUI source anchor missing: ${label}`);
  return next;
}

export function createAlbumSketchbookDocument({ album, favorite, wishlistEnabled }: AlbumSketchbookOptions) {
  const tracks = albumTracks(album);
  const cover = album.coverUrl || placeholderCover(album.title);
  const pages: SketchbookPage[] = [
    { url: cover, title: album.title, place: 'ALBUM COVER' },
    ...tracks.map((track, index) => ({
      url: track.coverUrl || cover,
      title: track.title,
      place: `${String(index + 1).padStart(2, '0')} · ${track.duration}`,
      trackId: track.id,
    })),
  ];
  const description = album.description?.trim()
    || `《${album.title}》由 ${album.artist} 创作。这里保留专辑封面、曲目顺序与实体压片资料，点击下方曲目即可把对应封面翻到上方。`;
  const meta = [album.year, album.genre, album.edition].map(meaningful).filter(Boolean).join(' · ');
  const catalogue = [album.label, album.matrixCode].map(meaningful).filter(Boolean).join(' · ') || 'VINYL SHELF ARCHIVE';
  const recordFormat = meaningful(album.rpm) || 'LP';
  const footerMeta = [album.artist, meaningful(album.label), 'VINYL SHELF'].filter(Boolean).join(' · ');

  const header = `<header class="top">
    <div class="record-topline">
      <button class="icon-btn record-back" id="themeBack" type="button" aria-label="返回"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
      <a class="name" href="#sketchbook">${escapeMarkup(album.title)}</a>
      <span class="record-format">${escapeMarkup(recordFormat)}</span>
    </div>
    <nav><a href="#sketchbook" aria-current="page">封面</a><a href="#plates">曲目</a><a href="#about">专辑</a></nav>
  </header>`;
  const about = `<section id="about" class="about">
    <div>
      <p class="section-label">About the record</p>
      <p class="bio">${escapeMarkup(description).replaceAll('\n', '<br>')}</p>
      <p class="record-meta">${escapeMarkup(meta)}<br>${escapeMarkup(catalogue)}</p>
      <div class="record-actions" aria-label="专辑操作">
        <button id="playAlbum" type="button">播放整张</button>
        <button id="favoriteAlbum" type="button" aria-pressed="${favorite}">${favorite ? '已收藏' : '收藏'}</button>
        ${wishlistEnabled ? '<button id="wishlistAlbum" type="button">愿望单</button>' : ''}
      </div>
    </div>
    <img class="bloom" src="/landing-pages/meng-to-sketchbook/bloom.png" alt="" aria-hidden="true">
  </section>`;
  const footer = `<p class="foot" id="contact">${escapeMarkup(footerMeta)}</p>`;

  const overrides = `<style id="vinyl-album-adaptation">
  html{scroll-behavior:smooth;scrollbar-width:none;overflow-x:hidden;touch-action:pan-y;-webkit-overflow-scrolling:touch}
  html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0}
  body{min-height:100%;padding-bottom:calc(76px + env(safe-area-inset-bottom));overflow-x:hidden;overscroll-behavior-y:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}
  .top{padding-top:max(13px,env(safe-area-inset-top));padding-bottom:52px}
  .record-topline{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;width:100%;max-width:720px}
  .record-topline .name{overflow:hidden;text-overflow:ellipsis}
  .record-back{width:44px;height:44px;border:0;background:transparent;cursor:pointer}
  .record-back svg{width:20px!important;height:20px!important}
  .record-format{font-size:10px;letter-spacing:.12em;color:var(--ink-faint);text-align:right}
  .hero{min-height:100svh;padding-top:clamp(128px,16svh,168px)}
  .hero-kicker{max-width:calc(100% - 32px);line-height:1.7;text-wrap:balance}
  .sb-3d{max-width:min(720px,74svh)}
  .sb-book{aspect-ratio:1;filter:drop-shadow(0 22px 24px rgba(58,44,26,.26))}
  .sb-full{overflow:hidden;border-radius:2px;background:#25211b}
  .sb-full img{width:100%;height:100%;object-fit:cover}
  .sb-half{overflow:hidden;background:#25211b}
  .sb-half-img{height:100%;object-fit:cover}
  .face{background-size:var(--bw,0px) var(--bw,0px)}
  .gutter-shade,.face .sh,.face .gl{top:0;bottom:0}
  .sb-cast.ambient{top:18%;bottom:-8%}.sb-cast.contact{top:67%;bottom:-3%}.sb-cast.hair{top:78%;bottom:-2%}
  .tool--play{width:auto;min-width:82px;padding:0 10px;border-radius:999px;color:var(--ink);gap:6px}
  .tool--play svg{fill:currentColor}
  .tool--play:disabled{opacity:.38}
  .sb-tools>#zOut,.sb-tools>#zRead,.sb-tools>#zIn,.sb-tools>#zIn+.tool-sep{display:none}
  .loupe .ring,.loupe .grip{touch-action:none}
  .record-meta{margin:22px 0 0;color:var(--ink-faint);font-size:12px;line-height:1.8;letter-spacing:.06em;text-transform:uppercase}
  .record-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
  .record-actions button{min-height:44px;padding:0 18px;border:1px solid var(--hairline);border-radius:999px;background:rgba(255,252,244,.5);color:var(--ink);cursor:pointer}
  .record-actions button:first-child{background:var(--ink);color:var(--paper)}
  .record-actions button[aria-pressed="true"]{border-color:var(--earth);color:var(--earth)}
  .record-actions button:focus-visible,.plate:focus-visible,.tool:focus-visible,.sb-arrow:focus-visible,.record-back:focus-visible{outline:2px solid var(--earth);outline-offset:3px}
  @media(max-width:640px){
    html{scroll-behavior:auto}
    .top{padding-inline:10px}.record-topline{grid-template-columns:40px minmax(0,1fr) 40px}.record-back{width:40px;height:40px}
    .hero{min-height:calc(100svh - 16px);padding-top:116px;padding-bottom:68px}.sb-3d{max-width:none}.sb-tools{padding:5px}.tool--play{min-width:72px;padding-inline:8px}
    .loupe{display:block!important}.sb-caption{max-width:78vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.about{gap:18px}.record-actions{justify-content:center}.record-meta{text-align:center}
  }
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  </style>`;

  const bridge = `<script id="vinyl-album-bridge">
  function vinylMessage(action,payload){parent.postMessage(Object.assign({type:'vinyl-album-sketchbook',action:action},payload||{}),'*')}
  function vinylScrollBehavior(){return matchMedia('(max-width: 640px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches?'auto':'smooth'}
  document.querySelectorAll('a[href^="#"]').forEach(function(link){
    link.addEventListener('click',function(event){
      var target=document.getElementById(link.getAttribute('href').slice(1));
      if(!target)return;
      event.preventDefault();
      target.scrollIntoView({behavior:vinylScrollBehavior(),block:'start'});
    });
  });
  function emitPage(){
    var page=PAGES[idx]||PAGES[0];
    var play=document.getElementById('playCurrent');
    if(play){play.disabled=!page.trackId;play.setAttribute('aria-label',page.trackId?'播放 '+page.title:'专辑封面')}
    vinylMessage('page',{index:idx,trackId:page.trackId||null});
  }
  document.getElementById('themeBack').onclick=function(){vinylMessage('back')};
  document.getElementById('playAlbum').onclick=function(){vinylMessage('play-album')};
  document.getElementById('favoriteAlbum').onclick=function(){
    var next=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',String(next));this.textContent=next?'已收藏':'收藏';vinylMessage('favorite')
  };
  var wishlist=document.getElementById('wishlistAlbum');if(wishlist)wishlist.onclick=function(){vinylMessage('wishlist')};
  document.getElementById('playCurrent').onclick=function(){var page=PAGES[idx]||PAGES[0];if(page.trackId)vinylMessage('play-track',{trackId:page.trackId})};
  </script>`;

  let document = canonicalSketchbookHtml;
  document = document.replaceAll('meng-to-sketchbook/', '/landing-pages/meng-to-sketchbook/');
  document = replaceRequired(document, '<title>Meng To</title>', `<title>${escapeMarkup(album.title)} — Vinyl Shelf</title>`, 'title');
  document = replaceRequired(document, /<header class="top">[\s\S]*?<\/header>/, header, 'header');
  document = replaceRequired(document, /<p class="hero-kicker">[\s\S]*?<\/p>/, `<p class="hero-kicker">${escapeMarkup(album.artist)} / ${escapeMarkup(meta)}</p>`, 'hero kicker');
  document = replaceRequired(document, /<section id="about" class="about">[\s\S]*?<\/section>/, about, 'about');
  document = replaceRequired(document, '<p class="section-label">Plates</p>', '<p class="section-label">Track index · 点击曲目切换上方封面</p>', 'track index label');
  document = replaceRequired(document, /<p class="foot" id="contact">[\s\S]*?<\/p>/, footer, 'footer');
  document = replaceRequired(document, /const PAGES=\[[\s\S]*?\];/, `const PAGES=${safeJson(pages)};`, 'pages');
  document = replaceRequired(document, 'PAGES.forEach(p=>p.url=DIR+p.file);', 'PAGES.forEach(p=>p.url=p.url||DIR+p.file);', 'page URLs');
  document = replaceRequired(document, 'const M=PAGES.length, LAND=6;', 'const M=PAGES.length, LAND=0;', 'intro landing page');
  document = replaceRequired(document, 'const view={rx:0,ry:0,z:1, trx:0,try_:0,tz:1};', 'const view={rx:0,ry:0,z:.9, trx:0,try_:0,tz:.9};', 'default scale');
  document = replaceRequired(document, 'let lastZ=1;', 'let lastZ=.9;', 'default scale cache');
  document = replaceRequired(document, "stage.addEventListener('dblclick',()=>setView(view.trx,view.try_,1));", "stage.addEventListener('dblclick',()=>setView(view.trx,view.try_,.9));", 'scale reset');
  document = replaceRequired(document, 'function loupeSize(){return Math.round(Math.max(165,Math.min(262,book.clientWidth*0.235)));}', 'function loupeSize(){return innerWidth<=640?Math.round(Math.max(104,Math.min(154,book.clientWidth*0.31))):Math.round(Math.max(165,Math.min(262,book.clientWidth*0.235)));}', 'responsive loupe');
  document = replaceRequired(document, 'animateTo(1,()=>{idx=turn.to;turn=null;paint();},170,26);', 'tweenTo(1,.34,()=>{idx=turn.to;turn=null;paint();});', 'reliable page commit');
  document = replaceRequired(document, 'animateTo(0,()=>{turn=null;paint();},150,24);', 'tweenTo(0,.24,()=>{turn=null;paint();});', 'reliable page cancel');
  document = replaceRequired(document, `document.getElementById('about').scrollIntoView({behavior:'smooth',block:'start'});`, `document.getElementById('about').scrollIntoView({behavior:vinylScrollBehavior(),block:'start'});`, 'mobile about scroll');
  document = replaceRequired(document, `b.onclick=()=>{goTo(i);document.getElementById('sketchbook').scrollIntoView({behavior:'smooth',block:'center'});};`, `b.onclick=()=>{goTo(i);document.getElementById('sketchbook').scrollIntoView({behavior:vinylScrollBehavior(),block:'center'});};`, 'mobile track scroll');
  document = replaceRequired(document, `stage.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  e.preventDefault();                     /* no text selection, no image drag */
  const onBook=e.target.closest('.sb-zone');
  stage.setPointerCapture(e.pointerId);
  hideHint();
  if(!onBook||introOn)return;
  const r=bookRect();
  const dir=(e.clientX-r.left)/r.width>0.5?'next':'prev';
  startTurn(dir,0);
  drag={dir:dir,x0:e.clientX,w:r.width,moved:0,vel:0,tPrev:performance.now()};
});
stage.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=e.clientX-drag.x0;
  drag.moved=Math.max(drag.moved,Math.abs(dx));
  const raw=(drag.dir==='next'? -dx : dx)/(drag.w*0.62);
  const t=Math.max(0,Math.min(1,raw));
  const now=performance.now();
  drag.vel=(t-(turn?turn.t:0))/Math.max(0.001,(now-drag.tPrev)/1000);
  drag.tPrev=now;
  if(turn){turn.t=t;applyTurn(t);}
});`, `stage.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  const onBook=e.target.closest('.sb-zone');
  if(!onBook||introOn)return;
  const r=bookRect();
  const dir=(e.clientX-r.left)/r.width>0.5?'next':'prev';
  const touch=e.pointerType==='touch';
  drag={dir:dir,x0:e.clientX,y0:e.clientY,w:r.width,moved:0,vel:0,tPrev:performance.now(),started:!touch,pointerId:e.pointerId};
  if(!touch){e.preventDefault();stage.setPointerCapture(e.pointerId);hideHint();startTurn(dir,0);}
});
stage.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;
  if(!drag.started){
    if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)*1.15){drag=null;return;}
    if(Math.abs(dx)<8)return;
    drag.started=true;e.preventDefault();
    try{stage.setPointerCapture(drag.pointerId);}catch(error){}
    hideHint();startTurn(drag.dir,0);
  }
  drag.moved=Math.max(drag.moved,Math.abs(dx));
  const raw=(drag.dir==='next'? -dx : dx)/(drag.w*0.62);
  const t=Math.max(0,Math.min(1,raw));
  const now=performance.now();
  drag.vel=(t-(turn?turn.t:0))/Math.max(0.001,(now-drag.tPrev)/1000);
  drag.tPrev=now;
  if(turn){turn.t=t;applyTurn(t);}
});`, 'mobile page gesture');
  document = replaceRequired(document, `function endDrag(e){
  if(!drag)return;
  const d=drag;drag=null;
  if(!turn)return;`, `function endDrag(e){
  if(!drag)return;
  const d=drag;drag=null;
  if(e.type==='pointercancel'){if(turn)cancel();return;}
  if(!d.started){if(d.moved<6){startTurn(d.dir,0);commit();}return;}
  if(!turn)return;`, 'mobile page gesture completion');
  document = replaceRequired(document, `  await Promise.all(PAGES.map(p=>{
    const im=new Image();im.src=p.url;
    return im.decode?im.decode().catch(()=>{}):new Promise(r=>{im.onload=im.onerror=r});
  }));`, `  const mobile=matchMedia('(max-width: 640px), (pointer: coarse)').matches;
  const preload=mobile
    ? [PAGES[idx],PAGES[(idx+1)%M],PAGES[(idx-1+M)%M]]
    : PAGES;
  const urls=[...new Set(preload.map(p=>p.url).filter(Boolean))];
  await Promise.all(urls.map(url=>{
    const im=new Image();im.src=url;
    return im.decode?im.decode().catch(()=>{}):new Promise(r=>{im.onload=im.onerror=r});
  }));`, 'mobile artwork preload');
  document = replaceRequired(document, '</style>', `</style>${overrides}`, 'style overrides');
  document = replaceRequired(document, '<button class="tool" id="loupeBtn"', '<button class="tool tool--play" id="playCurrent" type="button" disabled><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4.8v10.4L15 10z"/></svg><span>播放</span></button><span class="tool-sep" aria-hidden="true"></span><button class="tool" id="loupeBtn"', 'current track play control');
  document = replaceRequired(document, "if(typeof placeLoupe==='function')placeLoupe();\n}", "if(typeof placeLoupe==='function')placeLoupe();\n  if(typeof emitPage==='function')emitPage();\n}", 'page message hook');
  document = replaceRequired(document, '</body>', `${bridge}</body>`, 'message bridge');
  return document;
}
