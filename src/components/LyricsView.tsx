import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LyricLine, Track, Album } from '../types';
import { getLyricsForTrack } from '../data/lyricsData';
import { Play, Languages, AlignLeft, AlignCenter, ArrowDown, Sparkles } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

export interface LyricsViewProps {
  currentTrack: Track;
  album?: Album;
  currentTimeSec: number;
  durationSec: number;
  isPlaying: boolean;
  onSeek: (percent: number) => void;
  className?: string;
  /** Optional callback to close or switch back to turntable */
  onClose?: () => void;
}

/**
 * High-fidelity synchronized full lyrics player view.
 * Inspired by Folia Major (chthollyphile/folia-major), Apple Music & QQ Music:
 *
 * 1. Full Lyric Visibility: View and scroll through ALL lyrics of the entire track.
 * 2. Real-time Synchronization: Computes active line, highlights with high contrast, and auto-scrolls.
 * 3. Free Scroll & Return: Manual scrolling reveals a floating "回到正在播放" prompt.
 * 4. Tap-to-Seek: Click any line or hover timestamp play button to jump playback directly.
 * 5. Bilingual Toggle: Switch on/off translation subtitles (原文/双语).
 * 6. Typography: Smooth scaling and optical centering with top/bottom gradient masks.
 */
export const LyricsView: React.FC<LyricsViewProps> = ({
  currentTrack,
  album,
  currentTimeSec,
  durationSec,
  isPlaying,
  onSeek,
  className = '',
  onClose,
}) => {
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [textAlign, setTextAlign] = useState<'left' | 'center'>('left');
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch full lyrics dataset for this track
  const lyrics: LyricLine[] = useMemo(() => {
    return getLyricsForTrack(currentTrack, album);
  }, [currentTrack, album]);

  // Find currently active lyric index
  const activeIndex = useMemo(() => {
    if (!lyrics.length) return 0;
    // Find the latest line whose time <= currentTimeSec
    let activeIdx = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTimeSec >= lyrics[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }, [lyrics, currentTimeSec]);

  // Handle auto-scroll to keep active line centered
  useEffect(() => {
    if (isUserInteracting) return;
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isUserInteracting]);

  // Track user manual scrolling
  const handleUserScroll = () => {
    setIsUserInteracting(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    // Auto-resume tracking after 6 seconds of inactivity
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 6000);
  };

  // Jump to active line when clicking "回到正在播放"
  const handleReturnToActive = () => {
    setIsUserInteracting(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      audioEngine.triggerHaptic('light');
    }
  };

  const handleLineClick = (line: LyricLine) => {
    const targetPercent = Math.min(100, Math.max(0, (line.time / Math.max(1, durationSec)) * 100));
    onSeek(targetPercent);
    setIsUserInteracting(false);
    audioEngine.triggerHaptic('medium');
  };

  const formatTimestamp = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="folia-lyrics-container"
      className={`relative flex flex-col w-full h-full overflow-hidden select-none ${className}`}
    >
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#26272D]/60 bg-[#000000]/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-wider text-[#2FE92B] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>母带同步歌词</span>
          </span>
          <span className="text-[10px] font-mono text-white/40">
            {lyrics.length} 行全量音轨
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Bilingual / Translation Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowTranslation(!showTranslation);
              audioEngine.triggerHaptic('light');
            }}
            className={`px-2 py-1 rounded-[4px] text-[11px] font-medium flex items-center gap-1 transition-all ${
              showTranslation
                ? 'bg-[#1B1B1D] text-[#2FE92B] border border-[#2FE92B]/40 shadow-[0_0_10px_rgba(47,233,43,0.15)]'
                : 'bg-[#111113] text-white/40 border border-transparent hover:text-white'
            }`}
            title="切换译文 / 双语显示"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{showTranslation ? '译文开' : '原文'}</span>
          </button>

          {/* Alignment Toggle */}
          <button
            type="button"
            onClick={() => {
              setTextAlign(textAlign === 'left' ? 'center' : 'left');
              audioEngine.triggerHaptic('light');
            }}
            className="p-1.5 rounded-[4px] bg-[#111113] border border-[#26272D] text-white/50 hover:text-white transition-colors"
            title={textAlign === 'left' ? '居中排版' : '靠左排版'}
          >
            {textAlign === 'left' ? (
              <AlignCenter className="w-3.5 h-3.5" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Top Gradient Mask to smoothly fade lyrics into darkness */}
      <div className="absolute top-[41px] inset-x-0 h-14 bg-gradient-to-b from-[#000000] to-transparent pointer-events-none z-10" />

      {/* Main Lyrics Scrolling Viewport */}
      <div
        ref={containerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-20 space-y-6 no-scrollbar scroll-smooth"
      >
        {lyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isHovered = hoveredLineId === line.id;
          const isPast = idx < activeIndex;

          return (
            <div
              key={line.id}
              ref={isActive ? activeLineRef : null}
              onMouseEnter={() => setHoveredLineId(line.id)}
              onMouseLeave={() => setHoveredLineId(null)}
              onClick={() => handleLineClick(line)}
              className={`group relative cursor-pointer py-1.5 transition-all duration-300 rounded-[8px] px-3 ${
                textAlign === 'center' ? 'text-center' : 'text-left'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-[#2FE92B]/10 via-[#2FE92B]/5 to-transparent'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              {/* Quick Seek Play Button & Timestamp on Hover */}
              <div
                className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1B1B1D] border border-[#26272D] text-[#2FE92B] text-[10px] font-mono transition-opacity duration-150 ${
                  isHovered && !isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{formatTimestamp(line.time)}</span>
              </div>

              {/* Main Lyric Line Text */}
              <p
                className={`transition-all duration-300 ${
                  isActive
                    ? 'text-[17px] sm:text-[19px] font-bold text-white leading-relaxed tracking-tight scale-[1.01]'
                    : isPast
                    ? 'text-[14px] sm:text-[15px] font-normal text-white/35 group-hover:text-white/70'
                    : 'text-[14px] sm:text-[15px] font-medium text-white/45 group-hover:text-white/80'
                }`}
                style={{
                  textShadow: isActive ? '0 0 20px rgba(47,233,43,0.35)' : undefined,
                }}
              >
                {/* Active Indicator Accent */}
                {isActive && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2FE92B] mr-2 mb-0.5 animate-pulse" />
                )}
                {line.text}
              </p>

              {/* Chinese Translation Line */}
              {showTranslation && line.translation && (
                <p
                  className={`mt-1 text-[12px] sm:text-[13px] transition-colors duration-300 leading-normal ${
                    isActive
                      ? 'text-[#2FE92B] font-medium'
                      : 'text-white/25 group-hover:text-white/50'
                  }`}
                >
                  {line.translation}
                </p>
              )}
            </div>
          );
        })}

        {/* Generous bottom padding so the last lyric line can be scrolled comfortably into view */}
        <div className="h-28" />
      </div>

      {/* Bottom Gradient Mask */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#000000] to-transparent pointer-events-none z-10" />

      {/* Floating "Back to Current Lyric" prompt (QQ Music & Folia Major style) */}
      {isUserInteracting && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={handleReturnToActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B1B1D] border border-[#2FE92B]/60 text-[#2FE92B] text-[11px] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:bg-[#252528] active:scale-95 transition-all"
          >
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>回到正在播放 · {formatTimestamp(currentTimeSec)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LyricsView;
