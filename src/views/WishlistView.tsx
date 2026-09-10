import React from 'react';
import { WishlistItem, Album } from '../types';
import { ArrowLeft, Bookmark, Heart, ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { hapticsService } from '../platform/platformService';

interface WishlistViewProps {
  wishlist: WishlistItem[];
  onBack: () => void;
  onOpenAlbumDetail: (album: Album) => void;
  onRemoveWishlist: (id: string) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlist,
  onBack,
  onOpenAlbumDetail,
  onRemoveWishlist,
}) => {
  return (
    <div
      id="wishlist-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
            title="返回"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[19px] font-bold text-white tracking-tight">愿望单</h1>
            <p className="text-[11px] text-[#BBCBB2] opacity-75">还未拥有的黑胶 ({wishlist.length})</p>
          </div>
        </div>

        <button
          type="button"
          className="w-8 h-8 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center"
          title="添加愿望单"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      {/* Wishlist Items List */}
      <div className="px-4 py-3 space-y-3">
        {wishlist.length === 0 ? (
          <div className="text-center py-16 text-white/40 text-[13px]">
            暂无心愿唱片，在专辑详情中点击愿望单图标添加
          </div>
        ) : (
          wishlist.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenAlbumDetail(item.album)}
              className="p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="relative w-16 h-16 rounded-[4px] overflow-hidden bg-black flex-shrink-0">
                  <img
                    src={item.album.coverUrl}
                    alt={item.album.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                  />
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded-[2px] bg-black/80 text-[7.5px] font-mono text-white/80">
                    {item.album.year}
                  </span>
                </div>

                <div className="overflow-hidden space-y-0.5">
                  <h3 className="text-[14px] font-bold text-white truncate leading-tight">
                    {item.album.title}
                  </h3>
                  <p className="text-[11.5px] text-[#BBCBB2] truncate opacity-80">
                    {item.album.artist}
                  </p>
                  <p className="text-[10px] text-white/50 truncate font-mono">
                    {item.pressing || item.album.edition}
                  </p>

                  {/* Target Price in strictly controlled #FF9821 Accent */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[13px] font-bold text-[#FF9821] font-mono">
                      ¥{item.targetPrice || item.album.price || 320}
                    </span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-[2px] bg-[#1B1B1D] text-[#BBCBB2] border border-[#26272D] font-mono">
                      {item.condition}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div
                className="flex flex-col items-end justify-between pl-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onRemoveWishlist(item.id);
                    hapticsService.triggerHaptic('light');
                  }}
                  className="p-1 text-white/40 hover:text-white transition-colors"
                  title="移除"
                >
                  <Heart className="w-4 h-4 fill-[#2FE92B] text-[#2FE92B]" />
                </button>
                <span className="text-[9px] text-white/30 font-mono mt-4">
                  {item.addedDate}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vinyl Market Tip */}
      <div className="px-4 mt-4">
        <div className="p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#FF9821] flex-shrink-0" />
          <p className="text-[11px] text-white/60 leading-relaxed">
            黑胶价格根据盘片品相 (Mint / NM / VG+) 及压盘版次浮动，支持到货实体店盘点提醒。
          </p>
        </div>
      </div>
    </div>
  );
};
