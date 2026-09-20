import React, { useRef } from 'react';
import { VinylCarouselItem } from '../VinylCarouselItem';
import { AlbumLayoutProps } from './types';

export function SpineCarousel({ albums, selectedAlbumId, onSelectAlbum, onOpenAlbumDetail, renderArtwork }: AlbumLayoutProps) {
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const index = Math.max(0, albums.findIndex(album => album.id === selectedAlbumId));
  const select = (next: number) => { if (albums.length) onSelectAlbum(albums[(next + albums.length) % albums.length].id); };
  // Bound DOM/texture work independently of collection size; never repeat a record.
  const nearby = Array.from({ length: Math.min(7, albums.length) }, (_, slot) => {
    const offset = slot - Math.floor(Math.min(7, albums.length) / 2);
    return { album: albums[(index + offset + albums.length) % albums.length], offset };
  });
  return <div className="spine-carousel" role="region" aria-label="唱片长廊" tabIndex={0}
    onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? albums.length - 1 : null;
      if (next !== null) { event.preventDefault(); select(next); }
    }}
    onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      suppressClick.current = false;
    }}
    onPointerMove={event => {
      const start = pointer.current;
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }}
    onPointerUp={event => {
      const start = pointer.current;
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(event.clientY - start.y)) select(index + (dx < 0 ? 1 : -1));
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      pointer.current = null;
    }}
    onPointerCancel={() => { pointer.current = null; suppressClick.current = false; }}
    onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
    {nearby.map(({ album, offset }) => <button key={album.id} type="button" className={`spine-carousel__album ${offset === 0 ? 'is-selected' : ''}`}
      style={{ '--offset': offset, '--distance': Math.abs(offset), zIndex: 5 - Math.abs(offset) } as React.CSSProperties}
      aria-current={offset === 0 ? 'true' : undefined} tabIndex={offset === 0 ? 0 : -1}
      aria-label={`${offset === 0 ? '打开' : '浏览'}专辑：${album.title}`} onDragStart={event => event.preventDefault()}
      onClick={() => offset === 0 ? onOpenAlbumDetail(album) : onSelectAlbum(album.id)}>{renderArtwork ? renderArtwork(album) : <VinylCarouselItem album={album} />}</button>)}
  </div>;
}
