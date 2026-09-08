import React, { useState, useRef, useEffect } from 'react';
import { Album } from '../types';
import { VinylDisc } from './VinylDisc';
import { Play, Pause, Heart, Info } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface VinylHeroCarouselProps {
  albums: Album[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  currentTrackTitle?: string;
  onTogglePlay: (album: Album) => void;
  onOpenAlbumDetail: (album: Album) => void;
  onToggleFavorite: (albumId: string) => void;
  favorites: string[];
}

export const VinylHeroCarousel: React.FC<VinylHeroCarouselProps> = ({
  albums,
  currentIndex,
  onSelectIndex,
  isPlaying,
  currentTrackTitle = '',
  onTogglePlay,
  onOpenAlbumDetail,
  onToggleFavorite,
  favorites,
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentDragRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentAlbum = albums[currentIndex] || albums[0];
  const isCurrentFavorite = favorites.includes(currentAlbum?.id);

  // Handle Drag / Swipe gestures with resistance and momentum
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    currentDragRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = clientX - startXRef.current;
    // Apply rubber-band resistance at limits
    let resistedDelta = delta;
    if ((currentIndex === 0 && delta > 0) || (currentIndex === albums.length - 1 && delta < 0)) {
      resistedDelta = delta * 0.35;
    }
    currentDragRef.current = resistedDelta;
    setDragOffset(resistedDelta);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const delta = currentDragRef.current;
    const threshold = 60; // drag threshold in px to change record

    if (delta < -threshold && currentIndex < albums.length - 1) {
      onSelectIndex(currentIndex + 1);
      audioEngine.triggerHaptic('light');
    } else if (delta > threshold && currentIndex > 0) {
      onSelectIndex(currentIndex - 1);
      audioEngine.triggerHaptic('light');
    }

    setDragOffset(0);
    currentDragRef.current = 0;
  };

  // Keyboard navigation for desktop convenience
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

  return (
    <div
      ref={containerRef}
      id="vinyl-hero-container"
      className="relative w-full flex flex-col items-center select-none pt-1 pb-4 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Visual background ambient color wash (Subtle low-opacity tone matching record) */}
      <div
        className="absolute top-12 w-64 h-64 rounded-full filter blur-[70px] pointer-events-none transition-colors duration-1000"
        style={{
          backgroundColor: currentAlbum.color,
          opacity: 0.22,
        }}
      />

      {/* 3D Turntable Carousel Viewport */}
      <div className="relative w-full h-[310px] sm:h-[350px] flex items-center justify-center">
        {albums.map((album, index) => {
          const offsetIndex = index - currentIndex;
          // Hide items beyond +/- 2 for performance & clarity
          if (Math.abs(offsetIndex) > 2) return null;

          const isCenter = offsetIndex === 0;
          const isLeft = offsetIndex < 0;
          const isRight = offsetIndex > 0;

          // Drag translation offset calculation
          const itemDragPercent = dragOffset / 320;
          const effectiveOffset = offsetIndex - itemDragPercent;

          // Compute 3D values according to design specs:
          // scale 1 -> 0.86, opacity 1 -> 0.4, blur 0 -> 4px, light tilt
          let scale = 1;
          let opacity = 1;
          let blur = 0;
          let translateX = effectiveOffset * 220;
          let rotateY = 0;
          let zIndex = 30;

          if (isCenter) {
            scale = 1 - Math.min(0.14, Math.abs(itemDragPercent) * 0.14);
            opacity = 1 - Math.min(0.4, Math.abs(itemDragPercent) * 0.4);
            blur = Math.min(3, Math.abs(itemDragPercent) * 3);
            zIndex = 30;
          } else {
            const distance = Math.abs(offsetIndex);
            scale = Math.max(0.76, 0.86 - (distance - 1) * 0.08);
            opacity = Math.max(0.2, 0.45 - (distance - 1) * 0.15);
            blur = 3.5;
            rotateY = isLeft ? 12 : -12;
            translateX = offsetIndex * (offsetIndex > 0 ? 210 : -210) + dragOffset * 0.6;
            zIndex = 20 - distance;
          }

          return (
            <div
              key={album.id}
              id={`vinyl-carousel-item-${album.id}`}
              onClick={() => {
                if (!isCenter) {
                  onSelectIndex(index);
                  audioEngine.triggerHaptic('light');
                }
              }}
              className="absolute flex items-center justify-center transition-all cursor-pointer will-change-transform"
              style={{
                transform: `translateX(${translateX}px) scale(${scale}) perspective(800px) rotateY(${rotateY}deg)`,
                opacity,
                filter: `blur(${blur}px)`,
                zIndex,
                transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s ease',
              }}
            >
              {/* Record Ensemble: Sleeve + Exposed Vinyl Disc */}
              <div className="relative flex items-center justify-center w-[260px] h-[260px] sm:w-[290px] sm:h-[290px]">
                {/* Vinyl Disc sliding/peeking out from the sleeve */}
                <div
                  className="absolute z-10 transition-transform duration-700 ease-out"
                  style={{
                    transform: isCenter
                      ? isPlaying
                        ? 'translateX(46px)'
                        : 'translateX(38px)'
                      : 'translateX(20px)',
                  }}
                >
                  <VinylDisc
                    coverUrl={album.coverUrl}
                    albumTitle={album.title}
                    artistName={album.artist}
                    isPlaying={isCenter && isPlaying}
                    size={220}
                    rpm={album.rpm}
                    showAmbientGlow={isCenter}
                  />
                </div>

                {/* Album Cover Card (Sleeve) with subtle spine shadow & matte paper finish */}
                <div
                  className="relative z-20 w-[190px] h-[190px] sm:w-[210px] sm:h-[210px] rounded-[4px] overflow-hidden select-none"
                  style={{
                    backgroundColor: '#0F0F0F',
                    border: '1px solid #26272D',
                    boxShadow: isCenter
                      ? '-8px 12px 28px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255,255,255,0.06)'
                      : '-4px 8px 16px rgba(0, 0, 0, 0.7)',
                    transform: 'translateX(-30px)',
                  }}
                >
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover pointer-events-none"
                    loading="eager"
                  />
                  {/* Subtle inner spine shadow & gloss reflection on paper sleeve */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 border border-white/[0.06] rounded-[4px] pointer-events-none" />

                  {/* Micro edition badge on sleeve */}
                  <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs px-1.5 py-0.5 rounded-[2px] border border-white/10">
                    <span className="text-[7.5px] font-mono tracking-wider text-white/80 uppercase">
                      {album.rpm}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Playing Status Indicator Banner (Subtle #2FE92B pulse when active) */}
      <div className="h-6 flex items-center justify-center my-0.5">
        {isPlaying ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#1B1B1D]/80 border border-[#26272D]">
            {/* Animated mini waveform bars */}
            <div className="flex items-end gap-[2px] h-3">
              <span className="w-0.5 h-2 bg-[#2FE92B] animate-pulse" />
              <span className="w-0.5 h-3 bg-[#2FE92B] animate-bounce" />
              <span className="w-0.5 h-1.5 bg-[#2FE92B] animate-pulse" />
              <span className="w-0.5 h-2.5 bg-[#2FE92B] animate-bounce" />
            </div>
            <span className="text-[11px] font-medium text-[#2FE92B] tracking-wide">
              正在唱片机播放 · {currentTrackTitle || currentAlbum.tracks[0]?.title || 'A面第一首'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 opacity-50">
            <span className="w-1 h-1 rounded-full bg-[#2A2A2C]" />
            <span className="text-[10.5px] text-[#BBCBB2] tracking-wider font-mono">
              ANALOG VINYL READY
            </span>
          </div>
        )}
      </div>

      {/* Album Metadata Typography */}
      <div className="text-center px-4 max-w-sm mt-1 z-20">
        <h2 className="text-[20px] font-bold text-white tracking-tight leading-snug line-clamp-1">
          {currentAlbum.title}
        </h2>
        <p className="text-[14px] font-medium text-[#BBCBB2] mt-0.5">
          {currentAlbum.artist}
        </p>
        <p className="text-[12px] text-white/45 mt-1 font-mono tracking-wide">
          {currentAlbum.year} · {currentAlbum.genre} · {currentAlbum.trackCount} 首
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 mt-3.5 z-20 w-full px-6 max-w-xs">
        {/* Favorite Dark Secondary Button */}
        <button
          id="btn-carousel-favorite"
          type="button"
          onClick={() => {
            onToggleFavorite(currentAlbum.id);
            audioEngine.triggerHaptic('light');
          }}
          className={`h-10 w-11 rounded-[6px] flex items-center justify-center border transition-colors ${
            isCurrentFavorite
              ? 'bg-[#1B1B1D] border-[#2FE92B]/50 text-[#2FE92B]'
              : 'bg-[#1B1B1D] border-[#26272D] text-white/70 hover:text-white hover:border-[#3A3B42]'
          }`}
          title="收藏黑胶"
        >
          <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-[#2FE92B]' : ''}`} />
        </button>

        {/* Primary CTA: Play Button (#2FE92B background, #0F0F0F text) */}
        <button
          id="btn-carousel-play"
          type="button"
          onClick={() => {
            onTogglePlay(currentAlbum);
            audioEngine.triggerHaptic('medium');
          }}
          className="flex-1 h-10 px-5 rounded-[6px] bg-[#2FE92B] hover:bg-[#28d124] text-[#0F0F0F] font-bold text-[14px] tracking-wide flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(47,233,43,0.3)] active:scale-98 transition-all"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-[#0F0F0F]" />
              <span>暂停</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-[#0F0F0F]" />
              <span>播放整张</span>
            </>
          )}
        </button>

        {/* Details Dark Secondary Button */}
        <button
          id="btn-carousel-details"
          type="button"
          onClick={() => {
            onOpenAlbumDetail(currentAlbum);
            audioEngine.triggerHaptic('light');
          }}
          className="h-10 w-11 rounded-[6px] bg-[#1B1B1D] border border-[#26272D] hover:border-[#3A3B42] text-white/70 hover:text-white flex items-center justify-center transition-colors"
          title="查看专辑详情"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Page Indicator (03 / 12 and Dots) */}
      <div className="flex items-center justify-center gap-2 mt-3 z-20">
        <span className="text-[11px] font-mono text-white/50 tracking-wider">
          {String(currentIndex + 1).padStart(2, '0')} / {String(albums.length).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-1 ml-1">
          {albums.map((_, i) => (
            <span
              key={i}
              onClick={() => {
                onSelectIndex(i);
                audioEngine.triggerHaptic('light');
              }}
              className={`h-1 rounded-full transition-all cursor-pointer ${
                i === currentIndex
                  ? 'w-4 bg-[#2FE92B]'
                  : 'w-1 bg-[#2A2A2C] hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
