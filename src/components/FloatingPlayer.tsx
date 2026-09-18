import { ArtworkImage } from './ArtworkImage';
import React, { useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { Album, Track } from '../types';
import { hapticsService } from '../platform/platformService';
import { useFloatingPosition } from '../hooks/useFloatingPosition';
import './FloatingPlayer.css';

interface Props {
  mode?: 'floating' | 'dock';
  currentAlbum: Album | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  progressPercent: number;
  onTogglePlay: () => void;
  onOpenPlayer: () => void;
}

export const FloatingPlayer: React.FC<Props> = (props) => {
  if (props.mode !== 'dock') return <FreeFloatingPlayer {...props} />;
  const { currentAlbum, currentTrack, isPlaying, progressPercent, onTogglePlay, onOpenPlayer } = props;
  const ready = !!currentAlbum && !!currentTrack;
  const progress = Number.isFinite(progressPercent) ? Math.min(100, Math.max(0, progressPercent)) : 0;
  return <div id="floating-player" className={`floating-player floating-player--dock ${isPlaying ? 'is-playing' : ''}`} style={{ '--playback-progress': `${progress * 3.6}deg` } as React.CSSProperties}>
    <button type="button" className="floating-player__disc" disabled={!ready} aria-label={ready ? `${isPlaying ? '暂停' : '播放'}：${currentTrack.title}` : '尚未选择歌曲'} onClick={() => { onTogglePlay(); hapticsService.triggerHaptic('medium'); }}>
      <span className="floating-player__art">{currentAlbum && <ArtworkImage src={currentAlbum.coverUrl} alt="" draggable={false} />}</span>
      <span className="floating-player__state" aria-hidden="true">{isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}</span>
    </button>
    <button type="button" className="floating-player__details" disabled={!ready} onClick={onOpenPlayer} aria-label={ready ? `打开全屏播放器：${currentTrack.title}` : '请先选择歌曲'}>{ready ? '播放详情' : '未选歌曲'}</button>
  </div>;
};

const FreeFloatingPlayer: React.FC<Props> = ({ currentAlbum, currentTrack, isPlaying, progressPercent, onTogglePlay, onOpenPlayer }) => {
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
      <span className="floating-player__art"><ArtworkImage src={currentAlbum.coverUrl} alt="" draggable={false} /></span>
      <span className="floating-player__state" aria-hidden="true">{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</span>
    </button> : <div className="floating-player__expanded">
      <button type="button" className="floating-player__open" aria-label={`打开全屏播放器：${currentTrack.title}`} onClick={onOpenPlayer}>
        <span className="floating-player__thumb"><ArtworkImage src={currentAlbum.coverUrl} alt="" draggable={false} /></span>
        <span className="floating-player__copy"><strong>{currentTrack.title}</strong><small>{currentAlbum.artist}</small></span>
      </button>
      <button data-floating-action type="button" className="floating-player__control" aria-label={isPlaying ? '暂停' : '播放'} onClick={togglePlayback}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
      <button data-floating-action type="button" className="floating-player__control" aria-label="收起播放器" onClick={() => setExpanded(false)}><X size={19} /></button>
    </div>}
  </div>;
};
