import { platformService } from '../platform/platformService';

/** Application-facing engine; concrete browser media objects stay in the Web adapter. */
export const audioEngine = platformService.audio;

export type { AudioEngine, AudioLoadEvents, AudioSource } from '../platform/audio/AudioEngine';
