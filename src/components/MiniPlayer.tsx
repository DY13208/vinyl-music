import React from 'react';
import { Album, Track } from '../types';
import { Play, Pause, Disc } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface MiniPlayerProps {
  currentAlbum: Album | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  progressPercent: number;
  onTogglePlay: () => void;
  onOpenPlayer: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentAlbum,
  currentTrack,
  isPlaying,
  progressPercent,
  onTogglePlay,
  onOpenPlayer,
}) => {
  if (!currentAlbum) return null;

  return (
    <div
      id="mini-player-bar"
      onClick={onOpenPlayer}
      className="w-full bg-[#0F0F0F] border-t border-[#26272D] relative cursor-pointer select-none transition-colors hover:bg-[#141416]"
    >
      {/* Top micro progress bar in #2FE92B */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#1B1B1D]">
        <div
          className="h-full bg-[#2FE92B] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-3.5 py-2">
        {/* Left: Spinning mini vinyl disc + album artwork */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
            {/* Spinning mini vinyl */}
            <div
              className={`w-10 h-10 rounded-full bg-[#09090A] border border-white/10 overflow-hidden flex items-center justify-center ${
                isPlaying ? 'animate-vinyl-spin' : ''
              }`}
            >
              <div className="absolute inset-0 vinyl-grooves opacity-60" />
              <img
                src={currentAlbum.coverUrl}
                alt={currentAlbum.title}
                className="w-4 h-4 rounded-full object-cover border border-[#2FE92B]/50"
              />
            </div>
          </div>

          {/* Track and Artist Title */}
          <div className="overflow-hidden text-left">
            <p className="text-[13px] font-bold text-white truncate leading-tight">
              {currentTrack ? currentTrack.title : currentAlbum.title}
            </p>
            <p className="text-[11px] text-[#BBCBB2] truncate leading-tight mt-0.5 opacity-80 flex items-center gap-1.5">
              <span>{currentAlbum.artist}</span>
              <span className="w-1 h-1 rounded-full bg-[#2A2A2C]" />
              <span className="font-mono text-[9px] text-[#2FE92B] flex items-center gap-0.5">
                <Disc className="w-2.5 h-2.5" />
                {currentAlbum.rpm}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Tactile Play / Pause button */}
        <div
          className="flex items-center gap-2 pl-2"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            id="mini-player-play-btn"
            type="button"
            onClick={() => {
              onTogglePlay();
              audioEngine.triggerHaptic('medium');
            }}
            className="w-8 h-8 rounded-full bg-[#2FE92B] text-[#0F0F0F] flex items-center justify-center shadow-[0_0_8px_rgba(47,233,43,0.3)] hover:scale-105 active:scale-95 transition-transform"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-[#0F0F0F]" />
            ) : (
              <Play className="w-4 h-4 fill-[#0F0F0F] ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
