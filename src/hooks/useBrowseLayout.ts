import { useSyncExternalStore } from 'react';
import { platformService } from '../platform/platformService';

export function useBrowseLayout() {
  return useSyncExternalStore(platformService.viewport.subscribe, platformService.viewport.isLandscape, () => false);
}
