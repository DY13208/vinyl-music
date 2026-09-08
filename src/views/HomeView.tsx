import React from 'react';
import { Album } from '../types';
import { VinylHeroCarousel } from '../components/VinylHeroCarousel';
import { Search, User, Disc, ChevronRight, Sparkles, Clock, Flame } from 'lucide-react';
import { ARTISTS } from '../data/mockData';

interface HomeViewProps {
  albums: Album[];
  carouselIndex: number;
  onSelectCarouselIndex: (index: number) => void;
  isPlaying: boolean;
  currentTrackTitle?: string;
  onTogglePlayAlbum: (album: Album) => void;
  onOpenAlbumDetail: (album: Album) => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenArtist: (artistId: string) => void;
  onToggleFavorite: (albumId: string) => void;
  favorites: string[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  albums,
  carouselIndex,
  onSelectCarouselIndex,
  isPlaying,
  currentTrackTitle,
  onTogglePlayAlbum,
  onOpenAlbumDetail,
  onOpenSearch,
  onOpenProfile,
  onOpenArtist,
  onToggleFavorite,
  favorites,
}) => {
  return (
    <div className="w-full flex flex-col pb-6 text-white select-none">
      {/* Top Header Bar */}
      <header className="w-full px-4 pt-3 pb-2 flex items-center justify-between z-20">
        {/* Brand Mark */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#0F0F0F] border border-[#26272D] flex items-center justify-center shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#2FE92B] shadow-[0_0_6px_#2FE92B]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[17px] font-black tracking-widest text-white uppercase">VINYL</span>
            <span className="text-[11px] text-[#BBCBB2] tracking-wider font-light">黑胶</span>
          </div>
        </div>

        {/* Right Actions: Search & Profile */}
        <div className="flex items-center gap-2.5">
          <button
            id="home-search-btn"
            type="button"
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
            title="搜索黑胶与艺术家"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            id="home-profile-btn"
            type="button"
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors overflow-hidden"
            title="个人主页"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Intro Salutation */}
      <div className="px-5 pt-1 pb-1">
        <h1 className="text-[15px] text-[#BBCBB2] font-medium tracking-tight">
          早上好，今天想听哪一张？
        </h1>
      </div>

      {/* CORE 1: Central Vinyl Hero Carousel (Takes 45%-60% visual space) */}
      <section className="w-full">
        <VinylHeroCarousel
          albums={albums}
          currentIndex={carouselIndex}
          onSelectIndex={onSelectCarouselIndex}
          isPlaying={isPlaying}
          currentTrackTitle={currentTrackTitle}
          onTogglePlay={onTogglePlayAlbum}
          onOpenAlbumDetail={onOpenAlbumDetail}
          onToggleFavorite={onToggleFavorite}
          favorites={favorites}
        />
      </section>

      {/* CORE 2: Scrollable Down Sections (Appears after the hero) */}
      <div className="w-full px-4 space-y-6 mt-4">
        {/* Section: 最近播放 (Recently Played) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2FE92B]" />
              <h3 className="text-[13.5px] font-bold text-white tracking-tight">最近播放</h3>
            </div>
            <span className="text-[11px] text-[#BBCBB2]/70">全部历史</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {albums.slice(0, 4).map((album) => (
              <div
                key={`recent-${album.id}`}
                id={`recent-album-${album.id}`}
                onClick={() => onOpenAlbumDetail(album)}
                className="flex-shrink-0 w-32 p-2 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all group"
              >
                {/* Mini sleeve + record peek */}
                <div className="relative w-full aspect-square rounded-[4px] overflow-hidden bg-black">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-1 right-1 px-1 py-0.5 rounded-[2px] bg-black/80 text-[8px] font-mono text-[#2FE92B]">
                    {album.rpm}
                  </div>
                </div>
                <p className="text-[12px] font-bold text-white truncate mt-1.5 leading-tight">
                  {album.title}
                </p>
                <p className="text-[10px] text-[#BBCBB2] truncate mt-0.5 opacity-75">
                  {album.artist}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: 实体黑胶唱片架入口 (My Vinyl Shelf Teaser) */}
        <section
          onClick={() => onOpenAlbumDetail(albums[1])}
          className="p-3.5 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#2FE92B]/40 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#1B1B1D] border border-[#26272D] flex items-center justify-center text-[#2FE92B]">
              <Disc className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-[13.5px] font-bold text-white">实体唱片架模式</h4>
                <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-[#2FE92B]/15 text-[#2FE92B] border border-[#2FE92B]/30 font-mono">
                  SHELF
                </span>
              </div>
              <p className="text-[11px] text-[#BBCBB2] mt-0.5 opacity-75">
                模拟实体唱片架层叠翻阅体验 · 已收录 128 张
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#BBCBB2] group-hover:translate-x-0.5 transition-transform" />
        </section>

        {/* Section: 为你推荐 (Recommended for You) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2FE92B]" />
              <h3 className="text-[13.5px] font-bold text-white tracking-tight">为你推荐 · 殿堂黑胶</h3>
            </div>
            <span className="text-[11px] text-[#BBCBB2]/70">换一批</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {albums.slice(2, 6).map((album) => (
              <div
                key={`rec-${album.id}`}
                onClick={() => onOpenAlbumDetail(album)}
                className="p-2.5 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all"
              >
                <div className="relative w-full aspect-square rounded-[4px] overflow-hidden bg-black mb-2">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded-[2px] bg-black/85 text-[8.5px] font-mono text-[#BBCBB2]">
                    {album.year}
                  </span>
                </div>
                <p className="text-[12px] font-bold text-white truncate leading-tight">
                  {album.title}
                </p>
                <p className="text-[10.5px] text-[#BBCBB2] truncate opacity-75 mt-0.5">
                  {album.artist}
                </p>
                <p className="text-[9.5px] text-white/40 truncate mt-0.5">
                  {album.weight}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: 收藏艺术家 (Followed Artists) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#FF9821]" />
              <h3 className="text-[13.5px] font-bold text-white tracking-tight">收藏艺术家</h3>
            </div>
            <span className="text-[11px] text-[#BBCBB2]/70">全部 (36)</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {ARTISTS.map((artist) => (
              <div
                key={artist.id}
                onClick={() => onOpenArtist(artist.id)}
                className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border border-[#26272D] group-hover:border-[#2FE92B] transition-colors p-0.5 bg-[#0F0F0F]">
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-[11px] text-white font-medium mt-1.5 truncate max-w-[68px] text-center">
                  {artist.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
