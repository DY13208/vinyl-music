import React, { useState } from 'react';
import { Album, Track } from '../types';
import { TurntableScene } from '../components/TurntableScene';
import './PlayerView.css';
import { LyricsView } from '../components/LyricsView';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  FileText,
  ListMusic,
  Sliders,
  Speaker,
  Sparkles,
  Disc,
  Maximize2,
  Upload,
} from 'lucide-react';
import { hapticsService } from '../platform/platformService';
import type { TrackSource } from '../music';

interface PlayerViewProps {
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
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');

  const face = album.discs?.flatMap(disc => disc.sides).find(side => side.tracks.some(track => track.id === currentTrack.id));
  const position = face ? `${face.side}${face.tracks.findIndex(track => track.id === currentTrack.id) + 1}` : undefined;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      id="player-view-container"
      className="full-player" translate="no"
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
      </header>

      {/* Main Stage: Turntable Mode OR Synchronized Lyrics Mode */}
      <div className="full-player__turntable" hidden={viewMode !== 'turntable'}>
        <TurntableScene album={album} side={face?.side} isPlaying={isPlaying} progressPercent={progressPercent}
          onShowLyrics={() => { setViewMode('lyrics'); hapticsService.triggerHaptic('light'); }} />
        <div className="full-player__info">
          <h2 title={currentTrack.title}>{currentTrack.title}</h2>
          <p title={`${album.artist} · ${album.title}`}>{album.artist} · {album.title}</p>
          <small>{album.rpm}{face ? ` · Side ${face.side} · ${position}` : ''}</small>
          {(playbackMessage || playbackSource) && (
            <div className="full-player__source" aria-live="polite" aria-busy={isPreviewLoading}>
              <span>{playbackMessage}</span>
              {playbackSource?.metadata.storeUrl && (
                <a href={playbackSource.metadata.storeUrl} target="_blank" rel="noreferrer">
                  在 Apple Music 查看
                </a>
              )}
              <button type="button" onClick={onImportLocalSource} disabled={isPreviewLoading}>
                <Upload />{localImportPending ? '确认绑定本地音源' : '导入本地音源'}
              </button>
            </div>
          )}
        </div>
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
        <div className="full-player__progress">
          <input id="player-progress-track" type="range" min="0" max="100" step="0.1" aria-label="播放进度"
            value={Number.isFinite(progressPercent) ? Math.min(100, Math.max(0, progressPercent)) : 0}
            style={{ '--played': `${Math.min(100, Math.max(0, progressPercent || 0))}%` } as React.CSSProperties}
            onChange={event => onSeek(Number(event.target.value))} />
          <div><span>{formatTime(currentTimeSec)}</span><span>-{formatTime(Math.max(0, durationSec - currentTimeSec))}</span></div>
        </div>

        {/* Transport Hardware Controls */}
        <div className="full-player__transport">
          {/* Shuffle */}
          <button
            id="player-btn-shuffle"
            type="button"
            onClick={() => {
              setIsShuffle(!isShuffle);
              hapticsService.triggerHaptic('light');
            }}
            className={`w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors ${
              isShuffle ? 'text-[#2FE92B]' : 'text-white/40 hover:text-white'
            }`}
            title="随机播放"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous Track */}
          <button
            id="player-btn-prev"
            type="button"
            onClick={() => {
              onPrevTrack();
              hapticsService.triggerHaptic('light');
            }}
            className="w-10 h-10 rounded-[6px] text-white/80 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title="上一首"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Center Play/Pause: Tactile hardware dial styling with subtle #2FE92B indicator */}
          <button
            id="player-btn-play-pause"
            type="button"
            onClick={() => {
              onTogglePlay();
              hapticsService.triggerHaptic('medium');
            }}
            className="full-player__play"
            title={isPreviewLoading ? '正在加载试听' : isPlaying ? '暂停' : '播放'}
            aria-label={isPreviewLoading ? '正在加载试听' : isPlaying ? '暂停' : '播放'}
            disabled={isPreviewLoading}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-[#2FE92B] text-[#2FE92B]" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            id="player-btn-next"
            type="button"
            onClick={() => {
              onNextTrack();
              hapticsService.triggerHaptic('light');
            }}
            className="w-10 h-10 rounded-[6px] text-white/80 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title="下一首"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            id="player-btn-repeat"
            type="button"
            onClick={() => {
              setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off');
              hapticsService.triggerHaptic('light');
            }}
            className={`w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors ${
              repeatMode !== 'off' ? 'text-[#2FE92B]' : 'text-white/40 hover:text-white'
            }`}
            title="循环模式"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

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
