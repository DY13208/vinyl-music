import React, { useState, useRef, useEffect } from 'react';
import { Album, Track, VinylSide } from '../types';
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
import {
  ChevronDown,
  Heart,
  Palette,
  Play,
  Volume2,
  FileText,
  ListMusic,
  Sliders,
  Speaker,
  Sparkles,
  Disc,
  Maximize2,
  MoreHorizontal,
  Shuffle,
  Repeat,
  ChevronLeft,
  ChevronRight,
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
}) => {
  const [activeBottomModal, setActiveBottomModal] = useState<'none' | 'more' | 'lyrics' | 'queue' | 'output' | 'quality'>('none');
  const [viewMode, setViewMode] = useState<'turntable' | 'lyrics'>('turntable');
  const [isCrackleEnabled, setIsCrackleEnabled] = useState(true);
  const themeDialog = useRef<HTMLDialogElement>(null);
  
  // 翻面状态管理
  const sideState = usePlayerSideState(album);
  const [isFlipping, setIsFlipping] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  // 获取当前面信息
  const currentVinylSide = sideState.getCurrentVinylSide();
  const availableSides = sideState.getAvailableSides();

  /**
   * 处理翻面动画
   */
  const handleFlipSide = (disc: number, side: string) => {
    if (sideState.currentSide === side && sideState.currentDisc === disc) return;
    
    setIsFlipping(true);
    hapticsService.triggerHaptic('medium');
    
    setTimeout(() => {
      sideState.switchToSide(disc, side);
      setIsFlipping(false);
    }, 200); // 动画时长
  };

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

  /**
   * 获取标签信息（支持图片或文字）
   */
  const getLabelContent = () => {
    if (!currentVinylSide) return null;

    if (currentVinylSide.labelImage) {
      return (
        <img
          src={currentVinylSide.labelImage}
          alt={`Side ${currentVinylSide.side}`}
          className="w-full h-full object-cover rounded-full"
        />
      );
    }

    // 降级到文字标签
    const bgColor = currentVinylSide.labelColor || '#d8c9a7';
    return (
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-2xl"
        style={{ backgroundColor: bgColor }}
      >
        {currentVinylSide.side}
      </div>
    );
  };

  /**
   * 获取当前面的曲目
   */
  const getCurrentSideTracks = (): Track[] => {
    return currentVinylSide?.tracks || [];
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

        {themePreference.themeId === 'crescent' ? <div className="crescent-header-track">
          <div className="crescent-header-track__title">
            <h2 title={currentTrack.title}>{currentTrack.title}</h2>
            <button type="button" id="player-favorite" aria-label={favorite ? '取消收藏当前专辑' : '收藏当前专辑'} aria-pressed={favorite} onClick={onToggleFavorite}><Heart size={18} /></button>
          </div>
          <p title={`${album.artist} · ${album.title}`}>{album.artist} · {album.title}</p>
        </div> : <div className="full-player__brand" aria-hidden="true">
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
        <button type="button" className="full-player__quiet-button" title="播放器样式" aria-label="播放器样式" onClick={() => themeDialog.current?.showModal()}><Palette size={18}/></button>
         {/* Vinyl Surface Noise / Crackle Audio Switch */}
         <button
           id="player-crackle-toggle"
           type="button"
           onClick={() => {
             setIsCrackleEnabled(!isCrackleEnabled);
             hapticsService.triggerHaptic('light');
           }}
           className="full-player__quiet-button"
           aria-pressed={isCrackleEnabled}
           title="实体唱针底噪模拟"
         >
           <Volume2 className="w-4 h-4" />
         </button>
        </div>
        <button type="button" className="full-player__more-button" aria-label="更多播放操作" aria-expanded={activeBottomModal !== 'none'} onClick={() => setActiveBottomModal(activeBottomModal === 'more' ? 'none' : 'more')}><MoreHorizontal size={18}/></button>
      </header>

      {/* Main Stage: Turntable Mode OR Synchronized Lyrics Mode */}
      <div className="full-player__turntable" hidden={viewMode !== 'turntable'}>
        {/* 翻面控制区 - 仅在有多面时显示 */}
        {availableSides.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2 bg-black/20">
            <button
              type="button"
              onClick={handlePrevSide}
              disabled={isFlipping}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/70 hover:text-white disabled:opacity-50 transition-colors"
              title="翻到上一面"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>上一面</span>
            </button>

            {/* 当前面状态指示 */}
            <div className="flex items-center gap-2">
              {sideState.getDiscs().map((disc) => (
                <div key={disc.disc} className="flex items-center gap-1">
                  {disc.sides.map((side) => (
                    <button
                      key={side.side}
                      type="button"
                      onClick={() => handleFlipSide(disc.disc, side.side)}
                      disabled={isFlipping}
                      className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold transition-all ${
                        sideState.currentSide === side.side && sideState.currentDisc === disc.disc
                          ? 'bg-[#2FE92B] text-black'
                          : 'bg-[#1a1a1f] text-white/60 hover:text-white'
                      }`}
                      title={`切换到 Disc ${disc.disc} Side ${side.side}`}
                    >
                      {disc.discs && disc.discs.length > 1 ? `${disc.disc}${side.side}` : side.side}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNextSide}
              disabled={isFlipping}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/70 hover:text-white disabled:opacity-50 transition-colors"
              title="翻到下一面"
            >
              <span>下一面</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 唱片容器 - 支持滑动翻面 */}
        <div
          className="flex-1 flex items-center justify-center touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 唱片渲染区 - 集成翻面动画 */}
          <SideFlipAnimation
            isFlipping={isFlipping}
            duration={200}
            respectMotionPreference
            className="w-full h-full flex items-center justify-center"
            exitContent={
              <PlayerThemeRenderer
                themeId={themePreference.themeId}
                album={album}
                currentTrack={currentTrack}
                queue={getCurrentSideTracks()}
                isPlaying={isPlaying}
                isPreviewLoading={isPreviewLoading}
                progressPercent={progressPercent}
              />
            }
            enterContent={
              <PlayerThemeRenderer
                themeId={themePreference.themeId}
                album={album}
                currentTrack={currentTrack}
                queue={getCurrentSideTracks()}
                isPlaying={isPlaying}
                isPreviewLoading={isPreviewLoading}
                progressPercent={progressPercent}
              />
            }
          />
        </div>

        {themePreference.themeId !== 'crescent' && (
          <PlayerTrackInfo album={album} currentTrack={currentTrack} favorite={favorite} onToggleFavorite={onToggleFavorite} playbackSource={playbackSource} />
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
        <PlayerProgress progress={progressPercent} currentTime={currentTimeSec} duration={durationSec} onSeek={onSeek} animated={themePreference.themeId === 'crescent'} />
        <PlayerControls artwork={themePreference.themeId === 'classic' || themePreference.themeId === 'crescent' ? undefined : album.coverUrl} isPlaying={isPlaying} loading={isPreviewLoading} shuffle={isShuffle} onShuffleChange={onShuffleChange} repeat={repeatMode} onRepeatChange={onRepeatChange} onTogglePlay={onTogglePlay} onPrevTrack={handlePrevSide} onNextTrack={handleNextSide} />

        {/* Bottom 4 Utility Tools */}
        <div className="full-player__utilities">
          <button
            id="player-util-lyrics"
            type="button"
            onClick={() => {
              setViewMode(viewMode === 'lyrics' ? 'turntable' : 'lyrics');
              setActiveBottomModal('none');
              hapticsService.triggerHaptic('light');
            }}
            className={`flex items-center gap-1.5 text-[11px] py-1 px-2.5 rounded-[4px] transition-all ${
              viewMode === 'lyrics'
                ? 'text-white bg-[#18181E] border border-[#2B2B36]'
                : 'hover:text-white'
            }`}
            title="切换全量同步歌词模式"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>歌词</span>
          </button>

          <button
            id="player-util-queue"
            type="button"
            onClick={() => setActiveBottomModal(activeBottomModal === 'queue' ? 'none' : 'queue')}
            className={`flex items-center gap-1.5 text-[11px] py-1 px-2 rounded-[4px] transition-colors ${
              activeBottomModal === 'queue' ? 'text-white bg-[#18181E]' : 'hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>曲目</span>
          </button>

          <button
            id="player-util-output"
            type="button"
            onClick={() => setActiveBottomModal(activeBottomModal === 'output' ? 'none' : 'output')}
            className={`flex items-center gap-1.5 text-[11px] py-1 px-2 rounded-[4px] transition-colors ${
              activeBottomModal === 'output' ? 'text-white bg-[#18181E]' : 'hover:text-white'
            }`}
          >
            <Speaker className="w-3.5 h-3.5" />
            <span>唱放</span>
          </button>

          <button
            id="player-util-quality"
            type="button"
            onClick={() => setActiveBottomModal(activeBottomModal === 'quality' ? 'none' : 'quality')}
            className={`flex items-center gap-1.5 text-[11px] py-1 px-2 rounded-[4px] transition-colors ${
              activeBottomModal === 'quality' ? 'text-white bg-[#18181E]' : 'hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="font-mono text-white/70">Master</span>
          </button>
        </div>
      </div>

      <dialog ref={themeDialog} className="pt-theme-dialog" aria-label="播放器样式">
        <header><h2>播放器样式</h2><button type="button" onClick={() => themeDialog.current?.close()}>完成</button></header>
        <PlayerThemeSelector preference={themePreference}/>
      </dialog>

      {/* Modal Drawers */}
      {activeBottomModal !== 'none' && (
        <div
          id="player-modal-sheet"
          className="absolute inset-x-0 bottom-0 max-h-[65%] bg-[#0D0D10] border-t border-[#202026] rounded-t-[10px] z-50 p-4 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
            <span className="text-[13px] font-bold text-white flex items-center gap-2">
              {activeBottomModal === 'more' && '更多播放操作'}
              {activeBottomModal === 'lyrics' && '全量同步歌词 · Folia Major'}
              {activeBottomModal === 'queue' && `曲目清单 · ${album.title} (${currentVinylSide?.side || 'N/A'})`}
              {activeBottomModal === 'output' && '输出硬件'}
              {activeBottomModal === 'quality' && '黑胶声学与均衡'}
            </span>
            <div className="flex items-center gap-2">
              {activeBottomModal === 'lyrics' && (
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('lyrics');
                    setActiveBottomModal('none');
                    hapticsService.triggerHaptic('light');
                  }}
                  className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white px-2 py-0.5 rounded-[4px] bg-[#16161C] border border-[#262730]"
                  title="全屏歌词流"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>全屏</span>
                </button>
              )}
              <button
                onClick={() => setActiveBottomModal('none')}
                className="text-[11px] text-white/50 hover:text-white px-2 py-0.5 rounded-[4px] bg-[#16161C]"
              >
                收起
              </button>
            </div>
          </div>

          <div className="overflow-y-auto no-scrollbar py-2 space-y-2 flex-1 min-h-0">
            {activeBottomModal === 'more' && (
              <div className="player-more">
                <div className="player-more__source">
                  <strong>当前音源</strong>
                  <p>{playbackMessage || '尚未连接可播放音源'}</p>
                  <div>
                    {playbackSource?.metadata.storeUrl && <a href={playbackSource.metadata.storeUrl} target="_blank" rel="noreferrer">在 Apple Music 打开</a>}
                    <button type="button" onClick={onImportLocalSource} disabled={isPreviewLoading}>{localImportPending ? '确认绑定本地音源' : '导入本地音源'}</button>
                  </div>
                </div>
                <div className="player-more__actions">
                  <button type="button" aria-pressed={isShuffle} onClick={() => onShuffleChange(!isShuffle)}><Shuffle/><span>随机播放</span></button>
                  <button type="button" aria-pressed={repeatMode !== 'off'} onClick={() => onRepeatChange(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}><Repeat/><span>{repeatMode === 'off' ? '全曲循环' : repeatMode === 'all' ? '单曲循环' : '关闭循环'}</span></button>
                  <button type="button" onClick={() => { setViewMode('lyrics'); setActiveBottomModal('none'); }}><FileText/><span>歌词</span></button>
                  <button type="button" onClick={() => setActiveBottomModal('queue')}><ListMusic/><span>曲目</span></button>
                  <button type="button" onClick={() => setActiveBottomModal('output')}><Speaker/><span>唱放</span></button>
                  <button type="button" onClick={() => setActiveBottomModal('quality')}><Sliders/><span>音效</span></button>
                </div>
              </div>
            )}
            {activeBottomModal === 'lyrics' && (
              <div className="h-[380px] w-full flex flex-col">
                <LyricsView
                  currentTrack={currentTrack}
                  album={album}
                  currentTimeSec={currentTimeSec}
                  durationSec={durationSec}
                  isPlaying={isPlaying}
                  onSeek={onSeek}
                />
              </div>
            )}

            {activeBottomModal === 'queue' && (
              <div className="space-y-1">
                {/* 显示当前面的曲目 */}
                {getCurrentSideTracks().length > 0 ? (
                  getCurrentSideTracks().map((track) => {
                    const isCurrent = track.id === currentTrack.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => {
                          onSelectTrack(track);
                          setActiveBottomModal('none');
                          hapticsService.triggerHaptic('light');
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-[4px] cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-[#16161C] text-[#2FE92B]'
                            : 'hover:bg-[#141418] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono opacity-50 w-6">
                            {currentVinylSide?.side}{track.number}
                          </span>
                          <span className="text-[13px] font-medium truncate">
                            {track.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-white/40">
                          {track.duration}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[12px] text-white/50 py-4 text-center">无此面曲目信息</p>
                )}
              </div>
            )}

            {activeBottomModal === 'output' && (
              <div className="space-y-2">
                {[
                  { name: '直驱内置唱头放大器 (Preamp)', status: '当前激活', active: true },
                  { name: '模拟胆机功放 (Tube Amp)', status: '就绪', active: false },
                  { name: '无线高保真接收器 (LDAC 990kbps)', status: '已配对', active: false },
                ].map((dev, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-[4px] border flex items-center justify-between ${
                      dev.active
                        ? 'bg-[#16161C] border-[#2A2A34]'
                        : 'bg-[#0E0E12] border-[#1C1C22]'
                    }`}
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white">{dev.name}</p>
                      <p className="text-[10.5px] text-[#BBCBB2] opacity-70">{dev.status}</p>
                    </div>
                    {dev.active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2FE92B]" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeBottomModal === 'quality' && (
              <div className="space-y-2">
                {[
                  { title: '192kHz / 24-bit 模拟母带直录', tag: 'DSD / DDA' },
                  { title: 'RIAA 标准录音均衡曲线硬件直通', tag: 'Direct Bypass' },
                  { title: '唱针物理循迹角 (VTA) 精密校准', tag: '23° Tracking' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-[4px] bg-[#141418] border border-[#1E1E24] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[12.5px] font-medium text-white">{item.title}</p>
                      <p className="text-[10px] font-mono text-white/40">{item.tag}</p>
                    </div>
                    <Sparkles className="w-3.5 h-3.5 text-white/40" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
