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
const versionTerms = (value: string) => {
  const found = VERSION_TERMS.filter(term => normalize(value).includes(normalize(term)));
  if (/\blive\b|\bconcert\b|演唱[会會]|現場|现场/i.test(value)) found.push('live');
  return [...new Set(found.map(term => ['现场', '現場'].includes(term) ? 'live' : term))];
};
// A live suffix is redundant when the album already identifies a live recording.
// Version checks below still reject studio/live substitutions in both directions.
const titleIdentity = (value = '') => normalize(value.replace(/[（(]\s*live\s*[）)]/gi, ''));
const albumIdentity = (value = '') => normalize(value.replace(/\blive\s+in\s+concert\b/gi, '')).replace(/\s/g, '');
const sameAlbum = (left?: string, right?: string) => !!left && !!right && albumIdentity(left) === albumIdentity(right);
const ARTIST_ALIASES: Record<string, string> = {
  '周杰伦': 'jaychou', 'jaychou': 'jaychou', 'jay chou': 'jaychou',
  '张学友': 'jackycheung', 'jackycheung': 'jackycheung', 'jacky cheung': 'jackycheung',
  '周杰倫': 'jaychou', '張學友': 'jackycheung',
};
const sameArtistIdentity = (left?: string, right?: string) => {
  if (same(left, right)) return true;
  const a = ARTIST_ALIASES[normalize(left ?? '')];
  const b = ARTIST_ALIASES[normalize(right ?? '')];
  return !!a && a === b;
};

export class TrackMatcher {
  public score(track: MusicTrack, candidate: Partial<MusicTrack>): MatchResult {
    let score = 0;
    const reasons: string[] = [];
    if (track.isrc && candidate.isrc && normalize(track.isrc) === normalize(candidate.isrc)) {
      score += 100; reasons.push('isrc');
    }
    const titleOverlap = overlap(titleIdentity(track.title), titleIdentity(candidate.title));
    if (same(titleIdentity(track.title), titleIdentity(candidate.title))) { score += 30; reasons.push('title'); }
    else if (titleOverlap >= .8) { score += 22; reasons.push('title-close'); }
    const artistOverlap = overlap(track.artist, candidate.artist);
    if (sameArtistIdentity(track.artist, candidate.artist)) { score += 30; reasons.push('artist'); }
    else if (artistOverlap >= .8) { score += 22; reasons.push('artist-close'); }
    if (sameAlbum(track.album, candidate.album)) { score += 15; reasons.push('album'); }
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
    if (targetVersions.has('live') && !candidateVersions.includes('live')) wrongVersions.push('studio-for-live');
    if (wrongVersions.length) { score -= 40; reasons.push(`wrong-version:${wrongVersions.join(',')}`); }
    if (titleOverlap < .5) { score -= 30; reasons.push('title-mismatch'); }
    if (artistOverlap < .5 && !sameArtistIdentity(track.artist, candidate.artist)) { score -= 35; reasons.push('artist-mismatch'); }
    return { score, reliable: score >= 70, possible: score >= 50 && score < 70, reasons };
  }

  public scoreSource(track: MusicTrack, source: TrackSource): TrackSource {
    if (source.verificationMethod === 'user') return { ...source, verified: true, matchScore: Math.max(100, source.matchScore) };
    const match = this.score(track, source.metadata);
    return { ...source, verified: match.reliable, verificationMethod: match.reliable ? (match.reasons.includes('isrc') ? 'isrc' : 'automatic') : undefined, matchScore: match.score };
  }
}

export const trackMatcher = new TrackMatcher();
