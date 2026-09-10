import React, { useEffect } from 'react';
import { BrowseState } from '../../hooks/useAlbumBrowserState';
import { useBrowseLayout } from '../../hooks/useBrowseLayout';
import { AlbumLayoutProps } from './types';
import { BrowseModeSwitch } from './BrowseModeSwitch';
import { GalleryGrid } from './GalleryGrid';
import { SpineCarousel } from './SpineCarousel';
import { AlbumSelectionBar } from './AlbumSelectionBar';
import './browse.css';

interface Props extends Omit<AlbumLayoutProps, 'selectedAlbumId' | 'onSelectAlbum'> {
  browse: BrowseState;
  portrait: React.ReactNode;
  empty?: React.ReactNode;
  toolbar?: React.ReactNode;
  defaultLayout?: React.ReactNode;
  galleryLayout?: React.ReactNode;
  showToolbar?: boolean;
  showSelection?: boolean;
}

export function AlbumBrowser({ albums, browse, portrait, empty, toolbar, defaultLayout, galleryLayout, showToolbar = true, showSelection = true, renderArtwork, onOpenAlbumDetail }: Props) {
  const landscape = useBrowseLayout();
  const selectedAlbumId = albums.some(album => album.id === browse.selectedAlbumId) ? browse.selectedAlbumId : albums[0]?.id ?? null;
  useEffect(() => {
    if (selectedAlbumId && selectedAlbumId !== browse.selectedAlbumId) browse.selectAlbum(selectedAlbumId);
  }, [selectedAlbumId, browse.selectedAlbumId, browse.selectAlbum]);

  if (!landscape) return <>{portrait}</>;
  const props: AlbumLayoutProps = { albums, selectedAlbumId, onSelectAlbum: browse.selectAlbum, onOpenAlbumDetail, renderArtwork };
  return <section className={`album-browser ${showToolbar ? '' : 'album-browser--compact'}`} aria-label="横屏唱片浏览">
    {showToolbar && <div className="browse-toolbar"><BrowseModeSwitch mode={browse.mode} onChange={browse.setMode} allowDefault={defaultLayout !== undefined} /><div className="browse-toolbar__extra">{toolbar}<span className="browse-total">{albums.length} 张收藏</span></div></div>}
    {albums.length ? <><div className="browse-layout" key={browse.mode}>{browse.mode === 'default' && defaultLayout ? defaultLayout : browse.mode === 'grid' ? galleryLayout || <GalleryGrid {...props} /> : <SpineCarousel {...props} />}</div>{showSelection && browse.mode !== 'default' && <AlbumSelectionBar {...props} />}</> : <div className="browse-empty">{empty || '暂无唱片'}</div>}
    {browse.message && <p className="browse-message" role="status">{browse.message}</p>}
  </section>;
}
