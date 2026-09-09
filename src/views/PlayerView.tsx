import React, { useState } from 'react';
import { Album, Track } from '../types';
import { VinylDisc } from '../components/VinylDisc';
import { Tonearm } from '../components/Tonearm';
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
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

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
}) => {
  const [activeBottomModal, setActiveBottomModal] = useState<'none' | 'lyrics' | 'queue' | 'output' | 'quality'>('none');
  const [viewMode, setViewMode] = useState<'turntable' | 'lyrics'>('turntable');
  const [isCrackleEnabled, setIsCrackleEnabled] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
    onSeek(percent);
    audioEngine.triggerHaptic('light');
  };

  return (
    <div
      id="player-view-container"
      className="fixed inset-0 z-50 bg-[#060608] text-white flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Subtle Low-Opacity Ambient Color Wash (<10% opacity, no loud gradient) */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full filter blur-[90px] pointer-events-none transition-colors duration-1000"
        style={{
          backgroundColor: album.color || '#1A1A24',
          opacity: 0.12,
        }}
      />

      {/* Top Bar - Minimalist Hardware Feel */}
      <header className="px-5 pt-3.5 pb-2 flex items-center justify-between z-20">
        <button
          id="player-close-btn"
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-[6px] bg-[#111115] border border-[#202026] text-white/70 hover:text-white flex items-center justify-center transition-colors"
          title="收起播放器"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* Dual Mode Switcher: 唱机 vs 全量同步歌词 */}
        <div className="flex items-center p-0.5 rounded-[6px] bg-[#111115] border border-[#202026]">
          <button
            id="player-mode-turntable"
            type="button"
            onClick={() => {
              setViewMode('turntable');
              audioEngine.triggerHaptic('light');
            }}
            className={`px-3 py-1 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'turntable'
                ? 'bg-[#1C1C22] text-white'
                : 'text-white/45 hover:text-white'
            }`}
          >
            <Disc className="w-3 h-3" />
            <span>唱机</span>
          </button>
          <button
            id="player-mode-lyrics"
            type="button"
            onClick={() => {
              setViewMode('lyrics');
              audioEngine.triggerHaptic('light');
            }}
            className={`px-3 py-1 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'lyrics'
                ? 'bg-[#1C1C22] text-white'
                : 'text-white/45 hover:text-white'
            }`}
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
            audioEngine.triggerHaptic('light');
          }}
          className={`w-8 h-8 rounded-[6px] border flex items-center justify-center transition-colors ${
            isCrackleEnabled
              ? 'bg-[#18181E] border-[#2FE92B]/40 text-[#2FE92B]'
              : 'bg-[#111115] border-[#202026] text-white/40'
          }`}
          title="实体唱针底噪模拟"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </header>

      {/* Main Stage: Turntable Mode OR Synchronized Lyrics Mode */}
      {viewMode === 'turntable' ? (
        <div className="relative flex-1 flex flex-col items-center justify-center my-auto px-2 animate-in fade-in duration-200">
          {/* Turntable Plinth Deck Frame (occupies 80%-88% width of viewport) */}
          <div
            className="relative rounded-[16px] overflow-hidden"
            style={{
              background: 'linear-gradient(155deg, #131317 0%, #0B0B0E 70%, #060608 100%)',
              border: '1.5px solid #202026',
              boxShadow: '0 24px 60px rgba(0,0,0,0.95), inset 0 1px 2px rgba(255,255,255,0.05)',
              width: 356,
              height: 340,
            }}
          >
            {/* Direct Drive Indicator Marking */}
            <div className="absolute top-3.5 left-4 flex items-center gap-2 z-20">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#2FE92B] animate-pulse' : 'bg-white/30'}`} />
              <span className="text-[8.5px] font-mono tracking-widest text-white/45 uppercase">
                DIRECT DRIVE · {album.rpm}
              </span>

              {/* Tonearm Status Badge */}
              <div
                onClick={() => {
                  onTogglePlay();
                  audioEngine.triggerHaptic('medium');
                }}
                className="ml-1 px-2 py-0.5 rounded-[3px] bg-[#141418] border border-[#22222A] hover:border-[#32323E] text-[8.5px] font-mono cursor-pointer transition-colors flex items-center gap-1"
                title="点击起落唱针"
              >
                <span className={isPlaying ? 'text-white' : 'text-white/40'}>
                  {isPlaying ? '唱针落盘' : '唱针待命'}
                </span>
              </div>
            </div>

            {/* Strobe Dot Ring / Platter Surface (Offset to left to accommodate precision tonearm) */}
            <div
              onClick={() => {
                setViewMode('lyrics');
                audioEngine.triggerHaptic('light');
              }}
              className="absolute left-3 top-[44px] rounded-full p-2 flex items-center justify-center z-10 cursor-pointer group"
              title="点击唱片查看全量歌词"
              style={{
                background: 'radial-gradient(circle at center, #17171C 0%, #0C0C0F 75%, #050507 100%)',
                border: '2px solid #222228',
                boxShadow: '0 12px 36px rgba(0,0,0,0.95), inset 0 0 12px rgba(255,255,255,0.02)',
                width: 256,
                height: 256,
              }}
            >
              {/* Realistic Vinyl Disc Hero */}
              <VinylDisc
                coverUrl={album.coverUrl}
                albumTitle={album.title}
                artistName={album.artist}
                isPlaying={isPlaying}
                size={242}
                rpm={album.rpm}
                showAmbientGlow={isPlaying}
              />
            </div>

            {/* Precision Physical Tonearm */}
            <Tonearm
              isPlaying={isPlaying}
              progressPercent={progressPercent}
              size={295}
              onTogglePlay={onTogglePlay}
              className="absolute right-0 top-0 z-20"
            />

            {/* Bottom Deck Accents */}
            <div className="absolute bottom-2.5 left-4 flex items-center gap-2 z-10 opacity-35">
              <span className="text-[7.5px] font-mono text-white/60 tracking-wider">
                QUARTZ SYNTHESIZER · SHVL 804
              </span>
            </div>
          </div>

          {/* Track Information */}
          <div
            onClick={() => {
              setViewMode('lyrics');
              audioEngine.triggerHaptic('light');
            }}
            className="text-center mt-4 px-6 max-w-sm z-20 cursor-pointer group"
            title="点击查看全量歌词"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#141418] border border-[#222228] text-white/70">
                {album.rpm}
              </span>
              <span className="text-[9.5px] font-mono text-white/40">
                {album.matrixCode}
              </span>
            </div>

            <h2 className="text-[18px] font-bold text-white tracking-tight leading-snug line-clamp-1 group-hover:text-white transition-colors">
              {currentTrack.title}
            </h2>
            <p className="text-[13px] font-medium text-[#BBCBB2] mt-0.5">
              {album.artist} · {album.title}
            </p>
          </div>
        </div>
      ) : (
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
                audioEngine.triggerHaptic('light');
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
      <div className="w-full px-6 pb-6 pt-2 space-y-4 z-20">
        {/* Subtle Waveform Visualizer */}
        <div className="flex items-center justify-center gap-[3px] h-3.5 px-4 opacity-70">
          {Array.from({ length: 32 }).map((_, i) => {
            const isBarActive = i < Math.floor((progressPercent / 100) * 32);
            const height = isPlaying
              ? Math.max(3, Math.sin((i + currentTimeSec * 4) * 0.4) * 10 + 3)
              : 3;
            return (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-150"
                style={{
                  height: `${height}px`,
                  backgroundColor: isBarActive ? '#2FE92B' : '#1C1C22',
                }}
              />
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div
            id="player-progress-track"
            onClick={handleProgressBarClick}
            className="w-full h-1.5 rounded-full bg-[#1C1C22] relative cursor-pointer group flex items-center"
          >
            <div
              className="h-full rounded-full bg-[#2FE92B] relative flex items-center justify-end transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-white shadow-md -mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
            <span>{formatTime(currentTimeSec)}</span>
            <span>-{formatTime(Math.max(0, durationSec - currentTimeSec))}</span>
          </div>
        </div>

        {/* Transport Hardware Controls */}
        <div className="flex items-center justify-between px-2">
          {/* Shuffle */}
          <button
            id="player-btn-shuffle"
            type="button"
            onClick={() => {
              setIsShuffle(!isShuffle);
              audioEngine.triggerHaptic('light');
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
              audioEngine.triggerHaptic('light');
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
              audioEngine.triggerHaptic('medium');
            }}
            className="w-13 h-13 rounded-full bg-[#18181E] hover:bg-[#202028] border border-[#2B2B36] hover:border-[#3A3A48] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all group"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-[#2FE92B] text-[#2FE92B]" />
            ) : (
              <Play className="w-5 h-5 fill-[#2FE92B] text-[#2FE92B] ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            id="player-btn-next"
            type="button"
            onClick={() => {
              onNextTrack();
              audioEngine.triggerHaptic('light');
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
              audioEngine.triggerHaptic('light');
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
        <div className="pt-2 border-t border-[#1C1C22] flex items-center justify-around text-white/60">
          <button
            id="player-util-lyrics"
            type="button"
            onClick={() => {
              setViewMode(viewMode === 'lyrics' ? 'turntable' : 'lyrics');
              setActiveBottomModal('none');
              audioEngine.triggerHaptic('light');
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
                    audioEngine.triggerHaptic('light');
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
                        audioEngine.triggerHaptic('light');
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
