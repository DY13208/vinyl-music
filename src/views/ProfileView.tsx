import React, { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ProfileIdentity } from '../components/ProfileIdentity';
import {
  Heart,
  Bookmark,
  Settings as SettingsIcon,
  ChevronRight,
  Disc,
  Disc3,
  UsersRound,
} from 'lucide-react';
import { hapticsService } from '../platform/platformService';
import { AnimatedCounter } from '../components/rare-ui/AnimatedCounter';
import { ArtworkImage } from '../components/ArtworkImage';
import { VinylDisc } from '../components/VinylDisc';
import type { Album, WishlistItem } from '../types';
import './ProfileDesktop.css';

interface ProfileViewProps {
  collectionCount?: number;
  artistCount?: number;
  wishlistCount?: number;
  onOpenSettings: () => void;
  onOpenWishlist: () => void;
  onOpenCollection: () => void;
  /** Desktop-only extras; mobile layout does not render them visibly. */
  albums?: Album[];
  wishlist?: WishlistItem[];
  onOpenAlbumDetail?: (album: Album) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenSettings,
  onOpenWishlist,
  onOpenCollection,
  collectionCount = 0,
  artistCount = 0,
  wishlistCount = 0,
  albums = [],
  wishlist = [],
  onOpenAlbumDetail,
}) => {
  const auth = useAuth();
  // Newest first: albums with a valid addedAt sort by it; ties and undated albums keep repository order.
  const recentAlbums = useMemo(() => albums
    .map((album, index) => ({ album, index, time: album.addedAt ? Date.parse(album.addedAt) : NaN }))
    .sort((a, b) => {
      const at = Number.isFinite(a.time) ? a.time : -Infinity;
      const bt = Number.isFinite(b.time) ? b.time : -Infinity;
      return at === bt ? a.index - b.index : bt - at;
    })
    .map(item => item.album), [albums]);
  const wishlistAlbums = wishlist.map(item => item.album);
  const leadAlbum = recentAlbums[0];
  const primaryGenre = (album: Album) => album.genre?.split(' · ')[0]?.trim() || '';
  const menuItems = [
    {
      id: 'collection',
      label: '我的唱片架',
      icon: <Heart className="w-4 h-4 text-[#2FE92B]" />,
      action: onOpenCollection,
      badge: String(collectionCount),
      covers: recentAlbums,
      emptyText: '唱片架还是空的，添加的唱片会陈列在这里',
      subtitle: collectionCount ? `${collectionCount} 张黑胶 · 浏览与整理你的收藏` : '添加第一张黑胶唱片',
    },
    {
      id: 'wishlist',
      label: '愿望单',
      icon: <Bookmark className="w-4 h-4 text-[#FF9821]" />,
      action: onOpenWishlist,
      badge: String(wishlistCount),
      covers: wishlistAlbums,
      emptyText: '还没有加入愿望单的唱片',
      subtitle: wishlistCount ? `${wishlistCount} 张想要的黑胶唱片` : '记录想要的黑胶唱片',
    },
  ];

  return (
    <div
      id="profile-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Desktop wrapper: display:contents on mobile, so the original flex layout is unchanged. */}
      <div className="profile-desktop__shell">
      {/* Desktop-only ambient light from the newest real cover (display:none on mobile). */}
      <div className={`profile-desktop__ambient${leadAlbum ? '' : ' is-empty'}`} aria-hidden="true">
        {leadAlbum && <ArtworkImage src={leadAlbum.coverUrl} alt="" loading="lazy" draggable={false} />}
      </div>
      {/* Top Header & Settings Button */}
      <header data-profile-part="header" className="px-4 pt-3 pb-2 flex items-center justify-between z-20">
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
      <div data-profile-part="hero" className="px-4 py-3 flex flex-col items-center text-center">
        <ProfileIdentity email={auth?.user.email || ''} />

        {/* Core Stats: 128 张黑胶、36 位艺术家、1,024 小时播放 */}
        <div data-profile-part="stats" className="w-full grid grid-cols-3 gap-2 mt-4 p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D]">
          <div className="flex flex-col items-center">
            <span className="profile-desktop__stat-icon" aria-hidden="true"><Disc3 /></span>
            <span className="profile-desktop__stat-title" aria-hidden="true">收藏</span>
            <AnimatedCounter value={collectionCount} className="text-[18px] font-black text-white font-mono" />
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">张黑胶</span>
          </div>
          <div className="flex flex-col items-center border-x border-[#1F2024]">
            <span className="profile-desktop__stat-icon" aria-hidden="true"><UsersRound /></span>
            <span className="profile-desktop__stat-title" aria-hidden="true">艺术家</span>
            <AnimatedCounter value={artistCount} className="text-[18px] font-black text-white font-mono" />
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">位艺术家</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="profile-desktop__stat-icon" aria-hidden="true"><Bookmark /></span>
            <span className="profile-desktop__stat-title" aria-hidden="true">愿望单</span>
            <AnimatedCounter value={wishlistCount} className="text-[18px] font-black text-[#2FE92B] font-mono" />
            <span className="text-[10.5px] text-[#BBCBB2] opacity-75 mt-0.5">愿望唱片</span>
          </div>
        </div>
        {/* Desktop-only record crate: real sleeves leaning in front of a record (display:none on mobile). */}
        <div className="profile-desktop__crate" aria-hidden="true">
          <VinylDisc className="profile-desktop__crate-disc" size={300} coverUrl={leadAlbum?.coverUrl || ''} albumTitle={leadAlbum?.title || 'VINYL'} artistName={leadAlbum?.artist} labelImage={leadAlbum?.coverUrl || undefined} showSideLabel={false} />
          {recentAlbums.slice(0, 4).map((album, index) => (
            <span key={album.id} className="profile-desktop__crate-sleeve" style={{ '--sleeve-index': index } as React.CSSProperties}>
              <ArtworkImage src={album.coverUrl} alt="" loading="lazy" draggable={false} />
            </span>
          ))}
        </div>
      </div>

      {/* Menu Navigation Entries */}
      <div data-profile-part="menu" className="px-4 mt-2 space-y-1.5">
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
              <small className="profile-desktop__entry-sub" aria-hidden="true">{item.subtitle}</small>
            </div>

            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="text-[10.5px] font-mono px-2 py-0.2 rounded-full bg-[#1B1B1D] text-[#2FE92B] border border-[#26272D]">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-0.5 transition-transform" />
            </div>
            {/* Desktop-only cover strip (display:none on mobile). */}
            <div className={`profile-desktop__strip${item.covers.length ? '' : ' is-empty'}`} aria-hidden="true">
              {item.covers.length ? <>
                {/* Six slots: up to six covers, or five covers plus a "+N" tile. */}
                {item.covers.slice(0, item.covers.length > 6 ? 5 : 6).map(album => (
                  <span key={album.id} className="profile-desktop__strip-cover"><ArtworkImage src={album.coverUrl} alt="" loading="lazy" draggable={false} /></span>
                ))}
                {item.covers.length > 6 && <span className="profile-desktop__strip-more">+{item.covers.length - 5}</span>}
              </> : <span className="profile-desktop__strip-empty">{item.emptyText}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop-only entry to the existing settings screen (display:none on mobile). */}
      <button type="button" className="profile-desktop__settings-card" onClick={onOpenSettings}>
        <span className="profile-desktop__settings-art" aria-hidden="true" />
        <span className="profile-desktop__settings-icon" aria-hidden="true"><SettingsIcon /></span>
        <span className="profile-desktop__settings-copy"><strong>设置</strong><small>外观主题、播放与本机存储</small></span>
        <ChevronRight className="profile-desktop__settings-chevron" aria-hidden="true" />
      </button>

      {/* Desktop-only: recently added records (display:none on mobile). */}
      <section className="profile-desktop__recent" aria-labelledby="profile-recent-title">
        <div className="profile-desktop__recent-head">
          <h2 id="profile-recent-title">最近加入</h2>
          {recentAlbums.length > 0 && <button type="button" onClick={onOpenCollection}>查看全部<ChevronRight className="w-4 h-4" aria-hidden="true" /></button>}
        </div>
        {recentAlbums.length ? (
          <ul className="profile-desktop__recent-grid">
            {recentAlbums.slice(0, 7).map(album => (
              <li key={album.id}>
                <button type="button" className="profile-desktop__album" onClick={() => onOpenAlbumDetail ? onOpenAlbumDetail(album) : onOpenCollection()} aria-label={`${album.title} · ${album.artist}`}>
                  <span className="profile-desktop__album-cover"><ArtworkImage src={album.coverUrl} alt="" loading="lazy" draggable={false} /></span>
                  <strong>{album.title}</strong>
                  <small>{album.artist}</small>
                  {(primaryGenre(album) || album.year) ? <em>{[primaryGenre(album), album.year || ''].filter(Boolean).join(' · ')}</em> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="profile-desktop__recent-empty">唱片架还是空的。添加第一张唱片后，最近加入的唱片会显示在这里。</p>
        )}
      </section>
      </div>
    </div>
  );
};
