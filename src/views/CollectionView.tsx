import React, { useMemo, useState } from 'react';
import { ArrowDownUp, MoreHorizontal, Plus, Search, X } from 'lucide-react';
import { Album } from '../types';
import { ThreeUIVinylShelf } from '../components/ThreeUIVinylShelf';
import { audioEngine } from '../services/audioEngine';

interface CollectionViewProps {
  albums: Album[];
  onOpenAlbumDetail: (album: Album) => void;
  onAddVinyl: () => void;
}

type Genre = '全部' | '摇滚' | '流行' | '爵士' | '电子' | '古典' | '其他';
type SortOption = 'recent' | 'artist' | 'year';
const genres: Genre[] = ['全部', '摇滚', '流行', '爵士', '电子', '古典', '其他'];

const genreMatches = (album: Album, genre: Genre) => {
  if (genre === '全部') return true;
  if (genre === '其他') return !['摇滚', '流行', '爵士', '电子', '古典'].some((name) => album.genre.includes(name));
  return album.genre.includes(genre);
};

export const CollectionView: React.FC<CollectionViewProps> = ({ albums, onOpenAlbumDetail, onAddVinyl }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [genre, setGenre] = useState<Genre>('全部');
  const [sort, setSort] = useState<SortOption>('recent');
  const [page, setPage] = useState(0);

  const shelfAlbums = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = albums.filter((album) => genreMatches(album, genre) && (!normalizedQuery || album.title.toLocaleLowerCase().includes(normalizedQuery) || album.artist.toLocaleLowerCase().includes(normalizedQuery)));
    if (sort === 'artist') return [...filtered].sort((a, b) => a.artist.localeCompare(b.artist, 'zh-Hans-CN'));
    if (sort === 'year') return [...filtered].sort((a, b) => b.year - a.year);
    return filtered;
  }, [albums, genre, query, sort]);

  const updateCollection = (next: () => void) => {
    next();
    setPage(0);
    audioEngine.triggerHaptic('light');
  };
  const pageCount = Math.max(1, Math.ceil(shelfAlbums.length / 6));
  const safePage = Math.min(page, pageCount - 1);

  return (
    <main id="collection-view" className="collection-room">
      <header className="collection-room__header">
        <div className="collection-room__title"><h1>我的收藏</h1><p>黑胶，是时光的收藏。</p></div>
        <div className="collection-room__actions">
          <button type="button" onClick={() => { setSearchOpen((value) => !value); setSheetOpen(false); }} aria-label={searchOpen ? '关闭搜索' : '搜索收藏'} aria-expanded={searchOpen}>
            {searchOpen ? <X /> : <Search />}
          </button>
          <button type="button" onClick={() => { setSheetOpen(true); setSearchOpen(false); }} aria-label="更多收藏选项" aria-expanded={sheetOpen} className={genre !== '全部' || sort !== 'recent' ? 'is-active' : ''}>
            <MoreHorizontal />
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="collection-room__search">
          <Search aria-hidden="true" />
          <input autoFocus value={query} onChange={(event) => updateCollection(() => setQuery(event.target.value))} placeholder="搜索专辑或艺术家" aria-label="搜索专辑或艺术家" />
          {query && <button type="button" onClick={() => updateCollection(() => setQuery(''))}>清除</button>}
        </div>
      )}

      <nav className="collection-room__filters" aria-label="收藏分类">
        <div className="collection-room__categories">{genres.map((item) => <button key={item} type="button" className={genre === item ? 'is-selected' : ''} onClick={() => updateCollection(() => setGenre(item))}>{item}</button>)}</div>
        <div className="collection-room__toolbar-actions">
          <button type="button" className="collection-room__add" onClick={onAddVinyl} aria-label="新增唱片"><Plus /><span className="collection-room__add-label"><span>新增唱片</span><span>新增</span></span></button>
          <button type="button" className="collection-room__sort" onClick={() => setSheetOpen(true)}><ArrowDownUp /><span>{sort === 'recent' ? '最近收藏' : sort === 'artist' ? '艺术家' : '发行年份'}</span></button>
        </div>
      </nav>

      <section className="collection-room__shelf" aria-label="3D 黑胶收藏柜">
        {shelfAlbums.length ? (
          <>
            <ThreeUIVinylShelf key={`${genre}-${sort}-${query}-${safePage}`} items={shelfAlbums} page={safePage} onPageChange={setPage} onOpenAlbumDetail={onOpenAlbumDetail} />
            {pageCount > 1 && (
              <div className="collection-room__pages" aria-label={`收藏柜第 ${safePage + 1} 层，共 ${pageCount} 层`}>
                {Array.from({ length: pageCount }, (_, index) => <button key={index} type="button" aria-label={`查看第 ${index + 1} 层`} aria-current={safePage === index ? 'true' : undefined} onClick={() => { setPage(index); audioEngine.triggerHaptic('light'); }} />)}
              </div>
            )}
          </>
        ) : (
          <div className="collection-room__empty"><span>没有找到匹配的唱片</span><button type="button" onClick={() => updateCollection(() => { setQuery(''); setGenre('全部'); })}>查看全部收藏</button></div>
        )}
      </section>

      {sheetOpen && (
        <div className="collection-sheet-backdrop" role="presentation" onClick={() => setSheetOpen(false)}>
          <section className="collection-sheet" role="dialog" aria-modal="true" aria-labelledby="collection-filter-title" onClick={(event) => event.stopPropagation()}>
            <div className="collection-sheet__handle" />
            <div className="collection-sheet__heading"><h2 id="collection-filter-title">筛选与排序</h2><button type="button" onClick={() => setSheetOpen(false)} aria-label="关闭"><X /></button></div>
            <fieldset><legend>类型</legend><div className="collection-sheet__options">{genres.map((item) => <button key={item} type="button" className={genre === item ? 'is-selected' : ''} onClick={() => updateCollection(() => setGenre(item))}>{item}</button>)}</div></fieldset>
            <fieldset><legend>排序</legend><div className="collection-sheet__sort">{([['recent', '最近收藏'], ['artist', '艺术家'], ['year', '发行年份']] as const).map(([value, label]) => <button key={value} type="button" className={sort === value ? 'is-selected' : ''} onClick={() => updateCollection(() => setSort(value))}><span>{label}</span><i /></button>)}</div></fieldset>
            <button type="button" className="collection-sheet__done" onClick={() => setSheetOpen(false)}>完成</button>
          </section>
        </div>
      )}
    </main>
  );
};
