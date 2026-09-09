import React from 'react';
import { Album } from '../types';
import { VinylDisc } from '../components/VinylDisc';
import { Tonearm } from '../components/Tonearm';
import { Play, Pause, Heart, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface LandscapeViewProps {
  albums: Album[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  onExitLandscape: () => void;
}

export const LandscapeView: React.FC<LandscapeViewProps> = ({
  albums,
  currentIndex,
  onSelectIndex,
  isPlaying,
  onTogglePlay,
  onToggleFavorite,
  isFavorite,
  onExitLandscape,
}) => {
  const currentAlbum = albums[currentIndex] || albums[0];
  const prevAlbum = albums[(currentIndex - 1 + albums.length) % albums.length];
  const nextAlbum = albums[(currentIndex + 1) % albums.length];

  return (
    <div
      id="landscape-view"
      className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between p-4 select-none overflow-hidden"
    >
      {/* Top Bar with brand & exit button */}
      <header className="w-full flex items-center justify-between pb-2 border-b border-[#26272D]/60 z-20">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-black tracking-widest text-white uppercase">VINYL</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#1B1B1D] text-[#2FE92B] border border-[#26272D]">
            TURNTABLE STAND MODE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-white/50">
            {String(currentIndex + 1).padStart(2, '0')} / {String(albums.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={onExitLandscape}
            className="px-2.5 py-1 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] text-[11px] text-[#BBCBB2] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>竖屏模式</span>
          </button>
        </div>
      </header>

      {/* Main Turntable Stage: Left Cover | Center Giant Vinyl with Tonearm | Right Metadata */}
      <div className="flex-1 flex items-center justify-between relative px-6">
        {/* Left peek: Previous Vinyl partial preview */}
        <div
          onClick={() => {
            onSelectIndex((currentIndex - 1 + albums.length) % albums.length);
            audioEngine.triggerHaptic('light');
          }}
          className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-25 hover:opacity-50 transition-opacity cursor-pointer flex items-center gap-2 z-10"
        >
          <img
            src={prevAlbum.coverUrl}
            alt={prevAlbum.title}
            className="w-28 h-28 rounded-[4px] object-cover filter blur-[2px]"
          />
        </div>

        {/* 1. LEFT: Album Cover Sleeve */}
        <div className="w-[180px] sm:w-[220px] aspect-square rounded-[4px] overflow-hidden bg-[#0F0F0F] border border-[#26272D] shadow-2xl relative flex-shrink-0 z-20">
          <img
            src={currentAlbum.coverUrl}
            alt={currentAlbum.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[2px] bg-black/85 text-[8.5px] font-mono text-white/90">
            {currentAlbum.rpm}
          </div>
        </div>

        {/* 2. CENTER: Turntable Deck with Vinyl & Tonearm */}
        <div className="relative flex items-center justify-center flex-1 px-2 z-20">
          <div
            className="relative rounded-[18px] overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #131316 0%, #0A0A0C 70%, #060608 100%)',
              border: '1.5px solid #26272D',
              boxShadow: '0 20px 48px rgba(0,0,0,0.95)',
              width: 320,
              height: 260,
            }}
          >
            {/* Platter on Left */}
            <div
              className="absolute left-2.5 top-[15px] rounded-full p-1.5 flex items-center justify-center z-10"
              style={{
                background: 'radial-gradient(circle, #16161A 0%, #0c0c0e 75%, #050507 100%)',
                border: '2px solid #26272D',
                width: 230,
                height: 230,
              }}
            >
              <VinylDisc
                coverUrl={currentAlbum.coverUrl}
                albumTitle={currentAlbum.title}
                artistName={currentAlbum.artist}
                isPlaying={isPlaying}
                size={216}
                rpm={currentAlbum.rpm}
                showAmbientGlow={isPlaying}
              />
            </div>

            <Tonearm
              isPlaying={isPlaying}
              size={250}
              onTogglePlay={onTogglePlay}
              className="absolute right-0 top-0 z-20"
            />
          </div>
        </div>

        {/* 3. RIGHT: Album Metadata & Playback Controls */}
        <div className="w-[230px] sm:w-[260px] flex flex-col justify-center space-y-3 flex-shrink-0 z-20 text-left">
          <div>
            <span className="text-[10px] font-mono text-[#2FE92B]">
              {currentAlbum.year} · {currentAlbum.genre}
            </span>
            <h2 className="text-[18px] font-bold text-white tracking-tight line-clamp-1 mt-0.5">
              {currentAlbum.title}
            </h2>
            <p className="text-[13px] font-medium text-[#BBCBB2] mt-0.5">
              {currentAlbum.artist}
            </p>
            <p className="text-[10.5px] text-white/40 mt-1 font-mono">
              {currentAlbum.weight} · {currentAlbum.trackCount} 首
            </p>
          </div>

          {/* Controls: Play (#2FE92B), Prev, Next, Favorite */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex-1 h-9 px-3 rounded-[6px] bg-[#2FE92B] text-[#0F0F0F] font-bold text-[13px] flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(47,233,43,0.3)] active:scale-98 transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-[#0F0F0F]" />
                  <span>暂停</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#0F0F0F]" />
                  <span>播放</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(currentAlbum.id)}
              className={`w-9 h-9 rounded-[6px] border flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-[#1B1B1D] border-[#2FE92B]/50 text-[#2FE92B]'
                  : 'bg-[#0F0F0F] border-[#26272D] text-white/70'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#2FE92B]' : ''}`} />
            </button>
          </div>

          {/* Quick Tracklist snippet */}
          <div className="space-y-1 pt-1 border-t border-[#26272D]/70 max-h-24 overflow-y-auto no-scrollbar">
            {currentAlbum.tracks.slice(0, 3).map((trk) => (
              <div key={trk.id} className="flex items-center justify-between text-[11px] text-white/70 py-0.5">
                <span className="truncate max-w-[170px]">{trk.number}. {trk.title}</span>
                <span className="font-mono text-white/40">{trk.duration}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right peek: Next Vinyl partial preview */}
        <div
          onClick={() => {
            onSelectIndex((currentIndex + 1) % albums.length);
            audioEngine.triggerHaptic('light');
          }}
          className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-25 hover:opacity-50 transition-opacity cursor-pointer flex items-center gap-2 z-10"
        >
          <img
            src={nextAlbum.coverUrl}
            alt={nextAlbum.title}
            className="w-28 h-28 rounded-[4px] object-cover filter blur-[2px]"
          />
        </div>
      </div>
    </div>
  );
};
