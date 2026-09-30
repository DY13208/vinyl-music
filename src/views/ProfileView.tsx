import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { ProfileIdentity } from '../components/ProfileIdentity';
import {
  Heart,
  Bookmark,
  Settings as SettingsIcon,
  ChevronRight,
  Disc,
} from 'lucide-react';
import { hapticsService } from '../platform/platformService';
import { AnimatedCounter } from '../components/rare-ui/AnimatedCounter';

interface ProfileViewProps {
  collectionCount?: number;
  artistCount?: number;
  wishlistCount?: number;
  onOpenSettings: () => void;
  onOpenWishlist: () => void;
  onOpenCollection: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenSettings,
  onOpenWishlist,
  onOpenCollection,
  collectionCount = 0,
  artistCount = 0,
  wishlistCount = 0,
}) => {
  const auth = useAuth();
  const menuItems = [
    {
      id: 'collection',
      label: '我的唱片架',
      icon: <Heart className="w-4 h-4 text-[#2FE92B]" />,
      action: onOpenCollection,
      badge: String(collectionCount),
    },
    {
      id: 'wishlist',
      label: '愿望单',
      icon: <Bookmark className="w-4 h-4 text-[#FF9821]" />,
      action: onOpenWishlist,
      badge: String(wishlistCount),
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
        <ProfileIdentity email={auth?.user.email || ''} />

        {/* Core Stats: 128 张黑胶、36 位艺术家、1,024 小时播放 */}
        <div className="w-full grid grid-cols-3 gap-2 mt-4 p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D]">
          <div className="flex flex-col items-center">
            <AnimatedCounter value={collectionCount} className="text-[18px] font-black text-white font-mono" />
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">张黑胶</span>
          </div>
          <div className="flex flex-col items-center border-x border-[#1F2024]">
            <AnimatedCounter value={artistCount} className="text-[18px] font-black text-white font-mono" />
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">位艺术家</span>
          </div>
          <div className="flex flex-col items-center">
            <AnimatedCounter value={wishlistCount} className="text-[18px] font-black text-[#2FE92B] font-mono" />
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">愿望唱片</span>
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
              hapticsService.triggerHaptic('light');
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
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
