import React, { useLayoutEffect, useRef } from 'react';
import { AlbumArtwork } from '../AlbumArtwork';
import { AlbumLayoutProps } from './types';

export function GalleryGrid({ albums, selectedAlbumId, onSelectAlbum, renderArtwork }: AlbumLayoutProps) {
  const root = useRef<HTMLDivElement>(null);
  const selected = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const align = () => {
      const grid = root.current;
      const item = selected.current;
      if (!grid || !item) return;
      const top = item.offsetTop;
      if (top < grid.scrollTop || top + item.offsetHeight > grid.scrollTop + grid.clientHeight) {
        grid.scrollTop = Math.max(0, top - Math.max(0, (grid.clientHeight - item.offsetHeight) / 2));
      }
    };
    align();
    if (!root.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(align);
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [selectedAlbumId, albums]);

  return <div ref={root} className="gallery-grid" role="region" aria-label="封面矩阵墙">
    {albums.map(album => <button key={album.id} ref={album.id === selectedAlbumId ? selected : undefined} className="gallery-grid__album" type="button"
      aria-pressed={album.id === selectedAlbumId} aria-label={`选择专辑：${album.title}，${album.artist}`} onClick={() => onSelectAlbum(album.id)}>
      <div className="gallery-grid__sleeve">{renderArtwork ? renderArtwork(album) : <AlbumArtwork src={album.coverUrl} />}</div>
      <strong title={album.title}>{album.title}</strong><span>{album.artist}</span>
    </button>)}
  </div>;
}
