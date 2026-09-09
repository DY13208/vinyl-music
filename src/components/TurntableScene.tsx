import React from 'react';
import { Album } from '../types';
import { getVinylAppearance } from '../utils/vinylAppearance';
import { VinylDisc } from './VinylDisc';
import { PhotographicTonearm } from './PhotographicTonearm';

export const TurntableScene: React.FC<{ album: Album; side?: string; isPlaying: boolean; progressPercent: number; onShowLyrics: () => void }> =
({ album, side = 'A', isPlaying, progressPercent, onShowLyrics }) => {
  const appearance = getVinylAppearance(album);
  return <section className="turntable-scene" aria-label="俯视唱机">
    <div className="turntable-stage">
      <img className="turntable-plinth" src="/assets/turntable/turntable-plinth.webp" alt="" draggable={false} />
      <button className="turntable-record" type="button" aria-label="点击唱片查看歌词" onClick={onShowLyrics}>
        <VinylDisc coverUrl={album.coverUrl} albumTitle={album.title} artistName={album.artist}
          size="100%" type={appearance.variant} texture={appearance.texture} labelColor={appearance.label?.color}
          labelImage={appearance.label?.image} labelText={appearance.label?.text} rpm={album.rpm} side={side} isPlaying={isPlaying} />
      </button>
      <PhotographicTonearm albumId={album.id} isPlaying={isPlaying} progressPercent={progressPercent} />
    </div>
  </section>;
};
