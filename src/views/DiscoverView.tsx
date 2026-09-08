import React, { useState } from 'react';
import { Album } from '../types';
import { Search, Sparkles, BookOpen, Flame, ArrowUpRight } from 'lucide-react';
import { EDITORIAL_STORIES } from '../data/mockData';
import { audioEngine } from '../services/audioEngine';

interface DiscoverViewProps {
  albums: Album[];
  onOpenAlbumDetail: (album: Album) => void;
  onOpenSearch: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  albums,
  onOpenAlbumDetail,
  onOpenSearch,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('本周推荐');

  const categories = [
    '本周推荐',
    '经典必听',
    '摇滚',
    '爵士',
    '电子',
    '独立',
    '华语',
    '电影原声',
    '黑胶故事',
  ];

  const featuredAlbum = albums[0]; // The Dark Side of the Moon

  return (
    <div
      id="discover-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Top Header */}
      <header className="px-4 pt-3 pb-2 z-20">
        <h1 className="text-[20px] font-bold text-white tracking-tight">发现黑胶</h1>
        <p className="text-[11px] text-[#BBCBB2] opacity-75">
          每周精选馆藏 · 实体母带重制 · 唱片文化志
        </p>

        {/* Search Bar Input */}
        <div
          onClick={onOpenSearch}
          className="mt-3 w-full h-10 px-3.5 rounded-[6px] bg-[#1B1B1D] border border-[#26272D] hover:border-[#2FE92B]/50 flex items-center gap-2.5 text-white/50 cursor-pointer transition-all focus-within:ring-1 focus-within:ring-[#2FE92B]"
        >
          <Search className="w-4 h-4 text-white/40" />
          <span className="text-[13px] text-white/50">搜索专辑、艺术家、风格、母带厂牌...</span>
        </div>
      </header>

      {/* Categories Horizontal Selector */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              id={`discover-category-${cat}`}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                audioEngine.triggerHaptic('light');
              }}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold'
                  : 'bg-[#1B1B1D] text-white/70 border border-[#26272D] hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Featured Vinyl Showcase Card ("本周推荐 · 经典永不过时") */}
      <div className="px-4 mt-2">
        <div
          onClick={() => onOpenAlbumDetail(featuredAlbum)}
          className="relative w-full p-4 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#2FE92B]/40 cursor-pointer transition-all overflow-hidden group"
        >
          {/* Subtle Ambient Tone */}
          <div
            className="absolute top-0 right-0 w-44 h-44 rounded-full filter blur-[50px] opacity-20 pointer-events-none"
            style={{ backgroundColor: featuredAlbum.color }}
          />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2FE92B]" />
              <span className="text-[10.5px] font-mono tracking-wider text-[#2FE92B] uppercase">
                FEATURED VINYL OF THE WEEK
              </span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">
              33 ⅓ RPM · 180g
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Spinning preview disc beside cover */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <div className="absolute right-0 top-1 w-24 h-24 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center animate-vinyl-spin">
                <div className="absolute inset-0 vinyl-grooves opacity-70" />
                <div className="w-8 h-8 rounded-full bg-[#1A1A1D] border border-[#2FE92B]/60" />
              </div>
              <img
                src={featuredAlbum.coverUrl}
                alt={featuredAlbum.title}
                className="relative z-10 w-24 h-24 rounded-[4px] object-cover border border-[#26272D] shadow-lg"
              />
            </div>

            <div className="overflow-hidden">
              <h3 className="text-[15px] font-bold text-white tracking-tight line-clamp-1">
                {featuredAlbum.title}
              </h3>
              <p className="text-[12px] text-[#BBCBB2] opacity-80 mt-0.5">
                {featuredAlbum.artist}
              </p>
              <p className="text-[11px] text-white/50 line-clamp-2 mt-1 leading-relaxed">
                {featuredAlbum.description}
              </p>
              <span className="inline-block mt-2 text-[10.5px] font-mono text-[#2FE92B]">
                点击收听完整模拟母带 →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑推荐 (Curated Editors' Picks) */}
      <section className="px-4 mt-6 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF9821]" />
            <h3 className="text-[14px] font-bold text-white tracking-tight">编辑馆藏推荐</h3>
          </div>
          <span className="text-[11px] text-[#BBCBB2]/70">更多</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {albums.slice(1, 5).map((album) => (
            <div
              key={`disc-rec-${album.id}`}
              onClick={() => onOpenAlbumDetail(album)}
              className="p-2.5 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all flex flex-col group"
            >
              <div className="relative w-full aspect-square rounded-[4px] overflow-hidden bg-black mb-2">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded-[2px] bg-black/80 text-[8px] font-mono text-[#2FE92B]">
                  {album.edition.includes('限量') ? '限量版' : '发烧版'}
                </span>
              </div>
              <h4 className="text-[12.5px] font-bold text-white truncate leading-tight">
                {album.title}
              </h4>
              <p className="text-[10.5px] text-[#BBCBB2] truncate opacity-75 mt-0.5">
                {album.artist}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 黑胶故事 / 深度志 (Editorial Vinyl Stories) */}
      <section className="px-4 mt-6 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#2FE92B]" />
          <h3 className="text-[14px] font-bold text-white tracking-tight">黑胶专栏 · 声音考古</h3>
        </div>

        <div className="space-y-2.5">
          {EDITORIAL_STORIES.map((story) => (
            <div
              key={story.id}
              className="p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all flex items-center justify-between gap-3"
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-[#1B1B1D] border border-[#26272D] text-[#2FE92B] font-mono">
                    {story.tag}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">{story.readTime}</span>
                </div>
                <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-1">
                  {story.title}
                </h4>
                <p className="text-[11px] text-[#BBCBB2] opacity-70 line-clamp-1">
                  {story.subtitle}
                </p>
              </div>

              <div className="w-14 h-14 rounded-[4px] overflow-hidden flex-shrink-0 border border-[#26272D]">
                <img
                  src={story.coverUrl}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
