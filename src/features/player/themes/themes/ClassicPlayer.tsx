import React from 'react';
import { TurntableScene } from '../../../../components/TurntableScene';
import type { PlayerStageProps } from '../PlayerTheme';
export function ClassicPlayer(props:PlayerStageProps) {
  const side=props.album.discs?.flatMap(disc=>disc.sides).find(face=>face.tracks.some(track=>track.id===props.currentTrack.id))?.side;
  return <TurntableScene album={props.album} side={side} isPlaying={props.isPlaying} progressPercent={props.progressPercent} onShowLyrics={props.onShowLyrics}/>;
}
