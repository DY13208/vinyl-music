import React, { useState } from 'react';
import { Album } from '../types';
import { LayoutGrid, Layers, Search, Disc, ChevronRight } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface CollectionViewProps {
  albums: Album[];
  onOpenAlbumDetail: (album: Album) => void;
  onOpenSearch: () => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({
  albums,
  onOpenAlbumDetail,
  onOpenSearch,
}) => {
  const [activeFilter, setActiveFilter] = useState<'全部' | '专辑' | '艺术家' | '风格' | '年份'>('全部');
  const [viewMode, setViewMode] = useState<'grid' | 'shelf'>('shelf');
  const [activeShelfIndex, setActiveShelfIndex] = useState<number>(0);

  const filters: ('全部' | '专辑' | '艺术家' | '风格' | '年份')[] = ['全部', '专辑', '艺术家', '风格', '年份'];

  return (
    <div
      id="collection-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24"
    >
      {/* Top Header */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between z-20">
        <div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">我的黑胶</h1>
          <p className="text-[11px] text-[#BBCBB2] opacity-75">
            共收藏 {albums.length * 16} 张实体黑胶 · 36 位艺术家
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid / Shelf Toggle Switch */}
          <div className="flex items-center p-0.5 rounded-[4px] bg-[#1B1B1D] border border-[#26272D]">
            <button
              id="btn-view-grid"
              type="button"
              onClick={() => {
                setViewMode('grid');
                audioEngine.triggerHaptic('light');
              }}
              className={`p-1.5 rounded-[3px] transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#2FE92B] text-[#0F0F0F]'
                  : 'text-white/50 hover:text-white'
              }`}
              title="网格视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="btn-view-shelf"
              type="button"
              onClick={() => {
                setViewMode('shelf');
                audioEngine.triggerHaptic('light');
              }}
              className={`p-1.5 rounded-[3px] transition-colors ${
                viewMode === 'shelf'
                  ? 'bg-[#2FE92B] text-[#0F0F0F]'
                  : 'text-white/50 hover:text-white'
              }`}
              title="实体唱片架视图 (Shelf)"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
            title="搜索"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              id={`filter-${filter}`}
              type="button"
              onClick={() => {
                setActiveFilter(filter);
                audioEngine.triggerHaptic('light');
              }}
              className={`px-3.5 py-1 rounded-[4px] text-[12px] font-medium tracking-tight whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold'
                  : 'bg-[#1B1B1D] text-white/70 hover:text-white border border-[#26272D]'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 mt-2">
        {viewMode === 'grid' ? (
          /* Standard Album Grid View */
          <div className="grid grid-cols-2 gap-3.5">
            {albums.map((album) => (
              <div
                key={album.id}
                id={`grid-album-${album.id}`}
                onClick={() => onOpenAlbumDetail(album)}
                className="group p-2.5 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all flex flex-col"
              >
                {/* Sleeve Cover + Peeking Disc */}
                <div className="relative w-full aspect-square rounded-[4px] overflow-hidden bg-black mb-2">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  {/* Subtle right disc rim */}
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent to-black/80 pointer-events-none" />
                  <span className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded-[2px] bg-black/80 text-[8px] font-mono text-[#2FE92B]">
                    {album.rpm}
                  </span>
                </div>

                <h3 className="text-[13px] font-bold text-white truncate leading-tight">
                  {album.title}
                </h3>
                <p className="text-[11px] text-[#BBCBB2] truncate opacity-75 mt-0.5">
                  {album.artist}
                </p>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1F2024] text-[10px] text-white/40 font-mono">
                  <span>{album.year}</span>
                  <span>{album.trackCount} 首</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* SHELF MODE: Simulated Physical Vinyl Crate & Shelf */
          <div className="w-full flex flex-col items-center py-2">
            {/* Shelf Mode Header Guide */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-mono text-[#2FE92B] flex items-center gap-1">
                <Disc className="w-3 h-3" />
                实体唱片架 · 拨动翻阅
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                {activeShelfIndex + 1} / {albums.length}
              </span>
            </div>

            {/* Active Highlighted Album Focus Card */}
            {albums[activeShelfIndex] && (
              <div
                onClick={() => onOpenAlbumDetail(albums[activeShelfIndex])}
                className="w-full p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] mb-5 cursor-pointer hover:border-[#2FE92B]/50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={albums[activeShelfIndex].coverUrl}
                    alt={albums[activeShelfIndex].title}
                    className="w-12 h-12 rounded-[4px] object-cover flex-shrink-0"
                  />
                  <div className="overflow-hidden">
                    <p className="text-[13.5px] font-bold text-white truncate">
                      {albums[activeShelfIndex].title}
                    </p>
                    <p className="text-[11px] text-[#BBCBB2] truncate opacity-80">
                      {albums[activeShelfIndex].artist} · {albums[activeShelfIndex].year}
                    </p>
                    <p className="text-[10px] text-[#2FE92B] font-mono mt-0.5">
                      {albums[activeShelfIndex].weight}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#BBCBB2]">
                  <span>打开详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {/* Physical Record Shelf Crate Container */}
            <div
              className="relative w-full h-[290px] rounded-[6px] p-4 flex items-end justify-center overflow-hidden border border-[#26272D]"
              style={{
                background: 'linear-gradient(180deg, #0A0A0C 0%, #121215 85%, #18181D 100%)',
                boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)',
              }}
            >
              {/* Wooden / Carbon Record Crate Lip Base */}
              <div className="absolute bottom-0 inset-x-0 h-4 bg-[#1B1B1D] border-t border-[#2A2A2E] z-30" />

              {/* Overlapping records leaning on the shelf (Crate Digging Experience) */}
              <div className="relative w-full h-full flex items-center justify-center">
                {albums.map((album, idx) => {
                  const offset = idx - activeShelfIndex;
                  const isCurrent = idx === activeShelfIndex;

                  // Compute shelf overlap geometry
                  const translateX = offset * 32;
                  const translateY = isCurrent ? -36 : Math.abs(offset) * 2;
                  const rotateDeg = offset * -2.5;
                  const zIndex = 20 - Math.abs(offset);

                  return (
                    <div
                      key={`shelf-${album.id}`}
                      id={`shelf-album-${album.id}`}
                      onClick={() => {
                        setActiveShelfIndex(idx);
                        audioEngine.triggerHaptic('light');
                      }}
                      className="absolute will-change-transform cursor-pointer transition-all duration-300 ease-out"
                      style={{
                        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotateDeg}deg)`,
                        zIndex,
                        width: 170,
                        height: 170,
                      }}
                    >
                      {/* Vinyl disc peeking top if active */}
                      <div
                        className="absolute -top-7 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-[#080809] border border-white/10 z-0 transition-opacity duration-300"
                        style={{
                          opacity: isCurrent ? 1 : 0,
                          boxShadow: '0 0 16px rgba(0,0,0,0.9)',
                        }}
                      >
                        <div className="absolute inset-0 vinyl-grooves opacity-60" />
                        <div className="absolute inset-[30%] rounded-full bg-black border border-[#2FE92B]/40" />
                      </div>

                      {/* Record Jacket Sleeve */}
                      <div
                        className="relative z-10 w-full h-full rounded-[4px] overflow-hidden bg-[#0F0F0F] transition-shadow duration-300"
                        style={{
                          border: isCurrent ? '1.5px solid #2FE92B' : '1px solid #26272D',
                          boxShadow: isCurrent
                            ? '0 16px 32px rgba(0,0,0,0.9), 0 0 12px rgba(47,233,43,0.2)'
                            : '-4px 6px 14px rgba(0,0,0,0.8)',
                        }}
                      >
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Spine indicator gradient */}
                        <div className="absolute inset-y-0 left-0 w-3 bg-black/40 border-r border-white/5" />

                        {/* Title pill on sleeve */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2">
                          <p className="text-[10.5px] font-bold text-white truncate">
                            {album.title}
                          </p>
                          <p className="text-[9px] text-[#BBCBB2] truncate opacity-70">
                            {album.artist}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shelf navigation nudge */}
            <p className="text-[11px] text-white/40 text-center mt-3 font-mono">
              点击唱片封面向上翻起 · 体验实体黑胶手翻触感
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
