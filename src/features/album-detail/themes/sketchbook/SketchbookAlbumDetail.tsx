import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Album, Track } from '../../../../types';
import { getAlbumDiscs } from '../../../../utils/vinylSides';
import { createAlbumSketchbookDocument } from './createAlbumSketchbookDocument';
import './sketchbookAlbumDetail.css';

interface SketchbookAlbumDetailProps {
  album: Album;
  isFavorite: boolean;
  onBack: () => void;
  onPlayAlbum: (album: Album) => void;
  onSelectTrack: (album: Album, track: Track) => void;
  onToggleFavorite: (albumId: string) => void;
  onToggleWishlist?: (album: Album) => void;
}

type SketchbookMessage = {
  type?: string;
  action?: 'back' | 'play-album' | 'play-track' | 'favorite' | 'wishlist' | 'page';
  trackId?: string;
};

export function SketchbookAlbumDetail({
  album,
  isFavorite,
  onBack,
  onPlayAlbum,
  onSelectTrack,
  onToggleFavorite,
  onToggleWishlist,
}: SketchbookAlbumDetailProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const tracks = useMemo(
    () => getAlbumDiscs(album).flatMap(record => record.sides.flatMap(side => side.tracks)),
    [album],
  );
  const wishlistEnabled = Boolean(onToggleWishlist);
  const source = useMemo(() => createAlbumSketchbookDocument({
    album,
    favorite: isFavorite,
    wishlistEnabled,
  }), [album, isFavorite, wishlistEnabled]);

  useEffect(() => {
    const receive = (event: MessageEvent<SketchbookMessage>) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== 'vinyl-album-sketchbook') return;
      if (event.data.action === 'back') onBack();
      else if (event.data.action === 'play-album') onPlayAlbum(album);
      else if (event.data.action === 'favorite') onToggleFavorite(album.id);
      else if (event.data.action === 'wishlist') onToggleWishlist?.(album);
      else if (event.data.action === 'play-track' && event.data.trackId) {
        const track = tracks.find(item => item.id === event.data.trackId);
        if (track) onSelectTrack(album, track);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [album, onBack, onPlayAlbum, onSelectTrack, onToggleFavorite, onToggleWishlist, tracks]);

  return (
    <main id="album-detail-view" className="album-sketchbook-theme" data-state={ready ? 'ready' : 'loading'}>
      {!ready && <div className="album-sketchbook-theme__loading" role="status">正在展开封面手记…</div>}
      <iframe
        ref={frameRef}
        className="album-sketchbook-theme__frame"
        title={`${album.title} 封面手记`}
        srcDoc={source}
        sandbox="allow-scripts"
        scrolling="yes"
        onLoad={() => setReady(true)}
      />
    </main>
  );
}
