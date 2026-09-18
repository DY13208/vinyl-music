import { useEffect, useRef, useState } from 'react';
import { platformService } from '../platform/platformService';

export function useArtworkVisibility<T extends Element>(eager: boolean) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(eager);
  useEffect(() => {
    if (visible || eager || !ref.current) return;
    return platformService.viewport.observeArtwork(ref.current, () => setVisible(true));
  }, [eager, visible]);
  return { ref, visible: eager || visible };
}
