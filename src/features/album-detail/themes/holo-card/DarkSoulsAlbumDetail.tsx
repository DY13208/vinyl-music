import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkPlus, ChevronDown, ChevronLeft, Flame, Heart, Play } from 'lucide-react';
import type { Album, Track } from '../../../../types';
import { ArtworkImage } from '../../../../components/ArtworkImage';
import { DarkSoulsHoloCard, type DarkSoulsHoloCardVariant } from '../../../../vendor/threeui/DarkSoulsHoloCard';
import { getAlbumDiscs } from '../../../../utils/vinylSides';
import './darkSoulsAlbumDetail.css';

interface DarkSoulsAlbumDetailProps {
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

const variants: readonly { id: DarkSoulsHoloCardVariant; label: string }[] = [
  { id: 'ashen-one', label: '余火' },
  { id: 'cindermane', label: '烬鬃' },
];

export function DarkSoulsAlbumDetail({
  album,
  currentTrackId,
  isPlayingAlbum = false,
  isPlaying = false,
  onBack,
  onPlayAlbum,
  onSelectTrack,
  onToggleFavorite,
  isFavorite,
  onToggleWishlist,
}: DarkSoulsAlbumDetailProps) {
  const [variant, setVariant] = useState<DarkSoulsHoloCardVariant>('ashen-one');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>(currentTrackId);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [flipped, setFlipped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ id: number; x: number; y: number; rx: number; ry: number } | null>(null);
  const tracks = useMemo(
    () => getAlbumDiscs(album).flatMap(record => record.sides.flatMap(side => side.tracks)),
    [album],
  );
  const selectedTrack = tracks.find(track => track.id === selectedTrackId);
  const displayCover = selectedTrack?.coverUrl || album.coverUrl;
  const displayTitle = selectedTrack?.title || album.title;

  useEffect(() => {
    if (isPlayingAlbum && currentTrackId && tracks.some(track => track.id === currentTrackId)) {
      setSelectedTrackId(currentTrackId);
    }
  }, [currentTrackId, isPlayingAlbum, tracks]);

  const startCardDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, rx: rotation.x, ry: rotation.y };
    setDragging(true);
  };
  const moveCard = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    event.preventDefault();
    const nextX = Math.max(-24, Math.min(24, drag.rx - (event.clientY - drag.y) * .18));
    const nextY = drag.ry + (event.clientX - drag.x) * .28;
    setRotation({ x: nextX, y: nextY });
  };
  const endCardDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.id !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <main id="album-detail-view" className="album-holo-theme" data-variant={variant}>
      <DarkSoulsHoloCard className="album-holo-theme__scene" variant={variant} />
      <div className="album-holo-theme__vignette" aria-hidden="true" />
      <div
        className="album-holo-theme__album-card"
        data-dragging={dragging}
        role="group"
        tabIndex={0}
        aria-label={`${displayTitle} 封面卡牌，可拖动旋转，按 F 翻面`}
        onPointerDown={startCardDrag}
        onPointerMove={moveCard}
        onPointerUp={endCardDrag}
        onPointerCancel={endCardDrag}
        onDoubleClick={() => setFlipped(value => !value)}
        onKeyDown={event => {
          if (event.key.toLowerCase() === 'f' || event.key === 'Enter') setFlipped(value => !value);
          else if (event.key === 'ArrowLeft') setRotation(value => ({ ...value, y: value.y - 12 }));
          else if (event.key === 'ArrowRight') setRotation(value => ({ ...value, y: value.y + 12 }));
          else return;
          event.preventDefault();
        }}
      >
        <div className="album-holo-theme__album-rotor" style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y + (flipped ? 180 : 0)}deg)` }}>
          <div className="album-holo-theme__album-face album-holo-theme__album-face--front">
            <div className="album-holo-theme__album-art">
              <ArtworkImage src={displayCover} alt={`${displayTitle} 封面`} loading="eager" draggable={false} />
              <span aria-hidden="true" />
            </div>
            <div className="album-holo-theme__album-caption">
              <strong>{displayTitle}</strong>
              <small>{album.artist} · {selectedTrack ? '当前曲目' : album.year}</small>
            </div>
          </div>
          <div className="album-holo-theme__album-face album-holo-theme__album-face--back">
            <span>VINYL SHELF</span>
            <strong>{album.title}</strong>
            <p>{album.description?.trim() || `${album.artist} · ${album.genre}`}</p>
            <small>{tracks.length} 首 · 双击返回封面</small>
          </div>
        </div>
      </div>

      <header className="album-holo-theme__header">
        <button type="button" className="album-holo-theme__icon" onClick={onBack} aria-label="返回">
          <ChevronLeft aria-hidden="true" />
        </button>
        <div className="album-holo-theme__identity">
          <span>{album.artist}</span>
          <h1>{album.title}</h1>
        </div>
        <div className="album-holo-theme__variants" role="group" aria-label="全息卡牌场景">
          {variants.map(option => (
            <button
              key={option.id}
              type="button"
              aria-pressed={variant === option.id}
              onClick={() => setVariant(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="album-holo-theme__play"
          disabled={!tracks.length}
          onClick={() => onPlayAlbum(album)}
        >
          <Play aria-hidden="true" fill="currentColor" />
          <span>播放整张</span>
        </button>
        <button
          type="button"
          className="album-holo-theme__icon"
          aria-label={isFavorite ? '取消唱片架喜爱标记' : '标记为喜爱'}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(album.id)}
        >
          <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        {onToggleWishlist && (
          <button type="button" className="album-holo-theme__icon album-holo-theme__wishlist" aria-label="切换愿望单标记" onClick={() => onToggleWishlist(album)}>
            <BookmarkPlus aria-hidden="true" />
          </button>
        )}
      </header>

      <section className="album-holo-theme__catalogue" data-open={drawerOpen} aria-label="专辑曲目抽屉">
        <button
          type="button"
          className="album-holo-theme__drawer-toggle"
          aria-expanded={drawerOpen}
          aria-controls="album-holo-track-drawer"
          onClick={() => setDrawerOpen(value => !value)}
        >
          <span><Flame aria-hidden="true" /><strong>曲目列表</strong><small>{tracks.length} 首</small></span>
          <span>{drawerOpen ? '收起' : '展开'}<ChevronDown aria-hidden="true" /></span>
        </button>
        <div className="album-holo-theme__drawer" id="album-holo-track-drawer" aria-hidden={!drawerOpen}>
          <div className="album-holo-theme__drawer-inner">
            <p>{album.year} · 拖动卡牌可旋转，双击可翻面</p>
            <ol>
          {tracks.map((track, index) => {
            const current = isPlayingAlbum && currentTrackId === track.id;
            return (
              <li key={track.id}>
                <button
                  type="button"
                  tabIndex={drawerOpen ? 0 : -1}
                  aria-current={current ? 'true' : undefined}
                  onClick={() => {
                    setSelectedTrackId(track.id);
                    onSelectTrack(album, track);
                  }}
                >
                  <span className="album-holo-theme__track-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="album-holo-theme__track-name">{track.title}</span>
                  <span className="album-holo-theme__track-duration">{current && isPlaying ? '播放中' : track.duration}</span>
                </button>
              </li>
            );
          })}
            </ol>
            {!tracks.length && <p className="album-holo-theme__empty">这张专辑尚未录入曲目</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
