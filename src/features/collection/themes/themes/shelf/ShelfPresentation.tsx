import React from 'react';
import { CollectionPresentationProps } from '../../CollectionTheme';
import { CollectionAlbumCard } from '../../CollectionAlbumCard';
export function ShelfPresentation(props: CollectionPresentationProps) {
  return <div className="ct-shelf">{props.albums.map(album => <CollectionAlbumCard key={album.id} {...props} album={album} />)}</div>;
}
