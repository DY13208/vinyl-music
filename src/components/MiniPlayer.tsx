import React from 'react';
import { Album, Track } from '../types';
import { Play, Pause } from 'lucide-react';
import { hapticsService } from '../platform/platformService';
import { VinylDisc } from './VinylDisc';
import { getVinylAppearance } from '../utils/vinylAppearance';
import './MiniPlayer.css';

interface MiniPlayerProps {
  currentAlbum: Album | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  progressPercent: number;
  onTogglePlay: () => void;
  onOpenPlayer: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ currentAlbum, currentTrack, isPlaying, progressPercent, onTogglePlay, onOpenPlayer }) => {
  if (!currentAlbum) return null;
  const appearance = getVinylAppearance(currentAlbum);
  // Only explicit pressing data can identify a side in a playback-only track subset.
  const face = currentAlbum.discs?.flatMap(disc => disc.sides).find(side => side.tracks.some(track => track.id === currentTrack?.id));
  const position = face ? `${face.side}${face.tracks.findIndex(track => track.id === currentTrack?.id) + 1}` : undefined;
  const progress = Number.isFinite(progressPercent) ? Math.min(100, Math.max(0, progressPercent)) : 0;
  const title = currentTrack?.title || currentAlbum.title;

  return <section id="mini-player-bar" className="mini-player" aria-label="唱片播放托盘" translate="no">
    <div className="mini-player__progress" role="progressbar" aria-label="播放进度" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
    <button type="button" className="mini-player__open" aria-label={`打开全屏播放器：${title}`} onClick={onOpenPlayer} />
    <div className="mini-player__vinyl" aria-hidden="true">
      <VinylDisc coverUrl={currentAlbum.coverUrl} albumTitle={currentAlbum.title} artistName={currentAlbum.artist}
        size={40} type={appearance.variant} texture={appearance.texture} labelImage={appearance.label?.image}
        labelColor={appearance.label?.color} labelText={appearance.label?.text} side={face?.side || 'A'} rpm={currentAlbum.rpm} isPlaying={isPlaying} />
    </div>
    <div className="mini-player__info">
      <p className="mini-player__title" title={title}>{title}</p>
      <p className="mini-player__artist" title={currentAlbum.artist}>{currentAlbum.artist}</p>
      <p className="mini-player__pressing">{position ? `${position} · ` : ''}{currentAlbum.rpm}</p>
    </div>
    <button id="mini-player-play-btn" type="button" className={`mini-player__toggle ${isPlaying ? 'is-playing' : ''}`}
      aria-label={isPlaying ? '暂停' : '播放'} onClick={event => { event.stopPropagation(); onTogglePlay(); hapticsService.triggerHaptic('medium'); }}>
      {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
    </button>
  </section>;
};