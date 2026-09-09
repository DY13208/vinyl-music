import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlbumDetailView } from '../../src/views/AlbumDetailView';
import { VinylDisc } from '../../src/components/VinylDisc';
import { ALBUMS } from '../../src/data/mockData';
import { Album } from '../../src/types';
import { TEXTURES } from '../../src/utils/vinylAppearance';
import '../../src/index.css';

const base = ALBUMS[2];
const fixture: Album = { ...base, title: '多盘验收 · 3LP', discs: [
  { disc: 1, sides: [{ side: 'A', tracks: base.tracks.slice(0,2) }, { side: 'B', tracks: base.tracks.slice(2,4) }] },
  { disc: 2, sides: [{ side: 'C', tracks: base.tracks.slice(4,6) }, { side: 'D', tracks: base.tracks.slice(6,8) }] },
  { disc: 3, sides: [{ side: 'E', tracks: base.tracks.slice(8) }, { side: 'F', tracks: [] }] },
] };
function Acceptance() {
  const [result, setResult] = useState('尚未播放');
  return <><div style={{width:390,maxWidth:'100%',margin:'auto'}}><AlbumDetailView album={fixture} isFavorite={false} onBack={() => {}} onToggleFavorite={() => {}} onPlayAlbum={() => {}}
    onSelectTrack={(album, track) => setResult(`选择 ${track.id}；队列 ${album.tracks.map(t => t.id).join(',')}`)} /></div>
    <output aria-label="播放回调结果" style={{display:'block',padding:20}}>{result}</output>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20,padding:30,background:'#524538'}}>
      {TEXTURES.map(texture => <figure key={texture}><VinylDisc coverUrl={base.coverUrl} albumTitle="TEXTURE ARCHIVE" texture={texture} type={texture === 'picture-base' ? 'picture' : 'black'} size={220} /><figcaption>{texture}</figcaption></figure>)}
    </div></>;
}
createRoot(document.getElementById('root')!).render(<Acceptance />);
