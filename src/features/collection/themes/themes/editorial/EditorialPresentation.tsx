import React from 'react';
import { CollectionPresentationProps } from '../../CollectionTheme';
import { CollectionAlbumCard } from '../../CollectionAlbumCard';
export function EditorialPresentation(props: CollectionPresentationProps) {
  const [featured, ...remaining] = props.albums;
  return <div className="ct-editorial"><section className="ct-editorial__feature"><p className="ct-editorial__caption">收藏焦点 <span>{featured?.year}</span></p>{featured && <CollectionAlbumCard {...props} album={featured} featured />}</section><div className="ct-editorial__gallery">{remaining.map(album => <CollectionAlbumCard key={album.id} {...props} album={album} />)}</div></div>;
}
