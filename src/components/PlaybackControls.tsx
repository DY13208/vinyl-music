import React from 'react';
import { Heart, Play, Pause, SkipForward } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isFavorite: boolean;
  onTogglePlay: () => void;
  onToggleFavorite: () => void;
  onNextTrack: () => void;
  className?: string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isFavorite,
  onTogglePlay,
  onToggleFavorite,
  onNextTrack,
  className = '',
}) => {
  return (
    <div
      id="home-playback-controls"
      className={`w-full flex items-center justify-center gap-11 sm:gap-14 select-none ${className}`}
    >
      {/* 1. Left: Heart / Favorite Icon (No background, clean vector icon) */}
      <button
        id="btn-favorite"
        type="button"
        onClick={() => {
          onToggleFavorite();
          audioEngine.triggerHaptic('light');
        }}
        className="w-12 h-12 flex items-center justify-center text-[#BBCBB2] hover:text-white active:scale-90 transition-all"
        title="收藏"
      >
        <Heart
          className={`w-[23px] h-[23px] transition-colors ${
            isFavorite ? 'fill-[#2FE92B] text-[#2FE92B]' : 'text-[#BBCBB2]'
          }`}
        />
      </button>

      {/* 2. Center: 60px Circular Play/Pause Button (#2FE92B, black icon, subtle glow) */}
      <button
        id="btn-play-pause"
        type="button"
        onClick={() => {
          onTogglePlay();
          audioEngine.triggerHaptic('medium');
        }}
        className="w-[60px] h-[60px] rounded-full bg-[#2FE92B] hover:bg-[#28D824] active:scale-95 flex items-center justify-center flex-shrink-0 transition-transform"
        style={{
          boxShadow: '0 4px 20px rgba(47, 233, 43, 0.18)',
        }}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? (
          <Pause className="w-6 h-6 fill-black text-black" />
        ) : (
          <Play className="w-6 h-6 fill-black text-black translate-x-0.5" />
        )}
      </button>

      {/* 3. Right: Next Track Icon (No background, clean vector icon) */}
      <button
        id="btn-next-track"
        type="button"
        onClick={() => {
          onNextTrack();
          audioEngine.triggerHaptic('light');
        }}
        className="w-12 h-12 flex items-center justify-center text-[#BBCBB2] hover:text-white active:scale-90 transition-all"
        title="下一首"
      >
        <SkipForward className="w-[23px] h-[23px]" />
      </button>
    </div>
  );
};
