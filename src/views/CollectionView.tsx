import React, { useState, useMemo } from 'react';
import { Album } from '../types';
import {
  LayoutGrid,
  Layers,
  Search,
  Disc,
  ChevronRight,
  Plus,
  ArrowUpDown,
  Play,
  FileSpreadsheet,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { ImportVinylModal } from '../components/ImportVinylModal';

interface CollectionViewProps {
  albums: Album[];
  onOpenAlbumDetail: (album: Album) => void;
  onOpenSearch: () => void;
  onPlayAlbum?: (album: Album) => void;
  onAddAlbum?: (album: Album) => void;
  onImportMultiple?: (albums: Album[]) => void;
  onRemoveAlbum?: (albumId: string) => void;
}

type ViewMode = 'shelf' | 'wall' | 'archive';
type SortOption = 'recent' | 'year-desc' | 'year-asc' | 'title';

export const CollectionView: React.FC<CollectionViewProps> = ({
  albums,
  onOpenAlbumDetail,
  onOpenSearch,
  onPlayAlbum,
  onAddAlbum,
  onImportMultiple,
}) => {
  // View & Filter States
  const [viewMode, setViewMode] = useState<ViewMode>('shelf');
  const [selectedGenre, setSelectedGenre] = useState<string>('全部');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShelfIndex, setActiveShelfIndex] = useState<number>(0);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Available Genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    albums.forEach((a) => {
      const parts = a.genre.split(/[·/,\s]+/);
      parts.forEach((p) => {
        const cleaned = p.trim();
        if (cleaned) set.add(cleaned);
      });
    });
    return ['全部', ...Array.from(set).slice(0, 5)];
  }, [albums]);

  // Filtered and sorted albums
  const processedAlbums = useMemo(() => {
    let result = [...albums];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.artist.toLowerCase().includes(q) ||
          a.label?.toLowerCase().includes(q) ||
          a.matrixCode?.toLowerCase().includes(q)
      );
    }

    // Genre filter
    if (selectedGenre !== '全部') {
      result = result.filter((a) => a.genre.includes(selectedGenre));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'title':
          return a.title.localeCompare(b.title, 'zh-Hans-CN');
        case 'recent':
        default:
          return 0;
      }
    });

    return result;
  }, [albums, searchQuery, selectedGenre, sortOption]);

  const currentShelfIndex = Math.min(
    Math.max(0, activeShelfIndex),
    Math.max(0, processedAlbums.length - 1)
  );
  const activeAlbum = processedAlbums[currentShelfIndex];

  const handleAddAlbumWrapper = (newAlbum: Album) => {
    if (onAddAlbum) {
      onAddAlbum(newAlbum);
    }
    showToast(`《${newAlbum.title}》已入库`);
  };

  const handleImportMultipleWrapper = (newAlbums: Album[]) => {
    if (onImportMultiple) {
      onImportMultiple(newAlbums);
    }
    showToast(`成功导入 ${newAlbums.length} 张黑胶藏盘`);
  };

  return (
    <div
      id="collection-view"
      className="w-full min-h-screen bg-[#070709] text-white flex flex-col select-none pb-28"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#16161A] border border-[#2FE92B]/40 text-white text-[12px] font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-3.5 h-3.5 text-[#2FE92B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header - Restrained Luxury Styling */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between z-20 border-b border-[#16161A] bg-[#070709]/90 backdrop-blur-md sticky top-0">
        <div>
          <h1 className="text-[19px] font-bold text-white tracking-tight flex items-center gap-2">
            <span>黑胶藏室</span>
            <span className="text-[10px] font-mono text-white/40 tracking-wider">
              {albums.length} LPs
            </span>
          </h1>
          <p className="text-[11px] text-[#BBCBB2] opacity-70 mt-0.5">
            实体黑胶架 · 模拟母带典藏
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import Vinyl Button - Restrained dark button with subtle icon */}
          <button
            id="btn-import-vinyl"
            type="button"
            onClick={() => {
              setIsImportModalOpen(true);
              audioEngine.triggerHaptic('light');
            }}
            className="px-3 py-1.5 rounded-[5px] bg-[#141418] hover:bg-[#1B1B22] border border-[#26272E] text-white text-[11.5px] font-medium flex items-center gap-1.5 transition-colors"
            title="录入或导入新黑胶"
          >
            <Plus className="w-3.5 h-3.5 text-[#2FE92B]" />
            <span>导入藏盘</span>
          </button>

          {/* View Mode Switcher: 实体唱片架 (shelf) / 陈列墙 (wall) / 馆藏名录 (archive) */}
          <div className="flex items-center p-0.5 rounded-[5px] bg-[#121215] border border-[#222228]">
            <button
              id="btn-view-shelf"
              type="button"
              onClick={() => {
                setViewMode('shelf');
                audioEngine.triggerHaptic('light');
              }}
              className={`p-1.5 rounded-[4px] transition-colors ${
                viewMode === 'shelf'
                  ? 'bg-[#1D1D24] text-white'
                  : 'text-white/40 hover:text-white'
              }`}
              title="实体翻阅架 (Shelf Crate)"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              id="btn-view-wall"
              type="button"
              onClick={() => {
                setViewMode('wall');
                audioEngine.triggerHaptic('light');
              }}
              className={`p-1.5 rounded-[4px] transition-colors ${
                viewMode === 'wall'
                  ? 'bg-[#1D1D24] text-white'
                  : 'text-white/40 hover:text-white'
              }`}
              title="黑胶陈列墙 (Display Wall)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="btn-view-archive"
              type="button"
              onClick={() => {
                setViewMode('archive');
                audioEngine.triggerHaptic('light');
              }}
              className={`p-1.5 rounded-[4px] transition-colors ${
                viewMode === 'archive'
                  ? 'bg-[#1D1D24] text-white'
                  : 'text-white/40 hover:text-white'
              }`}
              title="馆藏档案名录 (Archive List)"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <div className="px-5 pt-3 space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索藏盘、艺术家、矩阵码或厂牌..."
            className="w-full bg-[#111114] border border-[#202026] rounded-[5px] pl-8.5 pr-3 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:border-[#2FE92B]/50 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40 hover:text-white"
            >
              清除
            </button>
          )}
        </div>

        {/* Filter Chips & Sort Dropdown */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {genres.map((g) => {
              const isActive = selectedGenre === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setSelectedGenre(g);
                    audioEngine.triggerHaptic('light');
                  }}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#1C1C22] text-white border border-[#2FE92B]/40'
                      : 'bg-[#111114] text-white/50 hover:text-white border border-[#1E1E24]'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <ArrowUpDown className="w-3 h-3 text-white/40" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-[#111114] border border-[#1E1E24] rounded-[4px] px-2 py-1 text-[11px] text-white/70 focus:border-[#2FE92B]/40 focus:outline-none"
            >
              <option value="recent">最近入库</option>
              <option value="year-desc">发行年份 (新→旧)</option>
              <option value="year-asc">发行年份 (旧→新)</option>
              <option value="title">专辑首字母 (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Collection Content Area */}
      <div className="flex-1 px-5 mt-3">
        {processedAlbums.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center flex flex-col items-center justify-center p-6 rounded-[8px] bg-[#0E0E12] border border-[#1E1E24] mt-2">
            <div className="w-12 h-12 rounded-full bg-[#15151A] border border-[#24242C] flex items-center justify-center text-white/30 mb-3">
              <Disc className="w-6 h-6" />
            </div>
            <h3 className="text-[14px] font-bold text-white">暂无匹配的黑胶唱片</h3>
            <p className="text-[11px] text-[#BBCBB2] opacity-70 mt-1 max-w-xs">
              可清空搜索，或录入新的实体黑胶唱片
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedGenre('全部');
                setSearchQuery('');
                setIsImportModalOpen(true);
              }}
              className="mt-4 px-3.5 py-1.5 rounded-[5px] bg-[#18181F] border border-[#282832] text-white text-[12px] flex items-center gap-1.5 hover:border-[#2FE92B]/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#2FE92B]" />
              <span>录入新唱片</span>
            </button>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* VIEW MODE 1: SHELF / CRATE (实体翻阅架 - 收藏家开箱手感)                    */}
            {/* ========================================================================= */}
            {viewMode === 'shelf' && (
              <div className="w-full flex flex-col items-center py-1">
                {/* Active Focus Album Card (Minimalist display, no KPI spam) */}
                {activeAlbum && (
                  <div
                    onClick={() => onOpenAlbumDetail(activeAlbum)}
                    className="w-full p-3 rounded-[8px] bg-[#111115] border border-[#202026] hover:border-[#2D2D36] transition-all cursor-pointer mb-4 shadow-xl group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className="relative w-13 h-13 rounded-[3px] overflow-hidden flex-shrink-0 border border-[#222228] bg-black">
                          <img
                            src={activeAlbum.coverUrl}
                            alt={activeAlbum.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="overflow-hidden pr-2">
                          <h3 className="text-[14px] font-bold text-white truncate group-hover:text-white">
                            {activeAlbum.title}
                          </h3>
                          <p className="text-[11.5px] text-[#BBCBB2] truncate opacity-80 mt-0.5">
                            {activeAlbum.artist} · {activeAlbum.year}
                          </p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">
                            {activeAlbum.rpm} · {activeAlbum.label} · {activeAlbum.matrixCode}
                          </p>
                        </div>
                      </div>

                      {/* Quick Play & Action */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {onPlayAlbum && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayAlbum(activeAlbum);
                              audioEngine.triggerHaptic('medium');
                            }}
                            className="w-8 h-8 rounded-full bg-[#1A1A20] hover:bg-[#22222A] border border-[#2B2B36] text-white flex items-center justify-center transition-all"
                            title="落针播放"
                          >
                            <Play className="w-3.5 h-3.5 fill-[#2FE92B] text-[#2FE92B] ml-0.5" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Physical Vinyl Crate Box with Leaning Sleeves */}
                <div
                  className="relative w-full h-[320px] rounded-[10px] p-4 flex items-end justify-center overflow-hidden border border-[#1E1E24]"
                  style={{
                    background: 'radial-gradient(ellipse at top, #141418 0%, #09090C 75%, #050507 100%)',
                    boxShadow: 'inset 0 12px 30px rgba(0,0,0,0.9), 0 16px 40px rgba(0,0,0,0.9)',
                  }}
                >
                  {/* Bottom Crate Lip */}
                  <div className="absolute bottom-0 inset-x-0 h-6 bg-[#121215] border-t border-[#1F1F26] z-30 flex items-center justify-between px-4">
                    <span className="text-[8.5px] font-mono text-white/40 tracking-wider">
                      SOLID WALNUT CRATE · {processedAlbums.length} LPs
                    </span>
                    <span className="text-[8.5px] font-mono text-white/50 tracking-wider">
                      {currentShelfIndex + 1} / {processedAlbums.length}
                    </span>
                  </div>

                  {/* Left / Right Flip Controls */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveShelfIndex((prev) => Math.max(0, prev - 1));
                      audioEngine.triggerHaptic('light');
                    }}
                    disabled={currentShelfIndex === 0}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-40 w-8 h-8 rounded-full bg-black/60 border border-[#222228] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 transition-all"
                    title="前一张"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveShelfIndex((prev) => Math.min(processedAlbums.length - 1, prev + 1));
                      audioEngine.triggerHaptic('light');
                    }}
                    disabled={currentShelfIndex >= processedAlbums.length - 1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-40 w-8 h-8 rounded-full bg-black/60 border border-[#222228] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 transition-all"
                    title="后一张"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Overlapping records leaning in crate */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {processedAlbums.map((album, idx) => {
                      const offset = idx - currentShelfIndex;
                      const isCurrent = idx === currentShelfIndex;

                      if (Math.abs(offset) > 5) return null;

                      const translateX = offset * 36;
                      const translateY = isCurrent ? -40 : Math.abs(offset) * 2;
                      const rotateDeg = offset * -2.8;
                      const scale = isCurrent ? 1.05 : Math.max(0.85, 1 - Math.abs(offset) * 0.04);
                      const zIndex = 25 - Math.abs(offset);

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
                            transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotateDeg}deg) scale(${scale})`,
                            zIndex,
                            width: 180,
                            height: 180,
                          }}
                        >
                          {/* Realistic vinyl disc peeking out when active */}
                          <div
                            className="absolute -top-10 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full bg-[#070709] border border-white/10 z-0 transition-all duration-300 pointer-events-none"
                            style={{
                              opacity: isCurrent ? 1 : 0,
                              transform: `translateX(-50%) translateY(${isCurrent ? '0px' : '20px'})`,
                              boxShadow: '0 0 20px rgba(0,0,0,0.95)',
                            }}
                          >
                            <div className="absolute inset-0 vinyl-grooves opacity-70" />
                            <div className="absolute inset-[30%] rounded-full bg-black border border-white/20 flex items-center justify-center">
                              <span className="text-[7px] font-mono text-white/80">
                                {album.rpm.split(' ')[0]}
                              </span>
                            </div>
                          </div>

                          {/* Cardboard Jacket Sleeve */}
                          <div
                            className="relative z-10 w-full h-full rounded-[3px] overflow-hidden bg-[#0D0D10] transition-all duration-300"
                            style={{
                              border: isCurrent ? '1.5px solid #363642' : '1px solid #1E1E24',
                              boxShadow: isCurrent
                                ? '0 20px 40px rgba(0,0,0,0.95)'
                                : '-4px 8px 16px rgba(0,0,0,0.85)',
                            }}
                          >
                            <img
                              src={album.coverUrl}
                              alt={album.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-y-0 left-0 w-3 bg-black/40 border-r border-white/10" />

                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-2.5">
                              <p className="text-[11px] font-bold text-white truncate">
                                {album.title}
                              </p>
                              <p className="text-[9.5px] text-[#BBCBB2] truncate opacity-75">
                                {album.artist}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full flex items-center justify-between mt-3 px-1 text-[11px] text-white/40 font-mono">
                  <span>← 拨动实体翻阅箱</span>
                  <button
                    type="button"
                    onClick={() => onOpenAlbumDetail(activeAlbum)}
                    className="text-white/60 hover:text-white flex items-center gap-0.5"
                  >
                    <span>查看完整母盘档案</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW MODE 2: DISPLAY WALL (黑胶陈列墙 - 画廊模式)                          */}
            {/* ========================================================================= */}
            {viewMode === 'wall' && (
              <div className="grid grid-cols-2 gap-3.5 animate-in fade-in duration-200">
                {processedAlbums.map((album) => (
                  <div
                    key={album.id}
                    id={`wall-album-${album.id}`}
                    onClick={() => onOpenAlbumDetail(album)}
                    className="group p-2.5 rounded-[6px] bg-[#0E0E12] border border-[#1E1E24] hover:border-[#2D2D36] cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="relative w-full aspect-square rounded-[3px] overflow-hidden bg-black mb-2.5">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[2px] bg-black/85 text-[8.5px] font-mono text-white/80 border border-white/10">
                        {album.rpm.split(' ')[0]}
                      </span>

                      {/* Quick Play needle-drop */}
                      {onPlayAlbum && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayAlbum(album);
                            audioEngine.triggerHaptic('medium');
                          }}
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#18181E] border border-[#2B2B36] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105"
                          title="播放此黑胶"
                        >
                          <Play className="w-3.5 h-3.5 fill-[#2FE92B] text-[#2FE92B] ml-0.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <h3 className="text-[13px] font-bold text-white truncate leading-tight">
                        {album.title}
                      </h3>
                      <p className="text-[11px] text-[#BBCBB2] truncate opacity-75 mt-0.5">
                        {album.artist}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#18181E] text-[10px] text-white/40 font-mono">
                        <span>{album.year}</span>
                        <span>{album.weight?.split(' ')[0] || '180g'}</span>
                        <span>{album.matrixCode}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW MODE 3: ARCHIVE CATALOG (馆藏名录 - 档案册清单)                       */}
            {/* ========================================================================= */}
            {viewMode === 'archive' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="px-3 py-1.5 rounded-[4px] bg-[#111114] border border-[#1E1E24] flex items-center justify-between text-[10.5px] font-mono text-white/40">
                  <span className="w-10">封面</span>
                  <span className="flex-1 px-3">专辑 / 艺术家</span>
                  <span className="w-24 text-center hidden sm:inline-block">厂牌 / 矩阵码</span>
                  <span className="w-16 text-center">规格</span>
                  <span className="w-10 text-right">播放</span>
                </div>

                {processedAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onOpenAlbumDetail(album)}
                    className="p-2.5 rounded-[5px] bg-[#0E0E12] border border-[#1E1E24] hover:border-[#2D2D36] cursor-pointer transition-colors flex items-center justify-between gap-2"
                  >
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-10 h-10 rounded-[3px] object-cover flex-shrink-0 border border-[#1E1E24]"
                    />

                    <div className="flex-1 px-3 overflow-hidden">
                      <h4 className="text-[13px] font-bold text-white truncate">
                        {album.title}
                      </h4>
                      <p className="text-[11px] text-[#BBCBB2] truncate opacity-75">
                        {album.artist} · {album.year}
                      </p>
                    </div>

                    <div className="w-24 text-center hidden sm:inline-block overflow-hidden">
                      <p className="text-[11px] text-white/70 font-mono truncate">{album.label}</p>
                      <p className="text-[9.5px] text-white/40 font-mono truncate">{album.matrixCode}</p>
                    </div>

                    <div className="w-16 text-center">
                      <span className="text-[10.5px] font-mono text-white/70 block">
                        {album.rpm.split(' ')[0]}
                      </span>
                    </div>

                    <div className="w-10 flex items-center justify-end">
                      {onPlayAlbum && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayAlbum(album);
                            audioEngine.triggerHaptic('light');
                          }}
                          className="w-7 h-7 rounded-[4px] bg-[#141418] hover:bg-[#1C1C22] border border-[#222228] text-white/70 flex items-center justify-center transition-colors"
                          title="播放"
                        >
                          <Play className="w-3.5 h-3.5 fill-[#2FE92B] text-[#2FE92B] ml-0.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Vinyl Modal (Seamlessly handles manual, barcode & JSON imports) */}
      <ImportVinylModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onAddAlbum={handleAddAlbumWrapper}
        onImportMultiple={handleImportMultipleWrapper}
        currentAlbums={albums}
      />
    </div>
  );
};
