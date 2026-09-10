import React, { useId, useMemo } from 'react';
import { getPointerPath, OrbitItem } from './orbitGeometry';
export function NowPlayingPointer({items, isPlaying}: {items: OrbitItem[]; isPlaying: boolean}) {
  const marker = `pointer-${useId().replace(/:/g,'')}`;
  const path = useMemo(()=>getPointerPath(items),[items]);
  const active = items.find(item=>item.active);
  return <svg className="pt-pointer" viewBox="0 0 400 410" aria-label={`正在播放：${active?.track.title ?? ''}`} data-track-id={active?.track.id} data-playing={isPlaying}>
    <defs><marker id={marker} viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" strokeWidth="1" /></marker></defs>
    <path className="pt-pointer__line" d={path} markerEnd={`url(#${marker})`} />
    <text x="332" y="203">正在播放</text>
  </svg>;
}
