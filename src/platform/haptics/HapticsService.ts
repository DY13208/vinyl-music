export type HapticStyle = 'light' | 'medium' | 'heavy';

export interface HapticsService {
  triggerHaptic(style?: HapticStyle): void;
}
