import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { StorageService } from '../../platform/storage/StorageService';
import type { MusicProvider } from '../providers/MusicProvider';
import { MusicProviderRegistry } from '../providers/MusicProviderRegistry';
import type { MusicTrack, TrackSource } from '../types';
import { MusicSourceRepository } from './MusicSourceRepository';
import { PlaybackResolver } from './PlaybackResolver';

class MemoryStorage implements StorageService {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const track: MusicTrack = { id: 't1', title: '晴天', artist: '周杰伦', album: '叶惠美', duration: 269 };
const source = (provider: TrackSource['provider'], providerTrackId: string, metadata: TrackSource['metadata'], previewOnly = false): TrackSource => ({ provider, providerTrackId, uri: `https://example.com/${providerTrackId}`, previewOnly, verified: false, matchScore: 0, metadata, createdAt: '2026-09-10T00:00:00.000Z' });
const provider = (id: MusicProvider['id'], sources: TrackSource[]): MusicProvider => ({ id, searchTrack: async () => sources, getTrack: async () => null, resolvePlaybackSource: async item => item });

test('resolver chooses the highest-priority reliable full source across providers', async () => {
  const repository = new MusicSourceRepository(new MemoryStorage());
  const apple = source('apple-music', 'apple', { title: '晴天', artist: '周杰伦', album: '叶惠美', duration: 269 }, true);
  const audius = source('audius', 'audius', { title: '晴天', artist: '周杰伦', album: '叶惠美', duration: 269 });
  const resolver = new PlaybackResolver(new MusicProviderRegistry([provider('apple-music', [apple]), provider('audius', [audius])]), repository);
  const result = await resolver.resolve(track);
  assert.equal(result.status, 'MATCHED');
  assert.equal(result.source?.provider, 'audius');
});

test('resolver never auto-plays a low-confidence same-title wrong artist', async () => {
  const repository = new MusicSourceRepository(new MemoryStorage());
  const wrong = source('apple-music', 'wrong', { title: '晴天', artist: '其他歌手', album: '叶惠美', duration: 269 }, true);
  const resolver = new PlaybackResolver(new MusicProviderRegistry([provider('apple-music', [wrong])]), repository);
  assert.equal((await resolver.resolve(track)).status, 'NO_RELIABLE_SOURCE');
});

test('rejected source is persisted and cannot auto-bind again', async () => {
  const repository = new MusicSourceRepository(new MemoryStorage());
  const candidate = source('apple-music', 'rejected', { title: '晴天', artist: '周杰伦', album: '叶惠美', duration: 269 }, true);
  const resolver = new PlaybackResolver(new MusicProviderRegistry([provider('apple-music', [candidate])]), repository);
  resolver.rejectSource(track.id, candidate);
  assert.equal((await resolver.resolve(track)).status, 'SOURCE_REJECTED');
});
