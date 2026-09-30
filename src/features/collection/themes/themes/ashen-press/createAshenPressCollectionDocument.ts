import type { Album } from '../../../../../types';
import canonicalAshenPressHtml from '../../../../../vendor/threeui/ashen-press.html?raw';

type AshenPressCollectionOptions = {
  albums: readonly Album[];
  page: number;
  totalPages: number;
};

const palettes = [
  { id: 'nightreign', spine: '#2f4a6b', cloth: '#12161d', edge: '#e4dcc6' },
  { id: 'erdtree', spine: '#7a6a2e', cloth: '#171510', edge: '#e9dfc4' },
  { id: 'ac6', spine: '#b4531f', cloth: '#171310', edge: '#eae3d2' },
  { id: 'elden-ring', spine: '#c39a3f', cloth: '#15120e', edge: '#e8dfc8' },
  { id: 'sekiro', spine: '#a8291f', cloth: '#141312', edge: '#e9e1cd' },
  { id: 'ds3', spine: '#6a5a4a', cloth: '#161513', edge: '#e2d8c0' },
  { id: 'bloodborne', spine: '#7d1a1c', cloth: '#0f0c0d', edge: '#e4d9c4' },
  { id: 'ds2', spine: '#4f5f5a', cloth: '#121614', edge: '#ddd8c6' },
  { id: 'dark-souls', spine: '#8a7a5e', cloth: '#1a1815', edge: '#ded3ba' },
  { id: 'demons-souls', spine: '#41586c', cloth: '#101418', edge: '#dcdcd4' },
] as const;

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const escapeMarkup = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const safeJson = (value: unknown) => JSON.stringify(value)
  .replaceAll('<', '\\u003c')
  .replaceAll('\u2028', '\\u2028')
  .replaceAll('\u2029', '\\u2029');

function coverTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [title.toUpperCase(), ''];
  const split = Math.ceil(words.length / 2);
  return [words.slice(0, split).join(' ').toUpperCase(), words.slice(split).join(' ').toUpperCase()];
}

function collectionLabel(album: Album) {
  return album.collectionTags?.find(Boolean)
    || album.genre.split('·').map(value => value.trim()).find(Boolean)
    || (album.rpm && !album.rpm.includes('待确认') ? album.rpm : '')
    || '已收藏';
}

function replaceRequired(document: string, pattern: string | RegExp, replacement: string, label: string) {
  const next = document.replace(pattern, () => replacement);
  if (next === document) throw new Error(`ThreeUI AshenPress collection anchor missing: ${label}`);
  return next;
}

export function createAshenPressCollectionDocument({ albums, page, totalPages }: AshenPressCollectionOptions) {
  const volumes = albums.slice(0, palettes.length).map((album, index) => {
    const [t1, t2] = coverTitle(album.title);
    return {
      id: palettes[index].id,
      albumId: album.id,
      title: album.title,
      t1,
      t2,
      sub: `${album.artist} · ${album.genre}`,
      year: String(album.year || 'VINYL'),
      tag: collectionLabel(album),
      speed: album.rpm && !album.rpm.includes('待确认') ? album.rpm : '黑胶唱片',
      vol: roman[index],
      shelf: index < 5 ? 0 : 1,
      slot: index % 5,
      ...palettes[index],
      blurb: album.description?.trim() || `${album.artist} · ${album.label}`,
      coverUrl: album.coverUrl || '/assets/cover-placeholder.svg',
    };
  });

  const header = `<header aria-hidden="true"><span class="collection-count">${escapeMarkup(albums.length)} 张 · ${String(page + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}</span></header>`;

  const overrides = `<style id="vinyl-ashen-collection-adaptation">
  :root{--bg:#0a0e0c;--ink:#edf0ed;--ink-soft:rgba(223,230,224,.62)}
  html,body{background:#0a0e0c;color:var(--ink)}
  header{display:none!important}
  .loader{background:#0a0e0c}.bar{background:rgba(237,240,237,.14)}.bar i{background:#9fd3ae}
  footer{background:linear-gradient(to top,rgba(10,14,12,.99) 38%,rgba(10,14,12,.86) 66%,rgba(10,14,12,0));border-top-color:transparent}
  .tli,.menu button{color:var(--ink)}.tli p,.detail .meta,.mbar-txt p{color:var(--ink-soft)}
  .detail p{color:rgba(237,240,237,.78)}
  .detail .acts button{color:#e9eee9;background:#171a18;box-shadow:0 14px 34px rgba(0,0,0,.46),inset 0 1px rgba(255,255,255,.07)}
  .detail .acts button:hover{background:#202521}
  .detail .acts button:first-child,.mbar-acts .solid{background:#dce8de;color:#101311}
  .hint{color:#e9eee9;background:#151816;box-shadow:0 8px 22px rgba(0,0,0,.48)}
  .menu{background:rgba(10,14,12,.98)}
  .menu button{border-bottom-color:rgba(229,235,230,.12)}
  .tlmark{display:none}
  .detail .acts{flex-wrap:wrap}.detail .acts button,.mbar-acts button{cursor:pointer}
  .detail button:focus-visible,.mbar button:focus-visible,.tli:focus-visible,.menu button:focus-visible{outline:2px solid #9fd3ae;outline-offset:3px}
  @media(max-width:700px){
    .mbar{padding-bottom:max(18px,env(safe-area-inset-bottom))}.mbar-txt{min-width:0}.mbar-txt h2{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:48vw}
  }
  @media(max-width:370px){.mbar-acts button{padding-inline:14px}.mbar-txt h2{max-width:42vw}}
  @media(prefers-reduced-motion:reduce){canvas#gl,.rise,.detail,.mbar{transition-duration:.01ms!important}}
  </style>`;

  const vinylSleevePainter = `
function paintVinylSleeve(b,W,H){
  const c=C(W,H),g=c.getContext('2d'),img=PLATE[b.id];
  g.fillStyle='#0b0d0c';g.fillRect(0,0,W,H);
  if(img){
    const sw=Math.min(img.naturalWidth,img.naturalHeight),sx=(img.naturalWidth-sw)/2,sy=(img.naturalHeight-sw)/2;
    g.drawImage(img,sx,sy,sw,sw,0,0,W,H);
  }
  g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=Math.max(2,W*.004);g.strokeRect(2,2,W-4,H-4);
  grain(g,W,H,3,b.id.length*31+7);
  return c;
}
function paintVinylBack(b,W,H){
  const c=C(W,H),g=c.getContext('2d');
  g.fillStyle='#111412';g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(237,240,237,.18)';g.lineWidth=Math.max(2,W*.003);g.strokeRect(W*.06,H*.06,W*.88,H*.88);
  g.fillStyle='#edf0ed';g.textAlign='center';g.textBaseline='middle';
  g.font='500 '+Math.max(22,W*.046)+'px Inter,sans-serif';g.fillText(b.title,W*.5,H*.43,W*.78);
  g.fillStyle='rgba(237,240,237,.62)';g.font='400 '+Math.max(14,W*.025)+'px Inter,sans-serif';
  g.fillText(b.tag+' · '+b.speed,W*.5,H*.53,W*.76);
  return c;
}`;

  let document = canonicalAshenPressHtml;
  document = replaceRequired(document, '<title>Ashen Press — The Art Book Shelf</title>', '<title>我的立体唱片架 · Vinyl Shelf</title>', 'title');
  document = replaceRequired(document, /<header>[\s\S]*?<\/header>/, header, 'header');
  document = replaceRequired(document, '<button id="detail-look">Look inside</button>', '<button id="detail-open">打开专辑</button><button id="detail-look">翻到背面</button>', 'desktop album actions');
  document = replaceRequired(document, '<button id="detail-close">Close</button>', '<button id="detail-close">关闭</button>', 'desktop close');
  document = replaceRequired(document, '<button id="mbar-details">Details</button>', '<button id="mbar-details">详情</button>', 'mobile details');
  document = replaceRequired(document, '<button class="solid" id="mbar-look">Look inside</button>', '<button class="solid" id="mbar-look">打开专辑</button>', 'mobile album action');
  document = replaceRequired(document, '</style>', `</style>${overrides}`, 'style overrides');
  document = replaceRequired(document, '  bookW: 0.887, bookH: 1.33, bookD: 0.17,    // 2:3, the format the plates are shot at', '  bookW: 1.02, bookH: 1.02, bookD: 0.075,   // square record sleeve', 'record sleeve geometry');
  document = replaceRequired(document, '  lean: -0.20, yaw: 0.155,', '  lean: -0.10, yaw: 0.08,', 'record sleeve pose');
  document = replaceRequired(document, 'const SZW=K.bookW, SZH=K.bookH, SZD=K.bookD;', `${vinylSleevePainter}\nconst SZW=K.bookW, SZH=K.bookH, SZD=K.bookD;`, 'record sleeve painter');
  document = replaceRequired(document, 'paintCover(data,768,1152)', 'paintVinylSleeve(data,1024,1024)', 'front sleeve artwork');
  document = replaceRequired(document, 'artBack(data,768,1152)', 'paintVinylBack(data,1024,1024)', 'back sleeve artwork');
  document = replaceRequired(document, '  gScl.add(body);', `  gScl.add(body);
  const vinylMat=new THREE.MeshPhysicalMaterial({color:0x050505,roughness:.32,metalness:.2,clearcoat:.55,clearcoatRoughness:.28});
  const vinyl=new THREE.Mesh(new THREE.CylinderGeometry(SZH*.455,SZH*.455,.018,96),vinylMat);
  vinyl.rotation.x=Math.PI/2;vinyl.position.set(SZW*.28,0,-SZD*.62);gScl.add(vinyl);`, 'vinyl record geometry');
  document = replaceRequired(document, 'renderer.setClearColor(0xc6ae8e,1);', 'renderer.setClearColor(0x010201,1);', 'dark renderer background');
  document = replaceRequired(document, 'const wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL.x1-WALL.x0,WALL.y1-WALL.y0),wallMat);', 'const wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL.x1-WALL.x0,WALL.y1-WALL.y0),wallMat); wall.visible=true;', 'dark wall');
  document = replaceRequired(document, '      vec3 col=bake*(0.86+0.28*fine)*(0.93+0.14*mid);', `      float tooth=(0.86+0.28*fine)*(0.93+0.14*mid);
      float wash=dot(bake*tooth,vec3(0.299,0.587,0.114));
      vec3 col=mix(vec3(0.0040,0.0055,0.0045),vec3(0.018,0.024,0.020),smoothstep(0.22,0.92,wash));
      float focus=max(0.0,1.0-distance(vUv,vec2(0.50,0.56))*1.7);
      col+=vec3(0.0030,0.0042,0.0034)*focus;`, 'charcoal wall');
  document = replaceRequired(document, '        vec3 col = wood*t;', `        float woodTone=dot(wood,vec3(0.299,0.587,0.114));
        vec3 stained=mix(vec3(0.020,0.024,0.021),vec3(0.075,0.087,0.078),woodTone);
        vec3 col = stained*t;`, 'charcoal furniture');
  document = replaceRequired(document, '        col += vec3(0.10,0.082,0.055)*arris;', '        col += vec3(0.035,0.042,0.037)*arris;', 'neutral furniture edge');
  document = replaceRequired(document, '        col += vec3(0.05,0.040,0.026)*pow(clamp(n.z,0.0,1.0),5.0);', '        col += vec3(0.018,0.022,0.019)*pow(clamp(n.z,0.0,1.0),5.0);', 'neutral furniture sheen');
  document = replaceRequired(document, "const STUDIO = 'FromSoftware';", "const STUDIO = 'VINYL SHELF';\nfunction vinylMessage(action,payload){parent.postMessage(Object.assign({type:'vinyl-collection-ashen-press',action:action},payload||{}),'*');}", 'studio and bridge');
  document = replaceRequired(document, /const BOOKS = \[[\s\S]*?\n\];/, `const BOOKS = ${safeJson(volumes)};`, 'collection volumes');
  document = replaceRequired(document, 'const src=PLATE_SRC[b.id];', 'const src=b.coverUrl||PLATE_SRC[b.id];', 'album cover source');
  document = replaceRequired(document, 'const im=new Image();\n    im.onload=', "const im=new Image();\n    if(/^https?:/i.test(src)) im.crossOrigin='anonymous';\n    im.onload=", 'cross-origin cover loading');
  document = replaceRequired(document, "const dLook=document.getElementById('detail-look'), dClose=document.getElementById('detail-close');", "const dLook=document.getElementById('detail-look'), dOpen=document.getElementById('detail-open'), dClose=document.getElementById('detail-close');", 'desktop open binding');
  document = replaceRequired(document, "dClose.addEventListener('click',e=>{e.stopPropagation();clearActive();});", "dOpen.addEventListener('click',e=>{e.stopPropagation();const d=S.active&&S.active.data;if(d&&d.albumId)vinylMessage('open-album',{albumId:d.albumId});});\ndClose.addEventListener('click',e=>{e.stopPropagation();clearActive();});", 'desktop open handler');
  document = replaceRequired(document, "mLook.addEventListener('click',e=>{e.stopPropagation();lookInside(books[M.index]);});", "mLook.addEventListener('click',e=>{e.stopPropagation();const d=books[M.index]&&books[M.index].data;if(d&&d.albumId)vinylMessage('open-album',{albumId:d.albumId});});", 'mobile open handler');
  document = replaceRequired(document, 'dMeta.textContent=`${STUDIO} · ${d.year} · Volume ${d.vol}`;', 'dMeta.textContent=`${d.tag} · ${d.speed}`;', 'desktop record metadata');
  document = replaceRequired(document, 'if(MOBILE){ mMeta.textContent=`${STUDIO} · ${d.year}`; mTitle.textContent=d.title;', 'if(MOBILE){ mMeta.textContent=`${d.tag} · ${d.speed}`; mTitle.textContent=d.title;', 'mobile record metadata');
  document = replaceRequired(document, "b.setAttribute('aria-label',`${d.title}, ${STUDIO}, ${d.year}. Opens the volume.`);", "b.setAttribute('aria-label',`${d.title}, ${d.tag}. 打开唱片。`);", 'record aria label');
  document = replaceRequired(document, 'b.innerHTML=`${mark}<span class="tltxt"><p>${d.year}</p>`+\n              `<p class="studio">Volume ${d.vol}</p><h2>${d.title}</h2></span>`;', 'b.innerHTML=`${mark}<span class="tltxt"><p>${d.tag}</p>`+\n              `<p class="studio">${d.speed}</p><h2>${d.title}</h2></span>`;', 'catalogue labels');
  document = replaceRequired(document, 'b.innerHTML=`<span>${d.year} · Volume ${d.vol}</span>${d.title}`;', 'b.innerHTML=`<span>${d.tag} · ${d.speed}</span>${d.title}`;', 'menu labels');
  document = replaceRequired(document, 'mMeta.textContent=`${STUDIO} · ${d.year}`; mTitle.textContent=d.title;', 'mMeta.textContent=`${d.tag} · ${d.speed}`; mTitle.textContent=d.title;', 'mobile index labels');
  return document;
}
