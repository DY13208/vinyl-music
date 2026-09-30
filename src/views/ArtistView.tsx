import { ArtworkImage } from '../components/ArtworkImage';
import { VinylDisc } from '../components/VinylDisc';
import React, { useEffect, useRef, useState } from 'react';
import { Artist, Album } from '../types';
import { ChevronLeft, ChevronRight, Disc, Check, MoreHorizontal, Plus, Share2 } from 'lucide-react';
import { hapticsService } from '../platform/platformService';
import { getVinylAppearance } from '../utils/vinylAppearance';
import './ArtistDesktop.css';

interface ArtistViewProps {
  artist: Artist;
  onBack: () => void;
  onOpenAlbumDetail: (album: Album) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({
  artist,
  onBack,
  onOpenAlbumDetail,
}) => {
  const [isFollowed, setIsFollowed] = useState(false);

  return (
    <div
      id="artist-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Top Banner Image with gradient */}
      <div className="relative w-full h-[230px] overflow-hidden">
        <ArtworkImage
          src={artist.bannerUrl || artist.albums[0]?.coverUrl || ''}
          alt={artist.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-black/30" />

        {/* Back and share buttons */}
        <div className="absolute top-3 inset-x-4 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-[4px] bg-black/60 backdrop-blur-xs border border-white/10 text-white flex items-center justify-center transition-colors"
            title="返回"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-[4px] bg-black/60 backdrop-blur-xs border border-white/10 text-white flex items-center justify-center transition-colors"
            title="分享"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Artist Title on banner */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <span className="text-[10.5px] font-mono tracking-widest text-[#2FE92B] uppercase">
              VINYL ARTIST
            </span>
            <h1 className="text-[24px] font-black text-white tracking-tight">
              {artist.name}
            </h1>
            <p className="text-[11.5px] text-[#BBCBB2] opacity-80 mt-0.5">{artist.albumCount} 部相关唱片</p>
          </div>

          {/* Follow CTA: #2FE92B */}
          <button
            type="button"
            onClick={() => {
              setIsFollowed(!isFollowed);
              hapticsService.triggerHaptic('medium');
            }}
            className={`px-4 py-1.5 rounded-[4px] text-[13px] font-bold tracking-wide flex items-center gap-1.5 transition-all ${
              isFollowed
                ? 'bg-[#1B1B1D] text-[#2FE92B] border border-[#2FE92B]/50'
                : 'bg-[#2FE92B] text-[#0F0F0F] hover:bg-[#28d124]'
            }`}
          >
            {isFollowed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已关注</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>关注</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* 艺术家简介 (Biography) */}
        <section className="p-3.5 rounded-[6px] bg-[#0F0F0F] border border-[#26272D]">
          <h3 className="text-[12px] font-bold text-[#BBCBB2] tracking-wider uppercase mb-1.5">
            艺术家档案
          </h3>
          <p className="text-[12.5px] text-white/80 leading-relaxed">
            {artist.bio}
          </p>
        </section>

        {/* 热门专辑 (Popular Albums) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-[#2FE92B]" />
              热门黑胶专辑
            </h3>
          </div>

          <div className="space-y-2">
            {artist.albums.map((album) => (
              <div
                key={album.id}
                onClick={() => onOpenAlbumDetail(album)}
                className="p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <ArtworkImage
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-12 h-12 rounded-[4px] object-cover"
                  />
                  <div>
                    <h4 className="text-[13.5px] font-bold text-white leading-tight">
                      {album.title}
                    </h4>
                    <p className="text-[11px] text-[#BBCBB2] opacity-75 mt-0.5">
                      {album.year} · {album.trackCount} 首
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#2FE92B] px-1.5 py-0.5 rounded-[2px] bg-[#1B1B1D] border border-[#26272D]">
                  {album.rpm}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
      <ArtistDesktop
        artist={artist}
        isFollowed={isFollowed}
        onToggleFollow={() => {
          setIsFollowed(!isFollowed);
          hapticsService.triggerHaptic('medium');
        }}
        onBack={onBack}
        onOpenAlbumDetail={onOpenAlbumDetail}
      />
    </div>
  );
};

const styleTokens = (artist: Artist) => {
  const seen = new Set<string>();
  for (const album of artist.albums) {
    for (const part of album.genre.split(/[·/|,，、]/)) {
      const token = part.trim();
      if (token) seen.add(token);
    }
  }
  return [...seen];
};

const followerFigure = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\s*(人关注|位关注|关注)$/u, '').trim() || trimmed;
};

const albumCaption = (album: Album) => [album.year ? String(album.year) : '', album.genre].filter(Boolean).join(' · ');

const ArtistDesktop: React.FC<{
  artist: Artist;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onBack: () => void;
  onOpenAlbumDetail: (album: Album) => void;
}> = ({ artist, isFollowed, onToggleFollow, onBack, onOpenAlbumDetail }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [albumsExpanded, setAlbumsExpanded] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const styles = styleTokens(artist);
  const heroStyle = styles.slice(0, 4).join(' / ');
  const archiveStyle = styles.join(' / ');
  const followers = followerFigure(artist.followers);
  const portrait = artist.bannerUrl || artist.albums[0]?.coverUrl || artist.avatarUrl || '';
  const facts = [
    { label: '专辑', value: String(artist.albumCount) },
    ...(followers ? [{ label: '关注', value: followers }] : []),
    ...(archiveStyle ? [{ label: '音乐风格', value: archiveStyle }] : []),
  ];
  const hasExtraAlbums = artist.albums.length > 4;

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  const toggleAlbums = () => {
    if (hasExtraAlbums) setAlbumsExpanded((value) => !value);
  };

  return (
    <div className="artist-desktop">
      <section className="artist-hero">
        <div className="artist-hero__media" aria-hidden="true">
          {portrait && <ArtworkImage className="artist-hero__photo" src={portrait} alt="" />}
          <div className="artist-hero__shade" />
          <div className="artist-hero__floor" />
        </div>
        <div className="artist-hero__content">
          <button type="button" className="artist-hero__back" onClick={onBack} aria-label="返回">
            <ChevronLeft size={22} />
          </button>
          <div className="artist-hero__copy">
            <h1>{artist.name}</h1>
            {heroStyle && <p className="artist-hero__genre">{heroStyle}</p>}
            <div className="artist-hero__actions">
              <button type="button" className="artist-hero__follow" aria-pressed={isFollowed} onClick={onToggleFollow}>
                {isFollowed ? <Check size={15} strokeWidth={2.4} /> : <Plus size={15} strokeWidth={2.4} />}
                <span>{isFollowed ? '已关注' : '关注'}</span>
              </button>
              <div className="artist-hero__more-wrap" ref={moreRef}>
                <button
                  type="button"
                  className="artist-hero__more"
                  aria-label="更多"
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  onClick={() => setMoreOpen((value) => !value)}
                >
                  <MoreHorizontal size={18} />
                </button>
                {moreOpen && (
                  <div className="artist-hero__menu" role="menu">
                    <button type="button" role="menuitem" onClick={() => { setMoreOpen(false); onBack(); }}>返回</button>
                  </div>
                )}
              </div>
            </div>
            <div className="artist-hero__stats">
              <div>
                <strong>{artist.albumCount}</strong>
                <span>专辑</span>
              </div>
              {followers && (
                <div>
                  <strong className={followers.length > 6 ? 'is-long' : undefined}>{followers}</strong>
                  <span>关注</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="artist-desktop__body">
        <section className={`artist-dossier${portrait ? '' : ' is-no-portrait'}${facts.length ? '' : ' is-no-facts'}`} aria-labelledby="artist-archive-title">
          {portrait && <ArtworkImage className="artist-dossier__portrait" src={portrait} alt="" />}
          <div className="artist-dossier__copy">
            <h2 id="artist-archive-title">艺术家档案</h2>
            {artist.bio.trim() && <p>{artist.bio}</p>}
          </div>
          {facts.length > 0 && (
            <dl className="artist-dossier__facts">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="artist-albums" aria-labelledby="artist-albums-title">
          <div className="artist-albums__head">
            <h2 id="artist-albums-title"><span className="artist-albums__mark" aria-hidden="true" />热门黑胶专辑</h2>
            {artist.albums.length > 0 && (
              <div className="artist-albums__tools">
                {hasExtraAlbums && (
                  <button type="button" className="artist-albums__pager" aria-label={albumsExpanded ? '收起专辑' : '查看更多专辑'} onClick={toggleAlbums}>
                    <ChevronRight size={16} />
                  </button>
                )}
                <button type="button" className="artist-albums__all" onClick={toggleAlbums} aria-expanded={hasExtraAlbums ? albumsExpanded : undefined}>
                  {albumsExpanded && hasExtraAlbums ? '收起' : '查看全部'}
                </button>
              </div>
            )}
          </div>
          {artist.albums.length === 0 ? (
            <p className="artist-albums__empty">还没有这位艺术家的黑胶。</p>
          ) : (
            <div className={`artist-albums__grid${albumsExpanded ? ' is-expanded' : ''}`}>
              {artist.albums.map((album) => {
                const appearance = getVinylAppearance(album);
                return (
                  <article className="artist-record" key={album.id}>
                    <div className="artist-record__stage" aria-hidden="true">
                      <div className="artist-record__disc">
                        <VinylDisc
                          coverUrl={album.coverUrl}
                          albumTitle={album.title}
                          artistName={album.artist}
                          size="100%"
                          type={appearance.variant}
                          texture={appearance.texture}
                          vinylColors={appearance.colors}
                          labelColor={appearance.label?.color}
                          labelImage={appearance.label?.image}
                          labelText={appearance.label?.text}
                          rpm={album.rpm}
                          showSideLabel={false}
                        />
                      </div>
                      <div className="artist-record__sleeve">
                        <ArtworkImage src={album.coverUrl} alt="" draggable={false} />
                      </div>
                    </div>
                    <div className="artist-record__plinth" aria-hidden="true" />
                    <div className="artist-record__meta" aria-hidden="true">
                      <strong>{album.title}</strong>
                      {albumCaption(album) && <small>{albumCaption(album)}</small>}
                    </div>
                    <button
                      type="button"
                      className="artist-record__hit"
                      aria-label={[album.title, album.year || null, album.genre].filter(Boolean).join('，')}
                      onClick={() => onOpenAlbumDetail(album)}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
