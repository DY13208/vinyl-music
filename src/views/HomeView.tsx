import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Disc3, Headphones, Palette, Pause, Play, Plus, Search, X } from 'lucide-react';
import { Album, Track } from '../types';
import { VerticalRecordBrowser } from '../components/VerticalRecordBrowser';
import { HOME_THEMES, HomeTheme } from '../hooks/useHomeTheme';
import './HomeView.css';

interface HomeViewProps {
  albums: Album[];
  carouselIndex: number;
  onSelectCarouselIndex: (index: number) => void;
  onOpenAlbumDetail: (album: Album) => void;
  onOpenSearch: () => void;
  onAddAlbum: () => void;
  theme: HomeTheme;
  onSelectTheme: (theme: HomeTheme) => void;
  themeMessage: string;
  playingAlbum: Album | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  playbackMessage: string;
  onPlayTrack: (album: Album, track: Track) => void;
  onTogglePlay: () => void;
  onOpenPlayer: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ albums, carouselIndex, onSelectCarouselIndex, onOpenAlbumDetail, onOpenSearch, onAddAlbum, theme, onSelectTheme, themeMessage, playingAlbum, currentTrack, isPlaying, isLoading, playbackMessage, onPlayTrack, onTogglePlay, onOpenPlayer }) => {
  const [filter, setFilter] = useState('全部');
  const themeDialog = useRef<HTMLDialogElement>(null);
  const themeButton = useRef<HTMLButtonElement>(null);
  const genres = [...new Set<string>(albums.map(album => album.genre.split(/[·/]/)[0].trim()).filter(Boolean))].slice(0, 3);
  const visibleAlbums = filter === '全部' ? albums : albums.filter(album => album.genre.split(/[·/]/)[0].trim() === filter);
  const selectedAlbum = albums[carouselIndex];
  const visibleIndex = Math.max(0, visibleAlbums.findIndex(album => album.id === selectedAlbum?.id));
  const currentAlbum = visibleAlbums[visibleIndex];
  const selectIndex = (index: number) => {
    const album = visibleAlbums[index];
    if (album) onSelectCarouselIndex(albums.findIndex(item => item.id === album.id));
  };
  const changeFilter = (next: string) => {
    setFilter(next);
    const first = albums.findIndex(album => next === '全部' || album.genre.split(/[·/]/)[0].trim() === next);
    if (first >= 0) onSelectCarouselIndex(first);
  };
  const closeThemes = () => { themeDialog.current?.close(); themeButton.current?.focus(); };

  return <main id="home-view" className="home-shelf" aria-label="黑胶唱片藏馆" translate="no" style={{ '--album-ambient': currentAlbum?.color || '#23302a' } as React.CSSProperties}>
    <div className="home-shelf__atmosphere" aria-hidden="true" />
    <header className="shelf-header">
      <div className="shelf-brand"><Disc3 aria-hidden="true" /><div><strong>Vinyl Shelf<span>®</span></strong><p>把喜欢的声音，留在身边。</p></div></div>
      <div className="shelf-header__actions">
        <button ref={themeButton} type="button" className="shelf-icon" aria-label="切换首页主题" aria-haspopup="dialog" onClick={() => themeDialog.current?.showModal()}><Palette size={20} /></button>
        <button id="home-search-btn" type="button" className="shelf-icon" aria-label="搜索唱片" onClick={onOpenSearch}><Search size={20} /></button>
      </div>
    </header>
    <div className="shelf-toolbar">
      <div className="shelf-filters" role="group" aria-label="按音乐类型浏览">
        {['全部', ...genres].map(genre => <button type="button" key={genre} aria-pressed={filter === genre} onClick={() => changeFilter(genre)}>{genre === '全部' ? '全部唱片' : genre}</button>)}
      </div>
      <span className="shelf-count">{visibleAlbums.length} 张</span>
    </div>
    {currentAlbum ? <div className="shelf-workspace">
      <aside className="shelf-catalog" aria-label="唱片缩略目录">
        <div className="shelf-section-label"><span>我的唱片架</span><span>{visibleAlbums.length}</span></div>
        <div className="shelf-catalog__list">
          {visibleAlbums.map((album, index) => <button key={album.id} type="button" aria-current={index === visibleIndex ? 'true' : undefined} aria-label={`选择唱片：${album.title}`} onClick={() => selectIndex(index)}>
            <img src={album.coverUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /><span><strong>{album.title}</strong><small>{album.artist}</small></span><span className="shelf-catalog__number">{String(index + 1).padStart(2, '0')}</span>
          </button>)}
        </div>
      </aside>
      <section className="shelf-focus" aria-label="当前唱片">
        <div className="shelf-section-label shelf-focus__label"><span><i /> 从收藏中，重新发现</span><span>{currentAlbum.rpm}</span></div>
        <div className="shelf-stage">
          <VerticalRecordBrowser albums={visibleAlbums} currentIndex={visibleIndex} onSelectIndex={selectIndex} onOpenAlbumDetail={onOpenAlbumDetail} />
          <span className="shelf-stage__edge is-top" aria-hidden="true">{visibleIndex === 0 ? '唱片架的第一张' : '上一张'}</span>
          <span className="shelf-stage__edge is-bottom" aria-hidden="true">{visibleIndex === visibleAlbums.length - 1 ? '每张唱片，都是一段故事' : '向上滑动，翻阅下一张'}</span>
        </div>
        <div className="shelf-caption" aria-live="polite" aria-atomic="true">
          <div className="shelf-caption__metadata"><span>{currentAlbum.year || '年份待补充'}</span><span>{currentAlbum.genre}</span></div>
          <h1 title={currentAlbum.title}>{currentAlbum.title}</h1>
          <p>{currentAlbum.artist}</p>
          <button className="shelf-detail" type="button" onClick={() => onOpenAlbumDetail(currentAlbum)}>查看唱片 <ArrowUpRight size={15} /></button>
        </div>
        <div className="shelf-pagination">
          <button type="button" className="shelf-icon" aria-label="上一张唱片" disabled={visibleIndex === 0} onClick={() => selectIndex(visibleIndex - 1)}><ArrowUp size={18} /></button>
          <div><span>{String(visibleIndex + 1).padStart(2, '0')}</span><span className="shelf-pagination__line"><i style={{ width: `${((visibleIndex + 1) / visibleAlbums.length) * 100}%` }} /></span><span>{String(visibleAlbums.length).padStart(2, '0')}</span></div>
          <button type="button" className="shelf-icon" aria-label="下一张唱片" disabled={visibleIndex === visibleAlbums.length - 1} onClick={() => selectIndex(visibleIndex + 1)}><ArrowDown size={18} /></button>
        </div>
      </section>
      <aside className="shelf-listening" aria-label="当前专辑曲目">
        <div className="shelf-section-label"><span><Headphones size={15} /> 放下一根唱针</span><span>{currentAlbum.tracks.length} 首可选</span></div>
        <h2>{currentAlbum.title}</h2><p className="shelf-listening__edition">{currentAlbum.edition}</p>
        <div className="shelf-track-list">
          {currentAlbum.tracks.map(track => {
            const active = playingAlbum?.id === currentAlbum.id && currentTrack?.id === track.id;
            return <button key={track.id} type="button" aria-label={`${active && isPlaying ? '暂停' : '播放'}歌曲：${track.title}`} aria-current={active ? 'true' : undefined} disabled={isLoading} onClick={() => active ? onTogglePlay() : onPlayTrack(currentAlbum, track)}>
              <span>{active && isPlaying ? <Pause size={14} /> : String(track.number).padStart(2, '0')}</span><strong>{track.title}</strong><small>{track.duration}</small><Play size={13} />
            </button>;
          })}
          {!currentAlbum.tracks.length && <p>这张唱片还没有曲目信息，可在详情中查看版本资料。</p>}
        </div>
        <p className="shelf-listening__note">{currentAlbum.label}<br />{currentAlbum.rpm} · {currentAlbum.weight}</p>
      </aside>
    </div> : <section className="shelf-empty"><Disc3 size={52} /><h1>{albums.length ? '这个分类还没有唱片' : '你的第一张唱片，从这里开始'}</h1><p>把珍藏加入唱片架，向上滑动，慢慢翻阅。</p><button type="button" onClick={albums.length ? () => changeFilter('全部') : onAddAlbum}>{albums.length ? '查看全部唱片' : <><Plus size={18} /> 添加唱片</>}</button></section>}
    {playingAlbum && currentTrack && <section className="shelf-now" aria-label="继续聆听">
      <button className="shelf-now__open" type="button" onClick={onOpenPlayer} aria-label={`打开播放器：${currentTrack.title}`}>
        <img src={playingAlbum.coverUrl} alt="" referrerPolicy="no-referrer" /><span><small>{isLoading ? '正在查找音源' : isPlaying ? '正在聆听' : '继续聆听'}</small><strong>{currentTrack.title} <span>· {playingAlbum.artist}</span></strong></span>
      </button>
      <button className="shelf-now__play" type="button" disabled={isLoading} aria-label={isPlaying ? '暂停当前歌曲' : '播放当前歌曲'} onClick={onTogglePlay}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
    </section>}
    {playbackMessage && <p className="shelf-playback-status" role="status">{playbackMessage}</p>}
    <dialog ref={themeDialog} className="shelf-themes" aria-labelledby="shelf-theme-title" onCancel={closeThemes} onClick={event => { if (event.target === event.currentTarget) closeThemes(); }}>
      <div className="shelf-themes__content">
        <div className="shelf-themes__heading"><div><h2 id="shelf-theme-title">给唱片架，换个氛围</h2><p>同一份收藏，四种心境。</p></div><button type="button" className="shelf-icon" aria-label="关闭主题选择" onClick={closeThemes}><X size={20} /></button></div>
        <div className="shelf-themes__options">{HOME_THEMES.map(item => <button key={item.id} type="button" aria-pressed={theme === item.id} onClick={() => onSelectTheme(item.id)}>
          <span className={`shelf-theme-preview is-${item.id}`} aria-hidden="true"><i /><b /></span><span><strong>{item.name}</strong><small>{item.detail}</small></span>{theme === item.id && <Check size={18} />}
        </button>)}</div>
        <p className="shelf-themes__hint" role="status">{themeMessage || '主题会保存在此设备，收藏与播放保持连续。'}</p>
      </div>
    </dialog>
  </main>;
};
