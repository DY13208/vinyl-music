import React, { useState, useRef } from 'react';
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
import { LyricsView } from '../components/LyricsView';
import {
  ChevronDown,
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
  const [activeBottomModal, setActiveBottomModal] = useState<'none' | 'lyrics' | 'queue' | 'output' | 'quality'>('none');
  const [viewMode, setViewMode] = useState<'turntable' | 'lyrics'>('turntable');
  const [isCrackleEnabled, setIsCrackleEnabled] = useState(true);
  const themeDialog = useRef<HTMLDialogElement>(null);
  return (
    <div
      id="player-view-container"
      className="full-player" translate="no" data-player-theme={themePreference.themeId} data-player-view={viewMode} style={playerThemeRegistry[themePreference.themeId].tokens}
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
      </header>

      {/* Main Stage: Turntable Mode OR Synchronized Lyrics Mode */}
      <div className="full-player__turntable" hidden={viewMode !== 'turntable'}>
        <PlayerThemeRenderer themeId={themePreference.themeId} album={album} currentTrack={currentTrack} queue={album.tracks} isPlaying={isPlaying} isPreviewLoading={isPreviewLoading} progressPercent={progressPercent} onSelectTrack={onSelectTrack} onTogglePlay={onTogglePlay} onShowLyrics={() => setViewMode('lyrics')} />
        <PlayerTrackInfo album={album} currentTrack={currentTrack} favorite={favorite} onToggleFavorite={onToggleFavorite} playbackSource={playbackSource} playbackMessage={playbackMessage} loading={isPreviewLoading} onImportLocalSource={onImportLocalSource} localImportPending={localImportPending} />
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
        <PlayerProgress progress={progressPercent} currentTime={currentTimeSec} duration={durationSec} onSeek={onSeek} />
        <PlayerControls isPlaying={isPlaying} loading={isPreviewLoading} shuffle={isShuffle} repeatMode={repeatMode} onShuffleChange={onShuffleChange} onRepeatChange={onRepeatChange} onTogglePlay={onTogglePlay} onPrevTrack={onPrevTrack} onNextTrack={onNextTrack} />

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
              {activeBottomModal === 'lyrics' && '全量同步歌词 · Folia Major'}
              {activeBottomModal === 'queue' && `曲目清单 · ${album.title}`}
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
                {album.tracks.map((track) => {
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
                        <span className="text-[11px] font-mono opacity-50 w-4">
                          {track.number}
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
                })}
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
