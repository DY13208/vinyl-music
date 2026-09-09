import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayerView } from '../../src/views/PlayerView';
import { ALBUMS } from '../../src/data/mockData';
import { albumForSide } from '../../src/utils/vinylSides';
import '../../src/index.css';

function Acceptance() {
  const [index, setIndex] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [track, setTrack] = useState(0);
  const [report, setReport] = useState('Ready');
  const stable = useRef<Element | null>(null);
  const history = useRef<{ angle: string | null; phase: string | null }[]>([]);
  const album = albumForSide(ALBUMS[index], ALBUMS[index].tracks);
  useEffect(() => {
    const node = document.querySelector('.turntable-tonearm');
    if (!stable.current) stable.current = node;
    const observer = new MutationObserver(() => {
      const pose = { angle: node?.getAttribute('data-angle') ?? null, phase: node?.getAttribute('data-phase') ?? null };
      if (JSON.stringify(history.current.at(-1)) !== JSON.stringify(pose)) history.current.push(pose);
      setReport(JSON.stringify({ stable: document.querySelector('.turntable-tonearm') === stable.current, ...pose, history: history.current }));
    });
    observer.observe(document.querySelector('#player-view-container')!, {subtree:true,childList:true,attributes:true,attributeFilter:['data-angle','data-phase']});
    return () => observer.disconnect();
  }, []);
  return <><PlayerView album={album} currentTrack={album.tracks[track]} isPlaying={playing} progressPercent={progress}
    currentTimeSec={album.tracks[track].durationSec * progress / 100} durationSec={album.tracks[track].durationSec}
    onTogglePlay={() => setPlaying(p=>!p)} onNextTrack={()=>setTrack(t=>(t+1)%album.tracks.length)}
    onPrevTrack={()=>setTrack(t=>(t+album.tracks.length-1)%album.tracks.length)} onSeek={setProgress} onClose={()=>{}}
    onSelectTrack={t=>setTrack(album.tracks.findIndex(a=>a.id===t.id))} />
    <aside style={{position:'fixed',right:0,top:52,zIndex:100,background:'#151515',maxWidth:170,fontSize:10}}>
      <button onClick={()=>{setIndex(i=>(i+1)%ALBUMS.length);setTrack(0);setProgress(0);}}>Test change album</button>
      <button onClick={()=>setProgress(100)}>Test end groove</button>
      <output aria-label="Tonearm regression">{report}</output>
    </aside></>;
}
createRoot(document.getElementById('root')!).render(<Acceptance />);
