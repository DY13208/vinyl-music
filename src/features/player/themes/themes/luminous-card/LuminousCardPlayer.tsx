import React from 'react';
import { Disc3 } from 'lucide-react';
import { ArtworkImage } from '../../../../../components/ArtworkImage';
import type { PlayerStageProps } from '../../PlayerTheme';
import './luminousCardPlayer.css';

export function LuminousCardPlayer({
  album,
  currentTrack,
  isPlaying,
  progressPercent,
}: PlayerStageProps) {
  const progress = Number.isFinite(progressPercent)
    ? Math.min(100, Math.max(0, progressPercent))
    : 0;

  return (
    <section
      className="luminous-card-stage"
      aria-label="流光卡片播放器"
      data-playing={isPlaying}
      style={{ '--luminous-progress': `${progress}%` } as React.CSSProperties}
    >
      <div className="luminous-card-stage__surface">
        <header className="luminous-card-stage__heading">
          <span className="luminous-card-stage__mark" aria-hidden="true"><Disc3 /></span>
          <span>
            <strong>流光卡片</strong>
            <small>{isPlaying ? '正在播放' : '当前曲目'}</small>
          </span>
          <i className="luminous-card-stage__status" aria-hidden="true" />
        </header>

        <div className="luminous-card-stage__artwork">
          <ArtworkImage src={album.coverUrl} alt={`${album.title} 封面`} draggable={false} />
          <div className="luminous-card-stage__shade" aria-hidden="true" />
        </div>

        <div className="luminous-card-stage__meta">
          <span>
            <strong title={currentTrack.title}>{currentTrack.title}</strong>
            <small title={`${album.artist} · ${album.title}`}>{album.artist} · {album.title}</small>
          </span>
          <span className="luminous-card-stage__meter" aria-label={`已播放 ${Math.round(progress)}%`}>
            <i /><i /><i /><i /><i />
          </span>
        </div>
        <div className="luminous-card-stage__progress" aria-hidden="true"><i /></div>
      </div>
    </section>
  );
}
