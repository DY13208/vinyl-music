import React, { useMemo, useState } from 'react';
import { ArrowDownUp, MoreHorizontal, Plus, Search, X } from 'lucide-react';
import { Album } from '../types';
import { hapticsService } from '../platform/platformService';
import { AlbumBrowser } from '../components/browse/AlbumBrowser';
import { BrowseState } from '../hooks/useAlbumBrowserState';
import { CollectionBrowseState, Genre, genres } from '../hooks/useCollectionBrowseState';
import { CollectionThemeState } from '../features/collection/themes/useCollectionTheme';
import { collectionThemeRegistry } from '../features/collection/themes/collectionThemeRegistry';
import { CollectionDefaultLayout } from '../features/collection/themes/CollectionDefaultLayout';
import { CollectionActionMenu, collectionModes } from '../features/collection/CollectionActionMenu';
import type { CollectionViewMode } from '../features/collection/themes/CollectionTheme';
import { CollectionArtwork } from '../features/collection/themes/CollectionAlbumCard';
import '../features/collection/themes/collectionThemes.css';

interface CollectionViewProps {
  albums: Album[];
  browse: BrowseState;
  filters: CollectionBrowseState;
  themePreference: CollectionThemeState;
  favoriteIds: readonly string[];
  onToggleFavorite: (id: string) => void;
  onOpenAlbumDetail: (album: Album) => void;
  onAddVinyl: () => void;
}


const genreMatches = (album: Album, genre: Genre) => {
  if (genre === '全部') return true;
  if (genre === '其他') return !['摇滚', '流行', '爵士', '电子', '古典'].some((name) => album.genre.includes(name));
  return album.genre.includes(genre);
};

export const CollectionView: React.FC<CollectionViewProps> = ({ albums, browse, filters, themePreference, favoriteIds, onToggleFavorite, onOpenAlbumDetail, onAddVinyl }) => {
  const theme = collectionThemeRegistry[themePreference.themeId];
  const Header = theme.Header;
  const { query, setQuery, genre, setGenre, sort, setSort } = filters;
  const [searchOpen, setSearchOpen] = useState(Boolean(query));
  const [sheetOpen, setSheetOpen] = useState(false);

  const shelfAlbums = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = albums.filter((album) => genreMatches(album, genre) && (!normalizedQuery || album.title.toLocaleLowerCase().includes(normalizedQuery) || album.artist.toLocaleLowerCase().includes(normalizedQuery)));
    if (sort === 'artist') return [...filtered].sort((a, b) => a.artist.localeCompare(b.artist, 'zh-Hans-CN'));
    if (sort === 'year') return [...filtered].sort((a, b) => b.year - a.year);
    return filtered;
  }, [albums, genre, query, sort]);

  const updateCollection = (next: () => void) => {
    next();
    hapticsService.triggerHaptic('light');
  };
  const empty = <div className="collection-room__empty"><span>没有找到匹配的唱片</span><button type="button" onClick={() => updateCollection(() => { setQuery(''); setGenre('全部'); })}>查看全部收藏</button></div>;
  const defaultLayout = <CollectionDefaultLayout theme={theme} albums={shelfAlbums} selectedAlbumId={browse.selectedAlbumId} onSelectAlbum={browse.selectAlbum} favoriteIds={favoriteIds} onOpenAlbumDetail={onOpenAlbumDetail} onToggleFavorite={onToggleFavorite} cardVariant={theme.cardVariant} />;
  const modeMap = { default: 'default', 'gallery-grid': 'grid', 'spine-carousel': 'spine' } as const;
  const viewModeMap = { default: 'default', grid: 'gallery-grid', spine: 'spine-carousel' } as const;
  const collectionBrowser: BrowseState = { ...browse, mode: modeMap[themePreference.viewMode], setMode: mode => themePreference.setViewMode(viewModeMap[mode]), message: themePreference.viewMessage };

  return (
    <main id="collection-view" className="collection-room ct-page" data-view-mode={themePreference.viewMode}>
      <Header>
        <div className="collection-room__title"><h1>我的收藏</h1><p>黑胶，是时光的收藏。</p></div>
        <div className="collection-room__actions">
          <select className="ct-compact-mode" aria-label="收藏浏览模式" value={themePreference.viewMode} onChange={event => themePreference.setViewMode(event.target.value as CollectionViewMode)}>{collectionModes.map(mode => <option key={mode.id} value={mode.id}>{mode.label}</option>)}</select>
          <button type="button" onClick={() => { setSearchOpen((value) => !value); setSheetOpen(false); }} aria-label={searchOpen ? '关闭搜索' : '搜索收藏'} aria-expanded={searchOpen}>
            {searchOpen ? <X /> : <Search />}
          </button>
          <button type="button" onClick={() => { setSheetOpen(true); setSearchOpen(false); }} aria-label="更多收藏选项" aria-expanded={sheetOpen} className={genre !== '全部' || sort !== 'recent' ? 'is-active' : ''}>
            <MoreHorizontal />
          </button>
        </div>
      </Header>

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

      <section className="collection-room__shelf" aria-label="收藏浏览">
        <AlbumBrowser showToolbar={false} galleryLayout={theme.coversOnly ? defaultLayout : undefined} showSelection={!theme.coversOnly || themePreference.viewMode === 'spine-carousel'} albums={shelfAlbums} browse={collectionBrowser} onOpenAlbumDetail={onOpenAlbumDetail} empty={empty} defaultLayout={defaultLayout} portrait={shelfAlbums.length ? defaultLayout : empty} renderArtwork={album => <CollectionArtwork album={album} variant={theme.cardVariant} />} />
      </section>

      <CollectionActionMenu open={sheetOpen} onClose={() => setSheetOpen(false)} filters={filters} preference={themePreference} onAddVinyl={onAddVinyl}/>
    </main>
  );
};
