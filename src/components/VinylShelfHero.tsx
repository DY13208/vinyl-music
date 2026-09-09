import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Album } from '../types';
import { VinylCarouselItem } from './VinylCarouselItem';
import { audioEngine } from '../services/audioEngine';

interface VinylShelfHeroProps {
  albums: Album[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  onOpenAlbumDetail?: (album: Album) => void;
}

export const VinylShelfHero: React.FC<VinylShelfHeroProps> = ({
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

    // Damping resistance at left and right boundaries
    let resistedDelta = delta;
    if ((currentIndex === 0 && delta > 0) || (currentIndex === albums.length - 1 && delta < 0)) {
      resistedDelta = delta * 0.22;
    }

    currentDragRef.current = resistedDelta;
    setDragOffset(resistedDelta);
  };

  // Drag end with inertia, spring snap, and haptic feedback
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const delta = currentDragRef.current;
    const velocity = velocityRef.current;
    const distanceThreshold = 46;
    const velocityThreshold = 0.28;

    if (
      (delta < -distanceThreshold || velocity < -velocityThreshold) &&
      currentIndex < albums.length - 1
    ) {
      onSelectIndex(currentIndex + 1);
      audioEngine.triggerHaptic('light');
    } else if (
      (delta > distanceThreshold || velocity > velocityThreshold) &&
      currentIndex > 0
    ) {
      onSelectIndex(currentIndex - 1);
      audioEngine.triggerHaptic('light');
    }

    setDragOffset(0);
    currentDragRef.current = 0;
    velocityRef.current = 0;
  }, [isDragging, currentIndex, albums.length, onSelectIndex]);

  // Keyboard left/right navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onSelectIndex(currentIndex - 1);
        audioEngine.triggerHaptic('light');
      } else if (e.key === 'ArrowRight' && currentIndex < albums.length - 1) {
        onSelectIndex(currentIndex + 1);
        audioEngine.triggerHaptic('light');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, albums.length, onSelectIndex]);

  // Optimal spacing: 252px allows ~16%-19% neighbor visibility on standard 390px viewport
  const itemSpacing = 252;

  return (
    <div
      ref={containerRef}
      id="vinyl-shelf-hero"
      className="relative w-full h-[270px] flex items-center justify-center select-none overflow-hidden touch-pan-y"
      style={{
        perspective: '1100px',
        perspectiveOrigin: '50% 50%',
      }}
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
        // Render current item and up to 2 items on left and right
        if (Math.abs(offset) > 2) return null;

        const currentX = offset * itemSpacing + dragOffset;
        const normDist = Math.abs(currentX) / itemSpacing;

        // Scale: 1 at center, drops to ~0.85 when 1 unit away
        const scale = Math.max(0.84, 1 - Math.min(0.15, normDist * 0.15));

        // Opacity: 1 at center, drops to ~0.44 when 1 unit away
        const opacity = Math.max(0.38, 1 - Math.min(0.56, normDist * 0.56));

        // translateY: 0 at center, drops 5px down for neighbors
        const translateY = Math.min(6, normDist * 6);

        // rotateY: ±8deg for shelf perspective
        const continuousProgress = offset - dragOffset / itemSpacing;
        const rotateY = Math.max(-9, Math.min(9, -continuousProgress * 8));

        // Blur: 0 at center, ~2.5px for neighbors
        const blurAmount = Math.min(3, normDist * 2.5);

        // zIndex: highest at center
        const zIndex = Math.max(10, Math.round(30 - normDist * 10));

        const isCenter = offset === 0;

        return (
          <div
            key={album.id}
            id={`vinyl-shelf-item-${album.id}`}
            onClick={() => {
              if (!isCenter && !isDragging) {
                onSelectIndex(index);
                audioEngine.triggerHaptic('light');
              } else if (isCenter && !isDragging && onOpenAlbumDetail) {
                onOpenAlbumDetail(album);
              }
            }}
            className="absolute flex items-center justify-center cursor-pointer will-change-transform"
            style={{
              transform: `translateX(${currentX}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`,
              opacity,
              zIndex,
              filter: blurAmount > 0.4 ? `blur(${blurAmount}px)` : 'none',
              transition: isDragging
                ? 'none'
                : 'transform 0.42s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease, filter 0.35s ease',
            }}
          >
            <VinylCarouselItem
              album={album}
              isPlaying={isPlaying}
              isCenter={isCenter}
              discSize={256}
              sleeveSize={196}
            />
          </div>
        );
      })}
    </div>
  );
};
