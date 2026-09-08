import React from 'react';
import { ArrowRight, Disc } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface SplashViewProps {
  onEnterApp: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ onEnterApp }) => {
  return (
    <div
      id="splash-view"
      className="relative w-full min-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 select-none overflow-hidden"
    >
      {/* Background Stylized Vinyl Grooves and Sheen Art */}
      <div className="absolute -right-32 top-1/4 w-[460px] h-[460px] rounded-full bg-[#080809] border border-white/[0.07] pointer-events-none flex items-center justify-center opacity-85">
        <div className="absolute inset-0 vinyl-grooves opacity-70" />
        <div className="absolute inset-0 vinyl-reflection opacity-60" />
        <div className="w-40 h-40 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#121214] border border-[#2FE92B]/50 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2FE92B] shadow-[0_0_8px_#2FE92B]" />
          </div>
        </div>
      </div>

      {/* Top Brand Tag */}
      <div className="pt-6 z-10 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#0F0F0F] border border-[#26272D] flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-[#2FE92B] shadow-[0_0_6px_#2FE92B]" />
        </div>
        <span className="text-[18px] font-black tracking-widest text-white uppercase">
          VINYL
        </span>
      </div>

      {/* Center Editorial Manifesto */}
      <div className="z-10 my-auto max-w-xs space-y-3">
        <span className="text-[10px] font-mono tracking-widest text-[#2FE92B] uppercase">
          ANALOG MUSIC CULTURE
        </span>
        <h1 className="text-[32px] font-extrabold text-white tracking-tight leading-[1.15]">
          让音乐，<br />回到生活的形状
        </h1>
        <p className="text-[14px] text-[#BBCBB2] font-normal tracking-wide">
          收藏 · 聆听 · 发现 · 分享
        </p>
        <p className="text-[11px] text-white/40 font-mono tracking-widest pt-2">
          MUSIC LIVES LONGER
        </p>
      </div>

      {/* Bottom CTA Button */}
      <div className="z-10 pb-6">
        <button
          type="button"
          onClick={() => {
            onEnterApp();
            audioEngine.playNeedleDrop();
            audioEngine.triggerHaptic('medium');
          }}
          className="w-full h-12 rounded-[6px] bg-[#2FE92B] hover:bg-[#28d124] text-[#0F0F0F] font-bold text-[15px] tracking-wide flex items-center justify-center gap-2 shadow-[0_2px_16px_rgba(47,233,43,0.3)] active:scale-98 transition-all"
        >
          <span>开启黑胶之旅</span>
          <ArrowRight className="w-4 h-4 text-[#0F0F0F]" />
        </button>
      </div>
    </div>
  );
};
