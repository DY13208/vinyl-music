import React from 'react';
import { Album } from '../types';
import { AlbumSleeve } from './AlbumSleeve';
import { VinylDisc } from './VinylDisc';
import { getVinylAppearance } from '../utils/vinylAppearance';

export const VinylCarouselItem: React.FC<{ album: Album }> = ({ album }) => {
  const appearance = getVinylAppearance(album);
  return <div className="vinyl-object">
    <div className="vinyl-object__disc" aria-hidden="true">
      <VinylDisc coverUrl={album.coverUrl} albumTitle={album.title} artistName={album.artist} size="var(--disc-size)" type={appearance.variant} texture={appearance.texture} labelColor={appearance.label?.color} labelImage={appearance.label?.image} labelText={appearance.label?.text} rpm={album.rpm} />
    </div>
    <div className="vinyl-object__sleeve">
      <AlbumSleeve coverUrl={album.coverUrl} title={album.title} artist={album.artist} size="var(--sleeve-size)" />
    </div>
  </div>;
};
