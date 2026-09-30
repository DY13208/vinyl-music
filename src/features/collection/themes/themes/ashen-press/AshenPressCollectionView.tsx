import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CollectionPresentationProps } from '../../CollectionTheme';
import { createAshenPressCollectionDocument } from './createAshenPressCollectionDocument';
import './ashenPressCollectionView.css';

const ALBUMS_PER_PAGE = 10;

type AshenPressMessage = {
  type?: string;
  action?: 'open-album';
  albumId?: string;
};

export function AshenPressCollectionView({
  albums,
  selectedAlbumId,
  onOpenAlbumDetail,
}: CollectionPresentationProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [ready, setReady] = useState(false);
  const [hostVisible, setHostVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(() => (
    typeof document === 'undefined' || !document.hidden
  ));
  const totalPages = Math.max(1, Math.ceil(albums.length / ALBUMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageAlbums = useMemo(
    () => albums.slice(safePage * ALBUMS_PER_PAGE, (safePage + 1) * ALBUMS_PER_PAGE),
    [albums, safePage],
  );
  const source = useMemo(() => createAshenPressCollectionDocument({
    albums: pageAlbums,
    page: safePage,
    totalPages,
  }), [pageAlbums, safePage, totalPages]);

  useEffect(() => {
    setPage(current => Math.min(current, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    if (!selectedAlbumId) return;
    const index = albums.findIndex(album => album.id === selectedAlbumId);
    if (index >= 0) setPage(Math.floor(index / ALBUMS_PER_PAGE));
  }, [albums, selectedAlbumId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      setHostVisible(entry?.isIntersecting ?? true);
    }, { rootMargin: '80px' });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const receive = (event: MessageEvent<AshenPressMessage>) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type !== 'vinyl-collection-ashen-press' || event.data.action !== 'open-album') return;
      const album = albums.find(item => item.id === event.data.albumId);
      if (album) onOpenAlbumDetail(album);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [albums, onOpenAlbumDetail]);

  useEffect(() => {
    setReady(false);
    const fallback = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(fallback);
  }, [safePage]);

  const mounted = hostVisible && documentVisible;
  const changePage = (nextPage: number) => {
    setPage(Math.max(0, Math.min(totalPages - 1, nextPage)));
  };

  return (
    <div ref={hostRef} className="ct-ashen-press" data-state={ready ? 'ready' : 'loading'}>
      {!ready && <div className="ct-ashen-press__loading" role="status">正在摆放唱片册…</div>}
      {mounted && (
        <iframe
          key={safePage}
          ref={frameRef}
          className="ct-ashen-press__frame"
          title={`立体唱片架，第 ${safePage + 1} 页`}
          srcDoc={source}
          sandbox="allow-scripts"
          loading="eager"
          onLoad={() => setReady(true)}
        />
      )}
      {totalPages > 1 && (
        <nav className="ct-ashen-press__pagination" aria-label="立体唱片架分页">
          <button type="button" onClick={() => changePage(safePage - 1)} disabled={safePage === 0} aria-label="上一页">
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>{safePage + 1} / {totalPages}</span>
          <button type="button" onClick={() => changePage(safePage + 1)} disabled={safePage === totalPages - 1} aria-label="下一页">
            <ChevronRight aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
