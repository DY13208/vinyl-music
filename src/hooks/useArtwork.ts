import { useEffect, useState } from 'react';
import { artworkService, type ResolvedArtwork } from '../platform/artwork/WebArtworkAdapter';

export function useArtwork(source: string) {
  const [resolved, setResolved] = useState({ source: '', url: '', local: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => artworkService.onOnline(() => setAttempt(value => value + 1)), []);
  useEffect(() => {
    let disposed = false;
    let image: ResolvedArtwork | undefined;
    void artworkService.resolve(source).then(result => {
      if (disposed) { result.release(); return; }
      image = result;
      setResolved({ source, url: result.url, local: result.local });
    });
    return () => { disposed = true; image?.release(); };
  }, [source, attempt]);
  return { url: resolved.source === source ? resolved.url : '', local: resolved.source === source && resolved.local, attempt, retry: () => setAttempt(value => value + 1) };
}
