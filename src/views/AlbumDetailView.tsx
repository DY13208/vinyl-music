import React, { useMemo, useRef } from 'react';
import { Album, Track } from '../types';
import { VinylDisc } from '../components/VinylDisc';
import { VinylSideIcon } from '../components/VinylSideIcon';
import { useVinylSideTransition } from '../hooks/useVinylSideTransition';
import { AlbumSleeve } from '../components/AlbumSleeve';
import { ChevronLeft, Play, Heart, BookmarkPlus, ArrowLeftRight } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { getVinylAppearance } from '../utils/vinylAppearance';
import { albumForSide, durationOf, getAlbumDiscs } from '../utils/vinylSides';
import './AlbumDetailView.css';

interface AlbumDetailViewProps {
  album: Album;
  currentTrackId?: string;
  isPlayingAlbum?: boolean;
  isPlaying?: boolean;
  onBack: () => void;
  onPlayAlbum: (album: Album) => void;
  onSelectTrack: (album: Album, track: Track) => void;
  onToggleFavorite: (albumId: string) => void;
  isFavorite: boolean;
  onToggleWishlist?: (album: Album) => void;
}

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({ album, ...props }) =>
  <AlbumArchive key={album.id} album={album} {...props} />;

const AlbumArchive: React.FC<AlbumDetailViewProps> = ({
  album, currentTrackId, isPlayingAlbum = false, isPlaying = false,
  onBack, onSelectTrack, onToggleFavorite, isFavorite, onToggleWishlist,
}) => {
  const discs = useMemo(() => getAlbumDiscs(album), [album]);
  const { selection, target, phase, selectSide } = useVinylSideTransition();
  const sideButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const disc = discs[selection.disc] ?? discs[0];
  const side = disc.sides[selection.side] ?? disc.sides[0];
  const appearance = getVinylAppearance(album);
  const allTracks = discs.flatMap(record => record.sides.flatMap(face => face.tracks));
  const changeSide = (discIndex: number, sideIndex: number) => {
    selectSide({ disc: discIndex, side: sideIndex });
    audioEngine.triggerHaptic('light');
  };
  const play = (tracks: Track[]) => {
    if (!tracks.length) return;
    onSelectTrack(albumForSide(album, tracks), tracks[0]);
    audioEngine.triggerHaptic('medium');
  };

  return <main id="album-detail-view" className="album-archive" translate="no">
    <header className="archive-nav">
      <button id="album-detail-back" type="button" onClick={onBack} aria-label="返回"><ChevronLeft size={20} /></button>
      <span>唱片档案</span><span className="archive-nav__format">{discs.length} LP</span>
    </header>
    <section className="archive-display" aria-label="封套与实体唱片">
      <div className="archive-display__table" />
      <div className="archive-object">
        <div className="archive-object__disc">
          <VinylDisc coverUrl={album.coverUrl} albumTitle={album.title} artistName={album.label}
            size="var(--archive-disc)" type={appearance.variant} texture={appearance.texture}
            labelColor={appearance.label?.color} labelImage={appearance.label?.image}
            labelText={appearance.label?.text} side={side.side} rpm={album.rpm} transitionPhase={phase} />
        </div>
        <div className="archive-object__sleeve">
          <AlbumSleeve coverUrl={album.coverUrl} title={album.title} size="var(--archive-sleeve)" />
        </div>
      </div>
      <div className="archive-display__caption"><span>{album.rpm}</span><span>DISC {disc.disc} / SIDE {side.side}</span></div>
    </section>

    <section className="archive-info" aria-labelledby="archive-title">
      <h1 id="archive-title">{album.title}</h1>
      <p className="archive-info__artist">{album.artist}</p>
      <p className="archive-info__summary">{album.year} · {album.genre} · {album.trackCount} 首 · {album.totalDuration}</p>
      <p className="archive-info__edition">{album.weight} · {album.edition}</p>
      <p className="archive-info__label">{album.label}</p>
      <div className="archive-actions">
        <button id="album-detail-play-btn" className="archive-actions__play" type="button" disabled={!allTracks.length} onClick={() => play(allTracks)}><Play size={17} fill="currentColor" />播放整张</button>
        <button id="album-detail-fav-btn" type="button" aria-label={isFavorite ? '取消收藏' : '收藏'} aria-pressed={isFavorite} onClick={() => { onToggleFavorite(album.id); audioEngine.triggerHaptic('light'); }}><Heart size={21} fill={isFavorite ? 'currentColor' : 'none'} /></button>
        {onToggleWishlist && <button id="album-detail-wishlist-btn" type="button" aria-label="切换愿望单标记" onClick={() => { onToggleWishlist(album); audioEngine.triggerHaptic('light'); }}><BookmarkPlus size={21} /></button>}
      </div>
    </section>

    <section className="archive-tracks" aria-label="唱片分面曲目">
      {discs.length > 1 && <div className="archive-discs" aria-label="选择唱片">{discs.map((record, index) =>
        <button type="button" key={record.disc} aria-pressed={selection.disc === index} onClick={() => changeSide(index, 0)}>Disc {record.disc}</button>
      )}</div>}
      <div className="archive-sides" role="tablist" aria-label={`Disc ${disc.disc} 唱片面`}
        style={{ '--side-count': disc.sides.length, '--active-side': target.disc === selection.disc ? target.side : 0 } as React.CSSProperties}>
        <span className="archive-sides__indicator" aria-hidden="true" />
        {disc.sides.map((face, index) => <button type="button" key={face.side} role="tab"
          id={`side-tab-${disc.disc}-${face.side}`} aria-controls="archive-side-tracks"
          aria-selected={face.side === side.side} tabIndex={face.side === side.side ? 0 : -1}
          ref={node => { sideButtons.current[index] = node; }}
          onClick={() => changeSide(selection.disc, index)} onKeyDown={event => {
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % disc.sides.length;
            else if (event.key === 'ArrowLeft') next = (index - 1 + disc.sides.length) % disc.sides.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = disc.sides.length - 1;
            else return;
            event.preventDefault();
            changeSide(selection.disc, next); sideButtons.current[next]?.focus();
          }}><VinylSideIcon album={album} side={face.side} active={face.side === side.side} /><span>Side {face.side}</span></button>)}
      </div>
      <div className="archive-side-panel" id="archive-side-tracks" role="tabpanel" aria-labelledby={`side-tab-${disc.disc}-${side.side}`}
        data-transition={phase} style={{ minHeight: Math.max(...disc.sides.map(face => face.tracks.length), 1) * 62 + 58 }}>
        <div className="archive-tracks__heading">
          <p aria-live="polite">Side {side.side}<span> · {side.tracks.length} 首 · {durationOf(side.tracks)}</span></p>
          <button type="button" disabled={!side.tracks.length} onClick={() => play(side.tracks)} aria-label={`播放 Side ${side.side}`}><Play size={12} />播放此面</button>
        </div>
        <ol className="archive-tracklist">
          {side.tracks.map((track, index) => {
            const current = isPlayingAlbum && currentTrackId === track.id;
            return <li key={track.id}><button type="button" id={`track-item-${track.id}`} className={`archive-track ${current ? 'is-current' : ''}`}
              aria-current={current ? 'true' : undefined}
              onClick={() => { onSelectTrack(albumForSide(album, side.tracks), track); audioEngine.triggerHaptic('light'); }}>
              <span className="archive-track__number">{side.side}{index + 1}</span>
              <span className="archive-track__name"><strong>{track.title}</strong><small>{album.artist}</small></span>
              <span className="archive-track__duration">{current && isPlaying && <i aria-label="正在播放" />}{track.duration}</span>
            </button></li>;
          })}
        </ol>
        {!side.tracks.length && <p className="archive-tracks__empty">此面尚未录入曲目</p>}
      </div>
      <footer className="archive-footnote"><ArrowLeftRight size={13} /><span>{album.discs ? '按压片版本分面' : '按已录入曲目分面，实际压片以封套为准'}</span><span>{album.matrixCode}</span></footer>
    </section>
  </main>;
};
