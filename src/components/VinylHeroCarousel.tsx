import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Album } from '../types';
import { VinylDisc } from './VinylDisc';
import { hapticsService } from '../platform/platformService';

interface VinylHeroCarouselProps {
  albums: Album[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  onOpenAlbumDetail?: (album: Album) => void;
}

export const VinylHeroCarousel: React.FC<VinylHeroCarouselProps> = ({
  albums,
  currentIndex,
  onSelectIndex,
  isPlaying,
  onOpenAlbumDetail,
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentDragRef = useRef(0);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag start handler
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    lastXRef.current = clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    currentDragRef.current = 0;
  };

  // Drag move with resistance
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const now = Date.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = clientX - lastXRef.current;

    velocityRef.current = dx / dt;
    lastXRef.current = clientX;
    lastTimeRef.current = now;

    const delta = clientX - startXRef.current;

    // Damping resistance at edges
    let resistedDelta = delta;
    if ((currentIndex === 0 && delta > 0) || (currentIndex === albums.length - 1 && delta < 0)) {
      resistedDelta = delta * 0.25;
    }

    currentDragRef.current = resistedDelta;
    setDragOffset(resistedDelta);
  };

  // Drag end with inertia and snap
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const delta = currentDragRef.current;
    const velocity = velocityRef.current;
    const threshold = 48; // Distance threshold for flipping record
    const velocityThreshold = 0.32; // Velocity threshold for flick gesture

    if ((delta < -threshold || velocity < -velocityThreshold) && currentIndex < albums.length - 1) {
      onSelectIndex(currentIndex + 1);
      hapticsService.triggerHaptic('light');
    } else if ((delta > threshold || velocity > velocityThreshold) && currentIndex > 0) {
      onSelectIndex(currentIndex - 1);
      hapticsService.triggerHaptic('light');
    }

    setDragOffset(0);
    currentDragRef.current = 0;
    velocityRef.current = 0;
  }, [isDragging, currentIndex, albums.length, onSelectIndex]);

  // Desktop keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onSelectIndex(currentIndex - 1);
        hapticsService.triggerHaptic('light');
      } else if (e.key === 'ArrowRight' && currentIndex < albums.length - 1) {
        onSelectIndex(currentIndex + 1);
        hapticsService.triggerHaptic('light');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, albums.length, onSelectIndex]);

  // Item spacing: 246px creates ~15%-18% visible edge on 375-390px mobile screens
  const itemSpacing = 246;

  return (
    <div
      ref={containerRef}
      id="vinyl-hero-carousel"
      className="relative w-full h-[256px] flex items-center justify-center select-none overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {albums.map((album, index) => {
        const offset = index - currentIndex;
        if (Math.abs(offset) > 2) return null;

        const currentX = offset * itemSpacing + dragOffset;
        const normDist = Math.abs(currentX) / itemSpacing;

        // Scale: 1 at center, ~0.78 when 1 unit away
        const scale = Math.max(0.78, 1 - Math.min(0.22, normDist * 0.22));
        // Opacity: 1 at center, ~0.36 when 1 unit away
        const opacity = Math.max(0.35, 1 - Math.min(0.65, normDist * 0.65));
        // zIndex: highest at center
        const zIndex = Math.max(10, Math.round(30 - normDist * 10));

        const isCenter = offset === 0;

        return (
          <div
            key={album.id}
            id={`vinyl-carousel-item-${album.id}`}
            onClick={() => {
              if (!isCenter && !isDragging) {
                onSelectIndex(index);
                hapticsService.triggerHaptic('light');
              } else if (isCenter && !isDragging && onOpenAlbumDetail) {
                onOpenAlbumDetail(album);
              }
            }}
            className="absolute flex items-center justify-center cursor-pointer will-change-transform"
            style={{
              transform: `translateX(${currentX}px) scale(${scale})`,
              opacity,
              zIndex,
              filter: normDist > 0.3 ? 'blur(0.6px)' : 'none',
              transition: isDragging
                ? 'none'
                : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.32s ease, filter 0.32s ease',
            }}
          >
            {/* Pure Centered Vinyl Disc: Disc in back, square cover (45% diameter) in center */}
            <VinylDisc
              coverUrl={album.coverUrl}
              albumTitle={album.title}
              artistName={album.artist}
              isPlaying={isCenter && isPlaying}
              size={244}
              showAmbientGlow={false}
            />
          </div>
        );
      })}
    </div>
  );
};
