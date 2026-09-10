import React, { useMemo } from 'react';
import { VinylDisc } from '../../../../components/VinylDisc';
import type { OrbitThemeId, PlayerStageProps } from '../PlayerTheme';
import { getOrbitItems } from './orbitGeometry';
import { NowPlayingPointer } from './NowPlayingPointer';
import { PlayerOrbitCard } from './PlayerOrbitCard';
const rails: Record<OrbitThemeId,string> = {
  crescent:'M 55 23 C 333 52 333 350 55 390',
  halo:'M 158 57 A 130 140 0 1 1 157.9 57',
  nocturne:'M 22 364 C 350 209 278 142 24 30',
};
export function PlayerOrbitStage({theme, ...props}: PlayerStageProps & {theme:OrbitThemeId}) {
  const items=useMemo(()=>getOrbitItems(props.queue,props.currentTrack,theme),[props.queue,props.currentTrack,theme]);
  const side=props.album.discs?.flatMap(disc=>disc.sides).find(face=>face.tracks.some(track=>track.id===props.currentTrack.id))?.side;
  return <div className={`pt-stage pt-stage--${theme}`}>
    <div className="pt-stage__canvas">
      <svg className="pt-orbit-rail" viewBox="0 0 400 410" aria-hidden="true"><path d={rails[theme]} />{items.map(item=><circle key={item.track.id} cx={item.x} cy={item.y} r="3"/>)}</svg>
      <div className="pt-stage__vinyl"><VinylDisc coverUrl={props.album.coverUrl} albumTitle={props.album.title} artistName={props.album.artist} isPlaying={props.isPlaying} size="100%" side={side} labelImage={props.album.vinylLabel?.image} labelColor={props.album.vinylLabel?.color} /></div>
      {items.map(item=><PlayerOrbitCard key={item.track.id} item={item} artwork={props.album.coverUrl} isPlaying={props.isPlaying} loading={props.isPreviewLoading} onActivate={()=>item.active?props.onTogglePlay():props.onSelectTrack(item.track)} />)}
      <NowPlayingPointer items={items} isPlaying={props.isPlaying} />
    </div>
  </div>;
}
