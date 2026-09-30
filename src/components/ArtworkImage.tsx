import React, { useState } from 'react';
import { useArtwork } from '../hooks/useArtwork';
import { useArtworkVisibility } from '../hooks/useArtworkVisibility';

export function ArtworkImage({ src = '', loading = 'eager', onError, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { ref, visible } = useArtworkVisibility<HTMLImageElement>(loading !== 'lazy');
  const artwork = useArtwork(src, visible);
  const [failedUrl, setFailedUrl] = useState<string>();
  const placeholder = '/assets/cover-placeholder.svg';
  const resolved = artwork.url || placeholder;
  return <img {...props} ref={ref} loading={loading} decoding="async" src={failedUrl === resolved ? placeholder : resolved} referrerPolicy="no-referrer" onError={event => {
    if (resolved !== placeholder && failedUrl !== resolved) setFailedUrl(resolved);
    onError?.(event);
  }} />;
}
