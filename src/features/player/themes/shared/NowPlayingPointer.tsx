import React, { useId } from 'react';
import { getPointerPath, ORBIT_STAGE, type OrbitItem } from './orbitGeometry';
export function NowPlayingPointer({items, isPlaying}: {items: OrbitItem[]; isPlaying: boolean}) {
  const marker = `pointer-${useId().replace(/:/g,'')}`;
  const active = items.find(item=>item.active);
  return <svg className="pt-pointer" viewBox={`0 0 ${ORBIT_STAGE.width} ${ORBIT_STAGE.height}`} role="img" aria-label={`当前曲目：${active?.track.title ?? ''}`} data-track-id={active?.track.id} data-playing={isPlaying}>
    <defs><marker id={marker} viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" strokeWidth="1" /></marker></defs>
    <path className="pt-pointer__line" d={getPointerPath(items)} markerEnd={`url(#${marker})`} />
    <circle cx="326" cy="200" r="3" fill="currentColor" />
    <text x="326" y="184" textAnchor="middle">{isPlaying ? '正在播放' : '当前曲目'}</text>
  </svg>;
}
