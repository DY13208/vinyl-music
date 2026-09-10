import React, { useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { Album, Track } from '../types';
import { hapticsService } from '../platform/platformService';
import { useFloatingPosition } from '../hooks/useFloatingPosition';
import './FloatingPlayer.css';

interface Props {
  currentAlbum: Album | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  progressPercent: number;
  onTogglePlay: () => void;
  onOpenPlayer: () => void;
}

export const FloatingPlayer: React.FC<Props> = ({ currentAlbum, currentTrack, isPlaying, progressPercent, onTogglePlay, onOpenPlayer }) => {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { point, side, dragging, suppressClick, dragHandlers } = useFloatingPosition(rootRef, expanded);
  if (!currentAlbum || !currentTrack) return null;
  const progress = Number.isFinite(progressPercent) ? Math.min(100, Math.max(0, progressPercent)) : 0;

  const togglePlayback = (event: React.MouseEvent) => {
    event.stopPropagation();
    onTogglePlay();
    hapticsService.triggerHaptic('medium');
  };

  return <div ref={rootRef} id="floating-player" className={`floating-player ${expanded ? 'is-expanded' : ''} is-${side} ${dragging ? 'is-dragging' : ''}`}
    style={{ left: point.x, top: point.y, '--playback-progress': `${progress * 3.6}deg` } as React.CSSProperties}
    {...dragHandlers}>
    {!expanded ? <button type="button" className="floating-player__disc" aria-label={`展开播放器：${currentTrack.title}`}
      onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } setExpanded(true); }}>
      <span className="floating-player__art"><img src={currentAlbum.coverUrl} alt="" draggable={false} /></span>
      <span className="floating-player__state" aria-hidden="true">{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</span>
    </button> : <div className="floating-player__expanded">
      <button type="button" className="floating-player__open" aria-label={`打开全屏播放器：${currentTrack.title}`} onClick={onOpenPlayer}>
        <span className="floating-player__thumb"><img src={currentAlbum.coverUrl} alt="" draggable={false} /></span>
        <span className="floating-player__copy"><strong>{currentTrack.title}</strong><small>{currentAlbum.artist}</small></span>
      </button>
      <button data-floating-action type="button" className="floating-player__control" aria-label={isPlaying ? '暂停' : '播放'} onClick={togglePlayback}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
      <button data-floating-action type="button" className="floating-player__control" aria-label="收起播放器" onClick={() => setExpanded(false)}><X size={19} /></button>
    </div>}
  </div>;
};
