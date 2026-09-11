import type { Album, Track, VinylRecord } from '../../types.js';
import type { ProviderAlbum, VinylSearchQuery } from './types.js';

export const normalizeBarcode = (value = '') => value.trim().replace(/[\s-]+/g, '');
export const normalizeText = (value = '') => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
export const duration = (milliseconds = 0) => `${Math.floor(milliseconds / 60000)}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, '0')}`;

export function parseSearchQuery(raw: Partial<VinylSearchQuery> & { query?: string }): VinylSearchQuery {
  const query = String(raw.query ?? '').trim();
  const barcode = normalizeBarcode(String(raw.barcode ?? (/^\s*[\d\s-]{8,20}\s*$/.test(query) ? query : '')));
  const catalogNumber = String(raw.catalogNumber ?? '').trim();
  let artist = String(raw.artist ?? '').trim();
  let album = String(raw.album ?? '').trim();
  if ((!artist || !album) && /\s[-–—]\s/.test(query)) {
    const [left, ...right] = query.split(/\s[-–—]\s/);
    artist ||= left.trim();
    album ||= right.join(' - ').trim();
  }
  if ((!artist || !album) && !barcode && !catalogNumber && /^[^\s]+\s+.+$/.test(query)) {
    const parts = query.split(/\s+/);
    if (parts.length >= 2 && parts.every(part => /[\u3400-\u9fff]/u.test(part))) {
      artist ||= parts.shift() || '';
      album ||= parts.join(' ').trim();
    }
  }
  return { query, barcode: /^\d{8,14}$/.test(barcode) ? barcode : undefined, catalogNumber: catalogNumber || undefined, artist: artist || undefined, album: album || undefined, year: raw.year ? Number(raw.year) : undefined };
}

export function trackDiscs(tracks: Array<Track & { side?: string }>): VinylRecord[] {
  if (!tracks.length) return [];
  const discs = new Map<number, Map<string, Track[]>>();
  for (const track of tracks) {
    const side = track.side || 'A';
    const discNumber = Math.max(1, Math.floor((side.charCodeAt(0) - 65) / 2) + 1);
    const sides = discs.get(discNumber) ?? new Map<string, Track[]>();
    sides.set(side, [...(sides.get(side) ?? []), track]);
    discs.set(discNumber, sides);
  }
  return [...discs].map(([disc, sides]) => ({ disc, sides: [...sides].map(([side, sideTracks]) => ({ side, tracks: sideTracks })) }));
}

export function providerAlbumToAlbum(candidate: ProviderAlbum): Album {
  const tracks = candidate.tracks ?? [];
  const totalSeconds = tracks.reduce((sum, track) => sum + track.durationSec, 0);
  const candidateYear = candidate.year && candidate.year >= 1900 && candidate.year <= 2100 ? candidate.year : undefined;
  const releaseYear = Number(candidate.releaseDate?.slice(0, 4));
  const providerName = candidate.provider === 'apple-music' ? 'Apple Music' : candidate.provider === 'chinese-music' ? 'Meting Chinese Music' : candidate.provider === 'musicbrainz' ? 'MusicBrainz' : candidate.provider === 'discogs' ? 'Discogs' : candidate.provider === 'deezer' ? 'Deezer' : 'Local library';
  return {
    id: `${candidate.provider}-${candidate.providerId}`,
    title: candidate.title || 'Unnamed album', artist: candidate.artist || 'Unknown artist', artistId: `${candidate.provider}-artist-${normalizeText(candidate.artist) || candidate.providerId}`,
    year: candidateYear || (releaseYear >= 1900 && releaseYear <= 2100 ? releaseYear : new Date().getFullYear()), genre: candidate.genres?.join(' / ') || 'Other', coverUrl: candidate.coverUrl || '', label: candidate.label || 'Unknown label', rpm: candidate.rpm || '33⅓ RPM', weight: 'Standard', edition: candidate.edition || candidate.formats?.join(' / ') || 'Physical release', matrixCode: candidate.matrixCode || '', trackCount: tracks.length, totalDuration: duration(totalSeconds * 1000), description: `Metadata supplied by ${providerName}. Verify the exact pressing before saving.`, color: '#131316', tracks, discs: candidate.discs ?? [], isCollected: true, condition: 'Near Mint (NM)', vinylType: 'black', vinylVariant: 'black', vinylTexture: 'black', vinylColor: '#171719', vinylColors: ['#171719'], addedAt: new Date().toISOString().slice(0, 10), barcode: candidate.barcode, catalogNumber: candidate.catalogNumber, country: candidate.country, collectionTags: [],
  };
}

export function queryForProvider(input: VinylSearchQuery) {
  return [input.artist, input.album, input.year ? String(input.year) : ''].filter(Boolean).join(' - ') || input.query || input.catalogNumber || '';
}
