import { trackMatcher } from '../matching/TrackMatcher';
import type { MusicProviderRegistry } from '../providers/MusicProviderRegistry';
import type { MusicSourceRepository } from './MusicSourceRepository';
import type { MusicTrack, SourceResolution, TrackSource } from '../types';

const rank = (source: TrackSource, preferred?: string) => {
  const identity = `${source.provider}:${source.providerTrackId}`;
  if (identity === preferred) return 10000;
  if (source.provider === 'local' && source.verificationMethod === 'user') return 9000;
  if (source.verified && !source.previewOnly) return 5000 + source.matchScore;
  if (source.verified) return 3000 + source.matchScore;
  return source.matchScore;
};

export class PlaybackResolver {
  public constructor(private readonly registry: MusicProviderRegistry, private readonly repository: MusicSourceRepository) {}

  public async resolve(track: MusicTrack): Promise<SourceResolution> {
    const raw = await this.registry.search(track);
    const candidates = raw
      .filter(source => !source.rejected && !this.repository.isRejected(track.id, source))
      .map(source => trackMatcher.scoreSource(track, source))
      .sort((a, b) => rank(b, this.repository.getPreferredIdentity(track.id)) - rank(a, this.repository.getPreferredIdentity(track.id)));
    const reliable = candidates.find(source => source.verificationMethod === 'user' || source.matchScore >= 70);
    if (!raw.length) return { status: 'NO_SOURCE', candidates };
    if (!candidates.length) return { status: 'SOURCE_REJECTED', candidates };
    if (!reliable) return { status: candidates.some(source => source.matchScore >= 50) ? 'POSSIBLE_MATCH' : 'NO_RELIABLE_SOURCE', candidates };
    const provider = this.registry.get(reliable.provider);
    const resolved = provider ? await provider.resolvePlaybackSource(reliable) : null;
    return resolved ? { status: 'MATCHED', source: resolved, candidates } : { status: reliable.provider === 'local' ? 'LOCAL_SOURCE_MISSING' : 'SOURCE_UNAVAILABLE', candidates };
  }

  public rejectSource(trackId: string, source: TrackSource): void { this.repository.reject(trackId, source); }
}
