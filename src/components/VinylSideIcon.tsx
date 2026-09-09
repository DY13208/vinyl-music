import React from 'react';
import { Album } from '../types';
import { getVinylAppearance } from '../utils/vinylAppearance';
import { VinylDisc } from './VinylDisc';

export function VinylSideIcon({ album, side, active }: { album: Album; side: string; active: boolean }) {
  const appearance = getVinylAppearance(album);
  return <span className={`vinyl-side-icon ${active ? 'is-active' : ''}`} aria-hidden="true">
    <VinylDisc coverUrl={album.coverUrl} albumTitle={album.title} side={side} size={30}
      type={appearance.variant} texture={appearance.texture} labelColor={active ? '#2fe92b' : '#c3c0b8'} />
  </span>;
}
