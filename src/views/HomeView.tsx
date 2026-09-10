import React, { useEffect, useRef, useState } from 'react';
import { Disc3, Search, X } from 'lucide-react';
import { Album, Track } from '../types';
import { VerticalRecordBrowser } from '../components/VerticalRecordBrowser';
import { AlbumBrowser } from '../components/browse/AlbumBrowser';
import { BrowseState } from '../hooks/useAlbumBrowserState';
import { HomeTheme } from '../hooks/useHomeTheme';
import './HomeView.css';

interface HomeViewProps {
  browse: BrowseState;
  albums: Album[]; carouselIndex: number; onSelectCarouselIndex: (index: number) => void;
  onOpenAlbumDetail: (album: Album) => void; onOpenSearch: () => void; onAddAlbum: () => void;
  theme: HomeTheme; onSelectTheme: (theme: HomeTheme) => void; themeMessage: string;
  playingAlbum: Album | null; currentTrack: Track | null; isPlaying: boolean; isLoading: boolean;
  playbackMessage: string; onPlayTrack: (album: Album, track: Track) => void;
  onTogglePlay: () => void; onOpenPlayer: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ browse, albums, carouselIndex, onSelectCarouselIndex, onOpenAlbumDetail, onOpenSearch, onAddAlbum, playingAlbum, currentTrack, isPlaying, isLoading, playbackMessage, onPlayTrack, onTogglePlay, onOpenPlayer }) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const infoDialog = useRef<HTMLDialogElement>(null);
  const currentAlbum = albums[carouselIndex] || albums[0];
  const isCurrentPlaying = playingAlbum?.id === currentAlbum?.id;

  useEffect(() => { if (isInfoOpen) infoDialog.current?.showModal(); }, [isInfoOpen]);
  const closeInfo = () => { infoDialog.current?.close(); setIsInfoOpen(false); };

  return <main id="home-view" className="home-shelf" aria-label="黑胶唱片藏馆" translate="no" style={{ '--album-ambient': currentAlbum?.color || '#23302a' } as React.CSSProperties}>
    <div className="home-shelf__atmosphere" aria-hidden="true" />
    <header className="shelf-header">
      <div className="shelf-brand"><Disc3 aria-hidden="true" /><strong>Vinyl Shelf</strong></div>
      <button id="home-search-btn" type="button" className="shelf-icon" aria-label="搜索唱片" onClick={onOpenSearch}><Search size={20} /></button>
    </header>

    {currentAlbum ? <section className="shelf-focus" aria-label="当前唱片">
      <AlbumBrowser albums={albums} browse={browse} onOpenAlbumDetail={onOpenAlbumDetail} portrait={<div className="shelf-stage shelf-stage--portrait">
        <VerticalRecordBrowser albums={albums} currentIndex={carouselIndex} onSelectIndex={onSelectCarouselIndex} onOpenAlbumDetail={onOpenAlbumDetail} />
      </div>} />
      <div className="shelf-caption" aria-live="polite" aria-atomic="true"><h1 title={currentAlbum.title}>{currentAlbum.title}</h1><p>{currentAlbum.artist}</p></div>
      <div className="shelf-pagination" aria-label={`第 ${carouselIndex + 1} 张，共 ${albums.length} 张`}><span>{String(carouselIndex + 1).padStart(2, '0')}</span><span aria-hidden="true">/</span><span>{String(albums.length).padStart(2, '0')}</span></div>
    </section> : <section className="shelf-empty"><Disc3 size={52} /><h1>你的第一张唱片</h1><button type="button" onClick={onAddAlbum}>添加唱片</button></section>}

    <dialog id="album-info-sheet" ref={infoDialog} className="shelf-info" aria-labelledby="album-info-title" onCancel={closeInfo} onClose={() => setIsInfoOpen(false)} onClick={event => { if (event.target === event.currentTarget) closeInfo(); }}>
      {currentAlbum && <div className="shelf-info__content">
        <div className="shelf-info__handle" aria-hidden="true" />
        <header><div><h2 id="album-info-title">{currentAlbum.title}</h2><p>{currentAlbum.artist}</p></div><button type="button" className="shelf-icon" aria-label="收起专辑信息" onClick={closeInfo}><X size={20} /></button></header>
        <dl><div><dt>年份</dt><dd>{currentAlbum.year || '—'}</dd></div><div><dt>风格</dt><dd>{currentAlbum.genre || '—'}</dd></div><div><dt>曲目</dt><dd>{currentAlbum.tracks.length} 首</dd></div><div><dt>音源</dt><dd>{isCurrentPlaying && currentTrack ? (playbackMessage || '已就绪') : '播放时匹配'}</dd></div></dl>
        <div className="shelf-info__tracks" aria-label="播放队列">{currentAlbum.tracks.map(track => { const active = isCurrentPlaying && currentTrack?.id === track.id; return <button key={track.id} type="button" aria-current={active ? 'true' : undefined} disabled={isLoading} onClick={() => active ? onTogglePlay() : onPlayTrack(currentAlbum, track)}><span>{String(track.number).padStart(2, '0')}</span><strong>{track.title}</strong><small>{track.duration}</small></button>; })}</div>
        <button type="button" className="shelf-info__detail" onClick={() => onOpenAlbumDetail(currentAlbum)}>查看完整专辑</button>
      </div>}
    </dialog>
  </main>;
};
