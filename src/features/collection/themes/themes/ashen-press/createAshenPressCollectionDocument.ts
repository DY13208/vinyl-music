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
      vol: roman[index],
      shelf: index < 5 ? 0 : 1,
      slot: index % 5,
      ...palettes[index],
      blurb: album.description?.trim() || `${album.artist} · ${album.label}`,
      coverUrl: album.coverUrl || '/assets/cover-placeholder.svg',
    };
  });

  const header = `<header>
  <div class="brand"><span class="mark rise" data-d="35"><svg viewBox="0 0 24 24"><path d="M12 2c1.6 4.1 5.2 5.7 5.2 10a5.2 5.2 0 0 1-10.4 0C6.8 7.7 10.4 6.1 12 2z"/><path d="M6 20h12v1.6H6z"/></svg></span><span class="brandname rise" data-d="70">我的立体唱片架</span></div>
  <div class="right"><span class="collection-count rise" data-d="285">${escapeMarkup(albums.length)} 张 · ${String(page + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}</span></div>
</header>`;

  const overrides = `<style id="vinyl-ashen-collection-adaptation">
  header{padding-top:env(safe-area-inset-top);height:calc(60px + env(safe-area-inset-top))}
  .brand{min-width:0}.brandname{max-width:min(58vw,620px);overflow:hidden;text-overflow:ellipsis}
  .collection-count{font:500 11px/1 Inter,sans-serif;letter-spacing:.08em;color:var(--muted);white-space:nowrap}
  .detail .acts{flex-wrap:wrap}.detail .acts button,.mbar-acts button{cursor:pointer}
  .detail .acts button:first-child,.mbar-acts .solid{background:var(--ink);color:#f6efe1}
  .detail button:focus-visible,.mbar button:focus-visible,.tli:focus-visible,.menu button:focus-visible{outline:2px solid #241a12;outline-offset:3px}
  @media(max-width:700px){
    header{padding-inline:10px}.brandname{font-size:18px;max-width:54vw}.collection-count{font-size:9px}
    .mbar{padding-bottom:max(18px,env(safe-area-inset-bottom))}.mbar-txt{min-width:0}.mbar-txt h2{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:48vw}
  }
  @media(max-width:370px){.mark{display:none}.brandname{max-width:50vw;font-size:16px}.mbar-acts button{padding-inline:14px}.mbar-txt h2{max-width:42vw}}
  @media(prefers-reduced-motion:reduce){canvas#gl,.rise,.detail,.mbar{transition-duration:.01ms!important}}
  </style>`;

  let document = canonicalAshenPressHtml;
  document = replaceRequired(document, '<title>Ashen Press — The Art Book Shelf</title>', '<title>我的立体唱片架 · Vinyl Shelf</title>', 'title');
  document = replaceRequired(document, /<header>[\s\S]*?<\/header>/, header, 'header');
  document = replaceRequired(document, '<button id="detail-look">Look inside</button>', '<button id="detail-open">打开专辑</button><button id="detail-look">翻到背面</button>', 'desktop album actions');
  document = replaceRequired(document, '<button id="detail-close">Close</button>', '<button id="detail-close">关闭</button>', 'desktop close');
  document = replaceRequired(document, '<button id="mbar-details">Details</button>', '<button id="mbar-details">详情</button>', 'mobile details');
  document = replaceRequired(document, '<button class="solid" id="mbar-look">Look inside</button>', '<button class="solid" id="mbar-look">打开专辑</button>', 'mobile album action');
  document = replaceRequired(document, '</style>', `</style>${overrides}`, 'style overrides');
  document = replaceRequired(document, "const STUDIO = 'FromSoftware';", "const STUDIO = 'VINYL SHELF';\nfunction vinylMessage(action,payload){parent.postMessage(Object.assign({type:'vinyl-collection-ashen-press',action:action},payload||{}),'*');}", 'studio and bridge');
  document = replaceRequired(document, /const BOOKS = \[[\s\S]*?\n\];/, `const BOOKS = ${safeJson(volumes)};`, 'collection volumes');
  document = replaceRequired(document, 'const src=PLATE_SRC[b.id];', 'const src=b.coverUrl||PLATE_SRC[b.id];', 'album cover source');
  document = replaceRequired(document, 'const im=new Image();\n    im.onload=', "const im=new Image();\n    if(/^https?:/i.test(src)) im.crossOrigin='anonymous';\n    im.onload=", 'cross-origin cover loading');
  document = replaceRequired(document, "const dLook=document.getElementById('detail-look'), dClose=document.getElementById('detail-close');", "const dLook=document.getElementById('detail-look'), dOpen=document.getElementById('detail-open'), dClose=document.getElementById('detail-close');", 'desktop open binding');
  document = replaceRequired(document, "dClose.addEventListener('click',e=>{e.stopPropagation();clearActive();});", "dOpen.addEventListener('click',e=>{e.stopPropagation();const d=S.active&&S.active.data;if(d&&d.albumId)vinylMessage('open-album',{albumId:d.albumId});});\ndClose.addEventListener('click',e=>{e.stopPropagation();clearActive();});", 'desktop open handler');
  document = replaceRequired(document, "mLook.addEventListener('click',e=>{e.stopPropagation();lookInside(books[M.index]);});", "mLook.addEventListener('click',e=>{e.stopPropagation();const d=books[M.index]&&books[M.index].data;if(d&&d.albumId)vinylMessage('open-album',{albumId:d.albumId});});", 'mobile open handler');
  return document;
}
