import React from 'react';
import { useArtwork } from '../hooks/useArtwork';

export function ArtworkImage({ src = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const artwork = useArtwork(src);
  return artwork.url ? <img {...props} src={artwork.url} referrerPolicy="no-referrer" /> : null;
}
