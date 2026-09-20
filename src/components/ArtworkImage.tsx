import React from 'react';
import { useArtwork } from '../hooks/useArtwork';
import { useArtworkVisibility } from '../hooks/useArtworkVisibility';

export function ArtworkImage({ src = '', loading = 'eager', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { ref, visible } = useArtworkVisibility<HTMLImageElement>(loading !== 'lazy');
  const artwork = useArtwork(src, visible);
  return <img {...props} ref={ref} loading={loading} decoding="async" src={artwork.url || '/assets/cover-placeholder.svg'} referrerPolicy="no-referrer" />;
}
