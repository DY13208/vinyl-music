import { AppleMusicProvider } from '../src/music/providers/AppleMusicProvider';
import { AudiusProvider } from '../src/music/providers/AudiusProvider';
import { MusicProviderRegistry } from '../src/music/providers/MusicProviderRegistry';
import { PlaybackResolver } from '../src/music/playback/PlaybackResolver';
import { MusicSourceRepository } from '../src/music/playback/MusicSourceRepository';
import type { MusicTrack } from '../src/music/types';

const repository = new MusicSourceRepository({ getItem: () => null, setItem: () => {}, removeItem: () => {} });
const resolver = new PlaybackResolver(new MusicProviderRegistry([new AppleMusicProvider(), new AudiusProvider()]), repository);
const tracks: MusicTrack[] = [
  { id: 'concert-1999', title: '釋放自己', artist: 'Jacky Cheung', album: '友個人．演唱會 Live In Concert 1999', duration: 180 },
  { id: 'abbey-road', title: 'Come Together', artist: 'The Beatles', album: 'Abbey Road', duration: 260 },
];
for (const track of tracks) {
  const start = Date.now();
  const result = await resolver.resolve(track);
  const source = result.source;
  let audio;
  if (source) {
    const response = await fetch(source.uri, { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(10000) });
    audio = { status: response.status, type: response.headers.get('content-type'), bytes: (await response.arrayBuffer()).byteLength };
  }
  console.log(JSON.stringify({ track, status: result.status, candidates: result.candidates.length, source: source && { provider: source.provider, id: source.providerTrackId, previewOnly: source.previewOnly, score: source.matchScore, metadata: source.metadata }, audio, elapsedMs: Date.now() - start }, null, 2));
  if (!source || !audio || audio.status >= 400) process.exitCode = 1;
}
