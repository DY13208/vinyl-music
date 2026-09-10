import type { HapticsService, HapticStyle } from './HapticsService';

export class WebHapticsAdapter implements HapticsService {
  public constructor(private readonly playFallbackSound?: (style: HapticStyle) => void) {}

  public triggerHaptic(style: HapticStyle = 'light'): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? [18, 12, 18] : [25, 20, 35]);
      } catch {}
    }
    this.playFallbackSound?.(style);
  }
}
