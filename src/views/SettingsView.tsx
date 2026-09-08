import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [crossfade, setCrossfade] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [riaaEq, setRiaaEq] = useState(true);
  const [needleCrackle, setNeedleCrackle] = useState(true);
  const [cacheSize, setCacheSize] = useState('312 MB');

  const handleClearCache = () => {
    setCacheSize('0 KB');
    audioEngine.triggerHaptic('medium');
  };

  return (
    <div
      id="settings-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <header className="px-4 pt-3 pb-2 flex items-center gap-3 sticky top-0 bg-[#000000]/95 backdrop-blur-md z-30 border-b border-[#26272D]">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
          title="返回"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-[18px] font-bold text-white tracking-tight">系统设置</h1>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Section 1: 账号与安全 */}
        <section className="space-y-1">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase px-1 font-mono">
            ACCOUNT & SECURITY
          </span>
          <div className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] overflow-hidden divide-y divide-[#1F2024]">
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]">
              <span className="text-[13.5px] font-medium text-white">账号与安全</span>
              <div className="flex items-center gap-1.5 text-white/40 text-[12px]">
                <span>晓东 (VIP 发烧级)</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]">
              <span className="text-[13.5px] font-medium text-white">实体黑胶仓库同步</span>
              <div className="flex items-center gap-1.5 text-[#2FE92B] text-[12px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2FE92B]" />
                <span>已同步云端</span>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: 播放与声学设置 */}
        <section className="space-y-1">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase px-1 font-mono">
            AUDIO & PLAYBACK
          </span>
          <div className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] overflow-hidden divide-y divide-[#1F2024]">
            {/* 音质 */}
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]">
              <div>
                <p className="text-[13.5px] font-medium text-white">音质标准</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">模拟母带级 192kHz/24bit 直接刻录</p>
              </div>
              <div className="flex items-center gap-1 text-[#2FE92B] text-[12px] font-mono">
                <span>Master DSD</span>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </div>

            {/* 均衡器 */}
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]">
              <div>
                <p className="text-[13.5px] font-medium text-white">RIAA 标准黑胶均衡器</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">还原1954年行业唱片刻录曲线</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRiaaEq(!riaaEq);
                  audioEngine.triggerHaptic('light');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  riaaEq ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    riaaEq ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 唱针杂音底噪模拟 */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-white">唱针落盘与温润底噪</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">模拟真实唱片机触盘微小爆鸣感</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNeedleCrackle(!needleCrackle);
                  audioEngine.triggerHaptic('light');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  needleCrackle ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    needleCrackle ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Crossfade */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-white">曲目无缝平滑过渡 (Crossfade)</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">唱片AB面自动翻面模拟</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCrossfade(!crossfade);
                  audioEngine.triggerHaptic('light');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  crossfade ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    crossfade ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: 触觉与系统交互 */}
        <section className="space-y-1">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase px-1 font-mono">
            SYSTEM & HAPTIC
          </span>
          <div className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] overflow-hidden divide-y divide-[#1F2024]">
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-white">iOS 触觉震动反馈 (Haptic)</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">拨动黑胶与唱针触碰时的震动</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHapticFeedback(!hapticFeedback);
                  audioEngine.triggerHaptic('medium');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  hapticFeedback ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-white">新到黑胶与补货通知</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotifications(!notifications);
                  audioEngine.triggerHaptic('light');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  notifications ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 清理缓存 */}
            <div
              onClick={handleClearCache}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]"
            >
              <div>
                <p className="text-[13.5px] font-medium text-white">清理音频与封面缓存</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">释放本地存储空间</p>
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-[12px] font-mono">
                <span>{cacheSize}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: 关于与版权 */}
        <section className="space-y-1">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase px-1 font-mono">
            ABOUT
          </span>
          <div className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-bold text-white">VINYL for iOS & Android</p>
              <p className="text-[10.5px] text-[#BBCBB2] opacity-70">版本 2.4.0 (Build 2026.09)</p>
            </div>
            <span className="text-[11px] font-mono text-[#2FE92B]">LATEST</span>
          </div>
        </section>
      </div>
    </div>
  );
};
