import React, { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlbumDetailView } from '../../src/views/AlbumDetailView';
import { ALBUMS } from '../../src/data/mockData';
import '../../src/index.css';

function Regression() {
  const host = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState({ status: 'Click a side to record frames' });
  useEffect(() => {
    const root = host.current as HTMLDivElement;
    const disc = root.querySelector('.archive-object__disc .vinyl-disc')!;
    const texture = disc.querySelector('.vinyl-disc__texture')!;
    const label = disc.querySelector('.vinyl-disc__label')!;
    let frame = 0;
    let end = 0;
    let samples: any[] = [];
    let removals = 0;
    let sourceChanges = 0;
    const observer = new MutationObserver(records => records.forEach(record => {
      if (record.type === 'childList') for (const node of record.removedNodes) {
        if (node === disc || node.contains(disc) || node === texture || node === label) removals++;
      }
      if (record.target === texture && record.attributeName === 'src') sourceChanges++;
    }));
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    const sample = () => {
      const current = root.querySelector('.archive-object__disc .vinyl-disc')!;
      const side = current.getAttribute('data-side');
      const panel = root.querySelector('[role=tabpanel]')!;
      const numbers = Array.from(panel.querySelectorAll('.archive-track__number')).map(e => e.textContent);
      samples.push({
        side,
        synchronized: current.querySelector('.vinyl-disc__side')?.textContent === side &&
          root.querySelector('[role=tab][aria-selected=true] > span:last-child')?.textContent === `Side ${side}` &&
          panel.querySelector('.archive-tracks__heading p')?.textContent?.startsWith(`Side ${side}`) &&
          numbers.every(n => n?.startsWith(side!)),
        stableNodes: current === disc && current.querySelector('.vinyl-disc__texture') === texture && current.querySelector('.vinyl-disc__label') === label,
        discOpacity: getComputedStyle(current).opacity,
        surfaceTransform: getComputedStyle(current.querySelector('.vinyl-disc__surface')!).transform,
        labelOpacity: Number(getComputedStyle(label).opacity),
        panelOpacity: Number(getComputedStyle(panel).opacity),
        phase: current.getAttribute('data-transition'),
      });
      if (performance.now() < end) frame = requestAnimationFrame(sample);
      else {
        frame = 0;
        setReport({ status: JSON.stringify({ frames: samples.length, removals, sourceChanges,
          stableNodes: samples.every(s=>s.stableNodes), synchronized: samples.every(s=>s.synchronized),
          discAlwaysOpaque: samples.every(s=>s.discOpacity === '1'), surfaceNeverMoves: samples.every(s=>s.surfaceTransform === 'none'),
          phases: [...new Set(samples.map(s=>s.phase))], finalSide: samples.at(-1).side,
          labelFadeRange: [Math.min(...samples.map(s=>s.labelOpacity)), Math.max(...samples.map(s=>s.labelOpacity))],
          panelFadeRange: [Math.min(...samples.map(s=>s.panelOpacity)), Math.max(...samples.map(s=>s.panelOpacity))],
        }) });
      }
    };
    const start = (event: Event) => {
      if (!(event.target as Element).closest('[role=tab]')) return;
      end = performance.now() + 550;
      if (!frame) { samples = []; removals = 0; sourceChanges = 0; frame = requestAnimationFrame(sample); }
    };
    root.addEventListener('click', start, true);
    root.addEventListener('keydown', start, true);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); root.removeEventListener('click',start,true); root.removeEventListener('keydown',start,true); };
  }, []);
  return <><div ref={host} style={{maxWidth:430,margin:'auto'}}><AlbumDetailView album={ALBUMS[8]} isFavorite={false} onBack={()=>{}} onPlayAlbum={()=>{}} onSelectTrack={()=>{}} onToggleFavorite={()=>{}} /></div><output aria-label="Frame regression report" style={{display:'block',padding:16,overflowWrap:'anywhere'}}>{report.status}</output></>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Regression /></StrictMode>);
