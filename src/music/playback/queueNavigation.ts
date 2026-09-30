import type { RepeatMode } from '../../features/player/themes/PlayerTheme';

interface QueueNavigationOptions {
  length: number;
  currentIndex: number;
  direction: 'next' | 'previous';
  shuffle: boolean;
  repeatMode: RepeatMode;
  automatic?: boolean;
  random?: () => number;
}

/** Pure queue navigation shared by transport controls and ended events. */
export function getQueueIndex({
  length,
  currentIndex,
  direction,
  shuffle,
  repeatMode,
  automatic = false,
  random = Math.random,
}: QueueNavigationOptions): number {
  if (length <= 0) return -1;
  const safeIndex = currentIndex >= 0 && currentIndex < length ? currentIndex : 0;
  if (automatic && repeatMode === 'one') return safeIndex;
  if (shuffle && length > 1) {
    const candidate = Math.min(length - 2, Math.floor(random() * (length - 1)));
    return candidate >= safeIndex ? candidate + 1 : candidate;
  }
  const next = safeIndex + (direction === 'next' ? 1 : -1);
  if (next >= 0 && next < length) return next;
  if (repeatMode === 'all') return direction === 'next' ? 0 : length - 1;
  return -1;
}
