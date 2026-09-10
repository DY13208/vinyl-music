import type { MusicTrack, TrackSource } from '../types';

const VERSION_TERMS = [
  'live', 'remix', 'cover', 'instrumental', 'karaoke', 'acoustic', 'demo', 'remaster',
  'remastered', 'edit', 'radio edit', 'sped up', 'slowed', '现场', '翻唱', '伴奏', '重制',
  '混音', '加速', '慢速',
];

export interface MatchResult { score: number; reliable: boolean; possible: boolean; reasons: string[]; }

const normalize = (value = '') => value.toLocaleLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const tokens = (value = '') => new Set(normalize(value).split(' ').filter(Boolean));
const same = (left?: string, right?: string) => !!left && !!right && normalize(left) === normalize(right);
const overlap = (left?: string, right?: string) => {
  const a = tokens(left); const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const common = [...a].filter(item => b.has(item)).length;
  return common / Math.max(a.size, b.size);
};
const versionTerms = (value: string) => VERSION_TERMS.filter(term => normalize(value).includes(normalize(term)));

export class TrackMatcher {
  public score(track: MusicTrack, candidate: Partial<MusicTrack>): MatchResult {
    let score = 0;
    const reasons: string[] = [];
    if (track.isrc && candidate.isrc && normalize(track.isrc) === normalize(candidate.isrc)) {
      score += 100; reasons.push('isrc');
    }
    const titleOverlap = overlap(track.title, candidate.title);
    if (same(track.title, candidate.title)) { score += 30; reasons.push('title'); }
    else if (titleOverlap >= .8) { score += 22; reasons.push('title-close'); }
    const artistOverlap = overlap(track.artist, candidate.artist);
    if (same(track.artist, candidate.artist)) { score += 30; reasons.push('artist'); }
    else if (artistOverlap >= .8) { score += 22; reasons.push('artist-close'); }
    if (same(track.album, candidate.album)) { score += 15; reasons.push('album'); }
    else if (overlap(track.album, candidate.album) >= .8) { score += 10; reasons.push('album-close'); }
    if (track.duration && candidate.duration) {
      const delta = Math.abs(track.duration - candidate.duration);
      if (delta <= 3) { score += 15; reasons.push('duration-3'); }
      else if (delta <= 8) { score += 8; reasons.push('duration-8'); }
      else if (delta >= 20) { score -= 15; reasons.push('duration-mismatch'); }
    }
    if (track.trackNumber && candidate.trackNumber && track.trackNumber === candidate.trackNumber) {
      score += 5; reasons.push('track-number');
    }
    const targetVersions = new Set(versionTerms(`${track.title} ${track.album}`));
    const candidateVersions = versionTerms(`${candidate.title ?? ''} ${candidate.album ?? ''}`);
    const wrongVersions = candidateVersions.filter(term => !targetVersions.has(term));
    if (wrongVersions.length) { score -= 40; reasons.push(`wrong-version:${wrongVersions.join(',')}`); }
    if (titleOverlap < .5) { score -= 30; reasons.push('title-mismatch'); }
    if (artistOverlap < .5) { score -= 35; reasons.push('artist-mismatch'); }
    return { score, reliable: score >= 70, possible: score >= 50 && score < 70, reasons };
  }

  public scoreSource(track: MusicTrack, source: TrackSource): TrackSource {
    if (source.verificationMethod === 'user') return { ...source, verified: true, matchScore: Math.max(100, source.matchScore) };
    const match = this.score(track, source.metadata);
    return { ...source, verified: match.reliable, verificationMethod: match.reliable ? (match.reasons.includes('isrc') ? 'isrc' : 'automatic') : undefined, matchScore: match.score };
  }
}

export const trackMatcher = new TrackMatcher();
