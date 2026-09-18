import React, { useEffect, useState } from 'react';
import { Disc3 } from 'lucide-react';
import { useArtwork } from '../hooks/useArtwork';

/** Keep a readable sleeve when remote artwork is slow or unavailable. */
export function AlbumArtwork({ src, alt = '', loading = 'lazy' }: { src: string; alt?: string; loading?: 'lazy' | 'eager' }) {
  const artwork = useArtwork(src);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  useEffect(() => { setFailedSrc(null); }, [src, artwork.attempt]);
  const failed = !src || (!!artwork.url && failedSrc === artwork.url);
  return <div className="album-artwork">
    {(!artwork.url || loadedSrc !== artwork.url) && <span className="album-artwork__placeholder" aria-hidden="true"><Disc3 /><small>{failed ? '封面暂不可用' : '封面加载中'}</small></span>}
    {!failed && artwork.url && <img src={artwork.url} alt={alt} loading={loading} draggable={false} referrerPolicy="no-referrer" onLoad={() => setLoadedSrc(artwork.url)} onError={() => setFailedSrc(artwork.url)} />}
  </div>;
}
