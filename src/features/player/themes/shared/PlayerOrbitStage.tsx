import React, { useMemo } from 'react';
import type { OrbitThemeId, PlayerStageProps } from '../PlayerTheme';
import { getOrbitItems, ORBIT_STAGE } from './orbitGeometry';
import { NowPlayingPointer } from './NowPlayingPointer';
import { PlayerOrbitCard } from './PlayerOrbitCard';
export function PlayerOrbitStage({theme, ...props}: PlayerStageProps & {theme:OrbitThemeId}) {
  const items=useMemo(()=>getOrbitItems(props.queue,props.currentTrack,theme),[props.queue,props.currentTrack,theme]);
  return <div className={`pt-stage pt-stage--${theme}`} data-playing={props.isPlaying}>
    <div className="pt-stage__canvas" style={{aspectRatio:`${ORBIT_STAGE.width}/${ORBIT_STAGE.height}`}}>
      <div className="pt-stage__wheel" aria-hidden="true" style={{width:`${ORBIT_STAGE.radius*2/ORBIT_STAGE.width*100}%`,left:`${(ORBIT_STAGE.centerX-ORBIT_STAGE.radius)/ORBIT_STAGE.width*100}%`,top:`${(ORBIT_STAGE.centerY-ORBIT_STAGE.radius)/ORBIT_STAGE.height*100}%`}}>
        <div className="pt-stage__wheel-copy"><strong>ORBIT</strong><span>REAL MUSIC<br/>LIVES IN CIRCLES</span></div>
      </div>
      <svg className="pt-orbit-rail" viewBox={`0 0 ${ORBIT_STAGE.width} ${ORBIT_STAGE.height}`} aria-hidden="true"><circle cx={ORBIT_STAGE.centerX} cy={ORBIT_STAGE.centerY} r={ORBIT_STAGE.sleeveRadius}/></svg>
      {items.map(item=><PlayerOrbitCard key={item.track.id} item={item} artwork={props.album.coverUrl} isPlaying={props.isPlaying} loading={props.isPreviewLoading} onActivate={()=>item.active?props.onTogglePlay():props.onSelectTrack(item.track)} />)}
      <NowPlayingPointer items={items} isPlaying={props.isPlaying} />
    </div>
  </div>;
}
