import React from 'react';
import { CollectionPresentationProps } from '../../CollectionTheme';
import { CollectionAlbumCard } from '../../CollectionAlbumCard';
export function GlassPresentation(props: CollectionPresentationProps) {
  return <div className="ct-glass">{props.albums.map(album => <CollectionAlbumCard key={album.id} {...props} album={album} />)}</div>;
}
