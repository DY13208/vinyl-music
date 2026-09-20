import { localAudioStore } from '../platform/files';
import { storageService } from '../platform/platformService';
import { MusicSourceRepository } from './playback/MusicSourceRepository';
import { PlaybackResolver } from './playback/PlaybackResolver';
import { AppleMusicProvider } from './providers/AppleMusicProvider';
import { AudiusProvider } from './providers/AudiusProvider';
import { LocalMusicProvider } from './providers/LocalMusicProvider';
import { MusicProviderRegistry } from './providers/MusicProviderRegistry';

export const musicSourceRepository = new MusicSourceRepository(storageService);
export const localMusicProvider = new LocalMusicProvider(musicSourceRepository, localAudioStore);
export const musicProviderRegistry = new MusicProviderRegistry([
  localMusicProvider,
  new AppleMusicProvider(),
  new AudiusProvider(),
]);
export const playbackResolver = new PlaybackResolver(musicProviderRegistry, musicSourceRepository);

export type { MusicTrack, SourceResolution, SourceStatus, TrackSource } from './types';
