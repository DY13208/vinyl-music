import { WebAudioEngine } from './audio/WebAudioEngine';
import { WebHapticsAdapter } from './haptics/WebHapticsAdapter';
import { WebStorageAdapter } from './storage/WebStorageAdapter';

const audio = new WebAudioEngine();

/** Single composition root for platform-specific capabilities. */
export const platformService = {
  isWeb: () => true,
  isNative: () => false,
  isIOS: () => false,
  isAndroid: () => false,
  audio,
  storage: new WebStorageAdapter(),
  haptics: new WebHapticsAdapter((style) => audio.playHapticSound(style)),
} as const;

export const storageService = platformService.storage;
export const hapticsService = platformService.haptics;
