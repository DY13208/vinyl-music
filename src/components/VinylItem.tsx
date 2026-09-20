import React from 'react';
import { Album } from '../types';
import { VinylDisc } from './VinylDisc';
import { AlbumSleeve } from './AlbumSleeve';
import { getVinylAppearance } from '../utils/vinylAppearance';

export const VinylItem: React.FC<{ album: Album; onOpen: () => void }> = ({ album, onOpen }) => {
  const appearance = getVinylAppearance(album);
  return <button className="vinyl-item" type="button" onClick={onOpen}
    data-album-id={album.id} aria-label={`查看 ${album.title} · ${album.artist}`}>
    <div className="vinyl-item__visual" aria-hidden="true">
      <div className="vinyl-item__disc"><VinylDisc coverUrl={album.coverUrl} albumTitle={album.title}
        artistName={album.artist} type={appearance.variant} texture={appearance.texture}
        labelColor={appearance.label?.color} labelImage={appearance.label?.image} labelText={appearance.label?.text}
        rpm={album.rpm} size="100%" /></div>
      <div className="vinyl-item__sleeve"><AlbumSleeve coverUrl={album.coverUrl} title={album.title} size="100%" /></div>
    </div>
    <div className="vinyl-item__meta" translate="no">
      <strong className="vinyl-item__title" title={album.title}>{album.title}</strong>
      <span className="vinyl-item__artist" title={album.artist}>{album.artist}</span>
    </div>
  </button>;
};
