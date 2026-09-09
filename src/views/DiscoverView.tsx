import React, { useState } from 'react';
import { Album } from '../types';
import { Search, Sparkles, BookOpen, Disc, Play, ChevronRight, Compass } from 'lucide-react';
import { EDITORIAL_STORIES } from '../data/mockData';
import { audioEngine } from '../services/audioEngine';

interface DiscoverViewProps {
  albums: Album[];
  onOpenAlbumDetail: (album: Album) => void;
  onOpenSearch: () => void;
  onPlayAlbum?: (album: Album) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  albums,
  onOpenAlbumDetail,
  onOpenSearch,
  onPlayAlbum,
}) => {
  const [selectedIssue, setSelectedIssue] = useState<'current' | 'jazz' | 'first_press'>('current');

  const leadAlbum = albums[0]; // Pink Floyd - The Dark Side of the Moon
  const jazzAlbums = albums.filter((a) => a.genre.includes('摇滚') || a.genre.includes('爵士')).slice(0, 3);
  const vintageMasters = albums.slice(1, 4);

  return (
    <div
      id="discover-view"
      className="w-full min-h-screen bg-[#070709] text-white flex flex-col select-none pb-28 overflow-y-auto no-scrollbar"
    >
      {/* Top Header Bar */}
      <header className="px-5 pt-4 pb-3 z-20 border-b border-[#16161A] bg-[#070709]/90 backdrop-blur-md sticky top-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9.5px] font-mono tracking-widest text-white/40 uppercase">
              ISSUE 09 · EDITORIAL
            </span>
          </div>
          <h1 className="text-[19px] font-bold text-white tracking-tight">
            黑胶文化志 · 专题策展
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          className="w-8 h-8 rounded-[5px] bg-[#121215] border border-[#202026] text-white/60 hover:text-white flex items-center justify-center transition-colors"
          title="搜索全部策展"
        >
          <Search className="w-4 h-4" />
        </button>
      </header>

      {/* Magazine Issue Navigation Tabs */}
      <div className="px-5 py-2.5 flex items-center gap-2 border-b border-[#141418] overflow-x-auto no-scrollbar">
        {[
          { id: 'current', label: '本期主打 · 月之暗面' },
          { id: 'jazz', label: '深夜爵士墙' },
          { id: 'first_press', label: '首版模拟母带' },
        ].map((tab) => {
          const isActive = selectedIssue === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedIssue(tab.id as any);
                audioEngine.triggerHaptic('light');
              }}
              className={`px-3 py-1 rounded-[4px] text-[11.5px] whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#18181E] text-white border border-[#2B2B36]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="px-5 space-y-7 mt-4">
        {/* ========================================================================= */}
        {/* EDITORIAL 1: Magazine Lead Cover Feature                                 */}
        {/* ========================================================================= */}
        <section
          onClick={() => onOpenAlbumDetail(leadAlbum)}
          className="relative w-full rounded-[10px] bg-[#0E0E12] border border-[#1E1E24] hover:border-[#2E2E38] p-5 cursor-pointer transition-all overflow-hidden group shadow-2xl"
        >
          {/* Subtle Ambient Color Wash */}
          <div
            className="absolute -top-10 -right-10 w-56 h-56 rounded-full filter blur-[70px] opacity-15 pointer-events-none"
            style={{ backgroundColor: leadAlbum.color || '#2A2A38' }}
          />

          <div className="relative z-10 flex flex-col justify-between">
            {/* Lead Tag */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9.5px] font-mono tracking-widest text-white/50 uppercase border border-white/10 px-2 py-0.5 rounded-[2px] bg-black/40">
                COVER ESSAY · 封面特写
              </span>
              <span className="text-[10px] font-mono text-white/40">
                {leadAlbum.year} · {leadAlbum.rpm}
              </span>
            </div>

            {/* Visual Ensemble: Sleeve + Peeking Wax */}
            <div className="relative flex items-center justify-center py-2 mb-4">
              {/* Spinning Vinyl peeking from sleeve */}
              <div className="absolute left-1/2 -translate-x-12 w-32 h-32 rounded-full bg-[#060608] border border-white/10 overflow-hidden flex items-center justify-center animate-vinyl-spin shadow-2xl">
                <div className="absolute inset-0 vinyl-grooves opacity-70" />
                <div className="w-10 h-10 rounded-full bg-[#121215] border border-white/20" />
              </div>

              {/* Cover Jacket */}
              <div className="relative z-10 w-36 h-36 rounded-[4px] overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={leadAlbum.coverUrl}
                  alt={leadAlbum.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Editorial Title and Essay Excerpt */}
            <div>
              <h2 className="text-[18px] font-bold text-white tracking-tight leading-snug">
                棱镜与光束：半个世纪的声音实验
              </h2>
              <p className="text-[12.5px] text-[#BBCBB2] opacity-80 mt-1">
                《{leadAlbum.title}》— {leadAlbum.artist}
              </p>
              <p className="text-[11.5px] text-white/50 leading-relaxed mt-2 line-clamp-3">
                1973年艾比路录音室的模拟调音台前，理查德·赖特的哈蒙德风琴与吉尔摩的吉他泛音被永久烙印在母盘铜板上。50年后，黑胶凹槽依旧完整保留了那声跨越时代的心跳。
              </p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1C1C22]">
                <span className="text-[11px] font-mono text-white/60 group-hover:text-white flex items-center gap-1">
                  <span>展开唱片母盘与内页档案</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-mono text-white/40">
                  SHVL 804 · 180g 重磅
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EDITORIAL 2: 深夜爵士墙 (Midnight Blue Note Jazz Wall)                     */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-end justify-between px-1">
            <div>
              <span className="text-[9.5px] font-mono text-white/40 tracking-widest uppercase">
                CURATED THEME 01
              </span>
              <h3 className="text-[15px] font-bold text-white tracking-tight mt-0.5">
                深夜爵士墙 · 蓝调音符的声音质感
              </h3>
            </div>
            <span className="text-[11px] text-white/40 font-mono">BLUE NOTE</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {jazzAlbums.map((album) => (
              <div
                key={`jazz-${album.id}`}
                onClick={() => onOpenAlbumDetail(album)}
                className="p-3 rounded-[8px] bg-[#0E0E12] border border-[#1E1E24] hover:border-[#2D2D36] cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="relative w-full aspect-square rounded-[3px] overflow-hidden bg-black mb-2.5">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[2px] bg-black/85 text-[8.5px] font-mono text-white/80">
                    {album.rpm.split(' ')[0]}
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-bold text-white truncate">
                    {album.title}
                  </h4>
                  <p className="text-[11px] text-[#BBCBB2] truncate opacity-75 mt-0.5">
                    {album.artist}
                  </p>
                  <p className="text-[10px] text-white/40 mt-1 line-clamp-1">
                    {album.label} · {album.year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EDITORIAL 3: 首版经典模拟母带 (Vintage First Pressings)                    */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-end justify-between px-1">
            <div>
              <span className="text-[9.5px] font-mono text-white/40 tracking-widest uppercase">
                CURATED THEME 02
              </span>
              <h3 className="text-[15px] font-bold text-white tracking-tight mt-0.5">
                母带考古 · 首版刻片与铜版声学
              </h3>
            </div>
            <span className="text-[11px] text-white/40 font-mono">1ST PRESS</span>
          </div>

          <div className="space-y-2.5">
            {vintageMasters.map((album) => (
              <div
                key={`master-${album.id}`}
                onClick={() => onOpenAlbumDetail(album)}
                className="p-3 rounded-[8px] bg-[#0E0E12] border border-[#1E1E24] hover:border-[#2D2D36] cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-13 h-13 rounded-[3px] object-cover flex-shrink-0 border border-white/10"
                  />
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13.5px] font-bold text-white truncate">
                        {album.title}
                      </h4>
                    </div>
                    <p className="text-[11.5px] text-[#BBCBB2] truncate opacity-75 mt-0.5">
                      {album.artist} · {album.year}
                    </p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">
                      刻片矩阵: {album.matrixCode} · {album.rpm}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white flex-shrink-0 transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EDITORIAL 4: 黑胶专栏 · 声音考古深度长文                                   */}
        {/* ========================================================================= */}
        <section className="space-y-3 pb-6">
          <div className="flex items-center gap-1.5 px-1">
            <BookOpen className="w-3.5 h-3.5 text-white/60" />
            <h3 className="text-[15px] font-bold text-white tracking-tight">
              唱片史考 · 实体声音的温度
            </h3>
          </div>

          <div className="space-y-2.5">
            {EDITORIAL_STORIES.map((story) => (
              <div
                key={story.id}
                className="p-3.5 rounded-[8px] bg-[#0E0E12] border border-[#1E1E24] hover:border-[#2D2D36] cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-[2px] bg-[#141418] border border-[#222228] text-white/60 font-mono">
                      {story.tag}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">{story.readTime}</span>
                  </div>
                  <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-1 group-hover:text-white">
                    {story.title}
                  </h4>
                  <p className="text-[11px] text-[#BBCBB2] opacity-70 line-clamp-1">
                    {story.subtitle}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-[3px] overflow-hidden flex-shrink-0 border border-[#202026]">
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
    </div>
  );
};
