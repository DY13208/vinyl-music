import React from 'react';
import { VinylDisc } from '../../../../../components/VinylDisc';
import { getVinylAppearance } from '../../../../../utils/vinylAppearance';
import type { PlayerStageProps } from '../../PlayerTheme';

export function CrescentPlayer(props:PlayerStageProps) {
  const appearance = getVinylAppearance(props.album);
  const side = props.album.discs?.flatMap(disc => disc.sides).find(face => face.tracks.some(track => track.id === props.currentTrack.id))?.side;
  return <section className="crescent-stage" aria-label="当前专辑唱片" data-playing={props.isPlaying} data-vinyl-type={appearance.variant}>
    <div className="crescent-stage__crop">
      <div className="crescent-stage__disc">
          <VinylDisc size="100%" coverUrl={props.album.coverUrl} labelImage={appearance.label?.image} labelColor={appearance.label?.color} labelText={appearance.label?.text} albumTitle={props.album.title} artistName={props.album.artist} type={appearance.variant} texture={appearance.texture} vinylColors={appearance.colors} side={side} rpm={props.album.rpm} isPlaying={props.isPlaying}/>
      </div>
    </div>
  </section>;
}
