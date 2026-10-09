import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArtworkImage } from '../components/ArtworkImage';
import { Album, Track } from '../types';
import { PlayerThemeRenderer } from '../features/player/themes/PlayerThemeRenderer';
import { PlayerControls } from '../features/player/themes/shared/PlayerControls';
import { PlayerProgress } from '../features/player/themes/shared/PlayerProgress';
import { PlayerTrackInfo } from '../features/player/themes/shared/PlayerTrackInfo';
import { PlayerThemeSelector } from '../features/player/themes/settings/PlayerThemeSelector';
import { playerThemeRegistry } from '../features/player/themes/playerThemeRegistry';
import type { PlayerThemePreference } from '../features/player/themes/usePlayerTheme';
import type { RepeatMode } from '../features/player/themes/PlayerTheme';
import './PlayerView.css';
import '../features/player/themes/themes/crescent/crescentPlayer.css';
import { LyricsView } from '../components/LyricsView';
import { SideFlipAnimation } from '../components/SideFlipAnimation';
import { usePlayerSideState } from '../hooks/usePlayerSideState';
import { getAlbumDiscs } from '../utils/vinylSides';
import {
  ChevronDown,
  Heart,
  Palette,
  FileText,
  ListMusic,
  Disc,
  Link2,
  RefreshCw,
  Upload,
  Volume2,
} from 'lucide-react';
import { hapticsService } from '../platform/platformService';
import type { TrackSource } from '../music';

interface PlayerViewProps {
  themePreference: PlayerThemePreference;
  favorite: boolean;
  onToggleFavorite: () => void;
  isShuffle: boolean;
  onShuffleChange: (value: boolean) => void;
  repeatMode: RepeatMode;
  onRepeatChange: (value: RepeatMode) => void;
  album: Album;
  currentTrack: Track;
  isPlaying: boolean;
  progressPercent: number;
  currentTimeSec: number;
  durationSec: number;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (percent: number) => void;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
  playbackSource: TrackSource | null;
  playbackMessage: string;
  isPreviewLoading: boolean;
  onImportLocalSource: () => void;
  localImportPending: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  themePreference, favorite, onToggleFavorite, isShuffle, onShuffleChange, repeatMode, onRepeatChange,
  album,
  currentTrack,
  isPlaying,
  progressPercent,
  currentTimeSec,
  durationSec,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onClose,
  onSelectTrack,
  playbackSource,
  playbackMessage,
  isPreviewLoading,
  onImportLocalSource,
  localImportPending,
  volume, onVolumeChange,
}) => {
  const [activePanel, setActivePanel] = useState<'none' | 'queue' | 'source'>('none');
  const [viewMode, setViewMode] = useState<'turntable' | 'lyrics'>('turntable');
  const themeDialog = useRef<HTMLDialogElement>(null);
  
  // 翻面状态管理
  const playerAlbum = useMemo(() => ({ ...album, discs: getAlbumDiscs(album) }), [album]);
  const sideState = usePlayerSideState(playerAlbum);
  const [isFlipping, setIsFlipping] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const sourceProvider = playbackSource?.provider === 'apple-music'
    ? 'Apple Music'
    : playbackSource?.provider === 'audius'
      ? 'Audius'
      : playbackSource?.provider === 'local'
        ? '本地音频'
        : playbackSource?.provider === 'jamendo'
          ? 'Jamendo'
          : '未连接';
  const sourceNeedsAttention = (!playbackSource && !isPreviewLoading) || localImportPending;

  // 获取当前面信息
  const currentVinylSide = sideState.getCurrentVinylSide();


  useEffect(() => {
    const matchingDisc = playerAlbum.discs?.find(disc =>
      disc.sides.some(side => side.tracks.some(track => track.id === currentTrack.id)),
    );
    const matchingSide = matchingDisc?.sides.find(side =>
      side.tracks.some(track => track.id === currentTrack.id),
    );
    if (matchingDisc && matchingSide &&
        (sideState.currentDisc !== matchingDisc.disc || sideState.currentSide !== matchingSide.side)) {
      sideState.switchToSide(matchingDisc.disc, matchingSide.side);
    }
  }, [currentTrack.id, playerAlbum, sideState.currentDisc, sideState.currentSide, sideState.switchToSide]);

  useEffect(() => {
    if (activePanel === 'none') return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePanel('none');
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [activePanel]);

  /**
   * 翻到下一面
   */
  const handleNextSide = () => {
    setIsFlipping(true);
    hapticsService.triggerHaptic('medium');
    
    setTimeout(() => {
      sideState.nextSide();
      setIsFlipping(false);
    }, 200);
  };

  /**
   * 翻到上一面
   */
  const handlePrevSide = () => {
    setIsFlipping(true);
    hapticsService.triggerHaptic('medium');
    
    setTimeout(() => {
      sideState.prevSide();
      setIsFlipping(false);
    }, 200);
  };

  /**
   * 处理唱片滑动翻面
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // 向左滑动 > 30px 翻到下一面，向右滑动 > 30px 翻到上一面
    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        handleNextSide();
      } else {
        handlePrevSide();
      }
    }
  };

  return (
    <div
      id="player-view-container"
      className="full-player" translate="no" data-player-theme={themePreference.themeId} data-player-view={viewMode} data-playing={isPlaying} style={playerThemeRegistry[themePreference.themeId].tokens}
    >
      {/* Top Bar - Minimalist Hardware Feel */}
      <header className="full-player__header">
        <button
          id="player-close-btn"
          type="button"
          onClick={onClose}
          className="full-player__quiet-button"
          title="收起播放器"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {themePreference.themeId === 'crescent' ? <span className="crescent-header-spacer"><span className="player-desktop-brand">Vinyl Shelf</span></span> : <div className="full-player__brand" aria-hidden="true">
          <strong>ORBIT</strong>
          <span>轻触封面播放</span>
        </div>}

        {/* Dual Mode Switcher: 唱机 vs 全量同步歌词 */}
        <div className="full-player__modes">
          <button
            id="player-mode-turntable"
            type="button"
            onClick={() => {
              setViewMode('turntable');
              hapticsService.triggerHaptic('light');
            }}
            aria-pressed={viewMode === 'turntable'}
            className={`full-player__mode ${viewMode === 'turntable' ? 'is-active' : ''}`}
          >
            <Disc className="w-3 h-3" />
            <span>唱机</span>
          </button>
          <button
            id="player-mode-lyrics"
            type="button"
            onClick={() => {
              setViewMode('lyrics');
              hapticsService.triggerHaptic('light');
            }}
            aria-pressed={viewMode === 'lyrics'}
            className={`full-player__mode ${viewMode === 'lyrics' ? 'is-active' : ''}`}
          >
            <FileText className="w-3 h-3" />
            <span>歌词</span>
          </button>
        </div>

        <div className="pt-header-actions">
          <button type="button" className="full-player__quiet-button pt-source-button" title="音源与来源" aria-label={`音源与来源：${sourceNeedsAttention ? '需要处理' : playbackSource ? '已连接' : '正在匹配'}`} aria-controls="player-source-panel" aria-expanded={activePanel === 'source'} data-attention={sourceNeedsAttention || undefined} onClick={() => setActivePanel(activePanel === 'source' ? 'none' : 'source')}><Link2 size={18}/><span aria-hidden="true" /></button>
          <button type="button" className="full-player__quiet-button" title="播放队列" aria-label="播放队列" aria-expanded={activePanel === 'queue'} onClick={() => setActivePanel(activePanel === 'queue' ? 'none' : 'queue')}><ListMusic size={18}/></button>
          <button type="button" className="full-player__quiet-button" title="播放器样式" aria-label="播放器样式" onClick={() => themeDialog.current?.showModal()}><Palette size={18}/></button>
        </div>
      </header>

      {activePanel === 'source' && (
        <section id="player-source-panel" className="player-source-panel" role="dialog" aria-labelledby="player-source-title">
          <header>
            <div>
              <h2 id="player-source-title">音源与来源</h2>
              <p>{isPreviewLoading ? '正在匹配音源' : playbackSource ? '当前歌曲已连接' : '当前歌曲需要补充音源'}</p>
            </div>
            <button type="button" onClick={() => setActivePanel('none')}>完成</button>
          </header>
          <dl>
            <div><dt>来源</dt><dd>{sourceProvider}{playbackSource ? ` · ${playbackSource.previewOnly ? '试听片段' : '完整音源'}` : ''}</dd></div>
            {playbackSource?.metadata.filename && <div><dt>文件</dt><dd>{playbackSource.metadata.filename}</dd></div>}
          </dl>
          {playbackMessage && <p className="player-source-panel__message" role="status">{playbackMessage}</p>}
          <footer>
            {!playbackSource && !isPreviewLoading && <button type="button" onClick={onTogglePlay}><RefreshCw/>重新匹配</button>}
            {playbackSource?.metadata.storeUrl && <a href={playbackSource.metadata.storeUrl} target="_blank" rel="noreferrer">查看来源</a>}
            <button type="button" className="is-primary" onClick={onImportLocalSource} disabled={isPreviewLoading}><Upload/>{localImportPending ? '确认绑定' : playbackSource ? '更换音源' : '添加音源'}</button>
          </footer>
        </section>
      )}

      {/* Main Stage: Turntable Mode OR Synchronized Lyrics Mode */}
      <div className="full-player__turntable" hidden={viewMode !== 'turntable'}>
        {/* 唱片容器 - 支持滑动翻面 */}
        <div
          className="player-stage-layout flex-1 flex items-center justify-center touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 唱片渲染区 - 集成翻面动画 */}
          <SideFlipAnimation
            isFlipping={isFlipping}
            duration={200}
            respectMotionPreference
            className="player-stage-shell w-full h-full flex items-center justify-center"
            exitContent={
              <PlayerThemeRenderer
                themeId={themePreference.themeId}
                album={album}
                currentTrack={currentTrack}
                queue={currentVinylSide?.tracks ?? album.tracks}
                isPlaying={isPlaying}
                isPreviewLoading={isPreviewLoading}
                progressPercent={progressPercent}
                onSelectTrack={onSelectTrack}
                onTogglePlay={onTogglePlay}
                onShowLyrics={() => setViewMode('lyrics')}
              />
            }
            enterContent={
              <PlayerThemeRenderer
                themeId={themePreference.themeId}
                album={album}
                currentTrack={currentTrack}
                queue={currentVinylSide?.tracks ?? album.tracks}
                isPlaying={isPlaying}
                isPreviewLoading={isPreviewLoading}
                progressPercent={progressPercent}
                onSelectTrack={onSelectTrack}
                onTogglePlay={onTogglePlay}
                onShowLyrics={() => setViewMode('lyrics')}
              />
            }
          />
        </div>

        {themePreference.themeId === 'crescent' && <section className="player-desktop-details" aria-label="专辑与曲目">
          <p className="player-desktop-details__album">{album.title}{album.year ? ` · ${album.year}` : ''}</p>
          <h1 title={currentTrack.title}>{currentTrack.title}</h1>
          <p className="player-desktop-details__artist">{album.artist}</p>
          <header><h2>曲目列表</h2><span>{album.tracks.length} 首</span></header>
          <ol className="player-desktop-queue">
            {album.tracks.map((track, index) => <li key={track.id}>
              <button type="button" aria-label={`播放歌曲：${track.title}`} aria-current={track.id === currentTrack.id ? 'true' : undefined} onClick={() => onSelectTrack(track)}>
                <span className="player-desktop-queue__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="player-desktop-queue__title">{track.title}</span>
                {track.id === currentTrack.id && <span className="player-desktop-queue__status">{isPlaying ? '播放中' : '已选择'}</span>}
                <span className="player-desktop-queue__duration">{track.duration}</span>
              </button>
            </li>)}
          </ol>
        </section>}

        {themePreference.themeId !== 'crescent' && themePreference.themeId !== 'luminous-card' && (
          <PlayerTrackInfo album={album} currentTrack={currentTrack} favorite={favorite} onToggleFavorite={onToggleFavorite} />
        )}
      </div>

      {viewMode === 'lyrics' && (
        /* Full Synchronized Lyrics Viewport (Folia Major / QQ Music inspired) */
        <div className="relative flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden z-20 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-5 pt-2 pb-1 bg-black/40">
            <div className="truncate pr-2">
              <span className="text-[14px] font-bold text-white tracking-tight truncate block">
                {currentTrack.title}
              </span>
              <span className="text-[11px] text-[#BBCBB2] tracking-wide truncate block">
                {album.artist} · {album.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewMode('turntable');
                hapticsService.triggerHaptic('light');
              }}
              className="px-2.5 py-1 rounded-[4px] bg-[#141418] border border-[#222228] text-[10.5px] text-white/80 hover:text-white flex items-center gap-1.5 flex-shrink-0 transition-colors"
              title="切回唱片机视图"
            >
              <Disc className="w-3 h-3 text-[#2FE92B]" />
              <span>切回唱机</span>
            </button>
          </div>

          <div className="flex-1 w-full min-h-0 overflow-hidden">
            <LyricsView
              currentTrack={currentTrack}
              album={album}
              currentTimeSec={currentTimeSec}
              durationSec={durationSec}
              isPlaying={isPlaying}
              onSeek={onSeek}
              onClose={() => setViewMode('turntable')}
            />
          </div>
        </div>
      )}

      {/* Bottom Controls Area (Restrained 80/15/5 ratio) */}
      <div className="full-player__controls">
        {themePreference.themeId === 'crescent' && <div className="crescent-controls__track" aria-label="当前播放">
          <ArtworkImage className="player-desktop-thumbnail" src={album.coverUrl} alt="" />
          <div className="crescent-controls__track-title">
            <strong title={currentTrack.title}>{currentTrack.title}</strong>
          </div>
          <div className="crescent-controls__track-meta">
            <span title={`${album.artist} · ${album.title}`}>{album.artist}</span>
            <button type="button" id="player-favorite" aria-label={favorite ? '取消当前专辑的喜爱标记' : '将当前专辑标记为喜爱'} aria-pressed={favorite} onClick={onToggleFavorite}><Heart size={18} fill={favorite ? 'currentColor' : 'none'}/></button>
          </div>
        </div>}
        {themePreference.themeId === 'crescent' && <div className="player-desktop-volume">
          <Volume2 size={20} aria-hidden="true" />
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={event => onVolumeChange(Number(event.target.value))} aria-label="音量" />
        </div>}
        <PlayerControls artwork={themePreference.themeId === 'classic' || themePreference.themeId === 'crescent' || themePreference.themeId === 'luminous-card' ? undefined : album.coverUrl} isPlaying={isPlaying} loading={isPreviewLoading} shuffle={isShuffle} repeatMode={repeatMode} onShuffleChange={onShuffleChange} onRepeatChange={onRepeatChange} onTogglePlay={onTogglePlay} onPrevTrack={onPrevTrack} onNextTrack={onNextTrack} />
        <PlayerProgress progress={progressPercent} currentTime={currentTimeSec} duration={durationSec} onSeek={onSeek} />
      </div>

      <dialog ref={themeDialog} className="pt-theme-dialog" aria-label="播放器样式">
        <header><h2>播放器样式</h2><button type="button" onClick={() => themeDialog.current?.close()}>完成</button></header>
        <PlayerThemeSelector preference={themePreference}/>
      </dialog>

      {activePanel === 'queue' && (
        <div
          id="player-modal-sheet"
          className="absolute inset-x-0 bottom-0 max-h-[65%] bg-[#0D0D10] border-t border-[#202026] rounded-t-[10px] z-50 p-4 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
            <span className="text-[13px] font-bold text-white">播放队列 · {album.title}</span>
            <button type="button" onClick={() => setActivePanel('none')} className="text-[11px] text-white/60 hover:text-white px-3 py-1 rounded-[4px] bg-[#16161C]">收起</button>
          </div>

          <div className="overflow-y-auto no-scrollbar py-2 space-y-2 flex-1 min-h-0">
            <div className="space-y-1">
              {(currentVinylSide?.tracks ?? album.tracks).length > 0 ? (
                (currentVinylSide?.tracks ?? album.tracks).map((track) => {
                  const isCurrent = track.id === currentTrack.id;
                  return (
                    <button
                      type="button"
                      aria-label={`播放歌曲：${track.title}`}
                      key={track.id}
                      onClick={() => {
                        onSelectTrack(track);
                        setActivePanel('none');
                        hapticsService.triggerHaptic('light');
                      }}
                      className={`w-full text-left flex items-center justify-between p-2.5 rounded-[4px] cursor-pointer transition-colors ${isCurrent ? 'bg-[#16161C] text-[#2FE92B]' : 'hover:bg-[#141418] text-white'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-mono opacity-50 w-6">{track.number}</span>
                        <span className="text-[13px] font-medium truncate">{track.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-white/40">{track.duration}</span>
                    </button>
                  );
                })
              ) : (
                <p className="text-[12px] text-white/50 py-4 text-center">暂无曲目信息</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
