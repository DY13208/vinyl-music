import { ArtworkImage } from '../components/ArtworkImage';
import React, { useMemo, useState } from 'react';
import { WishlistItem, Album } from '../types';
import { ArrowLeft, Bookmark, Heart, ShoppingBag, Plus, Sparkles, Disc3, Search, ChevronDown, X } from 'lucide-react';
import { hapticsService } from '../platform/platformService';
import { VinylDisc } from '../components/VinylDisc';
import { getVinylAppearance } from '../utils/vinylAppearance';
import './WishlistDesktop.css';

// Desktop-only (>=1100px + fine pointer) presentation helpers: client-side search / sort over existing fields.
// Nothing is persisted; the mobile list below is rendered exactly as before.
type WishlistSort = 'added-desc' | 'added-asc' | 'title' | 'artist' | 'year-desc' | 'year-asc';
const SORT_OPTIONS: { id: WishlistSort; label: string }[] = [
  { id: 'added-desc', label: '最近加入' },
  { id: 'added-asc', label: '最早加入' },
  { id: 'title', label: '专辑名' },
  { id: 'artist', label: '艺术家' },
  { id: 'year-desc', label: '年份（新→旧）' },
  { id: 'year-asc', label: '年份（旧→新）' },
];
const collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' });
const pressingOf = (item: WishlistItem) => item.pressing || item.album.edition || '';
// addedDate is an ISO timestamp for new items (older sample data uses 'YYYY.MM.DD'); NaN when unparseable.
const addedTime = (value: string) => {
  const legacy = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(value || '');
  return legacy ? new Date(Number(legacy[1]), Number(legacy[2]) - 1, Number(legacy[3])).getTime() : Date.parse(value);
};
const formatAddedDate = (value: string) => {
  const time = addedTime(value);
  if (!Number.isFinite(time)) return value || '';
  const date = new Date(time);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

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
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<WishlistSort>('added-desc');
  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    // Array order is the order items were added (App appends), so index is the real "added" order.
    const indexed = wishlist.map((item, index) => ({ item, index }));
    const matches = needle
      ? indexed.filter(({ item }) => [item.album.title, item.album.artist, item.album.label, item.album.genre, pressingOf(item), item.album.year ? String(item.album.year) : '']
        .some(value => value && value.toLowerCase().includes(needle)))
      : indexed;
    const byYear = (a: typeof matches[number], b: typeof matches[number]) => (a.item.album.year || 0) - (b.item.album.year || 0);
    // Real added time when both are parseable; otherwise (and for ties) the array order, which is the add order.
    const byAdded = (a: typeof matches[number], b: typeof matches[number]) => {
      const ta = addedTime(a.item.addedDate), tb = addedTime(b.item.addedDate);
      return (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb ? ta - tb : 0) || a.index - b.index;
    };
    const sorted = [...matches].sort((a, b) => {
      switch (sort) {
        case 'added-asc': return byAdded(a, b);
        case 'title': return collator.compare(a.item.album.title, b.item.album.title) || a.index - b.index;
        case 'artist': return collator.compare(a.item.album.artist, b.item.album.artist) || a.index - b.index;
        case 'year-desc': return byYear(b, a) || b.index - a.index;
        case 'year-asc': return byYear(a, b) || a.index - b.index;
        default: return byAdded(b, a);
      }
    });
    return sorted.map(({ item }) => item);
  }, [wishlist, query, sort]);
  const removeItem = (id: string) => {
    onRemoveWishlist(id);
    hapticsService.triggerHaptic('light');
  };

  return (
    <div
      id="wishlist-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Desktop-only layout (display:none below the desktop media query). */}
      <div className="wishlist-desktop">
        <header className="wishlist-desktop__header">
          <button type="button" className="wishlist-desktop__back" onClick={onBack} aria-label="返回我的页面" title="返回">
            <ArrowLeft aria-hidden="true" />
          </button>
          <span className="wishlist-desktop__mark" aria-hidden="true"><Disc3 /></span>
          <div className="wishlist-desktop__heading">
            <h1>愿望单</h1>
            <p className="wishlist-desktop__lead">收藏心中的下一张黑胶</p>
            <p className="wishlist-desktop__count">
              {wishlist.length > 0 ? <><b>{wishlist.length}</b> 张想要的黑胶唱片</> : '还没有想要的黑胶唱片'}
              {query.trim() && wishlist.length > 0 && <span> · 显示 {visibleItems.length} 张</span>}
            </p>
          </div>
          {wishlist.length > 0 && (
            <div className="wishlist-desktop__tools">
              <label className="wishlist-desktop__search">
                <Search aria-hidden="true" />
                <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索专辑、艺术家、厂牌…" aria-label="搜索愿望单" />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="清除搜索"><X aria-hidden="true" /></button>}
              </label>
              <label className="wishlist-desktop__sort">
                <span>排序</span>
                <select value={sort} onChange={event => setSort(event.target.value as WishlistSort)} aria-label="愿望单排序">
                  {SORT_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
                <ChevronDown aria-hidden="true" />
              </label>
            </div>
          )}
        </header>

        {wishlist.length === 0 ? (
          <div className="wishlist-desktop__empty">
            <span aria-hidden="true"><Bookmark /></span>
            <strong>愿望单还是空的</strong>
            <p>在专辑详情中点击愿望单图标，就能把想要的黑胶放到这里。</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="wishlist-desktop__empty">
            <span aria-hidden="true"><Search /></span>
            <strong>没有找到匹配“{query.trim()}”的唱片</strong>
            <button type="button" onClick={() => setQuery('')}>清除搜索</button>
          </div>
        ) : (
          <ul className="wishlist-desktop__grid" aria-label="愿望单唱片">
            {visibleItems.map(item => {
              const { album } = item;
              const appearance = getVinylAppearance(album);
              const pressing = [album.label, pressingOf(item)].filter(Boolean).join(' · ');
              return (
                <li key={item.id} className="wishlist-desktop__card">
                  <button type="button" className="wishlist-desktop__open" onClick={() => onOpenAlbumDetail(album)} aria-label={`打开专辑：${album.title}`}>
                    <span className="wishlist-desktop__media" aria-hidden="true">
                      <span className="wishlist-desktop__disc">
                        <VinylDisc coverUrl={album.coverUrl} albumTitle={album.title} artistName={album.artist} size="100%" type={appearance.variant} texture={appearance.texture} labelColor={appearance.label?.color} labelImage={appearance.label?.image || album.coverUrl || undefined} showSideLabel={false} />
                      </span>
                      <span className="wishlist-desktop__sleeve">
                        <ArtworkImage src={album.coverUrl} alt="" loading="lazy" draggable={false} />
                      </span>
                    </span>
                    <span className="wishlist-desktop__body">
                      <strong className="wishlist-desktop__title">{album.title}</strong>
                      <span className="wishlist-desktop__artist">{album.artist}{album.year ? <em>{album.year}</em> : null}</span>
                      {pressing && <span className="wishlist-desktop__pressing" title={pressing}>{pressing}</span>}
                      {(album.price != null || item.condition) && (
                        <span className="wishlist-desktop__foot">
                          {album.price != null && <span className="wishlist-desktop__price">目标价<b>¥{item.targetPrice}</b></span>}
                          {item.condition && <span className="wishlist-desktop__chip" title={`品相：${item.condition}`}>{item.condition}</span>}
                        </span>
                      )}
                      {formatAddedDate(item.addedDate) && <span className="wishlist-desktop__added">添加于 {formatAddedDate(item.addedDate)}</span>}
                    </span>
                  </button>
                  <button type="button" className="wishlist-desktop__remove" onClick={() => removeItem(item.id)} aria-label={`移除愿望单：${album.title}`} title="移除愿望单">
                    <Heart aria-hidden="true" />
                    <span>移除</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Header */}
      <header data-wishlist-part="header" className="px-4 pt-3 pb-2 flex items-center justify-between z-20">
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
      <div data-wishlist-part="list" className="px-4 py-3 space-y-3">
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
                  <ArtworkImage
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
                    {item.condition && (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-[2px] bg-[#1B1B1D] text-[#BBCBB2] border border-[#26272D] font-mono">
                        {item.condition}
                      </span>
                    )}
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
                  {formatAddedDate(item.addedDate)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vinyl Market Tip */}
      <div data-wishlist-part="tip" className="px-4 mt-4">
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
