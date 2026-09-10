import React from 'react';
import { AlbumArtwork } from '../../../../../components/AlbumArtwork';
import type { CollectionPresentationProps } from '../../CollectionTheme';
export function CoverWallCollectionView({albums,selectedAlbumId,onOpenAlbumDetail,onSelectAlbum}:CollectionPresentationProps) {
  return <div className="ct-cover-wall" aria-label="封面墙">
    {albums.map(album=><button key={album.id} type="button" className="ct-cover-wall__album" data-album-id={album.id} data-selected={selectedAlbumId===album.id} aria-label={`打开专辑：${album.title}，${album.artist}`} onFocus={()=>onSelectAlbum?.(album.id)} onClick={()=>onOpenAlbumDetail(album)}>
      <AlbumArtwork src={album.coverUrl}/>
    </button>)}
  </div>;
}
