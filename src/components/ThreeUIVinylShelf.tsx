import React, { useRef } from 'react';
import { Album } from '../types';
import { VinylItem } from './VinylItem';
import { hapticsService } from '../platform/platformService';
import './VinylCollectionShelf.css';

interface ThreeUIVinylShelfProps {
  items: Album[];
  page: number;
  onPageChange: (page: number) => void;
  onOpenAlbumDetail: (album: Album) => void;
}
const PAGE_SIZE = 6;

/** The existing cabinet now presents the same image-backed record as Home and Album Detail. */
export const ThreeUIVinylShelf: React.FC<ThreeUIVinylShelfProps> = ({ items, page, onPageChange, onOpenAlbumDetail }) => {
  const gesture = useRef({ x: 0, y: 0, swiped: false });
  const visibleItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return <div className="vinyl-collection-shelf" onPointerDown={event => {
    gesture.current = { x: event.clientX, y: event.clientY, swiped: false };
  }} onPointerUp={event => {
    const dx = event.clientX - gesture.current.x;
    const dy = event.clientY - gesture.current.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      gesture.current.swiped = true;
      onPageChange(Math.max(0, Math.min(Math.ceil(items.length / PAGE_SIZE) - 1, page + (dx < 0 ? 1 : -1))));
      hapticsService.triggerHaptic('light');
    }
  }}>
    {Array.from({ length: Math.ceil(visibleItems.length / 2) }, (_, row) => <div className="vinyl-collection-shelf__row" key={row}>
      <div className="vinyl-collection-shelf__content">
      {visibleItems.slice(row * 2, row * 2 + 2).map(album =>
        <VinylItem key={album.id} album={album} onOpen={() => {
            if (gesture.current.swiped) { gesture.current.swiped = false; return; }
            onOpenAlbumDetail(album); hapticsService.triggerHaptic('light');
          }} />
      )}
      </div>
      <div className="vinyl-collection-shelf__edge" aria-hidden="true" />
    </div>)}
  </div>;
};
