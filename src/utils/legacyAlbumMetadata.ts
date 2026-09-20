import type { Album } from '../types';
import { ALBUMS } from '../data/mockData';
import { PRESET_IMPORT_VINYLS } from '../data/importPresets';

const samples = [...ALBUMS, ...PRESET_IMPORT_VINYLS];

/** Remove only known sample values, preserving user edits and the stored original. */
export function cleanLegacyAlbum(album: Album): Album {
  const matching = samples.filter(item => item.title === album.title && item.artist === album.artist);
  const sample = matching.find(item => item.id === album.id) ??
    matching.find(item => item.coverUrl === album.coverUrl && item.edition === album.edition) ??
    matching.find(item => item.coverUrl === album.coverUrl);
  if (!sample) return album;
  const clean = { ...album };
  if (clean.coverUrl === sample.coverUrl) clean.coverUrl = '';
  for (const key of ['edition', 'matrixCode', 'weight', 'waxColor', 'condition', 'description'] as const) {
    if (clean[key] === sample[key]) clean[key] = '';
  }
  if (clean.price === sample.price) clean.price = undefined;
  if (!clean.vinylType && !clean.vinylTexture && clean.vinylVariant === sample.vinylVariant &&
      JSON.stringify(clean.vinylColors) === JSON.stringify(sample.vinylColors)) {
    clean.vinylVariant = 'black';
    clean.vinylColors = ['#171719'];
  }
  return clean;
}
