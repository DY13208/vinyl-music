import React from 'react';
import { hapticsService } from '../platform/platformService';

interface PlaybackWaveformProps {
  progressPercent: number; // 0 - 100
  currentIndex: number;
  totalCount: number;
  trackNumber?: number;
  totalTracks?: number;
  onSeek?: (percent: number) => void;
  className?: string;
}

// 36 curated audio waveform amplitudes with organic musical distribution
const WAVEFORM_HEIGHTS = [
  8, 12, 16, 14, 20, 24, 16, 22, 26, 24,
  18, 22, 28, 24, 20, 16, 24, 28, 22, 18,
  24, 26, 20, 16, 22, 26, 18, 14, 20, 22,
  16, 18, 14, 12, 10, 8,
];

export const PlaybackWaveform: React.FC<PlaybackWaveformProps> = ({
  progressPercent = 0,
  currentIndex,
  totalCount,
  trackNumber,
  totalTracks,
  onSeek,
  className = '',
}) => {
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    onSeek(pct);
    hapticsService.triggerHaptic('light');
  };

  // Format indices: if track number provided, show "01 / 12", else carousel album index "01 / 08"
  const currentNum = trackNumber !== undefined ? trackNumber : currentIndex + 1;
  const totalNum = totalTracks !== undefined ? totalTracks : totalCount;
  const indexLabel = `${String(currentNum).padStart(2, '0')} / ${String(totalNum).padStart(2, '0')}`;

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {/* 1. Waveform Bars: Width ~58%, Height 28~32px */}
      <div
        id="playback-waveform-bar"
        onClick={handleWaveformClick}
        className="w-[58%] max-w-[240px] h-[30px] flex items-center justify-between gap-[3px] cursor-pointer px-1 group"
        title="播放波形"
      >
        {WAVEFORM_HEIGHTS.map((height, idx) => {
          const barPct = (idx / (WAVEFORM_HEIGHTS.length - 1)) * 100;
          const isPlayed = barPct <= progressPercent;

          return (
            <span
              key={idx}
              className={`w-[2.5px] rounded-full transition-all duration-150 ${
                isPlayed
                  ? 'bg-[#2FE92B] shadow-[0_0_5px_rgba(47,233,43,0.35)]'
                  : 'bg-[#2A2A2C] group-hover:bg-[#38383D]'
              }`}
              style={{
                height: `${height}px`,
              }}
            />
          );
        })}
      </div>

      {/* 2. Index Display (03 / 12) + Micro Indicator Dots */}
      <div className="flex items-center justify-center gap-3 mt-1.5">
        <span className="text-[11.5px] font-mono font-medium text-[#6B6B78] tracking-wider">
          {indexLabel}
        </span>

        {/* Micro pagination dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(8, totalCount) }).map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-3 h-1 bg-[#2FE92B]'
                  : 'w-1 h-1 bg-[#2A2A2C]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
