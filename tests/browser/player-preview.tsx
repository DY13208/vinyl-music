import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/App';
import { BROWSE_DEMO_ALBUMS } from '../../src/data/browseDemoData';
import type { CollectionRepository } from '../../src/repositories/collection';
import '../../src/index.css';

// Original fixture, real App; this preview never writes the user's collection.
const titles=['微光起点','潮汐之间','绿房间','旧日航线','午后留声','夜色来信','慢行的月','远方有声','静默河岸','落针时刻','暮色未央','最后一盏灯'];
const requested=Number(new URLSearchParams(location.search).get('count')??12);
const tracks=titles.slice(0,Math.max(1,Math.min(12,Number.isFinite(requested)?requested:12))).map((title,i)=>({id:`preview-track-${i}`,title,number:i+1,duration:'1:30',durationSec:90}));
let albums=[{...BROWSE_DEMO_ALBUMS[0],tracks,trackCount:tracks.length,totalDuration:`${tracks.length*1.5}:00`}];
const repository:CollectionRepository={getAlbums:()=>albums,saveAlbum:album=>albums=[album,...albums],saveAlbums:items=>albums=[...items,...albums],updateAlbum:album=>albums=albums.map(item=>item.id===album.id?album:item),deleteAlbum:id=>albums=albums.filter(item=>item.id!==id)};
createRoot(document.getElementById('root')!).render(<App repository={repository}/>);
