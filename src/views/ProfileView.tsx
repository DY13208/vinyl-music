import React from 'react';
import {
  Heart,
  Clock,
  Bookmark,
  ListMusic,
  Download,
  BarChart3,
  Settings as SettingsIcon,
  ChevronRight,
  Disc,
  ShieldCheck,
  LayoutTemplate,
  RotateCw,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface ProfileViewProps {
  onOpenSettings: () => void;
  onOpenWishlist: () => void;
  onOpenCollection: () => void;
  onOpenDesignBoard?: () => void;
  onOpenLandscape?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenSettings,
  onOpenWishlist,
  onOpenCollection,
  onOpenDesignBoard,
  onOpenLandscape,
}) => {
  const menuItems = [
    {
      id: 'collection',
      label: '我的收藏',
      icon: <Heart className="w-4 h-4 text-[#2FE92B]" />,
      action: onOpenCollection,
      badge: '128',
    },
    {
      id: 'history',
      label: '最近播放',
      icon: <Clock className="w-4 h-4 text-white/70" />,
      action: onOpenCollection,
    },
    {
      id: 'wishlist',
      label: '愿望单',
      icon: <Bookmark className="w-4 h-4 text-[#FF9821]" />,
      action: onOpenWishlist,
      badge: '4',
    },
    {
      id: 'playlists',
      label: '播放列表',
      icon: <ListMusic className="w-4 h-4 text-white/70" />,
      action: () => {},
    },
    {
      id: 'downloads',
      label: '下载管理 (离线母带缓存)',
      icon: <Download className="w-4 h-4 text-white/70" />,
      action: () => {},
      detail: '已缓存 14 张',
    },
    {
      id: 'stats',
      label: '播放统计 · 声音年鉴',
      icon: <BarChart3 className="w-4 h-4 text-[#2FE92B]" />,
      action: () => {},
    },
    {
      id: 'landscape',
      label: '唱片展台横屏模式',
      icon: <RotateCw className="w-4 h-4 text-[#2FE92B]" />,
      action: () => onOpenLandscape && onOpenLandscape(),
      detail: '展台视角',
    },
    {
      id: 'design_board',
      label: '全套 14 界面设计稿画板',
      icon: <LayoutTemplate className="w-4 h-4 text-[#2FE92B]" />,
      action: () => onOpenDesignBoard && onOpenDesignBoard(),
      detail: '设计规范',
    },
    {
      id: 'settings',
      label: '设置',
      icon: <SettingsIcon className="w-4 h-4 text-white/70" />,
      action: onOpenSettings,
    },
  ];

  return (
    <div
      id="profile-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Top Header & Settings Button */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between z-20">
        <span className="text-[11px] font-mono tracking-widest text-[#2FE92B] uppercase flex items-center gap-1.5">
          <Disc className="w-3.5 h-3.5" />
          VINYL AUDIOPHILE PASS
        </span>
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
          title="系统设置"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </header>

      {/* Profile Bio Card */}
      <div className="px-4 py-3 flex flex-col items-center text-center">
        {/* Avatar with spinning record rim */}
        <div className="relative w-20 h-20 rounded-full p-0.5 bg-[#0F0F0F] border border-[#2FE92B]/60 shadow-[0_0_16px_rgba(47,233,43,0.15)] flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
            alt="晓东"
            className="w-full h-full rounded-full object-cover"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1B1B1D] border border-[#2FE92B] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#2FE92B]" />
          </div>
        </div>

        <h2 className="text-[19px] font-bold text-white mt-2.5 tracking-tight">
          晓东
        </h2>
        <p className="text-[12px] text-[#BBCBB2] opacity-80 mt-0.5">
          用音乐，记录生活的另一面
        </p>

        {/* Core Stats: 128 张黑胶、36 位艺术家、1,024 小时播放 */}
        <div className="w-full grid grid-cols-3 gap-2 mt-4 p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D]">
          <div className="flex flex-col items-center">
            <span className="text-[18px] font-black text-white font-mono">128</span>
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">张黑胶</span>
          </div>
          <div className="flex flex-col items-center border-x border-[#1F2024]">
            <span className="text-[18px] font-black text-white font-mono">36</span>
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">位艺术家</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[18px] font-black text-[#2FE92B] font-mono">1,024</span>
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">小时播放</span>
          </div>
        </div>
      </div>

      {/* Menu Navigation Entries */}
      <div className="px-4 mt-2 space-y-1.5">
        {menuItems.map((item) => (
          <div
            key={item.id}
            id={`profile-menu-${item.id}`}
            onClick={() => {
              item.action();
              audioEngine.triggerHaptic('light');
            }}
            className="p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[4px] bg-[#1B1B1D] border border-[#26272D] flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-[13.5px] font-medium text-white group-hover:text-[#2FE92B] transition-colors">
                {item.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="text-[10.5px] font-mono px-2 py-0.2 rounded-full bg-[#1B1B1D] text-[#2FE92B] border border-[#26272D]">
                  {item.badge}
                </span>
              )}
              {item.detail && (
                <span className="text-[11px] text-white/40 font-mono">
                  {item.detail}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Badge */}
      <div className="px-4 mt-5">
        <div className="p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#2FE92B] flex-shrink-0" />
          <div>
            <p className="text-[12px] font-medium text-white">唱片鉴真与成色认证</p>
            <p className="text-[10px] text-[#BBCBB2] opacity-60">Goldmine 唱片品相分级系统已接入</p>
          </div>
        </div>
      </div>
    </div>
  );
};
