import React, { useState } from 'react';
import { Disc3 } from 'lucide-react';

/** Keep a readable sleeve when remote artwork is slow or unavailable. */
export function AlbumArtwork({ src, alt = '', loading = 'lazy' }: { src: string; alt?: string; loading?: 'lazy' | 'eager' }) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;
  return <div className="album-artwork">
    {loadedSrc !== src && <span className="album-artwork__placeholder" aria-hidden="true"><Disc3 /><small>{failed ? '封面暂不可用' : '封面加载中'}</small></span>}
    {!failed && <img src={src} alt={alt} loading={loading} draggable={false} referrerPolicy="no-referrer" onLoad={() => setLoadedSrc(src)} onError={() => setFailedSrc(src)} />}
  </div>;
}
