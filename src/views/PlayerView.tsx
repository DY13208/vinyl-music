import React, { useState } from 'react';
import { Album, Track } from '../types';
import { VinylDisc } from '../components/VinylDisc';
import { Tonearm } from '../components/Tonearm';
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
      className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Subtle Low-Opacity Ambient Color Wash from Album Cover */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full filter blur-[90px] pointer-events-none transition-colors duration-1000"
        style={{
          backgroundColor: album.color,
          opacity: 0.18,
        }}
      />

      {/* Top Bar */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between z-20">
        <button
          id="player-close-btn"
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
          title="收起播放器"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10.5px] font-mono tracking-widest text-[#2FE92B] uppercase">
            {isPlaying ? '• TURNTABLE ACTIVE' : '• STANDBY'}
          </span>
          <span className="text-[12.5px] font-bold text-white tracking-wide">
            正在播放
          </span>
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
              ? 'bg-[#1B1B1D] border-[#2FE92B]/60 text-[#2FE92B]'
              : 'bg-[#0F0F0F] border-[#26272D] text-white/40'
          }`}
          title="实体唱针底噪模拟"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </header>

      {/* Turntable Platter & Vinyl Record with Tonearm */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-auto px-2">
        {/* Turntable Plinth Deck Frame */}
        <div
          className="relative rounded-[22px] overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #131316 0%, #0A0A0C 70%, #060608 100%)',
            border: '1.5px solid #26272D',
            boxShadow: '0 24px 60px rgba(0,0,0,0.95), inset 0 1px 2px rgba(255,255,255,0.06)',
            width: 340,
            height: 330,
          }}
        >
          {/* Subtle Turntable Brand & Speed Markings on Plinth */}
          <div className="absolute top-3.5 left-4 flex items-center gap-2 z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FE92B]" />
            <span className="text-[8.5px] font-mono tracking-widest text-white/50 uppercase">
              DIRECT DRIVE · 33 ⅓
            </span>

            {/* Tonearm Status Badge */}
            <div
              onClick={() => {
                onTogglePlay();
                audioEngine.triggerHaptic('medium');
              }}
              className="ml-1 px-2 py-0.5 rounded-full bg-[#16161A] border border-[#26272D] hover:border-[#2FE92B]/60 text-[9px] font-mono cursor-pointer transition-colors flex items-center gap-1"
              title="点击起落唱针"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? 'bg-[#2FE92B] animate-pulse' : 'bg-white/30'
                }`}
              />
              <span className={isPlaying ? 'text-[#2FE92B]' : 'text-white/40'}>
                {isPlaying ? '唱针已落盘' : '唱针待命抬起'}
              </span>
            </div>
          </div>

          {/* Strobe Dot Ring / Platter Surface (Offset left to allow dedicated tonearm deck) */}
          <div
            className="absolute left-3.5 top-[40px] rounded-full p-2 flex items-center justify-center z-10"
            style={{
              background: 'radial-gradient(circle at center, #18181C 0%, #0D0D10 75%, #050507 100%)',
              border: '2px solid #2A2B32',
              boxShadow: '0 12px 36px rgba(0,0,0,0.95), inset 0 0 12px rgba(255,255,255,0.02)',
              width: 250,
              height: 250,
            }}
          >
            {/* Realistic Vinyl Disc */}
            <VinylDisc
              coverUrl={album.coverUrl}
              albumTitle={album.title}
              artistName={album.artist}
              isPlaying={isPlaying}
              size={234}
              rpm={album.rpm}
              showAmbientGlow={isPlaying}
            />
          </div>

          {/* Precision Physical Tonearm (Mounted on Right Deck with Cradle Rest) */}
          <Tonearm
            isPlaying={isPlaying}
            progressPercent={progressPercent}
            size={290}
            onTogglePlay={onTogglePlay}
            className="absolute right-0 top-1 z-40"
          />

          {/* Bottom Deck Accents */}
          <div className="absolute bottom-2.5 left-4 flex items-center gap-2 z-10 opacity-40">
            <span className="text-[7.5px] font-mono text-white/60 tracking-wider">
              QUARTZ SYNTHESIZER
            </span>
          </div>
        </div>

        {/* Track & Matrix Information */}
        <div className="text-center mt-4 px-6 max-w-sm z-20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-[#1B1B1D] border border-[#26272D] text-[#2FE92B]">
              {album.rpm}
            </span>
            <span className="text-[10px] font-mono text-white/40">
              {album.matrixCode}
            </span>
          </div>

          <h2 className="text-[19px] font-bold text-white tracking-tight leading-snug line-clamp-1">
            {currentTrack.title}
          </h2>
          <p className="text-[13px] font-medium text-[#BBCBB2] mt-0.5">
            {album.artist} · {album.title}
          </p>
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="w-full px-6 pb-6 pt-2 space-y-4 z-20">
        {/* Scannable Real-time Audio Waveform Visualizer */}
        <div className="flex items-center justify-center gap-[3px] h-4 px-4 opacity-80">
          {Array.from({ length: 32 }).map((_, i) => {
            const isBarActive = i < Math.floor((progressPercent / 100) * 32);
            const height = isPlaying
              ? Math.max(3, Math.sin((i + currentTimeSec * 4) * 0.4) * 12 + 4)
              : 3;
            return (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-150"
                style={{
                  height: `${height}px`,
                  backgroundColor: isBarActive ? '#2FE92B' : '#26272D',
                }}
              />
            );
          })}
        </div>

        {/* Progress Bar (Inactive: #26272D, Active: #2FE92B) */}
        <div className="space-y-1.5">
          <div
            id="player-progress-track"
            onClick={handleProgressBarClick}
            className="w-full h-2 rounded-full bg-[#26272D] relative cursor-pointer group flex items-center"
          >
            <div
              className="h-full rounded-full bg-[#2FE92B] relative flex items-center justify-end transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            >
              {/* Scrubber Knob */}
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md -mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>{formatTime(currentTimeSec)}</span>
            <span>-{formatTime(Math.max(0, durationSec - currentTimeSec))}</span>
          </div>
        </div>

        {/* Main Transport Control Buttons */}
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
              isShuffle ? 'text-[#2FE92B]' : 'text-white/60 hover:text-white'
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
            className="w-10 h-10 rounded-[6px] text-white hover:text-[#2FE92B] flex items-center justify-center transition-colors active:scale-95"
            title="上一首"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Primary Play/Pause Button: #2FE92B background, #0F0F0F icon */}
          <button
            id="player-btn-play-pause"
            type="button"
            onClick={() => {
              onTogglePlay();
              audioEngine.triggerHaptic('medium');
            }}
            className="w-15 h-15 rounded-full bg-[#2FE92B] hover:bg-[#28d124] text-[#0F0F0F] flex items-center justify-center shadow-[0_0_18px_rgba(47,233,43,0.35)] active:scale-95 transition-all"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-[#0F0F0F]" />
            ) : (
              <Play className="w-7 h-7 fill-[#0F0F0F] ml-0.5" />
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
            className="w-10 h-10 rounded-[6px] text-white hover:text-[#2FE92B] flex items-center justify-center transition-colors active:scale-95"
            title="下一首"
          >
            <SkipForward className="w-6 h-6 fill-current" />
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
              repeatMode !== 'off' ? 'text-[#2FE92B]' : 'text-white/60 hover:text-white'
            }`}
            title="循环模式"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom 4 Utility Tools: 歌词, 队列, 设备, 音质 */}
        <div className="pt-2 border-t border-[#26272D] flex items-center justify-around text-white/70">
          <button
            id="player-util-lyrics"
            type="button"
            onClick={() => setActiveBottomModal(activeBottomModal === 'lyrics' ? 'none' : 'lyrics')}
            className={`flex items-center gap-1.5 text-[11.5px] py-1 px-2 rounded-[4px] transition-colors ${
              activeBottomModal === 'lyrics' ? 'text-[#2FE92B] bg-[#1B1B1D]' : 'hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>歌词</span>
          </button>

          <button
            id="player-util-queue"
            type="button"
            onClick={() => setActiveBottomModal(activeBottomModal === 'queue' ? 'none' : 'queue')}
            className={`flex items-center gap-1.5 text-[11.5px] py-1 px-2 rounded-[4px] transition-colors ${
              activeBottomModal === 'queue' ? 'text-[#2FE92B] bg-[#1B1B1D]' : 'hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>队列</span>
          </button>

          <button
            id="player-util-output"
            type="button"
            onClick={() => setActiveBottomModal(activeBottomModal === 'output' ? 'none' : 'output')}
            className={`flex items-center gap-1.5 text-[11.5px] py-1 px-2 rounded-[4px] transition-colors ${
              activeBottomModal === 'output' ? 'text-[#2FE92B] bg-[#1B1B1D]' : 'hover:text-white'
            }`}
          >
            <Speaker className="w-3.5 h-3.5" />
            <span>设备</span>
          </button>

          <button
            id="player-util-quality"
            type="button"
            onClick={() => setActiveBottomModal(activeBottomModal === 'quality' ? 'none' : 'quality')}
            className={`flex items-center gap-1.5 text-[11.5px] py-1 px-2 rounded-[4px] transition-colors ${
              activeBottomModal === 'quality' ? 'text-[#2FE92B] bg-[#1B1B1D]' : 'hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="font-mono text-[#2FE92B]">Hi-Res</span>
          </button>
        </div>
      </div>

      {/* Modal / Drawers for Lyrics / Queue / Output / Quality */}
      {activeBottomModal !== 'none' && (
        <div
          id="player-modal-sheet"
          className="absolute inset-x-0 bottom-0 max-h-[65%] bg-[#0F0F0F] border-t border-[#26272D] rounded-t-[8px] z-50 p-4 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#26272D]">
            <span className="text-[13px] font-bold text-white flex items-center gap-2">
              {activeBottomModal === 'lyrics' && '模拟母带唱片歌词'}
              {activeBottomModal === 'queue' && `播放队列 · ${album.title}`}
              {activeBottomModal === 'output' && '音频输出设备'}
              {activeBottomModal === 'quality' && '黑胶音质与均衡器设定'}
            </span>
            <button
              onClick={() => setActiveBottomModal('none')}
              className="text-[11px] text-[#BBCBB2] hover:text-white px-2 py-0.5 rounded-[4px] bg-[#1B1B1D]"
            >
              收起
            </button>
          </div>

          <div className="overflow-y-auto no-scrollbar py-3 space-y-2 flex-1">
            {activeBottomModal === 'lyrics' && (
              <div className="space-y-4 text-center py-4">
                <p className="text-[13px] text-white/40">Ticking away the moments that make up a dull day</p>
                <p className="text-[13px] text-white/40">Fritter and waste the hours in an offhand way</p>
                <p className="text-[15px] font-bold text-[#2FE92B] leading-relaxed">
                  Kicking around on a piece of ground in your hometown
                </p>
                <p className="text-[13px] text-white/40">Waiting for someone or something to show you the way</p>
                <p className="text-[13px] text-white/40">Tired of lying in the sunshine, staying home to watch the rain</p>
                <p className="text-[13px] text-white/40">And you are young and life is long, and there is time to kill today</p>
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
                          ? 'bg-[#1B1B1D] border-l-2 border-[#2FE92B] text-[#2FE92B]'
                          : 'hover:bg-[#1B1B1D]/60 text-white'
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
                  { name: '内置模拟放大唱机 (Built-in Preamp)', status: '当前激活', active: true },
                  { name: 'AirPlay / Hi-Fi 功放系统', status: '就绪', active: false },
                  { name: '蓝牙 5.3 LDAC 发烧接收器', status: '已配对', active: false },
                ].map((dev, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-[4px] border flex items-center justify-between ${
                      dev.active
                        ? 'bg-[#1B1B1D] border-[#2FE92B]/50'
                        : 'bg-[#0F0F0F] border-[#26272D]'
                    }`}
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white">{dev.name}</p>
                      <p className="text-[10.5px] text-[#BBCBB2] opacity-70">{dev.status}</p>
                    </div>
                    {dev.active && (
                      <span className="w-2 h-2 rounded-full bg-[#2FE92B] shadow-[0_0_6px_#2FE92B]" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeBottomModal === 'quality' && (
              <div className="space-y-2">
                {[
                  { title: '192kHz / 24-bit 模拟母带直接翻录', tag: 'DSD / DDA', active: true },
                  { title: '96kHz / 24-bit 纯净无损 FLAC', tag: 'Studio Master', active: false },
                  { title: 'RIAA 标准录音均衡曲线纠正', tag: 'Hardware Bypass', active: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-[4px] bg-[#1B1B1D] border border-[#26272D] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[12.5px] font-medium text-white">{item.title}</p>
                      <p className="text-[10px] font-mono text-[#2FE92B]">{item.tag}</p>
                    </div>
                    {item.active && (
                      <Sparkles className="w-4 h-4 text-[#2FE92B]" />
                    )}
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
